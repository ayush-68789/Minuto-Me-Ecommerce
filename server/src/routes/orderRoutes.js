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
  deleteOrder,
} from '../controllers/orderController.js';

const router = express.Router();

// Storefront (public)
router.post('/quote', quoteCart);
router.post('/', authMiddleware, createOrder);
router.get('/track/:id', trackOrder);

// Customer
router.get('/my', authMiddleware, getMyOrders);

// Store owner
router.get('/store', authMiddleware, getStoreOrders);
router.patch('/:id/status', authMiddleware, updateOrderStatus);
router.delete('/:id', authMiddleware, deleteOrder);

export default router;
