const copyBtn = document.getElementById("copyBtn");
const saveBtn = document.getElementById("saveBtn");
const libraryBtn = document.getElementById("libraryBtn");
const status = document.getElementById("status");
const projectInput = document.getElementById("projectInput");
const addProjectBtn = document.getElementById("addProjectBtn");
const projectsList = document.getElementById("projectsList");
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
    const projects = result.projects || [];
    projectsList.innerHTML = projects.map(p => `
      <button class="project-tag" data-project="${p}">${p}</button>
    `).join("");

    document.querySelectorAll(".project-tag").forEach(btn => {
      btn.addEventListener("click", () => selectProject(btn.dataset.project));
    });
  });
}

function selectProject(project) {
  selectedProject = project;
  projectInput.value = project;
  document.querySelectorAll(".project-tag").forEach(b => b.classList.remove("active"));
  document.querySelector(`[data-project="${project}"]`)?.classList.add("active");
}

function addProject() {
  const project = projectInput.value.trim();
  if (!project) return;

  chrome.storage.local.get("projects", (result) => {
    const projects = result.projects || [];
    if (!projects.includes(project)) {
      projects.push(project);
      chrome.storage.local.set({ projects });
    }
    loadProjects();
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
    setStatus("Copied to clipboard!", "ok");
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

addProjectBtn.addEventListener("click", addProject);
projectInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") addProject();
});

libraryBtn.addEventListener("click", () => {
  chrome.tabs.create({ url: "library.html" });
});

toggleBtn.addEventListener("click", togglePanel);

// Trigger extraction on popup open
window.addEventListener("load", async () => {
  loadProjects();
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    await extractArticle();
  }
});
