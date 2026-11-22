import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeTheme, sanitizeSocial, isEmail } from '../src/validators/storeValidator.js';

describe('Store Validator', () => {
  test('isEmail correctly identifies valid email addresses', () => {
    assert.equal(isEmail('merchant@shop.com'), true);
    assert.equal(isEmail('contact.us+tag@domain.co.in'), true);
    assert.equal(isEmail(''), false);
    assert.equal(isEmail('no-at-sign.com'), false);
    assert.equal(isEmail('@missing-local.com'), false);
    assert.equal(isEmail('spaces in@domain.com'), false);
  });

  test('sanitizeSocial removes untrusted keys and caps string lengths', () => {
    const raw = {
      instagram: 'https://instagram.com/mybrand',
      maliciousKey: '<script>alert("hack")</script>',
      twitter: 'https://x.com/mybrand',
    };
    const cleaned = sanitizeSocial(raw);
    assert.equal(cleaned.instagram, 'https://instagram.com/mybrand');
    assert.equal(cleaned.twitter, 'https://x.com/mybrand');
    assert.equal(cleaned.maliciousKey, undefined);
  });

  test('sanitizeTheme clamps columns and sanitizes content', () => {
    const raw = {
      preset: 'midnight',
      gridColumns: 99, // Exceeds max 5
      mobileColumns: 0, // Below min 1
      stickyNav: true,
      content: {
        heroTitle: 'Welcome to our store',
        aboutText: 'A'.repeat(2000), // Should be capped at 1200
      },
    };
    const cleaned = sanitizeTheme(raw);
    assert.equal(cleaned.preset, 'midnight');
    assert.equal(cleaned.gridColumns, 5); // Clamped
    assert.equal(cleaned.mobileColumns, 1); // Clamped
    assert.equal(cleaned.stickyNav, true);
    assert.equal(cleaned.content.aboutText.length, 1200); // Capped
  });
});
