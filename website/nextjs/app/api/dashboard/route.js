import { NextResponse } from 'next/server';
import db from '@/lib/db.js';
import { requireAuth } from '@/lib/auth.js';

export async function GET(request) {
  const auth = requireAuth(request);
  if (auth.error) return NextResponse.json(auth.body, { status: auth.status });
  const { password_hash, ...user } = auth.user;
  const purchases = db.prepare(`
    SELECT pu.id, pu.status, pu.perks_applied, pu.billing_type, pu.expires_at, pu.created_at,
           pr.name as product_name, pr.color
    FROM purchases pu JOIN products pr ON pu.product_id=pr.id
    WHERE pu.user_id=? AND pu.status IN ('completed','active')
    ORDER BY pu.created_at DESC
  `).all(auth.user.id);
  return NextResponse.json({ user, purchases });
}
