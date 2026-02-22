(function bootstrapAdmin() {
  const TOKEN_STORAGE_KEY = "iran-news-admin-token";
  const config = window.NewsApp?.config || {};
  const apiOrigin = new URL(config.API_URL || window.location.origin).origin;
  const adminBase = `${apiOrigin}/api/admin`;

  const authFormEl = document.getElementById("auth-form");
  const adminTokenEl = document.getElementById("admin-token");
  const authStatusEl = document.getElementById("auth-status");
  const formEl = document.getElementById("source-form");
  const sourceUrlEl = document.getElementById("source-url");
  const sourceStatusEl = document.getElementById("source-status");
  const sourcesListEl = document.getElementById("sources-list");
  const sourcesRefreshEl = document.getElementById("sources-refresh");
  const itemsRefreshEl = document.getElementById("items-refresh");
  const itemsStatusEl = document.getElementById("items-status");
  const itemsBodyEl = document.getElementById("items-body");
  let adminToken = sessionStorage.getItem(TOKEN_STORAGE_KEY) || "";

  function setAuthStatus(text) {
    authStatusEl.textContent = text;
  }

  function setSourceStatus(text) {
    sourceStatusEl.textContent = text;
  }

  function setItemsStatus(text) {
    itemsStatusEl.textContent = text;
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
      } catch {}
      if (response.status === 401) {
        adminToken = "";
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
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
      cell.colSpan = 4;
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

      row.appendChild(publishedCell);
      row.appendChild(sourceCell);
      row.appendChild(titleCell);
      row.appendChild(linkCell);
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

  async function loadItems() {
    if (!adminToken) {
      setItemsStatus("Admin token required.");
      return;
    }
    try {
      setItemsStatus("Loading DB items...");
      const payload = await requestJson("/items?limit=100");
      renderItems(payload.items || []);
      setItemsStatus(`Loaded ${payload.count || 0} item(s).`);
    } catch (error) {
      setItemsStatus(`Failed to load DB items: ${error.message}`);
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
      setSourceStatus(`Loaded ${payload.sources?.length || 0} source(s).`);
      await loadItems();
    } catch (error) {
      setAuthStatus(`Auth failed: ${error.message}`);
    }
  });

  sourcesRefreshEl.addEventListener("click", loadSources);
  itemsRefreshEl.addEventListener("click", loadItems);

  if (adminToken) {
    setAuthStatus("Existing admin session token detected.");
    loadSources();
    loadItems();
  } else {
    setAuthStatus("Enter admin token to access this panel.");
    setSourceStatus("Admin token required.");
    setItemsStatus("Admin token required.");
  }
})();
