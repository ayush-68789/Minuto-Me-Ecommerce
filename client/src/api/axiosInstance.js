// Owner: M1
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
let accessToken = '';
let refreshInFlight = null;

export const setAccessToken = (token) => { accessToken = typeof token === 'string' ? token : ''; };

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // auth uses an httpOnly cookie
});

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  const storeId = localStorage.getItem('minuto_store_id');
  if (storeId) config.headers['x-store-id'] = storeId;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const config = error.config;
    const url = config?.url || '';
    const isAuthEndpoint = /\/auth\/(login|signup|customer\/login|customer\/signup|refresh|logout)(?:[/?]|$)/.test(url);
    if (error.response?.status !== 401 || !config || config._retry || isAuthEndpoint) return Promise.reject(error);

    config._retry = true;
    if (!refreshInFlight) {
      const refreshUrl = `${API_BASE_URL.replace(/\/$/, '')}/auth/refresh`;
      refreshInFlight = axios.post(refreshUrl, {}, { withCredentials: true })
        .then((response) => {
          setAccessToken(response.data?.accessToken);
          if (!accessToken) throw new Error('Refresh response did not include an access token');
          return accessToken;
        })
        .finally(() => { refreshInFlight = null; });
    }

    return refreshInFlight
      .then((token) => {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
        return api(config);
      })
      .catch((refreshError) => {
        setAccessToken('');
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('minuto-auth-expired'));
        return Promise.reject(refreshError);
      });
  }
);

export default api;
