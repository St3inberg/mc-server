const router = require('express').Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, (req, res) => {
  const { password_hash, ...user } = req.user;
  const purchases = db.prepare(`
    SELECT pu.id, pu.status, pu.perks_applied, pu.billing_type, pu.expires_at, pu.created_at,
           pr.name as product_name, pr.color, pr.billing_type
    FROM purchases pu
    JOIN products pr ON pu.product_id = pr.id
    WHERE pu.user_id = ? AND pu.status IN ('completed', 'active')
    ORDER BY pu.created_at DESC
  `).all(req.user.id);
  res.json({ user, purchases });
});

module.exports = router;
