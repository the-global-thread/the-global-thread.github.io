(function bootstrapAdmin() {
  const TOKEN_STORAGE_KEY = "iran-news-admin-token";
  const ITEMS_PAGE_SIZE = 50;
  const DEFAULT_BACKFILL_LIMIT = 300;
  const config = window.NewsApp?.config || {};
  const apiOrigin = new URL(config.API_URL || window.location.origin).origin;
  const adminBase = `${apiOrigin}/api/admin`;

  const authFormEl = document.getElementById("auth-form");
  const authPanelEl = document.getElementById("auth-panel");
  const adminTokenEl = document.getElementById("admin-token");
  const authStatusEl = document.getElementById("auth-status");
  const formEl = document.getElementById("source-form");
  const sourceUrlEl = document.getElementById("source-url");
  const sourceStatusEl = document.getElementById("source-status");
  const backfillFormEl = document.getElementById("backfill-form");
  const backfillLimitEl = document.getElementById("backfill-limit");
  const backfillSubmitEl = document.getElementById("backfill-submit");
  const backfillStatusEl = document.getElementById("backfill-status");
  const sourcesListEl = document.getElementById("sources-list");
  const sourcesRefreshEl = document.getElementById("sources-refresh");
  const itemsRefreshEl = document.getElementById("items-refresh");
  const itemsStatusEl = document.getElementById("items-status");
  const itemsBodyEl = document.getElementById("items-body");
  const itemsPrevEl = document.getElementById("items-prev");
  const itemsNextEl = document.getElementById("items-next");
  const itemsPageIndicatorEl = document.getElementById("items-page-indicator");
  let adminToken = sessionStorage.getItem(TOKEN_STORAGE_KEY) || "";
  let currentItemsPage = 1;
  let totalItemsPages = 1;

  function setAuthStatus(text) {
    authStatusEl.textContent = text;
  }

  function setSourceStatus(text) {
    sourceStatusEl.textContent = text;
  }

  function setBackfillStatus(text) {
    if (!backfillStatusEl) return;
    backfillStatusEl.textContent = text;
  }

  function setItemsStatus(text) {
    itemsStatusEl.textContent = text;
  }

  function setAuthPanelVisible(visible) {
    if (!authPanelEl) return;
    authPanelEl.style.display = visible ? "" : "none";
  }

  function setBackfillBusy(busy) {
    if (!backfillSubmitEl) return;
    backfillSubmitEl.disabled = busy;
    backfillSubmitEl.textContent = busy ? "Running..." : "Run Backfill";
  }

  function parseBackfillLimit(raw) {
    const parsed = Number.parseInt(String(raw || "").trim(), 10);
    if (!Number.isFinite(parsed)) return DEFAULT_BACKFILL_LIMIT;
    return Math.min(Math.max(parsed, 1), 300);
  }

  function updatePager(payload) {
    currentItemsPage = Number(payload?.page || 1);
    totalItemsPages = Number(payload?.totalPages || 1);
    itemsPageIndicatorEl.textContent = `Page ${currentItemsPage} of ${totalItemsPages}`;
    itemsPrevEl.disabled = !payload?.hasPrev;
    itemsNextEl.disabled = !payload?.hasNext;
  }

  async function requestJson(path, options = {}) {
    const mergedHeaders = {
      "Content-Type": "application/json",
      ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
      ...(options.headers || {}),
    };
    const response = await fetch(`${adminBase}${path}`, {
      headers: mergedHeaders,
      ...options,
    });
    if (!response.ok) {
      let message = `HTTP ${response.status}`;
      try {
        const payload = await response.json();
        if (payload?.error) message = payload.error;
      } catch { }
      if (response.status === 401) {
        adminToken = "";
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
        setAuthPanelVisible(true);
        setAuthStatus("Unauthorized. Enter a valid admin token.");
      }
      throw new Error(message);
    }
    return response.json();
  }

  function renderSources(sources) {
    sourcesListEl.innerHTML = "";
    if (!Array.isArray(sources) || !sources.length) {
      const empty = document.createElement("li");
      empty.className = "source-row";
      empty.textContent = "No RSS sources configured.";
      sourcesListEl.appendChild(empty);
      return;
    }

    sources.forEach((source) => {
      const row = document.createElement("li");
      row.className = "source-row";

      const urlText = document.createElement("p");
      urlText.className = "source-url";
      urlText.textContent = source.url;

      const removeBtn = document.createElement("button");
      removeBtn.className = "delete-btn";
      removeBtn.type = "button";
      removeBtn.textContent = "Remove";
      removeBtn.addEventListener("click", async function handleRemove() {
        try {
          setSourceStatus("Removing source...");
          const payload = await requestJson(`/sources?id=${encodeURIComponent(source.id)}`, {
            method: "DELETE",
          });
          renderSources(payload.sources || []);
          setSourceStatus("Source removed.");
        } catch (error) {
          setSourceStatus(`Failed to remove source: ${error.message}`);
        }
      });

      row.appendChild(urlText);
      row.appendChild(removeBtn);
      sourcesListEl.appendChild(row);
    });
  }

  function renderItems(items) {
    itemsBodyEl.innerHTML = "";
    if (!Array.isArray(items) || !items.length) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 6;
      cell.textContent = "No items in database.";
      row.appendChild(cell);
      itemsBodyEl.appendChild(row);
      return;
    }

    items.forEach((item) => {
      const row = document.createElement("tr");

      const publishedCell = document.createElement("td");
      publishedCell.textContent = item.published_at || "";

      const sourceCell = document.createElement("td");
      sourceCell.textContent = item.source || "";

      const titleCell = document.createElement("td");
      titleCell.textContent = item.title || "";

      const linkCell = document.createElement("td");
      const linkEl = document.createElement("a");
      linkEl.href = item.link;
      linkEl.target = "_blank";
      linkEl.rel = "noopener noreferrer";
      linkEl.textContent = "Open";
      linkCell.appendChild(linkEl);

      const translationCell = document.createElement("td");
      const hasTranslation = item.translation && item.translation.trim() !== "";
      translationCell.textContent = hasTranslation ? "✓" : "✗";
      translationCell.className = hasTranslation ? "translation-yes" : "translation-no";

      const actionsCell = document.createElement("td");
      if (!hasTranslation && item.summary && item.summary.trim() !== "") {
        const translateBtn = document.createElement("button");
        translateBtn.className = "translate-btn";
        translateBtn.type = "button";
        translateBtn.textContent = "Translate";
        translateBtn.addEventListener("click", async function handleTranslate() {
          try {
            translateBtn.disabled = true;
            translateBtn.textContent = "Translating...";
            const payload = await requestJson(`/translate/item?id=${encodeURIComponent(item.id)}`, {
              method: "POST",
            });
            if (payload.translated) {
              translationCell.textContent = "✓";
              translationCell.className = "translation-yes";
              translateBtn.remove();
            } else {
              translateBtn.disabled = false;
              translateBtn.textContent = "Translate";
              const reason = payload.error ? ` (${payload.error})` : "";
              alert(`Translation failed${reason}. Check worker logs for details.`);
            }
          } catch (error) {
            translateBtn.disabled = false;
            translateBtn.textContent = "Translate";
            alert(`Translation failed: ${error.message}`);
          }
        });
        actionsCell.appendChild(translateBtn);
      }

      row.appendChild(publishedCell);
      row.appendChild(sourceCell);
      row.appendChild(titleCell);
      row.appendChild(linkCell);
      row.appendChild(translationCell);
      row.appendChild(actionsCell);
      itemsBodyEl.appendChild(row);
    });
  }

  async function loadSources() {
    if (!adminToken) {
      setSourceStatus("Admin token required.");
      return;
    }
    try {
      setSourceStatus("Loading sources...");
      const payload = await requestJson("/sources");
      renderSources(payload.sources || []);
      setSourceStatus(`Loaded ${payload.sources?.length || 0} source(s).`);
    } catch (error) {
      setSourceStatus(`Failed to load sources: ${error.message}`);
    }
  }

  async function loadItems(page = 1) {
    if (!adminToken) {
      setItemsStatus("Admin token required.");
      return;
    }
    try {
      setItemsStatus("Loading DB items...");
      const payload = await requestJson(`/items?limit=${ITEMS_PAGE_SIZE}&page=${page}`);
      renderItems(payload.items || []);
      updatePager(payload);
      setItemsStatus(`Loaded ${payload.count || 0} item(s) out of ${payload.total || 0}.`);
    } catch (error) {
      setItemsStatus(`Failed to load DB items: ${error.message}`);
    }
  }

  async function runBackfill(limit) {
    if (!adminToken) {
      setBackfillStatus("Admin token required.");
      return;
    }
    const safeLimit = parseBackfillLimit(limit);
    if (backfillLimitEl) {
      backfillLimitEl.value = String(safeLimit);
    }

    try {
      setBackfillBusy(true);
      setBackfillStatus(`Running backfill for up to ${safeLimit} row(s)...`);
      const payload = await requestJson(`/translate/backfill?limit=${safeLimit}`, {
        method: "POST",
      });
      setBackfillStatus(`Backfill done. Translated ${payload.translated || 0} row(s) (limit ${payload.limit || safeLimit}).`);
      await loadItems(1);
    } catch (error) {
      setBackfillStatus(`Backfill failed: ${error.message}`);
    } finally {
      setBackfillBusy(false);
    }
  }

  formEl.addEventListener("submit", async function handleSourceSubmit(event) {
    event.preventDefault();
    if (!adminToken) {
      setSourceStatus("Admin token required.");
      return;
    }
    const url = sourceUrlEl.value.trim();
    if (!url) return;

    try {
      setSourceStatus("Adding source...");
      const payload = await requestJson("/sources", {
        method: "POST",
        body: JSON.stringify({ url }),
      });
      sourceUrlEl.value = "";
      renderSources(payload.sources || []);
      setSourceStatus(payload.created ? "Source added." : "Source already exists.");
    } catch (error) {
      setSourceStatus(`Failed to add source: ${error.message}`);
    }
  });

  authFormEl.addEventListener("submit", async function handleAuthSubmit(event) {
    event.preventDefault();
    const candidate = adminTokenEl.value.trim();
    if (!candidate) return;
    adminToken = candidate;
    sessionStorage.setItem(TOKEN_STORAGE_KEY, candidate);
    adminTokenEl.value = "";

    try {
      const payload = await requestJson("/sources");
      renderSources(payload.sources || []);
      setAuthStatus("Admin unlocked for this tab session.");
      setAuthPanelVisible(false);
      setSourceStatus(`Loaded ${payload.sources?.length || 0} source(s).`);
      setBackfillStatus("Ready. Choose row count and run.");
      await loadItems(1);
    } catch (error) {
      setAuthStatus(`Auth failed: ${error.message}`);
    }
  });

  if (backfillFormEl) {
    backfillFormEl.addEventListener("submit", async function handleBackfillSubmit(event) {
      event.preventDefault();
      const requested = backfillLimitEl ? backfillLimitEl.value : `${DEFAULT_BACKFILL_LIMIT}`;
      await runBackfill(requested);
    });
  }

  sourcesRefreshEl.addEventListener("click", loadSources);
  itemsRefreshEl.addEventListener("click", function handleItemsRefresh() {
    loadItems(currentItemsPage);
  });
  itemsPrevEl.addEventListener("click", function handleItemsPrev() {
    if (currentItemsPage <= 1) return;
    loadItems(currentItemsPage - 1);
  });
  itemsNextEl.addEventListener("click", function handleItemsNext() {
    if (currentItemsPage >= totalItemsPages) return;
    loadItems(currentItemsPage + 1);
  });

  if (adminToken) {
    setAuthPanelVisible(false);
    setBackfillStatus("Ready. Choose row count and run.");
    loadSources();
    loadItems(1);
  } else {
    setAuthPanelVisible(true);
    setAuthStatus("Enter admin token to access this panel.");
    setSourceStatus("Admin token required.");
    setBackfillStatus("Admin token required.");
    setItemsStatus("Admin token required.");
    itemsPrevEl.disabled = true;
    itemsNextEl.disabled = true;
    setBackfillBusy(false);
  }
})();
