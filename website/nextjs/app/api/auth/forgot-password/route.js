import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { Resend } from 'resend';
import db from '@/lib/db.js';
import { makeRateLimiter, getIP } from '@/lib/rate-limit.js';

// 3 attempts per hour per IP — prevent email flooding
const limiter = makeRateLimiter({ windowMs: 60 * 60 * 1000, max: 3 });

export async function POST(request) {
  if (!limiter(getIP(request))) {
    return NextResponse.json({ error: 'Too many requests — try again later' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.toLowerCase().trim() : null;

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  // Always return success to prevent email enumeration
  const user = db.prepare('SELECT id, email, minecraft_username FROM users WHERE email = ?').get(email);
  if (!user) {
    return NextResponse.json({ ok: true });
  }

  // Expire any existing tokens for this user
  db.prepare('UPDATE password_reset_tokens SET used=1 WHERE user_id=? AND used=0').run(user.id);

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  db.prepare(
    'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)'
  ).run(user.id, token, expiresAt);

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: `NetzTech <noreply@playnetztech.xyz>`,
      to: user.email,
      subject: 'Reset your NetzTech password',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#07070f;color:#fff;padding:32px;border-radius:12px;">
          <h2 style="color:#00ff88;margin:0 0 8px;">Password Reset</h2>
          <p style="color:#aaa;margin:0 0 24px;">Hey ${user.minecraft_username}, someone requested a password reset for your NetzTech account.</p>
          <a href="${resetUrl}" style="display:inline-block;background:#00ff88;color:#07070f;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;margin-bottom:24px;">
            Reset Password
          </a>
          <p style="color:#555;font-size:13px;margin:0;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
          <hr style="border:none;border-top:1px solid #1a1a2e;margin:24px 0;" />
          <p style="color:#333;font-size:12px;margin:0;">NetzTech — playnetztech.xyz</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Reset email error:', err.message);
    // Don't expose email errors to the client
  }

  return NextResponse.json({ ok: true });
}
