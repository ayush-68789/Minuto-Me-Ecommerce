// Owner: M2 - Products & Dashboard
import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { requireProductOwner, requireStoreOwner } from '../middleware/ownershipMiddleware.js';
import { uploadSingle } from '../middleware/upload.js';
import { validateCreateProduct, validateUpdateProduct } from '../validators/productValidator.js';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getPublicProducts,
} from '../controllers/productController.js';

const router = Router();

// Public storefront route
router.get('/public/:storeId', getPublicProducts);

// Protected routes for store management
router.use(authMiddleware);

router.get('/', getProducts);
router.post('/', uploadSingle('image'), validateCreateProduct, createProduct);
router.get('/:productId', getProductById);
router.put('/:productId', requireProductOwner, uploadSingle('image'), validateUpdateProduct, updateProduct);
router.patch('/:productId', requireProductOwner, uploadSingle('image'), validateUpdateProduct, updateProduct);
router.delete('/:productId', requireProductOwner, deleteProduct);

export default router;
