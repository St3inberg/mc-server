import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db.js';
import { makeRateLimiter, getIP } from '@/lib/rate-limit.js';

const limiter = makeRateLimiter({ windowMs: 60 * 60 * 1000, max: 10 });

export async function POST(request) {
  if (!limiter(getIP(request))) {
    return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const { token, password } = body || {};

  if (!token || typeof token !== 'string' || token.length !== 64) {
    return NextResponse.json({ error: 'Invalid reset link' }, { status: 400 });
  }
  if (!password || typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return NextResponse.json({ error: 'Password must be 8–128 characters' }, { status: 400 });
  }

  const row = db.prepare(`
    SELECT t.id, t.user_id, t.used, t.expires_at
    FROM password_reset_tokens t
    WHERE t.token = ?
  `).get(token);

  if (!row || row.used || new Date(row.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Reset link is invalid or has expired' }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 12);

  db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(hash, row.user_id);
  db.prepare('UPDATE password_reset_tokens SET used=1 WHERE id=?').run(row.id);

  return NextResponse.json({ ok: true });
}
