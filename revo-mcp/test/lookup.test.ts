import { describe, test, expect, afterAll } from "bun:test";
import {
  lookupEsperanto,
  lookupTranslation,
  lookupAllLanguages,
  getLanguages,
  closeDb,
} from "../src/db";

afterAll(() => closeDb());

describe("lookupEsperanto", () => {
  test("finds exact headword 'amiko'", () => {
    const results = lookupEsperanto("amiko", 1);
    expect(results.length).toBe(1);
    expect(results[0].headword).toBe("amiko");
    expect(results[0].senses.length).toBeGreaterThan(0);
  });

  test("finds 'hundo' with multiple senses", () => {
    const results = lookupEsperanto("hundo", 1);
    expect(results.length).toBe(1);
    expect(results[0].headword).toBe("hundo");
    expect(results[0].senses.length).toBeGreaterThanOrEqual(3);
  });

  test("finds words with Esperanto characters", () => {
    const results = lookupEsperanto("ĉirkaŭ", 1);
    expect(results.length).toBe(1);
    expect(results[0].headword).toContain("ĉirkaŭ");
  });

  test("returns translations for results", () => {
    const results = lookupEsperanto("amiko", 1);
    expect(results[0].translations.length).toBeGreaterThan(0);
    const enTrd = results[0].translations.find((t) => t.lng === "en");
    expect(enTrd).toBeDefined();
    expect(enTrd!.trd).toBe("friend");
  });
});

describe("lookupTranslation", () => {
  test("finds 'friend' in English", () => {
    const results = lookupTranslation("friend", "en", 2);
    expect(results.length).toBeGreaterThan(0);
    const amiko = results.find((r) => r.headword === "amiko");
    expect(amiko).toBeDefined();
  });

  test("finds 'Hund' in German", () => {
    const results = lookupTranslation("Hund", "de", 1);
    expect(results.length).toBe(1);
    expect(results[0].headword).toBe("hundo");
  });

  test("finds 'chien' in French", () => {
    const results = lookupTranslation("chien", "fr", 5);
    expect(results.length).toBeGreaterThan(0);
    // 'chien' maps to hundo but may also match other entries (e.g., kolĉiko)
    const hundo = results.find((r) => r.headword === "hundo");
    expect(hundo).toBeDefined();
  });

  test("returns empty for non-existent translation", () => {
    const results = lookupTranslation("xyzzy", "en", 5);
    expect(results.length).toBe(0);
  });
});

describe("lookupAllLanguages", () => {
  test("finds 'Hund' across all languages (German)", () => {
    const results = lookupAllLanguages("Hund", 3);
    expect(results.length).toBeGreaterThan(0);
    const hundo = results.find((r) => r.headword === "hundo");
    expect(hundo).toBeDefined();
  });
});

describe("getLanguages", () => {
  test("returns list of languages", () => {
    const langs = getLanguages();
    expect(langs.length).toBeGreaterThan(100);

    const en = langs.find((l) => l.lng === "en");
    expect(en).toBeDefined();
    expect(en!.count).toBeGreaterThan(10000);
  });
});
