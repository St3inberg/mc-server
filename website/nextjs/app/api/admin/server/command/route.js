import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth.js';
import { sendCommand } from '@/lib/rcon.js';
import { makeRateLimiter, getIP } from '@/lib/rate-limit.js';
import db from '@/lib/db.js';

// 60 commands per minute per admin
const limiter = makeRateLimiter({ windowMs: 60 * 1000, max: 60 });

// Commands that require a stop (could take down the server)
const DESTRUCTIVE = ['stop', 'restart', 'reload'];

function sanitiseCommand(cmd) {
  // Strip null bytes and control characters
  return cmd.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '').trim();
}

export async function POST(request) {
  const auth = requireAdmin(request);
  if (auth.error) return NextResponse.json(auth.body, { status: auth.status });

  if (!limiter(getIP(request))) {
    return NextResponse.json({ error: 'Too many commands — slow down' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.command) return NextResponse.json({ error: 'Command required' }, { status: 400 });

  const raw = String(body.command);
  if (raw.length > 256) return NextResponse.json({ error: 'Command too long (max 256 chars)' }, { status: 400 });

  const command = sanitiseCommand(raw);
  if (!command) return NextResponse.json({ error: 'Invalid command' }, { status: 400 });

  const base = command.split(' ')[0].toLowerCase();
  if (DESTRUCTIVE.includes(base)) {
    // Log destructive commands with the admin's info
    console.warn(`[admin-cmd] DESTRUCTIVE command "${command}" by user ${auth.user.id} (${auth.user.email})`);
  }

  // Audit log to DB
  try {
    db.prepare(
      'INSERT INTO command_queue (minecraft_username, command, executed) VALUES (?, ?, 1)'
    ).run(`[admin:${auth.user.minecraft_username}]`, `RCON: ${command}`);
  } catch { /* non-critical */ }

  try {
    const result = await sendCommand(command);
    return NextResponse.json({ ok: true, result: result || '(no output)' });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'RCON unavailable — is the server online?' }, { status: 502 });
  }
}
