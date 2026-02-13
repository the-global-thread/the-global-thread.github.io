import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getMediaUrl,
  getSizeClass,
  isPicXUrl,
  normalizeUrl,
} from '../js/feed/feed-utils.js';

test('normalizeUrl handles protocol-relative and pic.x.com shorthand', () => {
  assert.equal(normalizeUrl('//cdn.example.com/x.jpg'), 'https://cdn.example.com/x.jpg');
  assert.equal(normalizeUrl('pic.x.com/abc123'), 'https://pic.x.com/abc123');
  assert.equal(normalizeUrl('https://example.com/a.jpg'), 'https://example.com/a.jpg');
});

test('isPicXUrl detects pic.x.com URLs', () => {
  assert.equal(isPicXUrl('https://pic.x.com/abc123'), true);
  assert.equal(isPicXUrl('http://pic.x.com/z'), true);
  assert.equal(isPicXUrl('https://example.com/x'), false);
});

test('getMediaUrl prioritizes item.image and falls back to pic.x.com link', () => {
  assert.equal(
    getMediaUrl({ image: '//img.cdn.com/i.jpg', link: 'https://pic.x.com/abc' }),
    'https://img.cdn.com/i.jpg',
  );

  assert.equal(
    getMediaUrl({ image: '', link: 'pic.x.com/abc' }),
    'https://pic.x.com/abc',
  );

  assert.equal(getMediaUrl({ image: '', link: 'https://example.com' }), '');
});

test('getSizeClass returns only allowed variants', () => {
  const variants = new Set(['', 'size-large', 'size-tall']);
  const value = getSizeClass({ link: 'https://x.com/1', date: '2026-01-01T00:00:00Z', summary: 'hello' }, true);
  assert.equal(variants.has(value), true);
  assert.equal(getSizeClass({}, false), '');
});
