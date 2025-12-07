// FILE: components/Header.tsx
import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-[var(--surface)] border-b border-[var(--border)] transition-colors sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-2xl font-bold text-[var(--primary)] tracking-tight hover:text-[var(--primary-hover)] transition-colors">
              FlySmart
            </Link>
          </div>
          <nav className="hidden md:flex space-x-8">
            <Link href="/" className="text-[var(--fg)] hover:text-[var(--primary)] font-medium transition-colors">
              Search
            </Link>
            <Link href="/bookings" className="text-[var(--muted)] hover:text-[var(--fg)] font-medium transition-colors">
              My Bookings
            </Link>
            <Link href="/pnr" className="text-[var(--muted)] hover:text-[var(--fg)] font-medium transition-colors">
              PNR Lookup
            </Link>
            <Link href="/admin" className="text-[var(--muted)] hover:text-[var(--fg)] font-medium transition-colors">
              Admin
            </Link>
          </nav>
          <div className="flex items-center">
            <button
              suppressHydrationWarning
              className="text-[var(--muted)] hover:text-[var(--fg)] font-medium transition-colors"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
