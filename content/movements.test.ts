import { describe, expect, it } from "vitest";
import { hexToRgb, relativeLuminance } from "@/lib/contrast";
import { lightState, LIGHT_STATES } from "@/lib/palette";
import { BANDS } from "./movements";

const lum = (id: string) => relativeLuminance(hexToRgb(lightState(id as never).bg));

describe("BANDS", () => {
  it("runs dawn to night", () => {
    expect(BANDS[0].state).toBe("dawn");
    expect(BANDS[BANDS.length - 1].state).toBe("night");
  });

  it("gives every band a positive weight and a unique id", () => {
    for (const b of BANDS) expect(b.weight, b.id).toBeGreaterThan(0);
    expect(new Set(BANDS.map((b) => b.id)).size).toBe(BANDS.length);
  });

  it("keeps cream the home key — light bands are at least 70% of scroll height", () => {
    // spec section 9. The Plan 1 preview was only 57% light because every panel
    // was the same height; real movements are not.
    const total = BANDS.reduce((n, b) => n + b.weight, 0);
    const light = BANDS.filter((b) => lum(b.state) > 0.5).reduce((n, b) => n + b.weight, 0);
    expect(light / total).toBeGreaterThanOrEqual(0.7);
  });

  it("puts every light/dark crossing in a band that carries no text", () => {
    // spec section 13 / decision D13 — the whole point of this plan.
    for (let i = 0; i < BANDS.length - 1; i++) {
      const crosses = Math.abs(lum(BANDS[i].state) - lum(BANDS[i + 1].state)) > 0.3;
      if (!crosses) continue;
      const crossingBand = BANDS[i + 1];
      expect(
        crossingBand.carriesText,
        `light crosses into "${crossingBand.id}", which carries text — spec section 13 forbids this`,
      ).toBe(false);
    }
  });

  it("gives every text-free crossing band an image, so it is not a blank screen", () => {
    for (const b of BANDS.filter((x) => !x.carriesText)) {
      expect(b.image, `${b.id} carries no text and no image`).toBeTruthy();
    }
  });

  it("runs the day forwards — states never go backwards", () => {
    // BANDS is the single source of truth for order, so ordering is exactly
    // what it must verify. Consecutive bands may repeat a state (a crossing
    // band shares its state with the movement it leads into), but the day
    // must never run backwards.
    const order = LIGHT_STATES.map((s) => s.id);
    let previous = -1;
    for (const band of BANDS) {
      const index = order.indexOf(band.state);
      expect(index, `${band.id} has an unknown state`).toBeGreaterThanOrEqual(0);
      expect(index, `${band.id} (${band.state}) goes backwards`).toBeGreaterThanOrEqual(previous);
      previous = index;
    }
  });
});
