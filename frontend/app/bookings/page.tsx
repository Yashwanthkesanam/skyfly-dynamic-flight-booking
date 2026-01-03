// FILE: app/bookings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { bookingService } from '../../lib/services/bookingService';
import { TicketIcon, XCircleIcon, DocumentArrowDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { SearchResultsSkeleton } from '../../components/LoadingStates';
import { showLoading, dismissToast } from '../../lib/utils/toast';
import EmptyState from '../../components/EmptyState';
import { format, parseISO } from 'date-fns';
import { getStoredPNRs } from '../../lib/utils/storage';

interface Booking {
    id: number;
    pnr: string;
    status: string;
    flight_id: number;
    seats_booked: number;
    passenger_name: string;
    price_paid: number;
    created_at: string;
    flight?: any;
}

export default function BookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [searchPNR, setSearchPNR] = useState('');

    useEffect(() => {
        loadBookings();
    }, [filter]);

    const loadBookings = async () => {
        setLoading(true);
        try {
            const storedPnrs = getStoredPNRs();

            if (storedPnrs.length === 0) {
                setBookings([]);
                return;
            }

            const filters: any = filter !== 'all' ? { status: filter } : {};
            filters.pnrs = storedPnrs;

            const data = await bookingService.listBookings(filters);
            setBookings(data || []);
        } catch (error) {
            console.error('Failed to load bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (pnr: string) => {
        if (!confirm('Are you sure you want to cancel this booking?')) return;

        try {
            await bookingService.cancelWithRefund(pnr);
            loadBookings(); // Refresh list
        } catch (error) {
            alert('Failed to cancel booking');
        }
    };

    const handleDownloadReceipt = async (pnr: string) => {
        try {
            const receipt = await bookingService.getReceipt(pnr);

            // Dynamically import PDF generator to avoid SSR issues
            const { generatePDFReceipt } = await import('../../lib/utils/pdfGenerator');
            generatePDFReceipt(receipt);
        } catch (error) {
            console.error('Failed to download receipt:', error);
            alert('Failed to download receipt');
        }
    };

    const filteredBookings = searchPNR
        ? bookings.filter(b => b.pnr?.toLowerCase().includes(searchPNR.toLowerCase()))
        : bookings;

    const statusColors = {
        confirmed: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-100 border-green-300 dark:border-green-800',
        reserved: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-100 border-yellow-300 dark:border-yellow-800',
        cancelled: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 border-red-300 dark:border-red-800',
        expired: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
    };

    return (
        <div className="min-h-screen bg-[var(--bg)] py-8 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[var(--fg)] mb-2">My Bookings</h1>
                    <p className="text-[var(--muted)]">Manage your flight reservations and bookings</p>
                </div>

                {/* Filters & Search */}
                <div className="bg-[var(--surface)] rounded-xl shadow-sm border border-[var(--border)] p-4 mb-6 transition-colors">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        {/* Status Filters */}
                        <div className="flex gap-2 flex-wrap">
                            {['all', 'confirmed', 'reserved', 'cancelled'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilter(status)}
                                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${filter === status
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-gray-100 dark:bg-gray-800 text-[var(--fg)] hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                    suppressHydrationWarning
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* PNR Search */}
                        <div className="relative w-full md:w-64">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
                            <input
                                type="text"
                                placeholder="Search by PNR..."
                                value={searchPNR}
                                onChange={(e) => setSearchPNR(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[var(--bg)] text-[var(--fg)] placeholder:[var(--muted)]"
                                suppressHydrationWarning
                            />
                        </div>
                    </div>
                </div>

                {/* Bookings List */}
                {loading ? (
                    <SearchResultsSkeleton count={3} />
                ) : filteredBookings.length === 0 ? (
                    <EmptyState
                        type="no-bookings"
                        action={{
                            label: 'Search Flights',
                            onClick: () => window.location.href = '/'
                        }}
                    />
                ) : (
                    <div className="space-y-4">
                        {filteredBookings.map((booking) => (
                            <motion.div
                                key={booking.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-[var(--surface)] rounded-xl shadow-sm border border-[var(--border)] p-6 hover:shadow-md transition-shadow"
                            >
                                <div className="flex flex-col md:flex-row gap-6">
                                    {/* Booking Info */}
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <TicketIcon className="w-6 h-6 text-blue-600" />
                                                    <h3 className="text-xl font-bold text-[var(--fg)]">
                                                        PNR: {booking.pnr || 'Pending'}
                                                    </h3>
                                                </div>
                                                <p className="text-sm text-[var(--muted)]">
                                                    Booked on {format(parseISO(booking.created_at), 'MMM dd, yyyy HH:mm')}
                                                </p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[booking.status as keyof typeof statusColors] || statusColors.reserved}`}>
                                                {booking.status.toUpperCase()}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                            <div>
                                                <div className="text-xs text-[var(--muted)] mb-1">Passenger</div>
                                                <div className="font-semibold text-[var(--fg)]">{booking.passenger_name || 'N/A'}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-[var(--muted)] mb-1">Seats</div>
                                                <div className="font-semibold text-[var(--fg)]">{booking.seats_booked}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-[var(--muted)] mb-1">Amount Paid</div>
                                                <div className="font-semibold text-[var(--fg)]">
                                                    {booking.price_paid ? `₹${booking.price_paid.toFixed(2)}` : 'Pending'}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-[var(--muted)] mb-1">Flight ID</div>
                                                <div className="font-semibold text-[var(--fg)]">#{booking.flight_id}</div>
                                            </div>
                                        </div>

                                        {/* Flight Details (if available) */}
                                        {booking.flight && (
                                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm">
                                                <div className="flex items-center gap-4 text-[var(--fg)]">
                                                    <span className="font-semibold">{booking.flight.flight_number}</span>
                                                    <span className="text-[var(--muted)]">
                                                        {booking.flight.origin} → {booking.flight.destination}
                                                    </span>
                                                    <span className="text-[var(--muted)]">{booking.flight.flight_date}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex md:flex-col gap-2 justify-end">
                                        {booking.status === 'reserved' && (
                                            <button
                                                onClick={() => {
                                                    // Demo confirmation flow for bookings page 
                                                    // In real app, would open payment modal. 
                                                    // Here we just auto-confirm for speed/demo purposes per user mental model of 'Confirm'.
                                                    if (confirm('Confirm payment for this reservation?')) {
                                                        const toastId = showLoading('Processing Payment...');
                                                        bookingService.confirmBooking({
                                                            reservation_id: String(booking.id),
                                                            passengers: [{
                                                                name: booking.passenger_name || 'Traveller',
                                                                age: 30,
                                                                gender: 'male'
                                                            }]
                                                        }).then(() => {
                                                            dismissToast(toastId);
                                                            alert('Booking Confirmed!');
                                                            loadBookings();
                                                        }).catch(err => {
                                                            dismissToast(toastId);
                                                            alert('Payment Failed: ' + (err.response?.data?.detail || err.message));
                                                        });
                                                    }
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
                                            >
                                                Pay Now
                                            </button>
                                        )}
                                        {booking.pnr && (
                                            <>
                                                <button
                                                    onClick={() => handleDownloadReceipt(booking.pnr)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                                >
                                                    <DocumentArrowDownIcon className="w-4 h-4" />
                                                    Receipt
                                                </button>
                                                {booking.status === 'confirmed' && (
                                                    <button
                                                        onClick={() => handleCancel(booking.pnr)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                                                    >
                                                        <XCircleIcon className="w-4 h-4" />
                                                        Cancel
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Statistics */}
                {!loading && bookings.length > 0 && (
                    <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {['all', 'confirmed', 'reserved', 'cancelled'].map((status) => {
                            const count = status === 'all'
                                ? bookings.length
                                : bookings.filter(b => b.status === status).length;
                            return (
                                <div key={status} className="bg-[var(--surface)] rounded-lg p-4 border border-[var(--border)]">
                                    <div className="text-2xl font-bold text-[var(--fg)]">{count}</div>
                                    <div className="text-sm text-[var(--muted)] capitalize">{status} Bookings</div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
