import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth.js';
import { sendCommand } from '@/lib/rcon.js';

export async function POST(request) {
  const auth = requireAdmin(request);
  if (auth.error) return NextResponse.json(auth.body, { status: auth.status });

  const { command } = await request.json();
  if (!command?.trim()) return NextResponse.json({ error: 'Command required' }, { status: 400 });

  try {
    const result = await sendCommand(command.trim());
    return NextResponse.json({ ok: true, result: result || '(no output)' });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'RCON unavailable' }, { status: 502 });
  }
}
