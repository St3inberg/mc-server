#!/usr/bin/env bash
# =============================================================================
# NetzTech — Full Server Setup Script
# Tested on Ubuntu 22.04 LTS (Hetzner, Azure, DigitalOcean, etc.)
# Run as a non-root user with sudo access.
# Usage: bash setup.sh
# =============================================================================

set -e
CYAN='\033[0;36m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
die()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ── Sanity checks ─────────────────────────────────────────────────────────────
[[ $EUID -eq 0 ]] && die "Do not run as root. Run as your normal user."
command -v sudo >/dev/null || die "sudo is required."

HOME_DIR="$HOME"
SERVER_DIR="$HOME_DIR/mc-server"
MC_DIR="$SERVER_DIR/minecraft"
DATA_DIR="$SERVER_DIR/data"
WEB_DIR="$SERVER_DIR/website/nextjs"
DOMAIN="playnetztech.xyz"
MC_PORT=25565
RCON_PORT=25575

echo ""
echo "============================================================"
echo "  NetzTech Server Setup"
echo "  Target directory: $SERVER_DIR"
echo "============================================================"
echo ""

# ── Collect secrets upfront ───────────────────────────────────────────────────
info "Collecting configuration (secrets are not echoed)..."
echo ""

read -p "GitHub PAT (for cloning private repo): " -s GITHUB_PAT; echo
read -p "Domain name [$DOMAIN]: " INPUT_DOMAIN
[[ -n "$INPUT_DOMAIN" ]] && DOMAIN="$INPUT_DOMAIN"

read -p "JWT_SECRET (min 32 chars, random string): " -s JWT_SECRET; echo
[[ ${#JWT_SECRET} -lt 32 ]] && die "JWT_SECRET must be at least 32 characters."

read -p "STRIPE_SECRET_KEY (sk_live_...): " -s STRIPE_SECRET_KEY; echo
read -p "STRIPE_PUBLISHABLE_KEY (pk_live_...): " -s STRIPE_PK; echo
read -p "STRIPE_WEBHOOK_SECRET (whsec_...): " -s STRIPE_WEBHOOK_SECRET; echo
read -p "RESEND_API_KEY (re_...): " -s RESEND_API_KEY; echo
read -p "RCON password (choose a strong password): " -s RCON_PASSWORD; echo

echo ""
info "Configuration collected. Starting setup..."
echo ""

# ── 1. System packages ────────────────────────────────────────────────────────
info "Updating system packages..."
sudo apt-get update -qq
sudo apt-get install -y -qq \
  curl wget git unzip screen nginx certbot python3-certbot-nginx \
  software-properties-common apt-transport-https ca-certificates

# Java 21
info "Installing Java 21..."
if ! java -version 2>&1 | grep -q '21'; then
  sudo apt-get install -y -qq openjdk-21-jre-headless
fi
ok "Java $(java -version 2>&1 | head -1) ready"

# Node.js 20
info "Installing Node.js 20..."
if ! node --version 2>/dev/null | grep -q 'v20'; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - >/dev/null
  sudo apt-get install -y -qq nodejs
fi
ok "Node.js $(node --version) ready"

# PM2
info "Installing PM2..."
sudo npm install -g pm2@latest --quiet
ok "PM2 $(pm2 --version) ready"

# ── 2. Clone repo ─────────────────────────────────────────────────────────────
info "Cloning NetzTech repo from GitHub..."
if [[ -d "$SERVER_DIR/.git" ]]; then
  warn "Repo already exists, pulling latest..."
  cd "$SERVER_DIR" && git pull
else
  git clone "https://${GITHUB_PAT}@github.com/St3inberg/mc-server.git" "$SERVER_DIR"
fi
ok "Repo ready at $SERVER_DIR"

# ── 3. Website setup ──────────────────────────────────────────────────────────
info "Installing website npm dependencies..."
cd "$WEB_DIR"
npm install --quiet
ok "npm install done"

info "Writing .env.local..."
cat > "$WEB_DIR/.env.local" <<EOF
JWT_SECRET=${JWT_SECRET}
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
STRIPE_PUBLISHABLE_KEY=${STRIPE_PK}
STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
RESEND_API_KEY=${RESEND_API_KEY}
RCON_HOST=127.0.0.1
RCON_PORT=${RCON_PORT}
RCON_PASSWORD=${RCON_PASSWORD}
DB_PATH=${DATA_DIR}/netztech.db
MC_DIR=${MC_DIR}
FRONTEND_URL=https://${DOMAIN}
NODE_ENV=production
EOF
ok ".env.local written"

info "Building Next.js..."
./node_modules/.bin/next build
ok "Website built"

# ── 4. Minecraft server ───────────────────────────────────────────────────────
info "Setting up Minecraft server..."
mkdir -p "$MC_DIR/plugins/BentoBox/addons"
mkdir -p "$DATA_DIR"

# Paper 1.21.4
if [[ ! -f "$MC_DIR/paper.jar" ]]; then
  info "Downloading Paper 1.21.4..."
  PAPER_BUILD=$(curl -s "https://api.papermc.io/v2/projects/paper/versions/1.21.4/builds" \
    | python3 -c "import sys,json; builds=json.load(sys.stdin)['builds']; b=builds[-1]; print(b['build'], b['downloads']['application']['name'])")
  PAPER_NUM=$(echo "$PAPER_BUILD" | cut -d' ' -f1)
  PAPER_FILE=$(echo "$PAPER_BUILD" | cut -d' ' -f2)
  wget -q "https://api.papermc.io/v2/projects/paper/versions/1.21.4/builds/${PAPER_NUM}/downloads/${PAPER_FILE}" \
    -O "$MC_DIR/paper.jar"
  ok "Paper 1.21.4 build $PAPER_NUM downloaded"
else
  ok "paper.jar already exists"
fi

echo "eula=true" > "$MC_DIR/eula.txt"

cat > "$MC_DIR/server.properties" <<EOF
server-name=NetzTech
server-port=${MC_PORT}
gamemode=survival
difficulty=normal
pvp=true
max-players=100
online-mode=true
motd=§6§lNetzTech §r§7● §aCustom Game Modes
enable-rcon=true
rcon.port=${RCON_PORT}
rcon.password=${RCON_PASSWORD}
allow-flight=false
spawn-protection=16
view-distance=10
simulation-distance=10
EOF

cat > "$MC_DIR/start.sh" <<'EOF'
#!/usr/bin/env bash
exec java -Xms2G -Xmx4G \
  -XX:+UseG1GC \
  -XX:+ParallelRefProcEnabled \
  -XX:MaxGCPauseMillis=200 \
  -XX:+UnlockExperimentalVMOptions \
  -XX:+DisableExplicitGC \
  -jar paper.jar nogui
EOF
chmod +x "$MC_DIR/start.sh"
ok "Minecraft server configured"

# ── 5. Download plugins ───────────────────────────────────────────────────────
info "Downloading plugins..."
cd "$MC_DIR/plugins"

dl() {
  local name="$1" url="$2" file="$3"
  if [[ -z "$url" ]]; then warn "$name: could not resolve download URL — install manually"; return; fi
  if [[ ! -f "$file" ]]; then
    wget -q "$url" -O "$file" && ok "$name downloaded" || warn "$name FAILED — install manually from the plugin's website"
  else
    ok "$name already present"
  fi
}

# LuckPerms
LP_URL=$(curl -s "https://api.github.com/repos/LuckPerms/LuckPerms/releases/latest" \
  | python3 -c "import sys,json; r=json.load(sys.stdin); print([a['browser_download_url'] for a in r['assets'] if 'Bukkit' in a['name'] and a['name'].endswith('.jar')][0])" 2>/dev/null || echo "")
dl "LuckPerms" "$LP_URL" "LuckPerms.jar"

# EssentialsX
ESS_URL=$(curl -s "https://api.github.com/repos/EssentialsX/Essentials/releases/latest" \
  | python3 -c "import sys,json; r=json.load(sys.stdin); print([a['browser_download_url'] for a in r['assets'] if a['name'].startswith('EssentialsX-') and a['name'].endswith('.jar') and not any(x in a['name'] for x in ['Discord','GeoIP','Protect','Spawn','XMPP','Chat'])][0])" 2>/dev/null || echo "")
dl "EssentialsX" "$ESS_URL" "EssentialsX.jar"

# Vault
VAULT_URL=$(curl -s "https://api.github.com/repos/MilkBowl/Vault/releases/latest" \
  | python3 -c "import sys,json; r=json.load(sys.stdin); print([a['browser_download_url'] for a in r['assets'] if a['name'].endswith('.jar')][0])" 2>/dev/null || echo "")
dl "Vault" "$VAULT_URL" "Vault.jar"

# WorldEdit via Hangar
WE_URL=$(curl -s "https://hangar.papermc.io/api/v1/projects/WorldEdit/versions?limit=1&offset=0&platform=PAPER&platformVersion=1.21.4" \
  -H "accept: application/json" \
  | python3 -c "import sys,json; r=json.load(sys.stdin); print(r['result'][0]['downloads']['PAPER']['downloadUrl'])" 2>/dev/null || echo "")
dl "WorldEdit" "$WE_URL" "WorldEdit.jar"

# WorldGuard via Hangar
WG_URL=$(curl -s "https://hangar.papermc.io/api/v1/projects/WorldGuard/versions?limit=1&offset=0&platform=PAPER&platformVersion=1.21.4" \
  -H "accept: application/json" \
  | python3 -c "import sys,json; r=json.load(sys.stdin); print(r['result'][0]['downloads']['PAPER']['downloadUrl'])" 2>/dev/null || echo "")
dl "WorldGuard" "$WG_URL" "WorldGuard.jar"

# SaberFactions
SF_URL=$(curl -s "https://api.github.com/repos/SaberLLC/Saber-Factions/releases/latest" \
  | python3 -c "import sys,json; r=json.load(sys.stdin); print([a['browser_download_url'] for a in r['assets'] if a['name'].endswith('.jar')][0])" 2>/dev/null || echo "")
dl "SaberFactions" "$SF_URL" "SaberFactions.jar"

# BentoBox
BENTO_URL=$(curl -s "https://api.github.com/repos/BentoBoxWorld/BentoBox/releases/latest" \
  | python3 -c "import sys,json; r=json.load(sys.stdin); print([a['browser_download_url'] for a in r['assets'] if a['name'].endswith('.jar') and 'javadoc' not in a['name'] and 'sources' not in a['name']][0])" 2>/dev/null || echo "")
dl "BentoBox" "$BENTO_URL" "BentoBox.jar"

# BSkyBlock addon
BSKY_URL=$(curl -s "https://api.github.com/repos/BentoBoxWorld/BSkyBlock/releases/latest" \
  | python3 -c "import sys,json; r=json.load(sys.stdin); print([a['browser_download_url'] for a in r['assets'] if a['name'].endswith('.jar') and 'javadoc' not in a['name'] and 'sources' not in a['name']][0])" 2>/dev/null || echo "")
dl "BSkyBlock" "$BSKY_URL" "BentoBox/addons/BSkyBlock.jar"

# BedWars2023
BW_URL=$(curl -s "https://api.github.com/repos/tomkeuper/BedWars2023/releases/latest" \
  | python3 -c "import sys,json; r=json.load(sys.stdin); print([a['browser_download_url'] for a in r['assets'] if a['name'].endswith('.jar') and 'sources' not in a['name'] and 'javadoc' not in a['name']][0])" 2>/dev/null || echo "")
dl "BedWars2023" "$BW_URL" "BedWars.jar"

ok "Plugin downloads complete"

# ── 6. Nginx ──────────────────────────────────────────────────────────────────
info "Configuring nginx..."
sudo tee /etc/nginx/conf.d/netztech.conf > /dev/null <<EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN} www.${DOMAIN};

    ssl_certificate     /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ssl_session_cache   shared:SSL:10m;

    gzip on;
    gzip_types text/css application/javascript application/json text/plain;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Host              \$host;
        proxy_set_header   X-Real-IP         \$remote_addr;
        proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_request_buffering off;
    }
}
EOF
sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
sudo nginx -t && sudo systemctl reload nginx
ok "Nginx configured"

# ── 7. SSL certificate ────────────────────────────────────────────────────────
info "Obtaining SSL certificate for ${DOMAIN}..."
if [[ ! -d "/etc/letsencrypt/live/${DOMAIN}" ]]; then
  sudo certbot --nginx -d "${DOMAIN}" -d "www.${DOMAIN}" \
    --non-interactive --agree-tos -m "admin@${DOMAIN}" \
    && ok "SSL certificate obtained" \
    || warn "Certbot failed — make sure DNS A record points to this server's IP, then run:\n  sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
else
  ok "SSL certificate already exists"
fi

# ── 8. Backup script ──────────────────────────────────────────────────────────
info "Writing backup script..."
cat > "$SERVER_DIR/backup-to-git.sh" <<'BEOF'
#!/usr/bin/env bash
set -e
REPO="$HOME/mc-server"
DB_SRC="$REPO/data/netztech.db"
STAMP=$(date +%Y-%m-%d_%H-%M)
MAX_DB=14

cd "$REPO"
git fetch origin backups 2>/dev/null || true
git checkout backups 2>/dev/null || git checkout --orphan backups

mkdir -p data
cp "$DB_SRC" "data/netztech-${STAMP}.db"
ls -t data/netztech-*.db 2>/dev/null | tail -n +$((MAX_DB+1)) | xargs -r rm --

git add data/
git commit -m "backup: ${STAMP}" --allow-empty
git push origin backups
echo "Backup ${STAMP} pushed to GitHub"
BEOF
chmod +x "$SERVER_DIR/backup-to-git.sh"
ok "Backup script ready"

# ── 9. PM2 processes ──────────────────────────────────────────────────────────
info "Starting PM2 processes..."
cd "$WEB_DIR"
pm2 delete netztech 2>/dev/null || true
pm2 delete minecraft 2>/dev/null || true

pm2 start ./node_modules/.bin/next --name netztech -- start -p 3000
pm2 start "$MC_DIR/start.sh" --name minecraft --interpreter bash

pm2 save
sudo env PATH="$PATH:/usr/bin" pm2 startup systemd -u "$USER" --hp "$HOME" | grep "sudo" | bash || \
  warn "PM2 startup registration failed — run 'pm2 startup' manually after setup"
ok "PM2 processes running and persisted"

# ── 10. Nightly backup cron ───────────────────────────────────────────────────
info "Setting up nightly backup cron (3am)..."
(crontab -l 2>/dev/null | grep -v backup-to-git; \
 echo "0 3 * * * $SERVER_DIR/backup-to-git.sh >> $SERVER_DIR/backup.log 2>&1") | crontab -
ok "Cron job set"

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo "============================================================"
echo -e "  ${GREEN}Setup complete!${NC}"
echo "============================================================"
echo ""
echo "  Website:    https://${DOMAIN}"
echo "  MC Server:  ${DOMAIN}:${MC_PORT}"
echo ""
echo "  Run 'pm2 status' to check both processes."
echo ""
echo -e "  ${YELLOW}Manual steps still required:${NC}"
echo "  1. Set your account as admin in the DB:"
echo "     node -e \"const db=require('$WEB_DIR/node_modules/better-sqlite3')('$DATA_DIR/netztech.db'); db.prepare(\\\"UPDATE users SET is_admin=1 WHERE email='YOUR_EMAIL'\\\").run()\""
echo "  2. Stripe webhook: add https://${DOMAIN}/api/webhook/stripe in Stripe dashboard"
echo "  3. Resend: verify ${DOMAIN} in the Resend dashboard"
echo "  4. Configure LuckPerms groups via RCON console in the admin panel"
echo "  5. Set up BedWars arenas in-game with /bw create <name>"
echo ""
