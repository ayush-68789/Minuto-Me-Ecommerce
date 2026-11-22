// Owner: M1
import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { createStore, getMyStore, getMyStores, updateMyStore, deleteMyStore } from '../controllers/storeController.js';

const router = express.Router();

router.use(authMiddleware);
router.route('/me').get(getMyStore).patch(updateMyStore).delete(deleteMyStore);
router.get('/', getMyStores);
router.post('/', createStore);

export default router;
