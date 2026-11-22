import api from './axiosInstance';

export const fetchReviews = (productId, slug) => api.get(`/reviews/${productId}`, { params: { slug } }).then((r) => r.data);
export const submitReview = (productId, slug, rating, text) => api.post(`/reviews/${productId}`, { slug, rating, text }).then((r) => r.data.review);
