import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import calcTotals from '../src/utils/calcTotals.js';

describe('calcTotals Utility', () => {
  test('calculates subtotal and total correctly for multiple lines', () => {
    const items = [
      { price: 499, quantity: 2 },
      { price: 1200, quantity: 1 },
    ];
    const result = calcTotals(items, 50);
    assert.equal(result.subtotal, 2198);
    assert.equal(result.shippingFee, 50);
    assert.equal(result.total, 2248);
  });

  test('defaults shippingFee to 0 when omitted', () => {
    const items = [{ price: 250, quantity: 4 }];
    const result = calcTotals(items);
    assert.equal(result.subtotal, 1000);
    assert.equal(result.shippingFee, 0);
    assert.equal(result.total, 1000);
  });

  test('handles empty cart gracefully', () => {
    const result = calcTotals([]);
    assert.equal(result.subtotal, 0);
    assert.equal(result.shippingFee, 0);
    assert.equal(result.total, 0);
  });

  test('prevents negative totals even if items is empty and fee is 0', () => {
    const result = calcTotals([], 0);
    assert.ok(result.total >= 0);
  });
});
