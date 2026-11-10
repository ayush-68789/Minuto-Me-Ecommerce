// Owner: Member 4 — admin endpoints. The guard below covers every route added to this router.
import { Router } from 'express';
import { listAllOrders, listUsers } from '../controllers/adminController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';

const router = Router();
router.use(authenticate, requireAdmin);
router.get('/users', listUsers);
router.get('/orders', listAllOrders);

export default router;
