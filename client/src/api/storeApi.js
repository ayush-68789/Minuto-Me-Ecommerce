// Owner: M1
import api from './axiosInstance';

export const createStoreRequest = (data) => api.post('/stores', data).then((r) => r.data.store);
export const fetchMyStore = () => api.get('/stores/me').then((r) => r.data.store);
export const fetchMyStores = () => api.get('/stores').then((r) => r.data.stores);
