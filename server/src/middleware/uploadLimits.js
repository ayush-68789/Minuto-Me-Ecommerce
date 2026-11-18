// Owner: M2 — strict policy for future in-memory image upload routes.
import { HttpError } from './errorHandler.js';

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_UPLOAD_FILES = 5;
export const UPLOAD_PARSER_LIMITS = Object.freeze({
  fileSize: MAX_UPLOAD_BYTES,
  files: MAX_UPLOAD_FILES,
  fields: 20,
  parts: MAX_UPLOAD_FILES + 20,
});

const signatures = {
  'image/jpeg': (buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  'image/png': (buffer) => buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/webp': (buffer) => buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP',
};

export function validateUploadedFile(file) {
  if (!file || !Number.isSafeInteger(file.size) || file.size < 1 || file.size > MAX_UPLOAD_BYTES) {
    throw new HttpError(413, 'upload_too_large', `Each upload must be between 1 byte and ${MAX_UPLOAD_BYTES} bytes`);
  }
  const signature = signatures[file.mimetype];
  if (!signature || !Buffer.isBuffer(file.buffer) || !signature(file.buffer)) {
    throw new HttpError(415, 'upload_type_not_allowed', 'Only valid JPEG, PNG and WebP image uploads are accepted');
  }
  return file;
}

export function validateUploadedFiles(req, _res, next) {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    if (!Array.isArray(files) || files.length > MAX_UPLOAD_FILES) {
      throw new HttpError(413, 'too_many_uploads', `At most ${MAX_UPLOAD_FILES} image files may be uploaded at once`);
    }
    files.forEach(validateUploadedFile);
    return next();
  } catch (error) {
    return next(error);
  }
}
