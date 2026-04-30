import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import db from '@/lib/db.js';
import { requireAuth } from '@/lib/auth.js';
import { makeRateLimiter, getIP } from '@/lib/rate-limit.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 10 checkout attempts per hour per IP
const limiter = makeRateLimiter({ windowMs: 60 * 60 * 1000, max: 10 });

export async function POST(request) {
  const auth = requireAuth(request);
  if (auth.error) return NextResponse.json(auth.body, { status: auth.status });

  if (!limiter(getIP(request))) {
    return NextResponse.json({ error: 'Too many checkout attempts — try again later' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const product_id = parseInt(body?.product_id, 10);

  if (!product_id || isNaN(product_id)) {
    return NextResponse.json({ error: 'Valid product ID required' }, { status: 400 });
  }

  const product = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(product_id);
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  const isSubscription = product.billing_type === 'monthly' || product.billing_type === 'yearly';
  const interval = product.billing_type === 'yearly' ? 'year' : 'month';

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: auth.user.email,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `NetzTech — ${product.name}`,
            description: product.description || undefined,
          },
          unit_amount: product.price_cents,
          ...(isSubscription ? { recurring: { interval } } : {}),
        },
        quantity: 1,
      }],
      mode: isSubscription ? 'subscription' : 'payment',
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/store`,
      metadata: {
        user_id: String(auth.user.id),
        product_id: String(product.id),
      },
    });

    db.prepare(
      'INSERT INTO purchases (user_id, product_id, stripe_session_id, amount_paid_cents, status, billing_type) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(auth.user.id, product.id, session.id, product.price_cents, 'pending', product.billing_type);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err.message);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
