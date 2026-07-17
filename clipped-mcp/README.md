# clipped-mcp

An [MCP](https://modelcontextprotocol.io) server that lets Claude read your [Clipped](..) article library directly inside a conversation — no copy-paste, no file drag-in.

Ask Claude: *"What have I read about context engineering this month?"* — Claude calls `search_clips`, pulls your actual saved articles, and answers from them.

100% local. No network calls. No accounts. The server only reads a JSON file on your own machine.

---

## How it works

1. You clip articles as usual with the Clipped browser extension.
2. When you want Claude to see your library, open the extension's **Library** view and click the export button (top-right, download icon). This saves `Clipped/clipped-library.json` to your Downloads folder.
3. Claude Desktop runs this MCP server locally. The server reads that JSON file and exposes it as tools Claude can call.
4. Re-export any time you want Claude to see newly clipped articles — the server always reads the file fresh, no restart needed.

There's no live sync in v1. It's export → Claude can see it, repeat when you clip more. Still miles better than manual copy-paste.

---

## Install

Add this to your Claude Desktop config file:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "clipped": {
      "command": "npx",
      "args": ["-y", "clipped-mcp"]
    }
  }
}
```

Restart Claude Desktop. You should see "clipped" listed under the connector/MCP icon in a new conversation.

### Custom library location

By default the server looks for `~/Downloads/Clipped/clipped-library.json` (matching where the extension saves it). If you moved the file, point the server at it explicitly:

```json
{
  "mcpServers": {
    "clipped": {
      "command": "npx",
      "args": ["-y", "clipped-mcp"],
      "env": {
        "CLIPPED_LIBRARY_PATH": "/absolute/path/to/clipped-library.json"
      }
    }
  }
}
```

---

## Tools exposed

| Tool | What it does |
|---|---|
| `search_clips(query)` | Full-text search across clip titles, projects, and body. Returns matching summaries with a snippet. |
| `get_clip(id)` | Returns the full markdown content and metadata of one clip. |
| `list_projects()` | Lists your project/folder names with clip counts, so a search can be scoped ("what have I clipped about Solana research?"). |
| `list_recent_clips(limit)` | Returns the N most recently saved clips, newest first. |

Claude decides when to call these based on what you ask — you don't call them directly.

---

## Non-goals (v1)

- No cloud sync, no auth, no multi-device support — reads one local file.
- Claude can only **read** clips through this server. It doesn't create, edit, or delete anything in your library.
- No summarization or processing happens inside the server — it returns raw clip content and lets Claude do the reasoning. Keeps the server small and predictable.

---

## Troubleshooting

**Claude says it can't find your library / tool returns an error mentioning the file path:**
Open the Clipped extension's Library and click the export button. The server needs that JSON file to exist before it can read anything.

**You exported but Claude still doesn't see new clips:**
Every tool call reads the file fresh — no caching. Confirm the export actually landed in `Downloads/Clipped/clipped-library.json` (or your `CLIPPED_LIBRARY_PATH`), and that you exported *after* clipping the new articles.

**Server doesn't show up in Claude Desktop at all:**
Check your config JSON is valid (no trailing commas), and that you fully restarted Claude Desktop after editing it.

---

## Local development

```bash
cd clipped-mcp
npm install
node index.js
```

The server speaks MCP over stdio — it won't print anything on its own. Test it by pointing a local Claude Desktop config at `node /absolute/path/to/clipped-mcp/index.js` instead of the `npx` command above.
