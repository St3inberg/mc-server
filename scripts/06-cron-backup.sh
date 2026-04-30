#!/usr/bin/env bash
# Step 6 — Write backup script and set up nightly cron at 3am
set -e
echo "[6/6] Setting up backups..."

SERVER_DIR="$HOME/mc-server"

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
echo "Backup script written"

(crontab -l 2>/dev/null | grep -v backup-to-git; \
 echo "0 3 * * * $SERVER_DIR/backup-to-git.sh >> $SERVER_DIR/backup.log 2>&1") | crontab -
echo "Nightly backup cron set (3am)"

echo ""
echo "[6/6] Done."
echo ""
echo "============================================================"
echo "  Setup complete! Checklist:"
echo "============================================================"
echo "  [] Website:  https://playnetztech.xyz"
echo "  [] MC:       playnetztech.xyz:25565"
echo "  [] Run 'pm2 status' to verify both processes"
echo ""
echo "  Manual steps:"
echo "  [] Set admin: update users SET is_admin=1 WHERE email='your@email'"
echo "  [] Stripe: add webhook https://playnetztech.xyz/api/webhook/stripe"
echo "  [] Resend: verify domain in dashboard"
echo "  [] LuckPerms: configure groups via admin RCON console"
echo "  [] BedWars: build arenas in-game with /bw create <name>"
echo "============================================================"
