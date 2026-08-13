import { describe, expect, it } from "vitest";
import { media, MEDIA } from "./media";
import { roomCardAspect } from "./room-card";
import { VANN_COPY } from "@/content/mahua-vann";
import { TOLA_COPY } from "@/content/mahua-tola";

// Every room across both content files — reused by the population guard
// below. MEDIA is an array (of MediaEntry, each carrying its own `id`), not a
// map — Object.keys(MEDIA) would yield array indices ("0", "1", ...) and make
// a coverage loop vacuous, so this collects ids straight off the content
// files instead of guessing at MEDIA's shape.
const EVERY_ROOM_MEDIA_ID = [
  ...VANN_COPY.showcaseCopy!["vann-rooms"].rooms.map((r) => r.mediaId),
  ...TOLA_COPY.showcaseCopy!["tola-rooms"].rooms.map((r) => r.mediaId),
];

describe("roomCardAspect", () => {
  // Corrected 14 Aug 2026 (image-sizing Task 4 review, Important 3): this
  // test used to assert against 1707/2560 — the SOURCE file's own pixel
  // dimensions (`reference/wp-media/property-pages/DSC09703-scaled.jpg`,
  // confirmed with `sharp().metadata()`), which Task 3 never re-crops and
  // which the manifest does not emit at. The manifest's own numbers
  // (1440x2160, a proportional resize of the source) were close enough —
  // Δ ≈ 1.3e-4, inside `toBeCloseTo(…, 3)`'s 5e-4 tolerance — that the wrong
  // pair still passed, under a title claiming to report the photograph's
  // REAL aspect. Deriving the expectation from `media()` itself, rather than
  // from a number copied out of a review comment, is what keeps this from
  // drifting from the asset again.
  it("reports the photograph's real aspect, not the card's", () => {
    const entry = media("tola-room-family");
    expect(roomCardAspect("tola-room-family")).toBeCloseTo(entry.width / entry.height, 6);
  });

  // Critical 1 of the same review: this function used to read only the
  // manifest's canonical (largest) tier. `vann-room-cottage-plain`'s
  // canonical tier is 1184x789 = 1.500634, but its own independently-rounded
  // 640-wide tier is 640x426 = 1.502347 — a real candidate `sizes` can select
  // at 1024x1366, and HIGHER than the canonical number. Proven directly
  // against the manifest's own smaller tier, not assumed from the function's
  // implementation.
  it("returns the WORST aspect across every emitted tier, not just the canonical one", () => {
    const entry = media("vann-room-cottage-plain");
    const canonical = entry.width / entry.height;
    const worstTier = Math.max(...entry.sources.map((s) => s.width / s.height));
    expect(worstTier).toBeGreaterThan(canonical);
    expect(roomCardAspect("vann-room-cottage-plain")).toBeCloseTo(worstTier, 10);
    expect(roomCardAspect("vann-room-cottage-plain")).toBeCloseTo(640 / 426, 6);
  });

  it("throws on an unknown id rather than defaulting", () => {
    expect(() => roomCardAspect("no-such-photo" as never)).toThrow(/Unknown media id/);
  });
});

describe("the beside population", () => {
  // The composition is the client's own ruling (13 Aug 2026) and no longer
  // derived from the photograph — but the geometry still assumes no room
  // photograph reads wide. The solved bound keeps the CROP legal at any
  // aspect; what it cannot do is stop a 2.3:1 letterbox floating in a band of
  // cream inside its half (the exact look the ruling replaced). §2 #46 is the
  // history: a like-for-like photo swap silently reshaping a chapter. 1.6 is
  // 1.50 (the widest current room, cottage-plain's 1184/789) plus margin.
  //
  // `roomCardAspect` reads the WORST tier since 14 Aug 2026 (Critical 1,
  // above), so this bound now covers every emitted tier, not only the
  // canonical one — the highest measured today is still cottage-plain, but
  // its own 640-wide tier (1.502347), not its canonical 1184-wide one
  // (1.500634).
  it("keeps every room photograph at or under 1.6:1, in both content files", () => {
    expect(EVERY_ROOM_MEDIA_ID.length).toBe(7);
    for (const id of EVERY_ROOM_MEDIA_ID) {
      expect(roomCardAspect(id), id).toBeLessThanOrEqual(1.6);
    }
  });

  it("covers every room in both content files", () => {
    for (const { id } of MEDIA) {
      if (!id.includes("room") && id !== "suite-tiger-painting") continue;
      expect(() => roomCardAspect(id as never)).not.toThrow();
    }
  });
});
