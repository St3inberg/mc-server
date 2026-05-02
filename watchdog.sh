#!/bin/bash
# MC server watchdog — runs every 2 minutes via cron
# Sends email via the website notify API if server goes down or comes back up

NOTIFY_URL="http://localhost:3000/api/notify"
STATE_FILE="/tmp/mc-watchdog-state"
RCON_PASS=$(grep 'rcon.password' /home/azureuser/mc-server/minecraft/server.properties | cut -d= -f2)

source "$HOME/.backup-secrets" 2>/dev/null

is_server_up() {
  python3 -c "
import socket, struct, time
s = socket.socket()
try:
    s.settimeout(4)
    s.connect(('127.0.0.1', 25575))
    b = b'\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x03\\x00\\x00\\x00'
    p = '$RCON_PASS'.encode()
    d = struct.pack('<ii', 10 + len(p), 1) + struct.pack('<i', 3) + p + b'\\x00\\x00'
    s.sendall(struct.pack('<i', len(d)) + d)
    time.sleep(0.3)
    s.recv(64)
    print('up')
except:
    print('down')
finally:
    s.close()
" 2>/dev/null
}

notify() {
  curl -s -X POST "$NOTIFY_URL" \
    -H "Content-Type: application/json" \
    -d "{\"secret\":\"$NOTIFY_SECRET\",\"event\":\"$1\"}" \
    > /dev/null 2>&1
}

prev_state=$(cat "$STATE_FILE" 2>/dev/null || echo "up")
curr_state=$(is_server_up)

echo "$curr_state" > "$STATE_FILE"

if [ "$prev_state" = "up" ] && [ "$curr_state" = "down" ]; then
  notify "server_down"
elif [ "$prev_state" = "down" ] && [ "$curr_state" = "up" ]; then
  notify "server_up"
fi
