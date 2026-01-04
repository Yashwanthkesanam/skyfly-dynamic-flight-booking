'use client';

import PNRLookup from '../../components/PNRLookup';

export default function PNRPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] transition-colors relative overflow-hidden flex items-center justify-center">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 dark:bg-blue-500/10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 dark:bg-purple-500/10 pointer-events-none"></div>

      <div className="max-w-xl w-full mx-auto px-4 relative z-10 animate-fade-in-up">

        {/* Hero Section */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
            Check PNR Status
          </h1>
          <p className="text-[var(--muted)]">View your flight reservation details</p>
        </div>

        {/* The Classic Component */}
        <PNRLookup title="Booking Details" allowCancel={false} />

      </div>
    </div>
  );
}
