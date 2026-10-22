import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, Calendar, DollarSign, Users, CheckSquare,
  ShoppingBag, Palette, ChevronRight, Star, ArrowRight,
  Menu, X, Bot, Zap, Shield, Globe, Play
} from 'lucide-react';

const NAV_LINKS = [
  { label: 'Features',    href: '#features' },
  { label: 'How It Works',href: '#how-it-works' },
  { label: 'Templates',   href: '#templates' },
  { label: 'Pricing',     href: '#pricing' },
];

const FEATURES = [
  {
    icon: <Bot size={24} />,
    title: 'AI-Powered Planning',
    desc: 'Describe your dream event and get a complete, personalized plan in seconds — budget, timeline, vendors, and more.',
    color: '#7652D6',
    bg: '#F1EBFF',
  },
  {
    icon: <DollarSign size={24} />,
    title: 'Smart Budget Manager',
    desc: 'Track every expense with real-time budget breakdowns, category charts, and over-budget alerts.',
    color: '#21845B',
    bg: '#ECFDF5',
  },
  {
    icon: <Calendar size={24} />,
    title: 'Timeline & Milestones',
    desc: 'Never miss a deadline with a visual countdown calendar, task assignments, and Google Calendar sync.',
    color: '#2B6CB0',
    bg: '#EBF8FF',
  },
  {
    icon: <ShoppingBag size={24} />,
    title: 'Vendor Management',
    desc: 'Organize all your vendors, compare quotes, track bookings, and draft inquiry emails with AI.',
    color: '#B7791F',
    bg: '#FFFBEB',
  },
  {
    icon: <Users size={24} />,
    title: 'Guest Management',
    desc: 'Manage RSVPs, dietary needs, group assignments, and send invitation drafts — all in one place.',
    color: '#C53030',
    bg: '#FFF5F5',
  },
  {
    icon: <Palette size={24} />,
    title: 'Theme Studio',
    desc: 'Generate gorgeous event themes, color palettes, decor concepts, and mood boards with AI inspiration.',
    color: '#7652D6',
    bg: '#F1EBFF',
  },
];

const EVENT_TYPES = [
  { emoji: '💍', label: 'Weddings', color: '#F1EBFF', border: '#D9CEFF' },
  { emoji: '🎂', label: 'Birthdays', color: '#FFF5F5', border: '#FEB2B2' },
  { emoji: '🎓', label: 'Graduations', color: '#ECFDF5', border: '#9AE6B4' },
  { emoji: '🏢', label: 'Corporate', color: '#EBF8FF', border: '#BEE3F8' },
  { emoji: '🎪', label: 'Festivals', color: '#FFFBEB', border: '#FAF089' },
  { emoji: '🍼', label: 'Baby Showers', color: '#FFF5F5', border: '#FEB2B2' },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Tell Us Your Vision',
    desc: 'Answer a few questions about your event type, date, budget, and preferences.',
  },
  {
    step: '02',
    title: 'AI Builds Your Plan',
    desc: 'Gemini AI generates a complete, personalized event plan with budget breakdown and timeline.',
  },
  {
    step: '03',
    title: 'Refine & Collaborate',
    desc: 'Chat with the AI to adjust any detail, invite collaborators, and track everything in real time.',
  },
  {
    step: '04',
    title: 'Celebrate Perfectly',
    desc: 'Export your complete plan, vendor list, and guest summary — ready for your perfect event.',
  },
];

// Sample testimonials — clearly labeled as sample content
const TESTIMONIALS = [
  {
    name: 'Priya Sharma',
    role: 'Wedding Planner',
    text: 'PLANEN AI saved me 20+ hours of planning for my cousin\'s wedding. The AI thought of details I\'d never considered!',
    avatar: 'PS',
    rating: 5,
  },
  {
    name: 'James Okonkwo',
    role: 'Corporate Events Manager',
    text: 'The vendor management and budget tracking features are exactly what I needed for our annual conference.',
    avatar: 'JO',
    rating: 5,
  },
  {
    name: 'Mei Lin',
    role: 'Party Enthusiast',
    text: 'I planned my daughter\'s graduation party in under an hour. The theme suggestions were absolutely stunning!',
    avatar: 'ML',
    rating: 5,
  },
];

const PRICING = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: ['1 event', 'AI planning (limited)', 'Budget tracker', 'Guest list (up to 50)', 'Basic checklist'],
    cta: 'Get Started Free',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$12',
    period: '/month',
    features: ['Unlimited events', 'Full AI planning', 'Advanced budget manager', 'Unlimited guests', 'Team collaboration', 'PDF & CSV exports', 'Google Calendar sync', 'Vendor email AI'],
    cta: 'Start Pro Trial',
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    name: 'Business',
    price: '$29',
    period: '/month',
    features: ['Everything in Pro', 'Multi-team management', 'Priority AI responses', 'White-label export', 'API access', 'Dedicated support'],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

const FAQS = [
  {
    q: 'Is the AI planning really free to use?',
    a: 'Yes! The free plan includes AI event planning for one event. Upgrade to Pro for unlimited events and advanced AI features.',
  },
  {
    q: 'Does PLANEN AI book vendors or services for me?',
    a: 'No — PLANEN AI generates suggestions and drafts, but all bookings are made by you directly with vendors. We clearly label all AI-generated content as advisory.',
  },
  {
    q: 'How accurate are the budget estimates?',
    a: 'AI provides category-level estimates based on your inputs. All final costs must be verified with actual vendors. Application code handles all arithmetic — never AI.',
  },
  {
    q: 'Can I collaborate with others on my event?',
    a: 'Yes! With Pro, you can invite collaborators via a secure invitation workflow. All access is controlled per-event.',
  },
  {
    q: 'Is my guest and event data private?',
    a: 'Absolutely. Your data is secured by Firebase with row-level security rules. Only you and your authorized collaborators can access your event data.',
  },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  return (
    <div style={{ fontFamily: 'var(--font-primary)', overflowX: 'hidden' }}>
      {/* ─── Navigation ─────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--color-border)',
        padding: '0 1.5rem',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', height: 64, gap: 32 }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #7652D6, #4B2B91)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" opacity="0.9"/>
                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#211A32', letterSpacing: '-0.02em' }}>PLANEN AI</span>
          </Link>

          {/* Desktop Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }} className="desktop-nav">
            {NAV_LINKS.map(link => (
              <a key={link.label} href={link.href} style={{
                padding: '0.5rem 0.875rem',
                fontSize: '0.875rem', fontWeight: 500,
                color: '#756D83', borderRadius: 8,
                textDecoration: 'none', transition: 'all 150ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#FAF8FF'; e.currentTarget.style.color = '#211A32'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#756D83'; }}
              >{link.label}</a>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link to="/signin" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#7652D6', textDecoration: 'none' }} className="hide-mobile">
              Sign In
            </Link>
            <Link to="/signup" className="btn btn-primary" style={{ fontSize: '0.875rem' }}>
              Get Started Free
            </Link>
            <button onClick={() => setMenuOpen(!menuOpen)} className="btn btn-icon btn-ghost show-mobile" aria-label="Toggle menu">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div style={{ background: '#fff', borderTop: '1px solid var(--color-border)', padding: '1rem 1.5rem' }}>
            {NAV_LINKS.map(link => (
              <a key={link.label} href={link.href}
                style={{ display: 'block', padding: '0.75rem 0', fontSize: '0.875rem', fontWeight: 500, color: '#756D83', textDecoration: 'none' }}
                onClick={() => setMenuOpen(false)}
              >{link.label}</a>
            ))}
            <Link to="/signin" style={{ display: 'block', padding: '0.75rem 0', fontSize: '0.875rem', fontWeight: 500, color: '#7652D6', textDecoration: 'none' }}>
              Sign In
            </Link>
          </div>
        )}
      </nav>

      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <section className="hero-gradient" style={{ padding: '5rem 1.5rem 4rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
          <div className="animate-fadeInUp">
            {/* Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#F1EBFF', border: '1px solid #D9CEFF', borderRadius: 99, padding: '0.375rem 1rem', marginBottom: '1.5rem' }}>
              <Sparkles size={14} color="#7652D6" />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#7652D6' }}>Powered by Google Gemini AI</span>
            </div>

            <h1 style={{ fontSize: 'clamp(2.25rem, 5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.1, color: '#211A32', marginBottom: '1.25rem', letterSpacing: '-0.03em' }}>
              Every Celebration{' '}
              <span style={{ background: 'linear-gradient(135deg, #7652D6, #4B2B91)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Begins with a Brilliant Plan.
              </span>
            </h1>

            <p style={{ fontSize: '1.125rem', color: '#756D83', lineHeight: 1.7, marginBottom: '2rem', maxWidth: 520 }}>
              From intimate birthdays to grand weddings — PLANEN AI transforms your event vision into a complete, personalized plan with AI-powered budgets, timelines, vendor lists, and more.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/signup" className="btn btn-primary btn-lg" id="hero-cta-primary">
                <Sparkles size={18} />
                Plan My Event
                <ArrowRight size={16} />
              </Link>
              <Link to="/dashboard" className="btn btn-secondary btn-lg" id="hero-cta-secondary">
                <Play size={16} />
                Explore the Planner
              </Link>
            </div>

            {/* Social proof */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: '2rem' }}>
              <div style={{ display: 'flex' }}>
                {['#7652D6', '#4B2B91', '#9B7EE0'].map((bg, i) => (
                  <div key={i} style={{ width: 32, height: 32, borderRadius: '50%', background: bg, border: '2px solid #fff', marginLeft: i > 0 ? -10 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#fff' }}>
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <div>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[1,2,3,4,5].map(s => <Star key={s} size={14} fill="#B7791F" color="#B7791F" />)}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#756D83', marginTop: 2 }}>Loved by event planners</div>
              </div>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="animate-fadeInUp" style={{ '--delay': '100ms' } as React.CSSProperties}>
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* ─── Event Types ────────────────────────────────────────────── */}
      <section style={{ padding: '3rem 1.5rem', background: '#FAF8FF' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#7652D6', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Plan Any Event</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {EVENT_TYPES.map(type => (
              <div key={type.label} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '0.625rem 1.25rem',
                background: type.color, border: `1.5px solid ${type.border}`,
                borderRadius: 99, fontSize: '0.875rem', fontWeight: 600, color: '#211A32',
                cursor: 'pointer', transition: 'all 150ms',
              }}>
                <span style={{ fontSize: '1.1rem' }}>{type.emoji}</span>
                {type.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ───────────────────────────────────────────────── */}
      <section id="features" style={{ padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#7652D6', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Powerful Features</p>
            <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: '#211A32', letterSpacing: '-0.02em' }}>
              Everything You Need to Plan the Perfect Event
            </h2>
            <p style={{ color: '#756D83', marginTop: '1rem', maxWidth: 560, margin: '1rem auto 0' }}>
              From initial concept to the final farewell — PLANEN AI handles every detail so you can focus on celebrating.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {FEATURES.map((feature) => (
              <div key={feature.title} className="card card--interactive" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ width: 52, height: 52, background: feature.bg, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: feature.color }}>
                  {feature.icon}
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#211A32', marginBottom: 8 }}>{feature.title}</h3>
                  <p style={{ fontSize: '0.875rem', color: '#756D83', lineHeight: 1.6 }}>{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ───────────────────────────────────────────── */}
      <section id="how-it-works" style={{ padding: '5rem 1.5rem', background: '#FAF8FF' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#7652D6', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Simple Process</p>
            <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: '#211A32', letterSpacing: '-0.02em' }}>
              From Idea to Celebration in 4 Steps
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32 }}>
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} style={{ textAlign: 'center', position: 'relative' }}>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div style={{ position: 'absolute', top: 28, left: '65%', right: '-15%', height: 2, background: 'linear-gradient(90deg, #D9CEFF, transparent)', display: 'none' }} className="step-connector" />
                )}
                <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #7652D6, #4B2B91)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', color: '#fff', fontWeight: 800, fontSize: '1.1rem' }}>
                  {step.step}
                </div>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#211A32', marginBottom: 8 }}>{step.title}</h3>
                <p style={{ fontSize: '0.875rem', color: '#756D83', lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <Link to="/signup" className="btn btn-primary btn-lg" id="how-it-works-cta">
              <Sparkles size={18} />
              Start Planning for Free
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Templates Preview ──────────────────────────────────────── */}
      <section id="templates" style={{ padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#7652D6', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Featured Templates</p>
            <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: '#211A32', letterSpacing: '-0.02em' }}>
              Start with a Perfect Template
            </h2>
            <p style={{ color: '#756D83', marginTop: '1rem', maxWidth: 500, margin: '1rem auto 0', fontSize: '0.875rem' }}>
              Choose a pre-configured event template and let AI customize it for your needs.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {[
              { emoji: '💍', title: 'Royal Wedding', desc: '200 guests · Premium · Indoor/Outdoor blend', color: '#F1EBFF', accent: '#7652D6' },
              { emoji: '🎂', title: 'Birthday Bash', desc: '50 guests · Balanced · Outdoor celebration', color: '#FFF5F5', accent: '#C53030' },
              { emoji: '🏢', title: 'Corporate Summit', desc: '500 guests · Professional · Conference center', color: '#EBF8FF', accent: '#2B6CB0' },
              { emoji: '🎓', title: 'Graduation Party', desc: '80 guests · Budget-friendly · Garden setting', color: '#ECFDF5', accent: '#21845B' },
            ].map(template => (
              <Link key={template.title} to="/signup" style={{ textDecoration: 'none' }}>
                <div className="card card--interactive" style={{ background: template.color, border: 'none', textAlign: 'center', cursor: 'pointer' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{template.emoji}</div>
                  <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#211A32', marginBottom: 6 }}>{template.title}</h3>
                  <p style={{ fontSize: '0.8rem', color: '#756D83' }}>{template.desc}</p>
                  <div style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: 6, color: template.accent, fontWeight: 600, fontSize: '0.8rem' }}>
                    Use Template <ChevronRight size={14} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ───────────────────────────────────────────── */}
      <section style={{ padding: '5rem 1.5rem', background: '#FAF8FF' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#7652D6', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Testimonials</p>
            <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: '#211A32', letterSpacing: '-0.02em' }}>
              Trusted by Event Planners
            </h2>
            <p style={{ color: '#756D83', marginTop: 8, fontSize: '0.75rem' }}>
              ⚠️ Sample testimonials — for illustrative purposes only.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="card">
                <div style={{ display: 'flex', gap: 2, marginBottom: '1rem' }}>
                  {[1,2,3,4,5].map(s => <Star key={s} size={16} fill="#B7791F" color="#B7791F" />)}
                </div>
                <p style={{ fontSize: '0.9rem', color: '#756D83', lineHeight: 1.7, marginBottom: '1.25rem', fontStyle: 'italic' }}>
                  "{t.text}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="avatar avatar--sm">{t.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#211A32' }}>{t.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#756D83' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ────────────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#7652D6', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Pricing</p>
            <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: '#211A32', letterSpacing: '-0.02em' }}>
              Simple, Transparent Pricing
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, maxWidth: 900, margin: '0 auto' }}>
            {PRICING.map((plan) => (
              <div key={plan.name} style={{
                background: plan.highlighted ? 'linear-gradient(135deg, #7652D6, #4B2B91)' : 'var(--color-bg)',
                border: plan.highlighted ? 'none' : '1px solid var(--color-border)',
                borderRadius: 20,
                padding: '2rem',
                boxShadow: plan.highlighted ? '0 16px 48px rgba(118,82,214,0.35)' : 'var(--shadow-sm)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {plan.badge && (
                  <div style={{ position: 'absolute', top: 16, right: 16, background: '#fff', color: '#7652D6', borderRadius: 99, padding: '0.2rem 0.75rem', fontSize: '0.7rem', fontWeight: 700 }}>
                    {plan.badge}
                  </div>
                )}
                <div style={{ color: plan.highlighted ? 'rgba(255,255,255,0.8)' : '#756D83', fontWeight: 600, fontSize: '0.875rem', marginBottom: 8 }}>{plan.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: '1.5rem' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 800, color: plan.highlighted ? '#fff' : '#211A32' }}>{plan.price}</span>
                  <span style={{ color: plan.highlighted ? 'rgba(255,255,255,0.7)' : '#756D83', fontSize: '0.875rem' }}>{plan.period}</span>
                </div>
                <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.875rem', color: plan.highlighted ? 'rgba(255,255,255,0.9)' : '#756D83' }}>
                      <CheckSquare size={16} color={plan.highlighted ? 'rgba(255,255,255,0.8)' : '#21845B'} />
                      {f}
                    </div>
                  ))}
                </div>
                <Link
                  to="/signup"
                  className={plan.highlighted ? 'btn btn-lg' : 'btn btn-outline btn-lg'}
                  style={{
                    width: '100%', justifyContent: 'center',
                    background: plan.highlighted ? 'rgba(255,255,255,0.15)' : undefined,
                    color: plan.highlighted ? '#fff' : undefined,
                    border: plan.highlighted ? '1.5px solid rgba(255,255,255,0.3)' : undefined,
                  }}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ────────────────────────────────────────────────────── */}
      <section style={{ padding: '5rem 1.5rem', background: '#FAF8FF' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#7652D6', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>FAQ</p>
            <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', fontWeight: 800, color: '#211A32', letterSpacing: '-0.02em' }}>
              Frequently Asked Questions
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FAQS.map((faq, i) => (
              <div key={i} className="card" style={{ cursor: 'pointer', padding: '1.25rem 1.5rem' }} onClick={() => setOpenFAQ(openFAQ === i ? null : i)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#211A32' }}>{faq.q}</span>
                  <ChevronRight size={18} color="#756D83" style={{ transform: openFAQ === i ? 'rotate(90deg)' : 'none', transition: 'transform 200ms', flexShrink: 0 }} />
                </div>
                {openFAQ === i && (
                  <p style={{ fontSize: '0.875rem', color: '#756D83', marginTop: '0.75rem', lineHeight: 1.7 }}>{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ──────────────────────────────────────────────── */}
      <section style={{ padding: '5rem 1.5rem', background: 'linear-gradient(135deg, #7652D6, #4B2B91)', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: '1rem' }}>
            Ready to Plan Your Perfect Event?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', marginBottom: '2rem' }}>
            Join thousands of event planners using AI to create unforgettable celebrations.
          </p>
          <Link to="/signup" className="btn btn-lg" style={{ background: '#fff', color: '#7652D6', fontWeight: 700, fontSize: '1rem', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <Sparkles size={20} />
            Start Planning for Free
          </Link>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────────── */}
      <footer style={{ background: '#211A32', color: 'rgba(255,255,255,0.6)', padding: '3rem 1.5rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32, marginBottom: '2rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #7652D6, #9B7EE0)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" opacity="0.9"/>
                    <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <span style={{ fontWeight: 800, color: '#fff' }}>PLANEN AI</span>
              </div>
              <p style={{ fontSize: '0.8rem', lineHeight: 1.6 }}>Your AI-powered celebration planner.</p>
            </div>
            {[
              { title: 'Product', links: ['Features', 'Templates', 'Pricing', 'Changelog'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
              { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy'] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontWeight: 600, color: '#fff', marginBottom: 12, fontSize: '0.875rem' }}>{col.title}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {col.links.map(link => (
                    <a key={link} href="#" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', transition: 'color 150ms' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                    >{link}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <p style={{ fontSize: '0.75rem' }}>© 2026 PLANEN AI. All rights reserved.</p>
            <div style={{ display: 'flex', gap: 16 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem' }}><Shield size={12} /> Secured by Firebase</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem' }}><Zap size={12} /> Powered by Gemini AI</span>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .hide-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
          section > div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Dashboard Preview Component ──────────────────────────────────────────────
function DashboardPreview() {
  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        background: '#fff',
        borderRadius: 20,
        border: '1px solid #EAE4F4',
        boxShadow: '0 24px 80px rgba(118,82,214,0.2)',
        overflow: 'hidden',
        transform: 'perspective(1000px) rotateY(-5deg) rotateX(2deg)',
        transition: 'transform 0.3s ease',
      }}
      onMouseEnter={e => (e.currentTarget.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'perspective(1000px) rotateY(-5deg) rotateX(2deg)')}
      >
        {/* Preview Header */}
        <div style={{ background: '#FAF8FF', padding: '12px 16px', borderBottom: '1px solid #EAE4F4', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['#FF5F57','#FFBD2E','#28CA41'].map(c => (
              <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
            ))}
          </div>
          <div style={{ flex: 1, background: '#fff', borderRadius: 6, height: 20, display: 'flex', alignItems: 'center', paddingLeft: 8, fontSize: '0.65rem', color: '#756D83', border: '1px solid #EAE4F4' }}>
            planen.ai/dashboard
          </div>
        </div>

        {/* Preview Content */}
        <div style={{ display: 'flex', height: 360 }}>
          {/* Mini Sidebar */}
          <div style={{ width: 140, background: '#FAF8FF', borderRight: '1px solid #EAE4F4', padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <div style={{ width: 20, height: 20, background: 'linear-gradient(135deg, #7652D6, #4B2B91)', borderRadius: 5 }} />
              <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#211A32' }}>PLANEN AI</span>
            </div>
            {['Dashboard','AI Plan','Budget','Timeline','Vendors','Guests'].map((item, i) => (
              <div key={item} style={{ padding: '5px 8px', borderRadius: 6, fontSize: '0.6rem', fontWeight: i === 0 ? 700 : 400, background: i === 0 ? '#F1EBFF' : 'transparent', color: i === 0 ? '#7652D6' : '#756D83', display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 10, height: 10, background: '#EAE4F4', borderRadius: 2 }} />
                {item}
              </div>
            ))}
          </div>

          {/* Main Preview */}
          <div style={{ flex: 1, padding: 16, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#211A32', marginBottom: 12 }}>My Events</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              {[
                { label: '3', sub: 'Active Events', color: '#F1EBFF', accent: '#7652D6' },
                { label: '$12k', sub: 'Total Budget', color: '#ECFDF5', accent: '#21845B' },
                { label: '24', sub: 'Tasks Done', color: '#EBF8FF', accent: '#2B6CB0' },
                { label: '85', sub: 'Guests RSVPd', color: '#FFFBEB', accent: '#B7791F' },
              ].map(s => (
                <div key={s.label} style={{ background: s.color, borderRadius: 10, padding: 10 }}>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: s.accent }}>{s.label}</div>
                  <div style={{ fontSize: '0.55rem', color: '#756D83' }}>{s.sub}</div>
                </div>
              ))}
            </div>
            {/* Mini event card */}
            <div style={{ background: '#fff', border: '1px solid #EAE4F4', borderRadius: 10, padding: 10, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#211A32' }}>💍 Sarah & James Wedding</div>
                <div style={{ background: '#ECFDF5', color: '#21845B', fontSize: '0.5rem', fontWeight: 600, borderRadius: 99, padding: '2px 6px' }}>On Track</div>
              </div>
              <div style={{ fontSize: '0.55rem', color: '#756D83', marginBottom: 6 }}>March 15, 2027 · 200 guests · $25,000</div>
              <div style={{ background: '#EAE4F4', borderRadius: 99, height: 4, overflow: 'hidden' }}>
                <div style={{ width: '65%', height: '100%', background: 'linear-gradient(90deg, #7652D6, #9B7EE0)', borderRadius: 99 }} />
              </div>
              <div style={{ fontSize: '0.5rem', color: '#756D83', marginTop: 3 }}>65% of tasks complete</div>
            </div>
            {/* AI message */}
            <div style={{ background: '#F1EBFF', borderRadius: 10, padding: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <div style={{ width: 16, height: 16, background: 'linear-gradient(135deg, #7652D6, #4B2B91)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={8} color="#fff" />
                </div>
                <span style={{ fontSize: '0.55rem', fontWeight: 700, color: '#7652D6' }}>AI Suggestion</span>
              </div>
              <p style={{ fontSize: '0.55rem', color: '#756D83', lineHeight: 1.5 }}>
                Book your photographer 8 months in advance — availability fills up fast for March dates! 🎯
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating decorative elements */}
      <div style={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80, background: 'linear-gradient(135deg, rgba(118,82,214,0.15), rgba(75,43,145,0.1))', borderRadius: '50%', filter: 'blur(20px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -24, left: -24, width: 120, height: 120, background: 'radial-gradient(circle, rgba(118,82,214,0.1), transparent)', filter: 'blur(24px)', pointerEvents: 'none' }} />
    </div>
  );
}
