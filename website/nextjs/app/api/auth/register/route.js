import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db.js';
import { signToken } from '@/lib/auth.js';
import { makeRateLimiter, getIP } from '@/lib/rate-limit.js';

// 5 registrations per hour per IP
const limiter = makeRateLimiter({ windowMs: 60 * 60 * 1000, max: 5 });

export async function POST(request) {
  if (!limiter(getIP(request))) {
    return NextResponse.json({ error: 'Too many registrations from this IP — try again later' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const { minecraft_username, email, password } = body;

  if (!minecraft_username || !email || !password) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }
  if (typeof minecraft_username !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
  if (password.length < 8 || password.length > 128) {
    return NextResponse.json({ error: 'Password must be 8–128 characters' }, { status: 400 });
  }
  if (!/^[a-zA-Z0-9_]{3,16}$/.test(minecraft_username)) {
    return NextResponse.json({ error: 'Invalid Minecraft username (3–16 chars, letters/numbers/underscores only)' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  try {
    const hash = await bcrypt.hash(password, 12);
    const result = db.prepare(
      'INSERT INTO users (minecraft_username, email, password_hash) VALUES (?, ?, ?)'
    ).run(minecraft_username.trim(), email.toLowerCase().trim(), hash);

    const token = signToken(result.lastInsertRowid);
    return NextResponse.json({
      token,
      user: {
        id: result.lastInsertRowid,
        minecraft_username: minecraft_username.trim(),
        email: email.toLowerCase().trim(),
        is_admin: 0,
      },
    });
  } catch (err) {
    if (err.message?.includes('UNIQUE')) {
      const field = err.message.includes('email') ? 'Email' : 'Minecraft username';
      return NextResponse.json({ error: `${field} is already registered` }, { status: 409 });
    }
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
