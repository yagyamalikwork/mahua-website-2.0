import { describe, expect, it } from "vitest";
import { media } from "@/lib/media";
import { PROPERTY_FULL_BLEED_KINDS, PROPERTY_IMAGE_LED_KINDS, type PropertyChapterKind } from "./property-chapters";
import { VANN_CHAPTERS, VANN_COPY } from "./mahua-vann";

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

  it("never shows the same photograph twice", () => {
    // The gap Task 7's review flagged and Task 9 carried while this file did
    // not — backfilled 9 Aug 2026. Mirrors content/chapters.test.ts's own
    // rule; scoped to this page, so the sibling card's cross-page photograph
    // (Tola's hero, on Vann's field notes) is allowed, and a second use of
    // it *here* is not.
    const seen = new Map<string, string>();
    for (const c of VANN_CHAPTERS) {
      for (const id of c.media) {
        expect(seen.get(id), `${id} appears in both "${seen.get(id)}" and "${c.id}"`).toBeUndefined();
        seen.set(id, c.id);
      }
    }
  });

  it("keeps every chapter's copy joined to the spine it renders under", () => {
    // The dial and the spine are two files that must agree: the spine's
    // `media` is what the density and rhythm rules are argued against, and
    // the copy's `mediaId`s are what the components actually draw. A plate
    // added to one but not the other would ship a page whose measured
    // composition is not its rendered one, with every other test green.
    for (const c of VANN_CHAPTERS) {
      switch (c.kind) {
        case "hero":
          expect(VANN_COPY.heroCopy, `"${c.id}" has no hero copy`).toBeDefined();
          break;
        case "chapterIntro":
          expect(VANN_COPY.chapterIntroCopy?.[c.id], `"${c.id}" has no intro copy`).toBeDefined();
          break;
        case "plateGrid": {
          const plates = VANN_COPY.plateGridCopy?.[c.id]?.plates;
          expect(plates, `"${c.id}" has no plate copy`).toBeDefined();
          expect(plates?.map((p) => p.mediaId)).toEqual([...c.media]);
          break;
        }
        case "roomsIndex": {
          const bands = VANN_COPY.roomsIndexCopy?.[c.id]?.bands;
          expect(bands, `"${c.id}" has no rooms copy`).toBeDefined();
          expect(bands?.map((b) => b.mediaId)).toEqual([...c.media]);
          break;
        }
        case "fieldNotes": {
          const notes = VANN_COPY.fieldNotesCopy?.[c.id];
          expect(notes, `"${c.id}" has no field-notes copy`).toBeDefined();
          expect([notes?.sibling.mediaId]).toEqual([...c.media]);
          break;
        }
      }
    }
  });

  it("marks every shared room photograph with a note saying what is shown", () => {
    // The honesty rule from spec §6, held mechanically: a band whose entries
    // outnumber its one photograph is implying coverage it does not have
    // unless its note says which room the photograph actually shows.
    for (const rooms of Object.values(VANN_COPY.roomsIndexCopy ?? {})) {
      for (const band of rooms.bands) {
        if (band.entries.length > 1) {
          expect(band.note, `the "${band.mediaId}" band covers ${band.entries.length} room types silently`).toBeDefined();
        }
      }
    }
  });
});
