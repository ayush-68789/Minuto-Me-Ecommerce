import { Router } from 'express';
import * as c from '../controllers/naiveController.js';
import { attackDemoRateLimit } from '../middleware/tokenBucketRateLimit.js';

const router = Router();
router.post('/checkout', attackDemoRateLimit, c.checkout);
router.post('/webhook', attackDemoRateLimit, c.webhook);

export default router;
