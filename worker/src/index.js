const DEFAULT_FEED_URL = "https://rss.app/feeds/v1.1/Tmk5XvirrYE1vBco.json";
const DEFAULT_TTL_SECONDS = 300;
const CACHE_KEY = "feed:irannews";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (url.pathname === "/api/health") {
      return jsonResponse({ ok: true, time: new Date().toISOString() }, 200);
    }

    if (url.pathname !== "/api/feed") {
      return jsonResponse({ error: "not_found" }, 404);
    }

    const feedUrl = env.FEED_URL || DEFAULT_FEED_URL;
    const ttlSeconds = parseInt(env.CACHE_TTL_SECONDS || DEFAULT_TTL_SECONDS, 10);
    const forceRefresh = url.searchParams.get("refresh") === "1";

    if (!forceRefresh) {
      const cached = await env.FEED_CACHE.get(CACHE_KEY);
      if (cached) {
        return jsonResponse(JSON.parse(cached), 200, { "Cache-Control": `public, max-age=${ttlSeconds}` });
      }
    }

    const feedResponse = await fetch(feedUrl, {
      headers: {
        "User-Agent": "IranNews/1.0",
        "Accept": "application/json",
      },
      cf: { cacheTtl: 60, cacheEverything: true },
    });

    if (!feedResponse.ok) {
      return jsonResponse({ error: "feed_fetch_failed", status: feedResponse.status }, 502);
    }

    const feedJson = await feedResponse.json();
    const items = normalizeItems(feedJson);

    const payload = {
      generatedAt: new Date().toISOString(),
      source: feedUrl,
      count: items.length,
      items,
    };

    await env.FEED_CACHE.put(CACHE_KEY, JSON.stringify(payload), { expirationTtl: ttlSeconds });

    return jsonResponse(payload, 200, { "Cache-Control": `public, max-age=${ttlSeconds}` });
  },
};

function normalizeItems(feedJson) {
  const rawItems = Array.isArray(feedJson?.items) ? feedJson.items : [];

  return rawItems
    .map((item) => {
      const title = item?.title || item?.title_plain || "";
      const link = item?.url || item?.link || item?.external_url || "";
      const date = item?.date_published || item?.date || item?.published || null;
      const author = item?.author?.name || item?.author || item?.authors?.[0]?.name || null;
      const rawSummary = item?.summary || item?.content_text || item?.description || "";
      const extractedPicXImage = extractPicXImageFromSummary(rawSummary);
      const summary = extractedPicXImage ? removePicXFromSummary(rawSummary) : rawSummary;
      const image =
        item?.image ||
        item?.image_url ||
        item?.attachments?.[0]?.url ||
        extractedPicXImage ||
        null;

      return {
        title,
        link,
        date,
        author,
        summary,
        image,
      };
    })
    .filter((item) => item.title && item.link);
}

function extractPicXImageFromSummary(summary) {
  if (!summary || typeof summary !== "string") return null;

  // Matches both bare "pic.x.com/abc123" and prefixed "https://pic.x.com/abc123".
  const match = summary.match(/(?:https?:\/\/)?(?:www\.)?pic\.x\.com\/[A-Za-z0-9_-]+/i);
  if (!match) return null;

  const rawUrl = match[0].replace(/^www\./i, "");
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
  return `https://${rawUrl}`;
}

function removePicXFromSummary(summary) {
  if (!summary || typeof summary !== "string") return summary;

  return summary
    .replace(/(?:https?:\/\/)?(?:www\.)?pic\.x\.com\/[A-Za-z0-9_-]+/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function jsonResponse(body, status, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      ...extraHeaders,
    },
  });
}
