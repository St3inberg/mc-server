import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth.js';
import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';

const MC_DIR = process.env.MC_DIR || path.join(process.cwd(), '../../minecraft');

export async function POST(request) {
  const auth = requireAdmin(request);
  if (auth.error) return NextResponse.json(auth.body, { status: auth.status });

  try {
    const formData = await request.formData();
    const file = formData.get('world');
    const worldName = (formData.get('name') || 'world').replace(/[^a-zA-Z0-9_-]/g, '');

    if (!file || typeof file === 'string')
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    const zip = new AdmZip(buffer);
    const destPath = path.join(MC_DIR, worldName);

    // Backup existing world
    if (fs.existsSync(destPath)) {
      const backupPath = `${destPath}.backup.${Date.now()}`;
      fs.renameSync(destPath, backupPath);
    }

    fs.mkdirSync(destPath, { recursive: true });
    zip.extractAllTo(destPath, true);

    return NextResponse.json({ ok: true, message: `World "${worldName}" uploaded. Restart the MC server to apply.` });
  } catch (err) {
    console.error('World upload error:', err);
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 });
  }
}
