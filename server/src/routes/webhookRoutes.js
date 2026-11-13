import { Router } from 'express';
import { handleRazorpay } from '../controllers/webhookController.js';

const router = Router();
router.post('/razorpay', handleRazorpay);

export default router;
