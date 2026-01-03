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

export default function AdminPage() {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);
  const [status, setStatus] = useState<SimulatorStatus | null>(null);
  const [flights, setFlights] = useState<FlightItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    // Check authentication
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }

    // Auth passed, show content
    setAuthChecking(false);

    const interval = setInterval(fetchStatus, 2000); // Poll status
    fetchStatus();
    fetchFlights();

    return () => clearInterval(interval);
  }, [router]);

  const fetchStatus = async () => {
    try {
      const s = await adminService.getSimulatorStatus();
      setStatus(s);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFlights = async () => {
    setLoading(true);
    try {
      const f = await flightService.getAllFlights(50);
      setFlights(f);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSimAction = async (action: 'start' | 'stop' | 'tick') => {
    setActionLoading(true);
    try {
      if (action === 'start') await adminService.startSimulator();
      if (action === 'stop') await adminService.stopSimulator();
      if (action === 'tick') await adminService.tickSimulator();
      await fetchStatus();
    } catch (e) {
      alert('Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    router.push('/');
  };

  // Show loading while checking auth
  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="text-center">
          <Spinner className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <p className="text-[var(--muted)]">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold text-[var(--fg)]">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors w-full md:w-auto"
        >
          Logout
        </button>
      </div>

      {/* Simulator Control */}
      <div className="bg-[var(--surface)] p-6 rounded-xl shadow-sm border border-[var(--border)] mb-8 transition-colors">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-3 text-[var(--fg)]">
          Simulator Status
          {status?.running ? (
            <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-100 text-xs px-2 py-1 rounded-full uppercase">Running</span>
          ) : (
            <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-100 text-xs px-2 py-1 rounded-full uppercase">Stopped</span>
          )}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="text-sm text-[var(--muted)] mb-1">Current Sim Time</div>
            <div className="text-2xl font-mono font-bold text-[var(--fg)] mb-4">
              {status?.current_time ? new Date(status.current_time).toLocaleString() : '---'}
            </div>
            <div className="text-sm text-[var(--muted)]">Acceleration: <span className="font-bold text-[var(--fg)]">x{status?.time_acceleration || 0}</span></div>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            {!status?.running ? (
              <button
                onClick={() => handleSimAction('start')}
                disabled={actionLoading}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 transition-colors shadow-md"
              >
                Start Simulation
              </button>
            ) : (
              <button
                onClick={() => handleSimAction('stop')}
                disabled={actionLoading}
                className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 disabled:opacity-50 transition-colors shadow-md"
              >
                Stop Simulation
              </button>
            )}

            <button
              onClick={() => handleSimAction('tick')}
              disabled={actionLoading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md"
            >
              Tick +1
            </button>
          </div>
        </div>
      </div>

      {/* CSV Upload Section */}
      <div className="mb-8">
        <CSVUploader />
      </div>

      {/* Flight Management */}
      <div className="bg-[var(--surface)] rounded-xl shadow-sm border border-[var(--border)] overflow-hidden transition-colors">
        <div className="p-6 border-b border-[var(--border)] flex justify-between items-center">
          <h2 className="text-xl font-bold text-[var(--fg)]">Managed Flights</h2>
          <button onClick={fetchFlights} className="text-blue-600 dark:text-blue-400 text-sm font-bold hover:underline">Refresh List</button>
        </div>

        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted)] uppercase">Flight</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted)] uppercase">Route</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted)] uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted)] uppercase">Seats</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted)] uppercase">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {[...Array(8)].map((_, i) => (
                  <TableRowSkeleton key={i} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[var(--muted)]">
              <thead className="bg-gray-50 dark:bg-gray-800 uppercase text-xs font-bold text-[var(--muted)]">
                <tr>
                  <th className="px-6 py-3">Flight No</th>
                  <th className="px-6 py-3">Route</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Seats</th>
                  <th className="px-6 py-3">Base Price</th>
                  <th className="px-6 py-3">Current Price</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {flights.map(f => (
                  <tr key={f.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-[var(--fg)]">{f.flight_number}</td>
                    <td className="px-6 py-4">{f.origin} → {f.destination}</td>
                    <td className="px-6 py-4">{f.date}</td>
                    <td className="px-6 py-4">{f.seats_available} / {f.seats_available + 10}</td>
                    <td className="px-6 py-4">₹{f.base_price}</td>
                    <td className="px-6 py-4 text-green-600 dark:text-green-400 font-bold">₹{f.dynamic_price}</td>
                    <td className="px-6 py-4">
                      {f.price_increase_percent && f.price_increase_percent > 0 ? (
                        <span className="text-red-600 dark:text-red-400 text-xs font-bold">High Demand</span>
                      ) : (
                        <span className="text-[var(--muted)] text-xs">Normal</span>
                      )}
                    </td>
                  </tr>
                ))}
                {flights.length === 0 && (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-[var(--muted)]">No flights found in database.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div >
  );
}
