import api from './axiosInstance';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export async function uploadImage(file) {
  if (!file || !ALLOWED_TYPES.has(file.type) || file.size === 0 || file.size > MAX_IMAGE_BYTES) {
    throw new Error('Choose a JPG, PNG, WEBP, or GIF image under 5MB.');
  }
  const body = new FormData();
  body.append('image', file);
  try {
    const { data } = await api.post('/upload', body);
    return data.url;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Image upload failed. Check the image and try again.');
  }
}
