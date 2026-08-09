import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VANN_MAP_ART } from "@/lib/vann-map-art";
import { PropertyMap, type PropertyMapCopy } from "./PropertyMap";

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
    // Four regions, one path each. A map that silently drops one is a map
    // with no road or no water on it, and nothing else would notice.
    expect(container.querySelectorAll("svg path")).toHaveLength(4);
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
});
