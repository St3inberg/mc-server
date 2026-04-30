'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/client-auth';

const ICON_OPTIONS = [
  { value: 'sword',    label: 'Sword (PvP)' },
  { value: 'mountain', label: 'Mountain (Survival)' },
  { value: 'flag',     label: 'Flag (Factions)' },
  { value: 'layers',   label: 'Layers (Mini-Games)' },
  { value: 'shield',   label: 'Shield (Anti-Cheat)' },
  { value: 'zap',      label: 'Zap (Performance)' },
  { value: 'star',     label: 'Star (Featured)' },
  { value: 'server',   label: 'Server (Infrastructure)' },
  { value: 'package',  label: 'Package (Store)' },
  { value: 'users',    label: 'Users (Community)' },
];

function FeatureEditor({ features, onChange }) {
  function update(i, field, val) {
    const next = features.map((f, idx) => idx === i ? { ...f, [field]: val } : f);
    onChange(next);
  }
  function add() {
    onChange([...features, { icon: 'star', title: 'New Feature', desc: 'Description here.', color: '#00ff88' }]);
  }
  function remove(i) {
    onChange(features.filter((_, idx) => idx !== i));
  }
  function move(i, dir) {
    const next = [...features];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {features.map((f, i) => (
        <div key={i} className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/40 font-semibold uppercase tracking-wider">Feature {i + 1}</span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="btn btn-ghost btn-sm px-2 py-1 text-xs disabled:opacity-20">↑</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === features.length - 1} className="btn btn-ghost btn-sm px-2 py-1 text-xs disabled:opacity-20">↓</button>
              <button type="button" onClick={() => remove(i)} className="btn btn-ghost btn-sm px-2 py-1 text-xs text-red-400 hover:bg-red-500/10">Remove</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Title</label>
              <input className="input" value={f.title} onChange={e => update(i, 'title', e.target.value)} />
            </div>
            <div>
              <label className="label">Icon</label>
              <select className="input" value={f.icon} onChange={e => update(i, 'icon', e.target.value)}>
                {ICON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none h-16" value={f.desc} onChange={e => update(i, 'desc', e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <div>
              <label className="label">Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={f.color} onChange={e => update(i, 'color', e.target.value)} className="w-9 h-9 rounded cursor-pointer bg-transparent border-0" />
                <input className="input w-28 font-mono" value={f.color} onChange={e => update(i, 'color', e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      ))}
      <button type="button" onClick={add} className="btn btn-secondary w-full">+ Add Feature</button>
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiFetch('/admin/settings').then(r => r?.json()).then(d => {
      if (d) { setSettings(d); setLoading(false); }
    });
  }, []);

  function set(key, val) {
    setSettings(s => ({ ...s, [key]: val }));
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await apiFetch('/admin/settings', { method: 'PUT', body: JSON.stringify(settings) });
    const data = await res?.json();
    setSaving(false);
    if (data?.error) { setError(data.error); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
    </div>
  );

  return (
    <form onSubmit={save}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="section-title">Site Content</h1>
          <p className="section-subtitle">Edit homepage text, server IP, and feature cards</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-accent text-sm font-semibold">Saved!</span>}
          {error && <span className="text-red-400 text-sm">{error}</span>}
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Server IP */}
        <div className="card p-6">
          <h2 className="font-bold text-white mb-4">Server</h2>
          <div>
            <label className="label">Server IP</label>
            <input className="input font-mono" value={settings.server_ip || ''} onChange={e => set('server_ip', e.target.value)} placeholder="play.yourserver.xyz" />
          </div>
        </div>

        {/* Hero section */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-white mb-2">Hero Section</h2>
          <div>
            <label className="label">Badge text</label>
            <input className="input" value={settings.hero_badge || ''} onChange={e => set('hero_badge', e.target.value)} placeholder="Server Online — Join Now" />
          </div>
          <div>
            <label className="label">Heading</label>
            <input className="input" value={settings.hero_heading || ''} onChange={e => set('hero_heading', e.target.value)} placeholder="The Ultimate Minecraft Server" />
            <p className="text-white/25 text-xs mt-1">The word "Minecraft" in the heading will always use the shimmer effect.</p>
          </div>
          <div>
            <label className="label">Subtitle paragraph</label>
            <textarea className="input resize-none h-20" value={settings.hero_subtitle || ''} onChange={e => set('hero_subtitle', e.target.value)} />
          </div>
        </div>

        {/* Features */}
        <div className="card p-6">
          <h2 className="font-bold text-white mb-2">Features Section</h2>
          <div className="space-y-4 mb-4">
            <div>
              <label className="label">Section heading</label>
              <input className="input" value={settings.features_heading || ''} onChange={e => set('features_heading', e.target.value)} />
            </div>
            <div>
              <label className="label">Section subtitle</label>
              <input className="input" value={settings.features_subtitle || ''} onChange={e => set('features_subtitle', e.target.value)} />
            </div>
          </div>
          <FeatureEditor
            features={Array.isArray(settings.features) ? settings.features : []}
            onChange={val => set('features', val)}
          />
        </div>

        {/* CTA */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-white mb-2">Call-to-Action Section</h2>
          <div>
            <label className="label">Heading</label>
            <input className="input" value={settings.cta_title || ''} onChange={e => set('cta_title', e.target.value)} />
          </div>
          <div>
            <label className="label">Subtitle</label>
            <textarea className="input resize-none h-16" value={settings.cta_subtitle || ''} onChange={e => set('cta_subtitle', e.target.value)} />
          </div>
        </div>
      </div>
    </form>
  );
}
