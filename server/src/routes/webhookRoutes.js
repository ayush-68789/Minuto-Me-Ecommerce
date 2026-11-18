import { Router } from 'express';
import { handlePaymentWebhook } from '../controllers/webhookController.js';

const router = Router();
router.post('/payments', handlePaymentWebhook);

export default router;
