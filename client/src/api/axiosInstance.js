// Owner: M1
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // auth uses an httpOnly cookie
});

api.interceptors.request.use((config) => {
  const storeId = localStorage.getItem('minuto_store_id');
  if (storeId) config.headers['x-store-id'] = storeId;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If session expired or unauthorized on protected resource, clear stale store id
    if (error.response?.status === 401 && !error.config.url?.includes('/auth/login') && !error.config.url?.includes('/auth/signup')) {
      localStorage.removeItem('minuto_store_id');
    }
    return Promise.reject(error);
  }
);

export default api;
