'use client';
import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/client-auth';

const QUICK_CMDS = [
  { label: 'List Players', cmd: 'list' },
  { label: 'Save World',   cmd: 'save-all' },
  { label: 'Time Day',     cmd: 'time set day' },
  { label: 'Clear Weather',cmd: 'weather clear' },
  { label: 'Reload Plugins',cmd: 'reload confirm' },
  { label: 'Ban List',     cmd: 'banlist' },
  { label: 'TPS',          cmd: 'tps' },
  { label: 'Memory',       cmd: 'gc' },
];

export default function ServerPage() {
  const [status, setStatus]       = useState(null);
  const [cmd, setCmd]             = useState('');
  const [log, setLog]             = useState([]);
  const [running, setRunning]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState(null);
  const [worldName, setWorldName] = useState('world');
  const [restarting, setRestarting] = useState(false);
  const [backingUp, setBackingUp]   = useState(false);
  const [actionMsg, setActionMsg]   = useState(null);
  const [plugins, setPlugins]       = useState(null);
  const fileRef = useRef(null);
  const logRef  = useRef(null);

  function loadStatus() {
    apiFetch('/admin/server/status').then(r => r?.json()).then(s => { if (s) setStatus(s); });
  }
  function loadPlugins() {
    apiFetch('/admin/server/plugins').then(r => r?.json()).then(d => { if (d) setPlugins(d); });
  }
  useEffect(() => { loadStatus(); loadPlugins(); const t = setInterval(loadStatus, 15000); return () => clearInterval(t); }, []);
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [log]);

  async function sendCmd(command) {
    if (!command?.trim()) return;
    const entry = { cmd: command, out: null, err: null, time: new Date().toLocaleTimeString() };
    setLog(l => [...l, entry]);
    setRunning(true);
    const res  = await apiFetch('/admin/server/command', { method: 'POST', body: JSON.stringify({ command }) });
    const data = await res?.json();
    setLog(l => l.map((e, i) => i === l.length - 1 ? { ...entry, out: data?.result, err: data?.error } : e));
    setRunning(false);
    setCmd('');
  }

  async function restartServer() {
    if (!confirm('Restart the Minecraft server? Players will be disconnected briefly.')) return;
    setRestarting(true);
    setActionMsg(null);
    const res  = await apiFetch('/admin/server/restart', { method: 'POST' });
    const data = await res?.json();
    setRestarting(false);
    setActionMsg(data?.error ? { ok: false, text: data.error } : { ok: true, text: 'Server restarting — will be back online in ~30s' });
    setTimeout(() => setActionMsg(null), 8000);
    setTimeout(loadStatus, 10000);
  }

  async function triggerBackup() {
    if (!confirm('Run a manual backup now? This may take a minute.')) return;
    setBackingUp(true);
    setActionMsg(null);
    const res  = await apiFetch('/admin/server/backup', { method: 'POST' });
    const data = await res?.json();
    setBackingUp(false);
    setActionMsg(data?.error ? { ok: false, text: data.error } : { ok: true, text: 'Backup complete and pushed to GitHub' });
    setTimeout(() => setActionMsg(null), 8000);
  }

  async function uploadWorld() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadMsg(null);
    const form = new FormData();
    form.append('world', file);
    form.append('name', worldName);
    const res  = await apiFetch('/admin/server/upload-world', { method: 'POST', body: form });
    const data = await res?.json();
    setUploadMsg(data);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="section-title">Server</h1>
        <p className="section-subtitle">Status, RCON console, and world management</p>
      </div>

      {/* Status + actions */}
      <div className="card p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${status?.online ? 'bg-accent animate-pulse' : 'bg-red-500'}`} />
            <div>
              <div className="font-semibold text-white text-sm">
                {status === null ? 'Checking…' : status.online ? 'Server Online' : 'Server Offline'}
              </div>
              <div className="text-white/40 text-xs mt-0.5">{status?.message || '—'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={loadStatus} className="btn btn-ghost btn-sm">Refresh</button>
            <button
              onClick={triggerBackup}
              disabled={backingUp}
              className="btn btn-secondary btn-sm"
            >
              {backingUp ? 'Backing up…' : 'Backup Now'}
            </button>
            <button
              onClick={restartServer}
              disabled={restarting}
              className="btn btn-sm"
              style={{ background: 'rgba(255,85,85,0.12)', color: '#ff5555', border: '1px solid rgba(255,85,85,0.2)' }}
            >
              {restarting ? 'Restarting…' : 'Restart Server'}
            </button>
          </div>
        </div>
        {actionMsg && (
          <div className={`mt-4 text-sm px-4 py-2.5 rounded-lg ${actionMsg.ok ? 'bg-accent/10 text-accent' : 'bg-red-500/10 text-red-400'}`}>
            {actionMsg.text}
          </div>
        )}
      </div>

      {/* RCON Console */}
      <div className="card p-5">
        <h2 className="font-bold text-white mb-4">RCON Console</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {QUICK_CMDS.map(q => (
            <button key={q.cmd} onClick={() => sendCmd(q.cmd)} disabled={running} className="btn btn-ghost btn-sm text-xs">
              {q.label}
            </button>
          ))}
        </div>
        <div ref={logRef} className="console h-56 mb-3 overflow-y-auto">
          {log.length === 0 && <span className="text-white/20">Type a command below or use a quick action…</span>}
          {log.map((e, i) => (
            <div key={i} className="mb-1.5">
              <span className="text-white/30 mr-2">[{e.time}]</span>
              <span className="text-accent/70">$ {e.cmd}</span>
              {e.out && <div className="text-green-300/70 ml-4 mt-0.5 whitespace-pre-wrap">{e.out}</div>}
              {e.err && <div className="text-red-400/70 ml-4 mt-0.5">{e.err}</div>}
            </div>
          ))}
          {running && <div className="text-white/30 animate-pulse">Running…</div>}
        </div>
        <form onSubmit={e => { e.preventDefault(); sendCmd(cmd); }} className="flex gap-2">
          <input
            className="input font-mono flex-1"
            placeholder="say Hello! / ban player / lp user Steve parent set vip …"
            value={cmd}
            onChange={e => setCmd(e.target.value)}
            disabled={running}
          />
          <button type="submit" disabled={running || !cmd.trim()} className="btn btn-primary">Run</button>
        </form>
      </div>

      {/* Gamemode presets */}
      <div className="card p-5">
        <h2 className="font-bold text-white mb-1">Gamemode Presets</h2>
        <p className="text-white/40 text-xs mb-4">Quick server configuration via RCON.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { label: 'Survival (Normal)', cmds: ['defaultgamemode survival', 'difficulty normal'] },
            { label: 'Survival (Hard)',   cmds: ['defaultgamemode survival', 'difficulty hard'] },
            { label: 'Creative Mode',     cmds: ['defaultgamemode creative', 'difficulty peaceful'] },
            { label: 'PvP On',            cmds: ['pvp true'] },
            { label: 'PvP Off',           cmds: ['pvp false'] },
            { label: 'Allow Flight',      cmds: ['allow-flight true'] },
          ].map(preset => (
            <button
              key={preset.label}
              onClick={async () => { for (const c of preset.cmds) await sendCmd(c); }}
              disabled={running}
              className="btn btn-ghost btn-sm justify-start"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Plugins status */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-white">Installed Plugins</h2>
            {plugins?.count != null && (
              <p className="text-white/40 text-xs mt-0.5">{plugins.count} plugin{plugins.count !== 1 ? 's' : ''} loaded</p>
            )}
          </div>
          <button onClick={loadPlugins} className="btn btn-ghost btn-sm text-xs">Refresh</button>
        </div>

        {plugins?.error ? (
          <p className="text-white/30 text-sm">Server offline — start the server to see plugins.</p>
        ) : plugins?.plugins?.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {plugins.plugins.map(p => (
              <div key={p.name} className="flex items-center gap-2.5 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="w-2 h-2 rounded-full shrink-0 bg-accent" />
                <span className="text-sm font-semibold text-white truncate">{p.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-12">
            <div className="w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          </div>
        )}
      </div>

      {/* World upload */}
      <div className="card p-5">
        <h2 className="font-bold text-white mb-1">Upload World</h2>
        <p className="text-white/40 text-xs mb-5">
          Upload a .zip containing a world folder. Restart the server after upload to load it.
          The existing world is backed up automatically.
        </p>
        <div className="space-y-3">
          <div>
            <label className="label">World name (folder name)</label>
            <input className="input max-w-xs font-mono" value={worldName} onChange={e => setWorldName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))} />
          </div>
          <div>
            <label className="label">World zip file</label>
            <input ref={fileRef} type="file" accept=".zip" className="text-sm text-white/60 file:btn file:btn-secondary file:mr-3 file:cursor-pointer" />
          </div>
          {uploadMsg && (
            <div className={uploadMsg.ok ? 'alert-success' : 'alert-error'}>{uploadMsg.message || uploadMsg.error}</div>
          )}
          <button onClick={uploadWorld} disabled={uploading} className="btn btn-secondary">
            {uploading ? 'Uploading…' : 'Upload & Extract World'}
          </button>
        </div>
      </div>
    </div>
  );
}
