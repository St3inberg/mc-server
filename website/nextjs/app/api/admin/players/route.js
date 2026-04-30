import { NextResponse } from 'next/server';
import db from '@/lib/db.js';
import { requireAdmin } from '@/lib/auth.js';
import { sendCommand } from '@/lib/rcon.js';
import { makeRateLimiter, getIP } from '@/lib/rate-limit.js';

const limiter = makeRateLimiter({ windowMs: 60 * 1000, max: 30 });

const VALID_ACTIONS = ['ban', 'unban', 'kick', 'set-group', 'add-permission', 'remove-permission', 'op', 'deop'];
const MC_USERNAME_RE = /^[a-zA-Z0-9_]{1,16}$/;
const GROUP_RE       = /^[a-zA-Z0-9_-]{1,32}$/;
const PERM_RE        = /^[a-zA-Z0-9._*-]{1,64}$/;

export async function GET(request) {
  const auth = requireAdmin(request);
  if (auth.error) return NextResponse.json(auth.body, { status: auth.status });

  const players = db.prepare(`
    SELECT u.id, u.minecraft_username, u.email, u.is_admin, u.created_at, u.last_login,
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

  if (!limiter(getIP(request))) {
    return NextResponse.json({ error: 'Too many actions — slow down' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const { action, username, reason, group, permission } = body;

  if (!VALID_ACTIONS.includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
  if (!username || !MC_USERNAME_RE.test(username)) {
    return NextResponse.json({ error: 'Invalid Minecraft username' }, { status: 400 });
  }
  if (reason && (typeof reason !== 'string' || reason.length > 128)) {
    return NextResponse.json({ error: 'Reason too long' }, { status: 400 });
  }
  if (group && !GROUP_RE.test(group)) {
    return NextResponse.json({ error: 'Invalid group name' }, { status: 400 });
  }
  if (permission && !PERM_RE.test(permission)) {
    return NextResponse.json({ error: 'Invalid permission node' }, { status: 400 });
  }

  // Sanitised reason (strip special chars that could break RCON)
  const safeReason = reason?.replace(/[;"'`]/g, '').trim();

  let command;
  switch (action) {
    case 'ban':          command = safeReason ? `ban ${username} ${safeReason}` : `ban ${username}`; break;
    case 'unban':        command = `pardon ${username}`; break;
    case 'kick':         command = safeReason ? `kick ${username} ${safeReason}` : `kick ${username}`; break;
    case 'set-group':    command = `lp user ${username} parent set ${group}`; break;
    case 'add-permission':    command = `lp user ${username} permission set ${permission} true`; break;
    case 'remove-permission': command = `lp user ${username} permission unset ${permission}`; break;
    case 'op':           command = `op ${username}`; break;
    case 'deop':         command = `deop ${username}`; break;
  }

  console.log(`[admin-player] ${auth.user.email} → ${action} ${username}`);

  try {
    const result = await sendCommand(command);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'RCON command failed' }, { status: 502 });
  }
}
