// FILE: lib/api.ts
import axios from 'axios';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flysmart-backend-448p.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Basic normalization or logging could happen here
    const errorData = error.response?.data || error.message;
    console.error('API Error:', typeof errorData === 'object' ? JSON.stringify(errorData, null, 2) : errorData);
    return Promise.reject(error);
  }
);

export default api;
