import test from 'node:test';
import assert from 'node:assert/strict';

import worker from '../src/index.js';

test('normalizeItems moves bare pic.x.com URL from summary to image and removes it from summary', async () => {
  const sampleFeed = {
    generatedAt: '2026-02-13T20:23:52.638Z',
    source: 'https://rss.app/feeds/v1.1/Tmk5XvirrYE1vBco.json',
    count: 25,
    items: [
      {
        title: 'Macron: I will not speak about Iran [at the Munich Security Conference] pic.x.com/PVqGjZtyA9',
        link: 'https://x.com/Osint613/status/2022401305525047579',
        date: '2026-02-13T20:03:40.000Z',
        author: '@Osint613',
        summary: 'Macron: I will not speak about Iran [at the Munich Security Conference] pic.x.com/PVqGjZtyA9',
        image: null,
      },
    ],
  };

  const originalFetch = globalThis.fetch;
  const feedCache = {
    async get() {
      return null;
    },
    async put() {
      return undefined;
    },
  };

  globalThis.fetch = async () => {
    return new Response(JSON.stringify(sampleFeed), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const request = new Request('https://example.com/api/feed?refresh=1');
    const response = await worker.fetch(request, {
      FEED_URL: 'https://rss.app/feeds/v1.1/Tmk5XvirrYE1vBco.json',
      FEED_CACHE: feedCache,
      CACHE_TTL_SECONDS: '600',
    });

    assert.equal(response.status, 200);

    const payload = await response.json();
    assert.equal(Array.isArray(payload.items), true);
    assert.equal(payload.items.length, 1);

    const [item] = payload.items;
    assert.equal(item.image, 'https://pic.x.com/PVqGjZtyA9');
    assert.equal(item.summary.includes('pic.x.com/PVqGjZtyA9'), false);
    assert.equal(
      item.summary,
      'Macron: I will not speak about Iran [at the Munich Security Conference]',
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
