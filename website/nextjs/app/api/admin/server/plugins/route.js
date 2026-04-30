import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth.js';
import { sendCommand } from '@/lib/rcon.js';

export async function GET(request) {
  const auth = requireAdmin(request);
  if (auth.error) return NextResponse.json(auth.body, { status: auth.status });

  try {
    const raw = await sendCommand('plugins');
    // Output format: "Plugins (8): [LuckPerms], Vault, [WorldEdit], ..."
    // Green [] = enabled, red = disabled (no bracket distinction in RCON text)
    const match = raw.match(/Plugins \((\d+)\):\s*(.+)/);
    if (!match) return NextResponse.json({ plugins: [], raw });

    const count = parseInt(match[1]);
    const plugins = match[2].split(',').map(p => {
      const name = p.trim().replace(/^\[|\]$/g, '');
      // Enabled plugins are wrapped in [] in colored output; in plain RCON text they just appear
      const enabled = p.trim().startsWith('[');
      return { name, enabled };
    });

    return NextResponse.json({ count, plugins, raw });
  } catch (err) {
    return NextResponse.json({ error: 'Server offline or RCON unavailable', plugins: [] }, { status: 502 });
  }
}
