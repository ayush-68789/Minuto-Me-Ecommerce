import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { cartSchema, createOrderSchema, updateStatusSchema, parse } from '../src/validators/orderValidator.js';

describe('Order & Cart Zod Validators', () => {
  const validObjectId = '507f1f77bcf86cd799439011';

  test('accepts valid cart payload', () => {
    const payload = {
      storeSlug: 'my-shop',
      items: [{ productId: validObjectId, quantity: 2 }],
    };
    const parsed = parse(cartSchema, payload);
    assert.equal(parsed.storeSlug, 'my-shop');
    assert.equal(parsed.items.length, 1);
    assert.equal(parsed.items[0].quantity, 2);
  });

  test('rejects cart with empty items array', () => {
    assert.throws(
      () => parse(cartSchema, { storeSlug: 'my-shop', items: [] }),
      (err) => err.status === 400 && err.message.includes('Cart is empty')
    );
  });

  test('rejects cart item with 0 quantity', () => {
    assert.throws(
      () => parse(cartSchema, { storeSlug: 'my-shop', items: [{ productId: validObjectId, quantity: 0 }] }),
      (err) => err.status === 400
    );
  });

  test('rejects cart item with negative quantity', () => {
    assert.throws(
      () => parse(cartSchema, { storeSlug: 'my-shop', items: [{ productId: validObjectId, quantity: -5 }] }),
      (err) => err.status === 400
    );
  });

  test('rejects cart item with quantity exceeding max limit (99)', () => {
    assert.throws(
      () => parse(cartSchema, { storeSlug: 'my-shop', items: [{ productId: validObjectId, quantity: 150 }] }),
      (err) => err.status === 400
    );
  });

  test('rejects cart item with invalid MongoDB ObjectId', () => {
    assert.throws(
      () => parse(cartSchema, { storeSlug: 'my-shop', items: [{ productId: 'not-an-object-id', quantity: 1 }] }),
      (err) => err.status === 400 && err.message.includes('Invalid id')
    );
  });

  test('validates complete order with customer information and address', () => {
    const validOrder = {
      storeSlug: 'artisan-goods',
      items: [{ productId: validObjectId, quantity: 1 }],
      customerInfo: {
        name: 'Aarav Patel',
        email: 'aarav@example.com',
        phone: '+91 9876543210',
      },
      shippingAddress: {
        line1: '123 MG Road',
        city: 'Bangalore',
        state: 'Karnataka',
        postalCode: '560001',
      },
      quoteHash: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
      idempotencyKey: 'idem_test_12345678',
    };
    const parsed = parse(createOrderSchema, validOrder);
    assert.equal(parsed.customerInfo.name, 'Aarav Patel');
    assert.equal(parsed.customerInfo.email, 'aarav@example.com');
    assert.equal(parsed.shippingAddress.country, 'India'); // Default
  });

  test('rejects order with invalid email format', () => {
    const invalidOrder = {
      storeSlug: 'artisan-goods',
      items: [{ productId: validObjectId, quantity: 1 }],
      customerInfo: {
        name: 'Aarav Patel',
        email: 'not-an-email',
        phone: '+91 9876543210',
      },
      shippingAddress: {
        line1: '123 MG Road',
        city: 'Bangalore',
        state: 'Karnataka',
        postalCode: '560001',
      },
      quoteHash: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
      idempotencyKey: 'idem_test_12345678',
    };
    assert.throws(
      () => parse(createOrderSchema, invalidOrder),
      (err) => err.status === 400
    );
  });

  test('rejects order with missing quoteHash', () => {
    const withoutQuote = {
      storeSlug: 'artisan-goods',
      items: [{ productId: validObjectId, quantity: 1 }],
      customerInfo: { name: 'Aarav', email: 'aarav@test.com', phone: '+91 9876543210' },
      shippingAddress: { line1: '123 Road', city: 'Bangalore', state: 'KA', postalCode: '560001' },
      idempotencyKey: 'idem_test_12345678',
    };
    assert.throws(
      () => parse(createOrderSchema, withoutQuote),
      (err) => err.status === 400 && err.message.includes('Quote hash is required')
    );
  });

  test('rejects order with missing idempotencyKey', () => {
    const withoutKey = {
      storeSlug: 'artisan-goods',
      items: [{ productId: validObjectId, quantity: 1 }],
      customerInfo: { name: 'Aarav', email: 'aarav@test.com', phone: '+91 9876543210' },
      shippingAddress: { line1: '123 Road', city: 'Bangalore', state: 'KA', postalCode: '560001' },
      quoteHash: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
    };
    assert.throws(
      () => parse(createOrderSchema, withoutKey),
      (err) => err.status === 400 && err.message.includes('Idempotency key is required')
    );
  });

  test('validates order status update transitions', () => {
    const validStatus = parse(updateStatusSchema, { status: 'shipped' });
    assert.equal(validStatus.status, 'shipped');

    assert.throws(
      () => parse(updateStatusSchema, { status: 'flying_to_mars' }),
      (err) => err.status === 400
    );
  });
});
