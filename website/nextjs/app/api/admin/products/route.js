import { NextResponse } from 'next/server';
import db from '@/lib/db.js';
import { requireAdmin } from '@/lib/auth.js';

export async function GET(request) {
  const auth = requireAdmin(request);
  if (auth.error) return NextResponse.json(auth.body, { status: auth.status });
  const products = db.prepare('SELECT * FROM products ORDER BY sort_order ASC').all()
    .map(p => ({ ...p, features: JSON.parse(p.features), commands: JSON.parse(p.commands || '[]') }));
  return NextResponse.json(products);
}

export async function POST(request) {
  const auth = requireAdmin(request);
  if (auth.error) return NextResponse.json(auth.body, { status: auth.status });
  const { name, description, features, price_cents, billing_type, rank_name, commands, color, sort_order } = await request.json();
  if (!name || !price_cents) return NextResponse.json({ error: 'Name and price required' }, { status: 400 });
  const result = db.prepare(
    'INSERT INTO products (name,description,features,price_cents,billing_type,rank_name,commands,color,sort_order) VALUES (?,?,?,?,?,?,?,?,?)'
  ).run(name, description||'', JSON.stringify(features||[]), price_cents, billing_type||'one_time', rank_name||'', JSON.stringify(commands||[]), color||'#00ff88', sort_order||0);
  return NextResponse.json({ id: result.lastInsertRowid });
}
