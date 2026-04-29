const net = require('net');
const db = require('./db');

class RconClient {
  constructor(host, port, password) {
    this.host = host;
    this.port = parseInt(port);
    this.password = password;
  }

  execute(command) {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      let authenticated = false;
      let buffer = Buffer.alloc(0);

      socket.setTimeout(5000);
      socket.connect(this.port, this.host);

      socket.on('connect', () => {
        this._send(socket, 3, this.password, 1); // auth packet
      });

      socket.on('data', (data) => {
        buffer = Buffer.concat([buffer, data]);
        while (buffer.length >= 12) {
          const length = buffer.readInt32LE(0);
          if (buffer.length < length + 4) break;
          const reqId = buffer.readInt32LE(4);
          const payload = buffer.slice(12, length + 2).toString('utf8');
          buffer = buffer.slice(length + 4);

          if (!authenticated) {
            if (reqId === -1) { socket.destroy(); return reject(new Error('RCON auth failed')); }
            authenticated = true;
            this._send(socket, 2, command, 2); // run command
          } else {
            socket.destroy();
            resolve(payload);
          }
        }
      });

      socket.on('timeout', () => { socket.destroy(); reject(new Error('RCON timeout')); });
      socket.on('error', (err) => reject(err));
    });
  }

  _send(socket, type, payload, id) {
    const buf = Buffer.from(payload, 'utf8');
    const packet = Buffer.alloc(14 + buf.length);
    packet.writeInt32LE(10 + buf.length, 0);
    packet.writeInt32LE(id, 4);
    packet.writeInt32LE(type, 8);
    buf.copy(packet, 12);
    packet.writeInt16LE(0, 12 + buf.length);
    socket.write(packet);
  }
}

const rcon = new RconClient(
  process.env.RCON_HOST || '127.0.0.1',
  process.env.RCON_PORT || 25575,
  process.env.RCON_PASSWORD || ''
);

async function applyPerks(purchaseId, minecraftUsername, commands) {
  const insertCmd = db.prepare(
    'INSERT INTO command_queue (purchase_id, minecraft_username, command) VALUES (?, ?, ?)'
  );
  for (const cmd of commands) {
    insertCmd.run(purchaseId, minecraftUsername, cmd.replace('{player}', minecraftUsername));
  }
  await flushQueue();
}

async function flushQueue() {
  const pending = db.prepare(
    'SELECT * FROM command_queue WHERE executed = 0 AND attempts < 10 ORDER BY created_at ASC'
  ).all();

  for (const item of pending) {
    try {
      await rcon.execute(item.command);
      db.prepare('UPDATE command_queue SET executed = 1 WHERE id = ?').run(item.id);
      // Mark purchase perks_applied once all commands for it are done
      const remaining = db.prepare(
        'SELECT COUNT(*) as c FROM command_queue WHERE purchase_id = ? AND executed = 0'
      ).get(item.purchase_id);
      if (remaining.c === 0) {
        db.prepare('UPDATE purchases SET perks_applied = 1 WHERE id = ?').run(item.purchase_id);
      }
    } catch {
      db.prepare(
        'UPDATE command_queue SET attempts = attempts + 1, last_attempt = CURRENT_TIMESTAMP WHERE id = ?'
      ).run(item.id);
    }
  }
}

function startPerkWorker() {
  flushQueue();
  setInterval(flushQueue, 30000);
}

module.exports = { applyPerks, flushQueue, startPerkWorker };
