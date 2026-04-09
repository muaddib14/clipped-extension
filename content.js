// Runs in the page's tab. Extracts article using Readability + Turndown.
(function () {
  try {
    const docClone = document.cloneNode(true);
    const article = new Readability(docClone).parse();

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

    // Convert HTML to Markdown
    const turndownService = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced"
    });
    const markdown = turndownService.turndown(article.content);

    // Build metadata
    const title = article.title || document.title || "article";
    const author = article.byline ? `\nBy: ${article.byline}` : "";
    const meta = `# ${title}${author}\n\nSource: ${location.href}\n\n`;
    const fullMarkdown = meta + markdown;

    // Generate filename
    const safeName = title
      .replace(/[^a-z0-9\-_ ]/gi, "")
      .trim()
      .replace(/\s+/g, "_")
      .substring(0, 60) || "article";

    chrome.runtime.sendMessage({
      type: "article-md-result",
      ok: true,
      markdown: fullMarkdown,
      filename: `${safeName}.md`
    });
  } catch (err) {
    chrome.runtime.sendMessage({
      type: "article-md-result",
      ok: false,
      error: "Error: " + (err.message || "Unknown error")
    });
  }
})();
