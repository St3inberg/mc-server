'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/client-auth';

const EMPTY = { name: '', description: '', features: '', price_cents: '', billing_type: 'one_time', rank_name: '', commands: '', color: '#00ff88', sort_order: 0, active: 1 };

function ProductForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ? {
    ...initial,
    features: initial.features.join('\n'),
    commands: initial.commands.join('\n'),
    price_cents: (initial.price_cents / 100).toFixed(2),
  } : EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const payload = {
      ...form,
      price_cents: Math.round(parseFloat(form.price_cents) * 100),
      features: form.features.split('\n').filter(Boolean),
      commands: form.commands.split('\n').filter(Boolean),
      active: form.active ? 1 : 0,
    };
    let res;
    if (initial?.id) {
      res = await apiFetch(`/admin/products/${initial.id}`, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      res = await apiFetch('/admin/products', { method: 'POST', body: JSON.stringify(payload) });
    }
    const data = await res?.json();
    if (data?.error) { setError(data.error); setLoading(false); return; }
    onSave();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div className="alert-error">{error}</div>}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Name</label>
          <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required />
        </div>
        <div>
          <label className="label">Price (USD)</label>
          <input className="input" type="number" step="0.01" min="0" value={form.price_cents} onChange={e => set('price_cents', e.target.value)} required />
        </div>
      </div>
      <div>
        <label className="label">Description</label>
        <input className="input" value={form.description} onChange={e => set('description', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Billing Type</label>
          <select className="input" value={form.billing_type} onChange={e => set('billing_type', e.target.value)}>
            <option value="one_time">One-time</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <div>
          <label className="label">Rank Name (LuckPerms)</label>
          <input className="input font-mono" placeholder="vip" value={form.rank_name} onChange={e => set('rank_name', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Features (one per line)</label>
        <textarea className="input font-mono h-28 resize-none" value={form.features} onChange={e => set('features', e.target.value)} />
      </div>
      <div>
        <label className="label">RCON Commands on purchase (one per line, use {'{player}'} as placeholder)</label>
        <textarea className="input font-mono h-20 resize-none" value={form.commands} onChange={e => set('commands', e.target.value)} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label">Color</label>
          <div className="flex items-center gap-2">
            <input type="color" value={form.color} onChange={e => set('color', e.target.value)} className="w-10 h-10 rounded cursor-pointer bg-transparent border-0" />
            <input className="input font-mono" value={form.color} onChange={e => set('color', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Sort Order</label>
          <input className="input" type="number" value={form.sort_order} onChange={e => set('sort_order', parseInt(e.target.value))} />
        </div>
        <div>
          <label className="label">Active</label>
          <label className="flex items-center gap-2 mt-3 cursor-pointer">
            <input type="checkbox" checked={!!form.active} onChange={e => set('active', e.target.checked ? 1 : 0)} className="w-4 h-4 accent-[#00ff88]" />
            <span className="text-sm text-white/60">Show in store</span>
          </label>
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={loading} className="btn btn-primary">{loading ? 'Saving…' : initial ? 'Save Changes' : 'Create Product'}</button>
        <button type="button" onClick={onCancel} className="btn btn-ghost">Cancel</button>
      </div>
    </form>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null=list, 'new'=new, product=edit

  function load() {
    apiFetch('/admin/products').then(r => r?.json()).then(d => { if (d) { setProducts(d); setLoading(false); } });
  }
  useEffect(load, []);

  async function toggleActive(p) {
    await apiFetch(`/admin/products/${p.id}`, { method: 'PUT', body: JSON.stringify({ ...p, active: p.active ? 0 : 1 }) });
    load();
  }

  if (editing === 'new' || (editing && editing !== null)) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => setEditing(null)} className="btn-ghost btn btn-sm">←</button>
          <h1 className="section-title">{editing === 'new' ? 'New Product' : `Edit: ${editing.name}`}</h1>
        </div>
        <div className="card p-6 max-w-2xl">
          <ProductForm initial={editing === 'new' ? null : editing} onSave={() => { setEditing(null); load(); }} onCancel={() => setEditing(null)} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="section-title">Products</h1>
          <p className="section-subtitle">Manage store packages</p>
        </div>
        <button onClick={() => setEditing('new')} className="btn btn-primary">+ New Product</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" /></div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Type</th>
                <th>Rank</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td className="font-bold" style={{ color: p.color }}>{p.name}</td>
                  <td className="text-accent">${(p.price_cents / 100).toFixed(2)}</td>
                  <td className="text-white/50 capitalize">{p.billing_type.replace('_', '-')}</td>
                  <td><code className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded">{p.rank_name || '—'}</code></td>
                  <td>
                    <span className={p.active ? 'badge-active' : 'badge-cancelled'}>{p.active ? 'Active' : 'Hidden'}</span>
                  </td>
                  <td className="flex items-center gap-2">
                    <button onClick={() => setEditing(p)} className="btn btn-secondary btn-sm">Edit</button>
                    <button onClick={() => toggleActive(p)} className="btn btn-ghost btn-sm">
                      {p.active ? 'Hide' : 'Show'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
