#!/usr/bin/env bash
# Step 3 — Download Paper, configure server.properties, download all plugins
set -e
echo "[3/6] Setting up Minecraft server..."

MC_DIR="$HOME/mc-server/minecraft"
mkdir -p "$MC_DIR/plugins/BentoBox/addons"

read -p "RCON_PASSWORD (same as in .env.local): " -s RCON_PASS; echo

# ── Paper 1.21.4 ──────────────────────────────────────────────────────────────
if [[ ! -f "$MC_DIR/paper.jar" ]]; then
  echo "Downloading Paper 1.21.4..."
  BUILD_INFO=$(curl -s "https://api.papermc.io/v2/projects/paper/versions/1.21.4/builds" \
    | python3 -c "import sys,json; b=json.load(sys.stdin)['builds'][-1]; print(b['build'], b['downloads']['application']['name'])")
  BUILD_NUM=$(echo "$BUILD_INFO" | cut -d' ' -f1)
  BUILD_FILE=$(echo "$BUILD_INFO" | cut -d' ' -f2)
  wget -q "https://api.papermc.io/v2/projects/paper/versions/1.21.4/builds/${BUILD_NUM}/downloads/${BUILD_FILE}" \
    -O "$MC_DIR/paper.jar"
  echo "Paper build $BUILD_NUM downloaded"
else
  echo "paper.jar already present"
fi

echo "eula=true" > "$MC_DIR/eula.txt"

cat > "$MC_DIR/server.properties" <<EOF
server-name=NetzTech
server-port=25565
gamemode=survival
difficulty=normal
pvp=true
max-players=100
online-mode=true
motd=§6§lNetzTech §r§7● §aCustom Game Modes
enable-rcon=true
rcon.port=25575
rcon.password=${RCON_PASS}
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

# ── Plugins ───────────────────────────────────────────────────────────────────
echo "Downloading plugins..."
cd "$MC_DIR/plugins"

dl() {
  local name="$1" url="$2" file="$3"
  if [[ -z "$url" ]]; then echo "WARN: $name — could not resolve URL, install manually"; return; fi
  [[ -f "$file" ]] && echo "$name already present" && return
  wget -q "$url" -O "$file" && echo "$name OK" || echo "WARN: $name download failed — install manually"
}

# LuckPerms
LP=$(curl -s "https://api.github.com/repos/LuckPerms/LuckPerms/releases/latest" \
  | python3 -c "import sys,json; r=json.load(sys.stdin); print([a['browser_download_url'] for a in r['assets'] if 'Bukkit' in a['name'] and a['name'].endswith('.jar')][0])" 2>/dev/null || echo "")
dl "LuckPerms" "$LP" "LuckPerms.jar"

# EssentialsX
ESS=$(curl -s "https://api.github.com/repos/EssentialsX/Essentials/releases/latest" \
  | python3 -c "import sys,json; r=json.load(sys.stdin); print([a['browser_download_url'] for a in r['assets'] if a['name'].startswith('EssentialsX-') and a['name'].endswith('.jar') and not any(x in a['name'] for x in ['Discord','GeoIP','Protect','Spawn','XMPP','Chat'])][0])" 2>/dev/null || echo "")
dl "EssentialsX" "$ESS" "EssentialsX.jar"

# Vault
VAULT=$(curl -s "https://api.github.com/repos/MilkBowl/Vault/releases/latest" \
  | python3 -c "import sys,json; r=json.load(sys.stdin); print([a['browser_download_url'] for a in r['assets'] if a['name'].endswith('.jar')][0])" 2>/dev/null || echo "")
dl "Vault" "$VAULT" "Vault.jar"

# WorldEdit
WE=$(curl -s "https://hangar.papermc.io/api/v1/projects/WorldEdit/versions?limit=1&offset=0&platform=PAPER&platformVersion=1.21.4" \
  -H "accept: application/json" \
  | python3 -c "import sys,json; r=json.load(sys.stdin); print(r['result'][0]['downloads']['PAPER']['downloadUrl'])" 2>/dev/null || echo "")
dl "WorldEdit" "$WE" "WorldEdit.jar"

# WorldGuard
WG=$(curl -s "https://hangar.papermc.io/api/v1/projects/WorldGuard/versions?limit=1&offset=0&platform=PAPER&platformVersion=1.21.4" \
  -H "accept: application/json" \
  | python3 -c "import sys,json; r=json.load(sys.stdin); print(r['result'][0]['downloads']['PAPER']['downloadUrl'])" 2>/dev/null || echo "")
dl "WorldGuard" "$WG" "WorldGuard.jar"

# SaberFactions
SF=$(curl -s "https://api.github.com/repos/SaberLLC/Saber-Factions/releases/latest" \
  | python3 -c "import sys,json; r=json.load(sys.stdin); print([a['browser_download_url'] for a in r['assets'] if a['name'].endswith('.jar')][0])" 2>/dev/null || echo "")
dl "SaberFactions" "$SF" "SaberFactions.jar"

# BentoBox
BENTO=$(curl -s "https://api.github.com/repos/BentoBoxWorld/BentoBox/releases/latest" \
  | python3 -c "import sys,json; r=json.load(sys.stdin); print([a['browser_download_url'] for a in r['assets'] if a['name'].endswith('.jar') and 'javadoc' not in a['name'] and 'sources' not in a['name']][0])" 2>/dev/null || echo "")
dl "BentoBox" "$BENTO" "BentoBox.jar"

# BSkyBlock
BSKY=$(curl -s "https://api.github.com/repos/BentoBoxWorld/BSkyBlock/releases/latest" \
  | python3 -c "import sys,json; r=json.load(sys.stdin); print([a['browser_download_url'] for a in r['assets'] if a['name'].endswith('.jar') and 'javadoc' not in a['name'] and 'sources' not in a['name']][0])" 2>/dev/null || echo "")
dl "BSkyBlock" "$BSKY" "BentoBox/addons/BSkyBlock.jar"

# BedWars2023
BW=$(curl -s "https://api.github.com/repos/tomkeuper/BedWars2023/releases/latest" \
  | python3 -c "import sys,json; r=json.load(sys.stdin); print([a['browser_download_url'] for a in r['assets'] if a['name'].endswith('.jar') and 'sources' not in a['name'] and 'javadoc' not in a['name']][0])" 2>/dev/null || echo "")
dl "BedWars2023" "$BW" "BedWars.jar"

echo "[3/6] Done. Plugins installed."
