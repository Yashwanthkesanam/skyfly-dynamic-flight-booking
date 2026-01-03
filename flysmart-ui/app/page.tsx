// FILE: app/page.tsx
'use client';

import { motion } from 'framer-motion';
import SearchForm from '../components/SearchForm';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { flightService } from '../lib/services/flightService';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [popularRoutes, setPopularRoutes] = useState<any[]>([]);

  useEffect(() => {
    flightService.getPopularRoutes().then(setPopularRoutes).catch(() => { });
  }, []);

  const handleSearchClick = () => {
    // Programmatically submit the form logic
    const form = document.getElementById('flysmart-search-form') as HTMLFormElement;
    if (form) {
      // We use requestSubmit() to trigger the onSubmit handler of the form
      form.requestSubmit();
    }
  };

  return (
    <div className="w-full pb-20">

      {/* Hero Section */}
      <div className="relative bg-[#051429] pt-20 pb-32 md:pt-28 md:pb-40 px-4 sm:px-6 lg:px-8">
        {/* Background image with light overlay (uses /public/images/hero1.jpg) */}
        <div
          className="absolute inset-0 z-0"
          style={{
            // very light neutral overlay so image colors show through (no blue tint)
            backgroundImage: `linear-gradient(rgba(0,0,0,0.16), rgba(0,0,0,0.22)), url('/images/hero2.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto flex flex-col items-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-extrabold text-white text-center mb-8 tracking-tighter drop-shadow-2xl"
          >
            Smart Flights. <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-200 via-blue-400 to-cyan-300">Smarter Prices.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-blue-50 text-center text-lg md:text-xl font-medium max-w-3xl mb-14 drop-shadow-lg leading-relaxed"
          >
            Get the best fares with real-time pricing. Book smart and save more on every trip.
          </motion.p>

          {/* Main Search Card Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="w-full relative px-4 md:px-0"
          >
            <SearchForm />

            {/* Centered Search Pill Button */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-28 z-[10]">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSearchClick}
                className="bg-gradient-to-r from-[#2FA0F2] to-[#1470C8] text-white font-black text-2xl px-16 py-4 rounded-full shadow-[0_10px_20px_rgba(33,150,243,0.4)] uppercase tracking-widest transform transition-all hover:scale-105 active:scale-95"
                suppressHydrationWarning
              >
                Search
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Popular Routes / Marketing Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Popular Routes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {popularRoutes.length > 0 ? (
            popularRoutes.map((route, idx) => (
              <div key={idx} onClick={() => router.push(`/results?origin=${route.origin}&destination=${route.destination}&date=${new Date().toISOString().split('T')[0]}`)} className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer border border-gray-100">
                <div className={`h-32 rounded-lg mb-4 flex items-center justify-center text-4xl ${idx % 3 === 0 ? 'bg-blue-50' : idx % 3 === 1 ? 'bg-orange-50' : 'bg-green-50'}`}>
                  {idx % 3 === 0 ? '🏝️' : idx % 3 === 1 ? '🏙️' : '🏔️'}
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-bold tracking-wide">Popular</div>
                    <div className="text-lg font-bold text-gray-900">{route.origin} to {route.destination}</div>
                    <div className="text-sm text-gray-500">{route.search_count || 'Hot'} searches recently</div>
                  </div>
                  <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">Book</div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center text-gray-500 py-10">Loading popular routes...</div>
          )}
        </div>
      </div>
    </div>
  );
}
