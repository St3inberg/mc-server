import { NextResponse } from 'next/server';
import db from '@/lib/db.js';
import { requireAdmin } from '@/lib/auth.js';

const ALLOWED_KEYS = new Set([
  'server_ip', 'hero_badge', 'hero_heading', 'hero_subtitle',
  'features_heading', 'features_subtitle', 'features',
  'cta_title', 'cta_subtitle',
]);

export async function GET(request) {
  const auth = requireAdmin(request);
  if (auth.error) return NextResponse.json(auth.body, { status: auth.status });

  const rows = db.prepare('SELECT key, value FROM site_settings').all();
  const settings = {};
  for (const { key, value } of rows) {
    try { settings[key] = JSON.parse(value); } catch { settings[key] = value; }
  }
  return NextResponse.json(settings);
}

export async function PUT(request) {
  const auth = requireAdmin(request);
  if (auth.error) return NextResponse.json(auth.body, { status: auth.status });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const upsert = db.prepare('INSERT INTO site_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value');
  const updates = db.transaction((entries) => {
    for (const [key, value] of entries) {
      if (!ALLOWED_KEYS.has(key)) continue;
      const stored = typeof value === 'object' ? JSON.stringify(value) : String(value);
      if (stored.length > 10000) continue;
      upsert.run(key, stored);
    }
  });

  updates(Object.entries(body));
  return NextResponse.json({ ok: true });
}
