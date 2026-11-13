import { Router } from 'express';
import { checkout } from '../controllers/checkoutController.js';
import idempotency from '../middleware/idempotency.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();
// app.js already applies request/tenant limits; then auth, idempotency, checkout.
router.post('/', authenticate, idempotency, asyncHandler(checkout));

export default router;
