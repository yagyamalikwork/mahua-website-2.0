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
    const american = /\b(color|colors|favorite|center|centers|honor|organize|realize|traveler|travelers|harmonize)\b/i;
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
    expect(HOME.hero.headline.split(".").filter(Boolean)).toHaveLength(1);
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
