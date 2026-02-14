window.NewsApp = window.NewsApp || {};

window.NewsApp.fetchFeed = async function fetchFeed(apiUrl, options = {}) {
  const { force = false, cursor = "", limit = "" } = options;
  const url = new URL(apiUrl);

  if (force) {
    url.searchParams.set("refresh", "1");
  }
  if (cursor) {
    url.searchParams.set("cursor", cursor);
  }
  if (limit) {
    url.searchParams.set("limit", limit);
  }

  const response = await fetch(url.toString(), { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
};
