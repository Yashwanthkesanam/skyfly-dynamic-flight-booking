// utils/validateFlightData.ts

import { FlightItem } from '../types';

/**
 * Validates that a flight object has all required fields and valid data
 * @param flight - The flight object to validate
 * @returns true if valid, false otherwise
 */
export function validateFlightData(flight: any): flight is FlightItem {
    if (!flight || typeof flight !== 'object') {
        console.error('[Validation] Invalid flight object:', flight);
        return false;
    }

    // Required string fields
    const requiredStringFields = [
        'id',
        'flight_number',
        'airline',
        'origin',
        'destination',
        'departure_time',
        'arrival_time',
    ];

    for (const field of requiredStringFields) {
        if (!flight[field] || typeof flight[field] !== 'string') {
            console.error(`[Validation] Missing or invalid field: ${field}`, flight);
            return false;
        }
    }

    // Required number fields
    const requiredNumberFields = [
        'duration_minutes',
        'seats_available',
        'dynamic_price',
    ];

    for (const field of requiredNumberFields) {
        if (typeof flight[field] !== 'number' || isNaN(flight[field])) {
            console.error(`[Validation] Invalid number field: ${field}`, flight);
            return false;
        }
    }

    // Validate date strings can be parsed
    try {
        const depTime = new Date(flight.departure_time);
        const arrTime = new Date(flight.arrival_time);

        if (isNaN(depTime.getTime())) {
            console.error('[Validation] Invalid departure_time:', flight.departure_time);
            return false;
        }

        if (isNaN(arrTime.getTime())) {
            console.error('[Validation] Invalid arrival_time:', flight.arrival_time);
            return false;
        }

        // Ensure arrival is after departure
        if (arrTime <= depTime) {
            console.warn('[Validation] Arrival time is not after departure time:', flight);
            // Don't fail validation, just warn
        }
    } catch (error) {
        console.error('[Validation] Date validation error:', error, flight);
        return false;
    }

    return true;
}

/**
 * Filters an array of flights, keeping only valid ones
 * @param flights - Array of flight objects
 * @returns Filtered array containing only valid flights
 */
export function filterValidFlights(flights: any[]): FlightItem[] {
    if (!Array.isArray(flights)) {
        console.error('[Validation] Expected array of flights, got:', typeof flights);
        return [];
    }

    const validFlights = flights.filter(validateFlightData);

    if (validFlights.length < flights.length) {
        console.warn(
            `[Validation] Filtered out ${flights.length - validFlights.length} invalid flights`
        );
    }

    return validFlights;
}

/**
 * Sanitizes a flight object by ensuring all fields have safe fallback values
 * Use this as a last resort if you need to display potentially invalid data
 */
export function sanitizeFlightData(flight: any): FlightItem {
    return {
        id: flight.id || 'unknown',
        flight_number: flight.flight_number || 'N/A',
        airline: flight.airline || 'Unknown Airline',
        origin: flight.origin || 'N/A',
        destination: flight.destination || 'N/A',
        departure_time: flight.departure_time || new Date().toISOString(),
        arrival_time: flight.arrival_time || new Date().toISOString(),
        duration_minutes: flight.duration_minutes || 0,
        seats_available: flight.seats_available || 0,
        dynamic_price: flight.dynamic_price || 0,
        base_price: flight.base_price || flight.dynamic_price || 0,
        price_increase_percent: flight.price_increase_percent || 0,
        price_cached_seconds_left: flight.price_cached_seconds_left || 0,
    };
}
