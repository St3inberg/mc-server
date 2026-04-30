'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getToken, getUser, clearAuth } from '@/lib/client-auth';
import { IconGrid, IconUsers, IconServer, IconPackage, IconArrowLeft, IconLogOut, IconStar, IconSettings } from '@/components/Icons';

const NAV = [
  { href: '/admin',           label: 'Overview',  Icon: IconGrid     },
  { href: '/admin/players',   label: 'Players',   Icon: IconUsers    },
  { href: '/admin/server',    label: 'Server',    Icon: IconServer   },
  { href: '/admin/products',  label: 'Products',  Icon: IconPackage  },
  { href: '/admin/settings',  label: 'Site Content', Icon: IconSettings },
];

export default function AdminLayout({ children }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    const user  = getUser();
    if (!token || !user?.is_admin) { clearAuth(); router.push('/login'); return; }
    setReady(true);
  }, []);

  function logout() { clearAuth(); window.location.href = '/'; }

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {/* ── Sidebar ───────────────────────────────────── */}
      <aside className="w-56 shrink-0 bg-[#09090f] border-r border-white/[0.05] flex flex-col fixed top-0 left-0 h-full z-40">
        {/* Logo */}
        <div className="p-5 border-b border-white/[0.05]">
          <Link href="/" className="flex items-center gap-2 font-black text-lg text-white">
            <IconStar size={18} className="text-accent" />
            NetzTech
          </Link>
          <span className="text-[10px] text-accent/50 font-semibold uppercase tracking-widest mt-0.5 block">
            Admin Panel
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  active
                    ? 'bg-accent/10 text-accent border border-accent/15'
                    : 'text-white/40 hover:text-white/80 hover:bg-white/[0.04]'
                }`}
              >
                <Icon size={16} className={active ? 'text-accent' : ''} />
                {label}
                {active && <span className="ml-auto w-1 h-1 rounded-full bg-accent" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/[0.05] space-y-0.5">
          <Link href="/" className="flex items-center gap-2.5 px-3 py-2 text-xs text-white/30 hover:text-white/60 transition-colors rounded-lg hover:bg-white/[0.03]">
            <IconArrowLeft size={13} /> Back to site
          </Link>
          <button onClick={logout} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-white/30 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/[0.05] text-left">
            <IconLogOut size={13} /> Sign out
          </button>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────── */}
      <main className="flex-1 ml-56 min-h-screen p-8 max-w-[calc(100vw-14rem)] animate-fade-in">
        {children}
      </main>
    </div>
  );
}
