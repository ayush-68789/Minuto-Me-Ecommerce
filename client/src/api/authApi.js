// Owner: M1
import api from './axiosInstance';

export const signupRequest = (data) => api.post('/auth/signup', data).then((r) => r.data.user);
export const loginRequest = (data) => api.post('/auth/login', data).then((r) => r.data.user);
export const logoutRequest = () => api.post('/auth/logout');
export const fetchMe = () => api.get('/auth/me').then((r) => r.data.user);

// Pulls a readable message out of an axios error
export const errorMessage = (err, fallback = 'Something went wrong') =>
  err?.response?.data?.message || fallback;
