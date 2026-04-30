'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function ResetForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token || token.length !== 64) setError('Invalid or missing reset token. Please request a new link.');
  }, [token]);

  async function submit(e) {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }
      setDone(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch {
      setError('Network error — try again');
      setLoading(false);
    }
  }

  return (
    <div className="card p-8">
      {done ? (
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00ff88" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 className="text-white font-bold text-lg">Password updated</h2>
          <p className="text-white/40 text-sm">Your password has been changed. Redirecting to login…</p>
          <Link href="/login" className="btn btn-primary w-full">Go to Login</Link>
        </div>
      ) : (
        <>
          {error && <div className="alert-error mb-4">{error}</div>}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">New Password</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                minLength={8}
                required
              />
              <p className="text-white/25 text-xs mt-1">Minimum 8 characters</p>
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={loading || !token}>
              {loading ? 'Updating…' : 'Set New Password'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="page-sm">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 font-black text-2xl text-white mb-2">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 1L12.5 7.5H19L13.75 11.5L15.5 18L10 14.5L4.5 18L6.25 11.5L1 7.5H7.5L10 1Z" fill="#00ff88"/>
          </svg>
          NetzTech
        </div>
        <p className="text-white/40 text-sm">Set a new password</p>
      </div>
      <Suspense fallback={<div className="card p-8 flex justify-center"><div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin"/></div>}>
        <ResetForm />
      </Suspense>
      <p className="text-center text-white/30 text-sm mt-6">
        <Link href="/login" className="text-accent hover:underline">Back to Login</Link>
      </p>
    </main>
  );
}
