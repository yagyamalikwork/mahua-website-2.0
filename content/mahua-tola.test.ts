import { describe, expect, it } from "vitest";
import { HOME } from "@/content/home";
import { media } from "@/lib/media";
import { PROPERTY_FULL_BLEED_KINDS, PROPERTY_IMAGE_LED_KINDS, type PropertyChapterKind } from "./property-chapters";
import { TOLA_CHAPTERS, TOLA_COPY } from "./mahua-tola";

const MIN_MEDIA = {
  hero: 1,
  chapterIntro: 3,
  plateGrid: 1,
  fullBleedQuote: 1,
  roomsIndex: 1,
  fieldNotes: 0,
} satisfies Record<PropertyChapterKind, number>;

describe("TOLA_CHAPTERS", () => {
  it("opens on the hero and closes on field notes", () => {
    expect(TOLA_CHAPTERS[0].kind).toBe("hero");
    expect(TOLA_CHAPTERS[TOLA_CHAPTERS.length - 1].kind).toBe("fieldNotes");
  });

  it("has unique ids", () => {
    expect(new Set(TOLA_CHAPTERS.map((c) => c.id)).size).toBe(TOLA_CHAPTERS.length);
  });

  it("never runs two quiet screens back to back", () => {
    for (let i = 0; i < TOLA_CHAPTERS.length - 1; i++) {
      const a = PROPERTY_IMAGE_LED_KINDS.includes(TOLA_CHAPTERS[i].kind);
      const b = PROPERTY_IMAGE_LED_KINDS.includes(TOLA_CHAPTERS[i + 1].kind);
      expect(a || b, `"${TOLA_CHAPTERS[i].id}" and "${TOLA_CHAPTERS[i + 1].id}" are both quiet`).toBe(true);
    }
  });

  it("carries enough photographs in each chapter for its layout", () => {
    for (const c of TOLA_CHAPTERS) {
      expect(c.media.length, `"${c.id}" is a ${c.kind} with ${c.media.length} image(s)`).toBeGreaterThanOrEqual(
        MIN_MEDIA[c.kind],
      );
    }
  });

  it("only uses full-bleed-safe images where the layout is full-bleed", () => {
    for (const c of TOLA_CHAPTERS) {
      if (!PROPERTY_FULL_BLEED_KINDS.includes(c.kind)) continue;
      for (const id of c.media) {
        const m = media(id);
        expect(m.fullBleedSafe, `${id} is only ${m.width}px wide`).toBe(true);
      }
    }
  });

  it("references only real images", () => {
    for (const c of TOLA_CHAPTERS) for (const id of c.media) expect(() => media(id)).not.toThrow();
  });

  it("numbers its chapters 01, 02, 03 … with no gaps or repeats", () => {
    const numbered = TOLA_CHAPTERS.filter((c) => c.number);
    expect(numbered.map((c) => Number(c.number))).toEqual(numbered.map((_, i) => i + 1));
  });

  it("never shows the same photograph twice", () => {
    const seen = new Map<string, string>();
    for (const c of TOLA_CHAPTERS) {
      for (const id of c.media) {
        expect(seen.get(id), `${id} appears in both "${seen.get(id)}" and "${c.id}"`).toBeUndefined();
        seen.set(id, c.id);
      }
    }
  });

  it("reuses its guest quote byte-identical to the attributed original in content/home.ts", () => {
    // FullBleedQuoteCopy carries only `quote` — there is nowhere on a
    // full-bleed photograph to set a name, source and year in the display
    // serif the home page uses for pull-quotes. So this page's attribution
    // lives one level up: "tola-guest-word" is Vedant, 2019, Tripadvisor —
    // content/home.ts's own guests.quotes[1], which content/home.test.ts's
    // "attributes every guest quote" test already holds to a name, a source
    // and a year. This test is what keeps the two copies from silently
    // diverging — an edit to one without the other would otherwise ship
    // unattributed words with nothing to catch it.
    const original = HOME.chapters.guests.quotes.find((q) => q.name === "Vedant");
    expect(original, "content/home.ts no longer carries Vedant's quote").toBeDefined();
    expect(TOLA_COPY.fullBleedQuoteCopy?.["tola-guest-word"]?.quote).toBe(original?.quote);
  });
});
