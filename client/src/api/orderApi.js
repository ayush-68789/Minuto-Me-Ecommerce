// Owner: M5
import api from './axiosInstance';

// Turns an axios error into { message, status, code, issues, updatedQuote } for the UI
export const toApiError = (err) => ({
  message: err.response?.data?.message || err.message || 'Something went wrong',
  status: err.response?.status || 0,
  code: err.response?.data?.code || null,
  issues: err.response?.data?.issues || [],
  updatedQuote: err.response?.data?.updatedQuote || null,
});

const call = async (request) => {
  try {
    const response = await request;
    return response.data;
  } catch (err) {
    throw toApiError(err);
  }
};

const toLines = (items) => items.map(({ productId, quantity }) => ({ productId, quantity }));

// Storefront / customer
export const quoteCart = (storeSlug, items) =>
  call(api.post('/orders/quote', { storeSlug, items: toLines(items) }));

export const createOrder = (storeSlug, items, details, idempotencyKey = null) => {
  const headers = idempotencyKey ? { 'idempotency-key': idempotencyKey } : {};
  return call(
    api.post(
      '/orders',
      { storeSlug, items: toLines(items), ...details },
      { headers }
    )
  );
};

export const trackOrder = (orderId) => call(api.get(`/orders/track/${orderId}`));

export const fetchMyOrders = (storeSlug) => call(api.get('/orders/my', { params: { storeSlug } }));
export const fetchMyOrder = (orderId, storeSlug) =>
  call(api.get(`/orders/my/${orderId}`, { params: { storeSlug } }));

// Store owner (for the dashboard)
export const fetchStoreOrders = (params = {}) => call(api.get('/orders/store', { params }));

export const updateOrderStatus = (orderId, status) =>
  call(api.patch(`/orders/${orderId}/status`, { status }));

export const deleteOrder = (orderId) => call(api.delete(`/orders/${orderId}`));
