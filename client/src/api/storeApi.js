// Owner: M2 - Products & Dashboard
import api from './axiosInstance';

export const fetchMyStore = () =>
  api.get('/stores/me').then((r) => r.data.store);

export const fetchStoreById = (id) =>
  api.get(`/stores/${id}`).then((r) => r.data.store);

export const fetchStoreBySlug = (slug) =>
  api.get(`/stores/slug/${slug}`).then((r) => r.data.store);

export const createStore = (data) =>
  api.post('/stores', data).then((r) => r.data.store);

export const updateStore = (id, data) =>
  api.put(`/stores/${id}`, data).then((r) => r.data.store);

export const deleteStore = (id) =>
  api.delete(`/stores/${id}`).then((r) => r.data);

export const fetchDashboardSummary = (params = {}) =>
  api.get('/dashboard/summary', { params }).then((r) => r.data);

export const fetchLowStockAlerts = (params = {}) =>
  api.get('/dashboard/low-stock', { params }).then((r) => r.data);

export const storeErrorMessage = (err, fallback = 'Store operation failed') =>
  err?.response?.data?.message || fallback;

export default {
  fetchMyStore,
  fetchStoreById,
  fetchStoreBySlug,
  createStore,
  updateStore,
  deleteStore,
  fetchDashboardSummary,
  fetchLowStockAlerts,
  storeErrorMessage,
};
