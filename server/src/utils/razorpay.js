import crypto from 'crypto';

// Env values are read when functions run (not at import time), so it doesn't matter
// whether dotenv has loaded yet when this file is first imported.
export const isMock = () => !process.env.RAZORPAY_KEY_ID;

let client = null;
async function getClient() {
  if (!client) {
    const { default: Razorpay } = await import('razorpay'); // only loaded when real keys exist
    client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return client;
}

// Mock mode (no Razorpay keys) invents an order ID so the demo works offline.
export async function createPaymentOrder({ amount, receipt }) {
  if (isMock()) {
    return { id: 'order_mock_' + crypto.randomBytes(8).toString('hex'), amount, currency: 'INR' };
  }
  const c = await getClient();
  return c.orders.create({ amount, currency: 'INR', receipt });
}

// Verify HMAC-SHA256 of the RAW request bytes (constant-time compare).
export function verifySignature(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret';
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
