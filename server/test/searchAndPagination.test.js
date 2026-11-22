import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { escapeRegex, parsePagination } from '../src/utils/queryHelper.js';
import { buildCatalogQuery, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, SORT_MAP } from '../src/controllers/catalogController.js';

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
      assert.equal(res.limit, 100);  // Max limit
      assert.equal(res.skip, (1000 - 1) * 100);
    });

    test('parses valid numeric strings correctly', () => {
      const res = parsePagination({ page: '3', limit: '25' });
      assert.equal(res.page, 3);
      assert.equal(res.limit, 25);
      assert.equal(res.skip, 50);
    });
  });
});

describe('Catalog query builder', () => {
  const STORE = 'store-1';

  test('always scopes to the store and active products', () => {
    const q = buildCatalogQuery({}, STORE);
    assert.deepEqual(q.filter, { store: STORE, isActive: true });
    assert.deepEqual(q.sort, SORT_MAP.newest);
    assert.equal(q.page, 1);
    assert.equal(q.limit, DEFAULT_PAGE_SIZE);
  });

  test('escapes search text and matches name, description and category', () => {
    const q = buildCatalogQuery({ search: '  (shoes)+  ' }, STORE);
    assert.equal(q.filter.$or.length, 3);
    assert.equal(q.filter.$or[0].name.$regex, '\\(shoes\\)\\+');
    assert.equal(q.filter.$or[0].name.$options, 'i');
  });

  test('accepts q as an alias for search and ignores non-string values', () => {
    assert.equal(buildCatalogQuery({ q: 'bag' }, STORE).search, 'bag');
    assert.equal(buildCatalogQuery({ search: { $ne: '' } }, STORE).filter.$or, undefined);
  });

  test('uses the first value when a param is repeated', () => {
    const q = buildCatalogQuery({ category: ['Shoes', 'Bags'] }, STORE);
    assert.equal(q.filter.category, 'Shoes');
  });

  test('treats "All" as no category filter', () => {
    assert.equal(buildCatalogQuery({ category: 'All' }, STORE).filter.category, undefined);
  });

  test('builds a price range and swaps reversed bounds', () => {
    assert.deepEqual(buildCatalogQuery({ minPrice: '100', maxPrice: '500' }, STORE).filter.price, { $gte: 100, $lte: 500 });
    assert.deepEqual(buildCatalogQuery({ minPrice: '500', maxPrice: '100' }, STORE).filter.price, { $gte: 100, $lte: 500 });
  });

  test('ignores empty, negative and non-numeric prices', () => {
    assert.equal(buildCatalogQuery({ minPrice: '', maxPrice: '' }, STORE).filter.price, undefined);
    assert.equal(buildCatalogQuery({ minPrice: '-5', maxPrice: 'abc' }, STORE).filter.price, undefined);
  });

  test('in-stock filter only applies for "true"', () => {
    assert.deepEqual(buildCatalogQuery({ inStock: 'true' }, STORE).filter.stock, { $gt: 0 });
    assert.equal(buildCatalogQuery({ inStock: '1' }, STORE).filter.stock, undefined);
  });

  test('falls back to newest for unknown or prototype sort keys', () => {
    assert.equal(buildCatalogQuery({ sort: 'price_asc' }, STORE).sortKey, 'price_asc');
    assert.equal(buildCatalogQuery({ sort: 'hacker' }, STORE).sortKey, 'newest');
    assert.deepEqual(buildCatalogQuery({ sort: 'constructor' }, STORE).sort, SORT_MAP.newest);
  });

  test('clamps the page size to the catalog maximum', () => {
    const q = buildCatalogQuery({ page: '3', limit: '500' }, STORE);
    assert.equal(q.limit, MAX_PAGE_SIZE);
    assert.equal(q.skip, 2 * MAX_PAGE_SIZE);
  });
});
