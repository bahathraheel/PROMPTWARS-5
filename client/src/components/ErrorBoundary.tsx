import React from 'react';

interface State { hasError: boolean; error: Error | null }

/**
 * Global Error Boundary — catches any unhandled React render errors
 * so pages show a friendly message instead of going blank.
 */
export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallbackTitle?: string },
  State
> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--color-bg, #f8f7ff)', padding: '2rem', flexDirection: 'column', gap: 16,
      }}>
        <div style={{
          background: '#fff', borderRadius: 20, padding: '2.5rem', maxWidth: 480, width: '100%',
          boxShadow: '0 8px 32px rgba(118,82,214,0.1)', border: '1px solid #ede9fe', textAlign: 'center',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>⚠️</div>
          <h2 style={{ fontWeight: 800, color: '#1a1235', marginBottom: 8 }}>
            {this.props.fallbackTitle || 'Something went wrong'}
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: 20, lineHeight: 1.6 }}>
            {this.state.error?.message || 'An unexpected error occurred. Please try refreshing the page.'}
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={this.handleReset}
              style={{
                background: 'linear-gradient(135deg, #7652D6, #4B2B91)', color: '#fff',
                border: 'none', borderRadius: 10, padding: '0.6rem 1.5rem',
                fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem',
              }}
            >
              🔄 Reload Page
            </button>
            <button
              onClick={() => window.history.back()}
              style={{
                background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 10,
                padding: '0.6rem 1.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem',
              }}
            >
              ← Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }
}
