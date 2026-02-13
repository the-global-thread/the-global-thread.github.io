window.NewsApp = window.NewsApp || {};

window.NewsApp.renderFeed = function renderFeed(itemsEl, updatedEl, data) {
  const utils = window.NewsApp.feedUtils;

  updatedEl.textContent = data.generatedAt
    ? `Updated ${new Date(data.generatedAt).toLocaleString()}`
    : "";

  const items = Array.isArray(data.items) ? data.items : [];

  if (!items.length) {
    itemsEl.innerHTML = '<li class="no-items">No additional items.</li>';
    return;
  }

  itemsEl.innerHTML = items
    .map((item) => {
      const mediaUrl = utils.getMediaUrl(item);
      const hasImage = mediaUrl !== "";
      const meta = utils.getMeta(item);
      const summaryText = utils.getSummaryText(item);
      const safeTitle = utils.escapeHtml(item.title || "Feed item");
      const sizeClass = utils.getSizeClass(item, hasImage);

      return `
        <li class="feed-item ${sizeClass}">
          <div class="feed-item-content">
            ${hasImage ? `<img src="${utils.escapeHtml(mediaUrl)}" alt="${safeTitle}" class="feed-item-image" loading="lazy">` : ""}
            <p class="summary">${utils.escapeHtml(summaryText)}</p>
            ${meta.authorText || meta.timeText ? `<div class="meta">${meta.authorText ? `<span class="meta-author">${utils.escapeHtml(meta.authorText)}</span>` : ""}${meta.authorText && meta.timeText ? `<span class="meta-dot">•</span>` : ""}${meta.timeText ? `<span class="meta-time">${utils.escapeHtml(meta.timeText)}</span>` : ""}</div>` : ""}
          </div>
        </li>
      `;
    })
    .join("");
};

window.NewsApp.renderFeedError = function renderFeedError(itemsEl) {
  itemsEl.innerHTML = '<li class="feed-item">Could not load feed.</li>';
};
