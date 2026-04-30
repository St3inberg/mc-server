'use client';
import Link from 'next/link';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import {
  IconSword, IconMountain, IconFlag, IconLayers,
  IconShieldCheck, IconZap, IconCopy, IconCheck,
} from '@/components/Icons';

const Particles = dynamic(() => import('@/components/Particles'), { ssr: false });

const FEATURES = [
  {
    Icon: IconSword,
    title: 'PvP Arenas',
    desc: 'Ranked competitive combat with seasonal leaderboards and exclusive rewards.',
    color: '#ff5555',
  },
  {
    Icon: IconMountain,
    title: 'Survival World',
    desc: 'Massive custom-generated world with dungeons, hidden biomes, and rare loot.',
    color: '#55ff55',
  },
  {
    Icon: IconFlag,
    title: 'Factions',
    desc: 'Build your empire, raid enemies, and claim territory across the map.',
    color: '#ffaa00',
  },
  {
    Icon: IconLayers,
    title: 'Mini-Games',
    desc: 'BedWars, SkyBlock, Spleef and more — updated every season.',
    color: '#55ffff',
  },
  {
    Icon: IconShieldCheck,
    title: 'Anti-Cheat',
    desc: 'Advanced protection system keeps gameplay fair for every player.',
    color: '#00ff88',
  },
  {
    Icon: IconZap,
    title: 'Low Latency',
    desc: 'High-performance hardware keeps TPS at 20 even during peak hours.',
    color: '#aa55ff',
  },
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
      className="group relative flex items-center gap-3 border rounded-xl px-6 py-4 transition-all duration-300 border-glow-animated"
      style={{
        background: 'rgba(0,255,136,0.04)',
        borderColor: copied ? '#00ff88' : 'rgba(0,255,136,0.2)',
      }}
    >
      <code className="text-accent font-mono font-bold text-base tracking-wide">
        play.playnetztech.xyz
      </code>
      <span className={`flex items-center gap-1.5 text-xs font-semibold transition-all duration-300 ${copied ? 'text-accent' : 'text-white/30 group-hover:text-white/60'}`}>
        {copied
          ? <><IconCheck size={13} /> Copied!</>
          : <><IconCopy size={13} /> Copy IP</>
        }
      </span>
    </button>
  );
}

export default function HomePage() {
  return (
    <main>
      {/* ── Hero ───────────────────────────────────────── */}
      <section className="hero-mesh grid-overlay relative min-h-[88vh] flex flex-col items-center justify-center text-center px-4 py-24 overflow-hidden">
        <Particles count={75} />

        <div className="relative z-10 max-w-3xl mx-auto">
          {/* Online badge */}
          <div className="animate-fade-in inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 text-xs font-semibold text-accent mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Server Online — Join Now
          </div>

          {/* Heading */}
          <h1 className="animate-fade-in-up anim-delay-1 text-5xl sm:text-6xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6">
            The Ultimate<br />
            <span className="shimmer-text glow-text-animated">Minecraft</span>{' '}
            <span className="text-white/90">Server</span>
          </h1>

          <p className="animate-fade-in-up anim-delay-2 text-white/50 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Survival, PvP, Factions and more — all on one high-performance server.
            Buy ranks, support the community, and dominate the leaderboards.
          </p>

          {/* CTA group */}
          <div className="animate-fade-in-up anim-delay-3 flex flex-col items-center gap-5">
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

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #07070f)' }} />
      </section>

      {/* ── Features ───────────────────────────────────── */}
      <section className="page pt-0">
        <div className="text-center mb-12 animate-fade-in-up">
          <h2 className="text-3xl font-black text-white mb-3">Why NetzTech?</h2>
          <p className="text-white/40 max-w-md mx-auto text-sm leading-relaxed">
            Built from the ground up for a premium Minecraft experience.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="card card-lift p-6 group animate-fade-in-up"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
                style={{ background: `${f.color}14`, color: f.color }}
              >
                <f.Icon size={20} />
              </div>
              <h3 className="font-bold text-white mb-2 group-hover:text-accent transition-colors duration-200">
                {f.title}
              </h3>
              <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────── */}
      <section className="page pt-0">
        <div
          className="card p-10 text-center relative overflow-hidden animate-fade-in-up"
          style={{ background: 'linear-gradient(135deg, rgba(0,255,136,0.06) 0%, rgba(99,102,241,0.06) 100%)' }}
        >
          {/* subtle inner glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(ellipse, rgba(0,255,136,0.08) 0%, transparent 70%)' }} />

          <h2 className="text-3xl font-black text-white mb-3 relative">Ready to play?</h2>
          <p className="text-white/40 text-sm mb-8 max-w-md mx-auto relative">
            Join thousands of players. Buy a rank to unlock exclusive perks and support the server.
          </p>
          <div className="flex gap-3 justify-center flex-wrap relative">
            <Link href="/store" className="btn btn-primary btn-lg">Browse Store</Link>
            <Link href="/register" className="btn btn-secondary btn-lg">Get Started Free</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
