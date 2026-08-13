import { describe, expect, it } from "vitest";
import { MEDIA } from "./media";
import { ROOM_CARD_ASPECT_THRESHOLD, roomCardAspect, roomCardLayout } from "./room-card";
import { VANN_COPY } from "@/content/mahua-vann";
import { TOLA_COPY } from "@/content/mahua-tola";

describe("roomCardLayout", () => {
  it("gives a wide photograph the stacked card — photo above the words", () => {
    // Repointed 13 Aug 2026: vann-room-cottage-plain was 1440x588 = 2.45:1 and
    // stacked, but Task 3's crop (the 13 Aug "crop and zoom to fit their half"
    // ruling) now ships it at 1184x789 = 1.50:1, so it moved to the `beside`
    // population and can no longer stand for the `stacked` one. pool-daylight-forest
    // (home page, untouched by that crop) is 1163x510 = 2.28:1 and stacked.
    expect(roomCardLayout("pool-daylight-forest")).toBe("stacked");
  });

  it("gives a squarer photograph the beside card", () => {
    // suite-tiger-painting is 1440x961 = 1.50:1
    expect(roomCardLayout("suite-tiger-painting")).toBe("beside");
  });

  it("gives a portrait photograph the beside card", () => {
    // tola-room-family is 1440x2160 = 0.67:1 — the one room that needs it
    expect(roomCardLayout("tola-room-family")).toBe("beside");
  });

  it("reports the photograph's real aspect, not the card's", () => {
    expect(roomCardAspect("tola-room-family")).toBeCloseTo(1440 / 2160, 3);
  });

  it("throws on an unknown id rather than defaulting to a layout", () => {
    // A silent default would put a portrait photograph in a 2.9:1 box and crop
    // 70% of it, with every test still green.
    expect(() => roomCardLayout("not-a-real-id" as never)).toThrow(/unknown media/i);
  });

  /**
   * The threshold's whole justification is that no room sits near it. If a
   * future re-crop moves one, this fails and the choice gets re-argued rather
   * than drifting.
   */
  it("keeps every room clear of the threshold by at least 0.35", () => {
    const ids = [
      ...VANN_COPY.showcaseCopy!["vann-rooms"].rooms.map((r) => r.mediaId),
      ...TOLA_COPY.showcaseCopy!["tola-rooms"].rooms.map((r) => r.mediaId),
    ];
    expect(ids.length).toBe(7);
    for (const id of ids) {
      const gap = Math.abs(roomCardAspect(id) - ROOM_CARD_ASPECT_THRESHOLD);
      expect(gap, `${id} sits too close to the layout threshold`).toBeGreaterThan(0.35);
    }
  });

  it("covers every room in both content files", () => {
    // MEDIA is an array (of MediaEntry, each carrying its own `id`), not a
    // map — Object.keys(MEDIA) would yield array indices ("0", "1", ...) and
    // make this loop vacuous. Iterate the entries themselves instead.
    for (const { id } of MEDIA) {
      if (!id.includes("room") && id !== "suite-tiger-painting") continue;
      expect(() => roomCardLayout(id as never)).not.toThrow();
    }
  });
});
