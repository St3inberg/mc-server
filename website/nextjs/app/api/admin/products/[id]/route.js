import { NextResponse } from 'next/server';
import db from '@/lib/db.js';
import { requireAdmin } from '@/lib/auth.js';

export async function PUT(request, { params }) {
  const auth = requireAdmin(request);
  if (auth.error) return NextResponse.json(auth.body, { status: auth.status });
  const { name, description, features, price_cents, billing_type, rank_name, commands, color, sort_order, active } = await request.json();
  db.prepare(`UPDATE products SET name=?,description=?,features=?,price_cents=?,billing_type=?,rank_name=?,commands=?,color=?,sort_order=?,active=? WHERE id=?`)
    .run(name, description, JSON.stringify(features), price_cents, billing_type, rank_name, JSON.stringify(commands), color, sort_order, active, params.id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  const auth = requireAdmin(request);
  if (auth.error) return NextResponse.json(auth.body, { status: auth.status });
  db.prepare('UPDATE products SET active=0 WHERE id=?').run(params.id);
  return NextResponse.json({ ok: true });
}
