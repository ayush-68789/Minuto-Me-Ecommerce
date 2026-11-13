import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';
import { createProduct, deleteProduct, getProduct, listProducts, updateProduct } from '../controllers/productController.js';

const router = Router();
router.use(authenticate, requireAdmin);
router.get('/', asyncHandler(listProducts));
router.post('/', asyncHandler(createProduct));
router.get('/:productId', asyncHandler(getProduct));
router.patch('/:productId', asyncHandler(updateProduct));
router.delete('/:productId', asyncHandler(deleteProduct));

export default router;
