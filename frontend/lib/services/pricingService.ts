import api from '../api';

export interface FareHistoryItem {
    id: number;
    old_price: number | null;
    new_price: number;
    reason: string;
    ts: string;
}

export interface DemandScoreData {
    flight_id: number;
    score: number;
    updated_at: string;
}

export const pricingService = {
    /**
     * Get fare history for a specific flight
     */
    getFareHistory: async (flightId: number, limit: number = 20): Promise<FareHistoryItem[]> => {
        try {
            const res = await api.get(`/api/v1/fare_history/${flightId}`, { params: { limit } });
            return res.data || [];
        } catch (error) {
            console.error('Failed to fetch fare history:', error);
            return [];
        }
    },

    /**
     * Get demand score for a specific flight
     */
    getDemandScore: async (flightId: number): Promise<DemandScoreData | null> => {
        try {
            const res = await api.get(`/api/v1/demand/${flightId}`);
            return res.data;
        } catch (error: any) {
            // Silently return null for any error to avoid console noise as requested
            return null;
        }
    }
};
