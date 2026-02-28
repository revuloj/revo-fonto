/**
 * Database connection and query functions for the Revo dictionary.
 *
 * Queries the pre-built revo.db (augmented with FTS5 indexes by setup.ts).
 * Supports:
 * - Esperanto headword lookup (exact, prefix, stemmed, FTS)
 * - Translation lookup by language (exact, FTS)
 * - Cross-language search
 */

import { Database } from "bun:sqlite";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { generateStems, normalizeQuery, fromXSystem, hasXSystem } from "./stemmer";
import { extractArticle, extractByMrk, type DrvEntry } from "./html-extract";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, "..", "data", "revo.db");

export interface NodoRow {
  mrk: string;
  art: string;
  kap: string;
  num: string | null;
}

export interface TradukoRow {
  mrk: string;
  lng: string;
  trd: string;
  txt: string | null;
}

export interface LookupResult {
  headword: string;
  article: string;
  mrk: string;
  senses: {
    num?: string;
    definition: string;
    examples: string[];
    domain?: string;
  }[];
  translations: { lng: string; trd: string }[];
  crossRefs: { target: string; type: string; targetKap?: string }[];
  usageDomains: string[];
  matchedVia?: string; // How the result was found (e.g., "stem:amik", "translation:en:friend")
}

let _db: Database | null = null;

export function getDb(): Database {
  if (!_db) {
    _db = new Database(DB_PATH, { readonly: true });
    _db.exec("PRAGMA cache_size = -64000"); // 64MB cache
  }
  return _db;
}

export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}

/**
 * Look up an Esperanto word. Tries in order:
 * 1. Exact match on nodo.kap
 * 2. Variant match on var.kap
 * 3. Stemmed matches (strip grammatical endings)
 * 4. FTS5 prefix search
 */
export function lookupEsperanto(
  query: string,
  limit: number = 5
): LookupResult[] {
  const db = getDb();
  let normalized = normalizeQuery(query);

  if (normalized.length === 0) return [];

  // 1. Exact match
  let nodes = db
    .query<NodoRow, [string]>(
      "SELECT DISTINCT mrk, art, kap, num FROM nodo WHERE lower(kap) = ? ORDER BY length(mrk)"
    )
    .all(normalized);

  if (nodes.length > 0) {
    return assembleResults(nodes, limit);
  }

  // 2. Variant match
  const variants = db
    .query<{ mrk: string; kap: string }, [string]>(
      "SELECT mrk, kap FROM var WHERE lower(kap) = ?"
    )
    .all(normalized);

  if (variants.length > 0) {
    const mrks = variants.map((v) => v.mrk);
    nodes = db
      .query<NodoRow, []>(
        `SELECT DISTINCT mrk, art, kap, num FROM nodo WHERE mrk IN (${mrks
          .map(() => "?")
          .join(",")}) ORDER BY length(mrk)`
      )
      .all(...(mrks as []));

    if (nodes.length > 0) {
      return assembleResults(nodes, limit);
    }
  }

  // 3. Stemmed matches
  const stems = generateStems(normalized);
  for (const stem of stems) {
    if (stem === normalized) continue; // Already tried
    nodes = db
      .query<NodoRow, [string]>(
        "SELECT DISTINCT mrk, art, kap, num FROM nodo WHERE lower(kap) = ? ORDER BY length(mrk)"
      )
      .all(stem);

    if (nodes.length > 0) {
      const results = assembleResults(nodes, limit);
      for (const r of results) r.matchedVia = `stem:${stem}`;
      return results;
    }
  }

  // 4. Prefix match
  nodes = db
    .query<NodoRow, [string, number]>(
      "SELECT DISTINCT mrk, art, kap, num FROM nodo WHERE lower(kap) LIKE ? || '%' ORDER BY length(kap), kap LIMIT ?"
    )
    .all(normalized, limit * 5);

  if (nodes.length > 0) {
    const results = assembleResults(nodes, limit);
    for (const r of results) r.matchedVia = `prefix:${normalized}`;
    return results;
  }

  // 5. FTS5 fallback
  try {
    const ftsRows = db
      .query<{ kap: string; rowid: number }, [string]>(
        `SELECT kap, rowid FROM fts_kap WHERE kap MATCH ? || '*' LIMIT ?`
      )
      .all(normalized);

    if (ftsRows.length > 0) {
      const kaps = [...new Set(ftsRows.map((r) => r.kap.toLowerCase()))];
      const allNodes: NodoRow[] = [];
      for (const kap of kaps.slice(0, limit)) {
        const n = db
          .query<NodoRow, [string]>(
            "SELECT DISTINCT mrk, art, kap, num FROM nodo WHERE lower(kap) = ? ORDER BY length(mrk)"
          )
          .all(kap);
        allNodes.push(...n);
      }
      if (allNodes.length > 0) {
        const results = assembleResults(allNodes, limit);
        for (const r of results) r.matchedVia = `fts:${normalized}`;
        return results;
      }
    }
  } catch {
    // FTS query might fail with special characters — ignore
  }

  return [];
}

/**
 * Look up a word in a specific translation language.
 */
export function lookupTranslation(
  query: string,
  lang: string,
  limit: number = 5
): LookupResult[] {
  const db = getDb();
  const normalized = query.trim().toLowerCase();

  if (normalized.length === 0) return [];

  // 1. Exact match
  let trds = db
    .query<TradukoRow, [string, string]>(
      "SELECT mrk, lng, trd, txt FROM traduko WHERE lng = ? AND lower(trd) = ? LIMIT 50"
    )
    .all(lang, normalized);

  if (trds.length === 0) {
    // 2. FTS match
    try {
      const ftsRows = db
        .query<{ trd: string; rowid: number }, [string]>(
          `SELECT trd, rowid FROM fts_trd WHERE trd MATCH '"' || ? || '"' LIMIT 100`
        )
        .all(normalized);

      // Filter by language using the traduko table
      if (ftsRows.length > 0) {
        const rowids = ftsRows.map((r) => r.rowid);
        // Get matching traduko rows filtered by language
        for (const rowid of rowids) {
          const row = db
            .query<TradukoRow, [number, string]>(
              "SELECT mrk, lng, trd, txt FROM traduko WHERE rowid = ? AND lng = ?"
            )
            .get(rowid, lang);
          if (row) trds.push(row);
        }
      }
    } catch {
      // FTS query might fail — ignore
    }
  }

  if (trds.length === 0) {
    // 3. LIKE partial match
    trds = db
      .query<TradukoRow, [string, string]>(
        "SELECT mrk, lng, trd, txt FROM traduko WHERE lng = ? AND lower(trd) LIKE '%' || ? || '%' LIMIT 50"
      )
      .all(lang, normalized);
  }

  if (trds.length === 0) return [];

  // Get unique mrk values and look up the nodes
  const uniqueMrks = [...new Set(trds.map((t) => t.mrk))];
  const allNodes: NodoRow[] = [];
  for (const mrk of uniqueMrks.slice(0, limit * 3)) {
    const node = db
      .query<NodoRow, [string]>(
        "SELECT mrk, art, kap, num FROM nodo WHERE mrk = ?"
      )
      .get(mrk);
    if (node) allNodes.push(node);
  }

  const results = assembleResults(allNodes, limit);
  for (const r of results) {
    const matched = trds.find((t) => t.mrk === r.mrk);
    r.matchedVia = `translation:${lang}:${matched?.trd ?? query}`;
  }
  return results;
}

/**
 * Look up a word across all languages.
 */
export function lookupAllLanguages(
  query: string,
  limit: number = 5
): LookupResult[] {
  const db = getDb();
  const normalized = query.trim().toLowerCase();

  // Also try as Esperanto headword
  const eoResults = lookupEsperanto(query, limit);

  // Search translations across all languages
  let trds = db
    .query<TradukoRow, [string]>(
      "SELECT mrk, lng, trd, txt FROM traduko WHERE lower(trd) = ? LIMIT 100"
    )
    .all(normalized);

  if (trds.length === 0) {
    // FTS fallback
    try {
      trds = db
        .query<TradukoRow, [string]>(
          `SELECT t.mrk, t.lng, t.trd, t.txt
           FROM fts_trd f
           JOIN traduko t ON f.rowid = t.rowid
           WHERE f.trd MATCH '"' || ? || '"'
           LIMIT 100`
        )
        .all(normalized);
    } catch {
      // ignore FTS errors
    }
  }

  const uniqueMrks = [...new Set(trds.map((t) => t.mrk))];
  const allNodes: NodoRow[] = [];
  for (const mrk of uniqueMrks.slice(0, limit * 3)) {
    const node = db
      .query<NodoRow, [string]>(
        "SELECT mrk, art, kap, num FROM nodo WHERE mrk = ?"
      )
      .get(mrk);
    if (node) allNodes.push(node);
  }

  const trdResults = assembleResults(allNodes, limit);
  for (const r of trdResults) {
    const matched = trds.find((t) => t.mrk === r.mrk);
    r.matchedVia = `translation:${matched?.lng ?? "?"}:${matched?.trd ?? query}`;
  }

  // Merge eo results + translation results, dedup by mrk
  const seen = new Set<string>();
  const merged: LookupResult[] = [];
  for (const r of [...eoResults, ...trdResults]) {
    if (!seen.has(r.mrk)) {
      seen.add(r.mrk);
      merged.push(r);
    }
  }
  return merged.slice(0, limit);
}

/**
 * Assemble full lookup results from matched nodo rows.
 * Groups by article, fetches definitions from HTML, translations, etc.
 */
function assembleResults(
  nodes: NodoRow[],
  limit: number
): LookupResult[] {
  const db = getDb();
  const results: LookupResult[] = [];

  // Group by derivation-level mrk (no dot-dot in mrk, or first two segments)
  const drvNodes = new Map<string, NodoRow>();
  for (const node of nodes) {
    const drvMrk = getDrvMrk(node.mrk);
    if (!drvNodes.has(drvMrk)) {
      drvNodes.set(drvMrk, node);
    }
  }

  for (const [drvMrk, node] of drvNodes) {
    if (results.length >= limit) break;

    // Fetch article HTML
    const artRow = db
      .query<{ txt: Buffer }, [string]>(
        "SELECT txt FROM artikolo WHERE mrk = ?"
      )
      .get(node.art);

    let senses: LookupResult["senses"] = [];
    if (artRow?.txt) {
      const entry = extractByMrk(artRow.txt, drvMrk);
      if (entry) {
        senses = entry.senses;
      }
    }

    // Fetch translations for this mrk
    const translations = db
      .query<{ lng: string; trd: string }, [string]>(
        "SELECT lng, trd FROM traduko WHERE mrk = ? ORDER BY lng"
      )
      .all(drvMrk);

    // Also fetch translations at sense level
    const senseTranslations = db
      .query<{ lng: string; trd: string; mrk: string }, [string]>(
        "SELECT lng, trd, mrk FROM traduko WHERE mrk LIKE ? || '.%' ORDER BY lng"
      )
      .all(drvMrk);

    const allTranslations = [...translations, ...senseTranslations].map(
      (t) => ({
        lng: t.lng,
        trd: t.trd,
      })
    );

    // Fetch cross-references
    const refs = db
      .query<{ cel: string; tip: string }, [string]>(
        "SELECT cel, tip FROM referenco WHERE mrk = ? OR mrk LIKE ? || '.%'"
      )
      .all(drvMrk, drvMrk);

    const crossRefs = refs.map((r) => {
      // Try to resolve target headword
      const targetNode = db
        .query<{ kap: string }, [string]>(
          "SELECT kap FROM nodo WHERE mrk = ?"
        )
        .get(r.cel);
      return {
        target: r.cel,
        type: r.tip,
        targetKap: targetNode?.kap,
      };
    });

    // Fetch usage domains
    const uzoj = db
      .query<{ uzo: string }, [string]>(
        "SELECT DISTINCT uzo FROM uzo WHERE mrk = ? OR mrk LIKE ? || '.%'"
      )
      .all(drvMrk, drvMrk);
    const usageDomains = uzoj.map((u) => u.uzo);

    results.push({
      headword: node.kap,
      article: node.art,
      mrk: drvMrk,
      senses,
      translations: allTranslations,
      crossRefs,
      usageDomains,
    });
  }

  return results;
}

/**
 * Extract the derivation-level mrk from a potentially sense-level mrk.
 * E.g., "amik.0o.KOMUNE" → "amik.0o"
 */
function getDrvMrk(mrk: string): string {
  const parts = mrk.split(".");
  if (parts.length <= 2) return mrk;
  return parts.slice(0, 2).join(".");
}

/**
 * Get all available languages with their translation counts.
 */
export function getLanguages(): { lng: string; count: number }[] {
  const db = getDb();
  return db
    .query<{ lng: string; count: number }, []>(
      "SELECT lng, COUNT(*) as count FROM traduko GROUP BY lng ORDER BY count DESC"
    )
    .all();
}
