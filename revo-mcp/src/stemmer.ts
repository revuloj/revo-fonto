/**
 * Esperanto word stemmer and normalization utilities.
 *
 * Handles:
 * - X-system conversion (cx→ĉ, gx→ĝ, etc.)
 * - H-system conversion (ch→ĉ, gh→ĝ, etc.)
 * - Grammatical ending stripping to find dictionary headwords
 * - Case normalization
 */

const X_SYSTEM_MAP: Record<string, string> = {
  cx: "ĉ",
  gx: "ĝ",
  hx: "ĥ",
  jx: "ĵ",
  sx: "ŝ",
  ux: "ŭ",
  Cx: "Ĉ",
  Gx: "Ĝ",
  Hx: "Ĥ",
  Jx: "Ĵ",
  Sx: "Ŝ",
  Ux: "Ŭ",
  CX: "Ĉ",
  GX: "Ĝ",
  HX: "Ĥ",
  JX: "Ĵ",
  SX: "Ŝ",
  UX: "Ŭ",
};

// Sorted longest-first for correct greedy matching
const X_SYSTEM_PATTERN = /[cCgGhHjJsSuU][xX]/g;

/**
 * Convert x-system text to proper Esperanto Unicode.
 * E.g., "cxirkaux" → "ĉirkaŭ"
 */
export function fromXSystem(text: string): string {
  return text.replace(X_SYSTEM_PATTERN, (match) => X_SYSTEM_MAP[match] ?? match);
}

/**
 * Check if text contains x-system notation.
 */
export function hasXSystem(text: string): boolean {
  return /[cCgGhHjJsSuU][xX]/.test(text);
}

/**
 * Esperanto grammatical endings, ordered from longest to shortest
 * for greedy stripping.
 */
const VERB_ENDINGS = ["anta", "inta", "onta", "ata", "ita", "ota"];
const NOUN_ADJ_ENDINGS_LONG = ["ojn", "ajn"];
const NOUN_ADJ_ENDINGS_MED = ["oj", "aj", "on", "an"];
const VERB_TENSE_ENDINGS = ["as", "is", "os", "us"];
const SHORT_ENDINGS = ["o", "a", "e", "i", "u", "n", "j"];

/**
 * Generate candidate stems from an Esperanto word by stripping grammatical endings.
 *
 * Returns candidates ordered from most-stripped (shortest) to original (longest).
 * E.g., "amikojn" → ["amik", "amiko", "amikoj", "amikojn"]
 *
 * The idea: try the most reduced form first, since dictionary headwords
 * are typically root+o (nouns), root+a (adjectives), root+i (verbs).
 */
export function generateStems(word: string): string[] {
  const lower = word.toLowerCase();
  const stems = new Set<string>();

  // Always include the original word
  stems.add(lower);

  // Try stripping participal endings first (-anta, -inta, etc.)
  for (const ending of VERB_ENDINGS) {
    if (lower.endsWith(ending) && lower.length > ending.length + 2) {
      const root = lower.slice(0, -ending.length);
      stems.add(root + "i"); // verb infinitive
      stems.add(root);
    }
  }

  // Try stripping long compound endings (-ojn, -ajn)
  for (const ending of NOUN_ADJ_ENDINGS_LONG) {
    if (lower.endsWith(ending) && lower.length > ending.length + 2) {
      const base = lower.slice(0, -ending.length);
      stems.add(base);
      stems.add(base + "o"); // noun form
      stems.add(base + "a"); // adjective form
    }
  }

  // Try stripping medium endings (-oj, -aj, -on, -an)
  for (const ending of NOUN_ADJ_ENDINGS_MED) {
    if (lower.endsWith(ending) && lower.length > ending.length + 2) {
      const base = lower.slice(0, -ending.length);
      stems.add(base);
      stems.add(base + "o");
      stems.add(base + "a");
    }
  }

  // Try stripping verb tense endings (-as, -is, -os, -us)
  for (const ending of VERB_TENSE_ENDINGS) {
    if (lower.endsWith(ending) && lower.length > ending.length + 2) {
      const root = lower.slice(0, -ending.length);
      stems.add(root + "i"); // infinitive
      stems.add(root);
    }
  }

  // Try stripping short endings (-o, -a, -e, -i, -u, -n, -j)
  for (const ending of SHORT_ENDINGS) {
    if (lower.endsWith(ending) && lower.length > ending.length + 2) {
      const base = lower.slice(0, -ending.length);
      stems.add(base);
      // For -n (accusative), also try the form without -n
      if (ending === "n") {
        stems.add(base + "o");
        stems.add(base + "a");
      }
    }
  }

  // Sort: shortest stems first (most stripped), original last
  return Array.from(stems).sort((a, b) => a.length - b.length);
}

/**
 * Normalize a query for search: lowercase, convert x-system, trim.
 */
export function normalizeQuery(query: string): string {
  let normalized = query.trim();
  if (hasXSystem(normalized)) {
    normalized = fromXSystem(normalized);
  }
  return normalized.toLowerCase();
}
