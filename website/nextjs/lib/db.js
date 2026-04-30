import Database from 'better-sqlite3';
import path from 'path';

const dbPath = process.env.DB_PATH || path.join(process.cwd(), '../../data/netztech.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

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

  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed default site settings
const settingCount = db.prepare('SELECT COUNT(*) as c FROM site_settings').get().c;
if (settingCount === 0) {
  const setSetting = db.prepare('INSERT OR IGNORE INTO site_settings (key, value) VALUES (?, ?)');
  setSetting.run('server_ip', 'play.playnetztech.xyz');
  setSetting.run('hero_badge', 'Server Online — Join Now');
  setSetting.run('hero_heading', 'The Ultimate Minecraft Server');
  setSetting.run('hero_subtitle', 'Survival, PvP, Factions and more — all on one high-performance server. Buy ranks, support the community, and dominate the leaderboards.');
  setSetting.run('features_heading', 'Why NetzTech?');
  setSetting.run('features_subtitle', 'Built from the ground up for a premium Minecraft experience.');
  setSetting.run('features', JSON.stringify([
    { icon: 'sword',   title: 'PvP Arenas',    desc: 'Ranked competitive combat with seasonal leaderboards and exclusive rewards.',                    color: '#ff5555' },
    { icon: 'mountain',title: 'Survival World', desc: 'Massive custom-generated world with dungeons, hidden biomes, and rare loot.',                   color: '#55ff55' },
    { icon: 'flag',    title: 'Factions',       desc: 'Build your empire, raid enemies, and claim territory across the map.',                          color: '#ffaa00' },
    { icon: 'layers',  title: 'Mini-Games',     desc: 'BedWars, SkyBlock, Spleef and more — updated every season.',                                   color: '#55ffff' },
    { icon: 'shield',  title: 'Anti-Cheat',     desc: 'Advanced protection system keeps gameplay fair for every player.',                              color: '#00ff88' },
    { icon: 'zap',     title: 'Low Latency',    desc: 'High-performance hardware keeps TPS at 20 even during peak hours.',                            color: '#aa55ff' },
  ]));
  setSetting.run('cta_title', 'Ready to play?');
  setSetting.run('cta_subtitle', 'Join thousands of players. Buy a rank to unlock exclusive perks and support the server.');
}

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
