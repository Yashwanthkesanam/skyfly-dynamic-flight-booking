'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import { FlightItem } from '../types';
import { bookingService } from '../lib/services/bookingService';
import { savePNR } from '../lib/utils/storage';
import LoadingSpinner from './LoadingSpinner';
import { showSuccess, showError, showLoading, dismissToast } from '../lib/utils/toast';
import { useRouter } from 'next/navigation';
import { LockClosedIcon, CreditCardIcon } from '@heroicons/react/24/solid';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  flight: FlightItem | null;
  onConfirmed: (pnr: string) => void;
}

export default function BookingModal({ isOpen, onClose, flight, onConfirmed }: BookingModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<'details' | 'reserved' | 'confirming' | 'success'>('details');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [passengerName, setPassengerName] = useState('');

  // Validation State
  const [formErrors, setFormErrors] = useState({ email: '', phone: '' });

  // Timer State
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Reservation Info
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [pnr, setPnr] = useState('');

  // Start countdown when hold_expires_at is set
  useEffect(() => {
    if (!reservationId) return;
    // Run timer in 'reserved' and 'confirming' steps
    if (step !== 'reserved' && step !== 'confirming') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [reservationId, step]);

  const validate = () => {
    let valid = true;
    const errors = { email: '', phone: '' };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.email = 'Please enter a valid email address';
      valid = false;
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      errors.phone = 'Enter valid 10-digit number starting with 6-9';
      valid = false;
    }

    setFormErrors(errors);
    return valid;
  };

  const handleReserve = async (autoConfirm: boolean) => {
    if (!validate()) {
      showError('Please fix the form errors');
      return;
    }
    if (!flight) return;

    const toastId = showLoading(autoConfirm ? 'Processing...' : 'Reserving flight...');
    setLoading(true);
    setError('');

    try {
      // 1. Reserve
      const res = await bookingService.reserveFlight({
        flight_id: Number(flight.id),
        seats: 1,
        passenger_name: passengerName,
        passenger_contact: email
      });

      setReservationId(res.reservation_id);

      // Calculate active time left
      const expiresAt = new Date(res.hold_expires_at).getTime();
      const now = Date.now();
      const secondsLeft = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeLeft(secondsLeft);

      dismissToast(toastId);

      if (autoConfirm) {
        setStep('confirming');
        // Automatically call confirm with the new reservation ID
        await handleConfirm(res.reservation_id);
      } else {
        setStep('reserved');
        showSuccess('Seat reserved! Price locked for 5 mins.');
      }

    } catch (err: any) {
      console.error(err);
      dismissToast(toastId);
      const errorMsg = err.response?.data?.detail || 'Reservation failed. Please try again.';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      // Always reset loading. If autoConfirm was true, handleConfirm would have finished by now.
      // If it failed or succeeded, we are done with this chain.
      setLoading(false);
    }
  };

  const handleConfirm = async (arg?: string | React.MouseEvent | any) => {
    // Determine if we have a direct reservation ID string or if it's an event
    const directResId = typeof arg === 'string' ? arg : undefined;
    const targetReservationId = directResId || reservationId;

    if (!targetReservationId) return;

    setLoading(true);
    // Use toast only if initiated by user click (not auto-confirm)
    const isAuto = !!directResId;
    const toastId = !isAuto ? showLoading('Finalizing booking...') : undefined;

    try {
      // 2. Confirm
      const confirmRes = await bookingService.confirmBooking({
        reservation_id: targetReservationId,
        passengers: [{ name: passengerName || 'Traveller', age: 30, gender: 'male' }]
      });

      if (toastId) dismissToast(toastId);
      setPnr(confirmRes.pnr);
      savePNR(confirmRes.pnr); // Save PNR to localStorage
      onConfirmed(confirmRes.pnr);
      setStep('success');
      showSuccess('Booking confirmed! Check your email for ticket.');

      if (step === 'confirming') {
        setTimeout(() => {
          router.push(`/booking-confirmation?pnr=${confirmRes.pnr}`);
          reset();
        }, 2000);
      }

    } catch (err: any) {
      console.error(err);
      if (toastId) dismissToast(toastId);
      const errorMsg = err.response?.data?.detail || 'Confirmation failed.';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('details');
    setError('');
    setPnr('');
    setReservationId(null);
    setLoading(false);
    setTimeLeft(null);
    onClose();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={pnr ? reset : onClose} title={step === 'success' ? 'Booking Confirmed!' : step === 'details' ? 'Passenger Details' : 'Complete Booking'}>
      {step === 'details' && (
        <div className="space-y-4">
          {flight && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm mb-4 border border-blue-100 dark:border-blue-900">
              <div className="font-bold text-[var(--primary)]">{flight.airline} • {flight.flight_number}</div>
              <div className="text-gray-600 dark:text-gray-300">{flight.origin} → {flight.destination}</div>
            </div>
          )}

          <div className="space-y-3">
            {/* Form Inputs (Same as before) */}
            <div>
              <label className="block text-sm font-medium text-[var(--fg)]">Passenger Name</label>
              <input
                type="text"
                value={passengerName}
                onChange={(e) => setPassengerName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--fg)]">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className={`mt-1 block w-full rounded-md border bg-[var(--bg)] text-[var(--fg)] px-3 py-2 shadow-sm focus:outline-none focus:ring-1 ${formErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-[var(--border)] focus:border-blue-500 focus:ring-blue-500'}`}
              />
              {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-[var(--fg)]">Mobile Number (India)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`pl-12 mt-1 block w-full rounded-md border bg-[var(--bg)] text-[var(--fg)] px-3 py-2 shadow-sm focus:outline-none focus:ring-1 ${formErrors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-[var(--border)] focus:border-blue-500 focus:ring-blue-500'}`}
                placeholder="9876543210"
              />
              <span className="absolute left-3 top-9 text-[var(--muted)] text-sm font-medium">+91</span>
              {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <button
              onClick={() => handleReserve(false)}
              disabled={loading || !email || !passengerName}
              className="flex items-center justify-center gap-2 rounded-md bg-[var(--surface)] text-[var(--fg)] border border-[var(--border)] px-4 py-2 text-sm font-semibold shadow-sm hover:bg-[var(--bg)] disabled:opacity-50 transition-colors"
            >
              <LockClosedIcon className="w-4 h-4" />
              Reserve & Lock
            </button>
            <button
              onClick={() => handleReserve(true)}
              disabled={loading || !email || !passengerName}
              className="flex items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              <CreditCardIcon className="w-4 h-4" />
              Book & Pay
            </button>
          </div>
        </div>
      )}

      {/* RESERVED STATE (New) */}
      {step === 'reserved' && (
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-600 dark:text-yellow-400">
            <LockClosedIcon className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-[var(--fg)] mb-2">Price Locked!</h3>
          <p className="text-[var(--muted)] mb-6">Your seat is reserved for <span className="font-mono font-bold">{timeLeft !== null ? formatTime(timeLeft) : '--:--'}</span></p>

          <div className="space-y-3">
            <button
              onClick={() => setStep('confirming')}
              disabled={timeLeft !== null && timeLeft <= 0}
              className="w-full rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
            >
              Pay Now to Confirm
            </button>
            <button
              onClick={onClose}
              className="w-full rounded-md bg-transparent text-[var(--muted)] hover:text-[var(--fg)] px-4 py-2 text-sm font-medium"
            >
              View in My Bookings
            </button>
          </div>
        </div>
      )}

      {step === 'confirming' && (
        <div className="space-y-6">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 p-4 rounded-lg text-center">
            <div className="text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-1">Total Amount</div>
            <div className="text-3xl font-black font-mono text-yellow-900 dark:text-yellow-100">
              ₹{flight?.dynamic_price}
            </div>
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">Completing your booking...</p>
          </div>

          <div className="border border-[var(--border)] rounded-lg p-4 bg-[var(--bg)]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[var(--muted)]">Total Amount</span>
              <span className="text-xl font-bold text-[var(--fg)]">₹{flight?.dynamic_price}</span>
            </div>
            <div className="text-xs text-[var(--muted)] border-t border-[var(--border)] pt-2 mt-2">
              Includes all taxes and fees.
            </div>
          </div>

          <button
            onClick={handleConfirm}
            disabled={loading || (timeLeft !== null && timeLeft <= 0)}
            className="w-full rounded-md bg-[var(--accent)] px-4 py-3 text-lg font-bold text-white shadow-lg hover:bg-orange-600 disabled:opacity-50 disabled:grayscale transition-all"
          >
            {loading ? <span className="flex items-center justify-center gap-2"><LoadingSpinner size="sm" color="white" /> Confirming Payment...</span> : `Pay ₹${flight?.dynamic_price} & Book`}
          </button>

          {timeLeft !== null && timeLeft <= 0 && (
            <p className="text-center text-red-500 text-sm font-semibold">Reservation expired. Please search again.</p>
          )}
        </div>
      )}

      {step === 'success' && (
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 dark:text-green-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h3 className="text-2xl font-bold text-[var(--fg)] mb-2">Booking Confirmed!</h3>
          <p className="text-[var(--muted)] mb-6">Your PNR is <span className="font-mono font-bold text-[var(--fg)] text-xl bg-[var(--bg)] border border-[var(--border)] px-2 py-1 rounded">{pnr}</span></p>

          <button
            onClick={reset}
            className="w-full rounded-md bg-gray-900 dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 dark:hover:bg-gray-600"
          >
            Done
          </button>
        </div>
      )}
    </Modal>
  );
}
