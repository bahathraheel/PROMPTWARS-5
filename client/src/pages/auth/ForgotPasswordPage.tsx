import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowLeft, Sparkles, CheckCircle } from 'lucide-react';
import { resetPassword } from '../../services/authService';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await resetPassword(data.email);
      setSent(true);
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-secondary)', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <Link to="/signin" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '2rem', textDecoration: 'none', fontWeight: 500 }}>
          <ArrowLeft size={16} /> Back to sign in
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #7652D6, #4B2B91)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={18} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text)' }}>PLANEN AI</span>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ width: 64, height: 64, background: 'var(--color-success-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                <CheckCircle size={32} color="var(--color-success)" />
              </div>
              <h2 style={{ fontWeight: 700, marginBottom: 8 }}>Check your email</h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                If an account exists for that email, we sent a password reset link. Check your inbox and spam folder.
              </p>
              <Link to="/signin" className="btn btn-primary" style={{ display: 'inline-flex' }}>
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: 8 }}>Reset your password</h1>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Enter your email and we'll send you a link to reset your password.
              </p>
              <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="reset-email">Email address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input id="reset-email" type="email" className={`input ${errors.email ? 'input--error' : ''}`} style={{ paddingLeft: 40 }} placeholder="you@example.com" {...register('email')} />
                  </div>
                  {errors.email && <p className="form-error">{errors.email.message}</p>}
                </div>
                <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} id="reset-submit-btn">
                  {loading ? <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
