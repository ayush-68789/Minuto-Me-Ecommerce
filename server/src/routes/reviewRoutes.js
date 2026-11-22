import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { createReview, listReviews } from '../controllers/reviewController.js';

const router = express.Router();
const optionalAuth = (req, res, next) => {
  if (!req.cookies?.token && !req.headers.authorization) return next();
  return authMiddleware(req, res, next);
};

router.get('/:productId', optionalAuth, listReviews);
router.post('/:productId', authMiddleware, createReview);

export default router;
