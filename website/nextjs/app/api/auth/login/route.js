import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db.js';
import { signToken } from '@/lib/auth.js';
import { makeRateLimiter, getIP } from '@/lib/rate-limit.js';

// 10 login attempts per 15 minutes per IP
const limiter = makeRateLimiter({ windowMs: 15 * 60 * 1000, max: 10 });

export async function POST(request) {
  if (!limiter(getIP(request))) {
    return NextResponse.json({ error: 'Too many login attempts — try again in 15 minutes' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.email || !body?.password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }

  const { email, password } = body;
  if (typeof email !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  // Always run bcrypt to prevent timing attacks that reveal if an email exists
  const hash = user?.password_hash || '$2a$10$invalidhashplaceholderXXXXXXXXXXXXXXXXXXXXXXXX';
  const valid = await bcrypt.compare(password, hash);

  if (!user || !valid) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
  const token = signToken(user.id);
  return NextResponse.json({
    token,
    user: { id: user.id, minecraft_username: user.minecraft_username, email: user.email, is_admin: user.is_admin },
  });
}
