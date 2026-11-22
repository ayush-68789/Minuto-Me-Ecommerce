import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import uploadImageMiddleware from '../middleware/upload.js';
import { uploadBufferToCloudinary, isConfigured } from '../config/cloudinary.js';

const router = express.Router();

router.post('/', authMiddleware, uploadImageMiddleware('image'), async (req, res, next) => {
  try {
    if (!isConfigured()) {
      const error = new Error('Image upload service is not configured');
      error.status = 503;
      throw error;
    }

    const result = await uploadBufferToCloudinary(req.file.buffer, {
      filename: req.file.safeFilename.replace(/\.[^/.]+$/, ''),
    });

    res.status(200).json({
      success: true,
      url: result.url,
      publicId: result.publicId,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
