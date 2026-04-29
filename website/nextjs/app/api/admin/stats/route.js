import { NextResponse } from 'next/server';
import db from '@/lib/db.js';
import { requireAdmin } from '@/lib/auth.js';

export async function GET(request) {
  const auth = requireAdmin(request);
  if (auth.error) return NextResponse.json(auth.body, { status: auth.status });

  const totalRevenue = db.prepare("SELECT COALESCE(SUM(amount_paid_cents),0) as t FROM purchases WHERE status='completed'").get().t;
  const totalUsers = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  const totalPurchases = db.prepare("SELECT COUNT(*) as c FROM purchases WHERE status='completed'").get().c;
  const pendingQueue = db.prepare('SELECT COUNT(*) as c FROM command_queue WHERE executed=0').get().c;

  const recentPurchases = db.prepare(`
    SELECT pu.id, pu.amount_paid_cents, pu.status, pu.created_at, pu.perks_applied,
           u.minecraft_username, u.email, pr.name as product_name, pr.color
    FROM purchases pu JOIN users u ON pu.user_id=u.id JOIN products pr ON pu.product_id=pr.id
    ORDER BY pu.created_at DESC LIMIT 25
  `).all();

  const revenueByDay = db.prepare(`
    SELECT date(created_at) as day, SUM(amount_paid_cents) as total
    FROM purchases WHERE status='completed' AND created_at >= date('now','-30 days')
    GROUP BY day ORDER BY day ASC
  `).all();

  return NextResponse.json({ totalRevenue, totalUsers, totalPurchases, pendingQueue, recentPurchases, revenueByDay });
}
