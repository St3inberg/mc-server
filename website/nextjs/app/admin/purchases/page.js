'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/client-auth';

const STATUS_CLASS = {
  completed: 'badge-completed',
  pending:   'badge-pending',
  cancelled: 'badge-cancelled',
};

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [busy, setBusy]           = useState(null);

  function load() {
    setLoading(true);
    apiFetch('/admin/purchases').then(r => r?.json()).then(d => {
      if (d) setPurchases(d);
      setLoading(false);
    });
  }
  useEffect(load, []);

  async function action(id, type) {
    if (type === 'delete' && !confirm('Permanently delete this order and all its queued commands?')) return;
    if (type === 'cancel' && !confirm('Cancel this order and remove the rank from the player?')) return;
    setBusy(`${id}-${type}`);
    if (type === 'delete') {
      await apiFetch(`/admin/purchases/${id}`, { method: 'DELETE' });
    } else {
      await apiFetch(`/admin/purchases/${id}`, { method: 'PATCH', body: JSON.stringify({ action: type }) });
    }
    setBusy(null);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="section-title">Orders</h1>
          <p className="section-subtitle">All store purchases</p>
        </div>
        <button onClick={load} className="btn btn-secondary btn-sm">↻ Refresh</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="table-wrap">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Player</th>
                  <th>Package</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Perks</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr><td colSpan={8} className="text-center text-white/25 py-8">No orders yet</td></tr>
                ) : purchases.map(p => (
                  <tr key={p.id}>
                    <td className="text-white/30 text-xs font-mono">#{p.id}</td>
                    <td>
                      <span className="font-semibold text-white">{p.minecraft_username}</span>
                      <br /><span className="text-white/30 text-xs">{p.email}</span>
                    </td>
                    <td style={{ color: p.color, fontWeight: 600 }}>{p.product_name}</td>
                    <td className="text-accent font-semibold">${(p.amount_paid_cents / 100).toFixed(2)}</td>
                    <td><span className={STATUS_CLASS[p.status] || 'badge-pending'}>{p.status}</span></td>
                    <td><span className={p.perks_applied ? 'badge-active' : 'badge-pending'}>{p.perks_applied ? 'Applied' : 'Pending'}</span></td>
                    <td className="text-white/40 text-xs">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        {p.status === 'completed' && !p.perks_applied && (
                          <button
                            onClick={() => action(p.id, 'redeliver')}
                            disabled={!!busy}
                            className="btn btn-secondary btn-sm text-xs"
                            title="Re-run RCON commands"
                          >
                            {busy === `${p.id}-redeliver` ? '…' : 'Redeliver'}
                          </button>
                        )}
                        {p.status !== 'cancelled' && (
                          <button
                            onClick={() => action(p.id, 'cancel')}
                            disabled={!!busy}
                            className="btn btn-ghost btn-sm text-xs text-yellow-400 hover:text-yellow-300"
                          >
                            {busy === `${p.id}-cancel` ? '…' : 'Cancel'}
                          </button>
                        )}
                        <button
                          onClick={() => action(p.id, 'delete')}
                          disabled={!!busy}
                          className="btn btn-ghost btn-sm text-xs text-red-400 hover:text-red-300"
                        >
                          {busy === `${p.id}-delete` ? '…' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
