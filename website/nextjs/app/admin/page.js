'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/client-auth';

function MiniChart({ data }) {
  if (!data?.length) return <div className="h-16 flex items-end text-white/20 text-xs">No data yet</div>;
  const max = Math.max(...data.map(d => d.total), 1);
  return (
    <div className="flex items-end gap-1 h-16 mt-2">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
          <div
            className="w-full rounded-sm bg-accent/30 group-hover:bg-accent/60 transition-all"
            style={{ height: `${Math.max((d.total / max) * 56, 2)}px` }}
            title={`${d.day}: $${(d.total / 100).toFixed(2)}`}
          />
        </div>
      ))}
    </div>
  );
}

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/admin/stats').then(r => r?.json()).then(d => { if (d) { setStats(d); setLoading(false); } });
  }, []);

  async function flushQueue() {
    await apiFetch('/admin/queue', { method: 'POST' });
    alert('Perk queue flushed.');
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" /></div>;
  if (!stats) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="section-title">Overview</h1>
          <p className="section-subtitle">NetzTech server at a glance</p>
        </div>
        <button onClick={flushQueue} className="btn btn-secondary btn-sm">
          ↻ Flush Perk Queue
          {stats.pendingQueue > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-bold">{stats.pendingQueue}</span>}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <div className="stat-label">Revenue</div>
          <div className="stat-value text-accent">${(stats.totalRevenue / 100).toFixed(2)}</div>
          <div className="stat-sub">all time</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Users</div>
          <div className="stat-value">{stats.totalUsers}</div>
          <div className="stat-sub">registered</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Purchases</div>
          <div className="stat-value">{stats.totalPurchases}</div>
          <div className="stat-sub">completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Queue</div>
          <div className="stat-value">{stats.pendingQueue}</div>
          <div className="stat-sub">pending perks</div>
        </div>
      </div>

      {/* Revenue chart */}
      <div className="card p-6 mb-6">
        <h2 className="font-bold text-white mb-1 text-sm">Revenue — Last 30 Days</h2>
        <p className="text-white/30 text-xs mb-3">Daily totals</p>
        <MiniChart data={stats.revenueByDay} />
      </div>

      {/* Recent purchases */}
      <div className="table-wrap">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h2 className="font-bold text-white">Recent Purchases</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Package</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Perks</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentPurchases.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-white/25 py-8">No purchases yet</td></tr>
              ) : stats.recentPurchases.map(p => (
                <tr key={p.id}>
                  <td>
                    <span className="font-semibold text-white">{p.minecraft_username}</span>
                    <br /><span className="text-white/30 text-xs">{p.email}</span>
                  </td>
                  <td style={{ color: p.color, fontWeight: 600 }}>{p.product_name}</td>
                  <td className="text-accent font-semibold">${(p.amount_paid_cents / 100).toFixed(2)}</td>
                  <td><span className={p.status === 'completed' ? 'badge-completed' : 'badge-pending'}>{p.status}</span></td>
                  <td><span className={p.perks_applied ? 'badge-active' : 'badge-pending'}>{p.perks_applied ? 'Applied' : 'Pending'}</span></td>
                  <td className="text-white/40">{new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
