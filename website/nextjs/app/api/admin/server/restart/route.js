import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { requireAdmin } from '@/lib/auth.js';
import db from '@/lib/db.js';

const execAsync = promisify(exec);

export async function POST(request) {
  const auth = requireAdmin(request);
  if (auth.error) return NextResponse.json(auth.body, { status: auth.status });

  console.warn(`[admin] Minecraft restart requested by ${auth.user.email}`);

  try {
    db.prepare('INSERT INTO command_queue (minecraft_username, command, executed) VALUES (?, ?, 1)')
      .run(`[admin:${auth.user.minecraft_username}]`, 'SERVER RESTART');
  } catch { /* non-critical */ }

  try {
    const { stdout, stderr } = await execAsync('pm2 restart minecraft');
    return NextResponse.json({ ok: true, result: stdout || stderr || 'Restarting…' });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Restart failed' }, { status: 500 });
  }
}
