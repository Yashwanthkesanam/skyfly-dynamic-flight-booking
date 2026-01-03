// lib/utils/auth.ts
const AUTH_TOKEN_KEY = 'flysmart_admin_token';
const DEMO_CREDENTIALS = {
    email: 'admin@flysmart.com',
    password: 'admin123'
};

export const authService = {
    /**
     * Attempt login with email and password
     * Returns true if successful, false otherwise
     */
    login: (email: string, password: string): boolean => {
        if (email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) {
            // Generate a simple token (timestamp-based for demo)
            const token = btoa(`${email}:${Date.now()}`);
            localStorage.setItem(AUTH_TOKEN_KEY, token);
            return true;
        }
        return false;
    },

    /**
     * Clear authentication token
     */
    logout: (): void => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated: (): boolean => {
        if (typeof window === 'undefined') return false;
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        return !!token;
    },

    /**
     * Get current auth token
     */
    getAuthToken: (): string | null => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(AUTH_TOKEN_KEY);
    }
};
