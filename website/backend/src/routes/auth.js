const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

router.post('/register', async (req, res) => {
  const { minecraft_username, email, password } = req.body;
  if (!minecraft_username || !email || !password)
    return res.status(400).json({ error: 'All fields are required' });
  if (password.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  if (!/^[a-zA-Z0-9_]{3,16}$/.test(minecraft_username))
    return res.status(400).json({ error: 'Invalid Minecraft username (3-16 chars, letters/numbers/underscores)' });

  try {
    const hash = await bcrypt.hash(password, 10);
    const result = db.prepare(
      'INSERT INTO users (minecraft_username, email, password_hash) VALUES (?, ?, ?)'
    ).run(minecraft_username.trim(), email.toLowerCase().trim(), hash);

    const token = jwt.sign({ id: result.lastInsertRowid }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: minecraft_username, is_admin: 0 });
  } catch (err) {
    if (err.message?.includes('UNIQUE')) {
      const field = err.message.includes('email') ? 'Email' : 'Minecraft username';
      return res.status(400).json({ error: `${field} is already registered` });
    }
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

  db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, username: user.minecraft_username, is_admin: user.is_admin });
});

router.get('/me', require('../middleware/auth').requireAuth, (req, res) => {
  const { password_hash, ...user } = req.user;
  res.json(user);
});

module.exports = router;
