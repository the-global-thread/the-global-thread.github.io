export function escapeHtml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function getSizeClass(item, hasImage) {
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

export function getMediaUrl(item) {
  const image = item.image && item.image.trim() !== "" ? normalizeUrl(item.image.trim()) : "";
  if (image) return image;

  const link = item.link && item.link.trim() !== "" ? normalizeUrl(item.link.trim()) : "";
  if (isPicXUrl(link)) return link;

  return "";
}

export function normalizeUrl(url) {
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("pic.x.com/")) return `https://${url}`;
  return url;
}

export function isPicXUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname === "pic.x.com" || parsed.hostname.endsWith(".pic.x.com");
  } catch {
    return url.startsWith("https://pic.x.com/") || url.startsWith("http://pic.x.com/");
  }
}

export function buildMetaText(item) {
  const dateText = item.date ? new Date(item.date).toLocaleString() : "";
  const authorText = item.author ? `By ${item.author}` : "";

  return [dateText, authorText].filter(Boolean).join(" · ");
}

export function getSummaryText(item) {
  if (item.summary && item.summary.trim() !== "") {
    return item.summary;
  }

  return "Open article";
}
