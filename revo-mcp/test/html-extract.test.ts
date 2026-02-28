import { describe, test, expect, beforeAll } from "bun:test";
import { Database } from "bun:sqlite";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { extractArticle, extractByMrk } from "../src/html-extract";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, "..", "data", "revo.db");

let db: Database;

beforeAll(() => {
  db = new Database(DB_PATH, { readonly: true });
});

function getArticleHtml(art: string): Buffer {
  const row = db.query<{ txt: Buffer }, [string]>(
    "SELECT txt FROM artikolo WHERE mrk = ?"
  ).get(art);
  if (!row) throw new Error(`Article not found: ${art}`);
  return Buffer.from(row.txt);
}

describe("extractArticle", () => {
  test("extracts all derivations from amik article", () => {
    const html = getArticleHtml("amik");
    const entries = extractArticle(html);

    expect(entries.length).toBeGreaterThan(5);

    const amiko = entries.find((e) => e.mrk === "amik.0o");
    expect(amiko).toBeDefined();
    expect(amiko!.headword).toContain("amiko");
    expect(amiko!.senses.length).toBe(2); // Two numbered senses

    const malamiko = entries.find((e) => e.mrk === "amik.mal0o");
    expect(malamiko).toBeDefined();
    expect(malamiko!.headword).toContain("malamiko");
  });

  test("extracts definitions from hund article", () => {
    const html = getArticleHtml("hund");
    const entries = extractArticle(html);

    const hundo = entries.find((e) => e.mrk === "hund.0o");
    expect(hundo).toBeDefined();
    expect(hundo!.senses.length).toBe(3); // genro, dombesto, FIG

    // First sense should mention "genro"
    expect(hundo!.senses[0].definition).toContain("genro");
    // Second sense should be about domestic dog
    expect(hundo!.senses[1].definition).toContain("Dombesto");
    // Third sense should be figurative
    expect(hundo!.senses[2].definition).toContain("Insultvorto");
  });

  test("extracts examples from definitions", () => {
    const html = getArticleHtml("hund");
    const entries = extractArticle(html);
    const hundo = entries.find((e) => e.mrk === "hund.0o");

    // Second sense (dombesto) should have examples
    const dombesto = hundo!.senses[1];
    expect(dombesto.examples.length).toBeGreaterThan(3);
    expect(dombesto.examples[0]).toContain("hund");
  });

  test("does not include translation language headings as senses", () => {
    const html = getArticleHtml("amik");
    const entries = extractArticle(html);
    const amiko = entries.find((e) => e.mrk === "amik.0o");

    // Should only have 2 real senses, not 100+ (which would include language headings)
    expect(amiko!.senses.length).toBeLessThan(10);

    // No sense should have a language name as its num
    for (const sense of amiko!.senses) {
      if (sense.num) {
        expect(sense.num).not.toContain("angle");
        expect(sense.num).not.toContain("germane");
        expect(sense.num).not.toContain("france");
      }
    }
  });

  test("extracts single-sense articles correctly", () => {
    const html = getArticleHtml("hund");
    const entries = extractArticle(html);
    const hundido = entries.find((e) => e.mrk === "hund.0ido");

    expect(hundido).toBeDefined();
    expect(hundido!.senses.length).toBeGreaterThanOrEqual(1);
  });
});

describe("extractByMrk", () => {
  test("extracts a specific derivation by mrk", () => {
    const html = getArticleHtml("amik");
    const entry = extractByMrk(html, "amik.0o");

    expect(entry).not.toBeNull();
    expect(entry!.headword).toContain("amiko");
    expect(entry!.senses.length).toBe(2);
  });

  test("extracts a specific sense by mrk", () => {
    const html = getArticleHtml("hund");
    const entry = extractByMrk(html, "hund.0o.dombesto");

    expect(entry).not.toBeNull();
    expect(entry!.senses.length).toBe(1);
    expect(entry!.senses[0].definition).toContain("Dombesto");
  });

  test("returns null for non-existent mrk", () => {
    const html = getArticleHtml("amik");
    const entry = extractByMrk(html, "nonexistent.0o");
    expect(entry).toBeNull();
  });

  test("handles article with no numbered senses", () => {
    const html = getArticleHtml("hund");
    const entry = extractByMrk(html, "hund.0ido");

    expect(entry).not.toBeNull();
    expect(entry!.senses.length).toBeGreaterThanOrEqual(1);
  });
});
