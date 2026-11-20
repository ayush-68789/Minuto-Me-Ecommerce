// Owner: M1
import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { createStore, getMyStore, getMyStores, updateMyStore } from '../controllers/storeController.js';

const router = express.Router();

router.use(authMiddleware);
router.route('/me').get(getMyStore).patch(updateMyStore);
router.get('/', getMyStores);
router.post('/', createStore);

export default router;
