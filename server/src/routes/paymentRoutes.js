// Owner: M5
import express from 'express';
import { simulatePayment } from '../controllers/paymentController.js';

const router = express.Router();

router.post('/:orderId/simulate', simulatePayment);

export default router;
