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
            popularRoutes.map((route, idx) => {
              // Determine image and city name based on DESTINATION
              let bgImage = '/images/hero1.jpg';
              let cityName = route.destination;

              const city = route.destination.toLowerCase();
              const code = route.destination.toUpperCase();

              if (city.includes('delhi') || code === 'DEL') { bgImage = '/images/DEL.jpg'; cityName = 'Delhi'; }
              else if (city.includes('bengaluru') || city.includes('bangalore') || code === 'BLR') { bgImage = '/images/BLR.jpg'; cityName = 'Bengaluru'; }
              else if (city.includes('mumbai') || code === 'BOM') { bgImage = '/images/BOM.jpg'; cityName = 'Mumbai'; }
              else if (city.includes('chennai') || code === 'MAA') { bgImage = '/images/MAA.jpg'; cityName = 'Chennai'; }
              else bgImage = `/images/hero${(idx % 2) + 1}.jpg`;

              return (
                <div key={idx} onClick={() => router.push(`/results?origin=${route.origin}&destination=${route.destination}&date=${new Date().toISOString().split('T')[0]}`)} className="group relative h-64 rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  {/* Background Image */}
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{ backgroundImage: `url('${bgImage}')` }}
                  />
                  {/* Heavy Gradient Overlay for Text Visibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent opacity-90 transition-opacity" />

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <div className="inline-block bg-blue-600/90 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded mb-2 shadow-sm backdrop-blur-sm">
                      Popular • {cityName}
                    </div>
                    <div className="text-3xl font-extrabold mb-2 drop-shadow-md tracking-tight">
                      {route.origin} <span className="text-blue-400">→</span> {route.destination}
                    </div>
                    <div className="flex justify-between items-end mt-3 border-t border-white/20 pt-3">
                      <div>
                        <div className="text-xs text-gray-300 font-medium">Starting from</div>
                        <div className="text-xl font-bold text-green-400 drop-shadow-sm">₹{route.dynamic_price?.toLocaleString() || '2,499'}</div>
                      </div>
                      <span className="bg-white text-blue-600 hover:bg-blue-50 px-5 py-2 rounded-lg text-sm font-bold shadow-lg transition-colors">
                        Book Now
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-3 text-center text-gray-500 py-10">Loading popular routes...</div>
          )}
        </div>
      </div>
    </div>
  );
}
