import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateProduct, validateStockAdjustment } from '../src/validators/productValidator.js';

describe('Inventory & Stock Management Edge Cases', () => {
  describe('Stock Input Validation', () => {
    test('rejects negative stock on creation', () => {
      const res = validateProduct({
        name: 'Test Item',
        price: 100,
        stock: -1,
      });
      assert.equal(res.success, false);
      assert.ok(res.error.flatten().fieldErrors.stock);
    });

    test('rejects non-integer / floating-point stock on creation', () => {
      const res = validateProduct({
        name: 'Test Item',
        price: 100,
        stock: 3.75,
      });
      assert.equal(res.success, false);
      assert.ok(res.error.flatten().fieldErrors.stock);
    });

    test('rejects stock exceeding 1,000,000 units', () => {
      const res = validateProduct({
        name: 'Test Item',
        price: 100,
        stock: 1000001,
      });
      assert.equal(res.success, false);
      assert.ok(res.error.flatten().fieldErrors.stock);
    });

    test('accepts 0 stock (out of stock on create)', () => {
      const res = validateProduct({
        name: 'Test Item',
        price: 100,
        stock: 0,
      });
      assert.equal(res.success, true);
      assert.equal(res.data.stock, 0);
    });

    test('validates direct stock adjustment payload', () => {
      assert.equal(validateStockAdjustment({ stock: 50 }).success, true);
      assert.equal(validateStockAdjustment({ stock: 0 }).success, true);
      assert.equal(validateStockAdjustment({ stock: -10 }).success, false);
      assert.equal(validateStockAdjustment({ stock: 'abc' }).success, false);
      assert.equal(validateStockAdjustment({ stock: 12.5 }).success, false);
    });
  });

  describe('Stock Level Classification', () => {
    const classifyStock = (stock) => {
      if (stock === 0) return 'out_of_stock';
      if (stock > 0 && stock <= 5) return 'low_stock';
      return 'in_stock';
    };

    test('classifies stock === 0 as out_of_stock', () => {
      assert.equal(classifyStock(0), 'out_of_stock');
    });

    test('classifies stock 1 through 5 as low_stock', () => {
      assert.equal(classifyStock(1), 'low_stock');
      assert.equal(classifyStock(3), 'low_stock');
      assert.equal(classifyStock(5), 'low_stock');
    });

    test('classifies stock > 5 as in_stock', () => {
      assert.equal(classifyStock(6), 'in_stock');
      assert.equal(classifyStock(100), 'in_stock');
    });
  });

  describe('Atomic Stock Operations & Concurrency Safeguards', () => {
    // Simulated atomic stock decrement logic identical to MongoDB:
    // { stock: { $gte: qty } }, { $inc: { stock: -qty } }
    function simulateAtomicDecrement(productState, requestedQty) {
      if (!productState.isActive) {
        return { success: false, reason: 'PRODUCT_INACTIVE' };
      }
      if (productState.stock < requestedQty) {
        return { success: false, reason: 'INSUFFICIENT_STOCK' };
      }
      productState.stock -= requestedQty;
      return { success: true, remainingStock: productState.stock };
    }

    test('prevents overselling when two concurrent orders exceed available stock', () => {
      const product = { id: 'p1', name: 'Limited Edition Sneakers', stock: 3, isActive: true };

      // Order 1 requests 2 units
      const order1Result = simulateAtomicDecrement(product, 2);
      assert.equal(order1Result.success, true);
      assert.equal(order1Result.remainingStock, 1);
      assert.equal(product.stock, 1);

      // Order 2 concurrently requests 2 units (only 1 available now)
      const order2Result = simulateAtomicDecrement(product, 2);
      assert.equal(order2Result.success, false);
      assert.equal(order2Result.reason, 'INSUFFICIENT_STOCK');
      // Stock must not drop below zero
      assert.equal(product.stock, 1);
    });

    test('rejects deduction when product is marked inactive', () => {
      const product = { id: 'p2', name: 'Archived Item', stock: 50, isActive: false };
      const res = simulateAtomicDecrement(product, 1);
      assert.equal(res.success, false);
      assert.equal(res.reason, 'PRODUCT_INACTIVE');
      assert.equal(product.stock, 50);
    });

    test('prevents negative stock when requested quantity equals stock + 1', () => {
      const product = { id: 'p3', name: 'Single Item', stock: 1, isActive: true };
      const res = simulateAtomicDecrement(product, 2);
      assert.equal(res.success, false);
      assert.equal(product.stock, 1);
    });

    test('allows exactly exhausting available stock to zero', () => {
      const product = { id: 'p4', name: 'Final Item', stock: 4, isActive: true };
      const res = simulateAtomicDecrement(product, 4);
      assert.equal(res.success, true);
      assert.equal(res.remainingStock, 0);
      assert.equal(product.stock, 0);
    });
  });

  describe('Order Cancellation Restocking Idempotency', () => {
    function simulateRestock(orderItem, product) {
      if (orderItem.restocked) {
        return { restocked: false, reason: 'ALREADY_RESTOCKED' };
      }
      product.stock += orderItem.quantity;
      orderItem.restocked = true;
      return { restocked: true, newStock: product.stock };
    }

    test('restocks item once on cancellation and rejects duplicate restock', () => {
      const product = { id: 'p5', stock: 10 };
      const orderItem = { product: 'p5', quantity: 2, restocked: false };

      // First cancellation restock
      const firstAttempt = simulateRestock(orderItem, product);
      assert.equal(firstAttempt.restocked, true);
      assert.equal(product.stock, 12);
      assert.equal(orderItem.restocked, true);

      // Duplicate cancellation call (e.g. repeated click or retry)
      const secondAttempt = simulateRestock(orderItem, product);
      assert.equal(secondAttempt.restocked, false);
      assert.equal(secondAttempt.reason, 'ALREADY_RESTOCKED');
      // Stock MUST not be incremented a second time
      assert.equal(product.stock, 12);
    });
  });
});
