// Owner: Member 5 — order endpoints with customer ownership and admin status updates.
import { Router } from 'express';
import { createOrder, getOrder, listOrders, updateOrderStatus } from '../controllers/orderController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';
import { checkoutAccountRateLimit, checkoutIpRateLimit } from '../middleware/tokenBucketRateLimit.js';

const router = Router();
router.use(authenticate);
router.get('/', listOrders);
router.post('/', checkoutIpRateLimit, checkoutAccountRateLimit, createOrder);
router.post('/checkout', checkoutIpRateLimit, checkoutAccountRateLimit, createOrder);
router.patch('/:orderId/status', requireAdmin, updateOrderStatus);
router.get('/:orderId', getOrder);

export default router;
