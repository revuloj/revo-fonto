/**
 * Extracts structured definition and example data from the HTML article blobs
 * stored in the `artikolo` table of the Revo database.
 *
 * The HTML is machine-generated with consistent CSS classes:
 * - <section class="drv"> — derivation sections
 * - <h2 id="mrk"> — derivation headword (ID = nodo.mrk)
 * - <dt id="mrk.sense">N.</dt> — sense number
 * - <span class="dif"> — definition text
 * - <i class="ekz"> — example sentences
 * - <span class="ekztld"> — root word placeholder in examples
 * - <span class="fntref"> — bibliographic references (to strip)
 * - <span class="klr"> — clarifications
 */

import { parse, HTMLElement, TextNode } from "node-html-parser";

export interface DrvEntry {
  mrk: string;
  headword: string;
  senses: SenseEntry[];
}

export interface SenseEntry {
  mrk?: string;
  num?: string;
  definition: string;
  examples: string[];
  domain?: string;
}

/**
 * Extract all derivation entries from an article HTML blob.
 */
export function extractArticle(htmlBlob: Buffer | Uint8Array): DrvEntry[] {
  const html = Buffer.from(htmlBlob).toString("utf-8");
  const root = parse(html);
  const entries: DrvEntry[] = [];

  const drvSections = root.querySelectorAll("section.drv");

  for (const drv of drvSections) {
    const h2 = drv.querySelector("h2");
    if (!h2) continue;

    const mrk = h2.getAttribute("id") ?? "";
    const headword = cleanText(h2.text);

    const senses = extractSenses(drv, mrk);
    entries.push({ mrk, headword, senses });
  }

  return entries;
}

/**
 * Extract a specific derivation entry by its mrk ID.
 */
export function extractByMrk(
  htmlBlob: Buffer | Uint8Array,
  targetMrk: string
): DrvEntry | null {
  const html = Buffer.from(htmlBlob).toString("utf-8");
  const root = parse(html);

  // Try to find the h2 with this exact ID (derivation level)
  const h2 = root.querySelector(`h2[id="${targetMrk}"]`);
  if (h2) {
    const drv = h2.closest("section.drv");
    if (drv) {
      const headword = cleanText(h2.text);
      const senses = extractSenses(drv, targetMrk);
      return { mrk: targetMrk, headword, senses };
    }
  }

  // Maybe it's a sense-level mrk — find the dt with this ID
  const dt = root.querySelector(`dt[id="${targetMrk}"]`);
  if (dt) {
    const drv = dt.closest("section.drv");
    const drvH2 = drv?.querySelector("h2");
    if (drv && drvH2) {
      const drvMrk = drvH2.getAttribute("id") ?? "";
      const headword = cleanText(drvH2.text);
      // Extract just the one sense
      const dd = dt.nextElementSibling;
      if (dd) {
        const sense = extractSenseFromDd(dd, targetMrk, dt.text.trim());
        return { mrk: drvMrk, headword, senses: [sense] };
      }
    }
  }

  return null;
}

function extractSenses(drv: HTMLElement, drvMrk: string): SenseEntry[] {
  const senses: SenseEntry[] = [];

  // Only select <dt> elements that are NOT translation headings (class="lng")
  // Definition <dt> elements have an id attribute or a numeric content like "1.", "2."
  // Translation <dt> elements have class="lng" and contain language names like "angle:"
  const dts = drv.querySelectorAll("dt");
  const defDts = dts.filter(
    (dt) => !dt.classNames.includes("lng")
  );

  if (defDts.length === 0) {
    // No numbered senses — the whole drv is one definition
    // Look for the first <dd> that's NOT a translation
    const dd = drv.querySelector("dd");
    if (dd && !dd.getAttribute("lang")) {
      senses.push(extractSenseFromDd(dd, drvMrk));
    } else {
      // Try to get definition from the drv content directly
      const dif = drv.querySelector("span.dif");
      if (dif) {
        senses.push({
          mrk: drvMrk,
          definition: cleanDefinition(dif),
          examples: extractExamples(dif.parentNode as HTMLElement),
        });
      }
    }
    return senses;
  }

  for (const dt of defDts) {
    const senseMrk = dt.getAttribute("id");
    const num = dt.text.trim();
    const dd = dt.nextElementSibling;
    if (dd && dd.tagName === "DD") {
      senses.push(extractSenseFromDd(dd, senseMrk ?? undefined, num));
    }
  }

  return senses;
}

function extractSenseFromDd(
  dd: HTMLElement,
  mrk?: string,
  num?: string
): SenseEntry {
  const dif = dd.querySelector("span.dif");
  const definition = dif ? cleanDefinition(dif) : "";
  const examples = extractExamples(dd);

  // Check for usage domain
  const uzo = dd.querySelector("abbr.uzo, span.uzo");
  const domain = uzo ? uzo.text.trim() : undefined;

  return { mrk, num, definition, examples, domain };
}

function extractExamples(container: HTMLElement): string[] {
  const examples: string[] = [];
  const ekzElements = container.querySelectorAll("i.ekz");

  for (const ekz of ekzElements) {
    // Clone to avoid mutating the original
    const clone = parse(ekz.outerHTML);
    // Remove bibliographic references
    for (const ref of clone.querySelectorAll("span.fntref, sup.fntref")) {
      ref.remove();
    }
    const text = cleanText(clone.text);
    if (text.length > 0) {
      examples.push(text);
    }
  }

  return examples;
}

function cleanDefinition(dif: HTMLElement): string {
  // Clone to remove refs without mutating
  const clone = parse(dif.outerHTML);
  // Remove bibliographic references
  for (const ref of clone.querySelectorAll("span.fntref, sup.fntref")) {
    ref.remove();
  }
  // Remove nested examples (they'll be extracted separately)
  for (const ekz of clone.querySelectorAll("i.ekz")) {
    ekz.remove();
  }
  return cleanText(clone.text);
}

/**
 * Clean extracted text: collapse whitespace, trim.
 */
function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}
