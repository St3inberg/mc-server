'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getToken, apiFetch } from '@/lib/client-auth';
import { IconCheck, IconClock, IconRefresh, IconCreditCard } from '@/components/Icons';

function StatusBadge({ applied }) {
  return applied ? (
    <span className="badge-active flex items-center gap-1">
      <IconCheck size={11} /> Active
    </span>
  ) : (
    <span className="badge-pending flex items-center gap-1">
      <IconClock size={11} /> Pending
    </span>
  );
}

function BillingBadge({ type }) {
  const recurring = type === 'monthly' || type === 'yearly';
  return (
    <span className="inline-flex items-center gap-1 text-white/50 text-xs">
      {recurring ? <IconRefresh size={11} /> : <IconCreditCard size={11} />}
      {type?.replace('_', '-') || 'one-time'}
    </span>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) { router.push('/login'); return; }
    apiFetch('/dashboard').then(r => r?.json()).then(d => {
      if (d) { setData(d); setLoading(false); }
    });
  }, []);

  if (loading) return (
    <main className="page flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
    </main>
  );
  if (!data) return null;

  const { user, purchases } = data;
  const activeCount = purchases.filter(p => p.perks_applied).length;
  const totalSpent = purchases.reduce((s, p) => s + (p.amount_paid_cents || 0), 0);

  return (
    <main className="page">
      {/* Header */}
      <div className="mb-10 animate-fade-in-up">
        <h1 className="text-3xl font-black text-white">
          Welcome back, <span className="text-accent">{user.minecraft_username}</span>
        </h1>
        <p className="text-white/40 text-sm mt-1">{user.email}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 animate-fade-in-up anim-delay-1">
        <div className="stat-card card-lift">
          <div className="stat-label">Active Perks</div>
          <div className="stat-value text-accent">{activeCount}</div>
        </div>
        <div className="stat-card card-lift">
          <div className="stat-label">Total Purchases</div>
          <div className="stat-value">{purchases.length}</div>
        </div>
        <div className="stat-card card-lift">
          <div className="stat-label">Total Spent</div>
          <div className="stat-value">${(totalSpent / 100).toFixed(2)}</div>
        </div>
      </div>

      {/* Purchases */}
      <div className="table-wrap animate-fade-in-up anim-delay-2">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h2 className="font-bold text-white">Your Purchases</h2>
          <Link href="/store" className="btn btn-primary btn-sm">Browse Store</Link>
        </div>

        {purchases.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-white/30 mb-4">No purchases yet.</p>
            <Link href="/store" className="btn btn-primary">Visit the Store</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Package</th>
                  <th>Status</th>
                  <th>Billing</th>
                  <th>Expires</th>
                  <th>Purchased</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map(p => (
                  <tr key={p.id}>
                    <td className="font-bold" style={{ color: p.color }}>{p.product_name}</td>
                    <td><StatusBadge applied={p.perks_applied} /></td>
                    <td><BillingBadge type={p.billing_type} /></td>
                    <td className="text-white/50">{p.expires_at ? new Date(p.expires_at).toLocaleDateString() : '—'}</td>
                    <td className="text-white/50">{new Date(p.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
