/**
 * MCP protocol-level tests for the Revo dictionary server.
 *
 * Uses the SDK's InMemoryTransport to create an in-process client-server pair,
 * then exercises the actual MCP protocol: listTools, callTool, etc.
 */

import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { z } from "zod";
import { lookupInputSchema, handleLookup } from "../src/tools/lookup";
import { handleLanguages } from "../src/tools/languages";
import { closeDb } from "../src/db";

let client: Client;
let server: McpServer;
let clientTransport: InMemoryTransport;
let serverTransport: InMemoryTransport;

beforeAll(async () => {
  // Create server with the same tools as index.ts
  server = new McpServer({
    name: "revo-vortaro-test",
    version: "1.0.0",
  });

  server.tool(
    "lookup",
    "Look up a word in the Reta Vortaro (Esperanto dictionary).",
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

  // Create linked in-memory transport pair
  [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  // Connect both sides
  client = new Client({ name: "test-client", version: "1.0.0" });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
});

afterAll(async () => {
  await client.close();
  await server.close();
  closeDb();
});

// ============================================================
// Protocol-level discovery tests
// ============================================================

describe("MCP Protocol: Tool Discovery", () => {
  test("lists available tools", async () => {
    const result = await client.listTools();
    expect(result.tools).toBeDefined();
    expect(result.tools.length).toBe(2);

    const toolNames = result.tools.map((t) => t.name);
    expect(toolNames).toContain("lookup");
    expect(toolNames).toContain("languages");
  });

  test("lookup tool has correct schema", async () => {
    const result = await client.listTools();
    const lookup = result.tools.find((t) => t.name === "lookup");
    expect(lookup).toBeDefined();
    expect(lookup!.description).toContain("Reta Vortaro");
    expect(lookup!.inputSchema).toBeDefined();

    // Verify schema has expected properties
    const props = (lookup!.inputSchema as any).properties;
    expect(props.query).toBeDefined();
    expect(props.lang).toBeDefined();
    expect(props.limit).toBeDefined();
    expect(props.show_languages).toBeDefined();
  });

  test("languages tool has empty schema", async () => {
    const result = await client.listTools();
    const languages = result.tools.find((t) => t.name === "languages");
    expect(languages).toBeDefined();
    expect(languages!.description).toContain("languages");
  });
});

// ============================================================
// Protocol-level tool execution tests
// ============================================================

describe("MCP Protocol: callTool — Esperanto headword lookup", () => {
  test("looks up 'amiko' via MCP protocol", async () => {
    const result = await client.callTool({
      name: "lookup",
      arguments: { query: "amiko", lang: "eo", limit: 1 },
    });

    expect(result.content).toBeDefined();
    expect(Array.isArray(result.content)).toBe(true);
    expect(result.content.length).toBeGreaterThan(0);

    const text = (result.content[0] as any).text;
    expect(text).toContain("amiko");
    expect(text).toContain("Definitions");
    expect(text).toContain("friend");
    expect(text).toContain("Translations");
  });

  test("looks up 'hundo' with multiple senses", async () => {
    const result = await client.callTool({
      name: "lookup",
      arguments: { query: "hundo", lang: "eo", limit: 1 },
    });

    const text = (result.content[0] as any).text;
    expect(text).toContain("hundo");
    expect(text).toContain("1.");
    expect(text).toContain("2.");
    expect(text).toContain("3.");
    expect(text).toContain("dog");
  });

  test("handles x-system input via protocol", async () => {
    const result = await client.callTool({
      name: "lookup",
      arguments: { query: "cxirkaux", lang: "eo", limit: 1 },
    });

    const text = (result.content[0] as any).text;
    expect(text).toContain("ĉirkaŭ");
  });

  test("handles stemmed forms via protocol", async () => {
    const result = await client.callTool({
      name: "lookup",
      arguments: { query: "amikojn", lang: "eo", limit: 1 },
    });

    const text = (result.content[0] as any).text;
    expect(text).toContain("amiko");
    expect(text).toContain("stem:");
  });
});

describe("MCP Protocol: callTool — Translation lookup", () => {
  test("looks up 'friend' in English via MCP", async () => {
    const result = await client.callTool({
      name: "lookup",
      arguments: { query: "friend", lang: "en", limit: 2 },
    });

    const text = (result.content[0] as any).text;
    expect(text).toContain("amiko");
    expect(text).toContain("translation:en:friend");
  });

  test("looks up 'Hund' in German via MCP", async () => {
    const result = await client.callTool({
      name: "lookup",
      arguments: { query: "Hund", lang: "de", limit: 1 },
    });

    const text = (result.content[0] as any).text;
    expect(text).toContain("hundo");
  });

  test("cross-language search via MCP", async () => {
    const result = await client.callTool({
      name: "lookup",
      arguments: { query: "Hund", lang: "all", limit: 3 },
    });

    const text = (result.content[0] as any).text;
    expect(text).toContain("hundo");
  });
});

describe("MCP Protocol: callTool — show_languages filtering", () => {
  test("filters translations to specific languages", async () => {
    const result = await client.callTool({
      name: "lookup",
      arguments: {
        query: "amiko",
        lang: "eo",
        limit: 1,
        show_languages: ["de", "en"],
      },
    });

    const text = (result.content[0] as any).text;
    // Should contain German and English
    expect(text).toContain("Germana");
    expect(text).toContain("Angla");
    // Should NOT contain French, Spanish, etc.
    expect(text).not.toContain("Franca");
    expect(text).not.toContain("Hispana");
  });
});

describe("MCP Protocol: callTool — languages tool", () => {
  test("lists languages via MCP protocol", async () => {
    const result = await client.callTool({
      name: "languages",
      arguments: {},
    });

    const text = (result.content[0] as any).text;
    expect(text).toContain("Available Languages");
    expect(text).toContain("174");
    expect(text).toContain("en");
    expect(text).toContain("de");
    expect(text).toContain("Angla");
    expect(text).toContain("Germana");
  });
});

describe("MCP Protocol: callTool — edge cases", () => {
  test("non-existent word returns no results", async () => {
    const result = await client.callTool({
      name: "lookup",
      arguments: { query: "xyzzy", lang: "eo", limit: 5 },
    });

    const text = (result.content[0] as any).text;
    expect(text).toBe("No results found.");
    expect(result.isError).toBeFalsy();
  });

  test("empty query returns no results", async () => {
    const result = await client.callTool({
      name: "lookup",
      arguments: { query: " ", lang: "eo", limit: 1 },
    });

    const text = (result.content[0] as any).text;
    expect(text).toBe("No results found.");
  });

  test("default parameters work correctly", async () => {
    // Only required param is query — lang defaults to "eo", limit to 5
    const result = await client.callTool({
      name: "lookup",
      arguments: { query: "amiko" },
    });

    const text = (result.content[0] as any).text;
    expect(text).toContain("amiko");
    expect(text).toContain("Definitions");
  });

  test("multiple results returned correctly", async () => {
    const result = await client.callTool({
      name: "lookup",
      arguments: { query: "friend", lang: "en", limit: 3 },
    });

    const text = (result.content[0] as any).text;
    // Should return multiple results separated by ---
    expect(typeof text).toBe("string");
    expect(text.length).toBeGreaterThan(0);
    expect(text).toContain("amiko");
  });
});

// ============================================================
// Protocol-level response format validation
// ============================================================

describe("MCP Protocol: Response format validation", () => {
  test("lookup returns proper CallToolResult structure", async () => {
    const result = await client.callTool({
      name: "lookup",
      arguments: { query: "amiko", lang: "eo", limit: 1 },
    });

    // Validate response structure
    expect(result).toHaveProperty("content");
    expect(Array.isArray(result.content)).toBe(true);
    expect(result.content.length).toBeGreaterThan(0);

    const item = result.content[0] as any;
    expect(item.type).toBe("text");
    expect(typeof item.text).toBe("string");
  });

  test("languages returns proper CallToolResult structure", async () => {
    const result = await client.callTool({
      name: "languages",
      arguments: {},
    });

    expect(result).toHaveProperty("content");
    expect(result.content.length).toBeGreaterThan(0);

    const item = result.content[0] as any;
    expect(item.type).toBe("text");
    expect(typeof item.text).toBe("string");
  });

  test("result text is valid markdown", async () => {
    const result = await client.callTool({
      name: "lookup",
      arguments: { query: "amiko", lang: "eo", limit: 1 },
    });

    const text = (result.content[0] as any).text as string;
    // Should contain markdown headers
    expect(text).toContain("## ");
    expect(text).toContain("### ");
    // Should contain markdown bold
    expect(text).toContain("**");
  });
});
