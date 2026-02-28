/**
 * Formats lookup results as readable Markdown text for MCP tool responses.
 */

import type { LookupResult } from "./db";

const LANGUAGE_NAMES: Record<string, string> = {
  af: "Afrikaans", am: "Amara", ar: "Araba", az: "Azerbajĝana",
  be: "Belarusa", bg: "Bulgara", bn: "Bengala", bo: "Tibeta",
  br: "Bretona", bs: "Bosnia", ca: "Kataluna", co: "Korsika",
  cs: "Ĉeĥa", cy: "Kimra", da: "Dana", de: "Germana",
  el: "Greka", en: "Angla", eo: "Esperanto", es: "Hispana",
  et: "Estona", eu: "Eŭska", fa: "Persa", fi: "Finna",
  fr: "Franca", fy: "Frisa", ga: "Irlanda", gd: "Gaela",
  gl: "Galega", gu: "Guĝarata", ha: "Haŭsa", he: "Hebrea",
  hi: "Hinda", hr: "Kroata", hu: "Hungara", hy: "Armena",
  id: "Indonezia", is: "Islanda", it: "Itala", ja: "Japana",
  jv: "Java", ka: "Kartvela", kk: "Kazaĥa", km: "Kmera",
  kn: "Kanara", ko: "Korea", ku: "Kurda", ky: "Kirgiza",
  la: "Latina", lb: "Luksemburga", lt: "Litova", lv: "Latva",
  mg: "Malagasa", mk: "Makedona", ml: "Malajala", mn: "Mongola",
  mr: "Marata", ms: "Malaja", mt: "Malta", my: "Birma",
  ne: "Nepala", nl: "Nederlanda", no: "Norvega", oc: "Okcitana",
  pa: "Panĝaba", pl: "Pola", ps: "Paŝtua", pt: "Portugala",
  qu: "Keĉua", rm: "Romanĉa", ro: "Rumana", ru: "Rusa",
  rw: "Ruanda", sa: "Sanskrita", sd: "Sinda", si: "Sinhala",
  sk: "Slovaka", sl: "Slovena", so: "Somala", sq: "Albana",
  sr: "Serba", sv: "Sveda", sw: "Svahila", ta: "Tamila",
  te: "Telugua", tg: "Taĝika", th: "Taja", tk: "Turkmena",
  tl: "Filipina", tr: "Turka", tt: "Tatara", ug: "Ujgura",
  uk: "Ukraina", ur: "Urdua", uz: "Uzbeka", vi: "Vjetnama",
  xh: "Ksosa", yi: "Jida", yo: "Joruba", zh: "Ĉina",
  zu: "Zulua", sgn: "Signolingvo",
};

export function languageName(code: string): string {
  return LANGUAGE_NAMES[code] ?? code;
}

/**
 * Format a set of lookup results as markdown.
 */
export function formatResults(
  results: LookupResult[],
  showLanguages?: string[]
): string {
  if (results.length === 0) {
    return "No results found.";
  }

  const parts: string[] = [];

  for (const result of results) {
    parts.push(formatSingleResult(result, showLanguages));
  }

  return parts.join("\n\n---\n\n");
}

function formatSingleResult(
  result: LookupResult,
  showLanguages?: string[]
): string {
  const lines: string[] = [];

  // Header
  lines.push(`## ${result.headword}`);
  if (result.matchedVia) {
    lines.push(`*Matched via: ${result.matchedVia}*`);
  }

  // Usage domains
  if (result.usageDomains.length > 0) {
    lines.push(`**Domain:** ${result.usageDomains.join(", ")}`);
  }

  // Definitions
  if (result.senses.length > 0) {
    lines.push("");
    lines.push("### Definitions");
    for (const sense of result.senses) {
      const prefix = sense.num ? `**${sense.num}** ` : "";
      const domain = sense.domain ? ` *(${sense.domain})*` : "";

      if (sense.definition) {
        lines.push(`${prefix}${sense.definition}${domain}`);
      }

      // Examples
      if (sense.examples.length > 0) {
        for (const ex of sense.examples.slice(0, 3)) {
          lines.push(`  - *${ex}*`);
        }
        if (sense.examples.length > 3) {
          lines.push(`  - *(${sense.examples.length - 3} more examples...)*`);
        }
      }
      lines.push("");
    }
  }

  // Translations
  const translations = filterTranslations(result.translations, showLanguages);
  if (translations.length > 0) {
    lines.push("### Translations");
    // Group by language
    const byLang = new Map<string, string[]>();
    for (const t of translations) {
      const existing = byLang.get(t.lng) ?? [];
      existing.push(t.trd);
      byLang.set(t.lng, existing);
    }

    for (const [lng, trds] of byLang) {
      const uniqueTrds = [...new Set(trds)];
      const name = languageName(lng);
      lines.push(`- **${name}** (${lng}): ${uniqueTrds.join(", ")}`);
    }
  }

  // Cross-references
  const meaningfulRefs = result.crossRefs.filter(
    (r) => r.targetKap && r.type !== "super"
  );
  if (meaningfulRefs.length > 0) {
    lines.push("");
    lines.push("### See also");
    for (const ref of meaningfulRefs.slice(0, 5)) {
      const typeLabel = refTypeLabel(ref.type);
      lines.push(`- ${typeLabel}: ${ref.targetKap}`);
    }
  }

  return lines.join("\n");
}

function filterTranslations(
  translations: { lng: string; trd: string }[],
  showLanguages?: string[]
): { lng: string; trd: string }[] {
  if (!showLanguages || showLanguages.length === 0) {
    // Show a default set of common languages
    const defaultLangs = ["en", "de", "fr", "es", "ru", "zh", "ja"];
    return translations.filter((t) => defaultLangs.includes(t.lng));
  }
  return translations.filter((t) => showLanguages.includes(t.lng));
}

function refTypeLabel(type: string): string {
  switch (type) {
    case "vid": return "See";
    case "sin": return "Synonym";
    case "ant": return "Antonym";
    case "dif": return "Differs from";
    case "super": return "Broader";
    case "sub": return "Narrower";
    case "prt": return "Part of";
    case "hom": return "Homonym";
    case "malprt": return "Contains";
    default: return type;
  }
}
