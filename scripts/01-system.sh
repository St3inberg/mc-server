#!/usr/bin/env bash
# Step 1 — Install system dependencies (Java 21, Node.js 20, nginx, certbot, PM2)
set -e
echo "[1/6] Installing system dependencies..."

[[ $EUID -eq 0 ]] && echo "ERROR: Do not run as root." && exit 1

sudo apt-get update -qq
sudo apt-get install -y -qq \
  curl wget git unzip nginx certbot python3-certbot-nginx \
  software-properties-common apt-transport-https ca-certificates

# Java 21
if ! java -version 2>&1 | grep -q '21'; then
  echo "Installing Java 21..."
  sudo apt-get install -y -qq openjdk-21-jre-headless
fi
echo "Java: $(java -version 2>&1 | head -1)"

# Node.js 20
if ! node --version 2>/dev/null | grep -q 'v20'; then
  echo "Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - >/dev/null
  sudo apt-get install -y -qq nodejs
fi
echo "Node.js: $(node --version)"

# PM2
sudo npm install -g pm2@latest --quiet
echo "PM2: $(pm2 --version)"

echo "[1/6] Done."
