#!/usr/bin/env bun
/**
 * MCP server for Reta Vortaro (Esperanto dictionary).
 *
 * Provides lookup tools for Esperanto words, translations, and cross-language search.
 * Uses the pre-built revo.db SQLite database (downloaded via `bun run setup`).
 *
 * Transport: stdio (for use with Claude Desktop, claude CLI, etc.)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { lookupInputSchema, handleLookup } from "./tools/lookup";
import { handleLanguages } from "./tools/languages";
import { closeDb } from "./db";

const server = new McpServer({
  name: "revo-vortaro",
  version: "1.0.0",
});

server.tool(
  "lookup",
  "Look up a word in the Reta Vortaro (Esperanto dictionary). " +
    "Search Esperanto headwords (lang='eo'), translations in a specific language " +
    "(lang='en'/'de'/'fr'/etc.), or across all 174 languages (lang='all'). " +
    "Returns definitions (in Esperanto), examples, translations, and cross-references. " +
    "Supports x-system input (e.g., 'cxirkaux' for 'ĉirkaŭ') and grammatical form stemming " +
    "(e.g., 'amikojn' finds 'amiko').",
  lookupInputSchema.shape,
  async (args) => {
    try {
      const text = handleLookup(args as any);
      return { content: [{ type: "text" as const, text }] };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [{ type: "text" as const, text: `Error: ${message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "languages",
  "List all available languages in the Reta Vortaro dictionary with their translation counts.",
  {},
  async () => {
    try {
      const text = handleLanguages();
      return { content: [{ type: "text" as const, text }] };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [{ type: "text" as const, text: `Error: ${message}` }],
        isError: true,
      };
    }
  }
);

// Clean up on exit
process.on("SIGINT", () => {
  closeDb();
  process.exit(0);
});
process.on("SIGTERM", () => {
  closeDb();
  process.exit(0);
});

const transport = new StdioServerTransport();
await server.connect(transport);
