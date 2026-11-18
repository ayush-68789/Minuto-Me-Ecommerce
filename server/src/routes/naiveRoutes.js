import { Router } from 'express';
import * as c from '../controllers/naiveController.js';
import { attackDemoRateLimit } from '../middleware/tokenBucketRateLimit.js';

const router = Router();
const rateLimits = (...middleware) => process.env.RATE_LIMITING_ENABLED === 'true' && String(process.env.RATE_LIMIT_PLAN || '').toLowerCase() === 'pro' ? middleware : [];
router.post('/checkout', ...rateLimits(attackDemoRateLimit), c.checkout);
router.post('/webhook', ...rateLimits(attackDemoRateLimit), c.webhook);

export default router;
