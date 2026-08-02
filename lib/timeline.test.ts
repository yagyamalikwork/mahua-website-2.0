import { describe, expect, it } from "vitest";
import { BANDS } from "@/content/movements";
import { carriesTextAt, stopsAt, STOPS } from "./timeline";

describe("stopsAt", () => {
  it("starts at dawn and ends at night", () => {
    expect(stopsAt(0).from).toBe("dawn");
    expect(stopsAt(1).to).toBe("night");
  });

  it("holds the colour still through a band whose state matches its predecessor's", () => {
    // A band only holds the colour flat when it enters in its own state — i.e.
    // the previous band already shared that state. Bands that legitimately
    // sweep between two differing states (e.g. "the-gate": dawn -> firstLight)
    // are excluded here; they get their own "sweeps" test below.
    const total = BANDS.reduce((n, b) => n + b.weight, 0);
    let acc = 0;
    for (let i = 0; i < BANDS.length; i++) {
      const b = BANDS[i];
      const mid = (acc + b.weight / 2) / total;
      acc += b.weight;
      const entering = i === 0 ? b.state : BANDS[i - 1].state;
      if (entering !== b.state) continue;
      const s = stopsAt(mid);
      expect(s.from, `${b.id} is moving mid-band`).toBe(s.to);
    }
  });

  it("sweeps the colour across every crossing band", () => {
    // The bands that carry no text are exactly where the light/dark crossings
    // happen. If these are flat, the background snaps at a hard seam instead
    // of bleeding, and nothing else in the suite would notice.
    const total = BANDS.reduce((n, b) => n + b.weight, 0);
    let acc = 0;
    for (const b of BANDS) {
      const mid = (acc + b.weight / 2) / total;
      acc += b.weight;
      if (b.carriesText) continue;
      const s = stopsAt(mid);
      expect(s.from, `${b.id} is flat — the colour has nowhere to travel`).not.toBe(s.to);
      expect(s.t).toBeGreaterThan(0);
      expect(s.t).toBeLessThan(1);
    }
  });

  it("has no zero-width transition between differing states", () => {
    // A state change squeezed into zero width is a snap, not a bleed.
    for (let i = 0; i < STOPS.length - 1; i++) {
      if (STOPS[i].state === STOPS[i + 1].state) continue;
      expect(
        STOPS[i + 1].at - STOPS[i].at,
        `${STOPS[i].state} -> ${STOPS[i + 1].state} has no width to move in`,
      ).toBeGreaterThan(0);
    }
  });

  it("clamps outside 0..1", () => {
    expect(stopsAt(-1).from).toBe("dawn");
    expect(stopsAt(2).to).toBe("night");
  });
});

describe("carriesTextAt", () => {
  it("is false inside the crossing bands and true inside the movements", () => {
    const total = BANDS.reduce((n, b) => n + b.weight, 0);
    let acc = 0;
    for (const b of BANDS) {
      const mid = (acc + b.weight / 2) / total;
      acc += b.weight;
      expect(carriesTextAt(mid), b.id).toBe(b.carriesText);
    }
  });
});
