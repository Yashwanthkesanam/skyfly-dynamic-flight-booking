'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, Suspense } from 'react';
import { bookingService, BookingDetails } from '../../lib/services/bookingService';
import LoadingSpinner from '../../components/LoadingSpinner';
import { CheckCircleIcon, ArrowDownTrayIcon, MapPinIcon, QrCodeIcon, TicketIcon, HomeIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

function BookingConfirmationContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pnr = searchParams.get('pnr');

    const [booking, setBooking] = useState<BookingDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const ticketRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!pnr) {
            router.push('/');
            return;
        }

        const fetchBooking = async () => {
            try {
                const data = await bookingService.getBooking(pnr);
                setBooking(data);
            } catch (err) {
                console.error(err);
                setError('Failed to retrieve booking details.');
            } finally {
                setLoading(false);
            }
        };

        fetchBooking();
    }, [pnr, router]);

    // Use native print for robust PDF generation (avoids html2canvas parsing errors)
    const downloadTicket = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <LoadingSpinner size="lg" color="blue" />
                <p className="mt-4 text-gray-500 animate-pulse">Retrieving your ticket...</p>
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-red-50 p-8 rounded-2xl text-center max-w-md">
                    <h2 className="text-2xl font-bold text-red-600 mb-2">Something went wrong</h2>
                    <p className="text-gray-600 mb-6">{error || "Booking not found."}</p>
                    <button onClick={() => router.push('/')} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">Go Home</button>
                </div>
            </div>
        );
    }

    // Formatting helpers
    const depTime = booking.flight?.departure_iso || booking.flight?.departure_time || new Date().toISOString();
    // If arrival isn't in flight obj (interface says optional), assume duration or mock
    const durationMin = booking.flight?.duration_min || 120;
    const arrTime = new Date(new Date(depTime).getTime() + durationMin * 60000).toISOString();

    const depDateObj = new Date(depTime);
    const arrDateObj = new Date(arrTime);

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 print:bg-white print:p-0">
            {/* Print Styles: Hide everything except the ticket visual */}
            <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #ticket-visual, #ticket-visual * {
            visibility: visible;
          }
          #ticket-visual {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            box-shadow: none !important;
            border: 1px solid #ddd !important;
          }
          /* Hide non-essential UI elements explicitly if needed */
          .no-print {
            display: none !important;
          }
        }
      `}</style>

            <div className="max-w-3xl mx-auto print:max-w-none print:w-full">

                {/* Success Header */}
                <div className="text-center mb-10 animate-fade-in-up print:hidden">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6 animate-bounce shadow-green-200 shadow-lg">
                        <CheckCircleIcon className="w-12 h-12 text-green-600" />
                    </div>
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Booking Confirmed!</h1>
                    <p className="text-lg text-gray-600">Your trip is set. Pack your bags!</p>
                </div>

                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200 print:hidden">
                    <div className="text-sm text-gray-500">
                        Booking Reference: <span className="font-mono font-bold text-blue-600 text-xl ml-2 tracking-widest">{booking.pnr}</span>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3">
                        <button
                            onClick={downloadTicket}
                            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-full font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-95 transform hover:-translate-y-0.5"
                        >
                            <ArrowDownTrayIcon className="w-5 h-5" /> Download Ticket
                        </button>
                        <Link
                            href="/pnr"
                            className="flex items-center gap-2 bg-orange-50 text-orange-700 border border-orange-200 px-5 py-2.5 rounded-full font-bold shadow-sm hover:bg-orange-100 transition-all transform hover:-translate-y-0.5"
                        >
                            <MapPinIcon className="w-5 h-5" /> Track Flight
                        </Link>
                    </div>
                </div>

                {/* TICKET CONTAINER (The part to be captured) */}
                <div className="mb-10 transform hover:scale-[1.005] transition-transform duration-300 print:transform-none print:hover:scale-100 print:mb-0">
                    <div ref={ticketRef} id="ticket-visual" className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200 print:shadow-none print:rounded-none print:border-none">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 flex justify-between items-center text-white relative overflow-hidden">
                            {/* Decorative Circles */}
                            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                            <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>

                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-inner">
                                    <span className="font-black text-xl italic">FLY</span>
                                </div>
                                <div>
                                    <div className="font-bold text-lg tracking-wide uppercase text-shadow-sm">Boarding Pass</div>
                                    <div className="text-blue-100 text-xs font-mono tracking-wider">Economy Class</div>
                                </div>
                            </div>
                            <div className="text-right relative z-10">
                                <div className="text-blue-200 text-xs uppercase font-bold tracking-wider">Airline</div>
                                <div className="font-bold text-2xl">{booking.flight?.airline || 'Airline'}</div>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-8 relative">

                            {/* Passenger & Flight Info Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4 mb-8">
                                <div className="group">
                                    <label className="block text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Passenger</label>
                                    <div className="text-lg font-bold text-gray-900 truncate">{booking.passenger_name}</div>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Flight</label>
                                    <div className="text-lg font-bold text-gray-900">{booking.flight?.flight_number}</div>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Gate</label>
                                    <div className="text-lg font-bold text-gray-900">--</div>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Seat</label>
                                    <div className="text-2xl font-black text-blue-600">{booking.seats_booked > 1 ? `${booking.seats_booked} Seats` : '--'}</div>
                                </div>
                            </div>

                            {/* Route */}
                            <div className="flex items-center justify-between border-t border-b border-gray-100 py-8 mb-8 bg-gray-50/50 -mx-8 px-8">
                                <div className="text-left w-1/3">
                                    <div className="text-5xl font-black text-gray-900 tracking-tighter">{booking.flight?.origin}</div>
                                    <div className="text-sm text-gray-500 font-medium uppercase mt-1">Departure</div>
                                    <div className="text-xl font-bold text-blue-600 mt-2">
                                        {depDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className="text-xs text-gray-400 font-medium">{depDateObj.toDateString()}</div>
                                </div>

                                <div className="flex-1 px-4 flex flex-col items-center justify-center w-1/3">
                                    <div className="text-gray-300 mb-2 transform rotate-90 sm:rotate-0">✈</div>
                                    <div className="w-full h-0.5 bg-gray-300 relative border-t border-dashed border-gray-400">
                                        <div className="absolute top-1/2 left-0 w-2 h-2 bg-blue-500 rounded-full -translate-y-[2px]"></div>
                                        <div className="absolute top-1/2 right-0 w-2 h-2 bg-blue-500 rounded-full -translate-y-[2px]"></div>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-2 font-mono">{Math.floor(durationMin / 60)}h {durationMin % 60}m</div>
                                </div>

                                <div className="text-right w-1/3">
                                    <div className="text-5xl font-black text-gray-900 tracking-tighter">{booking.flight?.destination}</div>
                                    <div className="text-sm text-gray-500 font-medium uppercase mt-1">Arrival</div>
                                    <div className="text-xl font-bold text-blue-600 mt-2">
                                        {arrDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className="text-xs text-gray-400 font-medium">{arrDateObj.toDateString()}</div>
                                </div>
                            </div>

                            {/* Footer / QR */}
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Booking Reference</div>
                                    <div className="font-mono text-3xl font-black tracking-[0.2em] text-gray-900">{booking.pnr}</div>
                                    <div className="mt-2 inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-bold uppercase rounded-full">
                                        {booking.status}
                                    </div>
                                    {booking.seats_booked > 1 && (
                                        <div className="mt-1 text-xs text-gray-500 font-medium">
                                            Includes {booking.seats_booked} passengers
                                        </div>
                                    )}
                                </div>
                                {/* Fake QR Code Visual */}
                                <div className="w-24 h-24 bg-gray-900 text-white p-2 flex items-center justify-center rounded-lg shadow-inner">
                                    <QrCodeIcon className="w-full h-full opacity-90" />
                                </div>
                            </div>

                        </div>

                        {/* Tear-off Stub (Visual) */}
                        <div className="border-t-4 border-dotted border-gray-300 bg-gray-50 p-6 flex flex-col sm:flex-row justify-between items-center text-center sm:text-left gap-4">
                            <div className="text-xs text-gray-500 max-w-sm">
                                <span className="font-bold text-gray-700 block mb-1">IMPORTANT INFO:</span>
                                Gate closes 20 minutes before departure. Please verify your terminal and gate screens at the airport.
                            </div>
                            <div className="text-xs text-gray-400 font-mono text-right">
                                Electronic Ticket<br />FlySmart Inc.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Footer */}
                <div className="flex justify-center gap-6 text-sm font-medium text-blue-600 print:hidden">
                    <Link href="/bookings" className="hover:underline hover:text-blue-800 flex items-center gap-1">
                        <TicketIcon className="w-4 h-4" /> My Bookings
                    </Link>
                    <Link href="/" className="hover:underline hover:text-blue-800 flex items-center gap-1">
                        <HomeIcon className="w-4 h-4" /> Book Another Flight
                    </Link>
                </div>

            </div>
        </div>
    );
}

export default function BookingConfirmationPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <LoadingSpinner size="lg" color="blue" />
            </div>
        }>
            <BookingConfirmationContent />
        </Suspense>
    );
}
