let allClips = [];
let currentView = "folders";
let currentFolder = null;

const searchInput = document.getElementById("searchInput");
const clearBtn = document.getElementById("clearBtn");
const foldersList = document.getElementById("foldersList");
const clipsList = document.getElementById("clipsList");
const folderClips = document.getElementById("folderClips");
const empty = document.getElementById("empty");
const foldersView = document.getElementById("foldersView");
const allView = document.getElementById("allView");
const clipsDetail = document.getElementById("clipsDetail");
const folderTitle = document.getElementById("folderTitle");
const backBtn = document.getElementById("backBtn");
const viewBtns = document.querySelectorAll(".view-btn");

function loadClips() {
  chrome.storage.local.get("clips", (result) => {
    allClips = result.clips || [];
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
      <div class="folder-name">${name}</div>
      <div class="folder-count">${clips.length} clip${clips.length !== 1 ? "s" : ""}</div>
    </div>
  `
    )
    .join("");

  document.querySelectorAll(".folder").forEach(el => {
    el.addEventListener("click", () => {
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

  const filtered = filterClips(allClips);
  clipsList.innerHTML = filtered.map(renderClipCard).join("");
  attachClipActions();
}

function renderFolderDetail() {
  foldersView.style.display = "none";
  allView.style.display = "none";
  clipsDetail.style.display = "block";

  const clipsInFolder = allClips.filter(
    c => (c.project || c.domain || "Uncategorized") === currentFolder
  );
  folderTitle.textContent = `📁 ${currentFolder}`;
  folderClips.innerHTML = clipsInFolder.map(renderClipCard).join("");
  attachClipActions();
}

function renderClipCard(clip) {
  return `
    <div class="clip-card">
      <div class="clip-title">${escapeHtml(clip.title)}</div>
      <div class="clip-meta">
        <span class="clip-domain">${clip.domain}</span>
        <span class="clip-date">${clip.timestamp}</span>
      </div>
      <div class="clip-actions">
        <button class="clip-btn copy-btn" data-id="${clip.id}">Copy</button>
        <button class="clip-btn view-btn" data-url="${clip.url}">View</button>
        <button class="clip-btn delete-btn" data-id="${clip.id}">Delete</button>
      </div>
    </div>
  `;
}

function attachClipActions() {
  document.querySelectorAll(".copy-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const clip = allClips.find(c => c.id == btn.dataset.id);
      if (clip) {
        navigator.clipboard.writeText(clip.markdown);
        btn.textContent = "✓ Copied";
        setTimeout(() => {
          btn.textContent = "Copy";
        }, 1500);
      }
    });
  });

  document.querySelectorAll(".view-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      window.open(btn.dataset.url, "_blank");
    });
  });

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      allClips = allClips.filter(c => c.id != id);
      chrome.storage.local.set({ clips: allClips });
      render();
    });
  });
}

function filterClips(clips) {
  const term = searchInput.value.toLowerCase();
  return clips.filter(
    c =>
      c.title.toLowerCase().includes(term) ||
      c.domain.toLowerCase().includes(term) ||
      (c.project || "").toLowerCase().includes(term)
  );
}

function escapeHtml(text) {
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return text.replace(/[&<>"']/g, m => map[m]);
}

searchInput.addEventListener("input", () => {
  render();
});

clearBtn.addEventListener("click", () => {
  if (confirm("Delete all clips? This cannot be undone.")) {
    allClips = [];
    chrome.storage.local.set({ clips: [] });
    render();
  }
});

viewBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    viewBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentView = btn.dataset.view;
    render();
  });
});

backBtn.addEventListener("click", () => {
  currentView = "folders";
  currentFolder = null;
  render();
});

loadClips();
