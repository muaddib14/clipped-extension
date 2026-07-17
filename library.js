let allClips = [];
let currentView = "folders";
let currentFolder = null;

const searchInput = document.getElementById("searchInput");
const clearBtn = document.getElementById("clearBtn");
const exportBtn = document.getElementById("exportBtn");
const digestBtn = document.getElementById("digestBtn");
const sortSelect = document.getElementById("sortSelect");
const subtitle = document.getElementById("subtitle");

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function wordCount(clip) {
  return (clip.markdown || "").trim().split(/\s+/).filter(Boolean).length;
}

function isThisWeek(clip) {
  const t = new Date(clip.timestamp).getTime();
  return !isNaN(t) && Date.now() - t <= WEEK_MS;
}

function updateSubtitle() {
  if (!allClips.length) {
    subtitle.textContent = "Organize and manage your saved articles";
    return;
  }
  const projects = new Set(allClips.map(folderNameFor));
  const thisWeek = allClips.filter(isThisWeek).length;
  subtitle.textContent = `${allClips.length} clip${allClips.length !== 1 ? "s" : ""} · ${projects.size} project${projects.size !== 1 ? "s" : ""} · ${thisWeek} this week`;
}

function folderNameFor(clip) {
  return clip.project || clip.domain || "Uncategorized";
}

function sortClips(clips) {
  const mode = sortSelect ? sortSelect.value : "date-desc";
  const sorted = [...clips];
  switch (mode) {
    case "date-asc":
      return sorted.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    case "project":
      return sorted.sort((a, b) => folderNameFor(a).localeCompare(folderNameFor(b)));
    case "words-desc":
      return sorted.sort((a, b) => wordCount(b) - wordCount(a));
    case "words-asc":
      return sorted.sort((a, b) => wordCount(a) - wordCount(b));
    case "date-desc":
    default:
      return sorted.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }
}
const foldersList = document.getElementById("foldersList");
const clipsList = document.getElementById("clipsList");
const folderClips = document.getElementById("folderClips");
const empty = document.getElementById("empty");
const foldersView = document.getElementById("foldersView");
const allView = document.getElementById("allView");
const clipsDetail = document.getElementById("clipsDetail");
const folderTitle = document.getElementById("folderTitle");
const backBtn = document.getElementById("backBtn");
const viewBtns = document.querySelectorAll(".tab-btn");

function loadClips() {
  chrome.storage.local.get("clips", (result) => {
    allClips = result.clips || [];
    updateSubtitle();
    render();
  });
}

function render() {
  if (!allClips.length) {
    empty.textContent = "No clips yet. Start clipping articles!";
    empty.style.display = "block";
    foldersView.style.display = "none";
    allView.style.display = "none";
    clipsDetail.style.display = "none";
    return;
  }

  empty.style.display = "none";

  if (currentView === "folders") {
    renderFolders();
  } else if (currentView === "all") {
    renderAllClips();
  } else if (currentView === "folder-detail") {
    renderFolderDetail();
  }
}

function renderFolders() {
  foldersView.style.display = "block";
  allView.style.display = "none";
  clipsDetail.style.display = "none";

  const folders = {};
  allClips.forEach(clip => {
    const folder = clip.project || clip.domain || "Uncategorized";
    if (!folders[folder]) folders[folder] = [];
    folders[folder].push(clip);
  });

  foldersList.innerHTML = Object.entries(folders)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([name, clips]) => `
    <div class="folder" data-folder="${name}">
      <div class="folder-icon">📁</div>
      <div class="folder-name">${escapeHtml(name)}</div>
      <div class="folder-count">${clips.length} clip${clips.length !== 1 ? "s" : ""}</div>
    </div>
  `
    )
    .join("");

  document.querySelectorAll(".folder").forEach(el => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      currentFolder = el.dataset.folder;
      currentView = "folder-detail";
      render();
    });
  });
}

function renderAllClips() {
  foldersView.style.display = "none";
  allView.style.display = "block";
  clipsDetail.style.display = "none";

  const filtered = sortClips(filterClips(allClips));
  clipsList.innerHTML = filtered.map(renderClipCard).join("");
  attachClipActions();
}

function renderFolderDetail() {
  foldersView.style.display = "none";
  allView.style.display = "none";
  clipsDetail.style.display = "block";

  const clipsInFolder = sortClips(
    allClips.filter(c => (c.project || c.domain || "Uncategorized") === currentFolder)
  );
  folderTitle.textContent = escapeHtml(currentFolder);
  folderClips.innerHTML = clipsInFolder.map(renderClipCard).join("");
  attachClipActions();
}

function renderClipCard(clip) {
  const tags = clip.tags || [];
  return `
    <div class="clip-card">
      <div class="clip-title">${escapeHtml(clip.title)}</div>
      <div class="clip-meta">
        <span class="clip-domain">${escapeHtml(clip.domain)}</span>
        <span class="clip-date">${clip.timestamp}</span>
      </div>
      <div class="clip-tags">
        ${tags.map(t => `<span class="tag-chip" data-tag="${escapeHtml(t)}">#${escapeHtml(t)}</span>`).join("")}
        <button class="tag-add" data-id="${clip.id}">+ tag</button>
      </div>
      <div class="clip-actions">
        <button class="clip-btn copy-btn" data-id="${clip.id}" title="Copy markdown">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
          </svg>
          Copy
        </button>
        <button class="clip-btn view-btn" data-url="${clip.url}" title="View original">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          View
        </button>
        <button class="clip-btn delete-btn" data-id="${clip.id}" title="Delete clip">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
          Delete
        </button>
      </div>
    </div>
  `;
}

function attachClipActions() {
  document.querySelectorAll(".copy-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const clip = allClips.find(c => c.id == btn.dataset.id);
      if (clip) {
        navigator.clipboard.writeText(clip.markdown);
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>Copied';
        setTimeout(() => {
          btn.innerHTML = originalHTML;
        }, 1500);
      }
    });
  });

  document.querySelectorAll(".view-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      window.open(btn.dataset.url, "_blank");
    });
  });

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const id = btn.dataset.id;
      allClips = allClips.filter(c => c.id != id);
      chrome.storage.local.set({ clips: allClips });
      updateSubtitle();
      render();
    });
  });

  document.querySelectorAll(".tag-add").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const clip = allClips.find(c => c.id == btn.dataset.id);
      if (!clip) return;
      const input = prompt("Add tags (comma separated):");
      if (!input) return;
      const newTags = input.split(",").map(t => t.trim().toLowerCase()).filter(Boolean);
      const existing = new Set(clip.tags || []);
      newTags.forEach(t => existing.add(t));
      clip.tags = Array.from(existing);
      chrome.storage.local.set({ clips: allClips });
      render();
    });
  });

  document.querySelectorAll(".tag-chip").forEach(chip => {
    chip.addEventListener("click", (e) => {
      e.preventDefault();
      searchInput.value = chip.dataset.tag;
      render();
    });
  });
}

function filterClips(clips) {
  const term = searchInput.value.toLowerCase();
  if (!term) return clips;
  return clips.filter(
    c =>
      c.title.toLowerCase().includes(term) ||
      c.domain.toLowerCase().includes(term) ||
      (c.project || "").toLowerCase().includes(term) ||
      (c.tags || []).some(t => t.toLowerCase().includes(term))
  );
}

function escapeHtml(text) {
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return text.replace(/[&<>"']/g, m => map[m]);
}

searchInput.addEventListener("input", (e) => {
  e.preventDefault();
  render();
});

sortSelect.addEventListener("change", (e) => {
  e.preventDefault();
  render();
});

digestBtn.addEventListener("click", (e) => {
  e.preventDefault();
  const weekClips = sortClips(allClips.filter(isThisWeek));
  if (!weekClips.length) {
    alert("No clips from the last 7 days yet.");
    return;
  }

  const byProject = {};
  weekClips.forEach(c => {
    const p = folderNameFor(c);
    if (!byProject[p]) byProject[p] = [];
    byProject[p].push(c);
  });

  const today = new Date().toISOString().split("T")[0];
  let doc = `# Weekly Digest — ${today}\n\n${weekClips.length} clip${weekClips.length !== 1 ? "s" : ""} from the last 7 days\n\n`;
  Object.entries(byProject).forEach(([project, clips]) => {
    doc += `## ${project}\n\n`;
    clips.forEach(c => {
      doc += `- **${c.title}** — ${c.domain} (${c.timestamp})\n  ${c.url}\n`;
    });
    doc += "\n";
  });

  chrome.runtime.sendMessage({ type: "download-digest", markdown: doc, filename: `weekly-digest-${today}.md` });

  const originalHTML = digestBtn.innerHTML;
  digestBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  setTimeout(() => {
    digestBtn.innerHTML = originalHTML;
  }, 1500);
});

exportBtn.addEventListener("click", (e) => {
  e.preventDefault();
  if (!allClips.length) {
    alert("No clips to export yet.");
    return;
  }
  const originalHTML = exportBtn.innerHTML;
  chrome.runtime.sendMessage({ type: "export-library", clips: allClips }, () => {
    exportBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    setTimeout(() => {
      exportBtn.innerHTML = originalHTML;
    }, 1500);
  });
});

clearBtn.addEventListener("click", (e) => {
  e.preventDefault();
  if (allClips.length > 0 && confirm(`Delete all ${allClips.length} clips? This cannot be undone.`)) {
    allClips = [];
    chrome.storage.local.set({ clips: [] });
    updateSubtitle();
    render();
  }
});

viewBtns.forEach(btn => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    viewBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentView = btn.dataset.view;
    render();
  });
});

backBtn.addEventListener("click", (e) => {
  e.preventDefault();
  currentView = "folders";
  currentFolder = null;
  render();
});

loadClips();
