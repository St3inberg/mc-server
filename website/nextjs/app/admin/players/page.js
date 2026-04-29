'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/client-auth';

const GROUPS = ['default', 'vip', 'vip_plus', 'mvp', 'owner', 'admin', 'mod'];

function ActionModal({ player, onClose, onAction }) {
  const [action, setAction] = useState('ban');
  const [reason, setReason] = useState('');
  const [group, setGroup] = useState('vip');
  const [permission, setPermission] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function run() {
    setLoading(true);
    setResult(null);
    const body = { action, username: player.minecraft_username };
    if (reason) body.reason = reason;
    if (action === 'set-group') body.group = group;
    if (action.includes('permission')) body.permission = permission;
    const res = await apiFetch('/admin/players', { method: 'POST', body: JSON.stringify(body) });
    const data = await res?.json();
    setResult(data);
    setLoading(false);
    if (data?.ok) { onAction(); }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-white">Player Action</h3>
            <p className="text-white/40 text-xs mt-0.5">{player.minecraft_username}</p>
          </div>
          <button onClick={onClose} className="btn-ghost btn btn-sm text-lg leading-none">×</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Action</label>
            <select className="input" value={action} onChange={e => setAction(e.target.value)}>
              <option value="ban">Ban player</option>
              <option value="unban">Unban (pardon) player</option>
              <option value="kick">Kick player</option>
              <option value="set-group">Set LuckPerms group</option>
              <option value="add-permission">Add permission node</option>
              <option value="remove-permission">Remove permission node</option>
              <option value="op">Grant OP</option>
              <option value="deop">Revoke OP</option>
            </select>
          </div>

          {(action === 'ban' || action === 'kick') && (
            <div>
              <label className="label">Reason (optional)</label>
              <input className="input" placeholder="e.g. Cheating" value={reason} onChange={e => setReason(e.target.value)} />
            </div>
          )}

          {action === 'set-group' && (
            <div>
              <label className="label">Group</label>
              <select className="input" value={group} onChange={e => setGroup(e.target.value)}>
                {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          )}

          {action.includes('permission') && (
            <div>
              <label className="label">Permission Node</label>
              <input className="input" placeholder="e.g. essentials.fly" value={permission} onChange={e => setPermission(e.target.value)} />
            </div>
          )}

          {result && (
            <div className={result.ok ? 'alert-success' : 'alert-error'}>
              {result.ok ? `Done! ${result.result || ''}` : result.error}
            </div>
          )}

          <button onClick={run} disabled={loading} className={`btn w-full ${action === 'ban' ? 'btn-danger' : 'btn-primary'}`}>
            {loading ? 'Running…' : `Execute: ${action}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PlayersPage() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  function load() {
    apiFetch('/admin/players').then(r => r?.json()).then(d => { if (d) { setPlayers(d); setLoading(false); } });
  }
  useEffect(load, []);

  const filtered = players.filter(p =>
    p.minecraft_username.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="section-title">Players</h1>
          <p className="section-subtitle">{players.length} registered accounts</p>
        </div>
      </div>

      <div className="mb-4">
        <input className="input max-w-sm" placeholder="Search by username or email…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" /></div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Email</th>
                <th>Purchases</th>
                <th>Total Spent</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-white/25 py-8">No players found</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id}>
                  <td className="font-semibold text-white">{p.minecraft_username}</td>
                  <td className="text-white/50">{p.email}</td>
                  <td className="text-white/70">{p.purchase_count}</td>
                  <td className="text-accent font-semibold">${(p.total_spent / 100).toFixed(2)}</td>
                  <td className="text-white/40 text-xs">{p.last_login ? new Date(p.last_login).toLocaleDateString() : 'Never'}</td>
                  <td>
                    <button onClick={() => setSelected(p)} className="btn btn-secondary btn-sm">Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <ActionModal
          player={selected}
          onClose={() => setSelected(null)}
          onAction={() => { setSelected(null); load(); }}
        />
      )}
    </div>
  );
}
