// Owner: M4 (Product Management & Dashboard)
import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  getStats,
  getInventorySummary,
  getStoreDetails,
  updateStoreDetails,
} from '../controllers/dashboardController.js';

const router = express.Router();

// All dashboard endpoints require merchant authentication
router.use(authMiddleware);

router.get('/stats', getStats);
router.get('/inventory', getInventorySummary);
router.get('/store', getStoreDetails);
router.put('/store', updateStoreDetails);

export default router;
