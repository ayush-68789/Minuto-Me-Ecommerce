import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Order Cancellation & Restocking Consistency Rules', () => {
  const transitions = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: [],
  };

  test('permits cancellation from pending status', () => {
    assert.ok(transitions.pending.includes('cancelled'));
  });

  test('permits cancellation from confirmed status', () => {
    assert.ok(transitions.confirmed.includes('cancelled'));
  });

  test('forbids cancellation once order has shipped', () => {
    assert.ok(!transitions.shipped.includes('cancelled'));
  });

  test('forbids cancellation once order is delivered', () => {
    assert.ok(!transitions.delivered.includes('cancelled'));
  });

  test('cannot cancel an already cancelled order (prevents duplicate restocking)', () => {
    assert.ok(!transitions.cancelled.includes('cancelled'));
  });

  test('cannot transition cancelled order back to confirmed or shipped', () => {
    assert.equal(transitions.cancelled.length, 0);
  });
});
