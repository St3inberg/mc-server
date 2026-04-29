import { NextResponse } from 'next/server';
import db from '@/lib/db.js';
import { requireAdmin } from '@/lib/auth.js';

export async function GET(request) {
  const auth = requireAdmin(request);
  if (auth.error) return NextResponse.json(auth.body, { status: auth.status });

  const users = db.prepare(
    'SELECT id,minecraft_username,email,is_admin,created_at,last_login FROM users ORDER BY created_at DESC'
  ).all();
  return NextResponse.json(users);
}

export async function PATCH(request) {
  const auth = requireAdmin(request);
  if (auth.error) return NextResponse.json(auth.body, { status: auth.status });

  const { id, is_admin } = await request.json();
  if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  db.prepare('UPDATE users SET is_admin=? WHERE id=?').run(is_admin ? 1 : 0, id);
  return NextResponse.json({ ok: true });
}
