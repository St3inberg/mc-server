const router = require('express').Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

router.post('/create-session', requireAuth, async (req, res) => {
  const { product_id } = req.body;
  if (!product_id) return res.status(400).json({ error: 'Product ID required' });

  const product = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(product_id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const isSubscription = product.billing_type === 'monthly' || product.billing_type === 'yearly';
  const interval = product.billing_type === 'yearly' ? 'year' : 'month';

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: req.user.email,
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
      success_url: `${process.env.FRONTEND_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/store.html`,
      metadata: {
        user_id: String(req.user.id),
        product_id: String(product.id),
      },
    });

    db.prepare(
      'INSERT INTO purchases (user_id, product_id, stripe_session_id, amount_paid_cents, status) VALUES (?, ?, ?, ?, ?)'
    ).run(req.user.id, product.id, session.id, product.price_cents, 'pending');

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

module.exports = router;
