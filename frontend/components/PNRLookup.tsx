'use client';

import { useState } from 'react';
import { bookingService, BookingDetails } from '../lib/services/bookingService';
import Spinner from './Spinner';

interface PNRLookupProps {
  title?: string;
  allowCancel?: boolean;
}

export default function PNRLookup({ title = "Manage Booking", allowCancel = true }: PNRLookupProps) {
  const [pnr, setPnr] = useState('');
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!pnr || pnr.length !== 6) {
      setError('Please enter a valid 6-character PNR');
      return;
    }
    setLoading(true);
    setError('');
    setBooking(null);
    try {
      const data = await bookingService.getBooking(pnr);
      setBooking(data);
    } catch (err) {
      setError('Booking not found. Please check your PNR.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!booking || !booking.pnr) return;
    if (!confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) return;

    setLoading(true);
    try {
      await bookingService.cancelBooking(booking.pnr);
      // Refresh details
      const updated = await bookingService.getBooking(booking.pnr);
      setBooking(updated);
    } catch (err) {
      alert('Failed to cancel booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[var(--surface)] p-6 rounded-xl shadow-sm border border-[var(--border)] w-full transition-colors">
      <h2 className="text-xl font-bold mb-4 text-[var(--fg)]">{title}</h2>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          maxLength={6}
          value={pnr}
          onChange={(e) => setPnr(e.target.value.toUpperCase())}
          placeholder="e.g. X7Y2Z9"
          className="flex-1 p-2 border border-[var(--border)] rounded-lg uppercase font-mono bg-[var(--bg)] text-[var(--fg)] placeholder:text-[var(--muted)]"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-gray-900 dark:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {booking && (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-[var(--border)]">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="text-sm text-[var(--muted)]">PNR</div>
              <div className="text-2xl font-mono font-bold text-[var(--fg)]">{booking.pnr}</div>
            </div>
            <div className={`px-2 py-1 rounded text-xs font-bold uppercase ${booking.status === 'confirmed' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-100' : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-100'}`}>
              {booking.status}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-[var(--muted)]">Passenger</div>
              <div className="font-medium text-[var(--fg)]">{booking.passenger_name}</div>
            </div>
            <div>
              <div className="text-[var(--muted)]">Flight ID</div>
              <div className="font-medium text-[var(--fg)]">{booking.flight_id}</div>
            </div>
            <div>
              <div className="text-[var(--muted)]">Seats</div>
              <div className="font-medium text-[var(--fg)]">{booking.seats_booked}</div>
            </div>
            <div>
              <div className="text-[var(--muted)]">Total Paid</div>
              <div className="font-medium font-mono text-[var(--fg)]">₹{booking.price_paid}</div>
            </div>
          </div>

          {allowCancel && booking.status !== 'cancelled' && booking.status !== 'CANCELLED' && (
            <div className="mt-6 pt-4 border-t border-[var(--border)] flex justify-end">
              <button
                onClick={handleCancel}
                disabled={loading}
                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-bold px-4 py-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-100 dark:hover:border-red-900 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Cancel Booking'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
