// FILE: lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000',
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
