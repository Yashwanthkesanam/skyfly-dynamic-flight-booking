// app/booking-confirmation/page.tsx
"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { bookingService } from '../../lib/services/bookingService';
import LoadingSpinner from '../../components/LoadingSpinner';
import { CheckCircleIcon, DocumentArrowDownIcon, HomeIcon, TicketIcon } from '@heroicons/react/24/solid';

function BookingConfirmationContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pnr = searchParams.get('pnr');

    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (pnr) {
            loadBooking();
        } else {
            setError('No booking reference found');
            setLoading(false);
        }
    }, [pnr]);

    const loadBooking = async () => {
        try {
            const data = await bookingService.getBooking(pnr!);
            setBooking(data);
        } catch (err) {
            setError('Failed to load booking details');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadReceipt = async () => {
        try {
            const receipt = await bookingService.getReceipt(pnr!);
            const { generatePDFReceipt } = await import('../../lib/utils/pdfGenerator');
            generatePDFReceipt(receipt);
        } catch (error) {
            console.error('Failed to download receipt:', error);
            alert('Failed to download receipt');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => router.push('/')}
                        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Go to Homepage
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Success Animation */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.6 }}
                    className="text-center mb-8"
                >
                    <div className="inline-block">
                        <CheckCircleIcon className="w-24 h-24 text-green-500 mx-auto mb-4" />
                    </div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-4xl font-bold text-gray-900 mb-2"
                    >
                        Booking Confirmed!
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-lg text-gray-600"
                    >
                        Your flight has been successfully booked
                    </motion.p>
                </motion.div>

                {/* PNR Card */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white rounded-xl shadow-xl p-8 mb-6"
                >
                    <div className="text-center border-b border-gray-200 pb-6 mb-6">
                        <p className="text-sm text-gray-600 mb-2">Your Booking Reference</p>
                        <div className="inline-block bg-blue-50 px-8 py-4 rounded-lg">
                            <p className="text-4xl font-bold text-blue-600 tracking-wider">{booking.pnr}</p>
                        </div>
                        <p className="text-sm text-gray-500 mt-3">Please save this reference number for future use</p>
                    </div>

                    {/* Booking Details */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                            <span className="text-gray-600">Status</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${booking.status === 'confirmed'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                {booking.status.toUpperCase()}
                            </span>
                        </div>

                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                            <span className="text-gray-600">Passenger Name</span>
                            <span className="font-semibold text-gray-900">{booking.passenger_name || 'N/A'}</span>
                        </div>

                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                            <span className="text-gray-600">Email</span>
                            <span className="font-semibold text-gray-900">{booking.passenger_contact || 'N/A'}</span>
                        </div>

                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                            <span className="text-gray-600">Seats Booked</span>
                            <span className="font-semibold text-gray-900">{booking.seats_booked}</span>
                        </div>

                        <div className="flex items-center justify-between py-3">
                            <span className="text-gray-600">Amount Paid</span>
                            <span className="text-2xl font-bold text-green-600">
                                ₹{booking.price_paid?.toFixed(2) || '0.00'}
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                    <button
                        onClick={handleDownloadReceipt}
                        className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
                    >
                        <DocumentArrowDownIcon className="w-5 h-5" />
                        Download Receipt
                    </button>

                    <button
                        onClick={() => router.push('/bookings')}
                        className="flex items-center justify-center gap-2 px-6 py-4 bg-white text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-lg border border-gray-200"
                    >
                        <TicketIcon className="w-5 h-5" />
                        My Bookings
                    </button>

                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center justify-center gap-2 px-6 py-4 bg-white text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-lg border border-gray-200"
                    >
                        <HomeIcon className="w-5 h-5" />
                        Book Another Flight
                    </button>
                </motion.div>

                {/* Info Box */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6"
                >
                    <div className="flex gap-3">
                        <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div className="text-sm text-blue-800">
                            <p className="font-semibold mb-2">What's Next?</p>
                            <ul className="list-disc list-inside space-y-1 text-blue-700">
                                <li>A confirmation email has been sent to your registered email address</li>
                                <li>Please arrive at the airport at least 2 hours before departure</li>
                                <li>Carry a valid ID proof for verification</li>
                                <li>You can manage your booking from the "My Bookings" section</li>
                            </ul>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

export default function BookingConfirmationPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        }>
            <BookingConfirmationContent />
        </Suspense>
    );
}
