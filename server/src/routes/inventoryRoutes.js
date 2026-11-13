// Mounted in app.js at /api/inventory
import { Router } from 'express';
import { getProductStock, reserve, confirm } from '../controllers/inventoryController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { checkoutAccountRateLimit, checkoutIpRateLimit } from '../middleware/tokenBucketRateLimit.js';

const router = Router();

function requireInventoryUser(req, res, next) {
  if (process.env.NODE_ENV === 'production' || req.get('authorization')) return authenticate(req, res, next);
  return next(); // local attack demo supports x-customer-id until auth is wired in production.
}

router.get('/:productId', getProductStock);
router.post('/:productId/reserve', requireInventoryUser, checkoutIpRateLimit, checkoutAccountRateLimit, reserve);
router.post('/reservations/:id/confirm', requireInventoryUser, confirm);

export default router;
