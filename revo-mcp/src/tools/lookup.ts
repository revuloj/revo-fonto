/**
 * MCP tool: lookup — Search the Reta Vortaro (Esperanto dictionary).
 */

import { z } from "zod";
import {
  lookupEsperanto,
  lookupTranslation,
  lookupAllLanguages,
} from "../db";
import { formatResults } from "../formatter";
import { hasXSystem, fromXSystem } from "../stemmer";

export const lookupInputSchema = z.object({
  query: z
    .string()
    .min(1)
    .max(200)
    .describe("The word or phrase to look up"),
  lang: z
    .string()
    .default("eo")
    .describe(
      "Language to search in. Use 'eo' for Esperanto headwords (default), " +
      "'en'/'de'/'fr'/etc. for translation lookups, or 'all' to search across all languages."
    ),
  show_languages: z
    .array(z.string())
    .optional()
    .describe(
      "Which translation languages to show in results (e.g. ['en', 'de']). " +
      "If omitted, shows a default set (en, de, fr, es, ru, zh, ja)."
    ),
  limit: z
    .number()
    .int()
    .min(1)
    .max(20)
    .default(5)
    .describe("Maximum number of results to return (1-20)"),
});

export type LookupInput = z.infer<typeof lookupInputSchema>;

export function handleLookup(args: LookupInput): string {
  let { query, lang, show_languages, limit } = args;

  // Convert x-system if present
  if (hasXSystem(query)) {
    query = fromXSystem(query);
  }

  let results;

  if (lang === "eo") {
    results = lookupEsperanto(query, limit);
  } else if (lang === "all") {
    results = lookupAllLanguages(query, limit);
  } else {
    results = lookupTranslation(query, lang, limit);
  }

  return formatResults(results, show_languages);
}
