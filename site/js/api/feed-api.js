window.NewsApp = window.NewsApp || {};

window.NewsApp.fetchFeed = async function fetchFeed(apiUrl, force) {
  const shouldForce = Boolean(force);
  const url = shouldForce ? `${apiUrl}?refresh=1` : apiUrl;
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
};
