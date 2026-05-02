const FROM = process.env.NOTIFY_FROM || 'NetzTech <noreply@playnetztech.xyz>';
const TO   = process.env.NOTIFY_TO   || 'stephen.stenberg@gmail.com';

export async function sendEmail(subject, html) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM, to: TO, subject, html }),
    });
  } catch (err) {
    console.error('notify: email failed:', err.message);
  }
}

export function purchaseEmail({ username, productName, amount, billing }) {
  const isRecurring = billing === 'monthly' || billing === 'yearly';
  return sendEmail(
    `💰 New purchase — ${productName}`,
    `<div style="font-family:sans-serif;max-width:480px">
      <h2 style="color:#00ff88;margin:0 0 16px">New Purchase on NetzTech</h2>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:6px 0;color:#888">Player</td><td style="padding:6px 0;font-weight:bold">${username}</td></tr>
        <tr><td style="padding:6px 0;color:#888">Package</td><td style="padding:6px 0;font-weight:bold">${productName}</td></tr>
        <tr><td style="padding:6px 0;color:#888">Amount</td><td style="padding:6px 0;font-weight:bold;color:#00ff88">$${(amount / 100).toFixed(2)}${isRecurring ? '/mo' : ''}</td></tr>
      </table>
      <p style="color:#888;font-size:12px;margin-top:24px">Perks will be applied within 60 seconds. View all orders at playnetztech.xyz/admin/purchases</p>
    </div>`
  );
}

export function serverDownEmail() {
  return sendEmail(
    '🔴 NetzTech MC server is DOWN',
    `<div style="font-family:sans-serif;max-width:480px">
      <h2 style="color:#ff5555;margin:0 0 12px">⚠️ Server Offline</h2>
      <p>The Minecraft server at <strong>playnetztech.xyz</strong> is not responding.</p>
      <p style="color:#888;font-size:12px">The server watchdog detected this at ${new Date().toUTCString()}.<br>
      SSH in and check: <code>pm2 status</code> and <code>pm2 logs minecraft</code></p>
    </div>`
  );
}

export function serverUpEmail() {
  return sendEmail(
    '🟢 NetzTech MC server is back online',
    `<div style="font-family:sans-serif;max-width:480px">
      <h2 style="color:#00ff88;margin:0 0 12px">✅ Server Online</h2>
      <p>The Minecraft server at <strong>playnetztech.xyz</strong> is back up and accepting connections.</p>
      <p style="color:#888;font-size:12px">Restored at ${new Date().toUTCString()}</p>
    </div>`
  );
}

export function backupFailEmail(error) {
  return sendEmail(
    '⚠️ NetzTech backup failed',
    `<div style="font-family:sans-serif;max-width:480px">
      <h2 style="color:#ffaa00;margin:0 0 12px">Backup Failed</h2>
      <p>The nightly backup script encountered an error:</p>
      <pre style="background:#111;color:#f88;padding:12px;border-radius:6px;font-size:12px">${error}</pre>
      <p style="color:#888;font-size:12px">Check the log: <code>~/mc-server/backup.log</code></p>
    </div>`
  );
}
