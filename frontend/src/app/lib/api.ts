import axios from 'axios';

const api = axios.create();

// Attach JWT token to every request (supports both localStorage and sessionStorage)
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token') ?? sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to login on 401, clearing token from both storages
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 403) {
      const data = error.response?.data;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');

      if (data?.reason === 'suspended') {
        sessionStorage.setItem('suspension_notice', JSON.stringify({
          reason: data?.suspensionReason,
          until: data?.until ?? null,
        }));
        window.location.href = '/account-suspended';
      }

      if (data?.reason === 'banned') {
        sessionStorage.setItem('auth_notice', data?.error || 'This account has been permanently disabled for violating our terms.');
        window.location.href = '/login';
      }
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export { isAxiosError } from 'axios';
export default api;
