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
      const meta = utils.buildMetaText(item);
      const summaryText = utils.getSummaryText(item);
      const safeTitle = utils.escapeHtml(item.title || "Feed item");
      const sizeClass = utils.getSizeClass(item, hasImage);

      return `
        <li class="feed-item ${sizeClass}">
          <div class="feed-item-content">
            ${hasImage ? `<img src="${utils.escapeHtml(mediaUrl)}" alt="${safeTitle}" class="feed-item-image" loading="lazy">` : ""}
            ${meta ? `<div class="meta">${utils.escapeHtml(meta)}</div>` : ""}
            <p class="summary">${utils.escapeHtml(summaryText)}</p>
          </div>
        </li>
      `;
    })
    .join("");
};

window.NewsApp.renderFeedError = function renderFeedError(itemsEl) {
  itemsEl.innerHTML = '<li class="feed-item">Could not load feed.</li>';
};
