'use client';
import Link from 'next/link';
import { useState } from 'react';

const FEATURES = [
  { icon: '⚔️', title: 'PvP Arenas', desc: 'Ranked competitive combat with seasonal leaderboards and exclusive rewards.' },
  { icon: '🏔️', title: 'Survival World', desc: 'Massive custom-generated world with dungeons, biomes, and hidden loot.' },
  { icon: '🏰', title: 'Factions', desc: 'Build your empire, raid enemies, and claim territory across the map.' },
  { icon: '🎮', title: 'Mini-Games', desc: 'BedWars, SkyBlock, Spleef and more — updated every season.' },
  { icon: '🛡️', title: 'Anti-Cheat', desc: 'Advanced protection keeps gameplay fair for everyone.' },
  { icon: '⚡', title: 'Low Latency', desc: 'High-performance hardware keeps TPS at 20 even during peak hours.' },
];

function CopyIP() {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText('play.playnetztech.xyz');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={copy}
      className="group flex items-center gap-3 bg-white/[0.04] border border-white/[0.08] hover:border-accent/30 rounded-xl px-6 py-4 transition-all duration-200 hover:bg-white/[0.07]"
    >
      <code className="text-accent font-mono font-bold text-base">play.playnetztech.xyz</code>
      <span className={`text-xs font-semibold transition-colors duration-200 ${copied ? 'text-accent' : 'text-white/30 group-hover:text-white/60'}`}>
        {copied ? '✓ Copied!' : 'Copy IP'}
      </span>
    </button>
  );
}

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className="hero-mesh grid-overlay relative min-h-[85vh] flex flex-col items-center justify-center text-center px-4 py-24">
        <div className="absolute inset-0 pointer-events-none" aria-hidden />

        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 text-xs font-semibold text-accent mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Server Online — Join Now
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6">
            The Ultimate<br />
            <span className="text-accent glow-text">Minecraft</span>{' '}
            <span className="text-white/90">Server</span>
          </h1>

          <p className="text-white/50 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Survival, PvP, Factions and more — all on one high-performance server.
            Buy ranks, support the community, and dominate the leaderboards.
          </p>

          <div className="flex flex-col items-center gap-4">
            <CopyIP />
            <div className="flex gap-3 flex-wrap justify-center">
              <Link href="/store" className="btn btn-primary btn-lg">
                View Packages
              </Link>
              <Link href="/register" className="btn btn-secondary btn-lg">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="page pt-0">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-white mb-3">Why NetzTech?</h2>
          <p className="text-white/40 max-w-md mx-auto text-sm">Built from the ground up for a premium Minecraft experience.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(f => (
            <div key={f.title} className="card-hover p-6">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-white mb-2">{f.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="page pt-0">
        <div className="card p-10 text-center" style={{ background: 'linear-gradient(135deg, rgba(0,255,136,0.05) 0%, rgba(99,102,241,0.05) 100%)' }}>
          <h2 className="text-3xl font-black text-white mb-3">Ready to play?</h2>
          <p className="text-white/40 text-sm mb-8 max-w-md mx-auto">
            Join thousands of players. Buy a rank to unlock exclusive perks and support the server.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/store" className="btn btn-primary btn-lg">Browse Store</Link>
            <Link href="/register" className="btn btn-secondary btn-lg">Get Started Free</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
