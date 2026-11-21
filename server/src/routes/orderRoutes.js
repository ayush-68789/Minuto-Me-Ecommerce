import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { quoteCart } from '../controllers/cartController.js';
import {
  createOrder,
  trackOrder,
  getMyOrders,
  getStoreOrders,
  updateOrderStatus,
} from '../controllers/orderController.js';

const optionalAuth = (req, res, next) => {
  const hasToken = Boolean(req.cookies?.token || req.headers.authorization);
  return hasToken ? authMiddleware(req, res, next) : next();
};

const router = express.Router();

router.post('/quote', quoteCart);
router.post('/', optionalAuth, createOrder);
router.get('/track/:id', trackOrder);
router.get('/my', authMiddleware, getMyOrders);
router.get('/store', authMiddleware, getStoreOrders);
router.patch('/:id/status', authMiddleware, updateOrderStatus);

export default router;
