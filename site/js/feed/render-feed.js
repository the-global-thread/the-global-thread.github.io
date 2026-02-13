import {
  buildMetaText,
  escapeHtml,
  getMediaUrl,
  getSizeClass,
  getSummaryText,
} from "./feed-utils.js";

function renderItem(item) {
  const mediaUrl = getMediaUrl(item);
  const hasImage = mediaUrl !== "";
  const meta = buildMetaText(item);
  const summaryText = getSummaryText(item);
  const safeTitle = escapeHtml(item.title || "Feed item");
  const sizeClass = getSizeClass(item, hasImage);

  return `
    <li class="feed-item ${sizeClass}">
      <div class="feed-item-content">
        ${hasImage ? `<img src="${escapeHtml(mediaUrl)}" alt="${safeTitle}" class="feed-item-image" loading="lazy">` : ""}
        ${meta ? `<div class="meta">${escapeHtml(meta)}</div>` : ""}
        <p class="summary">${escapeHtml(summaryText)}</p>
      </div>
    </li>
  `;
}

export function renderFeed(itemsEl, updatedEl, data) {
  updatedEl.textContent = data.generatedAt
    ? `Updated ${new Date(data.generatedAt).toLocaleString()}`
    : "";

  const items = Array.isArray(data.items) ? data.items : [];

  if (!items.length) {
    itemsEl.innerHTML = '<li class="no-items">No additional items.</li>';
    return;
  }

  itemsEl.innerHTML = items.map(renderItem).join("");
}

export function renderFeedError(itemsEl) {
  itemsEl.innerHTML = '<li class="feed-item">Could not load feed.</li>';
}
