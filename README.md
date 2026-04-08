# Clipped — Chrome Extension (v0.0.1 — Early)

Your browser reads it. Now let your AI read it too.

Extract any article to clean markdown. Works with paywalls, messy HTML, JS-heavy sites. Paste into Claude, Notion, Obsidian, or any note app.

**v0.0.1 features:**
- Copy to clipboard (paste straight into Claude)
- Download as markdown file
- Local processing (nothing leaves your machine)
- Error handling for unsupported pages

## Install (unpacked, dev mode — takes 30 seconds)

1. Unzip `clipped-v0.0.1.zip` somewhere permanent (don't delete the folder after installing — Chrome loads the extension from it live).
2. Open Chrome and go to `chrome://extensions`.
3. Turn on **Developer mode** (top-right toggle).
4. Click **Load unpacked**.
5. Select the unzipped `extension` folder.
6. Pin it: click the puzzle-piece icon in Chrome's toolbar, then the pin next to "Clipped".

## Use

**Option A: Keyboard Shortcut (fastest)**
1. Press `Alt+Shift+M` on any article
2. Markdown copies to clipboard automatically
3. Paste into Claude (Ctrl+V)

**Option B: Copy to Clipboard**
1. Open any article
2. Click extension icon → **Copy to Clipboard**
3. Paste into Claude (Ctrl+V)

**Option C: Download as File**
1. Open any article
2. Click extension icon → **Download as .md**
3. A `.md` file downloads with article title, source URL, and clean text
4. Drag file into Claude

## How it works

- **Readability.js** (Mozilla's library, same one behind Firefox Reader Mode) strips the page down to just the article content.
- **Turndown** converts that HTML into clean Markdown.
- Both are bundled locally in `lib/` — no CDN calls, works offline, nothing leaves your machine except the download itself.

## Limitations

- Won't work on paywalled content you can't already see, or pages with unusual layouts Readability can't parse.
- Some sites with strict Content Security Policies may block script injection — you'll see an error in the popup if so.

## Publishing to Chrome Web Store

Roadmap:
- Privacy policy page
- Chrome Web Store listing + screenshots
- Keyboard shortcut (`Alt+Shift+M` WIP)
- Auto-detect "readerable" pages

Known limitations in v0.0.1:
- Keyboard shortcut not yet reliable (MV3 registration issue)
- No keyboard shortcut auto-detection
- CSP-blocked pages show generic error
