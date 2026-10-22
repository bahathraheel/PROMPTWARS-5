import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, DollarSign, Users, CheckSquare,
  ShoppingBag, Palette, FileText, Bot, Menu, X, Sun, Moon,
  ChevronRight, LogOut,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeStore, useUIStore } from '../../store';
import { signOutUser } from '../../services/authService';
import { getInitials } from '../../utils/helpers';
import toast from 'react-hot-toast';

interface SidebarNavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
}

interface AppLayoutProps {
  children: React.ReactNode;
  eventId?: string;
  title?: string;
}

const getNavItems = (eventId?: string): SidebarNavItem[] => {
  if (!eventId) {
    return [
      { label: 'Dashboard', icon: <LayoutDashboard size={18} />, href: '/dashboard' },
    ];
  }
  return [
    { label: 'Overview',    icon: <LayoutDashboard size={18} />, href: `/events/${eventId}` },
    { label: 'AI Workspace',icon: <Bot size={18} />,             href: `/events/${eventId}/workspace` },
    { label: 'Budget',      icon: <DollarSign size={18} />,      href: `/events/${eventId}/budget` },
    { label: 'Timeline',    icon: <Calendar size={18} />,        href: `/events/${eventId}/timeline` },
    { label: 'Vendors',     icon: <ShoppingBag size={18} />,     href: `/events/${eventId}/vendors` },
    { label: 'Guests',      icon: <Users size={18} />,           href: `/events/${eventId}/guests` },
    { label: 'Checklist',   icon: <CheckSquare size={18} />,     href: `/events/${eventId}/checklist` },
    { label: 'Theme Studio',icon: <Palette size={18} />,         href: `/events/${eventId}/theme` },
    { label: 'Export',      icon: <FileText size={18} />,        href: `/events/${eventId}/export` },
  ];
};

export default function AppLayout({ children, eventId, title }: AppLayoutProps) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useThemeStore();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();
  const navigate = useNavigate();
  const currentPath = window.location.pathname;

  const navItems = getNavItems(eventId);

  async function handleSignOut() {
    try {
      await signOutUser();
      navigate('/');
      toast.success('Signed out successfully');
    } catch {
      toast.error('Failed to sign out');
    }
  }

  return (
    <div className="app-layout">
      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 199, backdropFilter: 'blur(2px)' }}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`} aria-label="Navigation sidebar">
        {/* Logo */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
          <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10 }} onClick={() => setSidebarOpen(false)}>
            <div style={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, #FFD700, #FF8C00)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 12px rgba(255,215,0,0.5)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#1A0A0A" opacity="0.9"/>
                <path d="M2 17L12 22L22 17" stroke="#1A0A0A" strokeWidth="2" strokeLinecap="round"/>
                <path d="M2 12L12 17L22 12" stroke="#1A0A0A" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#FFD700', lineHeight: 1, letterSpacing: '0.02em' }}>PLANEN AI</div>
              <div style={{ fontSize: '0.6rem', color: 'rgba(255,215,0,0.55)', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Celestial Events</div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto' }} aria-label="Main navigation">
          {/* Back to dashboard if in event */}
          {eventId && (
            <Link
              to="/dashboard"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '0.5rem 0.75rem',
                fontSize: '0.75rem', fontWeight: 600,
                color: 'rgba(255,215,0,0.5)',
                borderRadius: 8, marginBottom: 8,
                transition: 'all 150ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,215,0,0.9)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,215,0,0.5)')}
              onClick={() => setSidebarOpen(false)}
            >
              <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} />
              All Events
            </Link>
          )}

          {navItems.map((item) => {
            const isActive = currentPath === item.href || (item.href !== '/dashboard' && currentPath.startsWith(item.href + '/'));
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '0.625rem 0.75rem',
                  borderRadius: 10,
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#FFD700' : 'rgba(255,255,255,0.55)',
                  background: isActive ? 'rgba(255,215,0,0.12)' : 'transparent',
                  border: isActive ? '1px solid rgba(255,215,0,0.2)' : '1px solid transparent',
                  transition: 'all 150ms',
                  marginBottom: 2,
                  textDecoration: 'none',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = 'rgba(255,215,0,0.85)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.background = 'transparent'; } }}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.icon}
                {item.label}
                {item.badge && <span className="badge badge-gold" style={{ marginLeft: 'auto', fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>{item.badge}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,215,0,0.15)' }}>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="btn btn-ghost btn-sm"
            style={{ width: '100%', justifyContent: 'flex-start', gap: 10, marginBottom: 4, color: 'rgba(255,255,255,0.5)' }}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>

          {/* User */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem 0.75rem', borderRadius: 10, background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.12)' }}>
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="avatar avatar--sm" style={{ borderRadius: '50%', border: '2px solid rgba(255,215,0,0.4)' }} />
            ) : (
              <div className="avatar avatar--sm" style={{ background: 'linear-gradient(135deg, #FFD700, #FF8C00)', color: '#1A0A0A' }}>{getInitials(user?.displayName || user?.email)}</div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#FFD700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.displayName || 'User'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,215,0,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="btn btn-icon btn-ghost btn-sm"
              title="Sign out"
              aria-label="Sign out"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="app-header no-print">
          <button
            className="btn btn-icon btn-ghost"
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
            style={{ display: 'none' }} // shown via CSS at breakpoint
            id="sidebar-toggle"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {title && (
            <h1 style={{ fontSize: '1rem', fontWeight: 700, background: 'var(--gradient-royal)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', flex: 1 }}>
              {title}
            </h1>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={toggleTheme}
              className="btn btn-icon btn-ghost btn-sm"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="avatar avatar--sm" style={{ borderRadius: '50%' }} />
            ) : (
              <div className="avatar avatar--sm">{getInitials(user?.displayName || user?.email)}</div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1 }}>
          {children}
        </main>
      </div>

      {/* CSS to show sidebar toggle on mobile */}
      <style>{`
        @media (max-width: 1024px) {
          #sidebar-toggle { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
