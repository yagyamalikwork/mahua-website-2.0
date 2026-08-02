import { describe, expect, it } from "vitest";
import { BANDS } from "@/content/movements";
import { carriesTextAt, stopsAt } from "./timeline";

describe("stopsAt", () => {
  it("starts at dawn and ends at night", () => {
    expect(stopsAt(0).from).toBe("dawn");
    expect(stopsAt(1).to).toBe("night");
  });

  it("holds the colour still through a band that carries text", () => {
    // Mid-way through "the-lodges" the colour must not be moving: from and to
    // are the same state, so any t produces that state's exact background.
    const total = BANDS.reduce((n, b) => n + b.weight, 0);
    let acc = 0;
    for (const b of BANDS) {
      const mid = (acc + b.weight / 2) / total;
      acc += b.weight;
      if (!b.carriesText) continue;
      const s = stopsAt(mid);
      expect(s.from, `${b.id} is moving mid-band`).toBe(s.to);
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
