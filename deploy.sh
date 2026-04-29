#!/usr/bin/env bash
# Run this on your server AFTER uploading the project files
# Works on Ubuntu (Azure, Oracle, Hetzner, etc.)
# Usage: bash deploy.sh
set -e

DOMAIN="playnetztech.xyz"
APP_DIR="$HOME/mc-server"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║     NetzTech Deployment Script       ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── System updates ──────────────────────────────────────────────────────────
echo "→ Updating system packages..."
sudo apt-get update -qq
sudo apt-get upgrade -y -qq

# ── Java 21 ─────────────────────────────────────────────────────────────────
echo "→ Installing Java 21..."
sudo apt-get install -y -qq openjdk-21-jre-headless
java -version

# ── Node.js 20 LTS ───────────────────────────────────────────────────────────
echo "→ Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y -qq nodejs
node -v

# ── Nginx + Certbot ──────────────────────────────────────────────────────────
echo "→ Installing Nginx and Certbot..."
sudo apt-get install -y -qq nginx certbot python3-certbot-nginx

# ── PM2 ──────────────────────────────────────────────────────────────────────
echo "→ Installing PM2..."
sudo npm install -g pm2 --quiet

# ── Oracle Cloud firewall (iptables) ─────────────────────────────────────────
echo "→ Opening firewall ports..."
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 25565 -j ACCEPT
sudo netfilter-persistent save 2>/dev/null || sudo apt-get install -y -qq iptables-persistent

# ── Backend npm packages ──────────────────────────────────────────────────────
echo "→ Installing backend dependencies..."
cd "$APP_DIR/website/backend"
npm install --omit=dev

# ── Environment file ──────────────────────────────────────────────────────────
if [ ! -f "$APP_DIR/website/backend/.env" ]; then
  cp "$APP_DIR/website/backend/.env.example" "$APP_DIR/website/backend/.env"
  echo ""
  echo "  !! .env file created — you MUST fill it in before starting the app"
  echo "  !! Run: nano $APP_DIR/website/backend/.env"
  echo ""
fi

# ── Data directory ────────────────────────────────────────────────────────────
mkdir -p "$APP_DIR/data"
chmod 700 "$APP_DIR/data"

# ── Nginx config ──────────────────────────────────────────────────────────────
echo "→ Setting up Nginx..."
sudo cp "$APP_DIR/nginx/netztech.conf" /etc/nginx/conf.d/playnetztech.conf
# Disable default site
sudo rm -f /etc/nginx/sites-enabled/default

# Temp HTTP-only config so certbot can verify the domain
sudo tee /etc/nginx/conf.d/playnetztech.conf > /dev/null <<'NGINX'
server {
    listen 80;
    server_name playnetztech.xyz www.playnetztech.xyz;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_request_buffering off;
    }
}
NGINX

sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

# ── SSL certificate ───────────────────────────────────────────────────────────
echo ""
echo "→ Getting SSL certificate for $DOMAIN..."
echo "  (Make sure your DNS A records are pointing to this server's IP first!)"
echo ""
sudo certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email

# Replace temp nginx config with full SSL config
sudo cp "$APP_DIR/nginx/netztech.conf" /etc/nginx/conf.d/playnetztech.conf
sudo nginx -t
sudo systemctl reload nginx

# ── Minecraft setup ───────────────────────────────────────────────────────────
echo ""
echo "→ Setting up Minecraft server..."
mkdir -p "$APP_DIR/minecraft/plugins"
chmod +x "$APP_DIR/minecraft/start.sh"
echo "eula=true" > "$APP_DIR/minecraft/eula.txt"

if [ ! -f "$APP_DIR/minecraft/paper.jar" ]; then
  echo ""
  echo "  Downloading Paper 1.21.4..."
  PAPER_BUILD=$(curl -s "https://api.papermc.io/v2/projects/paper/versions/1.21.4" | python3 -c "import sys,json; print(json.load(sys.stdin)['builds'][-1])")
  curl -L -o "$APP_DIR/minecraft/paper.jar" \
    "https://api.papermc.io/v2/projects/paper/versions/1.21.4/builds/${PAPER_BUILD}/downloads/paper-1.21.4-${PAPER_BUILD}.jar"
  echo "  Paper downloaded: paper.jar"
fi

# ── PM2 start ─────────────────────────────────────────────────────────────────
echo ""
echo "→ Starting NetzTech web server with PM2..."
cd "$APP_DIR"
pm2 delete netztech 2>/dev/null || true
pm2 start website/backend/src/index.js --name netztech
pm2 save
pm2 startup | tail -1 | sudo bash  # auto-start PM2 on reboot

echo ""
echo "╔══════════════════════════════════════╗"
echo "║        Deployment Complete!          ║"
echo "╚══════════════════════════════════════╝"
echo ""
echo "WEBSITE:    https://playnetztech.xyz"
echo "MC SERVER:  play.playnetztech.xyz:25565"
echo ""
echo "NEXT STEPS:"
echo ""
echo "1. Fill in your API keys:"
echo "   nano $APP_DIR/website/backend/.env"
echo "   (Stripe keys, JWT secret, RCON password)"
echo "   Then restart: pm2 restart netztech"
echo ""
echo "2. Download LuckPerms plugin:"
echo "   https://luckperms.net  → download the Bukkit .jar"
echo "   Place in: $APP_DIR/minecraft/plugins/"
echo ""
echo "3. Start the Minecraft server (in a screen session):"
echo "   sudo apt-get install -y screen"
echo "   screen -S minecraft"
echo "   cd $APP_DIR/minecraft && ./start.sh"
echo "   (detach with Ctrl+A then D)"
echo ""
echo "4. Make yourself admin on the website:"
echo "   Register at https://playnetztech.xyz/register.html first, then run:"
echo "   cd $APP_DIR/website/backend && node -e \\"
echo "     \"const db=require('./src/db');db.prepare('UPDATE users SET is_admin=1 WHERE email=?').run('YOUR_EMAIL')\""
echo ""
echo "5. Set up Stripe webhook:"
echo "   URL: https://playnetztech.xyz/api/webhook/stripe"
echo "   Events: checkout.session.completed"
echo "           invoice.payment_succeeded"
echo "           customer.subscription.deleted"
echo ""
echo "6. ORACLE CLOUD — open these ports in your Security List:"
echo "   (Console → Networking → VCN → Security Lists → Ingress Rules)"
echo "   TCP port 80   (HTTP)"
echo "   TCP port 443  (HTTPS)"
echo "   TCP port 25565 (Minecraft)"
echo ""
