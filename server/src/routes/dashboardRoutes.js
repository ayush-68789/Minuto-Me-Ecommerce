// Owner: M4
import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { getStats, getStoreDetails, updateStoreDetails } from '../controllers/dashboardController.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/stats', getStats);
router.get('/store', getStoreDetails);
router.put('/store', updateStoreDetails);

export default router;
