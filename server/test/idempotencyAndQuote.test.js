import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';

describe('Idempotency & Quote Verification Logic', () => {
  function computeQuoteHash(storeId, lines, total) {
    const quoteData = JSON.stringify({
      storeId: storeId.toString(),
      items: lines.map((l) => ({ p: l.product.toString(), price: l.price, qty: l.quantity })),
      total,
    });
    return crypto.createHash('sha256').update(quoteData).digest('hex').slice(0, 32);
  }

  function computeRequestHash(input) {
    return crypto
      .createHash('sha256')
      .update(
        JSON.stringify({
          storeSlug: input.storeSlug,
          items: input.items,
          customerInfo: input.customerInfo,
          shippingAddress: input.shippingAddress,
        })
      )
      .digest('hex');
  }

  test('generates consistent quote hashes for identical quotes', () => {
    const lines = [{ product: 'prod_1', price: 500, quantity: 2 }];
    const hash1 = computeQuoteHash('store_123', lines, 1000);
    const hash2 = computeQuoteHash('store_123', lines, 1000);
    assert.equal(hash1, hash2);
    assert.equal(hash1.length, 32);
  });

  test('detects price changes via quote hash mismatch', () => {
    const linesInitial = [{ product: 'prod_1', price: 500, quantity: 2 }];
    const hashInitial = computeQuoteHash('store_123', linesInitial, 1000);

    // Price updated in DB to 600
    const linesUpdated = [{ product: 'prod_1', price: 600, quantity: 2 }];
    const hashUpdated = computeQuoteHash('store_123', linesUpdated, 1200);

    assert.notEqual(hashInitial, hashUpdated);
  });

  test('request hash changes when checkout payload is altered', () => {
    const req1 = {
      storeSlug: 'store-a',
      items: [{ productId: '507f1f77bcf86cd799439011', quantity: 1 }],
      customerInfo: { email: 'user@test.com' },
      shippingAddress: { city: 'Delhi' },
    };
    const req2 = {
      ...req1,
      customerInfo: { email: 'different@test.com' },
    };

    const hash1 = computeRequestHash(req1);
    const hash2 = computeRequestHash(req2);
    assert.notEqual(hash1, hash2);
  });

  test('idempotency record simulation: detects mismatched payload on key reuse', () => {
    const key = 'idem_xyz123';
    const storeId = 'store_abc';
    const originalPayload = {
      storeSlug: 'store-a',
      items: [{ productId: '507f1f77bcf86cd799439011', quantity: 1 }],
    };
    const record = {
      key,
      storeId,
      requestHash: computeRequestHash(originalPayload),
      status: 'completed',
      response: { orderId: 'ord_123', status: 'pending' },
    };

    // Client retries with EXACT same payload -> returns saved response
    const retryPayload = { ...originalPayload };
    assert.equal(computeRequestHash(retryPayload), record.requestHash);

    // Client tries to reuse key with DIFFERENT payload -> detects mismatch
    const alteredPayload = { ...originalPayload, storeSlug: 'store-b' };
    assert.notEqual(computeRequestHash(alteredPayload), record.requestHash);
  });
});
