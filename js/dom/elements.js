window.NewsApp = window.NewsApp || {};

window.NewsApp.getElements = function getElements() {
  return {
    itemsEl: document.getElementById("items"),
    updatedEl: document.getElementById("updated"),
    statusEl: document.getElementById("status"),
    refreshBtn: document.getElementById("refresh"),
    loadMoreBtn: document.getElementById("load-more"),
    themeToggleEl: document.getElementById("theme-toggle"),
  };
};
