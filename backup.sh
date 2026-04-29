#!/usr/bin/env bash
# Run on the current server to create a backup before migrating
# Usage: bash backup.sh
set -e

APP_DIR="$HOME/mc-server"
BACKUP_FILE="$HOME/netztech-backup-$(date +%Y%m%d).tar.gz"

echo "→ Creating backup..."

tar -czf "$BACKUP_FILE" \
  -C "$HOME" \
  mc-server/data \
  mc-server/website/backend/.env \
  mc-server/minecraft/world \
  mc-server/minecraft/world_nether \
  mc-server/minecraft/world_the_end \
  mc-server/minecraft/plugins \
  mc-server/minecraft/server.properties \
  2>/dev/null || true

echo ""
echo "Backup saved: $BACKUP_FILE"
echo ""
echo "Download it to your local machine:"
echo "  scp -i ~/.ssh/id_rsa azureuser@20.25.31.246:$BACKUP_FILE ~/netztech-backup.tar.gz"
echo ""
