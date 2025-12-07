// FILE: app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import Providers from '../components/Providers';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ErrorBoundary from '../components/ErrorBoundary';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'FlySmart - Smart Flight Booking',
  description: 'Book flights with dynamic pricing and save money.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen bg-[var(--bg)] text-[var(--fg)]">
        <ErrorBoundary>
          <Providers>
            <Header />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
            <Toaster />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
