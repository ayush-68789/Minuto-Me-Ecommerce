// Integration test for M5: Hardened checkout, Mongo Order listing & details
import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import mongoose from 'mongoose';
import app from '../src/app.js';
import userModel, { ROLES } from '../src/models/User.js';
import Product from '../src/models/Product.js';
import MongoOrder from '../src/models/orderModel.js';
import { createAccessToken } from '../src/services/jwtTokens.js';

let server;
let baseUrl;

test.before(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  server = app.listen(0);
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  if (server) await new Promise((res) => server.close(res));
  await mongoose.disconnect();
});

test('M5 End-to-End Hardened Checkout & Order Lifecycle Flow', async (t) => {
  const tenantId = 'default';
  const testEmail = `m5_tester_${Date.now()}@example.com`;
  
  // 1. Create a customer
  const user = await userModel.create({
    name: 'M5 Tester',
    email: testEmail,
    password: 'Password123!',
    role: ROLES.CUSTOMER
  });
  assert.ok(user?._id, 'Customer created');

  const token = createAccessToken(user._id);

  // 2. Ensure product exists in DB
  const sampleProduct = await Product.findOne({ tenantId });
  assert.ok(sampleProduct, 'Sample product found in database');

  let orderId;

  await t.test('Hardened Checkout (POST /api/checkout) reserves stock and creates order', async () => {
    const res = await fetch(`${baseUrl}/api/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-tenant-id': tenantId,
        'Idempotency-Key': `test-idemp-${Date.now()}`
      },
      body: JSON.stringify({
        items: [{ productId: String(sampleProduct._id), qty: 1 }]
      })
    });

    assert.equal(res.status, 201, `Checkout response code 201 expected, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.orderId, 'orderId returned in checkout response');
    assert.ok(data.paymentOrderId, 'paymentOrderId returned');
    assert.equal(data.paymentMode, 'demo');
    assert.equal(data.amount, Math.round(sampleProduct.price * 100)); // in paise
    orderId = data.orderId;
  });

  await t.test('Order History (GET /api/orders) displays Mongo order for the customer', async () => {
    const res = await fetch(`${baseUrl}/api/orders`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-tenant-id': tenantId
      }
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.orders));
    const found = data.orders.find(o => String(o.id) === String(orderId));
    assert.ok(found, 'Created order found in customer order history');
    assert.equal(found.items[0].productId, String(sampleProduct._id));
  });

  await t.test('Order Details (GET /api/orders/:orderId) retrieves complete order breakdown', async () => {
    const res = await fetch(`${baseUrl}/api/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-tenant-id': tenantId
      }
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.order);
    assert.equal(String(data.order.id), String(orderId));
    assert.equal(data.order.items[0].title, sampleProduct.name);
  });

  await t.test('Customer Order Cancellation (POST /api/orders/:orderId/cancel) transitions order state', async () => {
    const res = await fetch(`${baseUrl}/api/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-tenant-id': tenantId
      },
      body: JSON.stringify({ reason: 'Changed mind' })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.order.status, 'cancelled');

    // Verify in database
    const inDb = await MongoOrder.findById(orderId);
    assert.equal(inDb.status, 'cancelled');
  });
});
