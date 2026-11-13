// Owner: Member 5 — Cart endpoints.
import { Router } from 'express';
import {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart
} from '../controllers/cartController.js';

const router = Router();

router.get('/', getCart);
router.post('/items', addItem);
router.patch('/items/:productId', updateItem);
router.put('/items/:productId', updateItem);
router.delete('/items/:productId', removeItem);
router.delete('/', clearCart);

export default router;

