const API_URL = "https://irannews-api.mahdibnd.workers.dev/api/feed";

const itemsEl = document.getElementById("items");
const updatedEl = document.getElementById("updated");
const statusEl = document.getElementById("status");
const refreshBtn = document.getElementById("refresh");

async function loadFeed(force = false) {
  statusEl.textContent = force ? "Refreshing…" : "Loading…";
  const url = force ? `${API_URL}?refresh=1` : API_URL;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderFeed(data);
    statusEl.textContent = "Updated";
  } catch (err) {
    statusEl.textContent = "Failed to load";
    itemsEl.innerHTML = `<li class="feed-item">Could not load feed.</li>`;
  }
}

function renderFeed(data) {
  updatedEl.textContent = data.generatedAt
    ? `Updated ${new Date(data.generatedAt).toLocaleString()}`
    : "";

  itemsEl.innerHTML = data.items
    .map((item) => {
      const dateText = item.date ? new Date(item.date).toLocaleString() : "";
      const authorText = item.author ? `By ${item.author}` : "";
      const meta = [dateText, authorText].filter(Boolean).join(" · ");

      return `
        <li class="feed-item">
          <a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.title}</a>
          ${meta ? `<div class="meta">${meta}</div>` : ""}
          ${item.summary ? `<p class="summary">${escapeHtml(item.summary)}</p>` : ""}
        </li>
      `;
    })
    .join("");
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

refreshBtn.addEventListener("click", () => loadFeed(true));
loadFeed(false);
