import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VANN_MAP_ART } from "@/lib/vann-map-art";
import { LABEL_TEXT_SIZE, MOBILE_FONT_PX, PropertyMap, type PropertyMapCopy } from "./PropertyMap";

const COPY: PropertyMapCopy = {
  heading: { text: "Where it is", dim: "is" },
  art: "vann",
  labels: [
    { text: "Turia Gate", x: 0.5, y: 0.62, kind: "gate" },
    { text: "Pench Reservoir", x: 0.36, y: 0.6, kind: "water" },
  ],
  lodge: { text: "Mahua Vann", x: 0.58, y: 0.63 },
  legend: [{ swatch: "core", text: "Core area" }],
  gettingThere: [{ label: "From the gate", value: "Five kilometres from Turia Gate" }],
};

describe("PropertyMap", () => {
  it("draws every region the artwork carries", () => {
    const { container } = render(
      <PropertyMap chapter={{ id: "vann-map", shape: "map", media: [] }} copy={COPY} />,
    );
    // Each region path carries data-region, so this counts regions
    // specifically rather than every <path> in the SVG — a decorative
    // <path> added elsewhere (an arrow, a flourish) can't inflate this count
    // and mask a genuinely dropped region. Expected count comes from the
    // artwork's own keys, not a literal, so it can't drift from the art.
    expect(container.querySelectorAll("svg path[data-region]")).toHaveLength(
      Object.keys(VANN_MAP_ART.regions).length,
    );
  });

  it("places every label inside the artwork's own box", () => {
    // Fractional coordinates are transcribed by eye from the source artwork,
    // which is exactly the kind of data entry that produces a 1.2 or a -0.3
    // and puts a village out in the margin where nobody looks.
    for (const l of [...COPY.labels, COPY.lodge]) {
      expect(l.x, `${l.text} is off the map horizontally`).toBeGreaterThanOrEqual(0);
      expect(l.x, `${l.text} is off the map horizontally`).toBeLessThanOrEqual(1);
      expect(l.y, `${l.text} is off the map vertically`).toBeGreaterThanOrEqual(0);
      expect(l.y, `${l.text} is off the map vertically`).toBeLessThanOrEqual(1);
    }
  });

  it("renders the lodge's name and the getting-there facts", () => {
    const { getByText } = render(
      <PropertyMap chapter={{ id: "vann-map", shape: "map", media: [] }} copy={COPY} />,
    );
    expect(getByText("Mahua Vann")).toBeTruthy();
    expect(getByText("Five kilometres from Turia Gate")).toBeTruthy();
  });

  it("uses the real artwork, not a placeholder box", () => {
    expect(VANN_MAP_ART.regions.road.length).toBeGreaterThan(200);
  });

  it("keeps MOBILE_FONT_PX in step with LABEL_TEXT_SIZE's own base tier", () => {
    // declutterMobile's own reach estimate (labelReachPx) needs a plain
    // number to multiply a string length by, but Tailwind's build-time
    // scanner needs LABEL_TEXT_SIZE's class strings to stay literal — so
    // the "24" and "22" exist twice in the source. This is what keeps a
    // future edit to one from silently leaving the other behind.
    const base = (classes: string) => Number(classes.match(/^text-\[(\d+)px\]/)?.[1]);
    expect(base(LABEL_TEXT_SIZE.emphasis)).toBe(MOBILE_FONT_PX.gate);
    expect(base(LABEL_TEXT_SIZE.normal)).toBe(MOBILE_FONT_PX.other);
  });

  it("declutters a phone-width cluster, keeping whichever label is declared first", () => {
    // Three gates on top of one another (Task 15's own review found this on
    // Mahua Tola's north cluster) plus one gate far enough away to stand on
    // its own. Below `lg` only the first-declared gate of the cluster, and
    // the distant one, should render — the other two should carry `hidden`.
    const crowded: PropertyMapCopy = {
      heading: { text: "Where it is", dim: "is" },
      art: "vann",
      labels: [
        { text: "Kept Gate", x: 0.5, y: 0.5, kind: "gate" },
        { text: "Crowded Gate One", x: 0.502, y: 0.501, kind: "gate" },
        { text: "Crowded Gate Two", x: 0.498, y: 0.499, kind: "gate" },
        { text: "Distant Gate", x: 0.05, y: 0.05, kind: "gate" },
      ],
      lodge: { text: "Mahua Vann", x: 0.58, y: 0.63 },
      legend: [{ swatch: "gate", text: "Park entry gate" }],
      gettingThere: [],
    };
    const { getByText } = render(
      <PropertyMap chapter={{ id: "vann-map", shape: "map", media: [] }} copy={crowded} />,
    );
    const isHiddenBelowLg = (text: string) =>
      getByText(text).closest("g")?.className.baseVal.includes("hidden");

    expect(isHiddenBelowLg("Kept Gate")).toBe(false);
    expect(isHiddenBelowLg("Distant Gate")).toBe(false);
    expect(isHiddenBelowLg("Crowded Gate One")).toBe(true);
    expect(isHiddenBelowLg("Crowded Gate Two")).toBe(true);
  });
});
