#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const DEFAULT_PATH = path.join(os.homedir(), "Downloads", "Clipped", "clipped-library.json");
const LIBRARY_PATH = process.env.CLIPPED_LIBRARY_PATH || DEFAULT_PATH;

function loadLibrary() {
  if (!fs.existsSync(LIBRARY_PATH)) {
    throw new Error(
      `No exported library found at ${LIBRARY_PATH}. Open the Clipped extension's Library, click "Export for Claude," and try again.`
    );
  }

  let raw;
  try {
    raw = fs.readFileSync(LIBRARY_PATH, "utf-8");
  } catch (err) {
    throw new Error(`Could not read library file at ${LIBRARY_PATH}: ${err.message}`);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `Library file at ${LIBRARY_PATH} is not valid JSON (${err.message}). Re-export it from the Clipped extension.`
    );
  }

  if (!data || !Array.isArray(data.clips)) {
    throw new Error(
      `Library file at ${LIBRARY_PATH} doesn't look like a Clipped export (missing "clips" array). Re-export it from the Clipped extension.`
    );
  }

  return data.clips;
}

function folderName(clip) {
  return clip.project || clip.domain || "Uncategorized";
}

function snippet(markdown, query) {
  if (!markdown) return "";
  const idx = query ? markdown.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (idx === -1) return markdown.slice(0, 200).trim() + (markdown.length > 200 ? "…" : "");
  const start = Math.max(0, idx - 80);
  const end = Math.min(markdown.length, idx + query.length + 80);
  return (start > 0 ? "…" : "") + markdown.slice(start, end).trim() + (end < markdown.length ? "…" : "");
}

function summarize(clip, query) {
  return {
    id: clip.id,
    title: clip.title,
    url: clip.url,
    domain: clip.domain,
    project: clip.project || null,
    tags: clip.tags || [],
    timestamp: clip.timestamp,
    snippet: snippet(clip.markdown, query)
  };
}

const server = new McpServer({
  name: "clipped-mcp",
  version: "1.0.0"
});

server.registerTool(
  "search_clips",
  {
    title: "Search Clipped library",
    description: "Full-text search across the user's saved Clipped articles (title, project, tags, and body). Returns matching clip summaries with a snippet.",
    inputSchema: {
      query: z.string().describe("Search text to match against clip titles, projects, tags, and markdown content")
    }
  },
  async ({ query }) => {
    try {
      const clips = loadLibrary();
      const q = query.toLowerCase();
      const matches = clips.filter(
        (c) =>
          (c.title || "").toLowerCase().includes(q) ||
          (c.markdown || "").toLowerCase().includes(q) ||
          folderName(c).toLowerCase().includes(q) ||
          (c.tags || []).some((t) => t.toLowerCase().includes(q))
      );
      const results = matches.map((c) => summarize(c, query));
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
      };
    } catch (err) {
      return { content: [{ type: "text", text: err.message }], isError: true };
    }
  }
);

server.registerTool(
  "get_clip",
  {
    title: "Get a clip's full content",
    description: "Returns the full markdown content and metadata of a single saved clip, by id.",
    inputSchema: {
      id: z.union([z.string(), z.number()]).describe("The clip id, as returned by search_clips or list_recent_clips")
    }
  },
  async ({ id }) => {
    try {
      const clips = loadLibrary();
      const clip = clips.find((c) => String(c.id) === String(id));
      if (!clip) {
        return { content: [{ type: "text", text: `No clip found with id ${id}.` }], isError: true };
      }
      return { content: [{ type: "text", text: JSON.stringify(clip, null, 2) }] };
    } catch (err) {
      return { content: [{ type: "text", text: err.message }], isError: true };
    }
  }
);

server.registerTool(
  "list_projects",
  {
    title: "List Clipped project folders",
    description: "Returns the list of project/folder names in the user's Clipped library, with clip counts, so a search can be scoped to a topic.",
    inputSchema: {}
  },
  async () => {
    try {
      const clips = loadLibrary();
      const counts = {};
      clips.forEach((c) => {
        const name = folderName(c);
        counts[name] = (counts[name] || 0) + 1;
      });
      const projects = Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name));
      return { content: [{ type: "text", text: JSON.stringify(projects, null, 2) }] };
    } catch (err) {
      return { content: [{ type: "text", text: err.message }], isError: true };
    }
  }
);

server.registerTool(
  "list_recent_clips",
  {
    title: "List recent clips",
    description: "Returns the N most recently saved clips, newest first.",
    inputSchema: {
      limit: z.number().int().positive().max(100).default(10).describe("Max number of clips to return (default 10)")
    }
  },
  async ({ limit }) => {
    try {
      const clips = loadLibrary();
      const sorted = [...clips].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const results = sorted.slice(0, limit ?? 10).map((c) => summarize(c));
      return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
    } catch (err) {
      return { content: [{ type: "text", text: err.message }], isError: true };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
