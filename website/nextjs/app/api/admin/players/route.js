import { NextResponse } from 'next/server';
import db from '@/lib/db.js';
import { requireAdmin } from '@/lib/auth.js';
import { sendCommand } from '@/lib/rcon.js';

export async function GET(request) {
  const auth = requireAdmin(request);
  if (auth.error) return NextResponse.json(auth.body, { status: auth.status });

  const players = db.prepare(`
    SELECT u.id, u.minecraft_username, u.email, u.created_at, u.last_login,
           COUNT(p.id) as purchase_count,
           COALESCE(SUM(CASE WHEN p.status='completed' THEN p.amount_paid_cents ELSE 0 END),0) as total_spent
    FROM users u LEFT JOIN purchases p ON p.user_id=u.id
    GROUP BY u.id ORDER BY u.created_at DESC
  `).all();
  return NextResponse.json(players);
}

export async function POST(request) {
  const auth = requireAdmin(request);
  if (auth.error) return NextResponse.json(auth.body, { status: auth.status });

  const { action, username, reason, group, permission } = await request.json();
  if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 });

  let command;
  switch (action) {
    case 'ban':
      command = reason ? `ban ${username} ${reason}` : `ban ${username}`;
      break;
    case 'unban':
      command = `pardon ${username}`;
      break;
    case 'kick':
      command = reason ? `kick ${username} ${reason}` : `kick ${username}`;
      break;
    case 'set-group':
      if (!group) return NextResponse.json({ error: 'Group required' }, { status: 400 });
      command = `lp user ${username} parent set ${group}`;
      break;
    case 'add-permission':
      if (!permission) return NextResponse.json({ error: 'Permission required' }, { status: 400 });
      command = `lp user ${username} permission set ${permission} true`;
      break;
    case 'remove-permission':
      if (!permission) return NextResponse.json({ error: 'Permission required' }, { status: 400 });
      command = `lp user ${username} permission unset ${permission}`;
      break;
    case 'op':
      command = `op ${username}`;
      break;
    case 'deop':
      command = `deop ${username}`;
      break;
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }

  try {
    const result = await sendCommand(command);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'RCON command failed' }, { status: 502 });
  }
}
