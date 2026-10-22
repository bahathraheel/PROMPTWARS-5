import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft, ChevronRight, Sparkles, Check } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../contexts/AuthContext';
import { createEvent } from '../../services/firestoreService';
import toast from 'react-hot-toast';

// ─── Validation Schema ────────────────────────────────────────────────────────
const schema = z.object({
  name:          z.string().min(2, 'Event name must be at least 2 characters').max(200),
  type:          z.enum(['wedding','engagement','birthday','anniversary','college_festival','corporate','community','baby_shower','graduation','private_party','other']),
  date:          z.string().min(1, 'Event date is required'),
  endDate:       z.string().optional(),
  city:          z.string().optional(),
  venuePreference: z.string().optional(),
  isOutdoor:     z.boolean().optional(),
  guestCount:    z.number('Enter a valid number').int().min(1, 'At least 1 guest').max(100000),
  budget:        z.number('Enter a valid budget').min(0, 'Budget cannot be negative'),
  currency:      z.string(),
  theme:         z.string().optional(),
  atmosphere:    z.string().optional(),
  dietaryPreferences: z.array(z.string()).optional(),
  accessibilityNeeds: z.string().optional(),
  culturalRequirements: z.string().optional(),
  planningStyle: z.enum(['budget_friendly', 'balanced', 'premium']),
  status:        z.enum(['planning','confirmed','in_progress','completed','cancelled']),
});

type FormData = z.infer<typeof schema>;

const STEPS = [
  { id: 1, title: 'Event Basics',   desc: 'Type, name and date' },
  { id: 2, title: 'Venue & Guests', desc: 'Location and headcount' },
  { id: 3, title: 'Budget',         desc: 'Total budget and style' },
  { id: 4, title: 'Theme & Preferences', desc: 'Atmosphere and details' },
  { id: 5, title: 'Review',         desc: 'Confirm and create' },
];

const EVENT_TYPES = [
  { value: 'wedding', label: 'Wedding', emoji: '💍' },
  { value: 'engagement', label: 'Engagement', emoji: '💍' },
  { value: 'birthday', label: 'Birthday', emoji: '🎂' },
  { value: 'anniversary', label: 'Anniversary', emoji: '🥂' },
  { value: 'college_festival', label: 'College Festival', emoji: '🎪' },
  { value: 'corporate', label: 'Corporate Event', emoji: '🏢' },
  { value: 'community', label: 'Community Event', emoji: '🤝' },
  { value: 'baby_shower', label: 'Baby Shower', emoji: '🍼' },
  { value: 'graduation', label: 'Graduation', emoji: '🎓' },
  { value: 'private_party', label: 'Private Party', emoji: '🎉' },
  { value: 'other', label: 'Other', emoji: '✨' },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'SGD', 'AED'];

const DIETARY_OPTIONS = ['Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-Free', 'Nut-Free', 'Diabetic-Friendly', 'No Restrictions'];

export default function CreateEventPage() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    register, handleSubmit, control, watch, trigger,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      planningStyle: 'balanced',
      status: 'planning',
      currency: 'USD',
      dietaryPreferences: [],
    },
  });

  const watchedType = watch('type');
  const watchedValues = watch();

  const validateStep = async (s: number): Promise<boolean> => {
    const fieldsPerStep: Record<number, (keyof FormData)[]> = {
      1: ['name', 'type', 'date'],
      2: ['guestCount'],
      3: ['budget', 'planningStyle'],
      4: [],
      5: [],
    };
    return trigger(fieldsPerStep[s] || []);
  };

  const handleNext = async () => {
    const valid = await validateStep(step);
    if (valid) setStep(s => Math.min(s + 1, 5));
  };

  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    setSubmitting(true);
    try {
      const eventId = await createEvent(user.uid, {
        ...data,
        city: data.city || '',
        location: data.city || '',
        colors: [],
      });
      toast.success('Event created! Let\'s build your AI plan 🎉');
      navigate(`/events/${eventId}/workspace`);
    } catch (err: unknown) {
      console.error('[CreateEvent] Firestore error:', err);
      const msg = (err as {message?: string})?.message || 'Unknown error';
      const code = (err as {code?: string})?.code || '';
      toast.error(`Failed to create event: ${code || msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout title="Create New Event">
      <div className="page-content" style={{ maxWidth: 760 }}>
        {/* Progress */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: '0.75rem' }}>
            {STEPS.map(s => (
              <div key={s.id} style={{ flex: 1, height: 4, borderRadius: 99, background: s.id <= step ? 'var(--color-primary)' : 'var(--color-border)', transition: 'background 300ms' }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Step {step} of {STEPS.length}</p>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary)' }}>{STEPS[step - 1].title}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: 4 }}>
              {STEPS[step - 1].title}
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1.75rem' }}>
              {STEPS[step - 1].desc}
            </p>

            {/* ── Step 1: Event Basics ────────────────────────────── */}
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">Event Name <span className="required">*</span></label>
                  <input className={`input ${errors.name ? 'input--error' : ''}`} placeholder="e.g. Sarah & James Wedding Celebration" {...register('name')} id="event-name" />
                  {errors.name && <p className="form-error">{errors.name.message}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">Event Type <span className="required">*</span></label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
                    {EVENT_TYPES.map(et => (
                      <label key={et.value} style={{ cursor: 'pointer' }}>
                        <input type="radio" value={et.value} style={{ display: 'none' }} {...register('type')} />
                        <div style={{
                          border: `2px solid ${watchedType === et.value ? 'var(--color-primary)' : 'var(--color-border)'}`,
                          background: watchedType === et.value ? 'var(--color-lavender)' : 'var(--color-bg)',
                          borderRadius: 12, padding: '0.75rem', textAlign: 'center',
                          transition: 'all 150ms', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                        }}>
                          <span style={{ fontSize: '1.5rem' }}>{et.emoji}</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: watchedType === et.value ? 'var(--color-primary-dark)' : 'var(--color-text)' }}>{et.label}</span>
                          {watchedType === et.value && <Check size={12} color="var(--color-primary)" />}
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.type && <p className="form-error">{errors.type.message}</p>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Event Date <span className="required">*</span></label>
                    <input type="date" className={`input ${errors.date ? 'input--error' : ''}`} {...register('date')} id="event-date"
                      min={new Date().toISOString().split('T')[0]}
                    />
                    {errors.date && <p className="form-error">{errors.date.message}</p>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(optional)</span></label>
                    <input type="date" className="input" {...register('endDate')} id="event-end-date" />
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 2: Venue & Guests ───────────────────────────── */}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">City / Location</label>
                    <input className="input" placeholder="e.g. New York, NY" {...register('city')} id="event-city" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Guest Count <span className="required">*</span></label>
                    <input type="number" className={`input ${errors.guestCount ? 'input--error' : ''}`} placeholder="e.g. 150" min={1}
                      {...register('guestCount', { valueAsNumber: true })} id="event-guest-count" />
                    {errors.guestCount && <p className="form-error">{errors.guestCount.message}</p>}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Venue Preference</label>
                  <input className="input" placeholder="e.g. Hotel ballroom, garden estate, rooftop..." {...register('venuePreference')} id="venue-preference" />
                </div>

                <div className="form-group">
                  <label className="form-label">Setting Preference</label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <Controller control={control} name="isOutdoor" render={({ field }) => (
                      <>
                        {[
                          { value: false, label: '🏛️ Indoor' },
                          { value: true,  label: '🌿 Outdoor' },
                          { value: undefined, label: '🔀 Both / Flexible' },
                        ].map(opt => (
                          <label key={String(opt.label)} style={{ cursor: 'pointer', flex: 1 }}>
                            <div style={{
                              border: `2px solid ${field.value === opt.value ? 'var(--color-primary)' : 'var(--color-border)'}`,
                              background: field.value === opt.value ? 'var(--color-lavender)' : 'var(--color-bg)',
                              borderRadius: 10, padding: '0.75rem', textAlign: 'center', transition: 'all 150ms',
                              fontSize: '0.8rem', fontWeight: 500,
                              cursor: 'pointer',
                            }} onClick={() => field.onChange(opt.value)}>
                              {opt.label}
                            </div>
                          </label>
                        ))}
                      </>
                    )} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Accessibility Needs</label>
                  <textarea className="textarea" placeholder="Any accessibility requirements for guests or venue? (e.g. wheelchair access, hearing loops)" {...register('accessibilityNeeds')} style={{ minHeight: 80 }} />
                </div>
              </div>
            )}

            {/* ── Step 3: Budget ───────────────────────────────────── */}
            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Currency</label>
                    <div className="select-wrapper">
                      <select className="select" {...register('currency')} id="budget-currency">
                        {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Total Budget <span className="required">*</span></label>
                    <input type="number" className={`input ${errors.budget ? 'input--error' : ''}`} placeholder="e.g. 25000" min={0}
                      {...register('budget', { valueAsNumber: true })} id="total-budget" />
                    {errors.budget && <p className="form-error">{errors.budget.message}</p>}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Planning Style <span className="required">*</span></label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    {[
                      { value: 'budget_friendly', label: 'Budget Friendly', emoji: '💰', desc: 'Smart choices, maximum value' },
                      { value: 'balanced',         label: 'Balanced',        emoji: '⚖️',  desc: 'Best of both worlds' },
                      { value: 'premium',          label: 'Premium',         emoji: '✨',  desc: 'Luxury experience, no compromises' },
                    ].map(style => {
                      const selected = watchedValues.planningStyle === style.value;
                      return (
                        <label key={style.value} style={{ cursor: 'pointer' }}>
                          <input type="radio" value={style.value} style={{ display: 'none' }} {...register('planningStyle')} />
                          <div style={{
                            border: `2px solid ${selected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                            background: selected ? 'var(--color-lavender)' : 'var(--color-bg)',
                            borderRadius: 12, padding: '1rem', textAlign: 'center', transition: 'all 150ms',
                          }}>
                            <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{style.emoji}</div>
                            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: selected ? 'var(--color-primary-dark)' : 'var(--color-text)', marginBottom: 4 }}>{style.label}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>{style.desc}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  {errors.planningStyle && <p className="form-error">{errors.planningStyle.message}</p>}
                </div>
              </div>
            )}

            {/* ── Step 4: Theme & Preferences ──────────────────────── */}
            {step === 4 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">Theme / Style</label>
                  <input className="input" placeholder="e.g. Rustic Garden, Black-Tie Glamour, Bohemian..." {...register('theme')} id="event-theme" />
                </div>

                <div className="form-group">
                  <label className="form-label">Desired Atmosphere</label>
                  <textarea className="textarea" placeholder="Describe the feeling you want guests to experience..." {...register('atmosphere')} style={{ minHeight: 80 }} id="event-atmosphere" />
                </div>

                <div className="form-group">
                  <label className="form-label">Dietary Preferences</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <Controller control={control} name="dietaryPreferences" render={({ field }) => (
                      <>
                        {DIETARY_OPTIONS.map(opt => {
                          const checked = field.value?.includes(opt);
                          return (
                            <button key={opt} type="button" onClick={() => {
                              const cur = field.value || [];
                              field.onChange(checked ? cur.filter(v => v !== opt) : [...cur, opt]);
                            }} style={{
                              padding: '0.375rem 0.875rem',
                              borderRadius: 99, fontSize: '0.8rem', fontWeight: 500,
                              border: `1.5px solid ${checked ? 'var(--color-primary)' : 'var(--color-border)'}`,
                              background: checked ? 'var(--color-lavender)' : 'var(--color-bg)',
                              color: checked ? 'var(--color-primary-dark)' : 'var(--color-text-secondary)',
                              cursor: 'pointer', transition: 'all 150ms',
                            }}>
                              {checked && <Check size={12} style={{ marginRight: 4, display: 'inline' }} />}
                              {opt}
                            </button>
                          );
                        })}
                      </>
                    )} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Cultural Requirements / Traditions</label>
                  <textarea className="textarea" placeholder="Any specific cultural, religious, or traditional requirements?" {...register('culturalRequirements')} style={{ minHeight: 80 }} id="cultural-requirements" />
                </div>
              </div>
            )}

            {/* ── Step 5: Review ───────────────────────────────────── */}
            {step === 5 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="alert alert--info" style={{ marginBottom: '0.5rem' }}>
                  <Sparkles size={16} />
                  <div>
                    <strong>Almost there!</strong> After creating your event, PLANEN AI will generate a complete personalized plan using Gemini AI.
                  </div>
                </div>

                <div style={{ background: 'var(--color-bg-secondary)', borderRadius: 12, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[
                    { label: 'Event Name',     value: watchedValues.name },
                    { label: 'Event Type',     value: EVENT_TYPES.find(t => t.value === watchedValues.type)?.label || watchedValues.type },
                    { label: 'Date',           value: watchedValues.date },
                    { label: 'City',           value: watchedValues.city || 'Not specified' },
                    { label: 'Guest Count',    value: watchedValues.guestCount?.toString() },
                    { label: 'Budget',         value: `${watchedValues.currency} ${watchedValues.budget?.toLocaleString()}` },
                    { label: 'Planning Style', value: watchedValues.planningStyle?.replace('_', ' ') },
                    { label: 'Theme',          value: watchedValues.theme || 'Not specified' },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', gap: 16, fontSize: '0.875rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)', width: 130, flexShrink: 0 }}>{row.label}</span>
                      <span style={{ color: 'var(--color-text)' }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <button type="button" onClick={handleBack} disabled={step === 1} className="btn btn-ghost" style={{ gap: 8 }} id="wizard-back-btn">
              <ChevronLeft size={16} /> Back
            </button>

            {step < 5 ? (
              <button type="button" onClick={handleNext} className="btn btn-primary" style={{ gap: 8 }} id="wizard-next-btn">
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button type="submit" disabled={submitting} className="btn btn-primary btn-lg" style={{ gap: 8 }} id="create-event-submit">
                {submitting ? (
                  <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Creating...</>
                ) : (
                  <><Sparkles size={16} /> Create Event & Plan with AI</>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AppLayout>
  );
}
