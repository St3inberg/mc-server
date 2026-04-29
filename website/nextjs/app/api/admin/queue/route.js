import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth.js';
import { flushQueue } from '@/lib/rcon.js';

export async function POST(request) {
  const auth = requireAdmin(request);
  if (auth.error) return NextResponse.json(auth.body, { status: auth.status });
  await flushQueue();
  return NextResponse.json({ ok: true });
}
