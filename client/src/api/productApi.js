// Owner: M4
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const storeId = localStorage.getItem('minuto_store_id');
  if (storeId) config.headers['x-store-id'] = storeId;
  return config;
});

// Products API
export const fetchProducts = async (params = {}) => {
  const response = await api.get('/products', { params });
  return response.data;
};

export const fetchProductById = async (id, params = {}) => {
  const response = await api.get(`/products/${id}`, { params });
  return response.data;
};

export const createProduct = async (productData) => {
  const response = await api.post('/products', productData);
  return response.data;
};

export const updateProduct = async (id, productData) => {
  const response = await api.put(`/products/${id}`, productData);
  return response.data;
};

export const deleteProduct = async (id, params = {}) => {
  const response = await api.delete(`/products/${id}`, { params });
  return response.data;
};

export const toggleProductStatus = async (id, params = {}) => {
  const response = await api.patch(`/products/${id}/toggle-status`, {}, { params });
  return response.data;
};

// Dashboard & Store Management API
export const fetchDashboardStats = async (params = {}) => {
  const response = await api.get('/dashboard/stats', { params });
  return response.data;
};

export const fetchStoreSettings = async (params = {}) => {
  const response = await api.get('/dashboard/store', { params });
  return response.data;
};

export const updateStoreSettings = async (settingsData) => {
  const response = await api.put('/dashboard/store', settingsData);
  return response.data;
};

export default {
  fetchProducts,
  fetchProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  fetchDashboardStats,
  fetchStoreSettings,
  updateStoreSettings,
};
