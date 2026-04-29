import { NextResponse } from 'next/server';
import db from '@/lib/db.js';

export async function GET() {
  const products = db.prepare(
    'SELECT id,name,description,features,price_cents,billing_type,color,sort_order FROM products WHERE active=1 ORDER BY sort_order ASC'
  ).all().map(p => ({ ...p, features: JSON.parse(p.features) }));
  return NextResponse.json(products);
}
