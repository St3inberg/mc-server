'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }
      setSent(true);
    } catch {
      setError('Network error — try again');
      setLoading(false);
    }
  }

  return (
    <main className="page-sm">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 font-black text-2xl text-white mb-2">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 1L12.5 7.5H19L13.75 11.5L15.5 18L10 14.5L4.5 18L6.25 11.5L1 7.5H7.5L10 1Z" fill="#00ff88"/>
          </svg>
          NetzTech
        </div>
        <p className="text-white/40 text-sm">Reset your password</p>
      </div>

      <div className="card p-8">
        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00ff88" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h2 className="text-white font-bold text-lg">Check your email</h2>
            <p className="text-white/40 text-sm">
              If an account exists for <span className="text-white/70">{email}</span>, you'll receive a reset link within a minute.
            </p>
            <p className="text-white/25 text-xs">The link expires in 1 hour.</p>
            <Link href="/login" className="btn btn-ghost w-full mt-2">Back to Login</Link>
          </div>
        ) : (
          <>
            {error && <div className="alert-error mb-4">{error}</div>}
            <p className="text-white/40 text-sm mb-6">
              Enter your email and we'll send you a link to reset your password.
            </p>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input
                  className="input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
            <p className="text-center text-white/30 text-sm mt-6">
              <Link href="/login" className="text-accent hover:underline">Back to Login</Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
