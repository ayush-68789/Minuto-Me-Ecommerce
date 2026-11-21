// Owner: M2 - Products & Dashboard
import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  getDashboardSummary,
  getLowStockAlerts,
} from '../controllers/dashboardController.js';

const router = Router();

// Dashboard metrics require merchant authentication
router.use(authMiddleware);

router.get('/summary', getDashboardSummary);
router.get('/stats', getDashboardSummary);
router.get('/low-stock', getLowStockAlerts);

export default router;
