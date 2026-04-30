import { NextResponse } from 'next/server';
import db from '@/lib/db.js';

export async function GET() {
  const rows = db.prepare('SELECT key, value FROM site_settings').all();
  const settings = {};
  for (const { key, value } of rows) {
    try { settings[key] = JSON.parse(value); } catch { settings[key] = value; }
  }
  return NextResponse.json(settings);
}
