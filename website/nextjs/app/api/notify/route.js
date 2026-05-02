import { NextResponse } from 'next/server';
import { serverDownEmail, serverUpEmail, backupFailEmail } from '@/lib/notify.js';

const SECRET = process.env.NOTIFY_SECRET;

export async function POST(request) {
  const body = await request.json().catch(() => null);
  if (!body || body.secret !== SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  switch (body.event) {
    case 'server_down':   await serverDownEmail(); break;
    case 'server_up':     await serverUpEmail(); break;
    case 'backup_failed': await backupFailEmail(body.error || 'Unknown error'); break;
    default: return NextResponse.json({ error: 'Unknown event' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
