import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Download, FileText, Printer, Users, DollarSign, Calendar, ShoppingBag } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../contexts/AuthContext';
import {
  getEvent, getBudgetCategories, getExpenses,
  getTasks, getVendors, getGuests
} from '../../services/firestoreService';
import type { Event, BudgetCategory, Task, Vendor, Guest } from '../../../shared/types/index';
import { formatDate, formatCurrency, sum, downloadFile, objectsToCSV } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function ExportPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId || !user) return;
    Promise.all([
      getEvent(eventId),
      getBudgetCategories(eventId),
      getTasks(eventId),
      getVendors(eventId),
      getGuests(eventId),
    ]).then(([ev, cats, ts, vs, gs]) => {
      setEvent(ev);
      setCategories(cats);
      setTasks(ts);
      setVendors(vs);
      setGuests(gs);
      setLoading(false);
    });
  }, [eventId, user]);

  const totalBudget = sum(categories.map(c => c.estimatedCost));
  const totalSpent = sum(categories.map(c => c.actualCost));
  const completedTasks = tasks.filter(t => t.completed).length;
  const confirmedGuests = guests.filter(g => g.rsvpStatus === 'confirmed').length;
  const bookedVendors = vendors.filter(v => v.bookingStatus === 'booked').length;

  const handlePrint = () => window.print();

  const handleExportGuestCSV = () => {
    const data = guests.map(g => ({ Name: g.name, Email: g.email || '', RSVP: g.rsvpStatus, Group: g.group, 'Plus Ones': g.plusOnes || 0 }));
    downloadFile(objectsToCSV(data), `guests_${eventId}.csv`);
    toast.success('Guest list exported!');
  };

  const handleExportBudgetCSV = () => {
    const data = categories.map(c => ({ Category: c.name, Estimated: c.estimatedCost, Actual: c.actualCost, Paid: c.amountPaid }));
    downloadFile(objectsToCSV(data), `budget_${eventId}.csv`);
    toast.success('Budget exported!');
  };

  const handleExportVendorCSV = () => {
    const data = vendors.map(v => ({ Name: v.name, Category: v.category, Contact: v.contactName || '', Email: v.email || '', Phone: v.phone || '', Quote: v.estimatedQuote, Status: v.bookingStatus }));
    downloadFile(objectsToCSV(data), `vendors_${eventId}.csv`);
    toast.success('Vendor list exported!');
  };

  if (loading || !event) {
    return <AppLayout eventId={eventId} title="Export"><div className="page-content">{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12, marginBottom: 12 }} />)}</div></AppLayout>;
  }

  return (
    <AppLayout eventId={eventId} title="Export & Summary">
      <div className="page-content">
        <div className="section-header">
          <div>
            <h1 className="section-title">Event Summary & Export</h1>
            <p className="section-subtitle">Download or print your complete event plan</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handlePrint} className="btn btn-secondary" id="print-btn"><Printer size={16} /> Print</button>
          </div>
        </div>

        {/* Export Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: '2rem' }}>
          {[
            { label: 'Export Guest List', desc: 'CSV with RSVP and dietary info', icon: <Users size={18} />, action: handleExportGuestCSV, id: 'export-guests' },
            { label: 'Export Budget',     desc: 'CSV with all budget categories', icon: <DollarSign size={18} />, action: handleExportBudgetCSV, id: 'export-budget' },
            { label: 'Export Vendors',    desc: 'CSV with contacts and quotes',   icon: <ShoppingBag size={18} />, action: handleExportVendorCSV, id: 'export-vendors' },
          ].map(action => (
            <button key={action.id} id={action.id} onClick={action.action} className="card card--interactive" style={{ cursor: 'pointer', textAlign: 'left', display: 'flex', gap: 12, alignItems: 'center', padding: '1.125rem' }}>
              <div style={{ width: 42, height: 42, background: 'var(--color-lavender)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', flexShrink: 0 }}>
                {action.icon}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-text)' }}>{action.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{action.desc}</div>
              </div>
              <Download size={16} color="var(--color-primary)" style={{ marginLeft: 'auto' }} />
            </button>
          ))}
        </div>

        {/* Printable Summary */}
        <div ref={printRef} id="printable-summary">
          {/* Event Header */}
          <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, var(--color-lavender), var(--color-bg))', borderTop: '4px solid var(--color-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: '1.25rem' }}>
              <div style={{ width: 60, height: 60, background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem' }}>
                {getEventEmoji(event.type)}
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: 4 }}>{event.name}</h2>
                <div style={{ display: 'flex', gap: 16, fontSize: '0.875rem', color: 'var(--color-text-secondary)', flexWrap: 'wrap' }}>
                  <span>📅 {formatDate(event.date, 'EEEE, MMMM d, yyyy')}</span>
                  {event.city && <span>📍 {event.city}</span>}
                  <span>👥 {event.guestCount} guests</span>
                  <span>💰 {formatCurrency(event.budget, event.currency)} budget</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
              {[
                { label: 'Tasks Done',       value: `${completedTasks}/${tasks.length}`, color: '#21845B' },
                { label: 'Confirmed Guests', value: `${confirmedGuests}/${guests.length}`, color: '#2B6CB0' },
                { label: 'Booked Vendors',   value: `${bookedVendors}/${vendors.length}`, color: '#B7791F' },
                { label: 'Budget Used',      value: formatCurrency(totalSpent, event.currency), color: totalSpent > event.budget ? '#C53030' : '#21845B' },
              ].map(s => (
                <div key={s.label} style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 10, padding: '0.75rem' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Budget Summary */}
          {categories.length > 0 && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <DollarSign size={18} color="var(--color-primary)" /> Budget Summary
              </h3>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Category</th><th>Estimated</th><th>Actual</th><th>Paid</th></tr></thead>
                  <tbody>
                    {categories.map(cat => (
                      <tr key={cat.id}>
                        <td style={{ fontWeight: 600 }}>{cat.name}</td>
                        <td>{formatCurrency(cat.estimatedCost, event.currency)}</td>
                        <td style={{ color: cat.actualCost > cat.estimatedCost ? 'var(--color-error)' : 'inherit' }}>{formatCurrency(cat.actualCost, event.currency)}</td>
                        <td>{formatCurrency(cat.amountPaid, event.currency)}</td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: 700, background: 'var(--color-bg-secondary)' }}>
                      <td>TOTAL</td>
                      <td>{formatCurrency(totalBudget, event.currency)}</td>
                      <td>{formatCurrency(totalSpent, event.currency)}</td>
                      <td>{formatCurrency(sum(categories.map(c => c.amountPaid)), event.currency)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Vendor List */}
          {vendors.length > 0 && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShoppingBag size={18} color="var(--color-primary)" /> Vendor Contacts
              </h3>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Vendor</th><th>Category</th><th>Contact</th><th>Quote</th><th>Status</th></tr></thead>
                  <tbody>
                    {vendors.map(v => (
                      <tr key={v.id}>
                        <td style={{ fontWeight: 600 }}>{v.name}</td>
                        <td><span className="tag" style={{ fontSize: '0.65rem' }}>{v.category}</span></td>
                        <td style={{ fontSize: '0.8rem' }}>{v.email || v.phone || '—'}</td>
                        <td>{formatCurrency(v.estimatedQuote, event.currency)}</td>
                        <td><span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>{v.bookingStatus.replace('_',' ')}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Checklist */}
          {tasks.length > 0 && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={18} color="var(--color-primary)" /> Preparation Checklist
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 8 }}>
                {tasks.map(t => (
                  <div key={t.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '0.5rem', borderRadius: 8, opacity: t.completed ? 0.6 : 1 }}>
                    <div style={{ width: 18, height: 18, border: `2px solid ${t.completed ? 'var(--color-primary)' : 'var(--color-border)'}`, borderRadius: 5, background: t.completed ? 'var(--color-primary)' : 'transparent', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {t.completed && <span style={{ color: '#fff', fontSize: '0.6rem' }}>✓</span>}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)', textDecoration: t.completed ? 'line-through' : 'none' }}>{t.title}</div>
                      {t.dueDate && <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{formatDate(t.dueDate, 'MMM d')}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Guest Summary */}
          {guests.length > 0 && (
            <div className="card">
              <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={18} color="var(--color-primary)" /> Guest Summary ({guests.length} invited)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
                {guests.slice(0, 20).map(g => (
                  <div key={g.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '0.5rem', borderRadius: 8, background: 'var(--color-bg-secondary)' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-lavender)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-primary)', flexShrink: 0 }}>
                      {g.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{g.name}</div>
                      <span className={`badge ${g.rsvpStatus === 'confirmed' ? 'badge-success' : g.rsvpStatus === 'declined' ? 'badge-error' : 'badge-neutral'}`} style={{ fontSize: '0.6rem' }}>{g.rsvpStatus}</span>
                    </div>
                  </div>
                ))}
                {guests.length > 20 && <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', padding: '0.5rem' }}>...and {guests.length - 20} more. Export CSV for full list.</div>}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media print {
          .no-print, nav, header, aside, .sidebar, .app-header, .section-header > div:last-child { display: none !important; }
          .main-content { margin: 0 !important; }
          .card { break-inside: avoid; box-shadow: none !important; border: 1px solid #ddd !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
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
