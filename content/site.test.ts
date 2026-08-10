// content/site.test.ts
import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { media } from "@/lib/media";
import { SITE, SITE_FOOTER_ID } from "./site";

/** Every string anywhere in a nested object/array — the same flattening `content/home.test.ts` uses. */
const strings = (obj: unknown): string[] =>
  typeof obj === "string" ? [obj]
    : Array.isArray(obj) ? obj.flatMap(strings)
    : obj && typeof obj === "object" ? Object.values(obj).flatMap(strings)
    : [];

describe("SITE house style (CLAUDE.md conventions)", () => {
  // Every user-facing string on every route: the nav labels, the place labels
  // and their regions, and all footer copy (the office address, the legal
  // links' labels — not their external hrefs — and the copyright line).
  const all = strings(SITE.nav)
    .concat(SITE.places.flatMap((p) => [p.label, ...(p.region ? [p.region] : [])]))
    .concat([SITE.footer.placesLabel, SITE.footer.officeLabel, SITE.footer.office, SITE.footer.copyright])
    .concat(SITE.footer.legal.map((l) => l.label));

  it("uses British spelling", () => {
    // House convention is British with -ise endings. Only unambiguously
    // American forms are listed — the plausible ones for site chrome and a
    // website directory footer (an office address, legal-page labels, a
    // copyright line), not a single token: words like "practice", "license"
    // and "curb" are valid in British English too and would produce false
    // failures.
    const american =
      /\b(colors?|colored|coloring|gray|favorites?|centers?|centered|honors?|honored|flavors?|flavored|neighbors?|labor|humor|harbor|savor|splendor|somber|fiber|liters?|meters?|theaters?|defense|offense|jewelry|aluminum|catalog|dialog|specialty|program|travelers?|traveled|traveling|canceled|canceling|apologize|organize|organization|authorize|authorized|realize|recognize|recognized|emphasize|minimize|maximize|customize|personalize|prioritize|harmonize|revitalize|analyze|paralyze|inquire|inquires|inquired|inquiring|inquiry|inquiries)\b/i;
    for (const s of all) {
      expect(american.test(s), `American spelling in: "${s}"`).toBe(false);
    }
  });
});

describe("SITE", () => {
  it("links only to routes that exist", () => {
    // The footer and menu must never link a ghost. Checked against the app
    // directory itself, so adding a place without building its page is a red
    // test — and building a page without listing it here is visible in review.
    const root = path.resolve(import.meta.dirname, "..", "app");
    for (const place of SITE.places) {
      const dir = place.href === "/" ? root : path.join(root, place.href.slice(1));
      expect(existsSync(path.join(dir, "page.tsx")), `${place.href} has no page`).toBe(true);
    }
  });

  it("opens with Home, then the two lodges in brand order", () => {
    expect(SITE.places.map((p) => p.href)).toEqual(["/", "/mahua-vann", "/mahua-tola"]);
  });

  it("gives every lodge a region and a real card photograph, and Home neither", () => {
    // The client's ruling: lodges as image cards in Sujan's manner, Home a
    // plain tag. A lodge without a card renders as a bare link and the menu
    // silently loses its point.
    for (const place of SITE.places) {
      if (place.href === "/") {
        expect(place.region).toBeUndefined();
        expect(place.cardMediaId).toBeUndefined();
      } else {
        expect(place.region, `${place.label} has no region`).toBeDefined();
        expect(place.cardMediaId, `${place.label} has no card`).toBeDefined();
        expect(() => media(place.cardMediaId!)).not.toThrow();
      }
    }
  });

  it("has a footer id, since two components must agree on it", () => {
    expect(SITE_FOOTER_ID).toBe("site-footer");
  });
});
