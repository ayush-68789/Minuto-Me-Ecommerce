// Owner: M4 (Product Management & Dashboard)
import api from './axiosInstance';

// Fetch products with search, filtering, sorting, and pagination
export const fetchProducts = async (params = {}) => {
  const response = await api.get('/products', { params });
  return response.data;
};

// Fetch a single product by ID
export const fetchProductById = async (id, params = {}) => {
  const response = await api.get(`/products/${id}`, { params });
  return response.data;
};

// Create a new product
export const createProduct = async (productData) => {
  const response = await api.post('/products', productData);
  return response.data;
};

// Update an existing product
export const updateProduct = async (id, productData) => {
  const response = await api.put(`/products/${id}`, productData);
  return response.data;
};

// Delete a product
export const deleteProduct = async (id, params = {}) => {
  const response = await api.delete(`/products/${id}`, { params });
  return response.data;
};

// Toggle active/inactive status
export const toggleProductStatus = async (id, params = {}) => {
  const response = await api.patch(`/products/${id}/toggle-status`, {}, { params });
  return response.data;
};

// Quick stock adjustment (direct set or delta increment/decrement)
export const updateProductStock = async (id, stockPayload) => {
  const response = await api.patch(`/products/${id}/stock`, stockPayload);
  return response.data;
};

// Fetch inventory alerts (low stock & out-of-stock items)
export const fetchInventoryAlerts = async () => {
  const response = await api.get('/products/inventory/alerts');
  return response.data;
};

// Dashboard statistics
export const fetchDashboardStats = async (params = {}) => {
  const response = await api.get('/dashboard/stats', { params });
  return response.data;
};

// Detailed inventory summary
export const fetchInventorySummary = async () => {
  const response = await api.get('/dashboard/inventory');
  return response.data;
};

// Store details & settings
export const fetchStoreSettings = async (params = {}) => {
  const response = await api.get('/dashboard/store', { params });
  return response.data;
};

// Update store details
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
  updateProductStock,
  fetchInventoryAlerts,
  fetchDashboardStats,
  fetchInventorySummary,
  fetchStoreSettings,
  updateStoreSettings,
};
