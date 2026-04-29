import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'NetzTech — Minecraft Server',
  description: 'The ultimate Minecraft server experience. Buy ranks, join the community, and dominate.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Navbar />
        {children}
        <footer className="border-t border-white/[0.04] mt-20 py-8 text-center text-white/25 text-xs">
          © 2026 NetzTech · play.playnetztech.xyz
        </footer>
      </body>
    </html>
  );
}
