// Owner: M2 - Products & Dashboard (Cloudinary storage: Member 5 - Onboarding & Studio)
import path from 'path';
import fs from 'fs';
import { isCloudinaryEnabled, uploadBuffer } from '../config/cloudinary.js';

// Resolve uploads directory (used when Cloudinary is not configured)
const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch {
    // Ignore error if directory already exists
  }
}

const ALLOWED = /jpeg|jpg|png|webp|gif|svg/;
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB max

/**
 * Persist one in-memory file: Cloudinary when configured, local /uploads otherwise.
 * Resolves to the public URL stored on the document.
 */
export const storeFile = async (file, folder = 'misc') => {
  if (isCloudinaryEnabled()) {
    const { url } = await uploadBuffer(file.buffer, { folder: `minuto-me/${folder}` });
    return url;
  }
  const ext = path.extname(file.originalname).toLowerCase();
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
  await fs.promises.writeFile(path.join(uploadDir, filename), file.buffer);
  return `/uploads/${filename}`;
};

const folderFor = (req) => (req.baseUrl?.includes('product') ? 'products' : 'stores');

// Multer integration with graceful fallback
let multerMiddleware;
try {
  const multerModule = await import('multer');
  const multer = multerModule.default || multerModule;

  const fileFilter = (_req, file, cb) => {
    const ext = ALLOWED.test(path.extname(file.originalname).toLowerCase());
    const mime = ALLOWED.test(file.mimetype);
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png, webp, gif, svg) are allowed'));
    }
  };

  const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: { fileSize: MAX_SIZE },
  });

  // Run a multer handler, then persist every received file and expose its URL on req.body
  const run = (handler, collect) => (req, res, next) => {
    handler(req, res, async (err) => {
      if (err) {
        const message = err.code === 'LIMIT_FILE_SIZE' ? 'Images must be 5 MB or smaller' : err.message;
        return res.status(400).json({ message, success: false });
      }
      try {
        await collect(req);
        return next();
      } catch (storeErr) {
        return res.status(502).json({ message: `Image upload failed: ${storeErr.message}`, success: false });
      }
    });
  };

  multerMiddleware = {
    single: (fieldName) =>
      run(upload.single(fieldName), async (req) => {
        if (req.file) {
          req.body[fieldName] = await storeFile(req.file, folderFor(req));
        }
      }),
    array: (fieldName, maxCount = 5) =>
      run(upload.array(fieldName, maxCount), async (req) => {
        if (req.files?.length) {
          req.body[fieldName] = await Promise.all(req.files.map((f) => storeFile(f, folderFor(req))));
        }
      }),
    // fields: [{ name: 'logo', maxCount: 1 }, { name: 'banners', maxCount: 5 }]
    fields: (fields) =>
      run(upload.fields(fields), async (req) => {
        for (const { name, maxCount = 1 } of fields) {
          const files = req.files?.[name];
          if (!files?.length) continue;
          const urls = await Promise.all(files.map((f) => storeFile(f, folderFor(req))));
          req.body[name] = maxCount === 1 ? urls[0] : urls;
        }
      }),
  };
} catch {
  // Graceful fallback when multer is not available: image URLs must already be in the JSON body
  multerMiddleware = {
    single: () => (_req, _res, next) => next(),
    array: (fieldName) => (req, _res, next) => {
      if (req.body?.[fieldName] && !Array.isArray(req.body[fieldName])) {
        req.body[fieldName] = [req.body[fieldName]];
      }
      next();
    },
    fields: () => (_req, _res, next) => next(),
  };
}

export const uploadSingle = (field) => multerMiddleware.single(field);
export const uploadArray = (field, maxCount) => multerMiddleware.array(field, maxCount);
export const uploadFields = (fields) => multerMiddleware.fields(fields);

export default multerMiddleware;
