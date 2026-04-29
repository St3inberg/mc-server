'use client';
import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/client-auth';

const QUICK_CMDS = [
  { label: 'List Players', cmd: 'list' },
  { label: 'Save World', cmd: 'save-all' },
  { label: 'Survival Mode', cmd: 'defaultgamemode survival' },
  { label: 'Creative Mode', cmd: 'defaultgamemode creative' },
  { label: 'Time Day', cmd: 'time set day' },
  { label: 'Clear Weather', cmd: 'weather clear' },
  { label: 'Reload Plugins', cmd: 'reload confirm' },
  { label: 'BanList', cmd: 'banlist' },
];

export default function ServerPage() {
  const [status, setStatus] = useState(null);
  const [cmd, setCmd] = useState('');
  const [log, setLog] = useState([]);
  const [running, setRunning] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState(null);
  const [worldName, setWorldName] = useState('world');
  const fileRef = useRef(null);
  const logRef = useRef(null);

  function loadStatus() {
    apiFetch('/admin/server/status').then(r => r?.json()).then(s => { if (s) setStatus(s); });
  }
  useEffect(() => { loadStatus(); const t = setInterval(loadStatus, 15000); return () => clearInterval(t); }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  async function sendCmd(command) {
    if (!command?.trim()) return;
    const entry = { cmd: command, out: null, err: null, time: new Date().toLocaleTimeString() };
    setLog(l => [...l, entry]);
    setRunning(true);
    const res = await apiFetch('/admin/server/command', { method: 'POST', body: JSON.stringify({ command }) });
    const data = await res?.json();
    setLog(l => l.map((e, i) => i === l.length - 1 ? { ...entry, out: data?.result, err: data?.error } : e));
    setRunning(false);
    setCmd('');
  }

  async function uploadWorld() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadMsg(null);
    const form = new FormData();
    form.append('world', file);
    form.append('name', worldName);
    const res = await apiFetch('/admin/server/upload-world', { method: 'POST', body: form });
    const data = await res?.json();
    setUploadMsg(data);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="section-title">Server</h1>
        <p className="section-subtitle">RCON console, world management, and quick actions</p>
      </div>

      {/* Status card */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${status?.online ? 'bg-accent animate-pulse' : 'bg-red-500'}`} />
            <div>
              <div className="font-semibold text-white text-sm">{status?.online ? 'Server Online' : 'Server Offline'}</div>
              <div className="text-white/40 text-xs mt-0.5">{status?.message || 'Checking…'}</div>
            </div>
          </div>
          <button onClick={loadStatus} className="btn btn-ghost btn-sm">Refresh</button>
        </div>
      </div>

      {/* Console */}
      <div className="card p-5">
        <h2 className="font-bold text-white mb-4">RCON Console</h2>

        {/* Quick commands */}
        <div className="flex flex-wrap gap-2 mb-4">
          {QUICK_CMDS.map(q => (
            <button key={q.cmd} onClick={() => sendCmd(q.cmd)} disabled={running} className="btn btn-ghost btn-sm text-xs">
              {q.label}
            </button>
          ))}
        </div>

        {/* Log */}
        <div ref={logRef} className="console h-48 mb-3 overflow-y-auto">
          {log.length === 0 && <span className="text-white/20">Type a command below or use a quick action…</span>}
          {log.map((e, i) => (
            <div key={i} className="mb-1.5">
              <span className="text-white/30 mr-2">[{e.time}]</span>
              <span className="text-accent/70">$ {e.cmd}</span>
              {e.out && <div className="text-green-300/70 ml-4 mt-0.5 whitespace-pre-wrap">{e.out}</div>}
              {e.err && <div className="text-red-400/70 ml-4 mt-0.5">{e.err}</div>}
            </div>
          ))}
          {running && <div className="text-white/30">Running…</div>}
        </div>

        {/* Input */}
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

      {/* World upload */}
      <div className="card p-5">
        <h2 className="font-bold text-white mb-1">Upload World</h2>
        <p className="text-white/40 text-xs mb-5">
          Upload a .zip file containing a world folder. The server will be need to be restarted to load the new world.
          The existing world will be backed up automatically.
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

      {/* Gamemode presets */}
      <div className="card p-5">
        <h2 className="font-bold text-white mb-1">Gamemode Presets</h2>
        <p className="text-white/40 text-xs mb-4">Quick server configuration commands.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { label: 'Full Survival', cmds: ['defaultgamemode survival', 'difficulty normal'] },
            { label: 'Creative Server', cmds: ['defaultgamemode creative', 'difficulty peaceful'] },
            { label: 'Hard Mode', cmds: ['defaultgamemode survival', 'difficulty hard'] },
            { label: 'PvP On', cmds: ['pvp true'] },
            { label: 'PvP Off', cmds: ['pvp false'] },
            { label: 'Allow Flight', cmds: ['allow-flight true'] },
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
    </div>
  );
}
