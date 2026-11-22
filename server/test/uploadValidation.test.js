import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateMagicNumbers, detectImageMime, ALLOWED_MIME_TYPES, ALLOWED_EXTENSIONS } from '../src/middleware/upload.js';

describe('Upload Validation & Security', () => {
  test('validates JPEG magic number (FF D8 FF)', () => {
    const validJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    assert.equal(validateMagicNumbers(validJpeg), true);
    assert.equal(detectImageMime(validJpeg), 'image/jpeg');
  });

  test('validates PNG magic number (89 50 4E 47)', () => {
    const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
    assert.equal(validateMagicNumbers(validPng), true);
    assert.equal(detectImageMime(validPng), 'image/png');
  });

  test('validates GIF magic number (47 49 46 38)', () => {
    const validGif = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
    assert.equal(validateMagicNumbers(validGif), true);
  });

  test('validates WEBP magic numbers (RIFF .... WEBP)', () => {
    const validWebp = Buffer.from([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x00, 0x00, 0x00, 0x00,
      0x57, 0x45, 0x42, 0x50, // WEBP
    ]);
    assert.equal(validateMagicNumbers(validWebp), true);
  });

  test('rejects deceptive file with spoofed extension (e.g. PHP script or HTML file)', () => {
    const fakeImage = Buffer.from('<?php echo "evil"; ?>');
    assert.equal(validateMagicNumbers(fakeImage), false);
  });

  test('rejects empty buffer or buffer shorter than 4 bytes', () => {
    assert.equal(validateMagicNumbers(Buffer.from([])), false);
    assert.equal(validateMagicNumbers(Buffer.from([0x01, 0x02])), false);
    assert.equal(validateMagicNumbers(null), false);
  });

  test('whitelists only secure image MIME types and extensions', () => {
    assert.ok(ALLOWED_MIME_TYPES.has('image/jpeg'));
    assert.ok(ALLOWED_MIME_TYPES.has('image/png'));
    assert.ok(ALLOWED_MIME_TYPES.has('image/webp'));
    assert.ok(!ALLOWED_MIME_TYPES.has('text/html'));
    assert.ok(!ALLOWED_MIME_TYPES.has('application/javascript'));
    assert.ok(!ALLOWED_MIME_TYPES.has('image/svg+xml')); // SVG excluded to prevent stored XSS

    assert.ok(ALLOWED_EXTENSIONS.has('.jpg'));
    assert.ok(ALLOWED_EXTENSIONS.has('.png'));
    assert.ok(!ALLOWED_EXTENSIONS.has('.exe'));
    assert.ok(!ALLOWED_EXTENSIONS.has('.svg'));
  });
});
