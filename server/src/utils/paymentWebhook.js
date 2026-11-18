import { createHmac, timingSafeEqual } from 'node:crypto';

// Verify HMAC-SHA256 over the raw request bytes using the local demo webhook secret.
export function verifyPaymentSignature(rawBody, signature) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest();
  const received = Buffer.from(String(signature), 'hex');
  return received.length === expected.length && timingSafeEqual(received, expected);
}
