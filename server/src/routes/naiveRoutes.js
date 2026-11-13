import { Router } from 'express';
import * as c from '../controllers/naiveController.js';

const router = Router();
router.post('/checkout', c.checkout);
router.post('/webhook', c.webhook);

export default router;
