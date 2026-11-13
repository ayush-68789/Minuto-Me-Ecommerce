// Member 3 attack script: duplicate checkout, duplicate webhook, forged webhook, tampered price.
// Run:  npm run attack:m3   (server must be running)
import 'dotenv/config';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const BASE = process.env.BASE_URL || 'http://localhost:5000';
const SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret';
const N = 10;
const TENANT_ID = process.env.TENANT_ID || 'demo-tenant-a';

// Dev mode uses x-user-id. If you have a real JWT from Member 4, set TOKEN in .env.
const authHeaders = {
  'x-tenant-id': TENANT_ID,
  'x-user-id': process.env.USER_ID || 'demo-user-1',
  ...(process.env.TOKEN ? { Authorization: `Bearer ${process.env.TOKEN}` } : {}),
};

const sign = (raw) => crypto.createHmac('sha256', SECRET).update(raw).digest('hex');

async function post(route, body, headers = {}) {
  const res = await fetch(BASE + route, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
  let json = null;
  try { json = await res.json(); } catch { /* empty body */ }
  return { status: res.status, json };
}

const burst = (fn) => Promise.all(Array.from({ length: N }, fn));

const eventBody = (orderId, paymentId, amount) => JSON.stringify({
  event: 'payment.captured',
  payload: { payment: { entity: { id: paymentId, order_id: orderId, amount, status: 'captured' } } },
});

export async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection;

  // Seed one product for this run (so no manual setup is needed)
  const prod = await db.collection('products').insertOne({
    tenantId: TENANT_ID, name: 'Attack Test Item', price: 499, stock: 1000,
    createdAt: new Date(), updatedAt: new Date(),
  });
  const items = [{ productId: String(prod.insertedId), qty: 1 }];
  const results = [];

  // Attack 1: same checkout x10
  const keyN = crypto.randomUUID();
  const keyH = crypto.randomUUID();
  await burst(() => post('/api/naive/checkout', { items, total: 1 }, { 'Idempotency-Key': keyN }));
  await burst(() => post('/api/checkout', { items }, { ...authHeaders, 'Idempotency-Key': keyH }));
  const nOrders = await db.collection('naiveorders').countDocuments({ idempotencyKey: keyN });
  const hOrders = await db.collection('orders').countDocuments({ idempotencyKey: keyH });
  results.push({
    Attack: `Same checkout x${N}`,
    Naive: `${nOrders} orders`,
    Hardened: `${hOrders} order`,
    Result: hOrders === 1 ? 'PASS' : 'FAIL',
  });

  // Attack 2: same webhook x10 (valid signature, same event ID)
  const co = await post('/api/checkout', { items }, { ...authHeaders, 'Idempotency-Key': crypto.randomUUID() });
  if (co.status !== 201) throw new Error('Checkout failed: ' + JSON.stringify(co));
  const payId = 'pay_' + crypto.randomBytes(6).toString('hex');
  const body = eventBody(co.json.razorpayOrderId, payId, co.json.amount);
  const evHeaders = { 'x-razorpay-signature': sign(body), 'x-razorpay-event-id': 'evt_' + payId };
  await burst(() => post('/api/naive/webhook', body));
  await burst(() => post('/api/webhooks/razorpay', body, evHeaders));
  const nPay = await db.collection('naivepayments').countDocuments({ paymentId: payId });
  const hPay = await db.collection('payments').countDocuments({ providerPaymentId: payId });
  results.push({
    Attack: `Same webhook x${N}`,
    Naive: `${nPay} payments`,
    Hardened: `${hPay} payment`,
    Result: hPay === 1 ? 'PASS' : 'FAIL',
  });

  // Attack 3: forged webhook (bad signature)
  const co2 = await post('/api/checkout', { items }, { ...authHeaders, 'Idempotency-Key': crypto.randomUUID() });
  const forged = eventBody(co2.json.razorpayOrderId, 'pay_forged', co2.json.amount);
  const nF = await post('/api/naive/webhook', forged);
  const hF = await post('/api/webhooks/razorpay', forged,
    { 'x-razorpay-signature': 'deadbeef', 'x-razorpay-event-id': 'evt_forged_' + Date.now() });
  const stillPending = await db.collection('orders')
    .countDocuments({ razorpayOrderId: co2.json.razorpayOrderId, status: 'pending' });
  results.push({
    Attack: 'Forged webhook',
    Naive: `accepted (${nF.status})`,
    Hardened: `rejected (${hF.status})`,
    Result: hF.status === 400 && stillPending === 1 ? 'PASS' : 'FAIL',
  });

  // Attack 4 (bonus): tampered price
  const tamper = await post('/api/checkout', { items, total: 1, price: 1 },
    { ...authHeaders, 'Idempotency-Key': crypto.randomUUID() });
  results.push({
    Attack: 'Tampered price (total: 1)',
    Naive: 'uses client total',
    Hardened: `charged ${tamper.json?.amount} paise`,
    Result: tamper.json?.amount === 49900 ? 'PASS' : 'FAIL',
  });

  console.table(results);
  await db.collection('products').deleteOne({ _id: prod.insertedId });
  await mongoose.disconnect();
  return results;
}

// Run directly: node scripts/attacks/member3.js
if (path.resolve(process.argv[1] || '') === path.resolve(fileURLToPath(import.meta.url))) {
  run().catch((e) => { console.error(e); process.exit(1); });
}
