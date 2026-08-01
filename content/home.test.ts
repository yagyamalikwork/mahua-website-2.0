import { describe, expect, it } from "vitest";
import { HOME } from "./home";

const strings = (obj: unknown): string[] =>
  typeof obj === "string" ? [obj]
    : Array.isArray(obj) ? obj.flatMap(strings)
    : obj && typeof obj === "object" ? Object.values(obj).flatMap(strings)
    : [];

describe("house style (CLAUDE.md conventions)", () => {
  const all = strings(HOME);

  it("uses British spelling", () => {
    // House convention is British with -ise endings (the brand record uses
    // "harmonise"). Only unambiguously American forms are listed: words like
    // "practice", "license" and "curb" are valid in British English too and
    // would produce false failures.
    const american =
      /\b(colors?|colored|coloring|gray|favorites?|centers?|centered|honors?|honored|flavors?|flavored|neighbors?|labor|humor|harbor|savor|splendor|somber|fiber|liters?|meters?|theaters?|defense|offense|jewelry|aluminum|catalog|dialog|specialty|program|travelers?|traveled|traveling|canceled|canceling|apologize|organize|realize|recognize|emphasize|minimize|maximize|customize|personalize|prioritize|harmonize|revitalize|analyze|paralyze|inquire|inquires|inquired|inquiring|inquiry|inquiries)\b/i;
    for (const s of all) {
      expect(american.test(s), `American spelling in: "${s}"`).toBe(false);
    }
  });

  it("does not reuse the old keyword filler", () => {
    for (const s of all) {
      expect(s.toLowerCase()).not.toContain("boutique nature resorts in india");
    }
  });

  it("opens with one confident line, not a paragraph", () => {
    expect(HOME.hero.headline.length).toBeLessThanOrEqual(60);
    // A sentence break followed by more text means two sentences. A single
    // trailing full stop is fine; counting "." segments is not, since it both
    // passes run-ons with no punctuation and fails on abbreviations like "St.".
    expect(HOME.hero.headline).not.toMatch(/[.!?]\s+\S/);
  });
});

describe("HOME.movements", () => {
  it("gives every movement a chapter label and a heading", () => {
    for (const m of HOME.movements) {
      expect(m.chapter.length, m.id).toBeGreaterThan(0);
      expect(m.heading.length, m.id).toBeGreaterThan(0);
    }
  });
});
