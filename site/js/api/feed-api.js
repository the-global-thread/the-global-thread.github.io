export async function fetchFeed(apiUrl, force = false) {
  const url = force ? `${apiUrl}?refresh=1` : apiUrl;
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}
