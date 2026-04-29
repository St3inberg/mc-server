const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../../../data/netztech.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    minecraft_username TEXT UNIQUE NOT NULL COLLATE NOCASE,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_admin INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    features TEXT NOT NULL DEFAULT '[]',
    price_cents INTEGER NOT NULL,
    billing_type TEXT NOT NULL DEFAULT 'one_time',
    rank_name TEXT,
    commands TEXT DEFAULT '[]',
    color TEXT DEFAULT '#00ff88',
    sort_order INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    stripe_session_id TEXT UNIQUE,
    stripe_payment_intent_id TEXT,
    stripe_subscription_id TEXT,
    amount_paid_cents INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    perks_applied INTEGER DEFAULT 0,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS command_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_id INTEGER REFERENCES purchases(id),
    minecraft_username TEXT NOT NULL,
    command TEXT NOT NULL,
    executed INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    last_attempt DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed default products if store is empty
const productCount = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
if (productCount === 0) {
  const insert = db.prepare(`
    INSERT INTO products (name, description, features, price_cents, billing_type, rank_name, commands, color, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insert.run('VIP', 'Entry-level supporter rank',
    JSON.stringify(['Custom [VIP] prefix in chat', 'Colored chat messages', '/nick command', '3 set-home locations', 'Access to VIP lounge area']),
    500, 'one_time', 'vip',
    JSON.stringify(['lp user {player} parent set vip']),
    '#55ff55', 1);

  insert.run('VIP+', 'Enhanced supporter rank',
    JSON.stringify(['Custom [VIP+] prefix in chat', 'Colored + bold chat', '/nick command', '6 set-home locations', 'Particle trail effects', 'Priority join queue']),
    1000, 'one_time', 'vip_plus',
    JSON.stringify(['lp user {player} parent set vip_plus']),
    '#00ff88', 2);

  insert.run('MVP', 'Premium supporter rank',
    JSON.stringify(['Custom [MVP] prefix in chat', 'All chat colors + bold', '/nick command', '10 set-home locations', 'All particle effects', 'Priority join queue', 'Custom join/leave message']),
    2000, 'one_time', 'mvp',
    JSON.stringify(['lp user {player} parent set mvp']),
    '#55ffff', 3);

  insert.run('MVP Monthly', 'Monthly MVP subscription — cancel anytime',
    JSON.stringify(['All MVP perks included', 'Monthly exclusive cosmetics', 'Early access to new game modes', 'Supporter badge on website']),
    500, 'monthly', 'mvp',
    JSON.stringify(['lp user {player} parent set mvp']),
    '#ff55ff', 4);
}

module.exports = db;
