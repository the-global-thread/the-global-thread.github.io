import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../js/feed/feed-utils.js', import.meta.url), 'utf8');
const context = {
  window: {},
  URL,
  Date,
};
context.window.NewsApp = {};
vm.createContext(context);
vm.runInContext(source, context);

const { formatRelativeTime, getMediaUrl, getMeta, getSizeClass, isPicXUrl, normalizeUrl } = context.window.NewsApp.feedUtils;

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

test('getMeta returns author and relative time text', () => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const meta = getMeta({ author: 'x.com', date: oneHourAgo });

  assert.equal(meta.authorText, 'x.com');
  assert.equal(/^[0-9]+h$/.test(meta.timeText), true);
});

test('formatRelativeTime handles recent timestamps', () => {
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
  assert.equal(formatRelativeTime(twoMinutesAgo), '2m');
});
