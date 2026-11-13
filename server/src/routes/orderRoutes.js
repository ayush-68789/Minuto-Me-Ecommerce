// Owner: Member 5 — Order and checkout endpoints.
import { Router } from 'express';
import {
  createOrder,
  getOrder,
  listOrders,
  updateOrderStatus
} from '../controllers/orderController.js';

const router = Router();

router.get('/', listOrders);
router.post('/', createOrder);
router.post('/checkout', createOrder);
router.get('/:id', getOrder);
router.patch('/:id/status', updateOrderStatus);

export default router;

