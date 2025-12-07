import api from '../api';

const TOKEN_KEY = 'admin_access_token';

export const authService = {
    login: async (username: string, password: string) => {
        const params = new URLSearchParams();
        params.append('username', username);
        params.append('password', password);

        const response = await api.post('/api/v1/auth/login', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (response.data.access_token) {
            localStorage.setItem(TOKEN_KEY, response.data.access_token);
        }
        return response.data;
    },

    logout: () => {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = '/admin/login';
    },

    getToken: () => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(TOKEN_KEY);
        }
        return null;
    },

    isAuthenticated: () => {
        const token = authService.getToken();
        // Ideally check expiry too, but simple existence check for now
        return !!token;
    },

    // Add Authorization header to requests
    authHeader: () => {
        const token = authService.getToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
    }
};
