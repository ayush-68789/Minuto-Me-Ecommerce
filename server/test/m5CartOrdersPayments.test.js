// Automated tests for Member 5 (Cart, Orders, Payments, Coupons, Refunds)
import test from 'node:test';
import assert from 'node:assert/strict';

import Cart from '../src/models/Cart.js';
import Order from '../src/models/Order.js';
import Payment from '../src/models/Payment.js';

test('M5 Cart Model - Pricing and Items', async (t) => {
  const tenantId = 'store_test';
  const userId = 'customer_1';
  Cart.clear(tenantId, userId);

  await t.test('initializes empty cart with zeroed pricing', () => {
    const cart = Cart.get(tenantId, userId);
    assert.equal(cart.items.length, 0);
    assert.equal(cart.pricing.subtotal, 0);
    assert.equal(cart.pricing.shipping, 0);
    assert.equal(cart.pricing.tax, 0);
    assert.equal(cart.pricing.total, 0);
    assert.equal(cart.itemCount, 0);
  });

  await t.test('adds item and applies flat shipping under $50', () => {
    const cart = Cart.addItem(tenantId, userId, {
      productId: 'p1',
      title: 'Coffee Mug',
      price: 20,
      quantity: 1
    });

    assert.equal(cart.items.length, 1);
    assert.equal(cart.pricing.subtotal, 20);
    assert.equal(cart.pricing.shipping, 5.00); // under $50
    assert.equal(cart.pricing.tax, 1.60); // 8% of 20
    assert.equal(cart.pricing.total, 26.60);
    assert.equal(cart.itemCount, 1);
  });

  await t.test('increments quantity when adding same product', () => {
    const cart = Cart.addItem(tenantId, userId, {
      productId: 'p1',
      price: 20,
      quantity: 2
    });

    assert.equal(cart.items.length, 1);
    assert.equal(cart.items[0].quantity, 3);
    assert.equal(cart.pricing.subtotal, 60);
    assert.equal(cart.pricing.shipping, 0); // >= $50 is free shipping
    assert.equal(cart.pricing.tax, 4.80);
    assert.equal(cart.pricing.total, 64.80);
    assert.equal(cart.itemCount, 3);
  });

  await t.test('applies SAVE10 percentage discount coupon', () => {
    const cart = Cart.applyCoupon(tenantId, userId, 'SAVE10');
    assert.ok(cart.coupon);
    assert.equal(cart.pricing.subtotal, 60);
    assert.equal(cart.pricing.discount, 6.00); // 10% of 60
    assert.equal(cart.pricing.shipping, 0); // 60 - 6 = 54 (>= 50)
    assert.equal(cart.pricing.tax, 4.32); // 8% of 54
    assert.equal(cart.pricing.total, 58.32);
  });

  await t.test('applies FREESHIP coupon on orders under $50', () => {
    Cart.clear(tenantId, userId);
    Cart.addItem(tenantId, userId, { productId: 'p2', price: 15, quantity: 1 });
    const cart = Cart.applyCoupon(tenantId, userId, 'FREESHIP');
    assert.equal(cart.pricing.subtotal, 15);
    assert.equal(cart.pricing.shipping, 0); // coupon waives shipping
    assert.equal(cart.pricing.tax, 1.20);
    assert.equal(cart.pricing.total, 16.20);
  });

  await t.test('rejects invalid or expired coupon code', () => {
    assert.throws(() => {
      Cart.applyCoupon(tenantId, userId, 'BOGUS99');
    }, /Invalid or expired coupon/);
  });

  await t.test('removes coupon successfully', () => {
    const cart = Cart.removeCoupon(tenantId, userId);
    assert.equal(cart.coupon, null);
    assert.equal(cart.pricing.discount, 0);
    assert.equal(cart.pricing.shipping, 5.00); // flat shipping returns
  });

  await t.test('enforces quantity bounds and removes on zero quantity', () => {
    assert.throws(() => {
      Cart.addItem(tenantId, userId, { productId: 'p3', price: 10, quantity: 150 });
    }, /quantity must be an integer from 1 to 100/);

    const updated = Cart.updateItem(tenantId, userId, 'p2', 0);
    assert.equal(updated.items.length, 0);
    assert.equal(updated.itemCount, 0);
  });

  await t.test('maintains tenant and user cart isolation', () => {
    Cart.addItem('tenant_A', 'user_1', { productId: 'itemA', price: 10, quantity: 1 });
    Cart.addItem('tenant_B', 'user_1', { productId: 'itemB', price: 20, quantity: 1 });
    Cart.addItem('tenant_A', 'user_2', { productId: 'itemC', price: 30, quantity: 1 });

    assert.equal(Cart.get('tenant_A', 'user_1').items[0].productId, 'itemA');
    assert.equal(Cart.get('tenant_B', 'user_1').items[0].productId, 'itemB');
    assert.equal(Cart.get('tenant_A', 'user_2').items[0].productId, 'itemC');
  });
});

test('M5 Order Model - Creation, Status and Cancellation', async (t) => {
  Order.clear();
  const tenantId = 'store_test';
  const customerId = 'cust_42';

  let createdOrder;

  await t.test('creates order with items, shipping address and pricing', () => {
    createdOrder = Order.create({
      tenantId,
      customerId,
      customer: { name: 'Alice Smith', email: 'alice@example.com' },
      shippingAddress: { street: '123 Market St', city: 'Metroville', postalCode: '90210', country: 'US' },
      items: [
        { productId: 'prod_1', title: 'T-Shirt', price: 25, quantity: 2 },
        { productId: 'prod_2', title: 'Cap', price: 15, quantity: 1 }
      ],
      pricing: { subtotal: 65, discount: 5, shipping: 0, tax: 4.80, total: 64.80 }
    });

    assert.ok(createdOrder.id);
    assert.equal(createdOrder.tenantId, tenantId);
    assert.equal(createdOrder.customerId, customerId);
    assert.equal(createdOrder.status, 'pending');
    assert.equal(createdOrder.items.length, 2);
    assert.equal(createdOrder.pricing.total, 64.80);
    assert.equal(createdOrder.pricing.discount, 5);
  });

  await t.test('lists orders filtered by tenant and customer', () => {
    const list = Order.list({ tenantId, customerId });
    assert.equal(list.length, 1);
    assert.equal(list[0].id, createdOrder.id);

    const otherList = Order.list({ tenantId: 'other_tenant', customerId });
    assert.equal(otherList.length, 0);
  });

  await t.test('filters orders by status', () => {
    const pendingList = Order.list({ tenantId, status: 'pending' });
    assert.equal(pendingList.length, 1);

    const deliveredList = Order.list({ tenantId, status: 'delivered' });
    assert.equal(deliveredList.length, 0);
  });

  await t.test('customer can cancel pending or processing order', () => {
    const cancelled = Order.cancel(createdOrder.id, { reason: 'Customer changed mind', cancelledBy: 'customer' });
    assert.equal(cancelled.status, 'cancelled');
    assert.ok(cancelled.cancellation);
    assert.equal(cancelled.cancellation.reason, 'Customer changed mind');
  });

  await t.test('cannot cancel already cancelled or shipped order', () => {
    assert.throws(() => {
      Order.cancel(createdOrder.id);
    }, /Cannot cancel order with status "cancelled"/);
  });

  await t.test('updates shipment tracking details', () => {
    const secondOrder = Order.create({
      tenantId,
      customerId,
      customer: { name: 'Bob', email: 'bob@example.com' },
      items: [{ productId: 'item_1', price: 50, quantity: 1 }]
    });

    const shipped = Order.updateShipment(secondOrder.id, {
      trackingNumber: 'TRACK-12345',
      carrier: 'FedEx Express'
    });

    assert.equal(shipped.status, 'shipped');
    assert.equal(shipped.shipment.trackingNumber, 'TRACK-12345');
    assert.equal(shipped.shipment.carrier, 'FedEx Express');
  });
});

test('M5 Payment Model - Processing, Refunds and Webhooks', async (t) => {
  Payment.clear();
  const tenantId = 'store_test';
  const orderId = 'order_99';

  let payment;

  await t.test('creates pending payment attempt', () => {
    payment = Payment.create({
      orderId,
      tenantId,
      amount: 49.99,
      method: 'demo_card'
    });

    assert.ok(payment.id);
    assert.equal(payment.status, 'pending');
    assert.equal(payment.amount, 49.99);
    assert.equal(payment.method, 'demo_card');
  });

  await t.test('processes payment successfully', () => {
    const processed = Payment.process(payment.id, { success: true });
    assert.equal(processed.status, 'completed');
    assert.equal(processed.failureReason, null);
    assert.ok(processed.providerDetails.processedAt);
  });

  await t.test('refunds completed payment', () => {
    const refunded = Payment.refund(payment.id, { amount: 49.99, reason: 'Returned goods' });
    assert.equal(refunded.status, 'refunded');
    assert.ok(refunded.refund);
    assert.equal(refunded.refund.amount, 49.99);
    assert.equal(refunded.refund.reason, 'Returned goods');
  });

  await t.test('handles payment.refunded webhook event', () => {
    const newPayment = Payment.create({
      orderId: 'order_100',
      tenantId,
      amount: 100,
      method: 'demo_upi'
    });
    Payment.process(newPayment.id, { success: true });

    const webhookResult = Payment.handleWebhook({
      paymentId: newPayment.id,
      event: 'payment.refunded',
      payload: { amount: 100, reason: 'Webhook dispute' }
    });

    assert.ok(webhookResult.handled);
    assert.equal(webhookResult.payment.status, 'refunded');
    assert.equal(webhookResult.payment.refund.reason, 'Webhook dispute');
  });
});
