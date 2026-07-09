// Runs in the page's tab. Extracts article using Readability + Turndown.
(function () {
  try {
    // Early readability detection
    function isPageReadable() {
      const bodyText = document.body.innerText || "";
      const wordCount = bodyText.trim().split(/\s+/).length;

      // Check if page has article-like structure
      const hasArticleTag = !!document.querySelector("article");
      const hasMainTag = !!document.querySelector("main");
      const hasLargeText = wordCount > 300;

      // Check for common non-article patterns
      const url = location.href.toLowerCase();
      const isNotReadable =
        url.includes("twitter.com") ||
        url.includes("facebook.com") ||
        url.includes("instagram.com") ||
        url.includes("/search") ||
        url.includes("/tag/") ||
        document.title.includes("404") ||
        document.title.includes("Search results");

      return (hasArticleTag || hasMainTag || hasLargeText) && !isNotReadable;
    }

    // Send readability status to background
    chrome.runtime.sendMessage({
      type: "page-readability",
      isReadable: isPageReadable()
    });

    // Check for user selection
    const selection = window.getSelection();
    let contentToConvert = null;
    let selectionMode = false;
    let article = null;

    if (selection && selection.toString().trim().length > 0) {
      // User has selected text - use selection instead of full article
      const range = selection.getRangeAt(0);
      const fragment = range.cloneContents();
      const tempDiv = document.createElement("div");
      tempDiv.appendChild(fragment);
      contentToConvert = tempDiv.innerHTML;
      selectionMode = true;
    } else {
      // No selection - use full article
      const docClone = document.cloneNode(true);
      article = new Readability(docClone).parse();

      // Validate extraction
      if (!article) {
        chrome.runtime.sendMessage({
          type: "article-md-result",
          ok: false,
          error: "This page doesn't look like an article."
        });
        return;
      }

      if (!article.content || article.content.trim().length < 200) {
        chrome.runtime.sendMessage({
          type: "article-md-result",
          ok: false,
          error: "Article too short or mostly ads/navigation."
        });
        return;
      }

      contentToConvert = article.content;
    }

    // Convert HTML to Markdown
    const turndownService = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced"
    });
    const markdown = turndownService.turndown(contentToConvert);

    // Build metadata
    let title, author, meta;

    if (selectionMode) {
      title = document.title || "Selection";
      author = "";
      meta = `# ${title}\n\n*(selection from page)*\n\nSource: ${location.href}\n\n`;
    } else {
      title = article.title || document.title || "article";
      author = article.byline ? `\nBy: ${article.byline}` : "";
      meta = `# ${title}${author}\n\nSource: ${location.href}\n\n`;
    }

    const fullMarkdown = meta + markdown;

    // Generate filename
    const safeName = title
      .replace(/[^a-z0-9\-_ ]/gi, "")
      .trim()
      .replace(/\s+/g, "_")
      .substring(0, 60) || "article";

    const domain = new URL(location.href).hostname.replace(/^www\./, "");
    const timestamp = new Date().toISOString().split("T")[0];
    const clipData = {
      id: Date.now(),
      title,
      domain,
      url: location.href,
      markdown: fullMarkdown,
      timestamp,
      project: null
    };

    chrome.runtime.sendMessage({
      type: "article-md-result",
      ok: true,
      markdown: fullMarkdown,
      filename: `${safeName}.md`,
      clipData
    });
  } catch (err) {
    chrome.runtime.sendMessage({
      type: "article-md-result",
      ok: false,
      error: "Error: " + (err.message || "Unknown error")
    });
  }
})();
