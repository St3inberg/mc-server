import Database from 'better-sqlite3';
import path from 'path';

const dbPath = process.env.DB_PATH || path.join(process.cwd(), '../../data/netztech.db');
const db = new Database(dbPath);
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
    billing_type TEXT,
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

const productCount = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
if (productCount === 0) {
  const ins = db.prepare(
    'INSERT INTO products (name,description,features,price_cents,billing_type,rank_name,commands,color,sort_order) VALUES (?,?,?,?,?,?,?,?,?)'
  );
  ins.run('VIP','Entry-level supporter rank',JSON.stringify(['Custom [VIP] prefix','Colored chat','/nick command','3 set-home locations','VIP lounge access']),500,'one_time','vip',JSON.stringify(['lp user {player} parent set vip']),'#55ff55',1);
  ins.run('VIP+','Enhanced supporter rank',JSON.stringify(['Custom [VIP+] prefix','Bold + colored chat','/nick command','6 set-home locations','Particle effects','Priority join queue']),1000,'one_time','vip_plus',JSON.stringify(['lp user {player} parent set vip_plus']),'#00ff88',2);
  ins.run('MVP','Premium supporter rank',JSON.stringify(['Custom [MVP] prefix','All chat colors + bold','/nick command','10 set-home locations','All particle effects','Priority queue','Custom join/leave message']),2000,'one_time','mvp',JSON.stringify(['lp user {player} parent set mvp']),'#55ffff',3);
  ins.run('MVP Monthly','Monthly MVP — cancel anytime',JSON.stringify(['All MVP perks','Monthly exclusive cosmetics','Early game-mode access','Supporter badge on website']),500,'monthly','mvp',JSON.stringify(['lp user {player} parent set mvp']),'#ff55ff',4);
}

export default db;
