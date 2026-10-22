import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Sparkles, RefreshCw, Bot, User as UserIcon, AlertCircle, CheckCircle } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../contexts/AuthContext';
import { getEvent, getAIConversation, saveAIConversation } from '../../services/firestoreService';
import { checkAIStatus, generateEventPlan, sendChatMessage } from '../../services/aiService';
import type { Event, AIEventPlan } from '../../../shared/types/index';
import { formatCurrency, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

/**
 * Detect if a string is raw JSON and convert it to readable prose.
 * Otherwise render simple markdown: **bold**, bullets, line breaks.
 */
function renderMessageContent(content: string): React.ReactNode {
  const trimmed = content.trim();

  // ── Strip and summarize JSON responses ──
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      // If it has a summary field, show that
      if (parsed.summary) {
        return renderMarkdown(parsed.summary + (parsed.assumptions?.length
          ? '\n\n**Key assumptions:**\n' + parsed.assumptions.slice(0, 3).map((a: string) => `• ${a}`).join('\n')
          : ''));
      }
      // Otherwise show a generic message
      return renderMarkdown('✅ The AI generated your event plan! Switch to the **Plan** tab on the right to view the full breakdown.');
    } catch {
      // not valid JSON, fall through to markdown render
    }
  }

  return renderMarkdown(trimmed);
}

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  return (
    <span style={{ display: 'block' }}>
      {lines.map((line, i) => {
        // Render **bold** text inline
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        const rendered = parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} style={{ fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
          }
          return part;
        });
        return (
          <span key={i} style={{ display: 'block', marginBottom: i < lines.length - 1 ? (line === '' ? '0.5rem' : '0.15rem') : 0 }}>
            {rendered.length ? rendered : <>&nbsp;</>}
          </span>
        );
      })}
    </span>
  );
}

export default function AIWorkspacePage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const [event, setEvent]                     = useState<Event | null>(null);
  const [plan, setPlan]                       = useState<AIEventPlan | null>(null);
  const [messages, setMessages]               = useState<ChatMessage[]>([]);
  const [input, setInput]                     = useState('');
  const [generatingPlan, setGeneratingPlan]   = useState(false);
  const [sending, setSending]                 = useState(false);
  const [aiConfigured, setAiConfigured]       = useState<boolean | null>(null);
  const [aiMessage, setAiMessage]             = useState('');
  const [activeTab, setActiveTab]             = useState<'chat' | 'plan' | 'budget' | 'timeline' | 'vendors'>('chat');
  const [loadingChat, setLoadingChat]         = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);
  // Track save debounce
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Load event + AI status + persisted chat ────────────────────────────────
  useEffect(() => {
    if (!eventId || !user) return;
    setLoadingChat(true);

    Promise.all([
      getEvent(eventId),
      checkAIStatus().catch(() => ({ configured: false, message: 'AI unavailable', model: null })),
      getAIConversation(eventId, user.uid).catch(() => null),
    ]).then(([ev, status, convo]) => {
      setEvent(ev);
      setAiConfigured(status.configured);
      setAiMessage(status.message);

      // Restore persisted chat messages
      if (convo && Array.isArray(convo.messages) && convo.messages.length > 0) {
        setMessages(convo.messages.map((m: { role: string; content: string; timestamp?: string }, idx: number) => ({
          id: String(idx),
          role: m.role as 'user' | 'model',
          content: m.content,
          timestamp: m.timestamp || new Date().toISOString(),
        })));
      }
    }).finally(() => setLoadingChat(false));
  }, [eventId, user]);

  // ─── Auto-scroll chat ────────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Persist chat to Firestore (debounced) ──────────────────────────────────
  const persistChat = useCallback((msgs: ChatMessage[]) => {
    if (!eventId || !user || msgs.length === 0) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveAIConversation(
        eventId,
        user.uid,
        msgs.map(m => ({ role: m.role, content: m.content, timestamp: m.timestamp }))
      ).catch(() => {}); // silently fail — chat still works locally
    }, 1500); // save 1.5s after last message
  }, [eventId, user]);

  // ─── Generate Plan ───────────────────────────────────────────────────────────
  const handleGeneratePlan = async () => {
    if (!event) return;
    setGeneratingPlan(true);

    // Show "thinking" message immediately for better UX
    const thinkingMsg: ChatMessage = {
      id: 'thinking',
      role: 'model',
      content: '⏳ Generating your complete event plan... This takes 15–30 seconds.',
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, thinkingMsg]);

    try {
      const generatedPlan = await generateEventPlan(event as unknown as Record<string, unknown>);
      setPlan(generatedPlan);

      const planMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        content: `✅ I've generated a complete event plan for **${event.name}**! 🎉\n\n${generatedPlan.summary}\n\n**Top action items:**\n${generatedPlan.actionItems?.slice(0, 3).map((a: { title: string }) => `• ${a.title}`).join('\n') || ''}\n\nFeel free to ask me anything about the plan or switch to the Plan/Budget/Timeline tabs!`,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => {
        const updated = [...prev.filter(m => m.id !== 'thinking'), planMsg];
        persistChat(updated);
        return updated;
      });
      setActiveTab('plan');
      toast.success('Event plan generated!');
    } catch (err: unknown) {
      setMessages(prev => prev.filter(m => m.id !== 'thinking'));
      const e = err as { message?: string };
      toast.error(e?.message || 'Failed to generate plan. Please try again.');
    } finally {
      setGeneratingPlan(false);
    }
  };

  // ─── Send Chat Message ───────────────────────────────────────────────────────
  const handleSendMessage = async () => {
    if (!input.trim() || sending) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const history = messages.map(m => ({ role: m.role as 'user' | 'model', content: m.content }));
      const resp = await sendChatMessage(input.trim(), history, event as unknown as Record<string, unknown>);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: resp.response,
        timestamp: resp.timestamp,
      };
      setMessages(prev => {
        const updated = [...prev, aiMsg];
        persistChat(updated);
        return updated;
      });
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e?.message || 'Message failed. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <AppLayout eventId={eventId} title="AI Workspace">
      <div style={{ display: 'flex', height: 'calc(100vh - var(--header-height))' }}>

        {/* ── Chat Panel ────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--color-bg-secondary)', borderRight: '1px solid var(--color-border)' }}>

          {/* Chat Header */}
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)' }}>PLANEN AI Assistant</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem' }}>
                <span className={`status-dot ${aiConfigured ? 'status-dot--success status-dot--pulse' : 'status-dot--error'}`} />
                <span style={{ color: 'var(--color-text-muted)' }}>
                  {aiConfigured === null ? 'Checking...' : aiConfigured ? 'AI Ready' : 'AI Not Configured'}
                </span>
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
              {messages.length > 0 && (
                <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', background: 'var(--color-bg-secondary)', padding: '2px 8px', borderRadius: 99 }}>
                  💾 Auto-saved
                </span>
              )}
              {aiConfigured && (
                <button
                  onClick={handleGeneratePlan}
                  disabled={generatingPlan || !event}
                  className="btn btn-primary btn-sm"
                  id="generate-plan-btn"
                >
                  {generatingPlan
                    ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Generating...</>
                    : <><Sparkles size={14} /> {plan ? 'Regenerate' : 'Generate Plan'}</>
                  }
                </button>
              )}
            </div>
          </div>

          {/* AI Not Configured Banner */}
          {aiConfigured === false && (
            <div className="alert alert--warning" style={{ margin: '1rem', borderRadius: 12 }}>
              <AlertCircle size={16} />
              <div>
                <strong>AI Not Configured</strong><br />
                <span style={{ fontSize: '0.8rem' }}>{aiMessage}</span>
              </div>
            </div>
          )}

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Empty state */}
            {!loadingChat && messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--color-text-muted)' }}>
                <div style={{ width: 64, height: 64, background: 'var(--color-lavender)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <Bot size={28} color="var(--color-primary)" />
                </div>
                <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--color-text)', fontSize: '1rem' }}>
                  {event ? `Hello! I'm your AI planner for ${event.name}` : 'AI Event Planner'}
                </div>
                <div style={{ fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                  {aiConfigured
                    ? 'Click "Generate Plan" for a complete event plan, or ask me anything.'
                    : 'Configure your Gemini API key to start AI-powered planning.'}
                </div>
                {aiConfigured && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                    {[
                      'Generate a complete event plan',
                      'What vendors do I need?',
                      'How should I allocate my budget?',
                      'Suggest a theme for my event',
                    ].map(prompt => (
                      <button key={prompt} onClick={() => handleQuickPrompt(prompt)} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
                        {prompt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Message bubbles */}
            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: msg.role === 'user' ? 'var(--gradient-royal)' : 'linear-gradient(135deg, #800020, #FF8C00)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(255,140,0,0.3)' }}>
                  {msg.role === 'user' ? <UserIcon size={14} color="#fff" /> : <Sparkles size={14} color="#fff" />}
                </div>
                <div className={`chat-bubble ${msg.role === 'user' ? 'chat-bubble--user' : 'chat-bubble--ai'}`}>
                  {renderMessageContent(msg.content)}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {sending && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #800020, #FF8C00)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(255,140,0,0.3)' }}>
                  <Sparkles size={14} color="#fff" />
                </div>
                <div className="chat-bubble chat-bubble--ai">
                  <div className="chat-typing"><span /><span /><span /></div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg)', display: 'flex', gap: 10 }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about vendors, budget, themes, timeline..."
              className="input textarea"
              style={{ resize: 'none', minHeight: 'auto', height: 44, lineHeight: 1.5, paddingTop: 10 }}
              disabled={sending || !aiConfigured}
              id="chat-input"
              aria-label="Chat message input"
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || sending || !aiConfigured}
              className="btn btn-primary btn-icon"
              style={{ width: 44, height: 44, flexShrink: 0 }}
              aria-label="Send message"
              id="chat-send-btn"
            >
              <Send size={18} />
            </button>
          </div>
        </div>

        {/* ── Right Panel ───────────────────────────────────────────────────── */}
        <div style={{ width: 400, display: 'flex', flexDirection: 'column', background: 'var(--color-bg)', overflow: 'hidden' }}>
          {/* Tabs */}
          <div className="tabs" style={{ padding: '0 1rem', flexShrink: 0 }}>
            {(['chat', 'plan', 'budget', 'timeline', 'vendors'] as const).map(tab => (
              <button key={tab} className={`tab ${activeTab === tab ? 'tab--active' : ''}`} onClick={() => setActiveTab(tab)} id={`workspace-tab-${tab}`}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>

            {/* Event Summary */}
            {activeTab === 'chat' && event && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h3 style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)' }}>Event Summary</h3>
                <div className="card" style={{ padding: '1rem' }}>
                  {[
                    { label: 'Name',   value: event.name },
                    { label: 'Type',   value: event.type.replace('_', ' ') },
                    { label: 'Date',   value: formatDate(event.date) },
                    { label: 'Guests', value: event.guestCount.toString() },
                    { label: 'Budget', value: formatCurrency(event.budget, event.currency) },
                    { label: 'City',   value: event.city || '—' },
                    { label: 'Style',  value: event.planningStyle?.replace('_', ' ') || '—' },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', gap: 12, marginBottom: 8, fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--color-text-secondary)', width: 60, flexShrink: 0, fontWeight: 600 }}>{item.label}</span>
                      <span style={{ color: 'var(--color-text)' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Plan Overview */}
            {activeTab === 'plan' && (
              <div>
                {!plan ? (
                  <div className="empty-state" style={{ padding: '3rem 1rem' }}>
                    <div className="empty-state__icon"><Sparkles size={24} /></div>
                    <p className="empty-state__desc">Click "Generate Plan" to create your personalized AI event plan.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="alert alert--success">
                      <CheckCircle size={16} />
                      <div><strong>Plan Generated</strong><br /><span style={{ fontSize: '0.8rem' }}>{plan.generatedAt ? new Date(plan.generatedAt).toLocaleString() : ''}</span></div>
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 8 }}>Summary</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>{plan.summary}</p>
                    </div>
                    {plan.actionItems?.length > 0 && (
                      <div>
                        <h4 style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 8 }}>Top Action Items</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {plan.actionItems.slice(0, 8).map((item: { priority: string; title: string }, i: number) => (
                            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '0.625rem', background: 'var(--color-bg-secondary)', borderRadius: 8 }}>
                              <span className={`badge ${item.priority === 'urgent' || item.priority === 'high' ? 'badge-error' : item.priority === 'medium' ? 'badge-warning' : 'badge-neutral'}`} style={{ flexShrink: 0, fontSize: '0.6rem' }}>{item.priority}</span>
                              <span style={{ fontSize: '0.8rem', color: 'var(--color-text)' }}>{item.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {plan.assumptions?.length > 0 && (
                      <div>
                        <h4 style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 8 }}>AI Assumptions</h4>
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {plan.assumptions.map((a: string, i: number) => (
                            <li key={i} style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', background: 'var(--color-bg-secondary)', borderRadius: 8, padding: '0.5rem 0.75rem' }}>{a}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Budget Breakdown */}
            {activeTab === 'budget' && (
              <div>
                {!plan?.budgetBreakdown ? (
                  <div className="empty-state" style={{ padding: '3rem 1rem' }}>
                    <div className="empty-state__icon"><DollarIcon /></div>
                    <p className="empty-state__desc">Generate a plan to see AI budget recommendations.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="alert alert--info" style={{ fontSize: '0.75rem', padding: '0.75rem' }}>
                      Advisory estimates only. Verify all costs with actual vendors.
                    </div>
                    {plan.budgetBreakdown.map((cat: { category: string; estimatedCost: number; percentage: number; notes: string }, i: number) => (
                      <div key={i} style={{ background: 'var(--color-bg-secondary)', borderRadius: 10, padding: '0.875rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{cat.category}</span>
                          <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--color-primary)' }}>
                            {event ? formatCurrency(cat.estimatedCost, event.currency) : `$${cat.estimatedCost}`}
                          </span>
                        </div>
                        <div className="progress" style={{ height: 6, marginBottom: 4 }}>
                          <div className="progress-bar" style={{ width: `${Math.min(cat.percentage, 100)}%` }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                          <span>{cat.notes}</span>
                          <span>{cat.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Timeline */}
            {activeTab === 'timeline' && (
              <div>
                {!plan?.timeline ? (
                  <div className="empty-state" style={{ padding: '3rem 1rem' }}>
                    <div className="empty-state__icon"><CalendarIcon /></div>
                    <p className="empty-state__desc">Generate a plan to see your event timeline.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {plan.timeline.map((item: { priority: string; milestone: string; date: string; description: string }, i: number) => (
                      <div key={i} style={{ display: 'flex', gap: 12 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: item.priority === 'high' ? 'var(--color-error-bg)' : 'var(--color-lavender)', border: `2px solid ${item.priority === 'high' ? 'var(--color-error)' : 'var(--color-primary)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: item.priority === 'high' ? 'var(--color-error)' : 'var(--color-primary)' }}>
                            {i + 1}
                          </div>
                          {i < plan.timeline.length - 1 && <div style={{ width: 2, flex: 1, background: 'var(--color-border)', minHeight: 16 }} />}
                        </div>
                        <div style={{ flex: 1, paddingBottom: 12 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--color-text)', marginBottom: 2 }}>{item.milestone}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>{formatDate(item.date, 'MMM d, yyyy')}</div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Vendors */}
            {activeTab === 'vendors' && (
              <div>
                {!plan?.vendorChecklist ? (
                  <div className="empty-state" style={{ padding: '3rem 1rem' }}>
                    <div className="empty-state__icon"><ShopIcon /></div>
                    <p className="empty-state__desc">Generate a plan to see vendor recommendations.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {plan.vendorChecklist.map((vendor: { isRequired: boolean; name: string; notes: string }, i: number) => (
                      <div key={i} style={{ display: 'flex', gap: 10, padding: '0.75rem', background: 'var(--color-bg-secondary)', borderRadius: 10 }}>
                        <span className={`badge ${vendor.isRequired ? 'badge-error' : 'badge-neutral'}`} style={{ flexShrink: 0, fontSize: '0.6rem', height: 'fit-content' }}>
                          {vendor.isRequired ? 'Required' : 'Optional'}
                        </span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--color-text)', marginBottom: 2 }}>{vendor.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{vendor.notes}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AppLayout>
  );
}

function DollarIcon()   { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>; }
function CalendarIcon() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }
function ShopIcon()     { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>; }
