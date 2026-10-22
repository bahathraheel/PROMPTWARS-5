import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import './styles/global.css'

// Initialize theme from persisted preference
try {
  const savedTheme = localStorage.getItem('planen-theme');
  if (savedTheme) {
    const parsed = JSON.parse(savedTheme);
    if (parsed.state?.theme) {
      document.documentElement.setAttribute('data-theme', parsed.state.theme);
    }
  }
} catch {
  // ignore
}

// ─── Error Boundary ───────────────────────────────────────────────────────────

interface EBState { error: Error | null }

class RootErrorBoundary extends React.Component<{ children: React.ReactNode }, EBState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[PLANEN AI] Uncaught error:', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#F8F5FF', fontFamily: 'system-ui, sans-serif', padding: '2rem',
        }}>
          <div style={{
            maxWidth: 520, background: '#fff', borderRadius: 20,
            padding: '2.5rem', boxShadow: '0 8px 32px rgba(118,82,214,0.12)',
            border: '1px solid #E8E0FF', textAlign: 'center',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛠️</div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1A1035', marginBottom: 8 }}>
              PLANEN AI — Setup Required
            </h1>
            <p style={{ color: '#5E5580', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              The app couldn't start. This usually means Firebase or another service
              isn't configured yet.
            </p>
            <div style={{
              background: '#F1EBFF', borderRadius: 12, padding: '1rem 1.25rem',
              textAlign: 'left', fontSize: '0.8rem', fontFamily: 'monospace',
              color: '#4B2B91', marginBottom: '1.5rem', wordBreak: 'break-word',
            }}>
              {this.state.error.message}
            </div>
            <p style={{ color: '#5E5580', fontSize: '0.85rem', marginBottom: '1rem' }}>
              <strong>Quick fix:</strong> Copy <code>client/.env.example</code> to{' '}
              <code>client/.env</code> and add your Firebase credentials.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: 'linear-gradient(135deg, #7652D6, #4B2B91)',
                color: '#fff', border: 'none', borderRadius: 10,
                padding: '0.625rem 1.5rem', fontWeight: 700, cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Render ───────────────────────────────────────────────────────────────────

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: 'var(--font-primary)',
              fontSize: 'var(--text-sm)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-md)',
            },
            success: { iconTheme: { primary: '#21845B', secondary: '#ECFDF5' } },
            error:   { iconTheme: { primary: '#C53030', secondary: '#FFF5F5' } },
          }}
        />
      </AuthProvider>
    </RootErrorBoundary>
  </React.StrictMode>,
)
