import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateProduct,
  validateProductUpdate,
  validateStockAdjustment,
} from '../src/validators/productValidator.js';

describe('Product Validator', () => {
  test('validates a complete product payload', () => {
    const valid = {
      name: 'Handcrafted Ceramic Mug',
      description: 'Stoneware mug with matte glaze',
      price: 650,
      comparePrice: 850,
      category: 'Kitchen',
      stock: 25,
      isActive: true,
      images: ['https://example.com/mug.jpg'],
    };
    const res = validateProduct(valid);
    assert.equal(res.success, true);
    assert.equal(res.data.name, 'Handcrafted Ceramic Mug');
    assert.equal(res.data.price, 650);
    assert.equal(res.data.stock, 25);
  });

  test('rejects product with negative price', () => {
    const invalid = {
      name: 'Faulty Product',
      price: -50,
      stock: 10,
    };
    const res = validateProduct(invalid);
    assert.equal(res.success, false);
    const errors = res.error.flatten().fieldErrors;
    assert.ok(errors.price);
  });

  test('rejects product with negative stock', () => {
    const invalid = {
      name: 'Negative Stock Item',
      price: 199,
      stock: -3,
    };
    const res = validateProduct(invalid);
    assert.equal(res.success, false);
    const errors = res.error.flatten().fieldErrors;
    assert.ok(errors.stock);
  });

  test('rejects product with decimal stock', () => {
    const invalid = {
      name: 'Fractional Stock Item',
      price: 199,
      stock: 4.5,
    };
    const res = validateProduct(invalid);
    assert.equal(res.success, false);
    const errors = res.error.flatten().fieldErrors;
    assert.ok(errors.stock);
  });

  test('rejects product with empty name', () => {
    const invalid = {
      name: '   ',
      price: 199,
    };
    const res = validateProduct(invalid);
    assert.equal(res.success, false);
    const errors = res.error.flatten().fieldErrors;
    assert.ok(errors.name);
  });

  test('coerces string numbers into valid numbers for price and stock', () => {
    const validWithStrings = {
      name: 'Coerced Numbers Item',
      price: '499.50',
      stock: '20',
    };
    const res = validateProduct(validWithStrings);
    assert.equal(res.success, true);
    assert.equal(typeof res.data.price, 'number');
    assert.equal(res.data.price, 499.50);
    assert.equal(typeof res.data.stock, 'number');
    assert.equal(res.data.stock, 20);
  });

  test('allows partial updates with validateProductUpdate', () => {
    const partial = { price: 799 };
    const res = validateProductUpdate(partial);
    assert.equal(res.success, true);
    assert.equal(res.data.price, 799);
  });

  test('rejects invalid image URLs in product creation', () => {
    const invalid = {
      name: 'Bad Image Item',
      price: 299,
      images: ['javascript:alert(1)', 'ftp://example.com/pic.jpg'],
    };
    const res = validateProduct(invalid);
    assert.equal(res.success, false);
    const errors = res.error.flatten().fieldErrors;
    assert.ok(errors.images);
  });

  test('validates stock adjustment payload correctly', () => {
    const validAdjustment = { stock: '45' };
    const res = validateStockAdjustment(validAdjustment);
    assert.equal(res.success, true);
    assert.equal(res.data.stock, 45);

    const negativeAdjustment = { stock: -5 };
    const resNegative = validateStockAdjustment(negativeAdjustment);
    assert.equal(resNegative.success, false);

    const decimalAdjustment = { stock: 12.34 };
    const resDecimal = validateStockAdjustment(decimalAdjustment);
    assert.equal(resDecimal.success, false);
  });

  test('rejects negative comparePrice', () => {
    const invalid = {
      name: 'Compare Price Test',
      price: 100,
      comparePrice: -20,
    };
    const res = validateProduct(invalid);
    assert.equal(res.success, false);
    const errors = res.error.flatten().fieldErrors;
    assert.ok(errors.comparePrice);
  });
});
