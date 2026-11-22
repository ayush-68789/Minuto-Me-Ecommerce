// Owner: M1
import api, { setAccessToken } from './axiosInstance';

const acceptSession = async (request) => {
  const { data } = await request;
  if (data.accessToken) setAccessToken(data.accessToken);
  return data.user;
};

export const signupRequest = (data) => acceptSession(api.post('/auth/signup', data));
export const customerSignupRequest = (data) => acceptSession(api.post('/auth/customer/signup', data));
export const loginRequest = (data) => acceptSession(api.post('/auth/login', data));
export const customerLoginRequest = (data) => acceptSession(api.post('/auth/customer/login', data));
export const logoutRequest = async () => {
  try { return await api.post('/auth/logout'); }
  finally { setAccessToken(''); }
};
export const fetchMe = () => api.get('/auth/me').then((r) => r.data.user);
export const deleteCustomerRequest = async (storeSlug) => {
  const { data } = await api.delete('/auth/account', { params: storeSlug ? { storeSlug } : {} });
  setAccessToken('');
  return data;
};
export const updateCustomerRequest = (data) => api.patch('/auth/profile', data).then((r) => r.data.user);

// Pulls a readable message out of an axios error
export const errorMessage = (err, fallback = 'Something went wrong') =>
  err?.response?.data?.message || fallback;
