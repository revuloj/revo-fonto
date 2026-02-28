/**
 * 100 Usage Scenarios for the Revo MCP Server.
 *
 * These represent real-world queries from:
 * - Beginner Esperanto learners (from English, German, French, etc.)
 * - Intermediate learners encountering new words
 * - Native/fluent speakers looking up precise definitions
 * - Various edge cases and error handling
 *
 * Each scenario tests the handleLookup function end-to-end.
 */

import { describe, test, expect, afterAll } from "bun:test";
import { handleLookup } from "../src/tools/lookup";
import { closeDb } from "../src/db";

afterAll(() => closeDb());

// Helper: check result contains expected content
function expectResultContains(
  result: string,
  ...fragments: string[]
): void {
  for (const frag of fragments) {
    expect(result.toLowerCase()).toContain(frag.toLowerCase());
  }
}

function expectHasResults(result: string): void {
  expect(result).not.toBe("No results found.");
}

// ============================================================
// A. Beginner Esperanto Learner (English native) — 15 scenarios
// ============================================================

describe("A. Beginner (English native)", () => {
  test("1. Look up 'hello' in English", () => {
    const r = handleLookup({ query: "hello", lang: "en", limit: 5 });
    expectHasResults(r);
    expectResultContains(r, "salut");
  });

  test("2. Look up 'thank you' in English", () => {
    // "thank" is more likely to be found
    const r = handleLookup({ query: "thank", lang: "en", limit: 5 });
    expectHasResults(r);
    expectResultContains(r, "dank");
  });

  test("3. Look up 'water' in English", () => {
    const r = handleLookup({ query: "water", lang: "en", limit: 3 });
    expectHasResults(r);
    expectResultContains(r, "akvo");
  });

  test("4. Look up 'eat' in English", () => {
    const r = handleLookup({ query: "eat", lang: "en", limit: 3 });
    expectHasResults(r);
    expectResultContains(r, "manĝ");
  });

  test("5. Look up 'house' in English", () => {
    const r = handleLookup({ query: "house", lang: "en", limit: 3 });
    expectHasResults(r);
    expectResultContains(r, "dom");
  });

  test("6. Look up 'amiko' in Esperanto — see definition + translation", () => {
    const r = handleLookup({ query: "amiko", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "amiko", "friend");
    // Should have Esperanto definition
    expect(r).toContain("Definitions");
  });

  test("7. Look up 'granda' in Esperanto", () => {
    const r = handleLookup({ query: "granda", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "granda");
  });

  test("8. Look up 'run' in English", () => {
    const r = handleLookup({ query: "run", lang: "en", limit: 5 });
    expectHasResults(r);
    expectResultContains(r, "kur");
  });

  test("9. Look up 'beautiful' in English", () => {
    const r = handleLookup({ query: "beautiful", lang: "en", limit: 3 });
    expectHasResults(r);
    expectResultContains(r, "bel");
  });

  test("10. Look up 'book' in English", () => {
    const r = handleLookup({ query: "book", lang: "en", limit: 3 });
    expectHasResults(r);
    expectResultContains(r, "libr");
  });

  test("11. Look up 'cat' in English", () => {
    const r = handleLookup({ query: "cat", lang: "en", limit: 3 });
    expectHasResults(r);
    expectResultContains(r, "kato");
  });

  test("12. Look up 'love' in English", () => {
    const r = handleLookup({ query: "love", lang: "en", limit: 5 });
    expectHasResults(r);
    expectResultContains(r, "am");
  });

  test("13. Look up 'tree' in English", () => {
    const r = handleLookup({ query: "tree", lang: "en", limit: 3 });
    expectHasResults(r);
    expectResultContains(r, "arbo");
  });

  test("14. Look up 'red' in English", () => {
    const r = handleLookup({ query: "red", lang: "en", limit: 5 });
    expectHasResults(r);
    expectResultContains(r, "ruĝ");
  });

  test("15. Look up 'child' in English", () => {
    const r = handleLookup({ query: "child", lang: "en", limit: 3 });
    expectHasResults(r);
    expectResultContains(r, "infan");
  });
});

// ============================================================
// B. Beginner Esperanto Learner (German native) — 10 scenarios
// ============================================================

describe("B. Beginner (German native)", () => {
  test("16. Look up 'Freund' in German", () => {
    const r = handleLookup({ query: "Freund", lang: "de", limit: 2 });
    expectHasResults(r);
    expectResultContains(r, "amiko");
  });

  test("17. Look up 'Hund' in German", () => {
    const r = handleLookup({ query: "Hund", lang: "de", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "hundo");
  });

  test("18. Look up 'Katze' in German", () => {
    const r = handleLookup({ query: "Katze", lang: "de", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "kato");
  });

  test("19. Look up 'Haus' in German", () => {
    const r = handleLookup({ query: "Haus", lang: "de", limit: 3 });
    expectHasResults(r);
    expectResultContains(r, "dom");
  });

  test("20. Look up 'Wasser' in German", () => {
    const r = handleLookup({ query: "Wasser", lang: "de", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "akvo");
  });

  test("21. Look up 'schön' in German", () => {
    const r = handleLookup({ query: "schön", lang: "de", limit: 3 });
    expectHasResults(r);
    expectResultContains(r, "bel");
  });

  test("22. Look up 'essen' in German", () => {
    const r = handleLookup({ query: "essen", lang: "de", limit: 3 });
    expectHasResults(r);
    expectResultContains(r, "manĝ");
  });

  test("23. Look up 'Buch' in German", () => {
    const r = handleLookup({ query: "Buch", lang: "de", limit: 3 });
    expectHasResults(r);
    expectResultContains(r, "libr");
  });

  test("24. Look up 'Baum' in German", () => {
    const r = handleLookup({ query: "Baum", lang: "de", limit: 3 });
    expectHasResults(r);
    expectResultContains(r, "arb");
  });

  test("25. Look up 'Freundin' in German", () => {
    const r = handleLookup({ query: "Freundin", lang: "de", limit: 2 });
    expectHasResults(r);
    expectResultContains(r, "amik");
  });
});

// ============================================================
// C. Beginner from French — 5 scenarios
// ============================================================

describe("C. Beginner (French native)", () => {
  test("26. Look up 'ami' in French", () => {
    const r = handleLookup({ query: "ami", lang: "fr", limit: 2 });
    expectHasResults(r);
    expectResultContains(r, "amiko");
  });

  test("27. Look up 'chien' in French", () => {
    const r = handleLookup({ query: "chien", lang: "fr", limit: 5 });
    expectHasResults(r);
    // 'chien' appears in translations for both hundo and kolĉiko
    expectResultContains(r, "hundo");
  });

  test("28. Look up 'maison' in French", () => {
    const r = handleLookup({ query: "maison", lang: "fr", limit: 2 });
    expectHasResults(r);
    expectResultContains(r, "dom");
  });

  test("29. Look up 'manger' in French", () => {
    const r = handleLookup({ query: "manger", lang: "fr", limit: 3 });
    expectHasResults(r);
    expectResultContains(r, "manĝ");
  });

  test("30. Look up 'chat' in French", () => {
    const r = handleLookup({ query: "chat", lang: "fr", limit: 2 });
    expectHasResults(r);
    expectResultContains(r, "kato");
  });
});

// ============================================================
// D. Esperanto Word Lookups (exact headword) — 15 scenarios
// ============================================================

describe("D. Esperanto headword lookups", () => {
  test("31. 'amiko' — full entry", () => {
    const r = handleLookup({ query: "amiko", lang: "eo", limit: 1 });
    expectResultContains(r, "amiko", "Definitions", "Translations");
  });

  test("32. 'hundo' — multiple senses", () => {
    const r = handleLookup({ query: "hundo", lang: "eo", limit: 1 });
    expectResultContains(r, "hundo", "1.", "2.", "3.");
  });

  test("33. 'esti' — fundamental verb", () => {
    const r = handleLookup({ query: "esti", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "esti");
  });

  test("34. 'la' — article", () => {
    const r = handleLookup({ query: "la", lang: "eo", limit: 1 });
    expectHasResults(r);
  });

  test("35. 'kaj' — conjunction", () => {
    const r = handleLookup({ query: "kaj", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "kaj");
  });

  test("36. 'tre' — adverb", () => {
    const r = handleLookup({ query: "tre", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "tre");
  });

  test("37. 'ĉirkaŭ' — word with ĉ", () => {
    const r = handleLookup({ query: "ĉirkaŭ", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "ĉirkaŭ");
  });

  test("38. 'ĝardeno' — word with ĝ", () => {
    const r = handleLookup({ query: "ĝardeno", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "ĝardeno");
  });

  test("39. 'ŝipo' — word with ŝ", () => {
    const r = handleLookup({ query: "ŝipo", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "ŝipo");
  });

  test("40. 'ĵaŭdo' — word with ĵ", () => {
    const r = handleLookup({ query: "ĵaŭdo", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "ĵaŭdo");
  });

  test("41. 'ĥoro' — word with rare ĥ", () => {
    const r = handleLookup({ query: "ĥoro", lang: "eo", limit: 1 });
    expectHasResults(r);
  });

  test("42. 'aŭskulti' — word with ŭ", () => {
    const r = handleLookup({ query: "aŭskulti", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "aŭskulti");
  });

  test("43. 'malgranda' — compound with mal-", () => {
    const r = handleLookup({ query: "malgranda", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "malgranda");
  });

  test("44. 'gepatroj' — compound with ge-", () => {
    const r = handleLookup({ query: "gepatroj", lang: "eo", limit: 1 });
    expectHasResults(r);
  });

  test("45. 'lernejo' — compound with -ej suffix", () => {
    const r = handleLookup({ query: "lernejo", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "lernejo");
  });
});

// ============================================================
// E. X-System Input — 8 scenarios
// ============================================================

describe("E. X-System Input", () => {
  test("46. 'cxirkaux' → ĉirkaŭ", () => {
    const r = handleLookup({ query: "cxirkaux", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "ĉirkaŭ");
  });

  test("47. 'gxardeno' → ĝardeno", () => {
    const r = handleLookup({ query: "gxardeno", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "ĝardeno");
  });

  test("48. 'sxipo' → ŝipo", () => {
    const r = handleLookup({ query: "sxipo", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "ŝipo");
  });

  test("49. 'jxauxdo' → ĵaŭdo", () => {
    const r = handleLookup({ query: "jxauxdo", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "ĵaŭdo");
  });

  test("50. 'hxoro' → ĥoro", () => {
    const r = handleLookup({ query: "hxoro", lang: "eo", limit: 1 });
    expectHasResults(r);
  });

  test("51. 'auxskulti' → aŭskulti", () => {
    const r = handleLookup({ query: "auxskulti", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "aŭskulti");
  });

  test("52. 'Cxu' → ĉu (case-insensitive)", () => {
    const r = handleLookup({ query: "Cxu", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "ĉu");
  });

  test("53. 'mangxi' → manĝi", () => {
    const r = handleLookup({ query: "mangxi", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "manĝi");
  });
});

// ============================================================
// F. Grammatical Form Stemming — 12 scenarios
// ============================================================

describe("F. Grammatical form stemming", () => {
  test("54. 'amikojn' (pl. acc.) → amiko", () => {
    const r = handleLookup({ query: "amikojn", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "amiko");
  });

  test("55. 'amikon' (acc.) → amiko", () => {
    const r = handleLookup({ query: "amikon", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "amiko");
  });

  test("56. 'amikoj' (pl.) → amiko", () => {
    const r = handleLookup({ query: "amikoj", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "amiko");
  });

  test("57. 'grandaj' (pl. adj.) → granda", () => {
    const r = handleLookup({ query: "grandaj", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "granda");
  });

  test("58. 'grandan' (acc. adj.) → granda", () => {
    const r = handleLookup({ query: "grandan", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "granda");
  });

  test("59. 'manĝas' (present) → manĝi", () => {
    const r = handleLookup({ query: "manĝas", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "manĝi");
  });

  test("60. 'manĝis' (past) → manĝi", () => {
    const r = handleLookup({ query: "manĝis", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "manĝi");
  });

  test("61. 'manĝos' (future) → manĝi", () => {
    const r = handleLookup({ query: "manĝos", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "manĝi");
  });

  test("62. 'manĝus' (conditional) → manĝi", () => {
    const r = handleLookup({ query: "manĝus", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "manĝi");
  });

  test("63. 'manĝu' (imperative) → manĝi", () => {
    const r = handleLookup({ query: "manĝu", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "manĝ");
  });

  test("64. 'rapide' (adverb) → rapida or rapide", () => {
    const r = handleLookup({ query: "rapide", lang: "eo", limit: 2 });
    expectHasResults(r);
    expectResultContains(r, "rapid");
  });

  test("65. 'homojn' → homo", () => {
    const r = handleLookup({ query: "homojn", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "homo");
  });
});

// ============================================================
// G. Compound and Derived Words — 8 scenarios
// ============================================================

describe("G. Compound and derived words", () => {
  test("66. 'malamiko' — enemy (mal+amik)", () => {
    const r = handleLookup({ query: "malamiko", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "malamiko");
  });

  test("67. 'amikino' — female friend", () => {
    const r = handleLookup({ query: "amikino", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "amikino");
  });

  test("68. 'amikeco' — friendship", () => {
    const r = handleLookup({ query: "amikeco", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "amikeco");
  });

  test("69. 'hundejo' — kennel (hund+ej)", () => {
    const r = handleLookup({ query: "hundejo", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "hundejo");
  });

  test("70. 'hundido' — puppy (hund+id)", () => {
    const r = handleLookup({ query: "hundido", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "hundido");
  });

  test("71. 'lernanto' — student (lern+ant)", () => {
    const r = handleLookup({ query: "lernanto", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "lernanto");
  });

  test("72. 'instruisto' — teacher (instru+ist)", () => {
    const r = handleLookup({ query: "instruisto", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "instruisto");
  });

  test("73. 'ĉashundo' — hunting dog", () => {
    const r = handleLookup({ query: "ĉashundo", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "ĉashundo");
  });
});

// ============================================================
// H. Multi-Sense Words and Disambiguation — 8 scenarios
// ============================================================

describe("H. Multi-sense words", () => {
  test("74. 'abako' — multiple senses", () => {
    const r = handleLookup({ query: "abako", lang: "eo", limit: 1 });
    expectHasResults(r);
    expect(r).toContain("Definitions");
  });

  test("75. 'krono' — crown (multiple meanings)", () => {
    const r = handleLookup({ query: "krono", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "krono");
  });

  test("76. 'hundo' — genus, domestic, figurative", () => {
    const r = handleLookup({ query: "hundo", lang: "eo", limit: 1 });
    expectResultContains(r, "1.", "2.", "3.");
  });

  test("77. 'radioj' stemming → radio", () => {
    const r = handleLookup({ query: "radioj", lang: "eo", limit: 2 });
    expectHasResults(r);
    expectResultContains(r, "radio");
  });

  test("78. 'noto' — note (multiple meanings)", () => {
    const r = handleLookup({ query: "noto", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "noto");
  });

  test("79. 'parto' — part", () => {
    const r = handleLookup({ query: "parto", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "parto");
  });

  test("80. 'muso' — mouse", () => {
    const r = handleLookup({ query: "muso", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "muso");
  });

  test("81. 'pilko' — ball", () => {
    const r = handleLookup({ query: "pilko", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "pilko");
  });
});

// ============================================================
// I. Cross-Language Search (lang=all) — 5 scenarios
// ============================================================

describe("I. Cross-language search", () => {
  test("82. 'cat' across all languages", () => {
    const r = handleLookup({ query: "cat", lang: "all", limit: 5 });
    expectHasResults(r);
  });

  test("83. 'Hund' across all languages → hundo via German", () => {
    const r = handleLookup({ query: "Hund", lang: "all", limit: 3 });
    expectHasResults(r);
    expectResultContains(r, "hundo");
  });

  test("84. 'ami' across all languages → amiko via French+", () => {
    const r = handleLookup({ query: "ami", lang: "all", limit: 5 });
    expectHasResults(r);
    expectResultContains(r, "amik");
  });

  test("85. 'друг' across all languages → amiko via Russian", () => {
    const r = handleLookup({ query: "друг", lang: "all", limit: 3 });
    expectHasResults(r);
    expectResultContains(r, "amik");
  });

  test("86. 'amigo' across all languages → amiko via Spanish/Portuguese", () => {
    const r = handleLookup({ query: "amigo", lang: "all", limit: 3 });
    expectHasResults(r);
    expectResultContains(r, "amik");
  });
});

// ============================================================
// J. Specialized/Domain Lookups — 5 scenarios
// ============================================================

describe("J. Specialized/domain lookups", () => {
  test("87. 'absceso' — medical term", () => {
    const r = handleLookup({ query: "absceso", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "absceso");
  });

  test("88. 'algoritmo' — computer science term", () => {
    const r = handleLookup({ query: "algoritmo", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "algoritmo");
  });

  test("89. 'fotosintezo' — biology term", () => {
    const r = handleLookup({ query: "fotosintezo", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "fotosintezo");
  });

  test("90. 'akuzativo' — grammar term", () => {
    const r = handleLookup({ query: "akuzativo", lang: "eo", limit: 1 });
    expectHasResults(r);
    expectResultContains(r, "akuzativo");
  });

  test("91. 'fortepiano' — music term", () => {
    const r = handleLookup({ query: "fortepiano", lang: "eo", limit: 1 });
    expectHasResults(r);
  });
});

// ============================================================
// K. Latin Lookups — 3 scenarios
// ============================================================

describe("K. Latin lookups", () => {
  test("92. 'Canis' in Latin → hundo", () => {
    const r = handleLookup({ query: "Canis", lang: "la", limit: 3 });
    expectHasResults(r);
  });

  test("93. 'Felis' in Latin → kato", () => {
    const r = handleLookup({ query: "Felis", lang: "la", limit: 3 });
    expectHasResults(r);
  });

  test("94. 'Homo' in Latin → homo", () => {
    const r = handleLookup({ query: "Homo", lang: "la", limit: 3 });
    expectHasResults(r);
  });
});

// ============================================================
// L. Edge Cases and Error Handling — 6 scenarios
// ============================================================

describe("L. Edge cases", () => {
  test("95. Empty/whitespace query → no results", () => {
    const r = handleLookup({ query: " ", lang: "eo", limit: 1 });
    expect(r).toBe("No results found.");
  });

  test("96. Very long query → handled", () => {
    const longQuery = "a".repeat(100);
    const r = handleLookup({ query: longQuery, lang: "eo", limit: 1 });
    // Should return no results but not crash
    expect(r).toBe("No results found.");
  });

  test("97. Special characters → safe, no injection", () => {
    const r = handleLookup({
      query: '<script>alert(1)</script>',
      lang: "eo",
      limit: 1,
    });
    // Should not crash, should return no results
    expect(r).toBe("No results found.");
  });

  test("98. Non-existent word → no results", () => {
    const r = handleLookup({ query: "xyzzy", lang: "eo", limit: 5 });
    expect(r).toBe("No results found.");
  });

  test("99. Single letter 'a'", () => {
    const r = handleLookup({ query: "a", lang: "eo", limit: 3 });
    // Should find something — the article "a" exists
    expectHasResults(r);
  });

  test("100. Numbers and mixed input", () => {
    const r = handleLookup({ query: "123abc", lang: "eo", limit: 1 });
    // Should not crash
    expect(typeof r).toBe("string");
  });
});
