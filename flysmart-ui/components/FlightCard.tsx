// FILE: components/FlightCard.tsx
'use client';

import { FlightItem } from '../types';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { ChartBarIcon, ClockIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import DemandIndicator from './DemandIndicator';
import FareHistoryChart from './FareHistoryChart';
import Modal from './Modal';

interface FlightCardProps {
  flight: FlightItem;
  onReserve: (flight: FlightItem) => void;
  onShowBreakdown: (flight: FlightItem) => void;
}

export default function FlightCard({ flight, onReserve, onShowBreakdown }: FlightCardProps) {
  const [showFareHistory, setShowFareHistory] = useState(false);

  const formatTime = (isoString: string) => format(parseISO(isoString), 'HH:mm');
  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  const formatINR = (val: number) =>
    val.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  const priceIncrease = flight.price_increase_percent ||
    (flight.base_price ? ((flight.dynamic_price - flight.base_price) / flight.base_price * 100) : 0);

  const seatUrgency = flight.seats_available < 10;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card bg-[var(--surface)] p-5 mb-4 flex flex-col gap-4 hover:shadow-lg transition-all border border-[var(--border)] rounded-xl relative overflow-hidden"
      >
        {/* Price increase badge */}
        {priceIncrease > 5 && (
          <div className="absolute top-0 right-0 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
            ↑ {priceIncrease.toFixed(0)}% from base
          </div>
        )}

        {/* Main Content */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Airline Info */}
          <div className="flex-shrink-0 w-full md:w-24 flex flex-col items-center md:items-start text-center md:text-left">
            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-sm font-bold text-white mb-2 shadow-md">
              {flight.airline.slice(0, 2).toUpperCase()}
            </div>
            <div className="text-sm font-semibold text-[var(--fg)]">{flight.airline}</div>
            <div className="text-xs text-[var(--muted)]">{flight.flight_number}</div>
          </div>

          {/* Flight Timing */}
          <div className="flex-grow flex items-center justify-between w-full md:max-w-md">
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--fg)]">{formatTime(flight.departure_time)}</div>
              <div className="text-sm text-[var(--muted)] font-medium">{flight.origin}</div>
            </div>

            <div className="flex-grow px-4 flex flex-col items-center">
              <div className="text-xs text-[var(--muted)] mb-1 font-medium">{formatDuration(flight.duration_minutes)}</div>
              <div className="w-full h-[2px] bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 relative">
                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500"></div>
                <div className="absolute top-1/2 right-0 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="text-[10px] bg-[var(--surface)] px-2 py-0.5 rounded-full text-[var(--muted)] font-medium border border-[var(--border)]">
                    ✈️
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-[var(--muted)] mt-1 font-medium">Non-stop</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--fg)]">{formatTime(flight.arrival_time)}</div>
              <div className="text-sm text-[var(--muted)] font-medium">{flight.destination}</div>
            </div>
          </div>

          {/* Price & Action */}
          <div className="flex-shrink-0 w-full md:w-56 flex flex-col items-end gap-3 text-right">
            <div className="w-full">
              {flight.base_price < flight.dynamic_price && (
                <div className="text-xs text-[var(--muted)] line-through decoration-red-500 mb-1">
                  {formatINR(flight.base_price)}
                </div>
              )}
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                {formatINR(flight.dynamic_price)}
              </div>
              <div className="flex items-center justify-end gap-2 mt-1">
                <button
                  onClick={() => onShowBreakdown(flight)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium hover:underline flex items-center gap-1"
                >
                  <ChartBarIcon className="w-3 h-3" />
                  Price Breakdown
                </button>
              </div>
            </div>

            <button
              onClick={() => onReserve(flight)}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 px-8 rounded-lg transition-all w-full shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
            >
              Book Now
            </button>
          </div>
        </div>

        {/* Additional Info Row */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-[var(--border)]">
          {/* Seats Available */}
          <div className={`flex items-center gap-2 text-sm ${seatUrgency ? 'text-red-600 font-semibold' : 'text-[var(--muted)]'}`}>
            <UserGroupIcon className="w-4 h-4" />
            <span>{flight.seats_available} seats left</span>
            {seatUrgency && <span className="text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 px-2 py-0.5 rounded-full font-bold">Hurry!</span>}
          </div>

          {/* Price Update Timer */}
          {flight.price_cached_seconds_left && flight.price_cached_seconds_left > 0 && (
            <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
              <ClockIcon className="w-4 h-4" />
              <span className="text-xs">Price locked for {Math.floor(flight.price_cached_seconds_left / 60)}m</span>
            </div>
          )}

          {/* Demand Indicator */}
          <div className="ml-auto">
            <DemandIndicator flightId={parseInt(flight.id)} compact />
          </div>

          {/* Fare History Button */}
          <button
            onClick={() => setShowFareHistory(true)}
            className="text-xs text-[var(--muted)] hover:text-[var(--fg)] font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-[var(--bg)] transition-colors"
          >
            <ChartBarIcon className="w-4 h-4" />
            View Price History
          </button>
        </div>
      </motion.div>

      {/* Fare History Modal */}
      <Modal isOpen={showFareHistory} onClose={() => setShowFareHistory(false)} title="Fare History">
        <FareHistoryChart flightId={parseInt(flight.id)} currentPrice={flight.dynamic_price} />
      </Modal>
    </>
  );
}
