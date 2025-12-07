// FILE: app/results/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useState, Suspense, useMemo, useEffect } from 'react';
import { useFlights } from '../../hooks/useFlights';
import FlightCard from '../../components/FlightCard';
import FilterPanel, { FilterState } from '../../components/FilterPanel';
import MobileFilterModal from '../../components/MobileFilterModal';
import SortDropdown, { SortOption } from '../../components/SortDropdown';
import BookingModal from '../../components/BookingModal';
import Modal from '../../components/Modal';
import PriceBreakdown from '../../components/PriceBreakdown';
import LoadingSpinner from '../../components/LoadingSpinner';
import { FlightItem } from '../../types';
import { FunnelIcon } from '@heroicons/react/24/solid';

function ResultsContent() {
  const searchParams = useSearchParams();
  const origin = searchParams.get('origin') || '';
  const destination = searchParams.get('destination') || '';
  const date = searchParams.get('date') || '';

  // Modal States
  const [selectedFlight, setSelectedFlight] = useState<FlightItem | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [breakdownFlight, setBreakdownFlight] = useState<FlightItem | null>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Data Fetching
  const { data: flights, isLoading, error } = useFlights({ origin, destination, date });

  // Get unique airlines and price range
  const { airlines, minPrice, maxPrice } = useMemo(() => {
    if (!flights || flights.length === 0) return { airlines: [], minPrice: 0, maxPrice: 30000 };
    const uniqueAirlines = Array.from(new Set(flights.map(f => f.airline)));
    const prices = flights.map(f => f.dynamic_price);
    return {
      airlines: uniqueAirlines,
      minPrice: Math.floor(Math.min(...prices)),
      maxPrice: Math.ceil(Math.max(...prices))
    };
  }, [flights]);

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 30000], // Default safe initial state
    selectedAirlines: [],
    departureTime: []
  });

  // Sync filters with derived values after mount to avoid hydration mismatch
  useEffect(() => {
    if (minPrice !== undefined && maxPrice !== undefined) {
      setFilters(prev => ({
        ...prev,
        priceRange: [minPrice, maxPrice]
      }));
    }
  }, [minPrice, maxPrice]);

  // Sort State
  const [sortOption, setSortOption] = useState<SortOption>('price-asc');

  // Filtering and Sorting Logic
  const processedFlights = useMemo(() => {
    if (!flights) return [];

    // Filter
    let filtered = flights.filter(flight => {
      // Price filter
      if (flight.dynamic_price > filters.priceRange[1] || flight.dynamic_price < filters.priceRange[0]) return false;

      // Airline filter
      if (filters.selectedAirlines.length > 0 && !filters.selectedAirlines.includes(flight.airline)) return false;

      // Time filter
      if (filters.departureTime.length > 0) {
        const depHour = new Date(flight.departure_time).getHours();
        const timeSlot =
          depHour >= 6 && depHour < 12 ? 'morning' :
            depHour >= 12 && depHour < 18 ? 'afternoon' :
              depHour >= 18 && depHour < 24 ? 'evening' : 'night';
        if (!filters.departureTime.includes(timeSlot)) return false;
      }

      return true;
    });

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortOption) {
        case 'price-asc':
          return a.dynamic_price - b.dynamic_price;
        case 'price-desc':
          return b.dynamic_price - a.dynamic_price;
        case 'duration-asc':
          return (a.duration_minutes || 0) - (b.duration_minutes || 0);
        case 'departure-asc':
          return new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime();
        case 'departure-desc':
          return new Date(b.departure_time).getTime() - new Date(a.departure_time).getTime();
        default:
          return 0;
      }
    });

    return sorted;
  }, [flights, filters, sortOption]);

  const handleBook = (flight: FlightItem) => {
    setSelectedFlight(flight);
    setIsBookingOpen(true);
  };

  return (
    <div className="bg-[var(--bg)] min-h-screen py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Sidebar */}
          <div className="w-full md:w-80 flex-shrink-0 hidden md:block">
            <FilterPanel
              airlines={airlines}
              minPrice={minPrice}
              maxPrice={maxPrice}
              onFilterChange={setFilters}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Header info */}
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[var(--fg)]">
                  Flights from <span className="text-[var(--primary)]">{origin}</span> to <span className="text-[var(--primary)]">{destination}</span>
                </h1>
                <p className="text-sm text-[var(--muted)] mt-1">{date} • {processedFlights?.length || 0} flights found</p>
              </div>
              <div className="flex items-center gap-3">
                {/* Mobile Filter Button */}
                <button
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="md:hidden flex items-center gap-2 px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg hover:bg-[var(--bg)] transition-colors font-medium text-[var(--fg)]"
                >
                  <FunnelIcon className="w-5 h-5" />
                  Filters
                </button>
                <SortDropdown currentSort={sortOption} onSortChange={setSortOption} />
              </div>
            </div>

            {isLoading && (
              <div className="flex justify-center py-20">
                <LoadingSpinner size="lg" color="blue" />
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 p-4 rounded-lg">
                Failed to load flights. Please try again.
              </div>
            )}

            {!isLoading && processedFlights?.length === 0 && (
              <div className="text-center py-20 bg-[var(--surface)] rounded-xl shadow-sm border border-[var(--border)]">
                <div className="text-4xl mb-4">✈️</div>
                <h3 className="text-lg font-bold text-[var(--fg)]">No flights found</h3>
                <p className="text-[var(--muted)]">Try changing your search filters or dates.</p>
              </div>
            )}

            <div className="space-y-4">
              {processedFlights?.map((flight) => (
                <FlightCard
                  key={flight.id}
                  flight={flight}
                  onReserve={handleBook}
                  onShowBreakdown={setBreakdownFlight}
                />
              ))}
            </div>
          </div>

          {/* Right Summary (Optional/Placeholder per prompt details, usually ads or summary) */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-[var(--surface)] p-4 rounded-xl shadow-sm border border-[var(--border)] sticky top-4">
              <h3 className="font-bold text-[var(--fg)] mb-2">Why book with us?</h3>
              <ul className="text-sm text-[var(--muted)] space-y-2">
                <li>• Real-time dynamic pricing</li>
                <li>• Instant confirmation</li>
                <li>• 24/7 Support</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        flight={selectedFlight}
        onConfirmed={() => { /* maybe refresh flights? */ }}
      />

      {/* Price Breakdown Modal */}
      <Modal
        isOpen={!!breakdownFlight}
        onClose={() => setBreakdownFlight(null)}
        title="Fare Breakdown"
      >
        {breakdownFlight && (
          <PriceBreakdown breakdown={breakdownFlight.price_breakdown} />
        )}
      </Modal>

      {/* Mobile Filter Modal */}
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