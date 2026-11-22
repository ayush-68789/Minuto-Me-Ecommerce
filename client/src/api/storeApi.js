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

// Onboarding + studio (Member 5)
export const checkSlug = (slug, storeId) =>
  api.get('/stores/check-slug', { params: { slug, storeId } }).then((r) => r.data);

export const uploadStoreImage = (file, onProgress) => {
  const body = new FormData();
  body.append('image', file);
  return api
    .post('/stores/upload', body, {
      onUploadProgress: (e) => onProgress?.(e.total ? Math.round((e.loaded / e.total) * 100) : 0),
    })
    .then((r) => r.data.url);
};

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
  checkSlug,
  uploadStoreImage,
  fetchDashboardSummary,
  fetchLowStockAlerts,
  storeErrorMessage,
};
