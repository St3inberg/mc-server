import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db.js';
import { signToken } from '@/lib/auth.js';

export async function POST(request) {
  const { email, password } = await request.json();
  if (!email || !password)
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

  db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
  const token = signToken(user.id);
  return NextResponse.json({
    token,
    user: { id: user.id, minecraft_username: user.minecraft_username, email: user.email, is_admin: user.is_admin },
  });
}
