// Stroke-based SVG icons — Lucide style, 24x24 viewBox

const defaults = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.75', strokeLinecap: 'round', strokeLinejoin: 'round' };

function Icon({ d, children, size = 20, className = '', paths }) {
  return (
    <svg {...defaults} width={size} height={size} className={className}>
      {paths ? paths.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
      {children}
    </svg>
  );
}

export function IconSword({ size, className }) {
  return (
    <svg {...defaults} width={size||20} height={size||20} className={className}>
      <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
      <line x1="13" y1="19" x2="19" y2="13" />
      <line x1="16" y1="16" x2="20" y2="20" />
      <line x1="19" y1="21" x2="21" y2="19" />
    </svg>
  );
}

export function IconMountain({ size, className }) {
  return (
    <svg {...defaults} width={size||20} height={size||20} className={className}>
      <path d="M8 3L1 21h22L14 9l-3 5-3-11z" />
    </svg>
  );
}

export function IconFlag({ size, className }) {
  return (
    <svg {...defaults} width={size||20} height={size||20} className={className}>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}

export function IconLayers({ size, className }) {
  return (
    <svg {...defaults} width={size||20} height={size||20} className={className}>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

export function IconShieldCheck({ size, className }) {
  return (
    <svg {...defaults} width={size||20} height={size||20} className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

export function IconZap({ size, className }) {
  return (
    <svg {...defaults} width={size||20} height={size||20} className={className}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

export function IconGrid({ size, className }) {
  return (
    <svg {...defaults} width={size||20} height={size||20} className={className}>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

export function IconUsers({ size, className }) {
  return (
    <svg {...defaults} width={size||20} height={size||20} className={className}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function IconServer({ size, className }) {
  return (
    <svg {...defaults} width={size||20} height={size||20} className={className}>
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
      <line x1="6" y1="6" x2="6.01" y2="6" />
      <line x1="6" y1="18" x2="6.01" y2="18" />
    </svg>
  );
}

export function IconPackage({ size, className }) {
  return (
    <svg {...defaults} width={size||20} height={size||20} className={className}>
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

export function IconCheck({ size, className }) {
  return (
    <svg {...defaults} width={size||16} height={size||16} className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function IconClock({ size, className }) {
  return (
    <svg {...defaults} width={size||16} height={size||16} className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export function IconRefresh({ size, className }) {
  return (
    <svg {...defaults} width={size||16} height={size||16} className={className}>
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

export function IconCreditCard({ size, className }) {
  return (
    <svg {...defaults} width={size||16} height={size||16} className={className}>
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

export function IconCopy({ size, className }) {
  return (
    <svg {...defaults} width={size||16} height={size||16} className={className}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export function IconArrowLeft({ size, className }) {
  return (
    <svg {...defaults} width={size||16} height={size||16} className={className}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

export function IconLogOut({ size, className }) {
  return (
    <svg {...defaults} width={size||16} height={size||16} className={className}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export function IconX({ size, className }) {
  return (
    <svg {...defaults} width={size||16} height={size||16} className={className}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function IconStar({ size, className }) {
  return (
    <svg {...defaults} width={size||20} height={size||20} className={className}>
      <path d="M10 1L12.5 7.5H19L13.75 11.5L15.5 18L10 14.5L4.5 18L6.25 11.5L1 7.5H7.5L10 1Z" />
    </svg>
  );
}

export function IconTerminal({ size, className }) {
  return (
    <svg {...defaults} width={size||16} height={size||16} className={className}>
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}

export function IconUpload({ size, className }) {
  return (
    <svg {...defaults} width={size||16} height={size||16} className={className}>
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  );
}

export function IconBan({ size, className }) {
  return (
    <svg {...defaults} width={size||16} height={size||16} className={className}>
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  );
}

export function IconSettings({ size = 20, className = '' }) {
  return (
    <svg {...{viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:'1.75',strokeLinecap:'round',strokeLinejoin:'round'}} width={size} height={size} className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
