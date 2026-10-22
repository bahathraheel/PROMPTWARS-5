import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Trash2, Search, Phone, Mail, Bot, X, Check } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../contexts/AuthContext';
import { getEvent, getVendors, addVendor, updateVendor, deleteVendor } from '../../services/firestoreService';
import { draftVendorEmail } from '../../services/aiService';
import type { Event, Vendor, VendorCategory, BookingStatus } from '../../../../shared/types/index';
import { formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';

const CATEGORIES: VendorCategory[] = ['venue', 'catering', 'decor', 'photography', 'makeup', 'entertainment', 'transportation', 'other'];

const BOOKING_COLORS: Record<BookingStatus, string> = {
  not_contacted: 'badge-neutral',
  contacted:     'badge-primary',
  negotiating:   'badge-warning',
  booked:        'badge-success',
  cancelled:     'badge-error',
};

export default function VendorsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [emailModal, setEmailModal] = useState<{ vendor: Vendor; draft?: { subject: string; body: string } } | null>(null);
  const [draftingEmail, setDraftingEmail] = useState(false);
  const [newVendor, setNewVendor] = useState<Partial<Vendor>>({ category: 'venue', bookingStatus: 'not_contacted', estimatedQuote: 0 });

  useEffect(() => {
    if (!eventId || !user) return;
    Promise.all([getEvent(eventId), getVendors(eventId)]).then(([ev, vs]) => {
      setEvent(ev);
      setVendors(vs);
      setLoading(false);
    });
  }, [eventId, user]);

  const filtered = vendors.filter(v => {
    const matchSearch = !search || v.name.toLowerCase().includes(search.toLowerCase()) || v.category.includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || v.category === catFilter;
    return matchSearch && matchCat;
  });

  const handleAdd = async () => {
    if (!newVendor.name || !eventId || !user) return;
    try {
      const id = await addVendor({
        eventId, userId: user.uid,
        name: newVendor.name || '',
        category: newVendor.category as VendorCategory || 'other',
        contactName: newVendor.contactName,
        email: newVendor.email,
        phone: newVendor.phone,
        website: newVendor.website,
        location: newVendor.location,
        estimatedQuote: newVendor.estimatedQuote || 0,
        bookingStatus: newVendor.bookingStatus as BookingStatus || 'not_contacted',
        notes: newVendor.notes,
        isAiSuggested: false,
      });
      const vendor: Vendor = {
        id, eventId, userId: user.uid,
        name: newVendor.name || '',
        category: newVendor.category as VendorCategory || 'other',
        contactName: newVendor.contactName,
        email: newVendor.email,
        phone: newVendor.phone,
        estimatedQuote: newVendor.estimatedQuote || 0,
        bookingStatus: newVendor.bookingStatus as BookingStatus || 'not_contacted',
        notes: newVendor.notes,
        isAiSuggested: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setVendors(prev => [...prev, vendor]);
      setNewVendor({ category: 'venue', bookingStatus: 'not_contacted', estimatedQuote: 0 });
      setShowAdd(false);
      toast.success('Vendor added!');
    } catch { toast.error('Failed to add vendor.'); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this vendor?')) return;
    try {
      await deleteVendor(id);
      setVendors(prev => prev.filter(v => v.id !== id));
      toast.success('Vendor removed.');
    } catch { toast.error('Failed to remove vendor.'); }
  };

  const handleStatusChange = async (vendor: Vendor, status: BookingStatus) => {
    try {
      await updateVendor(vendor.id, { bookingStatus: status });
      setVendors(prev => prev.map(v => v.id === vendor.id ? { ...v, bookingStatus: status } : v));
    } catch { toast.error('Failed to update status.'); }
  };

  const handleDraftEmail = async (vendor: Vendor) => {
    setEmailModal({ vendor });
    setDraftingEmail(true);
    try {
      const draft = await draftVendorEmail(
        vendor as unknown as Record<string, unknown>,
        event as unknown as Record<string, unknown>
      );
      setEmailModal({ vendor, draft });
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e?.message || 'Failed to draft email.');
      setEmailModal(null);
    } finally {
      setDraftingEmail(false);
    }
  };

  const getCategoryEmoji = (cat: VendorCategory): string => ({
    venue: '🏛️', catering: '🍽️', decor: '🌸', photography: '📷',
    makeup: '💄', entertainment: '🎶', transportation: '🚗', other: '📦',
  } as Record<VendorCategory, string>)[cat] ?? '📦';

  if (loading) {
    return <AppLayout eventId={eventId} title="Vendors"><div className="page-content">{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12, marginBottom: 12 }} />)}</div></AppLayout>;
  }

  return (
    <AppLayout eventId={eventId} title="Vendor Manager">
      <div className="page-content">
        <div className="section-header">
          <div>
            <h1 className="section-title">Vendor Manager</h1>
            <p className="section-subtitle">{vendors.length} vendors for {event?.name}</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn btn-primary btn-sm" id="add-vendor-btn">
            <Plus size={14} /> Add Vendor
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input className="input" placeholder="Search vendors..." style={{ paddingLeft: 40 }} value={search} onChange={e => setSearch(e.target.value)} id="vendor-search" />
          </div>
          <div className="select-wrapper" style={{ minWidth: 160 }}>
            <select className="select" value={catFilter} onChange={e => setCatFilter(e.target.value)} id="vendor-cat-filter">
              <option value="all">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Add Vendor Form */}
        {showAdd && (
          <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--color-lavender)', border: '1px solid var(--color-border)' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem' }}>Add New Vendor</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {[
                { label: 'Vendor Name *', key: 'name', type: 'text', placeholder: 'e.g. Grand Palace Hotel', id: 'new-vendor-name' },
                { label: 'Contact Name', key: 'contactName', type: 'text', placeholder: 'Contact person', id: 'new-vendor-contact' },
                { label: 'Email', key: 'email', type: 'email', placeholder: 'vendor@example.com', id: 'new-vendor-email' },
                { label: 'Phone', key: 'phone', type: 'tel', placeholder: '+1 555 0000', id: 'new-vendor-phone' },
                { label: 'Estimated Quote', key: 'estimatedQuote', type: 'number', placeholder: '0', id: 'new-vendor-quote' },
                { label: 'Location', key: 'location', type: 'text', placeholder: 'City or address', id: 'new-vendor-location' },
              ].map(f => (
                <div key={f.key} className="form-group" style={{ gap: 4 }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>{f.label}</label>
                  <input id={f.id} className="input" type={f.type} placeholder={f.placeholder}
                    value={f.key === 'estimatedQuote' ? (newVendor[f.key as keyof Vendor] as number || '') : (newVendor[f.key as keyof Vendor] as string || '')}
                    onChange={e => setNewVendor((p: Partial<Vendor>) => ({ ...p, [f.key]: f.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value }))}
                  />
                </div>
              ))}
              <div className="form-group" style={{ gap: 4 }}>
                <label className="form-label" style={{ fontSize: '0.7rem' }}>Category</label>
                <div className="select-wrapper">
                  <select className="select" value={newVendor.category} onChange={e => setNewVendor((p: Partial<Vendor>) => ({ ...p, category: e.target.value as VendorCategory }))} id="new-vendor-cat">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group" style={{ gap: 4 }}>
                <label className="form-label" style={{ fontSize: '0.7rem' }}>Notes</label>
                <input className="input" placeholder="Any notes..." value={newVendor.notes || ''} onChange={e => setNewVendor((p: Partial<Vendor>) => ({ ...p, notes: e.target.value }))} id="new-vendor-notes" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: '1rem' }}>
              <button onClick={handleAdd} className="btn btn-primary btn-sm" id="save-vendor-btn"><Check size={14} /> Save Vendor</button>
              <button onClick={() => setShowAdd(false)} className="btn btn-ghost btn-sm"><X size={14} /> Cancel</button>
            </div>
          </div>
        )}

        {/* Vendors Grid */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon" style={{ fontSize: '2rem' }}>🛍️</div>
            <h3 className="empty-state__title">No vendors yet</h3>
            <p className="empty-state__desc">Add the vendors you're working with to track quotes, contacts, and booking status.</p>
            <button onClick={() => setShowAdd(true)} className="btn btn-primary"><Plus size={16} /> Add First Vendor</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {filtered.map(vendor => (
              <div key={vendor.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ width: 40, height: 40, background: 'var(--color-lavender)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                      {getCategoryEmoji(vendor.category)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)' }}>{vendor.name}</div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                        <span className="tag" style={{ fontSize: '0.65rem' }}>{vendor.category}</span>
                        <span className={`badge ${BOOKING_COLORS[vendor.bookingStatus]}`} style={{ fontSize: '0.65rem' }}>
                          {vendor.bookingStatus.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(vendor.id)} className="btn btn-icon btn-ghost btn-sm" aria-label="Remove vendor" id={`delete-vendor-${vendor.id}`}>
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Contact info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {vendor.contactName && <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>👤 {vendor.contactName}</div>}
                  {vendor.email && (
                    <a href={`mailto:${vendor.email}`} style={{ fontSize: '0.8rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                      <Mail size={12} /> {vendor.email}
                    </a>
                  )}
                  {vendor.phone && (
                    <a href={`tel:${vendor.phone}`} style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                      <Phone size={12} /> {vendor.phone}
                    </a>
                  )}
                  {vendor.location && <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>📍 {vendor.location}</div>}
                </div>

                {/* Quote */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', background: 'var(--color-bg-secondary)', borderRadius: 8, padding: '0.5rem 0.75rem' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Estimated Quote</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{formatCurrency(vendor.estimatedQuote, event?.currency)}</span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <div className="select-wrapper" style={{ flex: 1 }}>
                    <select className="select" style={{ fontSize: '0.75rem', padding: '0.375rem 2rem 0.375rem 0.75rem' }}
                      value={vendor.bookingStatus} onChange={e => handleStatusChange(vendor, e.target.value as BookingStatus)}
                      aria-label="Update booking status" id={`vendor-status-${vendor.id}`}>
                      {Object.keys(BOOKING_COLORS).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                  <button onClick={() => handleDraftEmail(vendor)} className="btn btn-secondary btn-sm" title="Draft inquiry email" id={`draft-email-${vendor.id}`}>
                    <Bot size={14} />
                  </button>
                </div>

                {vendor.notes && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>{vendor.notes}</div>}
                {vendor.isAiSuggested && <div className="badge badge-primary" style={{ fontSize: '0.6rem', width: 'fit-content' }}>✨ AI Suggested</div>}
              </div>
            ))}
          </div>
        )}

        {/* Email Draft Modal */}
        {emailModal && (
          <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Vendor Email Draft">
            <div className="modal">
              <div className="modal-header">
                <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>
                  {draftingEmail ? 'Drafting Email...' : `Email Draft: ${emailModal.vendor.name}`}
                </h2>
                <button onClick={() => setEmailModal(null)} className="btn btn-icon btn-ghost btn-sm" aria-label="Close modal" id="close-email-modal"><X size={16} /></button>
              </div>
              <div className="modal-body">
                {draftingEmail ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    <div style={{ width: 32, height: 32, border: '3px solid var(--color-lavender)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
                    AI is drafting your vendor inquiry email...
                  </div>
                ) : emailModal.draft && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="alert alert--warning" style={{ fontSize: '0.8rem' }}>
                      ⚠️ Review and personalize before sending. This is an AI draft only.
                    </div>
                    <div className="form-group">
                      <label className="form-label">Subject</label>
                      <input className="input" value={emailModal.draft.subject} readOnly style={{ background: 'var(--color-bg-secondary)' }} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email Body</label>
                      <textarea className="textarea" value={emailModal.draft.body} readOnly style={{ minHeight: 240, background: 'var(--color-bg-secondary)' }} />
                    </div>
                    <button
                      onClick={() => { navigator.clipboard.writeText(emailModal.draft!.body); toast.success('Copied to clipboard!'); }}
                      className="btn btn-secondary btn-sm"
                      id="copy-email-btn"
                    >
                      Copy to Clipboard
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AppLayout>
  );
}
