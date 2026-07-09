const copyBtn = document.getElementById("copyBtn");
const saveBtn = document.getElementById("saveBtn");
const libraryBtn = document.getElementById("libraryBtn");
const status = document.getElementById("status");
const projectInput = document.getElementById("projectInput");
const projectsDropdown = document.getElementById("projectsDropdown");
const projectSelectorMode = document.getElementById("projectSelectorMode");
const projectConfirmMode = document.getElementById("projectConfirmMode");
const projectNameDisplay = document.getElementById("projectNameDisplay");
const changeProjectBtn = document.getElementById("changeProjectBtn");
const confirmProjectBtn = document.getElementById("confirmProjectBtn");
const toggleBtn = document.getElementById("toggleBtn");
const toggleIcon = document.getElementById("toggleIcon");
const secondaryPanel = document.getElementById("secondaryPanel");

let lastMarkdown = null;
let lastFilename = null;
let lastClipData = null;
let selectedProject = null;
let panelOpen = false;

function setStatus(text, cls) {
  status.textContent = text;
  status.className = "status " + (cls || "");
  status.classList.add("show");

  if (cls === "ok") {
    setTimeout(() => {
      status.classList.remove("show");
    }, 2500);
  }
}

function disableButtons(state) {
  copyBtn.disabled = state;
  saveBtn.disabled = state;
  libraryBtn.disabled = state;
}

function togglePanel() {
  panelOpen = !panelOpen;
  secondaryPanel.style.display = panelOpen ? "block" : "none";
  toggleIcon.classList.toggle("open", panelOpen);
}

function loadProjects() {
  chrome.storage.local.get("projects", (result) => {
    window.allProjects = result.projects || [];
  });
}

function filterAndShowDropdown() {
  const input = projectInput.value.trim().toLowerCase();
  loadProjects();

  const filtered = input ?
    window.allProjects.filter(p => p.toLowerCase().includes(input)) :
    window.allProjects;

  let html = "";

  // Show existing projects
  if (filtered.length > 0) {
    html += filtered.map(p => `
      <div class="project-option" data-project="${p}">${p}</div>
    `).join("");
  }

  // Show "create new" option if input doesn't match any project
  if (input && !window.allProjects.some(p => p.toLowerCase() === input)) {
    html += `<div class="project-option create-new" data-create="${input}">+ Create "${input}"</div>`;
  }

  projectsDropdown.innerHTML = html;
  projectsDropdown.classList.toggle("show", html.length > 0);

  // Attach listeners
  document.querySelectorAll(".project-option").forEach(opt => {
    opt.addEventListener("click", () => {
      if (opt.dataset.project) {
        selectProject(opt.dataset.project);
      } else if (opt.dataset.create) {
        createAndSelectProject(opt.dataset.create);
      }
    });
  });
}

function selectProject(project) {
  // Show confirm UI, don't auto-confirm yet
  projectNameDisplay.textContent = project;
  projectSelectorMode.style.display = "none";
  projectConfirmMode.style.display = "block";
  projectInput.value = "";
  projectsDropdown.classList.remove("show");

  // Store temporary selection
  window.tempProjectSelection = project;
}

function createAndSelectProject(project) {
  chrome.storage.local.get("projects", (result) => {
    const projects = result.projects || [];
    if (!projects.includes(project)) {
      projects.push(project);
      chrome.storage.local.set({ projects });
    }
    selectProject(project);
  });
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "article-md-result") {
    disableButtons(false);
    if (message.ok) {
      lastMarkdown = message.markdown;
      lastFilename = message.filename;
      lastClipData = message.clipData;
      setStatus("Ready to copy or download", "ok");
    } else {
      lastMarkdown = null;
      lastFilename = null;
      lastClipData = null;
      setStatus(message.error, "err");
    }
  }
});

async function extractArticle() {
  disableButtons(true);
  setStatus("Extracting...");
  lastMarkdown = null;
  lastFilename = null;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    setStatus("No active tab.", "err");
    disableButtons(false);
    return;
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["lib/Readability.js", "lib/turndown.js", "content.js"]
    });
  } catch (err) {
    setStatus("Can't run: " + err.message, "err");
    disableButtons(false);
  }
}

copyBtn.addEventListener("click", async () => {
  if (!lastMarkdown) {
    await extractArticle();
    setTimeout(() => {
      if (lastMarkdown) {
        copyBtn.click();
      }
    }, 100);
    return;
  }
  try {
    await navigator.clipboard.writeText(lastMarkdown);
    setStatus("✓ Copied to clipboard!", "ok");

    // Badge notification on icon
    chrome.action.setBadgeText({ text: "✓" });
    chrome.action.setBadgeBackgroundColor({ color: "#6fd08c" });
    setTimeout(() => {
      chrome.action.setBadgeText({ text: "" });
    }, 2000);
  } catch (err) {
    setStatus("Copy failed: " + err.message, "err");
  }
});

saveBtn.addEventListener("click", async () => {
  if (!lastMarkdown) {
    await extractArticle();
    return;
  }

  if (lastClipData && selectedProject) {
    lastClipData.project = selectedProject;
  }

  chrome.runtime.sendMessage({
    type: "download-markdown",
    markdown: lastMarkdown,
    filename: lastFilename,
    clipData: lastClipData
  });
  setStatus("Downloading...", "ok");
});

projectInput.addEventListener("input", filterAndShowDropdown);

projectInput.addEventListener("focus", filterAndShowDropdown);

changeProjectBtn.addEventListener("click", (e) => {
  e.preventDefault();
  // Back to selector mode
  projectSelectorMode.style.display = "block";
  projectConfirmMode.style.display = "none";
  projectInput.focus();
  window.tempProjectSelection = null;
});

confirmProjectBtn.addEventListener("click", (e) => {
  e.preventDefault();
  if (window.tempProjectSelection) {
    selectedProject = window.tempProjectSelection;
    // Confirm is now done, ready for download/copy
    setStatus(`Project "${selectedProject}" selected ✓`, "ok");
    // Keep confirm mode visible to show what's selected
  }
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".project-selector")) {
    projectsDropdown.classList.remove("show");
  }
});

libraryBtn.addEventListener("click", () => {
  chrome.tabs.create({ url: "library.html" });
});

toggleBtn.addEventListener("click", togglePanel);

// Trigger extraction on popup open
window.addEventListener("load", async () => {
  loadProjects();
  // Show dropdown on popup open (empty or with existing projects)
  setTimeout(() => {
    filterAndShowDropdown();
  }, 100);

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    await extractArticle();
  }
});
