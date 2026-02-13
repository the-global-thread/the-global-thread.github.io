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

  const items = Array.isArray(data.items) ? data.items : [];

  itemsEl.innerHTML = items
    .map((item) => {
      const dateText = item.date ? new Date(item.date).toLocaleString() : "";
      const authorText = item.author ? `By ${item.author}` : "";
      const meta = [dateText, authorText].filter(Boolean).join(" · ");
      const mediaUrl = getMediaUrl(item);
      const hasImage = mediaUrl !== "";
      const summaryText =
        item.summary && item.summary.trim() !== ""
          ? item.summary
          : "Open article";
      const safeTitle = escapeHtml(item.title || "Feed item");
      const sizeClass = getSizeClass(item, hasImage);

      return `
        <li class="feed-item ${sizeClass}">
          <div class="feed-item-content">
            ${hasImage ? `<img src="${escapeHtml(mediaUrl)}" alt="${safeTitle}" class="feed-item-image" loading="lazy">` : ""}
            ${meta ? `<div class="meta">${meta}</div>` : ""}
            <p class="summary">${escapeHtml(summaryText)}</p>
          </div>
        </li>
      `;
    })
    .join("");

  if (!items.length) {
    itemsEl.innerHTML = `<li class="no-items">No additional items.</li>`;
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function getSizeClass(item, hasImage) {
  if (!hasImage) return "";

  const key = item.link || item.date || item.summary || "";
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }

  const variants = ["", "size-large", "size-tall"];
  return variants[Math.abs(hash) % variants.length];
}

function getMediaUrl(item) {
  const image = item.image && item.image.trim() !== "" ? normalizeUrl(item.image.trim()) : "";
  if (image) return image;

  const link = item.link && item.link.trim() !== "" ? normalizeUrl(item.link.trim()) : "";
  if (isPicXUrl(link)) return link;

  return "";
}

function normalizeUrl(url) {
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("pic.x.com/")) return `https://${url}`;
  return url;
}

function isPicXUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname === "pic.x.com" || parsed.hostname.endsWith(".pic.x.com");
  } catch {
    return url.startsWith("https://pic.x.com/") || url.startsWith("http://pic.x.com/");
  }
}

refreshBtn.addEventListener("click", () => loadFeed(true));
loadFeed(false);
