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

const {
  dedupeItemsByLink,
  formatRelativeTime,
  getMedia,
  getMediaUrl,
  getMeta,
  getSizeClass,
  getSummaryText,
  isPicXUrl,
  normalizeUrl,
} = context.window.NewsApp.feedUtils;

test('dedupeItemsByLink removes duplicates and skips existing keys', () => {
  const existing = new Set(['https://x.com/existing/status/1']);
  const items = [
    { link: 'https://x.com/a/status/1', summary: 'first' },
    { link: 'https://x.com/a/status/1', summary: 'duplicate' },
    { link: 'https://x.com/existing/status/1', summary: 'already rendered' },
    { link: 'https://x.com/b/status/2', summary: 'second' },
  ];

  const deduped = dedupeItemsByLink(items, existing);
  assert.equal(deduped.length, 2);
  assert.equal(deduped[0].link, 'https://x.com/a/status/1');
  assert.equal(deduped[1].link, 'https://x.com/b/status/2');
});

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

test('getMediaUrl does not use pic.x.com URL embedded in summary', () => {
  const mediaUrl = getMediaUrl({
    image: '',
    link: 'https://x.com/foo/status/1',
    summary: 'Some update pic.x.com/uwe1b8w4qb',
  });

  assert.equal(mediaUrl, '');
});

test('getMedia prefers video over image when both exist', () => {
  const media = getMedia({
    video: 'https://video.twimg.com/ext_tw_video/1/pu/vid/avc1/720x1280/test.mp4',
    image: 'https://pbs.twimg.com/media/test.jpg',
  });

  assert.equal(media.type, 'video');
  assert.equal(
    media.url,
    'https://video.twimg.com/ext_tw_video/1/pu/vid/avc1/720x1280/test.mp4',
  );
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

test('getSummaryText removes embedded pic.x.com URL', () => {
  const summary = getSummaryText({
    summary:
      'Foreign Minister Abbas Araghchi was scheduled to speak at the Council but his name was removed pic.x.com/l0aKxeXHhK',
  });

  assert.equal(summary.includes('pic.x.com/l0aKxeXHhK'), false);
  assert.equal(
    summary,
    'Foreign Minister Abbas Araghchi was scheduled to speak at the Council but his name was removed',
  );
});

test('getSummaryText prefers translation over summary', () => {
  const summary = getSummaryText({
    summary: 'English summary',
    translation: 'خلاصه فارسی',
  });

  assert.equal(summary, 'خلاصه فارسی');
});
