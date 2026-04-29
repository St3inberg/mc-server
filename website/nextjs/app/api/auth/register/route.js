import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db.js';
import { signToken } from '@/lib/auth.js';

export async function POST(request) {
  const { minecraft_username, email, password } = await request.json();
  if (!minecraft_username || !email || !password)
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  if (password.length < 8)
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  if (!/^[a-zA-Z0-9_]{3,16}$/.test(minecraft_username))
    return NextResponse.json({ error: 'Invalid Minecraft username (3-16 chars, letters/numbers/underscores)' }, { status: 400 });

  try {
    const hash = await bcrypt.hash(password, 10);
    const result = db.prepare(
      'INSERT INTO users (minecraft_username, email, password_hash) VALUES (?, ?, ?)'
    ).run(minecraft_username.trim(), email.toLowerCase().trim(), hash);

    const token = signToken(result.lastInsertRowid);
    return NextResponse.json({
      token,
      user: { id: result.lastInsertRowid, minecraft_username: minecraft_username.trim(), email: email.toLowerCase().trim(), is_admin: 0 },
    });
  } catch (err) {
    if (err.message?.includes('UNIQUE')) {
      const field = err.message.includes('email') ? 'Email' : 'Minecraft username';
      return NextResponse.json({ error: `${field} is already registered` }, { status: 400 });
    }
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
