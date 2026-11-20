// Owner: M2 - Products & Dashboard
import api from './axiosInstance';

export const fetchProducts = (params = {}) =>
  api.get('/products', { params }).then((r) => r.data);

export const fetchProductById = (id) =>
  api.get(`/products/${id}`).then((r) => r.data.product);

export const createProduct = (data) =>
  api.post('/products', data).then((r) => r.data.product);

export const updateProduct = (id, data) =>
  api.put(`/products/${id}`, data).then((r) => r.data.product);

export const deleteProduct = (id) =>
  api.delete(`/products/${id}`).then((r) => r.data);

export const fetchPublicProducts = (storeId, params = {}) =>
  api.get(`/products/public/${storeId}`, { params }).then((r) => r.data);

export const productErrorMessage = (err, fallback = 'Failed to process product') =>
  err?.response?.data?.message || fallback;

export default {
  fetchProducts,
  fetchProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  fetchPublicProducts,
  productErrorMessage,
};
