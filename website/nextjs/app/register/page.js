'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { setAuth } from '@/lib/client-auth';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ minecraft_username: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }
      setAuth(data.token, data.user);
      window.dispatchEvent(new Event('nt-auth-change'));
      router.push('/dashboard');
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
        <p className="text-white/40 text-sm">Create your account to get started</p>
      </div>

      <div className="card p-8">
        {error && <div className="alert-error mb-4">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Minecraft Username</label>
            <input className="input" type="text" placeholder="Steve" value={form.minecraft_username}
              onChange={e => setForm(f => ({ ...f, minecraft_username: e.target.value }))} required />
            <p className="text-white/25 text-xs mt-1">Must exactly match your in-game name (case-insensitive)</p>
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="you@example.com" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" placeholder="Min. 8 characters" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          </div>
          <button type="submit" className="btn btn-primary w-full mt-2" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>
        <p className="text-center text-white/30 text-sm mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-accent hover:underline">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
