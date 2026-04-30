'use client';
import { useEffect, useState } from 'react';

function seeded(n) {
  const x = Math.sin(n + 1) * 10000;
  return x - Math.floor(x);
}

export default function Particles({ count = 70 }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    left: seeded(i * 7.3) * 100,
    size: 1 + Math.floor(seeded(i * 3.1) * 2.5),
    duration: 10 + seeded(i * 1.7) * 14,
    delay: -(seeded(i * 5.9) * 18),
    green: i % 6 === 0,
    star: i % 11 === 0,
    drift: (seeded(i * 2.3) - 0.5) * 60,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {particles.map(p => (
        <span
          key={p.id}
          className={p.star ? 'particle-star' : 'particle-dot'}
          style={{
            left: `${p.left}%`,
            bottom: '-6px',
            width: p.star ? `${p.size + 2}px` : `${p.size}px`,
            height: p.star ? `${p.size + 2}px` : `${p.size}px`,
            background: p.green ? '#00ff88' : `rgba(255,255,255,${0.3 + seeded(p.id) * 0.5})`,
            boxShadow: p.green ? `0 0 ${p.size * 5}px 1px #00ff88` : p.size > 1.8 ? `0 0 4px rgba(255,255,255,0.4)` : 'none',
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            '--drift': `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
