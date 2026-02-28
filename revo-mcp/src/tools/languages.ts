/**
 * MCP tool: languages — List available languages in the Revo dictionary.
 */

import { getLanguages } from "../db";
import { languageName } from "../formatter";

export function handleLanguages(): string {
  const languages = getLanguages();

  const lines: string[] = [
    `## Available Languages (${languages.length} total)`,
    "",
    "| Code | Language | Translations |",
    "|------|----------|-------------|",
  ];

  for (const { lng, count } of languages) {
    const name = languageName(lng);
    lines.push(`| ${lng} | ${name} | ${count.toLocaleString()} |`);
  }

  return lines.join("\n");
}
