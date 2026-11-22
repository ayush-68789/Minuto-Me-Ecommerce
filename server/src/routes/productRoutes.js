// Owner: M4
import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  getProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
} from '../controllers/productController.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getProducts);
router.post('/', createProduct);
router.get('/:id', getProductById);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.patch('/:id/toggle-status', toggleProductStatus);

export default router;
