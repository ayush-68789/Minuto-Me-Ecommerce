import path from 'path';
import crypto from 'crypto';
import multer from 'multer';

// 5MB maximum file size
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

// Magic number signatures for binary content validation
function validateMagicNumbers(buffer) {
  return Boolean(detectImageMime(buffer));
}

function detectImageMime(buffer) {
  if (!buffer || buffer.length < 4) return false;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'image/png';

  // GIF: 47 49 46 38
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) return 'image/gif';

  // WEBP: 52 49 46 46 ... 57 45 42 50
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  return null;
}

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  if (!ALLOWED_MIME_TYPES.has(mime) || !ALLOWED_EXTENSIONS.has(ext)) {
    const err = new Error('Unsupported image format. Allowed formats: JPG, PNG, WEBP, GIF.');
    err.status = 400;
    return cb(err, false);
  }

  cb(null, true);
};

const rawUpload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter,
});

/**
 * Middleware wrapper that catches Multer errors and validates binary content.
 */
export const uploadImageMiddleware = (fieldName = 'image') => {
  const uploadSingle = rawUpload.single(fieldName);

  return (req, res, next) => {
    uploadSingle(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: `File size exceeds the 5MB limit`,
          });
        }
        return res.status(err.status || 400).json({
          success: false,
          message: err.message || 'File upload error',
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided',
        });
      }

      if (req.file.size === 0) {
        return res.status(400).json({
          success: false,
          message: 'The uploaded file is empty',
        });
      }

      // Validate binary magic numbers
      if (!validateMagicNumbers(req.file.buffer)) {
        return res.status(400).json({
          success: false,
          message: 'File content does not match a valid image signature',
        });
      }

      if (detectImageMime(req.file.buffer) !== req.file.mimetype.toLowerCase()) {
        return res.status(400).json({
          success: false,
          message: 'Image content does not match the declared file type',
        });
      }

      // Generate secure unique filename
      const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
      req.file.safeFilename = `${crypto.randomBytes(16).toString('hex')}${ext}`;

      next();
    });
  };
};

export { validateMagicNumbers, detectImageMime, ALLOWED_MIME_TYPES, ALLOWED_EXTENSIONS };
export default uploadImageMiddleware;
