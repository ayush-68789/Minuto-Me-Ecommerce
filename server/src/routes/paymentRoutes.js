// Owner: Member 5 — Payment and webhook endpoints.
import { Router } from 'express';
import {
  createPayment,
  processPayment,
  getPayment,
  handleWebhook
} from '../controllers/paymentController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import tenantContext from '../middleware/tenantContext.js';
import verifyPaymentWebhook from '../middleware/paymentWebhookAuth.js';

const router = Router();

router.post('/webhook', verifyPaymentWebhook, handleWebhook);
router.use(authenticate, tenantContext);
router.post('/', createPayment);
router.post('/:id/process', processPayment);
router.get('/:id', getPayment);

export default router;
