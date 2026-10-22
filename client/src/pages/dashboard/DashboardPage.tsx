import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, Search, Calendar, DollarSign, Users, CheckSquare,
  Sparkles, ArrowRight, Clock, Bot,
  LayoutDashboard
} from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../contexts/AuthContext';
import { subscribeToUserEvents } from '../../services/firestoreService';
import type { Event } from '../../../../shared/types/index';
import {
  formatDate, formatCurrency, daysUntil,
  getStatusColor
} from '../../utils/helpers';

export default function DashboardPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToUserEvents(user.uid, (evs) => {
      setEvents(evs);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const filtered = events.filter(e => {
    const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.city?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const upcomingEvents = events.filter(e => {
    const days = daysUntil(e.date);
    return days !== null && days >= 0 && e.status !== 'cancelled';
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 3);

  const totalBudget = events.reduce((sum, e) => sum + (e.budget || 0), 0);
  const greeting = getGreeting();

  return (
    <AppLayout title="Dashboard">
      <div className="page-content">
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: 4 }}>
                {greeting}, {user?.displayName?.split(' ')[0] || 'there'} 👋
              </h1>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                {events.length === 0
                  ? 'Ready to plan your first unforgettable event?'
                  : `You have ${events.filter(e => e.status !== 'completed' && e.status !== 'cancelled').length} active event${events.length !== 1 ? 's' : ''}.`
                }
              </p>
            </div>
            <Link to="/events/create" className="btn btn-primary" id="create-event-btn">
              <Plus size={16} /> Create Event
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: '2rem' }}>
          {[
            { icon: <LayoutDashboard size={20} />, label: 'Total Events', value: events.length.toString(), color: '#7652D6', bg: '#F1EBFF' },
            { icon: <Calendar size={20} />, label: 'Upcoming', value: upcomingEvents.length.toString(), color: '#2B6CB0', bg: '#EBF8FF' },
            { icon: <DollarSign size={20} />, label: 'Total Budget', value: formatCurrency(totalBudget), color: '#21845B', bg: '#ECFDF5' },
            { icon: <CheckSquare size={20} />, label: 'Active Plans', value: events.filter(e => ['planning','confirmed','in_progress'].includes(e.status)).length.toString(), color: '#B7791F', bg: '#FFFBEB' },
          ].map(stat => (
            <div key={stat.label} className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ width: 42, height: 42, background: stat.bg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                  {stat.icon}
                </div>
              </div>
              <div className="stat-card__value">{stat.value}</div>
              <div className="stat-card__label">{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
          {/* Events List */}
          <div>
            {/* Search & Filter */}
            <div style={{ display: 'flex', gap: 12, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  className="input"
                  placeholder="Search events..."
                  style={{ paddingLeft: 40 }}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  aria-label="Search events"
                  id="event-search"
                />
              </div>
              <div className="select-wrapper" style={{ minWidth: 140 }}>
                <select className="select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} aria-label="Filter by status" id="status-filter">
                  <option value="all">All Status</option>
                  <option value="planning">Planning</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1,2,3].map(i => (
                  <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16 }} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon">
                  <Calendar size={32} />
                </div>
                <h3 className="empty-state__title">
                  {events.length === 0 ? 'No events yet' : 'No events found'}
                </h3>
                <p className="empty-state__desc">
                  {events.length === 0
                    ? 'Create your first event and let AI build a complete plan for you.'
                    : 'Try adjusting your search or filters.'
                  }
                </p>
                {events.length === 0 && (
                  <Link to="/events/create" className="btn btn-primary">
                    <Plus size={16} /> Create Your First Event
                  </Link>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {filtered.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Quick Actions */}
            <div className="card">
              <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--color-text)' }}>Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { icon: <Plus size={16} />, label: 'Create Event', href: '/events/create', id: 'qa-create' },
                  { icon: <Bot size={16} />, label: 'Open AI Planner', href: events[0] ? `/events/${events[0].id}/workspace` : '/events/create', id: 'qa-ai' },
                  { icon: <Users size={16} />, label: 'Manage Guests', href: events[0] ? `/events/${events[0].id}/guests` : '/events/create', id: 'qa-guests' },
                  { icon: <DollarSign size={16} />, label: 'View Budgets', href: events[0] ? `/events/${events[0].id}/budget` : '/events/create', id: 'qa-budget' },
                ].map(action => (
                  <Link key={action.label} to={action.href} id={action.id}
                    className="btn btn-ghost"
                    style={{ justifyContent: 'flex-start', fontSize: '0.8rem', gap: 10, color: 'var(--color-text-secondary)' }}
                  >
                    <span style={{ color: 'var(--color-primary)' }}>{action.icon}</span>
                    {action.label}
                    <ArrowRight size={14} style={{ marginLeft: 'auto' }} />
                  </Link>
                ))}
              </div>
            </div>

            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <div className="card">
                <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--color-text)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={16} color="var(--color-primary)" /> Upcoming Events
                  </span>
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {upcomingEvents.map(event => {
                    const days = daysUntil(event.date);
                    return (
                      <Link key={event.id} to={`/events/${event.id}`} style={{ textDecoration: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.625rem', borderRadius: 10, background: 'var(--color-bg-secondary)', transition: 'all 150ms' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--color-lavender)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'var(--color-bg-secondary)'}
                        >
                          <div style={{ width: 36, height: 36, background: 'var(--color-lavender)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                            {getEventEmoji(event.type)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{formatDate(event.date, 'MMM d, yyyy')}</div>
                          </div>
                          {days !== null && (
                            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: days <= 7 ? 'var(--color-error)' : days <= 30 ? 'var(--color-warning)' : 'var(--color-primary)', background: days <= 7 ? 'var(--color-error-bg)' : days <= 30 ? 'var(--color-warning-bg)' : 'var(--color-lavender)', borderRadius: 99, padding: '2px 8px', flexShrink: 0 }}>
                              {days === 0 ? 'Today!' : `${days}d`}
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AI Tip */}
            <div style={{ background: 'linear-gradient(135deg, var(--color-lavender), #fff)', border: '1px solid var(--color-border)', borderRadius: 16, padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Sparkles size={16} color="var(--color-primary)" />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)' }}>AI Tip</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                {events.length === 0
                  ? 'Start with our AI Event Wizard — answer a few questions and get a complete, personalized plan instantly!'
                  : 'Use the AI Workspace to ask follow-up questions, regenerate budget breakdowns, or get new vendor recommendations.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .page-content > div:last-child { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </AppLayout>
  );
}

// ─── Event Card ───────────────────────────────────────────────────────────────
function EventCard({ event }: { event: Event }) {
  const navigate = useNavigate();
  const days = daysUntil(event.date);

  return (
    <div
      className="card card--interactive"
      style={{ cursor: 'pointer', padding: '1.25rem 1.5rem' }}
      onClick={() => navigate(`/events/${event.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/events/${event.id}`)}
      aria-label={`Open ${event.name}`}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ width: 52, height: 52, background: 'var(--color-lavender)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
          {getEventEmoji(event.type)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {event.name}
            </h3>
            <span className={`badge ${getStatusColor(event.status)}`} style={{ flexShrink: 0 }}>
              {event.status.replace('_', ' ')}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', color: 'var(--color-text-secondary)', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={13} /> {formatDate(event.date, 'MMM d, yyyy')}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Users size={13} /> {event.guestCount} guests
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <DollarSign size={13} /> {formatCurrency(event.budget, event.currency)}
            </span>
            {event.city && (
              <span>{event.city}</span>
            )}
          </div>

          {days !== null && days >= 0 && (
            <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 600, color: days <= 7 ? 'var(--color-error)' : days <= 30 ? 'var(--color-warning)' : 'var(--color-primary)' }}>
              <Clock size={12} />
              {days === 0 ? 'Today!' : days === 1 ? 'Tomorrow' : `${days} days away`}
            </div>
          )}
        </div>

        <ArrowRight size={18} color="var(--color-text-muted)" style={{ flexShrink: 0, marginTop: 4 }} />
      </div>
    </div>
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

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
