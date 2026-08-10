// content/site.test.ts
import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { media } from "@/lib/media";
import { SITE, SITE_FOOTER_ID } from "./site";

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
