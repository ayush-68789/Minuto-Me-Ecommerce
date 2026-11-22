import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import calcTotals from '../src/utils/calcTotals.js';

describe('Cart Pricing & Deduplication Logic', () => {
  // Pure function testing the logic used in priceCart
  function simulatePriceCart(mockDbProducts, requestedItems) {
    const quantities = new Map();
    for (const { productId, quantity } of requestedItems) {
      quantities.set(productId, (quantities.get(productId) || 0) + quantity);
    }

    const byId = new Map(mockDbProducts.map((p) => [p._id.toString(), p]));
    const lines = [];
    const issues = [];

    for (const [productId, quantity] of quantities) {
      const product = byId.get(productId);
      if (!product || !product.isActive) {
        issues.push({ productId, message: 'This product is no longer available' });
        continue;
      }
      if (product.stock < quantity) {
        issues.push({ productId, message: `Only ${product.stock} left in stock`, available: product.stock });
        continue;
      }
      lines.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity,
      });
    }

    return { lines, issues, ...calcTotals(lines) };
  }

  test('merges duplicate product lines in cart', () => {
    const mockDbProducts = [
      { _id: 'prod1', name: 'Cotton T-Shirt', price: 499, stock: 10, isActive: true },
    ];
    const items = [
      { productId: 'prod1', quantity: 2 },
      { productId: 'prod1', quantity: 3 },
    ];
    const result = simulatePriceCart(mockDbProducts, items);
    assert.equal(result.lines.length, 1);
    assert.equal(result.lines[0].quantity, 5);
    assert.equal(result.subtotal, 499 * 5);
    assert.equal(result.issues.length, 0);
  });

  test('flags inactive products as unavailable', () => {
    const mockDbProducts = [
      { _id: 'prod1', name: 'Discontinued Item', price: 999, stock: 10, isActive: false },
    ];
    const items = [{ productId: 'prod1', quantity: 1 }];
    const result = simulatePriceCart(mockDbProducts, items);
    assert.equal(result.lines.length, 0);
    assert.equal(result.issues.length, 1);
    assert.equal(result.issues[0].message, 'This product is no longer available');
  });

  test('flags products that were deleted from DB', () => {
    const mockDbProducts = []; // Deleted
    const items = [{ productId: 'deleted_prod', quantity: 1 }];
    const result = simulatePriceCart(mockDbProducts, items);
    assert.equal(result.lines.length, 0);
    assert.equal(result.issues.length, 1);
    assert.equal(result.issues[0].message, 'This product is no longer available');
  });

  test('flags products with insufficient stock', () => {
    const mockDbProducts = [
      { _id: 'prod1', name: 'Limited Edition Watch', price: 4500, stock: 2, isActive: true },
    ];
    const items = [{ productId: 'prod1', quantity: 5 }];
    const result = simulatePriceCart(mockDbProducts, items);
    assert.equal(result.lines.length, 0);
    assert.equal(result.issues.length, 1);
    assert.equal(result.issues[0].available, 2);
    assert.equal(result.issues[0].message, 'Only 2 left in stock');
  });

  test('recalculates subtotal strictly from DB prices, ignoring client manipulated price', () => {
    const mockDbProducts = [
      { _id: 'prod1', name: 'Leather Jacket', price: 3999, stock: 5, isActive: true },
    ];
    // Client attempts to send price: 1
    const items = [{ productId: 'prod1', quantity: 1, price: 1 }];
    const result = simulatePriceCart(mockDbProducts, items);
    assert.equal(result.lines[0].price, 3999);
    assert.equal(result.subtotal, 3999);
    assert.notEqual(result.subtotal, 1);
  });
});
