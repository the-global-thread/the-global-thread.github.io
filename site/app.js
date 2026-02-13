(function bootstrapNewsApp() {
  const app = window.NewsApp || {};
  const { API_URL } = app.config;
  const { itemsEl, updatedEl, statusEl, refreshBtn, themeToggleEl } = app.getElements();

  async function loadFeed(force) {
    const shouldForce = Boolean(force);
    statusEl.textContent = shouldForce ? "Refreshing..." : "Loading...";

    try {
      const data = await app.fetchFeed(API_URL, shouldForce);
      app.renderFeed(itemsEl, updatedEl, data);
      statusEl.textContent = "Updated";
    } catch (error) {
      statusEl.textContent = "Failed to load";
      app.renderFeedError(itemsEl);
    }
  }

  refreshBtn.addEventListener("click", function handleRefreshClick() {
    loadFeed(true);
  });

  app.initTheme(themeToggleEl);
  loadFeed(false);
})();
