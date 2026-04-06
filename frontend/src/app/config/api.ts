import axios from 'axios';

// Get the backend URL from environment or default to localhost
const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Create axios instance with base URL
export const apiClient = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token if needed
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
