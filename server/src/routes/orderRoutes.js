// Owner: M5
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

// Guests can check out; if a session token is present we attach the customer to the order.
const optionalAuth = (req, res, next) => {
  const hasToken = (req.cookies && req.cookies.token) || req.headers.authorization;
  return hasToken ? authMiddleware(req, res, next) : next();
};

const router = express.Router();

// Storefront (public)
router.post('/quote', quoteCart);
router.post('/', optionalAuth, createOrder);
router.get('/track/:id', trackOrder);

// Customer
router.get('/my', authMiddleware, getMyOrders);

// Store owner
router.get('/store', authMiddleware, getStoreOrders);
router.patch('/:id/status', authMiddleware, updateOrderStatus);

export default router;
