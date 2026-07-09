let pendingClipboard = null;

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "article-md-result") {
    if (message.ok) {
      // Store clip data
      if (message.clipData) {
        chrome.storage.local.get("clips", (result) => {
          const clips = result.clips || [];
          clips.push(message.clipData);
          chrome.storage.local.set({ clips });
        });
      }

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

    let filename = message.filename || "article.md";
    if (message.clipData?.project) {
      filename = `Clipped/${message.clipData.project}/${filename}`;
    } else if (message.clipData?.domain) {
      filename = `Clipped/${message.clipData.domain}/${filename}`;
    }

    chrome.downloads.download({
      url: dataUrl,
      filename,
      saveAs: false
    });

    if (message.clipData) {
      chrome.storage.local.get("clips", (result) => {
        const clips = result.clips || [];
        clips.push(message.clipData);
        chrome.storage.local.set({ clips });
      });
    }
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
