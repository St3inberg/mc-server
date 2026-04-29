#!/usr/bin/env bash
# Run on the NEW server after deploy.sh to restore data from backup
# Usage: bash restore.sh ~/netztech-backup.tar.gz
set -e

BACKUP_FILE="${1:?Usage: bash restore.sh <backup.tar.gz>}"
APP_DIR="$HOME/mc-server"

echo "→ Restoring from $BACKUP_FILE..."

tar -xzf "$BACKUP_FILE" -C "$HOME"

echo "→ Fixing permissions..."
chmod 700 "$APP_DIR/data"

echo "→ Restarting web server..."
pm2 restart netztech

echo ""
echo "Restore complete."
echo "Restart Minecraft to pick up the restored world:"
echo "  screen -r minecraft"
echo "  stop"
echo "  (then restart: cd ~/mc-server/minecraft && ./start.sh)"
echo ""
