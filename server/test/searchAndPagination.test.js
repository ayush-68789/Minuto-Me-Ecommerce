import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { escapeRegex, parsePagination } from '../src/utils/queryHelper.js';

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
