import api from './axiosInstance.js';

export const toApiError = (error) => ({
  message: error.response?.data?.message || error.message || 'Something went wrong',
  status: error.response?.status || 0,
  issues: error.response?.data?.issues || [],
});

async function call(request) {
  try {
    const response = await request;
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

const toLines = (items) => items.map(({ productId, quantity }) => ({ productId, quantity }));

export const quoteCart = (storeSlug, items) =>
  call(api.post('/orders/quote', { storeSlug, items: toLines(items) }));

export const createOrder = (storeSlug, items, details) =>
  call(api.post('/orders', { storeSlug, items: toLines(items), ...details, paymentMethod: 'cod' }));

export const trackOrder = (orderId, email) =>
  call(api.get(`/orders/track/${encodeURIComponent(orderId)}`, { params: { email } }));

export const fetchMyOrders = (storeSlug) => call(api.get('/orders/my', { params: { storeSlug } }));

export const fetchStoreOrders = (params = {}) => call(api.get('/orders/store', { params }));

export const updateOrderStatus = (orderId, status) =>
  call(api.patch(`/orders/${encodeURIComponent(orderId)}/status`, { status }));
