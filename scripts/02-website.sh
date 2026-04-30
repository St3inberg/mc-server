#!/usr/bin/env bash
# Step 2 — Clone repo, configure website, build Next.js
set -e
echo "[2/6] Setting up website..."

SERVER_DIR="$HOME/mc-server"
WEB_DIR="$SERVER_DIR/website/nextjs"
DATA_DIR="$SERVER_DIR/data"
MC_DIR="$SERVER_DIR/minecraft"

# ── Clone or pull repo ────────────────────────────────────────────────────────
read -p "GitHub PAT (for private repo access): " -s GITHUB_PAT; echo
if [[ -d "$SERVER_DIR/.git" ]]; then
  echo "Repo exists, pulling latest..."
  cd "$SERVER_DIR" && git pull
else
  git clone "https://${GITHUB_PAT}@github.com/St3inberg/mc-server.git" "$SERVER_DIR"
fi

# ── Secrets ───────────────────────────────────────────────────────────────────
read -p "Domain [playnetztech.xyz]: " DOMAIN
DOMAIN="${DOMAIN:-playnetztech.xyz}"

read -p "JWT_SECRET (min 32 chars): " -s JWT_SECRET; echo
[[ ${#JWT_SECRET} -lt 32 ]] && echo "ERROR: JWT_SECRET too short." && exit 1

read -p "STRIPE_SECRET_KEY (sk_live_...): " -s STRIPE_SK; echo
read -p "STRIPE_PUBLISHABLE_KEY (pk_live_...): " -s STRIPE_PK; echo
read -p "STRIPE_WEBHOOK_SECRET (whsec_...): " -s STRIPE_WH; echo
read -p "RESEND_API_KEY (re_...): " -s RESEND; echo
read -p "RCON_PASSWORD: " -s RCON_PASS; echo

mkdir -p "$DATA_DIR"

cat > "$WEB_DIR/.env.local" <<EOF
JWT_SECRET=${JWT_SECRET}
STRIPE_SECRET_KEY=${STRIPE_SK}
STRIPE_PUBLISHABLE_KEY=${STRIPE_PK}
STRIPE_WEBHOOK_SECRET=${STRIPE_WH}
RESEND_API_KEY=${RESEND}
RCON_HOST=127.0.0.1
RCON_PORT=25575
RCON_PASSWORD=${RCON_PASS}
DB_PATH=${DATA_DIR}/netztech.db
MC_DIR=${MC_DIR}
FRONTEND_URL=https://${DOMAIN}
NODE_ENV=production
EOF
echo ".env.local written"

cd "$WEB_DIR"
npm install --quiet
echo "npm install done"
./node_modules/.bin/next build
echo "[2/6] Done. Website built."
