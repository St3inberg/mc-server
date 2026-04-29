const router = require('express').Router();
const db = require('../db');

router.get('/', (req, res) => {
  const products = db.prepare(
    'SELECT id, name, description, features, price_cents, billing_type, color, sort_order FROM products WHERE active = 1 ORDER BY sort_order ASC'
  ).all().map(p => ({ ...p, features: JSON.parse(p.features) }));
  res.json(products);
});

module.exports = router;
