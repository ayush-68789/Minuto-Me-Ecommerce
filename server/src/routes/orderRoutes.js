// Owner: Member 5 — order endpoints. Every route requires a signed-in user.
import { Router } from 'express';
import { checkNewOrder, createOrder, getOrder, listMyOrders } from '../controllers/orderController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import validateRequest from '../middleware/validateRequest.js';
import { checkoutAccountRateLimit, checkoutIpRateLimit } from '../middleware/tokenBucketRateLimit.js';

const router = Router();
router.use(authenticate);
router.post('/', checkoutIpRateLimit, checkoutAccountRateLimit, validateRequest(checkNewOrder), createOrder);
router.get('/', listMyOrders);
router.get('/:orderId', getOrder);

export default router;
