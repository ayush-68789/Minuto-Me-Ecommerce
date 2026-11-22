import './loadEnv.js';
import { v2 as cloudinary } from 'cloudinary';

const isConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );

function configureCloudinary() {
  if (!isConfigured()) return false;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return true;
}

/**
 * Uploads a memory buffer directly to Cloudinary.
 * Never stores untrusted files on the local filesystem.
 */
export async function uploadBufferToCloudinary(buffer, { folder = 'minuto_stores', filename } = {}) {
  if (!isConfigured()) {
    const error = new Error('Image upload service is not configured');
    error.status = 503;
    throw error;
  }
  configureCloudinary();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: filename,
        resource_type: 'image',
        allowed_formats: ['jpg', 'png', 'webp', 'gif'],
        transformation: [{ max_width: 2000, crop: 'limit' }],
      },
      (err, result) => {
        if (err) {
          const error = new Error('Failed to upload image to cloud storage');
          error.status = 502;
          return reject(error);
        }
        resolve({
          url: result.secure_url || result.url,
          publicId: result.public_id,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

export { cloudinary, isConfigured, configureCloudinary };
export default cloudinary;
