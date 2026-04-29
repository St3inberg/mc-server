import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth.js';
import { getServerStatus } from '@/lib/rcon.js';

export async function GET(request) {
  const auth = requireAdmin(request);
  if (auth.error) return NextResponse.json(auth.body, { status: auth.status });
  const status = await getServerStatus();
  return NextResponse.json(status);
}
