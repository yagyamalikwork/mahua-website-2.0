import { describe, expect, it } from "vitest";
import { TOLA_MAP_ART } from "./tola-map-art";
import { VANN_MAP_ART } from "./vann-map-art";

/**
 * These hold any *regenerated* map to the guarantees `PropertyMap` depends on.
 * They are not a check that tracing "ran" — a build that emitted four empty
 * strings would satisfy that, and render an empty cream rectangle with every
 * test green. Each assertion below is about the artwork's content.
 */
const MAPS = [
  ["Vann", VANN_MAP_ART],
  ["Tola", TOLA_MAP_ART],
] as const;

/** Every `M` starts a new subpath; a broken region traces as many. */
const subpaths = (d: string) => (d.match(/M/gi) ?? []).length;

describe.each(MAPS)("%s map art", (_name, art) => {
  it("has a real viewBox", () => {
    expect(art.viewBox.width).toBeGreaterThan(400);
    expect(art.viewBox.height).toBeGreaterThan(200);
  });

  it("traced every region to real path data", () => {
    for (const [region, d] of Object.entries(art.regions)) {
      expect(d.length, `${region} traced to nothing`).toBeGreaterThan(200);
      expect(d.startsWith("M"), `${region} is not path data`).toBe(true);
    }
  });

  it("keeps the road continuous", () => {
    // The single assertion this file exists for. The labels and village dots
    // sit ON the yellow road in the client's artwork, so a colour mask is
    // perforated by them; the morphological close in build_map.mjs is what
    // bridges those gaps. With the close removed the road shatters into a
    // dozen fragments, and a road with holes in it must not ship.
    expect(subpaths(art.regions.road)).toBeLessThanOrEqual(3);
  });

  it("nests the regions the way the geography does", () => {
    // The core zone sits inside the park's extent, so it cannot be the larger
    // shape. Catches a mask whose colour test has drifted onto the wrong band.
    expect(art.regions.core.length).toBeLessThan(art.regions.park.length * 2);
  });
});
