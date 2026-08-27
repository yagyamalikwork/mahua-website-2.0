import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TOLA_COPY } from "@/content/mahua-tola";
import { VANN_COPY } from "@/content/mahua-vann";
import { TOLA_MAP_ART } from "@/lib/tola-map-art";
import { VANN_MAP_ART } from "@/lib/vann-map-art";
import {
  declutterMobile,
  LABEL_TEXT_SIZE,
  labelReachPx,
  MOBILE_FONT_PX,
  PropertyMap,
  type PropertyMapCopy,
} from "./PropertyMap";

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

  it("drops a gate label that collides with the lodge's own name", () => {
    // The lodge is not in `labels` — it is `copy.lodge`, rendered
    // separately — so the pass never saw it until 27 Aug 2026. This
    // fixture's "Turia Gate" and "Mahua Vann" sit a couple of gate-widths
    // apart on the same row, exactly the real Mahua Vann map's own defect
    // at 390px: before the fix neither was collision-checked against the
    // other, and both painted, one running through the other.
    const { width, height } = VANN_MAP_ART.viewBox;
    const dropped = declutterMobile(COPY.labels, width, height, COPY.lodge);
    const [turiaGate, penchReservoir] = COPY.labels;
    expect(dropped.has(turiaGate)).toBe(true);
    // Collateral-damage check: a water label further from the lodge's own
    // row must survive the same seeding untouched.
    expect(dropped.has(penchReservoir)).toBe(false);
  });

  it("never lets a kept label collide with the lodge's own name", () => {
    // The brief's own gate question, checked geometrically rather than by
    // reading a screenshot: for every label the pass keeps, on BOTH
    // properties' real, committed map copy, is it actually clear of the
    // lodge's own reach? Uses `labelReachPx` — the same formula the pass
    // itself collides against — because the production formula IS the
    // contract this is checking; re-deriving a second one here would only
    // prove the test agrees with itself.
    //
    // Mahua Tola is the harder case and the one the brief specifically
    // flags: sixteen gates, four zones, five water features against Mahua
    // Vann's three gates and three water features — a much denser
    // drawing to seed a new priority-zero entrant into.
    const properties = [
      { copy: VANN_COPY.mapCopy?.["vann-where"], art: VANN_MAP_ART },
      { copy: TOLA_COPY.mapCopy?.["tola-where"], art: TOLA_MAP_ART },
    ];
    for (const { copy, art } of properties) {
      expect(copy, "no map copy").toBeDefined();
      const { width, height } = art.viewBox;
      const scale = 342 / width; // MOBILE_COLUMN_PX — see declutterMobile's own comment
      const dropped = declutterMobile(copy!.labels, width, height, copy!.lodge);
      const lodgeAsGate = { text: copy!.lodge.text, x: copy!.lodge.x, y: copy!.lodge.y, kind: "gate" as const };
      const rowPx = MOBILE_FONT_PX.gate * scale * 1.3;

      for (const l of copy!.labels) {
        if (l.kind !== "gate" && l.kind !== "zone" && l.kind !== "water") continue;
        if (dropped.has(l)) continue; // dropped labels never paint — they can't collide with anything
        const dy = Math.abs(l.y * height * scale - lodgeAsGate.y * height * scale);
        const rowGap = l.kind === "gate" ? rowPx : rowPx * 0.6;
        if (dy >= rowGap) continue; // different rows — text can't run into it
        const lpx = l.x * width * scale;
        const lodgePx = lodgeAsGate.x * width * scale;
        const leftReach = lpx < lodgePx ? labelReachPx(l, scale) : labelReachPx(lodgeAsGate, scale);
        expect(
          Math.abs(lpx - lodgePx),
          `"${l.text}" collides with "${copy!.lodge.text}"`,
        ).toBeGreaterThanOrEqual(leftReach);
      }
    }
  });

  it("does not cost Mahua Tola the one gate its own copy names", () => {
    // Step 5's real question, made mechanical: seeding the lodge must not
    // drop "Kolara" — the gate `content/mahua-tola.ts`'s own map heading
    // and getting-there row both name — even though Tola's north cluster
    // sits close enough to the lodge's own row for several gates there to
    // be at risk. `content/mahua-tola.ts`'s own comment on `labels` is what
    // orders Kolara first for exactly this; this test is what confirms the
    // ordering actually pays off once the lodge is in the pass too.
    const copy = TOLA_COPY.mapCopy?.["tola-where"];
    expect(copy, "no map copy").toBeDefined();
    const { width, height } = TOLA_MAP_ART.viewBox;
    const dropped = declutterMobile(copy!.labels, width, height, copy!.lodge);
    const kolara = copy!.labels.find((l) => l.text === "Kolara");
    expect(kolara, '"Kolara" missing from Tola\'s own map copy').toBeDefined();
    expect(dropped.has(kolara!)).toBe(false);
  });
});
