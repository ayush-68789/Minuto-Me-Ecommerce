// Owner: M2 - Products & Dashboard
import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { requireStoreOwner } from '../middleware/ownershipMiddleware.js';
import { uploadSingle } from '../middleware/upload.js';
import { validateCreateStore, validateUpdateStore } from '../validators/storeValidator.js';
import {
  createStore,
  getMyStore,
  getStore,
  getStoreBySlug,
  updateStore,
  deleteStore,
} from '../controllers/storeController.js';

const router = Router();

// Public route to view a store by slug
router.get('/slug/:slug', getStoreBySlug);

// Protected merchant routes
router.use(authMiddleware);

router.post('/', uploadSingle('logo'), validateCreateStore, createStore);
router.get('/me', getMyStore);
router.get('/:id', getStore);
router.put('/:id', requireStoreOwner, uploadSingle('logo'), validateUpdateStore, updateStore);
router.delete('/:id', requireStoreOwner, deleteStore);

export default router;
