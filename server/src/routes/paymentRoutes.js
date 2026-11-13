// Owner: Member 5 — Payment and webhook endpoints.
import { Router } from 'express';
import {
  createPayment,
  processPayment,
  getPayment,
  handleWebhook
} from '../controllers/paymentController.js';

const router = Router();

router.post('/', createPayment);
router.post('/:id/process', processPayment);
router.get('/:id', getPayment);
router.post('/webhook', handleWebhook);

export default router;

