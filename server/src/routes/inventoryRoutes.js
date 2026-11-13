// Mounted in app.js at /api/inventory
import { Router } from 'express';
import { getProductStock, reserve, confirm } from '../controllers/inventoryController.js';

const router = Router();

router.get('/:productId', getProductStock);
router.post('/:productId/reserve', reserve);
router.post('/reservations/:id/confirm', confirm);

export default router;
