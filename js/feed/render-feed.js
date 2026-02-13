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
      const media = utils.getMedia(item);
      const hasMedia = media.url !== "";
      const meta = utils.getMeta(item);
      const summaryText = utils.getSummaryText(item);
      const safeTitle = utils.escapeHtml(item.title || "Feed item");
      const sizeClass = utils.getSizeClass(item, hasMedia);
      const mediaMarkup =
        media.type === "video"
          ? `<video class="feed-item-video" controls playsinline preload="metadata">
              <source src="${utils.escapeHtml(media.url)}">
            </video>`
          : media.url !== ""
            ? `<img src="${utils.escapeHtml(media.url)}" alt="${safeTitle}" class="feed-item-image" loading="lazy">`
            : "";

      return `
        <li class="feed-item ${sizeClass}">
          <div class="feed-item-content">
            ${mediaMarkup}
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
