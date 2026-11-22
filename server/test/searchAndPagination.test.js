import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  escapeRegex,
  parsePagination,
  buildProductFilter,
  parseSort,
} from '../src/utils/queryHelper.js';

describe('Search & Pagination Hardening', () => {
  describe('escapeRegex', () => {
    test('escapes special regex characters to prevent ReDoS', () => {
      const malicious = '.*+?^${}()|[]\\';
      const escaped = escapeRegex(malicious);
      assert.equal(escaped, '\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
    });

    test('handles normal string without alterations', () => {
      const normal = 'organic cotton shirt';
      assert.equal(escapeRegex(normal), 'organic cotton shirt');
    });

    test('truncates excessively long search queries to 100 characters', () => {
      const longInput = 'a'.repeat(250);
      assert.equal(escapeRegex(longInput).length, 100);
    });

    test('returns empty string for non-string input', () => {
      assert.equal(escapeRegex(null), '');
      assert.equal(escapeRegex(undefined), '');
      assert.equal(escapeRegex(123), '');
      assert.equal(escapeRegex({}), '');
    });
  });

  describe('parsePagination', () => {
    test('defaults missing page and limit', () => {
      const res = parsePagination({});
      assert.equal(res.page, 1);
      assert.equal(res.limit, 20);
      assert.equal(res.skip, 0);
    });

    test('handles NaN and non-numeric page/limit safely', () => {
      const res = parsePagination({ page: 'foo', limit: 'bar' });
      assert.equal(res.page, 1);
      assert.equal(res.limit, 20);
      assert.equal(res.skip, 0);
    });

    test('handles negative and zero numbers safely', () => {
      const res = parsePagination({ page: '-5', limit: '0' });
      assert.equal(res.page, 1);
      assert.equal(res.limit, 20);
      assert.equal(res.skip, 0);
    });

    test('clamps excessively large page and limit', () => {
      const res = parsePagination({ page: '99999', limit: '5000' }, 20, 100);
      assert.equal(res.page, 1000); // Max page
      assert.equal(res.limit, 100); // Max limit
      assert.equal(res.skip, (1000 - 1) * 100);
    });

    test('parses valid numeric strings correctly', () => {
      const res = parsePagination({ page: '3', limit: '25' });
      assert.equal(res.page, 3);
      assert.equal(res.limit, 25);
      assert.equal(res.skip, 50);
    });
  });

  describe('buildProductFilter', () => {
    test('scopes query strictly by storeId', () => {
      const filter = buildProductFilter({ storeId: 'store_123' });
      assert.equal(filter.store, 'store_123');
    });

    test('builds multi-field search conditions with escaped regex', () => {
      const filter = buildProductFilter({
        storeId: 'store_123',
        search: 'ceramic mug (blue)',
      });
      assert.equal(filter.store, 'store_123');
      assert.ok(Array.isArray(filter.$or));
      assert.equal(filter.$or.length, 3);
      assert.equal(filter.$or[0].name.$regex, 'ceramic mug \\(blue\\)');
      assert.equal(filter.$or[0].name.$options, 'i');
    });

    test('handles category filter while ignoring All', () => {
      const filter1 = buildProductFilter({ storeId: 'store_123', category: 'Kitchen' });
      assert.equal(filter1.category, 'Kitchen');

      const filter2 = buildProductFilter({ storeId: 'store_123', category: 'All' });
      assert.equal(filter2.category, undefined);
    });

    test('filters by active and inactive status', () => {
      const activeFilter = buildProductFilter({ storeId: 'store_123', status: 'active' });
      assert.equal(activeFilter.isActive, true);

      const inactiveFilter = buildProductFilter({ storeId: 'store_123', status: 'inactive' });
      assert.equal(inactiveFilter.isActive, false);

      const allFilter = buildProductFilter({ storeId: 'store_123', status: 'all' });
      assert.equal(allFilter.isActive, undefined);
    });

    test('filters by stock status (in_stock, low_stock, out_of_stock)', () => {
      const outOfStock = buildProductFilter({ storeId: 'store_123', stockStatus: 'out_of_stock' });
      assert.equal(outOfStock.stock, 0);

      const lowStock = buildProductFilter({ storeId: 'store_123', stockStatus: 'low_stock' });
      assert.deepEqual(lowStock.stock, { $gt: 0, $lte: 5 });

      const inStock = buildProductFilter({ storeId: 'store_123', stockStatus: 'in_stock' });
      assert.deepEqual(inStock.stock, { $gt: 0 });
    });
  });

  describe('parseSort', () => {
    const whitelist = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      newest: { createdAt: -1 },
    };

    test('returns matching sort option from whitelist', () => {
      const sort = parseSort('price_asc', whitelist);
      assert.deepEqual(sort, { price: 1 });
    });

    test('falls back to default sort when unknown or empty', () => {
      const fallback = parseSort('invalid_key', whitelist, { createdAt: -1 });
      assert.deepEqual(fallback, { createdAt: -1 });

      const fallbackEmpty = parseSort(null, whitelist, { createdAt: -1 });
      assert.deepEqual(fallbackEmpty, { createdAt: -1 });
    });
  });
});
