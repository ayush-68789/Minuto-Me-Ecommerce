// INTENTIONALLY VULNERABLE demo route. Mounted in app.js ONLY when NODE_ENV !== 'production'.
import { Router } from 'express';
import { naivePurchase } from './naiveController.js';

const router = Router();
router.post('/purchase/:productId', naivePurchase);

export default router;
