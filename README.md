![Clipped](/icons/banner.jpeg)

# Clipped 📎
### v0.0.6 — Organize & Extract

**Your browser reads it. Now let your AI read it too.**

---

## The problem

You read something good. A deep-dive article, a research post, a thread someone turned into a blog. You open Claude to talk about it — and paste the link.

Claude can't see it. The page is JS-rendered, or paywalled, or just structured in a way that breaks every scraper. So you end up copy-pasting a wall of unformatted text, dragging in nav junk and ads and cookie banners, and your AI gives you a half-informed answer because it's working with garbage input.

**AI is only as sharp as the context you feed it. Clipped fixes the input.**

---

## What it does

One click. Any article. Clean markdown — ready to paste into Claude, drop into Notion, or save to Obsidian.

Organize clips by project. Search your clip history. Works entirely offline.

No servers. No accounts. Nothing leaves your machine.

---

## Features (v0.0.6)

| | |
|---|---|
| ⌨️ **Keyboard shortcut** | `Alt+Shift+M` on any article — markdown copies to clipboard instantly |
| 📋 **Copy to clipboard** | One click with auto-copy badge notification |
| 💾 **Download as .md** | Article title, source URL, clean body text — saved as a file |
| 📁 **Project tagging** | Organize clips into folders by topic as you save |
| 🔍 **Clip library** | Search and browse all past clips, organized by project |
| ✂️ **Selection clipping** | Highlight text to clip just a selection, not the whole page |
| 🚫 **Readerable detection** | Icon greys out on non-article pages (dashboards, search results, social media) |
| 🔒 **Local processing** | Readability.js + Turndown run in your browser, nothing transmitted |
| ✨ **Smart cleanup** | Strips nav, ads, comments, tracking scripts — keeps only what matters |

---

## Install — 30 seconds

> No Chrome Web Store yet. Load it unpacked in dev mode — takes less time than making coffee.

1. Download `clipped-v0.0.6.zip` from [GitHub releases](https://github.com/muaddib14/clipped-extension/releases/latest)
2. Unzip somewhere permanent (Chrome reads from this folder live — don't delete it after installing)
3. Go to `chrome://extensions` in Chrome
4. Turn on **Developer mode** (top-right toggle)
5. Click **Load unpacked** → select the unzipped folder
6. Pin it: puzzle-piece icon in toolbar → pin **Clipped**

Works on Chrome, Brave, Edge, and other Chromium browsers.

---

## Use it

**Fastest — keyboard shortcut:**
1. Open any article
2. Press `Alt+Shift+M`
3. Markdown is in your clipboard. Paste into Claude (`Ctrl+V`)

**Copy to clipboard with project:**
1. Open any article
2. Click the Clipped icon → **Copy to Clipboard**
3. Choose a project folder (or create a new one)
4. Green ✓ badge confirms copy succeeded
5. Paste into Claude

**Download as file:**
1. Open any article
2. Click the Clipped icon → **Download as .md**
3. File saves to `Downloads/Clipped/[project]/article.md`

**Clip just a selection:**
1. Highlight text on any article
2. Click the Clipped icon
3. Only your selection extracts (not the whole page)

**Browse clip history:**
1. Click the Clipped icon → **Library**
2. Browse by project folder or search across all clips
3. Click any clip to copy it again

---

## How it works

Clipped uses two battle-tested open source libraries, bundled locally:

- **[Readability.js](https://github.com/mozilla/readability)** — Mozilla's article extraction library. The same one powering Firefox Reader Mode. Strips nav, ads, sidebars, and comment sections. Keeps the article.
- **[Turndown](https://github.com/mixmark-io/turndown)** — Converts the clean HTML into proper Markdown. Headings, lists, code blocks — all preserved.

Both run entirely in your browser tab. No CDN calls. Works offline. Your reading stays yours.

---

## Changelog

**v0.0.6** — Fixed keyboard shortcut (`Alt+Shift+M`) silently failing to copy on some pages. Clipboard write now runs in the active tab's context instead of the background service worker, which lacked the document focus needed for the Clipboard API to work reliably.

---

## Limitations

- **Paywalled content you can't see** — Clipped extracts what's visible to you. It's not a paywall bypass.
- **Strict CSP pages** — Some sites block external script injection. You'll get a clear error message in the popup if this happens.
- **Unusual layouts** — Pages Readability can't parse (heavy SPAs, dashboards, some news sites) may return incomplete content.
- **JavaScript-heavy pages** — Infinite scroll or lazy-loaded content only includes what's already rendered when you click the icon.

---

## Roadmap

**v0.1 (planned):**
- [ ] Clip history in popup (last 10 clips)
- [ ] Word count & reading time metadata
- [ ] Right-click context menu option

**Future:**
- [ ] Chrome Web Store listing
- [ ] Options page — customize default action, keyboard shortcut
- [ ] Firefox support
- [ ] "Send to Claude" direct integration
- [ ] YouTube transcript extraction

---

## Built with

- [Mozilla Readability](https://github.com/mozilla/readability)
- [Turndown](https://github.com/mixmark-io/turndown)
- Chrome Extensions Manifest V3

---

*Clipped is free and open. If it's useful, share it.*
