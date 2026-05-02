#!/bin/bash
# NetzTech nightly backup
# - Worlds:       tar.gz archives on this VM, 7-day rolling
# - DB + ranks + configs: pushed to GitHub backups branch
set -e

notify_failure() {
  curl -s -X POST "http://localhost:3000/api/notify" \
    -H "Content-Type: application/json" \
    -d "{\"secret\":\"$NOTIFY_SECRET\",\"event\":\"backup_failed\",\"error\":\"$1\"}" \
    > /dev/null 2>&1 || true
}
trap 'notify_failure "Backup script exited with error at line $LINENO"' ERR

REPO_DIR=/home/azureuser/mc-server
BACKUP_DIR=/home/azureuser/mc-server-backups
TIMESTAMP=$(date +%Y-%m-%d_%H-%M)
# PAT is stored in ~/.backup-secrets (not in git) — format: GITHUB_PAT=ghp_...
# shellcheck source=/dev/null
source "$HOME/.backup-secrets" 2>/dev/null || { echo "Missing ~/.backup-secrets"; exit 1; }
PAT="$GITHUB_PAT"
RCON_PASS=$(grep 'rcon.password' "$REPO_DIR/minecraft/server.properties" | cut -d= -f2)

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

rcon() {
  python3 - "$1" <<'PY'
import socket, struct, time, sys
cmd = sys.argv[1]
s = socket.socket()
try:
    s.connect(('127.0.0.1', 25575))
    s.settimeout(5)
    def send(pid, t, body):
        b = body.encode('utf-8')
        d = struct.pack('<ii', pid, t) + b + b'\x00\x00'
        s.sendall(struct.pack('<i', len(d)) + d)
    send(1, 3, 'RCON_PASS_PLACEHOLDER')
    time.sleep(0.2)
    try: s.recv(4096)
    except: pass
    send(2, 2, cmd)
    time.sleep(1.5)
    try: print(s.recv(65536)[12:-2].decode('utf-8', errors='replace'))
    except: pass
finally:
    s.close()
PY
}

# Replace placeholder with actual password
rcon() {
  python3 -c "
import socket, struct, time, sys
cmd = sys.argv[1]
s = socket.socket()
try:
    s.connect(('127.0.0.1', 25575))
    s.settimeout(5)
    def send(pid, t, body):
        b = body.encode('utf-8')
        d = struct.pack('<ii', pid, t) + b + b'\x00\x00'
        s.sendall(struct.pack('<i', len(d)) + d)
    send(1, 3, '$RCON_PASS')
    time.sleep(0.2)
    try: s.recv(4096)
    except: pass
    send(2, 2, cmd)
    time.sleep(1.5)
    try: print(s.recv(65536)[12:-2].decode('utf-8', errors='replace'))
    except: pass
finally:
    s.close()
" "$1" 2>/dev/null || true
}

log "=== NetzTech backup starting ==="

# ── 1. Flush world saves via RCON ────────────────────────────
log "Pausing MC auto-save..."
rcon "save-off"
rcon "save-all flush"
sleep 3

# ── 2. World archives — local only, 7-day rolling ────────────
log "Archiving worlds..."
mkdir -p "$BACKUP_DIR/worlds"
tar -czf "$BACKUP_DIR/worlds/worlds-$TIMESTAMP.tar.gz" \
  -C "$REPO_DIR/minecraft" \
  world bskyblock_world lobby world_nether world_the_end \
  --exclude='*/session.lock' \
  2>/dev/null || true
# Keep last 7
ls -t "$BACKUP_DIR/worlds/worlds-"*.tar.gz 2>/dev/null | tail -n +8 | xargs -r rm -f
WORLD_SIZE=$(du -sh "$BACKUP_DIR/worlds/worlds-$TIMESTAMP.tar.gz" 2>/dev/null | cut -f1)
log "World archive: $WORLD_SIZE"

# Re-enable auto-save
rcon "save-on"
log "Auto-save re-enabled"

# ── 3. GitHub: DB + LuckPerms + scripts + configs ────────────
log "Setting up GitHub backup repo..."
if [ ! -d "$BACKUP_DIR/.git" ]; then
  mkdir -p "$BACKUP_DIR"
  cd "$BACKUP_DIR"
  git init
  git remote add origin "https://St3inberg:$PAT@github.com/St3inberg/mc-server.git"
  git checkout -b backups
  git commit --allow-empty -m "init backups branch"
  git push -u origin backups
fi

cd "$BACKUP_DIR"
git config user.email "backup@netztech"
git config user.name "NetzTech Backup"
git remote set-url origin "https://St3inberg:$PAT@github.com/St3inberg/mc-server.git"
git pull origin backups --rebase 2>/dev/null || true

# SQLite database (keep latest 14 timestamped copies)
mkdir -p "$BACKUP_DIR/data"
cp "$REPO_DIR/data/netztech.db" "$BACKUP_DIR/data/netztech-$TIMESTAMP.db"
cp "$REPO_DIR/data/netztech.db" "$BACKUP_DIR/data/netztech-latest.db"
ls -t "$BACKUP_DIR/data/netztech-2"*.db 2>/dev/null | tail -n +15 | xargs -r rm -f

# LuckPerms YAML (player ranks — most critical config)
rsync -a --delete \
  "$REPO_DIR/minecraft/plugins/LuckPerms/yaml-storage/" \
  "$BACKUP_DIR/luckperms/"

# Skript scripts
rsync -a --delete \
  "$REPO_DIR/minecraft/plugins/Skript/scripts/" \
  "$BACKUP_DIR/skript-scripts/"

# Server properties + key plugin configs
mkdir -p "$BACKUP_DIR/configs"
cp "$REPO_DIR/minecraft/server.properties" "$BACKUP_DIR/configs/"
for cfg in \
  "TAB/config.yml" \
  "TAB/groups.yml" \
  "Essentials/config.yml" \
  "BedWars2023/config.yml" \
  "CommandPanels/panels/netztech.yml"; do
  src="$REPO_DIR/minecraft/plugins/$cfg"
  dst="$BACKUP_DIR/configs/$(basename $(dirname $cfg))-$(basename $cfg)"
  [ -f "$src" ] && cp "$src" "$dst" || true
done

# Commit and push
git add -A
if git diff --cached --quiet; then
  log "Nothing changed — skipping GitHub push"
else
  git commit -m "backup: $TIMESTAMP"
  git push origin backups
  log "GitHub push done"
fi

log "=== Backup complete: $TIMESTAMP ==="
log "Local worlds: $BACKUP_DIR/worlds/"
log "GitHub branch: backups (DB, LuckPerms, scripts, configs)"
