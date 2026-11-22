// Owner: M3 -- public storefront data
import api from './axiosInstance';

export const fetchStorefront = (slug) => api.get(`/storefront/${encodeURIComponent(slug)}`).then((r) => r.data);
export const subscribeNewsletter = (slug, email) => api.post(`/storefront/${encodeURIComponent(slug)}/subscribe`, { email }).then((r) => r.data);

// Server-side search + filters + pagination: { products, total, page, pages, hasMore, categories, priceRange }
export const fetchCatalog = (slug, params = {}, config = {}) =>
  api.get('/catalog', { ...config, params: { slug, ...params } }).then((r) => r.data);

// One product + related products from the same category: { product, related }
export const fetchCatalogProduct = (slug, productId) =>
  api.get(`/catalog/${encodeURIComponent(productId)}`, { params: { slug } }).then((r) => r.data);
