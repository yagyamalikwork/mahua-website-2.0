import { describe, expect, it } from "vitest";
import { media } from "@/lib/media";
import {
  findRepeatedShape,
  PROPERTY_FULL_BLEED_SHAPES,
  PROPERTY_IMAGE_LED_SHAPES,
  type PropertyShape,
} from "./property-chapters";
import { VANN_CHAPTERS, VANN_COPY } from "./mahua-vann";

const MIN_MEDIA = {
  fullBleed: 1,
  column: 0,
  map: 0,
  showcase: 1,
  // 2 until 26 Aug 2026, when `pair` (`ExperiencePair`, any even count from 2
  // up) became `strip` (`ExperienceStrip`, the home page's own six-card
  // import, always exactly six) — mirrors `content/chapters.test.ts`'s own
  // `MIN_MEDIA.experienceStrip: 6` for the home page's identical shape.
  strip: 6,
  press: 0,
  invitation: 1,
} satisfies Record<PropertyShape, number>;

describe("VANN_CHAPTERS", () => {
  it("opens on the hero and closes on the invitation", () => {
    expect(VANN_CHAPTERS[0].shape).toBe("fullBleed");
    expect(VANN_CHAPTERS[0].id).toBe("vann-hero");
    expect(VANN_CHAPTERS[VANN_CHAPTERS.length - 1].shape).toBe("invitation");
  });

  it("has unique ids", () => {
    expect(new Set(VANN_CHAPTERS.map((c) => c.id)).size).toBe(VANN_CHAPTERS.length);
  });

  it("never runs two moments of the same shape back to back", () => {
    // The rule the whole redesign turns on. The pages this replaced opened
    // three consecutive sections with the identical move, and the client's
    // word for the result was "templaty".
    const repeat = findRepeatedShape(VANN_CHAPTERS);
    expect(
      repeat && `"${repeat.first}" and "${repeat.second}" are both ${repeat.shape}`,
    ).toBeUndefined();
  });

  it("never runs two quiet screens back to back", () => {
    // Independent of the rule above and equally binding: `column` and `press`
    // are both type-led, so a spine could satisfy the shape rule and still
    // put two silent screens together.
    for (let i = 0; i < VANN_CHAPTERS.length - 1; i++) {
      const a = PROPERTY_IMAGE_LED_SHAPES.includes(VANN_CHAPTERS[i].shape);
      const b = PROPERTY_IMAGE_LED_SHAPES.includes(VANN_CHAPTERS[i + 1].shape);
      expect(a || b, `"${VANN_CHAPTERS[i].id}" and "${VANN_CHAPTERS[i + 1].id}" are both quiet`).toBe(true);
    }
  });

  it("carries enough photographs in each chapter for its layout", () => {
    for (const c of VANN_CHAPTERS) {
      expect(c.media.length, `"${c.id}" is a ${c.shape} with ${c.media.length} image(s)`).toBeGreaterThanOrEqual(
        MIN_MEDIA[c.shape],
      );
    }
  });

  it("only uses full-bleed-safe images where the layout is full-bleed", () => {
    for (const c of VANN_CHAPTERS) {
      if (!PROPERTY_FULL_BLEED_SHAPES.includes(c.shape)) continue;
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
    // Mirrors content/chapters.test.ts's own rule; scoped to this page, so
    // the sibling card's cross-page photograph (Tola's own dinner, on Vann's
    // invitation) is allowed, and a second use of it *here* is not.
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
    // the copy's `mediaId`s are what the components actually draw. A photo
    // added to one but not the other would ship a page whose measured
    // composition is not its rendered one, with every other test green.
    for (const c of VANN_CHAPTERS) {
      switch (c.shape) {
        case "fullBleed":
          if (c.id === "vann-hero") {
            expect(VANN_COPY.heroCopy, `"${c.id}" has no hero copy`).toBeDefined();
          } else {
            expect(VANN_COPY.quoteCopy?.[c.id], `"${c.id}" has no quote copy`).toBeDefined();
          }
          break;
        case "column":
          expect(VANN_COPY.columnCopy?.[c.id], `"${c.id}" has no column copy`).toBeDefined();
          break;
        case "map":
          expect(VANN_COPY.mapCopy?.[c.id], `"${c.id}" has no map copy`).toBeDefined();
          break;
        case "showcase": {
          const rooms = VANN_COPY.showcaseCopy?.[c.id]?.rooms;
          expect(rooms, `"${c.id}" has no showcase copy`).toBeDefined();
          expect(rooms?.map((r) => r.mediaId)).toEqual([...c.media]);
          break;
        }
        case "strip": {
          const experiences = VANN_COPY.stripCopy?.[c.id]?.experiences;
          expect(experiences, `"${c.id}" has no strip copy`).toBeDefined();
          expect(experiences?.map((e) => e.mediaId)).toEqual([...c.media]);
          break;
        }
        case "press":
          expect(VANN_COPY.pressCopy?.[c.id], `"${c.id}" has no press copy`).toBeDefined();
          break;
        case "invitation": {
          const invitation = VANN_COPY.invitationCopy?.[c.id];
          expect(invitation, `"${c.id}" has no invitation copy`).toBeDefined();
          expect([invitation?.sibling.mediaId]).toEqual([...c.media]);
          break;
        }
      }
    }
  });

  it("marks every shared room photograph with a note saying what is shown", () => {
    // The honesty rule from spec §6, held mechanically: if a photograph ever
    // ends up doing double duty for two room types again, the entries
    // sharing it must say which room it actually shows. Currently vacuous —
    // Task 11 curated a photograph of its own for every room type, so
    // nothing shares — but kept as a guard against the regression the old
    // file shipped with ("Shown: Cottage with Deck." standing in for both
    // cottage types).
    for (const showcase of Object.values(VANN_COPY.showcaseCopy ?? {})) {
      const byMedia = new Map<string, number>();
      for (const room of showcase.rooms) byMedia.set(room.mediaId, (byMedia.get(room.mediaId) ?? 0) + 1);
      for (const room of showcase.rooms) {
        if ((byMedia.get(room.mediaId) ?? 0) > 1) {
          expect(room.note, `"${room.mediaId}" is shared by more than one room type silently`).toBeDefined();
        }
      }
    }
  });

  it("places every map label inside the artwork", () => {
    const map = VANN_COPY.mapCopy?.["vann-where"];
    expect(map, "no map copy").toBeDefined();
    for (const l of [...(map?.labels ?? []), map!.lodge]) {
      expect(l.x, `${l.text} x`).toBeGreaterThanOrEqual(0);
      expect(l.x, `${l.text} x`).toBeLessThanOrEqual(1);
      expect(l.y, `${l.text} y`).toBeGreaterThanOrEqual(0);
      expect(l.y, `${l.text} y`).toBeLessThanOrEqual(1);
    }
  });

  // **"keeps an even number of quiet experiences between each hero" was
  // here until 26 August 2026.** It guarded `ExperiencePair`'s two-column
  // `hero`/`quiet` grid, which does not exist any more: `ExperienceCopy`
  // (`content/home.ts`'s, imported as `HOME_EXPERIENCES`) has no `weight`
  // field at all, because `ExperienceStrip`'s cards are a single flex row,
  // not a grid with a two-column hazard to guard against. Deleted rather
  // than adapted — there is no successor question to ask of a shape this
  // page no longer renders.

  it("runs the home page's card strip at 03 · The Experience, not the old pair", () => {
    // The client's own words, 26 Aug 2026: "replace it with the exact same
    // copy-pasted activities carousel from our homepage … for now just
    // place the entire carousel as it is."
    const day = VANN_CHAPTERS.find((c) => c.id === "vann-day");
    expect(day?.shape).toBe("strip");
    // `pairCopy` no longer exists on `PropertyPageCopy` at all — cast rather
    // than access directly, mirroring `content/home.test.ts`'s own guard for
    // this shape of check (a field removed from the type, not merely unset).
    expect((VANN_COPY as Record<string, unknown>).pairCopy).toBeUndefined();
    expect(VANN_COPY.stripCopy?.["vann-day"].experiences).toHaveLength(6);
  });

  it("keeps its own words above the strip — the client's ruling, cards only", () => {
    // Cards only, not the whole section — his ruling when asked, because
    // three pages opening on identical sentences is the "very wordpress and
    // templaty" verdict that started this redesign. Vann's own heading and
    // intro survive the swap untouched.
    expect(VANN_COPY.stripCopy?.["vann-day"].heading.text).toBe("The day at Vann");
  });

  it("dims a word that is actually in its heading, exactly once", () => {
    // Mirrors content/home.test.ts's own guard, which VANN_COPY had none of
    // (fix round 1, Finding 2). If the dim word is absent the effect
    // silently does nothing; if it appears twice, which occurrence gets
    // dimmed is down to whichever way the component happens to split the
    // string. Both are invisible without this.
    //
    // Collected structurally rather than by listing each heading's path by
    // hand: any object anywhere in VANN_COPY with a string `text` and a
    // string `dim` is a TwoTone — nothing else in this file's copy shapes
    // combines those two keys — so a seventh heading added later is covered
    // the moment it is written, with no test edit required. HeroCopy has no
    // `dim` field, so the hero is correctly skipped rather than needing a
    // special case.
    const found: { text: string; dim: string }[] = [];
    const walk = (value: unknown) => {
      if (!value || typeof value !== "object") return;
      const obj = value as Record<string, unknown>;
      if (typeof obj.text === "string" && typeof obj.dim === "string") {
        found.push({ text: obj.text, dim: obj.dim });
      }
      for (const v of Object.values(obj)) walk(v);
    };
    walk(VANN_COPY);

    expect(found.length, "found no TwoTone headings in VANN_COPY at all").toBeGreaterThan(0);
    for (const { text, dim } of found) {
      const occurrences = text.split(dim).length - 1;
      expect(occurrences, `"${dim}" appears ${occurrences}× in "${text}"`).toBe(1);
    }
  });

  it("has the client's 26 Aug spine — no table band, an unheaded map, renumbered chapters", () => {
    const ids = VANN_CHAPTERS.map((c) => c.id);
    expect(ids).toEqual([
      "vann-hero", "vann-forest", "vann-where", "vann-rooms", "vann-day", "vann-press", "vann-invitation",
    ]);
    const numbered = VANN_CHAPTERS.filter((c) => c.number).map((c) => `${c.number} ${c.label}`);
    expect(numbered).toEqual([
      "01 The Forest", "02 The Rooms", "03 The Experience", "04 Written About",
    ]);
  });

  it("gives the map no heading — it is an extension of 01, by the client's ruling", () => {
    const map = VANN_CHAPTERS.find((c) => c.id === "vann-where");
    expect(map?.number).toBeUndefined();
    expect(map?.label).toBeUndefined();
  });

  it("carries no full-bleed quote copy — the table band went on 26 Aug 2026", () => {
    expect(VANN_COPY.quoteCopy).toBeUndefined();
  });
});
