// Owner: Member 5 — order endpoints. Every route requires a signed-in user.
import { Router } from 'express';
import { checkNewOrder, createOrder, getOrder, listMyOrders } from '../controllers/orderController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import validateRequest from '../middleware/validateRequest.js';

const router = Router();
router.use(authenticate);
router.post('/', validateRequest(checkNewOrder), createOrder);
router.get('/', listMyOrders);
router.get('/:orderId', getOrder);

export default router;
