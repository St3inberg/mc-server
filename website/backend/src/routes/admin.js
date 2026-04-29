const router = require('express').Router();
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

router.get('/stats', requireAdmin, (req, res) => {
  const totalRevenue = db.prepare(
    "SELECT COALESCE(SUM(amount_paid_cents), 0) as total FROM purchases WHERE status = 'completed'"
  ).get().total;
  const totalUsers = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  const totalPurchases = db.prepare(
    "SELECT COUNT(*) as c FROM purchases WHERE status = 'completed'"
  ).get().c;
  const recentPurchases = db.prepare(`
    SELECT pu.id, pu.amount_paid_cents, pu.status, pu.created_at,
           u.minecraft_username, u.email,
           pr.name as product_name
    FROM purchases pu
    JOIN users u ON pu.user_id = u.id
    JOIN products pr ON pu.product_id = pr.id
    ORDER BY pu.created_at DESC LIMIT 25
  `).all();
  res.json({ totalRevenue, totalUsers, totalPurchases, recentPurchases });
});

router.get('/users', requireAdmin, (req, res) => {
  const users = db.prepare(
    'SELECT id, minecraft_username, email, is_admin, created_at, last_login FROM users ORDER BY created_at DESC'
  ).all();
  res.json(users);
});

router.get('/products', requireAdmin, (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY sort_order ASC').all()
    .map(p => ({ ...p, features: JSON.parse(p.features), commands: JSON.parse(p.commands || '[]') }));
  res.json(products);
});

router.post('/products', requireAdmin, (req, res) => {
  const { name, description, features, price_cents, billing_type, rank_name, commands, color, sort_order } = req.body;
  if (!name || !price_cents) return res.status(400).json({ error: 'Name and price are required' });
  const result = db.prepare(`
    INSERT INTO products (name, description, features, price_cents, billing_type, rank_name, commands, color, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name, description || '', JSON.stringify(features || []), price_cents,
    billing_type || 'one_time', rank_name || '', JSON.stringify(commands || []),
    color || '#00ff88', sort_order || 0
  );
  res.json({ id: result.lastInsertRowid });
});

router.put('/products/:id', requireAdmin, (req, res) => {
  const { name, description, features, price_cents, billing_type, rank_name, commands, color, sort_order, active } = req.body;
  db.prepare(`
    UPDATE products SET name=?, description=?, features=?, price_cents=?, billing_type=?,
    rank_name=?, commands=?, color=?, sort_order=?, active=? WHERE id=?
  `).run(
    name, description, JSON.stringify(features), price_cents, billing_type,
    rank_name, JSON.stringify(commands), color, sort_order, active, req.params.id
  );
  res.json({ ok: true });
});

router.post('/users/:id/make-admin', requireAdmin, (req, res) => {
  db.prepare('UPDATE users SET is_admin = 1 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

router.post('/queue/flush', requireAdmin, async (req, res) => {
  const { flushQueue } = require('../rcon');
  await flushQueue();
  res.json({ ok: true });
});

module.exports = router;
