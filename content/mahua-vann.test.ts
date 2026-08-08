import { describe, expect, it } from "vitest";
import { media } from "@/lib/media";
import { PROPERTY_FULL_BLEED_KINDS, PROPERTY_IMAGE_LED_KINDS, type PropertyChapterKind } from "./property-chapters";
import { VANN_CHAPTERS } from "./mahua-vann";

const MIN_MEDIA = {
  hero: 1,
  chapterIntro: 3,
  plateGrid: 1,
  fullBleedQuote: 1,
  roomsIndex: 1,
  fieldNotes: 0,
} satisfies Record<PropertyChapterKind, number>;

describe("VANN_CHAPTERS", () => {
  it("opens on the hero and closes on field notes", () => {
    expect(VANN_CHAPTERS[0].kind).toBe("hero");
    expect(VANN_CHAPTERS[VANN_CHAPTERS.length - 1].kind).toBe("fieldNotes");
  });

  it("has unique ids", () => {
    expect(new Set(VANN_CHAPTERS.map((c) => c.id)).size).toBe(VANN_CHAPTERS.length);
  });

  it("never runs two quiet screens back to back", () => {
    for (let i = 0; i < VANN_CHAPTERS.length - 1; i++) {
      const a = PROPERTY_IMAGE_LED_KINDS.includes(VANN_CHAPTERS[i].kind);
      const b = PROPERTY_IMAGE_LED_KINDS.includes(VANN_CHAPTERS[i + 1].kind);
      expect(a || b, `"${VANN_CHAPTERS[i].id}" and "${VANN_CHAPTERS[i + 1].id}" are both quiet`).toBe(true);
    }
  });

  it("carries enough photographs in each chapter for its layout", () => {
    for (const c of VANN_CHAPTERS) {
      expect(c.media.length, `"${c.id}" is a ${c.kind} with ${c.media.length} image(s)`).toBeGreaterThanOrEqual(
        MIN_MEDIA[c.kind],
      );
    }
  });

  it("only uses full-bleed-safe images where the layout is full-bleed", () => {
    for (const c of VANN_CHAPTERS) {
      if (!PROPERTY_FULL_BLEED_KINDS.includes(c.kind)) continue;
      for (const id of c.media) {
        const m = media(id);
        expect(m.fullBleedSafe, `${id} is only ${m.width}px wide`).toBe(true);
      }
    }
  });

  it("references only real images", () => {
    for (const c of VANN_CHAPTERS) for (const id of c.media) expect(() => media(id)).not.toThrow();
  });

  it("numbers its chapters 01, 02, 03 … with no gaps or repeats", () => {
    const numbered = VANN_CHAPTERS.filter((c) => c.number);
    expect(numbered.map((c) => Number(c.number))).toEqual(numbered.map((_, i) => i + 1));
  });
});
