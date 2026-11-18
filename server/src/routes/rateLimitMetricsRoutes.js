import { Router } from 'express';
import { readRateLimitMetrics } from '../controllers/rateLimitMetricsController.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';

const router = Router();
router.get('/', authenticate, requireAdmin, asyncHandler(readRateLimitMetrics));

export default router;
