import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Trash2, Search, Download, X, Check, Users } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../contexts/AuthContext';
import { getEvent, getGuests, addGuest, updateGuest, deleteGuest } from '../../services/firestoreService';
import type { Event, Guest, RSVPStatus, GuestGroup } from '../../../../shared/types/index';
import { downloadFile, objectsToCSV } from '../../utils/helpers';
import toast from 'react-hot-toast';

const GROUPS: GuestGroup[] = ['family', 'friends', 'colleagues', 'other'];

export default function GuestsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [rsvpFilter, setRsvpFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [newGuest, setNewGuest] = useState<Partial<Guest>>({ rsvpStatus: 'pending', group: 'friends', plusOnes: 0 });

  useEffect(() => {
    if (!eventId || !user) return;
    Promise.all([getEvent(eventId), getGuests(eventId)]).then(([ev, gs]) => {
      setEvent(ev);
      setGuests(gs);
      setLoading(false);
    });
  }, [eventId, user]);

  const filtered = guests.filter(g => {
    const matchSearch = !search || g.name.toLowerCase().includes(search.toLowerCase()) || g.email?.toLowerCase().includes(search.toLowerCase());
    const matchRSVP = rsvpFilter === 'all' || g.rsvpStatus === rsvpFilter;
    const matchGroup = groupFilter === 'all' || g.group === groupFilter;
    return matchSearch && matchRSVP && matchGroup;
  });

  const totalAttending = guests.filter(g => g.rsvpStatus === 'confirmed').reduce((sum, g) => sum + 1 + (g.plusOnes || 0), 0);
  const confirmedCount = guests.filter(g => g.rsvpStatus === 'confirmed').length;
  const pendingCount = guests.filter(g => g.rsvpStatus === 'pending').length;
  const declinedCount = guests.filter(g => g.rsvpStatus === 'declined').length;

  const handleAdd = async () => {
    if (!newGuest.name || !eventId || !user) return;
    try {
      const id = await addGuest({
        eventId, userId: user.uid,
        name: newGuest.name || '',
        email: newGuest.email,
        phone: newGuest.phone,
        rsvpStatus: newGuest.rsvpStatus as RSVPStatus || 'pending',
        plusOnes: newGuest.plusOnes || 0,
        dietaryNotes: newGuest.dietaryNotes,
        accessibilityNotes: newGuest.accessibilityNotes,
        group: newGuest.group as GuestGroup || 'other',
        notes: newGuest.notes,
      });
      const guest: Guest = {
        id, eventId, userId: user.uid,
        name: newGuest.name || '',
        email: newGuest.email,
        phone: newGuest.phone,
        rsvpStatus: newGuest.rsvpStatus as RSVPStatus || 'pending',
        plusOnes: newGuest.plusOnes || 0,
        dietaryNotes: newGuest.dietaryNotes,
        group: newGuest.group as GuestGroup || 'other',
        notes: newGuest.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setGuests(prev => [...prev, guest]);
      setNewGuest({ rsvpStatus: 'pending', group: 'friends', plusOnes: 0 });
      setShowAdd(false);
      toast.success('Guest added!');
    } catch { toast.error('Failed to add guest.'); }
  };

  const handleRSVPChange = async (guest: Guest, status: RSVPStatus) => {
    try {
      await updateGuest(guest.id, { rsvpStatus: status });
      setGuests(prev => prev.map(g => g.id === guest.id ? { ...g, rsvpStatus: status } : g));
    } catch { toast.error('Failed to update RSVP.'); }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteGuest(id);
      setGuests(prev => prev.filter(g => g.id !== id));
      toast.success('Guest removed.');
    } catch { toast.error('Failed to remove guest.'); }
  };

  const handleExportCSV = () => {
    const data = guests.map(g => ({
      Name: g.name, Email: g.email || '', Phone: g.phone || '',
      'RSVP Status': g.rsvpStatus, Group: g.group,
      'Plus Ones': g.plusOnes || 0,
      'Dietary Notes': g.dietaryNotes || '', Notes: g.notes || '',
    }));
    downloadFile(objectsToCSV(data), `guests_${eventId}.csv`);
    toast.success('Guest list exported!');
  };

  if (loading) {
    return <AppLayout eventId={eventId} title="Guests"><div className="page-content">{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 12, marginBottom: 10 }} />)}</div></AppLayout>;
  }

  return (
    <AppLayout eventId={eventId} title="Guest Manager">
      <div className="page-content">
        <div className="section-header">
          <div>
            <h1 className="section-title">Guest Manager</h1>
            <p className="section-subtitle">{guests.length} guests for {event?.name}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleExportCSV} className="btn btn-secondary btn-sm" id="export-guests-btn"><Download size={14} /> Export</button>
            <button onClick={() => setShowAdd(true)} className="btn btn-primary btn-sm" id="add-guest-btn"><Plus size={14} /> Add Guest</button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Invited', value: guests.length, color: '#7652D6' },
            { label: 'Confirmed',     value: confirmedCount, color: '#21845B' },
            { label: 'Pending',       value: pendingCount,   color: '#B7791F' },
            { label: 'Declined',      value: declinedCount,  color: '#C53030' },
            { label: 'Attending',     value: totalAttending, color: '#2B6CB0' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-card__value" style={{ color: s.color, fontSize: '1.75rem' }}>{s.value}</div>
              <div className="stat-card__label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input className="input" placeholder="Search guests..." style={{ paddingLeft: 40 }} value={search} onChange={e => setSearch(e.target.value)} id="guest-search" />
          </div>
          <div className="select-wrapper" style={{ minWidth: 140 }}>
            <select className="select" value={rsvpFilter} onChange={e => setRsvpFilter(e.target.value)} id="rsvp-filter">
              <option value="all">All RSVP</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="declined">Declined</option>
              <option value="maybe">Maybe</option>
            </select>
          </div>
          <div className="select-wrapper" style={{ minWidth: 140 }}>
            <select className="select" value={groupFilter} onChange={e => setGroupFilter(e.target.value)} id="group-filter">
              <option value="all">All Groups</option>
              {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>

        {/* Add Guest Form */}
        {showAdd && (
          <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--color-lavender)', border: '1px solid var(--color-border)' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem' }}>Add New Guest</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {[
                { label: 'Full Name *', key: 'name', type: 'text', placeholder: 'Guest name', id: 'new-guest-name' },
                { label: 'Email', key: 'email', type: 'email', placeholder: 'guest@example.com', id: 'new-guest-email' },
                { label: 'Phone', key: 'phone', type: 'tel', placeholder: '+1 555 0000', id: 'new-guest-phone' },
                { label: 'Dietary Notes', key: 'dietaryNotes', type: 'text', placeholder: 'e.g. Vegetarian', id: 'new-guest-diet' },
              ].map(f => (
                <div key={f.key} className="form-group" style={{ gap: 4 }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>{f.label}</label>
                  <input id={f.id} className="input" type={f.type} placeholder={f.placeholder}
                    value={newGuest[f.key as keyof Guest] as string || ''}
                    onChange={e => setNewGuest((p: Partial<Guest>) => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div className="form-group" style={{ gap: 4 }}>
                <label className="form-label" style={{ fontSize: '0.7rem' }}>Group</label>
                <div className="select-wrapper">
                  <select className="select" value={newGuest.group} onChange={e => setNewGuest((p: Partial<Guest>) => ({ ...p, group: e.target.value as GuestGroup }))} id="new-guest-group">
                    {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group" style={{ gap: 4 }}>
                <label className="form-label" style={{ fontSize: '0.7rem' }}>Plus Ones</label>
                <input className="input" type="number" min="0" max="10" value={newGuest.plusOnes || 0} onChange={e => setNewGuest((p: Partial<Guest>) => ({ ...p, plusOnes: parseInt(e.target.value) || 0 }))} id="new-guest-plus" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: '1rem' }}>
              <button onClick={handleAdd} className="btn btn-primary btn-sm" id="save-guest-btn"><Check size={14} /> Add Guest</button>
              <button onClick={() => setShowAdd(false)} className="btn btn-ghost btn-sm"><X size={14} /> Cancel</button>
            </div>
          </div>
        )}

        {/* Guest Table */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon"><Users size={28} /></div>
            <h3 className="empty-state__title">No guests yet</h3>
            <p className="empty-state__desc">Add your guests to track RSVPs, dietary needs, and attendance.</p>
            <button onClick={() => setShowAdd(true)} className="btn btn-primary"><Plus size={16} /> Add First Guest</button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Group</th>
                  <th>Contact</th>
                  <th>Plus Ones</th>
                  <th>Dietary</th>
                  <th>RSVP</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(guest => (
                  <tr key={guest.id}>
                    <td style={{ fontWeight: 600 }}>{guest.name}</td>
                    <td><span className="tag" style={{ fontSize: '0.65rem' }}>{guest.group}</span></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                      {guest.email && <div>{guest.email}</div>}
                      {guest.phone && <div>{guest.phone}</div>}
                    </td>
                    <td style={{ textAlign: 'center' }}>{guest.plusOnes || 0}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{guest.dietaryNotes || '—'}</td>
                    <td>
                      <div className="select-wrapper" style={{ minWidth: 120 }}>
                        <select
                          className="select"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 2rem 0.25rem 0.5rem' }}
                          value={guest.rsvpStatus}
                          onChange={e => handleRSVPChange(guest, e.target.value as RSVPStatus)}
                          aria-label={`RSVP status for ${guest.name}`}
                          id={`rsvp-${guest.id}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="declined">Declined</option>
                          <option value="maybe">Maybe</option>
                        </select>
                      </div>
                    </td>
                    <td>
                      <button onClick={() => handleDelete(guest.id)} className="btn btn-icon btn-ghost btn-sm" aria-label={`Remove ${guest.name}`} id={`delete-guest-${guest.id}`}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
