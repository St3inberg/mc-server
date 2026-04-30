#!/usr/bin/env bash
# Step 5 — Start website and Minecraft server with PM2, persist on reboot
set -e
echo "[5/6] Starting PM2 processes..."

WEB_DIR="$HOME/mc-server/website/nextjs"
MC_DIR="$HOME/mc-server/minecraft"

pm2 delete netztech 2>/dev/null || true
pm2 delete minecraft 2>/dev/null || true

pm2 start "$WEB_DIR/node_modules/.bin/next" --name netztech -- start -p 3000
pm2 start "$MC_DIR/start.sh" --name minecraft --interpreter bash

pm2 save

# Register PM2 to start on reboot
sudo env PATH="$PATH:/usr/bin" pm2 startup systemd -u "$USER" --hp "$HOME" | grep "sudo env" | bash \
  || echo "WARN: PM2 startup auto-registration failed. Run 'pm2 startup' manually."

echo ""
pm2 status
echo ""
echo "[5/6] Done. Both processes running and will auto-start on reboot."
