// Owner: Member 5 - Onboarding & Studio
// Cloudinary is optional: with CLOUDINARY_URL (or the three CLOUDINARY_* keys) set, store images go to the CDN;
// without it (or without the package installed) uploads fall back to local disk in middleware/upload.js.

let cloudinary = null;

try {
  const mod = await import('cloudinary');
  const sdk = mod.v2 || mod.default?.v2;
  const { CLOUDINARY_URL, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

  if (sdk && CLOUDINARY_URL) {
    // The SDK reads CLOUDINARY_URL from the environment on its own
    sdk.config({ secure: true });
    cloudinary = sdk;
  } else if (sdk && CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
    sdk.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
      secure: true,
    });
    cloudinary = sdk;
  }
} catch {
  // Package not installed: local disk uploads only
}

export const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || 'minuto-me';

export const isCloudinaryEnabled = () => Boolean(cloudinary);

/**
 * Upload an in-memory file buffer. Resolves to { url, publicId, width, height }.
 */
export const uploadBuffer = (buffer, { folder = CLOUDINARY_FOLDER, publicId } = {}) =>
  new Promise((resolve, reject) => {
    if (!cloudinary) {
      reject(new Error('Cloudinary is not configured'));
      return;
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'image',
        overwrite: false,
        // Cap huge originals; the storefront asks for smaller sizes through the URL
        transformation: [{ width: 2400, height: 2400, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
      },
      (err, result) => {
        if (err) return reject(err);
        return resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
        });
      }
    );
    stream.end(buffer);
  });

/**
 * Best-effort delete of an image we uploaded earlier. Never throws.
 */
export const deleteByUrl = async (url) => {
  if (!cloudinary || typeof url !== 'string' || !url.includes('res.cloudinary.com')) return false;
  // .../upload/v1712345678/minuto-me/stores/abc123.jpg -> minuto-me/stores/abc123
  const match = /\/upload\/(?:[^/]+\/)*?v\d+\/(.+)\.[a-z0-9]+$/i.exec(url);
  if (!match) return false;
  try {
    await cloudinary.uploader.destroy(match[1]);
    return true;
  } catch {
    return false;
  }
};

export default cloudinary;
