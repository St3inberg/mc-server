import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth.js';
import { sendCommand } from '@/lib/rcon.js';

// Strip Minecraft color/format codes (§x, §a, §r, etc.)
function stripColor(str) {
  return str.replace(/§[0-9a-fk-or]|§x(§[0-9a-f]){6}/gi, '');
}

export async function GET(request) {
  const auth = requireAdmin(request);
  if (auth.error) return NextResponse.json(auth.body, { status: auth.status });

  try {
    const raw = await sendCommand('plugins');
    const clean = stripColor(raw);

    const plugins = [];

    // Match lines like: " - PluginA, PluginB§r, PluginC§r"
    // §a = enabled (green), §c = disabled (red)
    const lineRe = /- (.*)/g;
    let m;
    while ((m = lineRe.exec(raw)) !== null) {
      const segment = m[1];
      // Split on comma+optional color reset
      const parts = segment.split(/§r,\s*|,\s*/);
      for (const part of parts) {
        const name = stripColor(part).trim().replace(/^-\s*/, '');
        if (!name) continue;
        // §a prefix = enabled, §c = disabled
        const enabled = /§a/.test(part.split('§r')[0]) || !/§c/.test(part.split('§r')[0]);
        plugins.push({ name, enabled });
      }
    }

    // Fallback: total count from header
    const countMatch = clean.match(/Server Plugins \((\d+)\)/);
    const count = countMatch ? parseInt(countMatch[1]) : plugins.length;

    return NextResponse.json({ count, plugins });
  } catch (err) {
    return NextResponse.json({ error: 'Server offline or RCON unavailable', plugins: [] }, { status: 502 });
  }
}
