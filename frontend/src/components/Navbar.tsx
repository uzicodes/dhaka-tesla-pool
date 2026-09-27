'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Overview' },
    { href: '/passenger', label: 'Passenger Console' },
    { href: '/driver', label: 'Driver Console' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shadow-xs group-hover:opacity-90 transition"><Image src="/favicon/android-chrome-512x512.png" alt="Tesla Pool Logo" width={32} height={32} className="object-cover" /></div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 text-sm tracking-tight">Dhaka Tesla Pool</span>
            </div>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs sm:text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Live System Indicator */}
        <div className="hidden md:flex items-center gap-2 text-xs font-medium text-red-500 bg-green-100 px-2.5 py-1 rounded-full border border-slate-200/60">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Live Hub</span>
        </div>
      </div>
    </header>
  );
}
