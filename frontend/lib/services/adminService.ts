import api from '../api';

export interface SimulatorStatus {
    running: boolean;
    time_acceleration: number;
    current_time: string;
}

export const adminService = {
    startSimulator: async () => {
        const res = await api.post('/api/v1/simulator/start');
        return res.data;
    },

    stopSimulator: async () => {
        const res = await api.post('/api/v1/simulator/stop');
        return res.data;
    },

    tickSimulator: async () => {
        const res = await api.post('/api/v1/simulator/tick');
        return res.data;
    },

    getSimulatorStatus: async (): Promise<SimulatorStatus> => {
        const res = await api.get('/api/v1/simulator/status');
        return res.data;
    },

    triggerEvent: async (city: string, factor: number) => {
        const res = await api.post('/api/v1/simulator/event', { city, factor });
        return res.data;
    },

    resetEvent: async (city: string) => {
        const res = await api.post('/api/v1/simulator/event/reset', { city });
        return res.data;
    },

    deleteFlight: async (flightId: string | number) => {
        const res = await api.delete(`/api/v1/admin/flights/${flightId}`);
        return res.data;
    }
};
