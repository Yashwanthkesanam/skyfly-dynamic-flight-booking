// FILE: types/index.ts

export interface PriceBreakdown {
  base: number;
  time_mult: number;
  seat_mult: number;
  demand_mult: number;
  clamped_price: number;
}

export interface FlightItem {
  id: string;
  airline: string;
  flight_number: string;
  origin: string;
  destination: string;
  date: string; // ISO date YYYY-MM-DD
  departure_time: string; // ISO datetime
  arrival_time: string; // ISO datetime
  duration_minutes: number;
  seats_available: number;
  base_price: number;
  dynamic_price: number;
  price_breakdown: PriceBreakdown;
  price_cached_seconds_left?: number;
  price_increase_percent?: number;
}

export interface BookingRequest {
  flight_id: number;
  seats: number;
  passenger_name: string;
  passenger_contact: string; // Email
}

export interface ReserveResponse {
  reservation_id: string;
  flight_id: number;
  seats: number;
  price_snapshot: number;
  hold_expires_at: string;
}

export interface Passenger {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
}

export interface ConfirmRequest {
  reservation_id: string;
  passengers: Passenger[];
}

export interface CitySuggestion {
  code: string;
  city: string;
  airport: string;
}
