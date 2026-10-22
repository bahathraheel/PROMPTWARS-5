import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { RefreshCw, Heart, Palette, Sparkles, AlertCircle } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../contexts/AuthContext';
import { getEvent } from '../../services/firestoreService';
import { suggestThemes } from '../../services/aiService';
import type { Event } from '../../../../shared/types/index';
import type { ThemeSuggestions } from '../../services/aiService';
import toast from 'react-hot-toast';

export default function ThemeStudioPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [themes, setThemes] = useState<ThemeSuggestions['themes']>([]);
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [selectedTheme, setSelectedTheme] = useState<number | null>(null);

  useEffect(() => {
    if (!eventId || !user) return;
    getEvent(eventId).then(setEvent);
  }, [eventId, user]);

  const handleGenerate = async () => {
    if (!event) return;
    setLoading(true);
    try {
      const result = await suggestThemes(event as unknown as Record<string, unknown>);
      setThemes(result.themes || []);
      setSelectedTheme(null);
      toast.success('5 new themes generated!');
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e?.message || 'Failed to generate themes.');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (i: number) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  return (
    <AppLayout eventId={eventId} title="Theme Studio">
      <div className="page-content">
        <div className="section-header">
          <div>
            <h1 className="section-title">Theme Studio</h1>
            <p className="section-subtitle">AI-generated theme and inspiration concepts</p>
          </div>
          <button onClick={handleGenerate} disabled={loading} className="btn btn-primary" id="generate-themes-btn">
            {loading ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Generating...</> : <><Sparkles size={16} /> Generate Themes</>}
          </button>
        </div>

        <div className="alert alert--info" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={16} />
          <div style={{ fontSize: '0.85rem' }}>
            These are <strong>AI-generated inspiration concepts</strong>, not guaranteed real-world offerings. Use them as creative starting points for your planning conversations with vendors.
          </div>
        </div>

        {themes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon"><Palette size={28} /></div>
            <h3 className="empty-state__title">No themes yet</h3>
            <p className="empty-state__desc">Click "Generate Themes" to get 5 personalized event theme concepts based on your event details.</p>
            <button onClick={handleGenerate} disabled={loading || !event} className="btn btn-primary" id="empty-generate-btn">
              <Sparkles size={16} /> Generate AI Themes
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {themes.map((theme, i) => (
              <div
                key={i}
                className="card card--interactive"
                style={{ cursor: 'pointer', border: selectedTheme === i ? `2px solid var(--color-primary)` : '1px solid var(--color-border)', position: 'relative' }}
                onClick={() => setSelectedTheme(selectedTheme === i ? null : i)}
                role="button"
                tabIndex={0}
                aria-label={`Theme: ${theme.title}`}
                id={`theme-card-${i}`}
              >
                {/* Color Palette Preview */}
                <div style={{ display: 'flex', gap: 6, marginBottom: '1rem' }}>
                  {theme.colors?.map((color, ci) => (
                    <div key={ci} style={{ width: 32, height: 32, borderRadius: 8, background: color, border: '2px solid rgba(0,0,0,0.08)', flexShrink: 0 }} title={color} />
                  ))}
                  {theme.colors && (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 6 }}>
                      {theme.colors.slice(0, 3).map((c, ci) => (
                        <span key={ci} style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{c}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <h3 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text)' }}>{theme.title}</h3>
                  <button
                    onClick={e => { e.stopPropagation(); toggleFavorite(i); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                    aria-label={favorites.has(i) ? 'Remove from favorites' : 'Add to favorites'}
                    id={`theme-fav-${i}`}
                  >
                    <Heart size={18} fill={favorites.has(i) ? '#C53030' : 'none'} color={favorites.has(i) ? '#C53030' : 'var(--color-text-muted)'} />
                  </button>
                </div>

                <span className="badge badge-primary" style={{ marginBottom: 10, fontSize: '0.65rem' }}>{theme.mood}</span>

                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.65, marginBottom: '0.75rem' }}>
                  {theme.description}
                </p>

                {selectedTheme === i && (
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    {[
                      { label: '🌸 Decor Ideas', items: theme.decorIdeas },
                      { label: '💐 Flowers', items: theme.flowerSuggestions },
                    ].filter(s => s.items?.length).map(section => (
                      <div key={section.label}>
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--color-text)', marginBottom: 6 }}>{section.label}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {section.items?.map((item, ii) => (
                            <span key={ii} className="tag">{item}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                    {theme.dressCode && (
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--color-text)', marginBottom: 4 }}>👗 Dress Code</div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{theme.dressCode}</p>
                      </div>
                    )}
                    {theme.venueStyleConcept && (
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--color-text)', marginBottom: 4 }}>🏛️ Venue Styling</div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{theme.venueStyleConcept}</p>
                      </div>
                    )}
                    {theme.menuConcept && (
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--color-text)', marginBottom: 4 }}>🍽️ Menu Concept</div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{theme.menuConcept}</p>
                      </div>
                    )}
                    {theme.entertainmentIdea && (
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--color-text)', marginBottom: 4 }}>🎶 Entertainment</div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{theme.entertainmentIdea}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {themes.length > 0 && (
          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
            <button onClick={handleGenerate} disabled={loading} className="btn btn-secondary" id="regenerate-themes-btn">
              <RefreshCw size={16} /> Generate New Themes
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AppLayout>
  );
}
