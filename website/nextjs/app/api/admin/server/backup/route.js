import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { requireAdmin } from '@/lib/auth.js';

const execAsync = promisify(exec);

export async function POST(request) {
  const auth = requireAdmin(request);
  if (auth.error) return NextResponse.json(auth.body, { status: auth.status });

  console.log(`[admin] Manual backup triggered by ${auth.user.email}`);

  const script = process.env.BACKUP_SCRIPT || '/home/azureuser/mc-server/backup-to-git.sh';

  try {
    const { stdout, stderr } = await execAsync(`bash ${script}`, { timeout: 120000 });
    return NextResponse.json({ ok: true, result: stdout || stderr || 'Backup complete' });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Backup failed' }, { status: 500 });
  }
}
