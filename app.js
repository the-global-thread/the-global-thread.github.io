(function bootstrapNewsApp() {
  const app = window.NewsApp || {};
  const { API_URL } = app.config;
  const { itemsEl, updatedEl, statusEl, refreshBtn, loadMoreBtn, themeToggleEl } = app.getElements();
  let nextCursor = null;
  let isLoading = false;

  function updateLoadMoreState() {
    if (!loadMoreBtn) return;
    if (nextCursor) {
      loadMoreBtn.disabled = false;
      loadMoreBtn.textContent = "Load more";
    } else {
      loadMoreBtn.disabled = true;
      loadMoreBtn.textContent = "No more items";
    }
  }

  async function loadFeed(options = {}) {
    if (isLoading) return;
    isLoading = true;
    const { force = false, append = false } = options;
    statusEl.textContent = force ? "Refreshing..." : append ? "Loading more..." : "Loading...";
    if (loadMoreBtn) loadMoreBtn.disabled = true;

    try {
      const data = await app.fetchFeed(API_URL, {
        force,
        cursor: append ? nextCursor : "",
      });
      app.renderFeed(itemsEl, updatedEl, data, { append });
      nextCursor = data.nextCursor || null;
      updateLoadMoreState();
      statusEl.textContent = "Updated";
    } catch (error) {
      statusEl.textContent = "Failed to load";
      if (!append) {
        app.renderFeedError(itemsEl);
      }
    }
    isLoading = false;
  }

  refreshBtn.addEventListener("click", function handleRefreshClick() {
    nextCursor = null;
    loadFeed({ force: true, append: false });
  });

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", function handleLoadMoreClick() {
      if (!nextCursor) return;
      loadFeed({ append: true });
    });
  }

  app.initTheme(themeToggleEl);
  loadFeed({ force: false, append: false });
})();
