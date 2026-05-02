import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth.js';
import { flushQueue } from '@/lib/rcon.js';
import db from '@/lib/db.js';

export async function GET(request) {
  const auth = requireAdmin(request);
  if (auth.error) return NextResponse.json(auth.body, { status: auth.status });
  const items = db.prepare(
    'SELECT * FROM command_queue ORDER BY created_at DESC LIMIT 100'
  ).all();
  return NextResponse.json(items);
}

export async function POST(request) {
  const auth = requireAdmin(request);
  if (auth.error) return NextResponse.json(auth.body, { status: auth.status });

  const body = await request.json().catch(() => ({}));

  if (body.reset_failed) {
    // Reset attempts on all failed items so they retry
    db.prepare(
      'UPDATE command_queue SET attempts = 0 WHERE executed = 0 AND attempts >= 50'
    ).run();
  }

  await flushQueue();
  return NextResponse.json({ ok: true });
}
