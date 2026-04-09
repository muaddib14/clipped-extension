const copyBtn = document.getElementById("copyBtn");
const saveBtn = document.getElementById("saveBtn");
const status = document.getElementById("status");
let lastMarkdown = null;
let lastFilename = null;

function setStatus(text, cls) {
  status.textContent = text;
  status.className = "status" + (cls ? " " + cls : "");
}

function disableButtons(state) {
  copyBtn.disabled = state;
  saveBtn.disabled = state;
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "article-md-result") {
    disableButtons(false);
    if (message.ok) {
      lastMarkdown = message.markdown;
      lastFilename = message.filename;
      setStatus("Ready to copy or download", "ok");
    } else {
      lastMarkdown = null;
      lastFilename = null;
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
  chrome.runtime.sendMessage({
    type: "download-markdown",
    markdown: lastMarkdown,
    filename: lastFilename
  });
  setStatus("Downloading...", "ok");
});

// Trigger extraction on popup open
window.addEventListener("load", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    await extractArticle();
  }
});
