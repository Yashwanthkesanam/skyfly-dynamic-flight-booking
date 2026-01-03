import api from '../api';
import { FlightItem, CitySuggestion } from '../../types';

// Helper to map API response to FlightItem
// The backend returns keys like arrival_iso, the frontend expects arrival_time.
const mapFlight = (data: any): FlightItem => ({
    id: String(data.id),
    airline: data.airline,
    flight_number: data.flight_number,
    origin: data.origin,
    destination: data.destination,
    date: data.flight_date,
    departure_time: data.departure_iso, // Mapping backend _iso to frontend _time
    arrival_time: data.arrival_iso,
    duration_minutes: data.duration_min,
    seats_available: data.seats_available,
    base_price: data.base_price,
    dynamic_price: data.dynamic_price !== undefined ? data.dynamic_price : data.price_real,
    price_breakdown: data.price_breakdown || { base: 0, time_mult: 0, seat_mult: 0, demand_mult: 0, clamped_price: 0 },
    price_cached_seconds_left: data.price_cached_seconds_left,
    price_increase_percent: data.price_increase_percent
});

export interface SearchParams {
    origin: string;
    destination: string;
    date: string;
    min_price?: number;
    max_price?: number;
    sort_by?: 'price' | 'duration';
    limit?: number;
    offset?: number;
}

export const flightService = {
    // Search flights
    searchFlights: async (params: SearchParams): Promise<FlightItem[]> => {
        // If date is valid, use search
        // The backend expects params match query names
        const res = await api.get('/api/v1/flights/search', { params });
        return (res.data || []).map(mapFlight);
    },

    // Lookup single flight
    lookupFlight: async (key: string): Promise<FlightItem> => {
        const res = await api.get(`/api/v1/flights/lookup/${key}`);
        return mapFlight(res.data);
    },

    // Get Popular Routes (Homepage)
    getPopularRoutes: async (limit: number = 6) => {
        const res = await api.get('/api/v1/flights/popular', { params: { limit } });
        return res.data;
    },

    // Get Suggestions (SearchForm)
    getSuggestions: async (query: string): Promise<CitySuggestion[]> => {
        if (!query || query.length < 2) return [];
        try {
            const res = await api.get('/api/v1/flights/suggest', { params: { q: query } });
            return (res.data || []).map((it: any) => ({
                city: it.city,
                code: it.code,
                airport: it.airport_name
            }));
        } catch {
            return [];
        }
    },

    // [Admin] Get All Flights
    getAllFlights: async (limit: number = 50, offset: number = 0): Promise<FlightItem[]> => {
        const res = await api.get('/api/v1/flights', { params: { limit, offset } });
        return (res.data || []).map(mapFlight);
    },

    // Get cheapest flight for a route
    getCheapestFlight: async (origin?: string, destination?: string, date?: string): Promise<FlightItem | null> => {
        try {
            const res = await api.get('/api/v1/flights/cheapest', {
                params: { origin, destination, date }
            });
            return res.data ? mapFlight(res.data) : null;
        } catch {
            return null;
        }
    }
};
