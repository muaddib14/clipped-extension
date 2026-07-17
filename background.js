let pendingClipboard = null;
let currentTabReadable = true;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "page-readability") {
    currentTabReadable = message.isReadable;
    if (!currentTabReadable) {
      chrome.action.setTitle({ title: "This page doesn't look like an article" });
    } else {
      chrome.action.setTitle({ title: "Clip this article" });
    }
  }
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
        const tabId = pendingClipboard.tabId;
        chrome.scripting.executeScript({
          target: { tabId },
          func: (text) => navigator.clipboard.writeText(text),
          args: [message.markdown]
        }).then(() => {
          chrome.notifications.create({
            type: "basic",
            iconUrl: "icons/icon48.png",
            title: "✓ Copied to clipboard!",
            message: "Ready to paste into Claude"
          });

          // Badge notification on icon
          chrome.action.setBadgeText({ text: "✓" });
          chrome.action.setBadgeBackgroundColor({ color: "#6fd08c" });
          setTimeout(() => {
            chrome.action.setBadgeText({ text: "" });
          }, 2000);

          pendingClipboard = null;
        }).catch((err) => {
          chrome.notifications.create({
            type: "basic",
            iconUrl: "icons/icon48.png",
            title: "Copy failed",
            message: err.message || "Could not write to clipboard"
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

  if (message.type === "export-library") {
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      clips: (message.clips || []).map((c) => ({
        id: c.id,
        title: c.title,
        domain: c.domain,
        url: c.url,
        project: c.project || null,
        tags: c.tags || [],
        timestamp: c.timestamp,
        markdown: c.markdown
      }))
    };

    const dataUrl =
      "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));

    chrome.downloads.download({
      url: dataUrl,
      filename: "Clipped/clipped-library.json",
      saveAs: false
    });

    sendResponse({ ok: true });
    return true;
  }

  if (message.type === "download-digest") {
    const dataUrl = "data:text/markdown;charset=utf-8," + encodeURIComponent(message.markdown);
    chrome.downloads.download({
      url: dataUrl,
      filename: `Clipped/digests/${message.filename}`,
      saveAs: false
    });
    return;
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
    if (!currentTabReadable) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: "Not an article",
        message: "This page doesn't look like an article. Try a blog post, news page, or news article."
      });
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (!tabs[0]?.id) return;
      pendingClipboard = { tabId: tabs[0].id };
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
