// Owner: M4 (Product Management & Dashboard)
import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  getProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  updateStock,
  getInventoryAlerts,
} from '../controllers/productController.js';

const router = express.Router();

// Require authentication for all merchant product management routes
router.use(authMiddleware);

// Inventory and alerts routes (declared before parameter routes)
router.get('/inventory/alerts', getInventoryAlerts);

// Product CRUD routes
router.get('/', getProducts);
router.post('/', createProduct);
router.get('/:id', getProductById);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.patch('/:id/toggle-status', toggleProductStatus);
router.patch('/:id/stock', updateStock);

export default router;
