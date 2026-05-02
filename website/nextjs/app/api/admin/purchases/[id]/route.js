import { NextResponse } from 'next/server';
import db from '@/lib/db.js';
import { requireAdmin } from '@/lib/auth.js';
import { applyPerks } from '@/lib/rcon.js';

export async function PATCH(request, { params }) {
  const auth = requireAdmin(request);
  if (auth.error) return NextResponse.json(auth.body, { status: auth.status });

  const { action } = await request.json().catch(() => ({}));
  const id = parseInt(params.id, 10);

  const purchase = db.prepare(`
    SELECT pu.*, u.minecraft_username, pr.rank_name, pr.commands
    FROM purchases pu
    JOIN users u ON pu.user_id = u.id
    JOIN products pr ON pu.product_id = pr.id
    WHERE pu.id = ?
  `).get(id);

  if (!purchase) return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });

  if (action === 'cancel') {
    db.prepare("UPDATE purchases SET status='cancelled', updated_at=CURRENT_TIMESTAMP WHERE id=?").run(id);
    if (purchase.rank_name) {
      await applyPerks(id, purchase.minecraft_username, [
        `lp user {player} parent remove ${purchase.rank_name}`,
      ]);
    }
    return NextResponse.json({ ok: true });
  }

  if (action === 'redeliver') {
    const commands = JSON.parse(purchase.commands || '[]');
    if (commands.length > 0) {
      db.prepare("UPDATE purchases SET status='completed', perks_applied=0, updated_at=CURRENT_TIMESTAMP WHERE id=?").run(id);
      await applyPerks(id, purchase.minecraft_username, commands);
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

export async function DELETE(request, { params }) {
  const auth = requireAdmin(request);
  if (auth.error) return NextResponse.json(auth.body, { status: auth.status });

  const id = parseInt(params.id, 10);
  db.prepare('DELETE FROM command_queue WHERE purchase_id = ?').run(id);
  db.prepare('DELETE FROM purchases WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}
