// FILE: components/Header.tsx
'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { authService } from '../lib/utils/auth';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check auth status on mount and update
    setIsAuthenticated(authService.isAuthenticated());
  }, []);

  const handleAuthClick = () => {
    if (isAuthenticated) {
      authService.logout();
      setIsAuthenticated(false);
      router.push('/');
    } else {
      router.push('/login');
    }
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname?.startsWith(path);
  };

  const navLinks = [
    { href: '/', label: 'Search' },
    { href: '/bookings', label: 'My Bookings' },
    { href: '/pnr', label: 'PNR Lookup' },
    { href: '/admin', label: 'Admin' },
  ];

  return (
    <header className="bg-[var(--surface)] border-b border-[var(--border)] transition-colors sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link
              href="/"
              className="text-2xl font-bold text-[var(--primary)] tracking-tight hover:text-[var(--primary-hover)] transition-all duration-200 hover:scale-105"
            >
              FlySmart
            </Link>
          </div>
          <nav className="hidden md:flex space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-4 py-2 font-medium transition-all duration-200 rounded-lg group ${isActive(link.href)
                    ? 'text-[var(--primary)] bg-blue-50 dark:bg-blue-900/20'
                    : 'text-[var(--muted)] hover:text-[var(--fg)] hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)] rounded-full animate-pulse"></span>
                )}
                <span className="absolute inset-0 rounded-lg bg-[var(--primary)] opacity-0 group-hover:opacity-5 transition-opacity duration-200"></span>
              </Link>
            ))}
          </nav>
          <div className="flex items-center">
            <button
              onClick={handleAuthClick}
              className="px-4 py-2 text-[var(--muted)] hover:text-[var(--fg)] font-medium transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              {isAuthenticated ? 'Logout' : 'Login'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
