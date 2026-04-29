#!/usr/bin/env bash
set -e

echo ""
echo "╔══════════════════════════════════════╗"
echo "║       NetzTech Server Setup          ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── System dependencies (Fedora/RHEL) ──────────────────────────────────────
if command -v dnf &>/dev/null; then
  echo "→ Installing system packages..."
  sudo dnf install -y java-21-openjdk nodejs npm nginx certbot python3-certbot-nginx
fi

# ── PM2 process manager ────────────────────────────────────────────────────
echo "→ Installing PM2..."
sudo npm install -g pm2

# ── Backend npm packages ───────────────────────────────────────────────────
echo "→ Installing backend dependencies..."
cd "$(dirname "$0")/website/backend"
npm install
cd "$(dirname "$0")"

# ── Data directory for SQLite ──────────────────────────────────────────────
mkdir -p data
chmod 700 data

# ── Minecraft server ───────────────────────────────────────────────────────
echo "→ Setting up Minecraft server..."
mkdir -p minecraft/plugins
chmod +x minecraft/start.sh
echo "eula=true" > minecraft/eula.txt

if [ ! -f minecraft/paper.jar ]; then
  echo ""
  echo "  Download Paper 1.21.4 from: https://papermc.io/downloads/paper"
  echo "  Save as: $(pwd)/minecraft/paper.jar"
  echo ""
  read -rp "  Press Enter after placing paper.jar..."
fi

# ── Environment config ─────────────────────────────────────────────────────
if [ ! -f website/backend/.env ]; then
  cp website/backend/.env.example website/backend/.env
  echo ""
  echo "  !! Created website/backend/.env from template"
fi

# ── Nginx ──────────────────────────────────────────────────────────────────
echo "→ Installing Nginx config..."
sudo cp nginx/netztech.conf /etc/nginx/conf.d/netztech.conf
sudo nginx -t

echo ""
echo "╔══════════════════════════════════════╗"
echo "║         Setup Complete!              ║"
echo "╚══════════════════════════════════════╝"
echo ""
echo "REQUIRED — edit website/backend/.env:"
echo "  JWT_SECRET      → openssl rand -hex 32"
echo "  STRIPE_SECRET_KEY    → stripe.com/dashboard → API keys"
echo "  STRIPE_WEBHOOK_SECRET → stripe.com/dashboard → Webhooks"
echo "  RCON_PASSWORD   → must match minecraft/server.properties"
echo "  FRONTEND_URL    → your domain, e.g. https://netztech.net"
echo ""
echo "NEXT STEPS:"
echo "  1.  Edit .env (see above)"
echo "  2.  Download LuckPerms: https://luckperms.net"
echo "      Place in minecraft/plugins/"
echo "  3.  Start Minecraft:  cd minecraft && ./start.sh"
echo "  4.  Start web server: pm2 start website/backend/src/index.js --name netztech"
echo "  5.  Router port forwarding:"
echo "      TCP 25565 → this machine (Minecraft)"
echo "      TCP 80, 443 → this machine (website)"
echo "  6.  Point your domain DNS A record to your public IP"
echo "  7.  Get SSL cert: sudo certbot --nginx -d netztech.net -d www.netztech.net"
echo "  8.  Enable + start Nginx: sudo systemctl enable --now nginx"
echo "  9.  Stripe webhook:"
echo "      URL: https://yourdomain.com/api/webhook/stripe"
echo "      Events: checkout.session.completed"
echo "              invoice.payment_succeeded"
echo "              customer.subscription.deleted"
echo " 10.  Make yourself admin (first-time):"
echo "      Register on the site, then run:"
echo "      cd website/backend && node -e \\"
echo "        \"const db=require('./src/db');db.prepare('UPDATE users SET is_admin=1 WHERE email=?').run('your@email.com')\""
echo ""
echo "LuckPerms groups to create in-game:"
echo "  /lp creategroup vip"
echo "  /lp creategroup vip_plus"
echo "  /lp creategroup mvp"
echo "  (then set permissions per group with /lp group <name> permission set <perm> true)"
echo ""
