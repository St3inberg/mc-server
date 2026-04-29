'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getUser, clearAuth } from '@/lib/client-auth';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    setUser(getUser());
    const onStorage = () => setUser(getUser());
    window.addEventListener('storage', onStorage);
    window.addEventListener('nt-auth-change', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('nt-auth-change', onStorage);
    };
  }, []);

  function logout() {
    clearAuth();
    window.dispatchEvent(new Event('nt-auth-change'));
    window.location.href = '/';
  }

  const isAdmin = pathname?.startsWith('/admin');
  if (isAdmin) return null;

  const navLink = (href, label) => (
    <Link
      href={href}
      className={`text-sm transition-colors duration-150 ${
        pathname === href ? 'text-white font-semibold' : 'text-white/50 hover:text-white/90'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.05] bg-[#07070f]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2 font-black text-lg text-white shrink-0">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 1L12.5 7.5H19L13.75 11.5L15.5 18L10 14.5L4.5 18L6.25 11.5L1 7.5H7.5L10 1Z" fill="#00ff88"/>
          </svg>
          NetzTech
        </Link>

        <div className="flex items-center gap-6">
          {navLink('/', 'Home')}
          {navLink('/store', 'Store')}
          {mounted && user && navLink('/dashboard', 'Dashboard')}
          {mounted && user?.is_admin && navLink('/admin', 'Admin')}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {mounted && user ? (
            <>
              <span className="text-xs text-white/40 hidden sm:block">{user.minecraft_username}</span>
              <button onClick={logout} className="btn-ghost btn btn-sm">Sign out</button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm">Login</Link>
              <Link href="/register" className="btn btn-primary btn-sm">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
