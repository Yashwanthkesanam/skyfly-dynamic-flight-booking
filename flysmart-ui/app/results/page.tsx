// FILE: app/results/page.tsx
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, Suspense, useMemo, useEffect, useCallback } from 'react';
import { useFlights } from '../../hooks/useFlights';
import { useWebSocket } from '../../hooks/useWebSocket';
import FlightCard from '../../components/FlightCard';
import FilterPanel, { FilterState } from '../../components/FilterPanel';
import MobileFilterModal from '../../components/MobileFilterModal';
import SortDropdown, { SortOption } from '../../components/SortDropdown';
import BookingModal from '../../components/BookingModal';
import Modal from '../../components/Modal';
import PriceBreakdown from '../../components/PriceBreakdown';
import LoadingSpinner from '../../components/LoadingSpinner';
import { FlightItem } from '../../types';
import { FunnelIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { FlightCardSkeleton } from '../../components/Skeleton';
import { filterValidFlights } from '../../utils/validateFlightData';

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const origin = searchParams.get('origin') || '';
  const destination = searchParams.get('destination') || '';
  const date = searchParams.get('date') || '';
  const returnDate = searchParams.get('return_date') || '';

  const isRoundTrip = !!returnDate;

  // Selected Flights State
  const [selectedOutbound, setSelectedOutbound] = useState<FlightItem | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<FlightItem | null>(null);

  // Modal States
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [breakdownFlight, setBreakdownFlight] = useState<FlightItem | null>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // -------------------------
  // Data Fetching
  // -------------------------
  // 1. Outbound
  const { data: flightsOutbound, isLoading: isLoadingOut, error: errorOut } = useFlights({ origin, destination, date });

  // 2. Return (only if round trip)
  const { data: flightsReturn, isLoading: isLoadingRet, error: errorRet } = useFlights(
    { origin: destination, destination: origin, date: returnDate },
    { enabled: isRoundTrip }
  );

  const isLoading = isLoadingOut || (isRoundTrip && isLoadingRet);

  // -------------------------
  // Live Updates (WebSocket)
  // -------------------------
  const { lastMessage } = useWebSocket();
  const [liveOutbound, setLiveOutbound] = useState<FlightItem[]>([]);
  const [liveReturn, setLiveReturn] = useState<FlightItem[]>([]);

  // Init Live Data
  useEffect(() => {
    if (flightsOutbound) setLiveOutbound(filterValidFlights(flightsOutbound));
  }, [flightsOutbound]);

  useEffect(() => {
    if (flightsReturn) setLiveReturn(filterValidFlights(flightsReturn));
  }, [flightsReturn]);

  // Handle Socket Updates
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'flight_update' && lastMessage.flight_id) {
      const updateFlightList = (list: FlightItem[]) =>
        list.map(f => {
          if (f.id === String(lastMessage.flight_id)) {
            return {
              ...f,
              dynamic_price: lastMessage.price ?? f.dynamic_price,
              seats_available: lastMessage.seats ?? f.seats_available,
              _justUpdated: true,
            };
          }
          return f;
        });

      setLiveOutbound(prev => updateFlightList(prev));
      setLiveReturn(prev => updateFlightList(prev));

      // Clear flag
      setTimeout(() => {
        const clearFlag = (list: FlightItem[]) => list.map(f => ({ ...f, _justUpdated: undefined }));
        setLiveOutbound(prev => clearFlag(prev));
        setLiveReturn(prev => clearFlag(prev));
      }, 3500);
    }
  }, [lastMessage]);


  // -------------------------
  // Filtering & Sorting (Shared Logic)
  // -------------------------
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 30000],
    selectedAirlines: [],
    departureTime: []
  });
  const [sortOption, setSortOption] = useState<SortOption>('price-asc');

  // Helper to process list
  const processFlights = (list: FlightItem[]) => {
    if (!list || list.length === 0) return [];
    let filtered = list.filter(f => {
      if (f.dynamic_price > filters.priceRange[1] || f.dynamic_price < filters.priceRange[0]) return false;
      if (filters.selectedAirlines.length > 0 && !filters.selectedAirlines.includes(f.airline)) return false;
      if (filters.departureTime.length > 0) {
        const h = new Date(f.departure_time).getHours();
        const slot = h >= 6 && h < 12 ? 'morning' : h >= 12 && h < 18 ? 'afternoon' : h >= 18 && h < 24 ? 'evening' : 'night';
        if (!filters.departureTime.includes(slot)) return false;
      }
      return true;
    });

    return filtered.sort((a, b) => {
      switch (sortOption) {
        case 'price-asc': return a.dynamic_price - b.dynamic_price;
        case 'price-desc': return b.dynamic_price - a.dynamic_price;
        case 'duration-asc': return (a.duration_minutes || 0) - (b.duration_minutes || 0);
        case 'departure-asc': return new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime();
        case 'departure-desc': return new Date(b.departure_time).getTime() - new Date(a.departure_time).getTime();
        default: return 0;
      }
    });
  };

  const processedOutbound = useMemo(() => processFlights(liveOutbound), [liveOutbound, filters, sortOption]);
  const processedReturn = useMemo(() => processFlights(liveReturn), [liveReturn, filters, sortOption]);

  // Derive Min/Max/Airlines from BOTH lists
  const { airlines, minPrice, maxPrice } = useMemo(() => {
    const all = [...liveOutbound, ...liveReturn];
    if (all.length === 0) return { airlines: [], minPrice: 0, maxPrice: 30000 };
    const prices = all.map(f => f.dynamic_price);
    return {
      airlines: Array.from(new Set(all.map(f => f.airline))),
      minPrice: Math.floor(Math.min(...prices)),
      maxPrice: Math.ceil(Math.max(...prices))
    };
  }, [liveOutbound, liveReturn]);


  // -------------------------
  // Actions
  // -------------------------
  // Use useCallback to ensure stable function references for React.memo in FlightCard
  const handleSelectOutbound = useCallback((flight: FlightItem) => setSelectedOutbound(flight), []);
  const handleSelectReturn = useCallback((flight: FlightItem) => setSelectedReturn(flight), []);

  const handleBookSingle = useCallback((flight: FlightItem) => {
    setSelectedOutbound(flight);
    setIsBookingOpen(true);
  }, []);

  const handleBookRoundTrip = () => {
    if (!selectedOutbound || !selectedReturn) return;
    setIsBookingOpen(true);
  };

  const totalPrice = (selectedOutbound?.dynamic_price || 0) + (selectedReturn?.dynamic_price || 0);

  return (
    <div className="bg-[var(--bg)] min-h-screen py-8 pb-32 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-80 flex-shrink-0 hidden md:block">
            <FilterPanel airlines={airlines} minPrice={minPrice} maxPrice={maxPrice} onFilterChange={setFilters} />
          </div>

          <div className="flex-1">
            {/* Header */}
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[var(--fg)]">
                  {isRoundTrip ? 'Select Flights' : `Flights from ${origin} to ${destination}`}
                </h1>
                <p className="text-sm text-[var(--muted)] mt-1">
                  {date} {isRoundTrip && ` - ${returnDate}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setIsMobileFilterOpen(true)} className="md:hidden px-4 py-2 border rounded-lg">Filters</button>
                <SortDropdown currentSort={sortOption} onSortChange={setSortOption} />
              </div>
            </div>

            {/* Error / Loading */}
            {isLoading && [...Array(3)].map((_, i) => <FlightCardSkeleton key={i} />)}
            {(errorOut || errorRet) && <div className="text-red-500">Error loading flights.</div>}

            {/* OUTBOUND SECTION */}
            <div className="mb-8">
              {isRoundTrip && <h2 className="text-xl font-bold mb-4 text-[var(--fg)] flex items-center gap-2">🛫 Outbound: <span className="text-blue-500">{origin} → {destination}</span></h2>}
              <div className="space-y-4">
                {processedOutbound.map(f => (
                  <div key={f.id} className={`transition-all ${isRoundTrip && selectedOutbound?.id === f.id ? 'ring-2 ring-blue-500 rounded-xl shadow-lg scale-[1.01]' : ''}`}>
                    <FlightCard
                      flight={f}
                      onReserve={isRoundTrip ? handleSelectOutbound : handleBookSingle}
                      onShowBreakdown={setBreakdownFlight}
                      selectionMode={isRoundTrip}
                      isSelected={isRoundTrip && selectedOutbound?.id === f.id}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* RETURN SECTION (If Round Trip) */}
            {isRoundTrip && (
              <div className="mb-8 pt-8 border-t border-[var(--border)]">
                <h2 className="text-xl font-bold mb-4 text-[var(--fg)] flex items-center gap-2">🛬 Return: <span className="text-orange-500">{destination} → {origin}</span></h2>
                <div className="space-y-4">
                  {processedReturn.map(f => (
                    <div key={f.id} className={`transition-all ${selectedReturn?.id === f.id ? 'ring-2 ring-orange-500 rounded-xl shadow-lg scale-[1.01]' : ''}`}>
                      <FlightCard
                        flight={f}
                        onReserve={isRoundTrip ? handleSelectReturn : handleBookSingle}
                        onShowBreakdown={setBreakdownFlight}
                        selectionMode={isRoundTrip}
                        isSelected={selectedReturn?.id === f.id}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar for Round Trip Selection */}
      {isRoundTrip && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4 shadow-2xl z-50 animate-slide-up">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className={`flex flex-col ${selectedOutbound ? 'opacity-100' : 'opacity-50'}`}>
                <span className="text-xs text-gray-500 uppercase font-bold">Outbound</span>
                {selectedOutbound ? (
                  <span className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {selectedOutbound.airline} <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  </span>
                ) : <span className="italic text-sm">Select flight...</span>}
              </div>
              <div className="h-8 w-px bg-gray-300"></div>
              <div className={`flex flex-col ${selectedReturn ? 'opacity-100' : 'opacity-50'}`}>
                <span className="text-xs text-gray-500 uppercase font-bold">Return</span>
                {selectedReturn ? (
                  <span className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {selectedReturn.airline} <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  </span>
                ) : <span className="italic text-sm">Select flight...</span>}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-xs text-gray-500">Total Price</div>
                <div className="text-2xl font-black text-blue-600">
                  {totalPrice > 0 ? `₹${totalPrice.toLocaleString('en-IN')}` : '--'}
                </div>
              </div>
              <button
                disabled={!selectedOutbound || !selectedReturn}
                onClick={handleBookRoundTrip}
                className="bg-blue-600 disabled:bg-gray-400 text-white px-8 py-3 rounded-xl font-bold shadow-lg transform active:scale-95 transition-all"
              >
                Book Both
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        flight={selectedOutbound}
        returnFlight={selectedReturn}
        onConfirmed={() => { }}
      />
      <Modal isOpen={!!breakdownFlight} onClose={() => setBreakdownFlight(null)} title="Fare Breakdown">
        {breakdownFlight && <PriceBreakdown breakdown={breakdownFlight.price_breakdown} />}
      </Modal>
      <MobileFilterModal
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        airlines={airlines}
        minPrice={minPrice}
        maxPrice={maxPrice}
        onFilterChange={setFilters}
        currentFilters={filters}
      />
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-10"><LoadingSpinner size="lg" color="blue" /></div>}>
      <ResultsContent />
    </Suspense>
  );
}
