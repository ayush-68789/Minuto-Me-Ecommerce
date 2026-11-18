// INTENTIONALLY VULNERABLE demo route. Mounted in app.js ONLY when NODE_ENV !== 'production'.
import { Router } from 'express';
import { naivePurchase } from './naiveController.js';
import { attackDemoRateLimit } from '../../middleware/tokenBucketRateLimit.js';

const router = Router();
router.post('/purchase/:productId', attackDemoRateLimit, naivePurchase);

export default router;
