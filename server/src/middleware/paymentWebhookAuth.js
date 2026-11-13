// Owner: M5, coordinated with M2 rate-limiting — verify raw-body webhook HMAC before processing.
import { createHmac, timingSafeEqual } from 'node:crypto';
import { HttpError } from './errorHandler.js';

export default function verifyPaymentWebhook(req, _res, next) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  const signature = req.get('x-payment-signature') || '';
  if (!secret) return next(new HttpError(503, 'webhook_not_configured', 'Payment webhook is not configured'));
  if (!req.rawBody || !/^[a-f0-9]{64}$/i.test(signature)) {
    return next(new HttpError(401, 'invalid_webhook_signature', 'Payment webhook signature is invalid'));
  }

  const expected = createHmac('sha256', secret).update(req.rawBody).digest();
  const received = Buffer.from(signature, 'hex');
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return next(new HttpError(401, 'invalid_webhook_signature', 'Payment webhook signature is invalid'));
  }
  return next();
}
