import { Router } from 'express';
import { exportStore } from '../controllers/storeExportController.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();
router.post('/export', asyncHandler(exportStore));

export default router;
