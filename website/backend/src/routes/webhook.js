const router = require('express').Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../db');
const { applyPerks } = require('../rcon');

router.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleSessionCompleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaid(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(event.data.object);
        break;
    }
  } catch (err) {
    console.error(`Error handling ${event.type}:`, err);
  }

  res.json({ received: true });
});

async function handleSessionCompleted(session) {
  const purchase = db.prepare('SELECT * FROM purchases WHERE stripe_session_id = ?').get(session.id);
  if (!purchase || purchase.status === 'completed') return;

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(purchase.product_id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(purchase.user_id);

  const isSubscription = session.mode === 'subscription';
  const expiresAt = isSubscription
    ? new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString()
    : null;

  db.prepare(`
    UPDATE purchases
    SET status = 'completed', stripe_payment_intent_id = ?, stripe_subscription_id = ?,
        expires_at = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(session.payment_intent || null, session.subscription || null, expiresAt, purchase.id);

  const commands = JSON.parse(product.commands || '[]');
  if (commands.length > 0) {
    await applyPerks(purchase.id, user.minecraft_username, commands);
  }
}

async function handleInvoicePaid(invoice) {
  if (!invoice.subscription) return;
  const purchase = db.prepare(
    'SELECT * FROM purchases WHERE stripe_subscription_id = ?'
  ).get(invoice.subscription);
  if (!purchase) return;

  // Extend expiry by 31 days from now on renewal
  const newExpiry = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare(
    'UPDATE purchases SET expires_at = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(newExpiry, 'completed', purchase.id);
}

async function handleSubscriptionCancelled(subscription) {
  const purchase = db.prepare(`
    SELECT pu.*, u.minecraft_username, pr.rank_name
    FROM purchases pu
    JOIN users u ON pu.user_id = u.id
    JOIN products pr ON pu.product_id = pr.id
    WHERE pu.stripe_subscription_id = ?
  `).get(subscription.id);
  if (!purchase) return;

  db.prepare(
    "UPDATE purchases SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).run(purchase.id);

  if (purchase.rank_name) {
    await applyPerks(purchase.id, purchase.minecraft_username, [
      `lp user {player} parent remove ${purchase.rank_name}`,
    ]);
  }
}

module.exports = router;
