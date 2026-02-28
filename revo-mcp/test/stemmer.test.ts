import { describe, test, expect } from "bun:test";
import {
  fromXSystem,
  hasXSystem,
  generateStems,
  normalizeQuery,
} from "../src/stemmer";

describe("fromXSystem", () => {
  test("converts lowercase x-system characters", () => {
    expect(fromXSystem("cx")).toBe("ĉ");
    expect(fromXSystem("gx")).toBe("ĝ");
    expect(fromXSystem("hx")).toBe("ĥ");
    expect(fromXSystem("jx")).toBe("ĵ");
    expect(fromXSystem("sx")).toBe("ŝ");
    expect(fromXSystem("ux")).toBe("ŭ");
  });

  test("converts uppercase x-system characters", () => {
    expect(fromXSystem("Cx")).toBe("Ĉ");
    expect(fromXSystem("Gx")).toBe("Ĝ");
    expect(fromXSystem("Sx")).toBe("Ŝ");
  });

  test("converts full words", () => {
    expect(fromXSystem("cxirkaux")).toBe("ĉirkaŭ");
    expect(fromXSystem("gxardeno")).toBe("ĝardeno");
    expect(fromXSystem("sxipo")).toBe("ŝipo");
    expect(fromXSystem("jxauxdo")).toBe("ĵaŭdo");
    expect(fromXSystem("hxoro")).toBe("ĥoro");
    expect(fromXSystem("auxskulti")).toBe("aŭskulti");
  });

  test("handles mixed text", () => {
    expect(fromXSystem("Mi mangxas")).toBe("Mi manĝas");
    expect(fromXSystem("Cxu vi parolas?")).toBe("Ĉu vi parolas?");
  });

  test("leaves non-x-system text unchanged", () => {
    expect(fromXSystem("amiko")).toBe("amiko");
    expect(fromXSystem("domo")).toBe("domo");
    expect(fromXSystem("")).toBe("");
  });

  test("does not convert 'ex' or other non-Esperanto combinations", () => {
    // 'ex' should NOT be converted since 'e' is not a valid x-system prefix
    expect(fromXSystem("extra")).toBe("extra");
  });
});

describe("hasXSystem", () => {
  test("detects x-system notation", () => {
    expect(hasXSystem("cxirkaux")).toBe(true);
    expect(hasXSystem("mangxi")).toBe(true);
    expect(hasXSystem("Cxu")).toBe(true);
  });

  test("returns false for plain text", () => {
    expect(hasXSystem("amiko")).toBe(false);
    expect(hasXSystem("ĉirkaŭ")).toBe(false);
    expect(hasXSystem("hello")).toBe(false);
  });
});

describe("generateStems", () => {
  test("strips plural accusative -ojn", () => {
    const stems = generateStems("amikojn");
    expect(stems).toContain("amiko");
    expect(stems).toContain("amik");
  });

  test("strips accusative -on", () => {
    const stems = generateStems("amikon");
    expect(stems).toContain("amiko");
    expect(stems).toContain("amik");
  });

  test("strips plural -oj", () => {
    const stems = generateStems("amikoj");
    expect(stems).toContain("amiko");
    expect(stems).toContain("amik");
  });

  test("strips adjective plural -aj", () => {
    const stems = generateStems("grandaj");
    expect(stems).toContain("granda");
    expect(stems).toContain("grand");
  });

  test("strips verb present tense -as", () => {
    const stems = generateStems("manĝas");
    expect(stems).toContain("manĝi");
    expect(stems).toContain("manĝ");
  });

  test("strips verb past tense -is", () => {
    const stems = generateStems("manĝis");
    expect(stems).toContain("manĝi");
  });

  test("strips verb future tense -os", () => {
    const stems = generateStems("manĝos");
    expect(stems).toContain("manĝi");
  });

  test("strips verb conditional -us", () => {
    const stems = generateStems("manĝus");
    expect(stems).toContain("manĝi");
  });

  test("strips verb imperative -u", () => {
    const stems = generateStems("manĝu");
    expect(stems).toContain("manĝ");
  });

  test("includes the original word", () => {
    const stems = generateStems("amikojn");
    expect(stems).toContain("amikojn");
  });

  test("returns stems sorted shortest first", () => {
    const stems = generateStems("amikojn");
    for (let i = 1; i < stems.length; i++) {
      expect(stems[i].length).toBeGreaterThanOrEqual(stems[i - 1].length);
    }
  });

  test("handles short words without crashing", () => {
    const stems = generateStems("la");
    expect(stems).toContain("la");
    expect(stems.length).toBeGreaterThanOrEqual(1);
  });

  test("handles participial endings", () => {
    const stems = generateStems("leganta");
    expect(stems).toContain("legi");
  });
});

describe("normalizeQuery", () => {
  test("converts to lowercase", () => {
    expect(normalizeQuery("Amiko")).toBe("amiko");
  });

  test("trims whitespace", () => {
    expect(normalizeQuery("  amiko  ")).toBe("amiko");
  });

  test("converts x-system and lowercases", () => {
    expect(normalizeQuery("Cxirkaux")).toBe("ĉirkaŭ");
  });

  test("handles plain unicode Esperanto", () => {
    expect(normalizeQuery("ĉirkaŭ")).toBe("ĉirkaŭ");
  });
});
