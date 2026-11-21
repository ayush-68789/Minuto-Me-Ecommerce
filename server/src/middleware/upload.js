// Owner: M2 - Products & Dashboard
import path from 'path';
import fs from 'fs';

// Resolve uploads directory
const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch {
    // Ignore error if directory already exists
  }
}

// Multer integration with graceful fallback
let multerMiddleware;
try {
  const multerModule = await import('multer');
  const multer = multerModule.default || multerModule;

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
  });

  const fileFilter = (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif|svg/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png, webp, gif, svg) are allowed'));
    }
  };

  const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  });

  multerMiddleware = {
    single: (fieldName) => (req, res, next) => {
      upload.single(fieldName)(req, res, (err) => {
        if (err) {
          return res.status(400).json({ message: err.message, success: false });
        }
        if (req.file) {
          req.body[fieldName] = `/uploads/${req.file.filename}`;
        }
        next();
      });
    },
    array: (fieldName, maxCount = 5) => (req, res, next) => {
      upload.array(fieldName, maxCount)(req, res, (err) => {
        if (err) {
          return res.status(400).json({ message: err.message, success: false });
        }
        if (req.files?.length) {
          req.body[fieldName] = req.files.map((f) => `/uploads/${f.filename}`);
        }
        next();
      });
    },
  };
} catch {
  // Graceful fallback when multer is not available
  multerMiddleware = {
    single: (fieldName) => (req, _res, next) => {
      if (req.body?.[fieldName] && typeof req.body[fieldName] === 'string') {
        // Image URL or base64 data already provided in body
      }
      next();
    },
    array: (fieldName) => (req, _res, next) => {
      if (req.body?.[fieldName] && !Array.isArray(req.body[fieldName])) {
        req.body[fieldName] = [req.body[fieldName]];
      }
      next();
    },
  };
}

export const uploadSingle = (field) => multerMiddleware.single(field);
export const uploadArray = (field, maxCount) => multerMiddleware.array(field, maxCount);

export default multerMiddleware;
