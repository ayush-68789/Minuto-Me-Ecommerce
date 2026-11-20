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

export default api;
