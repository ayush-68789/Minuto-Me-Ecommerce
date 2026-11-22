// Owner: Member 4 — Public storefront data and newsletter API
import api from './axiosInstance';

export const fetchStorefront = (slug) => api.get(`/storefront/${encodeURIComponent(slug)}`).then((r) => r.data);
export const subscribeNewsletter = (slug, email) => api.post(`/storefront/${encodeURIComponent(slug)}/subscribe`, { email }).then((r) => r.data);
