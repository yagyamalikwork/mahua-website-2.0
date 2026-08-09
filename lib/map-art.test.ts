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

/** Splits path data at each subpath boundary, keeping the leading `M`. */
const splitSubpaths = (d: string) => d.split(/(?=M)/).filter((s) => s.startsWith("M"));

/**
 * Path commands in one subpath. A real traced curve carries dozens; a stray
 * fragment — an icon glyph that happened to share the region's colour test,
 * surviving as its own tiny connected component — carries a handful.
 */
const commandCount = (subpath: string) => (subpath.match(/[MLCQZmlcqz]/g) ?? []).length;

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

  it("keeps the road continuous, with no fragment among its subpaths", () => {
    // The labels and village dots sit ON the yellow road in the client's
    // artwork, so a colour mask is perforated by them; the morphological
    // close in build_map.mjs is what bridges those gaps. With the close
    // removed the road shatters into a dozen fragments, and a road with
    // holes in it must not ship.
    //
    // A bare subpath-count cap is the wrong instrument for that, though: an
    // OPEN STRIP (Vann's road, which runs off one edge of the map to the
    // other and never closes) legitimately traces as ONE subpath, while a
    // CLOSED RING (Tola's road, which loops the whole park) legitimately
    // traces as TWO — an outer boundary and the inner boundary of the hole
    // it encloses. Both are correct, continuous roads. That means a count
    // alone can't reject a broken one: 2 real subpaths plus 1 small stray
    // fragment — an icon that happened to share the road's colour test and
    // survived tracing as its own tiny piece — is also 3, and a bare
    // `<= 3` cap passed that shipped, undetected, for Tola.
    //
    // So this checks two different things: a cap on subpath COUNT (catches
    // a shattered road, many pieces), and a floor on each subpath's path
    // COMMAND count (catches a stray fragment riding alongside an otherwise
    // intact road, which a count alone cannot see). Both maps' real road
    // subpaths currently carry 26-34 commands; the fragment this was written
    // to catch carried 5. 12 sits with headroom on both sides of that gap.
    const subs = splitSubpaths(art.regions.road);
    expect(subs.length, "road has too many pieces to be a continuous strip or a closed ring").toBeLessThanOrEqual(3);
    for (const [i, sub] of subs.entries()) {
      expect(
        commandCount(sub),
        `road subpath ${i} (${commandCount(sub)} commands) is a fragment, not a real piece of the road`,
      ).toBeGreaterThanOrEqual(12);
    }
  });

  it("nests the regions the way the geography does", () => {
    // The core zone sits inside the park's extent, so it cannot be the larger
    // shape. Catches a mask whose colour test has drifted onto the wrong band.
    expect(art.regions.core.length).toBeLessThan(art.regions.park.length * 2);
  });
});
