let pendingClipboard = null;

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "article-md-result") {
    if (message.ok) {
      // If keyboard shortcut triggered, copy to clipboard
      if (pendingClipboard) {
        navigator.clipboard.writeText(message.markdown).then(() => {
          chrome.notifications.create({
            type: "basic",
            iconUrl: "icons/icon48.png",
            title: "Article extracted!",
            message: "Markdown copied to clipboard"
          });
          pendingClipboard = null;
        });
      }
    } else {
      if (pendingClipboard) {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icons/icon48.png",
          title: "Error",
          message: message.error || "Could not extract article"
        });
        pendingClipboard = null;
      }
    }
  }

  if (message.type === "download-markdown") {
    const dataUrl =
      "data:text/markdown;charset=utf-8," + encodeURIComponent(message.markdown);
    chrome.downloads.download({
      url: dataUrl,
      filename: message.filename || "article.md",
      saveAs: false
    });
  }
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener((command) => {
  if (command === "extract-article") {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (!tabs[0]?.id) return;
      pendingClipboard = true;
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ["lib/Readability.js", "lib/turndown.js", "content.js"]
        });
      } catch (err) {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icons/icon48.png",
          title: "Error",
          message: "Can't run on this page: " + err.message
        });
        pendingClipboard = null;
      }
    });
  }
});
