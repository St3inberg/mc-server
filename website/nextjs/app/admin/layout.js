'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getToken, getUser, clearAuth } from '@/lib/client-auth';

const NAV = [
  { href: '/admin', label: 'Overview', icon: '◈' },
  { href: '/admin/players', label: 'Players', icon: '◉' },
  { href: '/admin/server', label: 'Server', icon: '◎' },
  { href: '/admin/products', label: 'Products', icon: '◇' },
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    const user = getUser();
    if (!token || !user?.is_admin) {
      clearAuth();
      router.push('/login');
      return;
    }
    setReady(true);
  }, []);

  function logout() {
    clearAuth();
    window.location.href = '/';
  }

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-[#0a0a15] border-r border-white/[0.05] flex flex-col fixed top-0 left-0 h-full z-40">
        <div className="p-5 border-b border-white/[0.05]">
          <Link href="/" className="flex items-center gap-2 font-black text-lg text-white">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M10 1L12.5 7.5H19L13.75 11.5L15.5 18L10 14.5L4.5 18L6.25 11.5L1 7.5H7.5L10 1Z" fill="#00ff88"/>
            </svg>
            NetzTech
          </Link>
          <span className="text-[10px] text-accent/60 font-semibold uppercase tracking-widest mt-0.5 block">Admin</span>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(item => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  active
                    ? 'bg-accent/10 text-accent border border-accent/20'
                    : 'text-white/40 hover:text-white/80 hover:bg-white/[0.04]'
                }`}
              >
                <span className="text-base leading-none">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/[0.05]">
          <Link href="/" className="flex items-center gap-2 px-3 py-2 text-xs text-white/30 hover:text-white/60 transition-colors">
            ← Back to site
          </Link>
          <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/30 hover:text-red-400 transition-colors text-left">
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-56 min-h-screen p-8 max-w-[calc(100vw-14rem)]">
        {children}
      </main>
    </div>
  );
}
