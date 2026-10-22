import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-secondary)', padding: '2rem', textAlign: 'center' }}>
      <div style={{ maxWidth: 480 }}>
        <div style={{ fontSize: '6rem', lineHeight: 1, marginBottom: '1.5rem' }}>🎪</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.75rem' }}>Page Not Found</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem', lineHeight: 1.7 }}>
          Looks like this page wandered off the event venue. Let's get you back on track.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={() => history.back()} className="btn btn-secondary"><ArrowLeft size={16} /> Go Back</button>
          <Link to="/dashboard" className="btn btn-primary"><Home size={16} /> Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
