import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth.js';

export async function GET(request) {
  const auth = requireAuth(request);
  if (auth.error) return NextResponse.json(auth.body, { status: auth.status });
  const { password_hash, ...user } = auth.user;
  return NextResponse.json(user);
}
