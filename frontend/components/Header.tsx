// FILE: components/Header.tsx
'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { authService } from '../lib/utils/auth';

import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    setIsMobileMenuOpen(false);
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
        <div className="flex justify-between items-center h-14 md:h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link
              href="/"
              className="text-xl md:text-2xl font-bold text-[var(--primary)] tracking-tight hover:text-[var(--primary-hover)] transition-all duration-200 hover:scale-105"
            >
              FlySmart
            </Link>
          </div>

          {/* Desktop Nav */}
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

          <div className="flex items-center gap-2">
            {/* Desktop Auth Button */}
            <button
              onClick={handleAuthClick}
              suppressHydrationWarning={true}
              className="hidden md:block px-4 py-2 text-[var(--muted)] hover:text-[var(--fg)] font-medium transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              {isAuthenticated ? 'Logout' : 'Login'}
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--surface)]">
          <div className="space-y-1 px-2 pb-3 pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block rounded-md px-3 py-2 text-base font-medium transition-colors ${isActive(link.href)
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-[var(--primary)]'
                    : 'text-[var(--muted)] hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[var(--fg)]'
                  }`}
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={handleAuthClick}
              className="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-[var(--muted)] hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[var(--fg)]"
            >
              {isAuthenticated ? 'Logout' : 'Login'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
