import { NextResponse } from 'next/server';
import db from '@/lib/db.js';
import { requireAdmin } from '@/lib/auth.js';

export async function GET(request) {
  const auth = requireAdmin(request);
  if (auth.error) return NextResponse.json(auth.body, { status: auth.status });

  const purchases = db.prepare(`
    SELECT pu.*, u.minecraft_username, u.email, pr.name AS product_name, pr.color, pr.rank_name
    FROM purchases pu
    JOIN users u ON pu.user_id = u.id
    JOIN products pr ON pu.product_id = pr.id
    ORDER BY pu.created_at DESC
  `).all();

  return NextResponse.json(purchases);
}
