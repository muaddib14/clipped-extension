![Clipped](/icons/banner.jpeg)

# Clipped 📎
### v0.0.1 — Early Access

**Your browser reads it. Now let your AI read it too.**

---

## The problem

You read something good. A deep-dive article, a research post, a thread someone turned into a blog. You open Claude to talk about it — and paste the link.

Claude can't see it. The page is JS-rendered, or paywalled, or just structured in a way that breaks every scraper. So you end up copy-pasting a wall of unformatted text, dragging in nav junk and ads and cookie banners, and your AI gives you a half-informed answer because it's working with garbage input.

**AI is only as sharp as the context you feed it. Clipped fixes the input.**

---

## What it does

One click. Any article. Clean markdown — ready to paste into Claude, drop into Notion, or save to Obsidian.

No servers. No accounts. Nothing leaves your machine.

---

## Features (v0.0.1)

| | |
|---|---|
| ⌨️ **Keyboard shortcut** | `Alt+Shift+M` on any article — markdown copies to clipboard instantly |
| 📋 **Copy to clipboard** | One click, paste straight into Claude |
| 💾 **Download as .md** | Article title, source URL, clean body text — saved as a file |
| 🔒 **Local processing** | Readability.js + Turndown run in your browser, nothing transmitted |
| ⚠️ **Error handling** | Clear message when a page can't be parsed, no silent failures |

---

## Install — 30 seconds

> No Chrome Web Store yet. Load it unpacked in dev mode — takes less time than making coffee.

1. Unzip `clipped-v0.0.1.zip` somewhere permanent (Chrome reads from this folder live — don't delete it after installing).
2. Go to `chrome://extensions` in Chrome.
3. Turn on **Developer mode** (top-right toggle).
4. Click **Load unpacked** → select the unzipped `extension` folder.
5. Pin it: puzzle-piece icon in toolbar → pin **Clipped**.

---

## Use it

**Fastest — keyboard shortcut:**
1. Open any article.
2. Press `Alt+Shift+M`.
3. Markdown is in your clipboard. Paste into Claude (`Ctrl+V`).

**Copy to clipboard:**
1. Open any article.
2. Click the Clipped icon → **Copy to Clipboard**.
3. Paste into Claude.

**Download as file:**
1. Open any article.
2. Click the Clipped icon → **Download as .md**.
3. Drag the file into Claude.

---

## How it works

Clipped uses two battle-tested open source libraries, bundled locally:

- **[Readability.js](https://github.com/mozilla/readability)** — Mozilla's article extraction library. The same one powering Firefox Reader Mode. Strips nav, ads, sidebars, and comment sections. Keeps the article.
- **[Turndown](https://github.com/mixmark-io/turndown)** — Converts the clean HTML into proper Markdown. Headings, lists, code blocks — all preserved.

Both run entirely in your browser tab. No CDN calls. Works offline. Your reading stays yours.

---

## Limitations

- **Paywalled content you can't see** — Clipped extracts what's visible to you. It's not a paywall bypass.
- **Strict CSP pages** — Some sites block external script injection. You'll get a clear error message in the popup if this happens.
- **Unusual layouts** — Pages Readability can't parse (heavy SPAs, dashboards, some news sites) may return incomplete content.

---

## Roadmap

- [ ] Chrome Web Store listing
- [ ] Auto-detect non-article pages (grey out button on dashboards/homepages)
- [ ] Options page — choose default action (clipboard vs. download)
- [ ] Firefox support
- [ ] "Send to Claude" direct integration

---

## Known issues in v0.0.1

- Keyboard shortcut (`Alt+Shift+M`) may need manual re-registration on first install — open the popup once to initialize.
- No visual indicator when clipboard copy succeeds on some Linux distros.

---

## Built with

- [Mozilla Readability](https://github.com/mozilla/readability)
- [Turndown](https://github.com/mixmark-io/turndown)
- Chrome Extensions Manifest V3

---

*Clipped is free and open. If it's useful, share it.*
