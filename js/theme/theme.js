window.NewsApp = window.NewsApp || {};

const STORAGE_KEY = "iran-news-theme";

function getPreferredTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(STORAGE_KEY, theme);
}

function setToggleLabel(buttonEl, theme) {
  buttonEl.textContent = theme === "dark" ? "Light" : "Dark";
}

window.NewsApp.initTheme = function initTheme(themeToggleEl) {
  if (!themeToggleEl) return;

  const initialTheme = getPreferredTheme();
  applyTheme(initialTheme);
  setToggleLabel(themeToggleEl, initialTheme);

  themeToggleEl.addEventListener("click", function handleThemeToggleClick() {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";

    applyTheme(nextTheme);
    setToggleLabel(themeToggleEl, nextTheme);
  });
};
