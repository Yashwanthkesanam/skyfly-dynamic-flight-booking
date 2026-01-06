'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import { FlightItem } from '../types';
import { bookingService } from '../lib/services/bookingService';
import { savePNR } from '../lib/utils/storage';
import LoadingSpinner from './LoadingSpinner';
import { showSuccess, showError, showLoading, dismissToast } from '../lib/utils/toast';
import { useRouter } from 'next/navigation';
import { LockClosedIcon, CreditCardIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  flight: FlightItem | null; // Primary (Outbound)
  returnFlight?: FlightItem | null; // Optional Return
  onConfirmed: (pnr: string) => void;
}

export default function BookingModal({ isOpen, onClose, flight, returnFlight, onConfirmed }: BookingModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<'details' | 'reserved' | 'confirming' | 'success'>('details');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [passengerName, setPassengerName] = useState('');
  const [seats, setSeats] = useState(1);

  // Validation State
  const [formErrors, setFormErrors] = useState({ email: '', phone: '' });

  // Timer State
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Reservation Info
  const [resIdOut, setResIdOut] = useState<string | null>(null);
  const [resIdRet, setResIdRet] = useState<string | null>(null);

  const [pnrOut, setPnrOut] = useState('');
  const [pnrRet, setPnrRet] = useState('');

  // Start countdown when hold_expires_at is set for PRIMARY flight
  useEffect(() => {
    if (!resIdOut) return;
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
  }, [resIdOut, step]);

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

    const toastId = showLoading(autoConfirm ? 'Processing...' : 'Reserving flight(s)...');
    setLoading(true);
    setError('');

    try {
      // 1. Reserve Outbound
      const resOut = await bookingService.reserveFlight({
        flight_id: Number(flight.id),
        seats: seats,
        passenger_name: passengerName,
        passenger_contact: email
      });
      setResIdOut(resOut.reservation_id);

      // 2. Reserve Return (if exists)
      let resRet: any = null;
      if (returnFlight) {
        resRet = await bookingService.reserveFlight({
          flight_id: Number(returnFlight.id),
          seats: seats,
          passenger_name: passengerName,
          passenger_contact: email
        });
        setResIdRet(resRet.reservation_id);
      }

      // Calculate active time left from Outbound (assuming similar expiry)
      const expiresAt = new Date(resOut.hold_expires_at).getTime();
      const now = Date.now();
      const secondsLeft = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeLeft(secondsLeft);

      dismissToast(toastId);

      if (autoConfirm) {
        setStep('confirming');
        // Automatically call confirm with the new reservation IDs
        await finalizeBooking(resOut.reservation_id, returnFlight ? resRet!.reservation_id : null);
      } else {
        setStep('reserved');
        showSuccess('Seats reserved! Price locked for 5 mins.');
      }

    } catch (err: any) {
      console.error(err);
      dismissToast(toastId);
      let errorMsg = 'Reservation failed. Please try again.';
      const detail = err.response?.data?.detail;

      if (typeof detail === 'string') {
        errorMsg = detail;
      } else if (Array.isArray(detail)) {
        errorMsg = detail.map((e: any) => e.msg).join(', ');
      } else if (typeof detail === 'object' && detail !== null) {
        errorMsg = JSON.stringify(detail);
      }

      setError(errorMsg);
      showError(errorMsg);
    } finally {
      // If autoConfirm was true, finalizeBooking handles loading false
      if (!autoConfirm) setLoading(false);
    }
  };

  // Wrapper for button click which relies on state
  const handleConfirm = async (_e?: any) => {
    if (!resIdOut) return;
    await finalizeBooking(resIdOut, resIdRet);
  };

  const finalizeBooking = async (outboundId: string, returnId: string | null) => {
    setLoading(true);
    const toastId = showLoading('Finalizing booking...');

    try {
      // 1. Confirm Outbound
      const confirmOut = await bookingService.confirmBooking({
        reservation_id: outboundId,
        passengers: [{ name: passengerName || 'Traveller', age: 30, gender: 'male' }]
      });
      setPnrOut(confirmOut.pnr);
      savePNR(confirmOut.pnr);

      // 2. Confirm Return (if exists)
      if (returnId) {
        const confirmRet = await bookingService.confirmBooking({
          reservation_id: returnId,
          passengers: [{ name: passengerName || 'Traveller', age: 30, gender: 'male' }]
        });
        setPnrRet(confirmRet.pnr);
        savePNR(confirmRet.pnr);
      }

      dismissToast(toastId);
      onConfirmed(confirmOut.pnr); // Notify parent (pass primary PNR)

      // Redirect to confirmation page
      const pnrParams = new URLSearchParams();
      pnrParams.set('pnr', confirmOut.pnr);
      if (pnrRet) pnrParams.set('returnPnr', pnrRet);

      router.push(`/booking-confirmation?${pnrParams.toString()}`);

      // Close modal shortly after redirect starts
      setTimeout(() => {
        onClose();
      }, 500);

    } catch (err: any) {
      console.error(err);
      dismissToast(toastId);
      let errorMsg = 'Confirmation failed.';
      const detail = err.response?.data?.detail;

      if (typeof detail === 'string') {
        errorMsg = detail;
      } else if (Array.isArray(detail)) {
        errorMsg = detail.map((e: any) => e.msg).join(', ');
      } else if (typeof detail === 'object' && detail !== null) {
        errorMsg = JSON.stringify(detail);
      }

      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('details');
    setError('');
    setPnrOut('');
    setPnrRet('');
    setResIdOut(null);
    setResIdRet(null);
    setLoading(false);
    setTimeLeft(null);
    setSeats(1);
    onClose();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const totalPrice = ((flight?.dynamic_price || 0) + (returnFlight?.dynamic_price || 0)) * seats;

  return (
    <Modal isOpen={isOpen} onClose={pnrOut ? reset : onClose} title={step === 'success' ? 'Booking Confirmed!' : step === 'details' ? 'Passenger Details' : 'Complete Booking'}>
      {step === 'details' && (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          {/* Flight Summary Card */}
          {/* Ticket Style Summary Card */}
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 my-2">

            {/* Top Decoration Bar */}
            <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600 w-full"></div>

            <div className="p-5">
              {/* Header: Airline & Flight No */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                    {flight?.airline.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-[var(--fg)] text-lg leading-tight">{flight?.airline}</div>
                    <div className="text-xs text-[var(--muted)] mono font-medium">{flight?.flight_number}</div>
                  </div>
                </div>
                <div className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold uppercase rounded tracking-wider">
                  Confirmed
                </div>
              </div>

              {/* Route & Times */}
              <div className="flex flex-col sm:flex-row justify-between items-center relative py-2 gap-4 sm:gap-0">
                {/* Origin */}
                <div className="text-center sm:text-left min-w-[30%]">
                  <div className="text-2xl font-black text-[var(--fg)]">{flight?.departure_time.split('T')[1].substr(0, 5)}</div>
                  <div className="text-sm font-semibold text-[var(--muted)]">{flight?.origin}</div>
                  <div className="text-xs text-gray-400 mt-1">{flight?.date}</div>
                </div>

                {/* Duration / Divider */}
                <div className="flex-1 flex flex-col items-center px-2 w-full sm:w-auto">
                  <div className="text-xs text-[var(--muted)] mb-1">
                    {Math.floor((flight?.duration_minutes || 0) / 60)}h {(flight?.duration_minutes || 0) % 60}m
                  </div>
                  <div className="relative w-full flex items-center group">
                    <div className="h-[2px] bg-gray-300 dark:bg-gray-600 w-full rounded-full"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    </div>
                    {/* Plane Icon */}
                    <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-500">✈️</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Non-stop</div>
                </div>

                {/* Destination */}
                <div className="text-center sm:text-right min-w-[30%]">
                  <div className="text-2xl font-black text-[var(--fg)]">{flight?.arrival_time.split('T')[1].substr(0, 5)}</div>
                  <div className="text-sm font-semibold text-[var(--muted)]">{flight?.destination}</div>
                </div>
              </div>

            </div>

            {/* Ticket Tear-off Section (Notches & Dashed Line) */}
            <div className="relative flex items-center justify-center">
              <div className="absolute left-0 w-4 h-8 bg-[var(--bg)] rounded-r-full -ml-2 border-r border-[var(--border)] z-10"></div>
              <div className="w-full border-t-2 border-dashed border-gray-300 dark:border-gray-600 mx-2"></div>
              <div className="absolute right-0 w-4 h-8 bg-[var(--bg)] rounded-l-full -mr-2 border-l border-[var(--border)] z-10"></div>
            </div>

            {/* Bottom Section (Return Flight or Price) */}
            <div className="p-5 bg-gray-50 dark:bg-gray-700/30">
              <div className="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-600 pb-4">
                <div className="text-sm font-bold text-[var(--fg)]">Passengers</div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSeats(Math.max(1, seats - 1))}
                    className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                    disabled={seats <= 1}
                  >
                    -
                  </button>
                  <span className="font-bold text-lg w-4 text-center">{seats}</span>
                  {(() => {
                    const maxSeatsOut = flight?.seats_available ?? 1;
                    const maxSeatsRet = returnFlight ? (returnFlight.seats_available ?? 1) : maxSeatsOut;
                    const maxSeats = Math.min(maxSeatsOut, maxSeatsRet);

                    return (
                      <button
                        onClick={() => setSeats(Math.min(maxSeats, seats + 1))}
                        className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                        disabled={seats >= maxSeats}
                      >
                        +
                      </button>
                    );
                  })()}
                </div>
              </div>

              {returnFlight ? (
                <div className="space-y-4">
                  {/* Return Flight Mini-ticket */}
                  <div className="flex justify-between items-center opacity-80">
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-sm">Return</div>
                      <div className="text-xs text-[var(--muted)]">{returnFlight.flight_number}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">{returnFlight.origin} → {returnFlight.destination}</div>
                      <div className="text-xs text-[var(--muted)]">{returnFlight.date}</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-dashed border-gray-300 dark:border-gray-600 pt-3">
                    <div className="text-sm text-[var(--muted)]">Total Fare ({seats} Passengers)</div>
                    <div className="text-xl font-black text-blue-600 dark:text-blue-400">₹{totalPrice.toLocaleString()}</div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-xs text-[var(--muted)] uppercase tracking-wider mb-1">Total Fee ({seats} Pax)</div>
                    <div className="text-xs text-gray-400">Includes taxes & surcharges</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-[var(--fg)]">₹{totalPrice.toLocaleString()}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {/* Form Inputs */}
            <div>
              <label className="block text-sm font-medium text-[var(--fg)]">Passenger Name</label>
              <input
                type="text"
                value={passengerName}
                onChange={(e) => setPassengerName(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] px-4 py-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                className={`mt-1 block w-full rounded-lg border bg-[var(--bg)] text-[var(--fg)] px-4 py-3 shadow-sm focus:outline-none focus:ring-1 ${formErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-[var(--border)] focus:border-blue-500 focus:ring-blue-500'}`}
              />
              {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-[var(--fg)]">Mobile Number (India)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`pl-14 mt-1 block w-full rounded-lg border bg-[var(--bg)] text-[var(--fg)] px-4 py-3 shadow-sm focus:outline-none focus:ring-1 ${formErrors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-[var(--border)] focus:border-blue-500 focus:ring-blue-500'}`}
                placeholder="9876543210"
              />
              <span className="absolute left-4 top-[2.4rem] text-[var(--muted)] text-sm font-medium border-r border-gray-300 pr-2">+91</span>
              {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 pt-4 border-t border-[var(--border)]">
            <button
              onClick={() => handleReserve(false)}
              disabled={loading || !email || !passengerName}
              className="flex items-center justify-center gap-2 rounded-xl bg-[var(--surface)] text-[var(--fg)] border border-[var(--border)] px-4 py-3 text-sm font-bold shadow-sm hover:bg-[var(--bg)] disabled:opacity-50 transition-colors"
            >
              <LockClosedIcon className="w-4 h-4" />
              Reserve & Lock
            </button>
            <button
              onClick={() => handleReserve(true)}
              disabled={loading || !email || !passengerName}
              className="flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              <CreditCardIcon className="w-4 h-4" />
              Book & Pay
            </button>
          </div>
        </div >
      )
      }

      {/* RESERVED STATE */}
      {
        step === 'reserved' && (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-600 dark:text-yellow-400">
              <LockClosedIcon className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-[var(--fg)] mb-2">Price Locked!</h3>
            <p className="text-[var(--muted)] mb-6">Your seat(s) are reserved for <span className="font-mono font-bold text-orange-500 text-lg">{timeLeft !== null ? formatTime(timeLeft) : '--:--'}</span></p>

            <div className="space-y-3">
              <button
                onClick={() => setStep('confirming')}
                disabled={timeLeft !== null && timeLeft <= 0}
                className="w-full rounded-lg bg-[var(--accent)] px-4 py-3 text-base font-bold text-white shadow-sm hover:bg-orange-600 disabled:grayscale"
              >
                Pay Now to Confirm
              </button>
              <button
                onClick={onClose}
                className="w-full rounded-lg bg-transparent text-[var(--muted)] hover:text-[var(--fg)] px-4 py-2 text-sm font-medium"
              >
                View in My Bookings
              </button>
            </div>
          </div>
        )
      }

      {
        step === 'confirming' && (
          <div className="space-y-6">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 p-6 rounded-xl text-center shadow-sm">
              <div className="text-sm text-yellow-800 dark:text-yellow-200 font-bold uppercase tracking-wide mb-2">Total Amount</div>
              <div className="text-4xl font-black font-mono text-yellow-900 dark:text-yellow-100">
                ₹{totalPrice.toLocaleString()}
              </div>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2 font-medium">Completing your booking...</p>
            </div>

            <div className="border border-[var(--border)] rounded-xl p-4 bg-[var(--bg)] divide-y divide-[var(--border)]">
              <div className="flex justify-between items-center py-2">
                <span className="text-[var(--muted)]">{flight?.airline} {returnFlight && `+ ${returnFlight.airline}`}</span>
                <span className="text-lg font-bold text-[var(--fg)]">₹{totalPrice.toLocaleString()}</span>
              </div>
              <div className="text-xs text-[var(--muted)] pt-2 mt-2">
                Includes all taxes, fees and surcharges.
              </div>
            </div>

            <button
              onClick={() => handleConfirm()}
              disabled={loading || (timeLeft !== null && timeLeft <= 0)}
              className="w-full rounded-xl bg-[var(--accent)] px-4 py-4 text-lg font-bold text-white shadow-lg hover:bg-orange-600 disabled:opacity-50 disabled:grayscale transition-all transform active:scale-[0.98]"
            >
              {loading ? <span className="flex items-center justify-center gap-2"><LoadingSpinner size="sm" color="white" /> Processing Payment...</span> : `Pay ₹${totalPrice.toLocaleString()} & Book`}
            </button>
          </div>
        )
      }

      {
        step === 'success' && (
          <div className="text-center py-4">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 dark:text-green-400 animate-bounce">
              <CheckCircleIcon className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-[var(--fg)] mb-2">Booking Confirmed!</h3>
            <p className="text-[var(--muted)] mb-8">You're all set. Tickets have been sent to <span className="font-bold text-[var(--fg)]">{email}</span></p>

            <div className="space-y-4 mb-8">
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Outbound PNR</div>
                <div className="font-mono text-2xl font-black text-[var(--primary)]Tracking-widest">{pnrOut}</div>
                <div className="text-sm mt-1">{flight?.origin} → {flight?.destination}</div>
              </div>

              {pnrRet && (
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-500 uppercase font-bold mb-1">Return PNR</div>
                  <div className="font-mono text-2xl font-black text-orange-600 tracking-widest">{pnrRet}</div>
                  <div className="text-sm mt-1">{returnFlight?.origin} → {returnFlight?.destination}</div>
                </div>
              )}
            </div>

            <button
              onClick={reset}
              className="w-full rounded-xl bg-gray-900 dark:bg-gray-700 px-3 py-3 text-base font-bold text-white shadow-sm hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
            >
              Done
            </button>
          </div>
        )
      }
    </Modal >
  );
}
