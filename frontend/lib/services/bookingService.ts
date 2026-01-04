import api from '../api';
import { BookingRequest, ConfirmRequest } from '../../types';

export interface BookingDetails {
    id: number;
    pnr: string;
    status: string;
    flight_id: number;
    seats_booked: number;
    passenger_name: string;
    price_paid: number;
    created_at: string;
    flight?: {
        id: number;
        flight_number: string;
        airline: string;
        origin: string;
        destination: string;
        departure_time?: string;
        departure_iso?: string;
        duration_min?: number;
        flight_date?: string;
    };
    payment_meta?: any;
}

export const bookingService = {
    reserveFlight: async (data: BookingRequest) => {
        const res = await api.post('/api/v1/bookings/reserve', data);
        return res.data;
    },

    confirmBooking: async (data: ConfirmRequest) => {
        const payload = {
            reservation_id: Number(data.reservation_id),
            payment_success: true,
            payment_meta: { ...data, method: 'DEMO_PAY' }
        };
        const res = await api.post('/api/v1/bookings/confirm', payload);
        return res.data;
    },

    cancelBooking: async (pnr: string) => {
        const res = await api.post('/api/v1/bookings/cancel', { pnr });
        return res.data;
    },

    cancelWithRefund: async (pnr: string, refundMeta?: any) => {
        const res = await api.post('/api/v1/bookings/cancel', {
            pnr,
            refund: true,
            refund_meta: refundMeta || { refund_method: 'original_payment' }
        });
        return res.data;
    },

    getBooking: async (pnr: string): Promise<BookingDetails> => {
        const res = await api.get(`/api/v1/bookings/lookup/${pnr}`);
        return res.data;
    },

    getReceipt: async (pnr: string) => {
        const res = await api.get(`/api/v1/bookings/receipt/${pnr}`);
        return res.data;
    },

    listBookings: async (filters?: { flight_id?: number; status?: string; pnrs?: string[]; limit?: number; offset?: number }) => {
        const params: any = { ...filters };
        if (filters?.pnrs && filters.pnrs.length > 0) {
            params.pnrs = filters.pnrs.join(',');
        }
        const res = await api.get('/api/v1/bookings/list', { params });
        return res.data;
    }
};
