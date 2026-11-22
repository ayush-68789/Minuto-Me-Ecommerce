import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Durable Inventory Reservation & Recovery State Machine', () => {
  // Pure state machine simulation mirroring InventoryReservation logic
  class MockReservationLedger {
    constructor() {
      this.reservations = new Map();
      this.stockDb = new Map();
    }

    setProductStock(id, stock) {
      this.stockDb.set(id, stock);
    }

    reserve(id, storeId, lines) {
      // Check stock
      for (const line of lines) {
        const available = this.stockDb.get(line.product) || 0;
        if (available < line.quantity) {
          throw new Error(`Out of stock for ${line.name}`);
        }
      }
      // Decrement stock
      for (const line of lines) {
        this.stockDb.set(line.product, this.stockDb.get(line.product) - line.quantity);
      }
      const record = { id, storeId, lines, status: 'reserved', createdAt: Date.now() };
      this.reservations.set(id, record);
      return record;
    }

    complete(id, orderId) {
      const rec = this.reservations.get(id);
      if (rec && rec.status === 'reserved') {
        rec.status = 'completed';
        rec.orderId = orderId;
      }
    }

    compensate(id) {
      const rec = this.reservations.get(id);
      if (rec && rec.status === 'reserved') {
        rec.status = 'compensated';
        // Restock
        for (const line of rec.lines) {
          this.stockDb.set(line.product, (this.stockDb.get(line.product) || 0) + line.quantity);
        }
        return true;
      }
      return false; // Already compensated or completed; avoids double-restock
    }
  }

  test('successfully reserves stock and marks completed on order success', () => {
    const ledger = new MockReservationLedger();
    ledger.setProductStock('prod_1', 10);

    const lines = [{ product: 'prod_1', name: 'Item', quantity: 2 }];
    ledger.reserve('res_1', 'store_1', lines);

    assert.equal(ledger.stockDb.get('prod_1'), 8);
    ledger.complete('res_1', 'order_999');
    assert.equal(ledger.reservations.get('res_1').status, 'completed');
  });

  test('compensates stock and does not double-restock when recovery is called multiple times', () => {
    const ledger = new MockReservationLedger();
    ledger.setProductStock('prod_1', 10);

    const lines = [{ product: 'prod_1', name: 'Item', quantity: 3 }];
    ledger.reserve('res_2', 'store_1', lines);
    assert.equal(ledger.stockDb.get('prod_1'), 7);

    // Simulate crash after reserve: recovery compensates
    const firstCompensate = ledger.compensate('res_2');
    assert.equal(firstCompensate, true);
    assert.equal(ledger.stockDb.get('prod_1'), 10); // Restored
    assert.equal(ledger.reservations.get('res_2').status, 'compensated');

    // Run recovery again on same reservation -> idempotent, must NOT restore again
    const secondCompensate = ledger.compensate('res_2');
    assert.equal(secondCompensate, false);
    assert.equal(ledger.stockDb.get('prod_1'), 10); // Still 10, no double-restock!
  });

  test('cannot compensate an already completed order', () => {
    const ledger = new MockReservationLedger();
    ledger.setProductStock('prod_1', 5);

    ledger.reserve('res_3', 'store_1', [{ product: 'prod_1', name: 'Item', quantity: 1 }]);
    ledger.complete('res_3', 'ord_valid');

    const compensated = ledger.compensate('res_3');
    assert.equal(compensated, false);
    assert.equal(ledger.stockDb.get('prod_1'), 4); // Remains decremented
  });
});
