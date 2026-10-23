import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Calendar, DollarSign, Users, MapPin, Trash2, Edit2,
  Bot, CheckSquare, ShoppingBag, Palette, FileText,
  Clock, ArrowRight, Sparkles, X, Check
} from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../contexts/AuthContext';
import { getEvent, updateEvent, deleteEvent } from '../../services/firestoreService';
import type { Event, PlanningStyle } from '../../../../shared/types/index';
import { formatDate, formatCurrency, daysUntil, getEventTypeLabel, getStatusColor } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Event>>({});

  useEffect(() => {
    if (!eventId) return;
    getEvent(eventId)
      .then(e => {
        setEvent(e);
        if (e) {
          setEditForm({
            name: e.name,
            date: e.date,
            city: e.city,
            guestCount: e.guestCount,
            budget: e.budget,
            theme: e.theme,
            atmosphere: e.atmosphere,
            planningStyle: e.planningStyle,
          });
        }
      })
      .catch((err) => {
        console.error('Failed to load event:', err);
        toast.error('Failed to load event');
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleDelete = async () => {
    if (!event || !window.confirm(`Delete "${event.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteEvent(event.id);
      toast.success('Event deleted');
      navigate('/dashboard');
    } catch {
      toast.error('Failed to delete event');
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!event || !editForm.name?.trim()) {
      toast.error('Event name is required');
      return;
    }
    try {
      const updatedFields: Partial<Event> = {
        name: editForm.name.trim(),
        date: editForm.date || event.date,
        city: editForm.city?.trim() || '',
        guestCount: Number(editForm.guestCount) || event.guestCount,
        budget: Number(editForm.budget) || event.budget,
        theme: editForm.theme?.trim() || '',
        atmosphere: editForm.atmosphere?.trim() || '',
        planningStyle: editForm.planningStyle as PlanningStyle,
      };

      await updateEvent(event.id, updatedFields);
      setEvent(prev => prev ? { ...prev, ...updatedFields } : null);
      setEditing(false);
      toast.success('Event details updated!');
    } catch (err) {
      console.error('Failed to update event:', err);
      toast.error('Failed to update event');
    }
  };

  if (loading || authLoading) {
    return (
      <AppLayout title="Event Details">
        <div className="page-content">
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16, marginBottom: 16 }} />)}
        </div>
      </AppLayout>
    );
  }

  if (!event || (user && event.userId !== user.uid)) {
    return (
      <AppLayout title="Event Not Found">
        <div className="page-content">
          <div className="empty-state">
            <div className="empty-state__icon"><Calendar size={32} /></div>
            <h2 className="empty-state__title">Event not found</h2>
            <p className="empty-state__desc">This event doesn't exist or you don't have access to it.</p>
            <Link to="/dashboard" className="btn btn-primary">Back to Dashboard</Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const days = daysUntil(event.date);

  const NAV_CARDS = [
    { icon: <Bot size={20} />,        label: 'AI Workspace',  desc: 'Chat and refine your plan', href: `/events/${eventId}/workspace`,  color: '#7652D6', bg: '#F1EBFF' },
    { icon: <DollarSign size={20} />, label: 'Budget',        desc: 'Track expenses and costs',  href: `/events/${eventId}/budget`,     color: '#21845B', bg: '#ECFDF5' },
    { icon: <Calendar size={20} />,   label: 'Timeline',      desc: 'Milestones and countdown',  href: `/events/${eventId}/timeline`,   color: '#2B6CB0', bg: '#EBF8FF' },
    { icon: <ShoppingBag size={20} />,label: 'Vendors',       desc: 'Manage your vendors',       href: `/events/${eventId}/vendors`,    color: '#B7791F', bg: '#FFFBEB' },
    { icon: <Users size={20} />,      label: 'Guests',        desc: 'Invites and RSVPs',         href: `/events/${eventId}/guests`,     color: '#C53030', bg: '#FFF5F5' },
    { icon: <CheckSquare size={20} />,label: 'Checklist',     desc: 'Tasks and to-dos',          href: `/events/${eventId}/checklist`,  color: '#7652D6', bg: '#F1EBFF' },
    { icon: <Palette size={20} />,    label: 'Theme Studio',  desc: 'Themes and inspiration',    href: `/events/${eventId}/theme`,      color: '#4B2B91', bg: '#F1EBFF' },
    { icon: <FileText size={20} />,   label: 'Export',        desc: 'Download your plan',        href: `/events/${eventId}/export`,     color: '#21845B', bg: '#ECFDF5' },
  ];

  return (
    <AppLayout eventId={eventId} title={event.name}>
      <div className="page-content">
        {/* Event Header */}
        <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, var(--color-lavender), var(--color-bg))' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 64, height: 64, background: 'var(--color-primary)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                {getEventEmoji(event.type)}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)' }}>{event.name}</h1>
                  <span className={`badge ${getStatusColor(event.status)}`}>{event.status.replace('_', ' ')}</span>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: '0.875rem', color: 'var(--color-text-secondary)', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={14} />{formatDate(event.date, 'MMMM d, yyyy')}</span>
                  {event.city && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} />{event.city}</span>}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={14} />{event.guestCount} guests</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><DollarSign size={14} />{formatCurrency(event.budget, event.currency)}</span>
                </div>
                {days !== null && days >= 0 && (
                  <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, background: days <= 7 ? 'var(--color-error-bg)' : 'var(--color-lavender)', color: days <= 7 ? 'var(--color-error)' : 'var(--color-primary)', borderRadius: 99, padding: '0.25rem 0.75rem', fontSize: '0.8rem', fontWeight: 600 }}>
                    <Clock size={13} />
                    {days === 0 ? 'Event is today!' : `${days} days until the event`}
                  </div>
                )}
                {days !== null && days < 0 && (
                  <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--color-bg-secondary)', color: 'var(--color-text-muted)', borderRadius: 99, padding: '0.25rem 0.75rem', fontSize: '0.8rem', fontWeight: 600 }}>
                    <Clock size={13} /> Event completed {Math.abs(days)} days ago
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setEditing(true)} className="btn btn-secondary btn-sm" id="edit-event-btn">
                <Edit2 size={14} /> Edit Event
              </button>
              <button onClick={handleDelete} disabled={deleting} className="btn btn-danger btn-sm" aria-label="Delete event" id="delete-event-btn">
                <Trash2 size={14} /> {deleting ? 'Deleting...' : 'Delete'}
              </button>
              <Link to={`/events/${eventId}/workspace`} className="btn btn-primary btn-sm" id="open-workspace-btn">
                <Sparkles size={14} /> Open AI Planner
              </Link>
            </div>
          </div>
        </div>

        {/* Edit Event Modal */}
        {editing && (
          <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Edit Event Details">
            <div className="modal" style={{ maxWidth: 560 }}>
              <div className="modal-header">
                <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>Edit Event Details</h2>
                <button onClick={() => setEditing(false)} className="btn btn-icon btn-ghost btn-sm" aria-label="Close modal">
                  <X size={16} />
                </button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Event Name *</label>
                  <input
                    className="input"
                    value={editForm.name || ''}
                    onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                    id="edit-event-name"
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input
                      type="date"
                      className="input"
                      value={editForm.date || ''}
                      onChange={e => setEditForm(p => ({ ...p, date: e.target.value }))}
                      id="edit-event-date"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">City / Location</label>
                    <input
                      className="input"
                      value={editForm.city || ''}
                      onChange={e => setEditForm(p => ({ ...p, city: e.target.value }))}
                      id="edit-event-city"
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Guest Count</label>
                    <input
                      type="number"
                      min="1"
                      className="input"
                      value={editForm.guestCount || ''}
                      onChange={e => setEditForm(p => ({ ...p, guestCount: parseInt(e.target.value) || 0 }))}
                      id="edit-event-guests"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Total Budget ({event.currency})</label>
                    <input
                      type="number"
                      min="0"
                      className="input"
                      value={editForm.budget || ''}
                      onChange={e => setEditForm(p => ({ ...p, budget: parseFloat(e.target.value) || 0 }))}
                      id="edit-event-budget"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Planning Style</label>
                  <div className="select-wrapper">
                    <select
                      className="select"
                      value={editForm.planningStyle}
                      onChange={e => setEditForm(p => ({ ...p, planningStyle: e.target.value as PlanningStyle }))}
                      id="edit-event-style"
                    >
                      <option value="budget_friendly">Budget Friendly</option>
                      <option value="balanced">Balanced</option>
                      <option value="premium">Premium</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Theme</label>
                  <input
                    className="input"
                    value={editForm.theme || ''}
                    onChange={e => setEditForm(p => ({ ...p, theme: e.target.value }))}
                    id="edit-event-theme"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Atmosphere</label>
                  <textarea
                    className="textarea"
                    value={editForm.atmosphere || ''}
                    onChange={e => setEditForm(p => ({ ...p, atmosphere: e.target.value }))}
                    id="edit-event-atmosphere"
                  />
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
                  <button onClick={() => setEditing(false)} className="btn btn-ghost btn-sm">Cancel</button>
                  <button onClick={handleSaveEdit} className="btn btn-primary btn-sm" id="save-event-edit-btn">
                    <Check size={14} /> Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {NAV_CARDS.map(card => (
            <Link key={card.label} to={card.href} style={{ textDecoration: 'none' }}>
              <div className="card card--interactive" style={{ display: 'flex', flexDirection: 'column', gap: 12, cursor: 'pointer' }}>
                <div style={{ width: 44, height: 44, background: card.bg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>
                  {card.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)', marginBottom: 2 }}>{card.label}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{card.desc}</div>
                </div>
                <ArrowRight size={16} color="var(--color-text-muted)" style={{ marginTop: 'auto' }} />
              </div>
            </Link>
          ))}
        </div>

        {/* Event Details */}
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)', marginBottom: '1rem' }}>Event Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {[
              { label: 'Event Type', value: getEventTypeLabel(event.type) },
              { label: 'Planning Style', value: event.planningStyle?.replace('_', ' ') || '—' },
              { label: 'Theme', value: event.theme || 'Not specified' },
              { label: 'Atmosphere', value: event.atmosphere || 'Not specified' },
              { label: 'Cultural Requirements', value: event.culturalRequirements || 'None' },
              { label: 'Accessibility Needs', value: event.accessibilityNeeds || 'None' },
            ].map(detail => (
              <div key={detail.label}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{detail.label}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>{detail.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function getEventEmoji(type: string): string {
  const emojis: Record<string, string> = {
    wedding: '💍', engagement: '💍', birthday: '🎂', anniversary: '🥂',
    college_festival: '🎪', corporate: '🏢', community: '🤝',
    baby_shower: '🍼', graduation: '🎓', private_party: '🎉', other: '✨',
  };
  return emojis[type] || '✨';
}
