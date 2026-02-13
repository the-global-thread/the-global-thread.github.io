window.NewsApp = window.NewsApp || {};

function escapeHtml(text) {
    return String(text ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
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
    const media = getMedia(item);
    return media.url;
}

function getMedia(item) {
    const video = item.video && item.video.trim() !== "" ? normalizeUrl(item.video.trim()) : "";
    if (video) {
      return { type: "video", url: video };
    }

    const image = item.image && item.image.trim() !== "" ? normalizeUrl(item.image.trim()) : "";
    if (image) {
      return { type: "image", url: image };
    }

    const summaryImage = extractPicXUrl(item.summary || "");
    if (summaryImage) {
      return { type: "image", url: normalizeUrl(summaryImage) };
    }

    const link = item.link && item.link.trim() !== "" ? normalizeUrl(item.link.trim()) : "";
    if (isPicXUrl(link)) {
      return { type: "image", url: link };
    }

    return { type: "", url: "" };
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
    } catch (error) {
      return url.startsWith("https://pic.x.com/") || url.startsWith("http://pic.x.com/");
    }
}

function getMeta(item) {
    const date = item.date ? new Date(item.date) : null;
    const hasValidDate = date instanceof Date && !Number.isNaN(date.getTime());

    return {
      authorText: item.author ? item.author : "Unknown",
      timeText: hasValidDate ? formatRelativeTime(date) : "",
    };
}

function formatRelativeTime(date) {
    const now = Date.now();
    const diffMs = Math.max(0, now - date.getTime());
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diffMs < minute) return "now";
    if (diffMs < hour) return `${Math.floor(diffMs / minute)}m`;
    if (diffMs < day) return `${Math.floor(diffMs / hour)}h`;
    if (diffMs < 7 * day) return `${Math.floor(diffMs / day)}d`;

    return date.toLocaleDateString();
}

function getSummaryText(item) {
    if (item.summary && item.summary.trim() !== "") {
      return removePicXUrl(item.summary);
    }

    return "Open article";
}

function extractPicXUrl(text) {
    if (!text || typeof text !== "string") return "";

    const match = text.match(/(?:https?:\/\/)?(?:www\.)?pic\.x\.com\/[A-Za-z0-9_-]+/i);
    return match ? match[0].replace(/^www\./i, "") : "";
}

function removePicXUrl(text) {
    if (!text || typeof text !== "string") return text;

    return text
      .replace(/(?:https?:\/\/)?(?:www\.)?pic\.x\.com\/[A-Za-z0-9_-]+/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();
}

window.NewsApp.feedUtils = {
  escapeHtml,
  getSizeClass,
  getMediaUrl,
  getMedia,
  normalizeUrl,
  isPicXUrl,
  extractPicXUrl,
  removePicXUrl,
  getMeta,
  formatRelativeTime,
  getSummaryText,
};
