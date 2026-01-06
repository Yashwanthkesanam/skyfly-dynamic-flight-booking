'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminService, SimulatorStatus } from '../../lib/services/adminService';
import { flightService } from '../../lib/services/flightService';
import { FlightItem } from '../../types';
import Spinner from '../../components/Spinner';
import CSVUploader from '../../components/CSVUploader';
import { authService } from '../../lib/utils/auth';
import { TableRowSkeleton } from '../../components/Skeleton';
import {
  CalendarIcon,
  ArrowPathIcon,
  CloudArrowUpIcon,
  ChartBarIcon,
  TicketIcon,
  TrashIcon
} from '@heroicons/react/24/outline'; // Assuming you might have heroicons, if not I'll use text/emoji or standard SVGs

// Simple icon components if heroicons not available
const IconCalendar = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const IconRefresh = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
const IconUpload = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>;
const IconTrash = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

export default function AdminPage() {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);

  // Tab State
  const [activeTab, setActiveTab] = useState<'simulator' | 'flights' | 'bookings'>('simulator');

  // Filters
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Default to Today in YYYY-MM-DD (local time)
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(d.getTime() - offset)).toISOString().slice(0, 10);
    return localISOTime;
  });
  const [bookingDate, setBookingDate] = useState<string>('');

  // Data
  const [status, setStatus] = useState<SimulatorStatus | null>(null);
  const [flights, setFlights] = useState<FlightItem[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [showUploader, setShowUploader] = useState(false);
  const [eventCity, setEventCity] = useState<string>('');
  const [eventType, setEventType] = useState<string>(''); // For visual feedback if needed

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    setAuthChecking(false);

    const interval = setInterval(fetchStatus, 2000);
    fetchStatus();

    // Initial fetch
    fetchFlights();
    fetchBookings();

    return () => clearInterval(interval);
  }, [router]);

  // Use Effect to refetch flights when date changes (only if in flights tab)
  useEffect(() => {
    if (activeTab === 'flights') {
      fetchFlights();
    }
  }, [selectedDate, activeTab]);

  const fetchStatus = async () => {
    try {
      const s = await adminService.getSimulatorStatus();
      setStatus(s);
    } catch (e) { console.error(e); }
  };

  const fetchFlights = async () => {
    setLoading(true);
    try {
      // Use Search Endpoint to get Dynamic Pricing + Date Filtering
      // If date is empty, it fetches all (limit applied)
      const f = await flightService.searchFlights({
        date: selectedDate,
        limit: 100 // Fetch 100 for proper view
      });
      setFlights(f);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      const b = await authService.getBookings(bookingDate);
      setBookings(b);
    } catch (e) { console.error(e); } finally { setLoadingBookings(false); }
  };

  useEffect(() => {
    if (activeTab === 'bookings') {
      fetchBookings();
    }
  }, [bookingDate, activeTab]);

  const handleDeleteFlight = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this flight? This action cannot be undone.")) return;
    try {
      await adminService.deleteFlight(id);
      setFlights(prev => prev.filter(f => f.id !== id));
    } catch (e) {
      alert("Failed to delete flight");
    }
  };

  const handleSimAction = async (action: 'start' | 'stop' | 'tick') => {
    setActionLoading(true);
    try {
      if (action === 'start') await adminService.startSimulator();
      if (action === 'stop') await adminService.stopSimulator();
      if (action === 'tick') await adminService.tickSimulator();
      await fetchStatus();
    } catch (e) { alert('Action failed'); } finally { setActionLoading(false); }
  };

  const handleTrigger = async (city: string, factor: number) => {
    try {
      await adminService.triggerEvent(city, factor);
      alert(`Event triggered for ${city}! Check flights.`);
    } catch (e) { alert('Trigger failed'); }
  };

  const handleLogout = () => {
    authService.logout();
    router.push('/');
  };

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="text-center">
          <Spinner className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <p className="text-[var(--muted)]">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Calculate quick stats from displayed flights
  const surgeCount = flights.filter(f => (f.price_increase_percent || 0) > 0).length;
  const avgPrice = flights.length > 0 ? Math.round(flights.reduce((acc, f) => acc + f.dynamic_price, 0) / flights.length) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24 font-sans text-[var(--fg)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Console</h1>
          <p className="text-[var(--muted)] text-sm">Manage simulator, schedule, and bookings</p>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-semibold transition-colors shadow-sm"
        >
          Logout
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[var(--border)] mb-8 overflow-x-auto gap-8">
        {[
          { id: 'simulator', label: 'Flight Simulator' },
          { id: 'flights', label: 'Manage Schedule' },
          { id: 'bookings', label: 'Bookings' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 font-medium whitespace-nowrap transition-all border-b-2 px-2
                    ${activeTab === tab.id
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--fg)] hover:border-gray-300'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ---------------- SIMULATOR TAB ---------------- */}
      {activeTab === 'simulator' && (
        <div className="animate-fade-in-up">
          <div className="bg-[var(--surface)] p-6 rounded-xl shadow-sm border border-[var(--border)] mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-3">
                  Simulator Status
                  <span className={`text-xs px-2 py-1 rounded-full uppercase font-bold tracking-wide
                            ${status?.running ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                    {status?.running ? 'Live' : 'Offline'}
                  </span>
                </h2>
                <div className="mt-2 text-3xl font-mono font-bold">
                  {status?.current_time ? new Date(status.current_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  <span className="text-lg text-[var(--muted)] font-sans ml-2">
                    {status?.current_time ? new Date(status.current_time).toLocaleDateString() : ''}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                {!status?.running ? (
                  <button onClick={() => handleSimAction('start')} disabled={actionLoading} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-green-900/20 transform hover:-translate-y-0.5 transition-all">Start Engine</button>
                ) : (
                  <button onClick={() => handleSimAction('stop')} disabled={actionLoading} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-red-900/20 transform hover:-translate-y-0.5 transition-all">Emergency Stop</button>
                )}
                <button onClick={() => handleSimAction('tick')} disabled={actionLoading} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-[var(--fg)] px-4 py-3 rounded-lg font-bold transition-colors">Hike Prices</button>
              </div>
            </div>

            {/* Dynamic Event Generator */}
            <div className="pt-6 border-t border-[var(--border)]">
              <h3 className="font-bold text-sm uppercase text-[var(--muted)] mb-4">Event Generator</h3>

              <div className="flex flex-col md:flex-row gap-4 items-end">
                {/* City Selector */}
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold mb-1 ml-1">Target City</label>
                  <select
                    value={eventCity}
                    onChange={(e) => setEventCity(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] appearance-none cursor-pointer hover:border-blue-500 transition-colors"
                  >
                    <option value="">Select Target...</option>
                    {Array.from(new Set(flights.flatMap(f => [f.origin, f.destination]))).sort().map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                {/* Presets */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full md:w-auto">
                  <button
                    onClick={() => eventCity ? handleTrigger(eventCity, 0.5) : alert('Select a city first')}
                    className="px-4 py-3 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-xl font-bold text-sm hover:bg-purple-100 transition-colors border border-transparent hover:border-purple-200"
                  >
                    🔥 High Demand
                  </button>
                  <button
                    onClick={() => eventCity ? handleTrigger(eventCity, -0.3) : alert('Select a city first')}
                    className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl font-bold text-sm hover:bg-blue-100 transition-colors border border-transparent hover:border-blue-200"
                  >
                    ❄️ Low Demand
                  </button>
                  <button
                    onClick={() => eventCity ? handleTrigger(eventCity, -0.8) : alert('Select a city first')}
                    className="px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors border border-transparent hover:border-red-200"
                  >
                    🚨 Crisis
                  </button>
                  <button
                    onClick={() => eventCity ? handleTrigger(eventCity, 1.0) : alert('Select a city first')}
                    className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-xl font-bold text-sm hover:bg-amber-100 transition-colors border border-transparent hover:border-amber-200"
                  >
                    🚀 Mega Surge
                  </button>
                </div>

                {/* Reset & Randomizer */}
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (!eventCity) return alert('Select a city first');
                      try {
                        await adminService.resetEvent(eventCity);
                        alert(`Demand reset to normal for ${eventCity}`);
                      } catch (e) { alert('Reset failed'); }
                    }}
                    className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-500"
                    title="Reset Demand (Stop Surge)"
                  >
                    ↺
                  </button>

                  <button
                    onClick={() => {
                      const cities = Array.from(new Set(flights.flatMap(f => [f.origin, f.destination])));
                      if (cities.length === 0) return alert('No cities available');
                      const randomCity = cities[Math.floor(Math.random() * cities.length)];
                      setEventCity(randomCity);
                    }}
                    className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    title="Random City"
                  >
                    🎲
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- FLIGHTS TAB ---------------- */}
      {activeTab === 'flights' && (
        <div className="animate-fade-in-up space-y-6">

          {/* Control Deck */}
          <div className="bg-[var(--surface)] p-4 rounded-xl shadow-sm border border-[var(--border)] flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
              {/* Date Picker */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--muted)]">
                  <IconCalendar />
                </div>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              {/* Clear Filter */}
              {selectedDate && (
                <button onClick={() => setSelectedDate('')} className="text-sm text-[var(--muted)] hover:text-blue-600 underline">
                  Show All Dates
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button onClick={() => setShowUploader(!showUploader)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-[var(--fg)] transition-colors font-medium text-sm">
                <IconUpload />
                Import CSV
              </button>
              <button onClick={fetchFlights} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors font-medium text-sm">
                <IconRefresh />
                Refresh
              </button>
            </div>
          </div>

          {/* Uploader Dropdown */}
          {showUploader && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <CSVUploader />
            </div>
          )}

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)]">
              <div className="text-[var(--muted)] text-xs uppercase font-bold tracking-wider">Total Flights</div>
              <div className="text-2xl font-bold mt-1">{flights.length}</div>
            </div>
            <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)]">
              <div className="text-[var(--muted)] text-xs uppercase font-bold tracking-wider">Date</div>
              <div className="text-lg font-bold mt-1 truncate">{selectedDate || 'All Dates'}</div>
            </div>
            <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)]">
              <div className="text-[var(--muted)] text-xs uppercase font-bold tracking-wider">Surge Active</div>
              <div className="text-2xl font-bold mt-1 text-red-600">{surgeCount}</div>
            </div>
            <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)]">
              <div className="text-[var(--muted)] text-xs uppercase font-bold tracking-wider">Avg Price</div>
              <div className="text-2xl font-bold mt-1">₹{avgPrice}</div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-[var(--surface)] rounded-xl shadow-sm border border-[var(--border)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-gray-600 dark:text-gray-300">
                <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 uppercase text-xs font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4 rounded-tl-lg">Flight</th>
                    <th className="px-6 py-4">Route</th>
                    <th className="px-6 py-4">Time</th>
                    <th className="px-6 py-4">Seats</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {loading ? (
                    [...Array(5)].map((_, i) => <TableRowSkeleton key={i} />)
                  ) : flights.length > 0 ? (
                    flights.map(f => (
                      <tr key={f.id} className="hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-mono text-base font-bold text-blue-600 dark:text-blue-400">{f.flight_number}</div>
                          <div className="text-xs font-semibold text-[var(--muted)]">{f.airline}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-base">
                            <span className="font-mono font-semibold">{f.origin}</span>
                            <span className="text-[var(--muted)]">→</span>
                            <span className="font-mono font-semibold">{f.destination}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-[var(--fg)] text-base">
                            {f.departure_time ? new Date(f.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}
                          </div>
                          <div className="text-sm text-[var(--muted)]">{f.date}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${f.seats_available < 20 ? 'bg-red-500' : 'bg-green-500'}`}
                                style={{ width: `${(f.seats_available / (f.seats_available + 10)) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-bold whitespace-nowrap">{f.seats_available} left</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-[var(--fg)] text-lg">₹{f.dynamic_price.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          {(f.price_increase_percent && f.price_increase_percent > 0) ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                              Surge +{f.price_increase_percent}%
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                              Normal
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => handleDeleteFlight(f.id)} className="text-[var(--muted)] hover:text-red-600 transition-colors p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full" title="Cancel Flight">
                            <IconTrash />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-[var(--muted)]">
                      <div className="flex flex-col items-center">
                        <IconCalendar />
                        <div className="mt-2 font-medium">No flights found for {selectedDate || 'this date'}</div>
                        <button onClick={() => setSelectedDate('')} className="mt-2 text-blue-600 hover:underline">Clear Filter</button>
                      </div>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- BOOKINGS TAB ---------------- */}
      {activeTab === 'bookings' && (
        <div className="animate-fade-in-up bg-[var(--surface)] rounded-xl shadow-sm border border-[var(--border)] overflow-hidden">
          <div className="p-6 border-b border-[var(--border)] flex flex-col md:flex-row justify-between items-center gap-4">
            <h3 className="font-bold text-lg">Passenger Manifest</h3>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--muted)]">
                  <IconCalendar />
                </div>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                  placeholder="Filter by date"
                />
              </div>
              {bookingDate && (
                <button onClick={() => setBookingDate('')} className="text-sm text-[var(--muted)] hover:text-blue-600 underline whitespace-nowrap">
                  Clear
                </button>
              )}
              <button onClick={fetchBookings} className="text-blue-600 text-sm font-bold hover:underline ml-2">Refresh</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 uppercase text-xs font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4 rounded-tl-lg">PNR</th>
                  <th className="px-6 py-4">Passenger</th>
                  <th className="px-6 py-4">Flight</th>
                  <th className="px-6 py-4">Seats</th>
                  <th className="px-6 py-4">Booking Time</th>
                  <th className="px-6 py-4 rounded-tr-lg">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {bookings.map(b => (
                  <tr key={b.id} className="hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-base font-bold text-blue-600 dark:text-blue-400">{b.pnr}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-[var(--fg)] text-base">{b.passenger_name}</div>
                      <div className="text-sm text-[var(--muted)]">{b.passenger_contact}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono font-medium">{b.flight?.flight_number}</div>
                      <div className="text-xs text-[var(--muted)]">{b.flight?.origin} → {b.flight?.destination}</div>
                    </td>
                    <td className="px-6 py-4 font-medium">{b.seats_booked}</td>
                    <td className="px-6 py-4 text-sm text-[var(--muted)]">{new Date(b.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide
                        ${b.status === 'confirmed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
