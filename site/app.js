import { fetchFeed } from "./js/api/feed-api.js";
import { API_URL } from "./js/config.js";
import { getElements } from "./js/dom/elements.js";
import { renderFeed, renderFeedError } from "./js/feed/render-feed.js";

const { itemsEl, updatedEl, statusEl, refreshBtn } = getElements();

async function loadFeed(force = false) {
  statusEl.textContent = force ? "Refreshing…" : "Loading…";

  try {
    const data = await fetchFeed(API_URL, force);
    renderFeed(itemsEl, updatedEl, data);
    statusEl.textContent = "Updated";
  } catch {
    statusEl.textContent = "Failed to load";
    renderFeedError(itemsEl);
  }
}

refreshBtn.addEventListener("click", () => loadFeed(true));
loadFeed(false);
