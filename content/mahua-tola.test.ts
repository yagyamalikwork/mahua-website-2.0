import { describe, expect, it } from "vitest";
import { media } from "@/lib/media";
import {
  findRepeatedShape,
  PROPERTY_FULL_BLEED_SHAPES,
  PROPERTY_IMAGE_LED_SHAPES,
  type PropertyShape,
} from "./property-chapters";
import { VANN_COPY } from "./mahua-vann";
import { TOLA_CHAPTERS, TOLA_COPY } from "./mahua-tola";

const MIN_MEDIA = {
  fullBleed: 1,
  column: 0,
  map: 0,
  showcase: 1,
  pair: 2,
  press: 0,
  invitation: 1,
} satisfies Record<PropertyShape, number>;

describe("TOLA_CHAPTERS", () => {
  it("opens on the hero and closes on the invitation", () => {
    expect(TOLA_CHAPTERS[0].shape).toBe("fullBleed");
    expect(TOLA_CHAPTERS[0].id).toBe("tola-hero");
    expect(TOLA_CHAPTERS[TOLA_CHAPTERS.length - 1].shape).toBe("invitation");
  });

  it("has unique ids", () => {
    expect(new Set(TOLA_CHAPTERS.map((c) => c.id)).size).toBe(TOLA_CHAPTERS.length);
  });

  it("never runs two moments of the same shape back to back", () => {
    // Tola's spine is deliberately not Vann's: a guest's word where Vann has
    // a press band, moved earlier in the run, so this page has two fullBleed
    // moments (tola-guest-word, tola-table) rather than one. This test is
    // what proves they never end up adjacent to each other or to the hero.
    const repeat = findRepeatedShape(TOLA_CHAPTERS);
    expect(
      repeat && `"${repeat.first}" and "${repeat.second}" are both ${repeat.shape}`,
    ).toBeUndefined();
  });

  it("never runs two quiet screens back to back", () => {
    // Independent of the rule above and equally binding: `column` is this
    // page's only quiet shape (there is no `press` band), flanked on both
    // sides by image-led moments.
    for (let i = 0; i < TOLA_CHAPTERS.length - 1; i++) {
      const a = PROPERTY_IMAGE_LED_SHAPES.includes(TOLA_CHAPTERS[i].shape);
      const b = PROPERTY_IMAGE_LED_SHAPES.includes(TOLA_CHAPTERS[i + 1].shape);
      expect(a || b, `"${TOLA_CHAPTERS[i].id}" and "${TOLA_CHAPTERS[i + 1].id}" are both quiet`).toBe(true);
    }
  });

  it("carries enough photographs in each chapter for its layout", () => {
    for (const c of TOLA_CHAPTERS) {
      expect(c.media.length, `"${c.id}" is a ${c.shape} with ${c.media.length} image(s)`).toBeGreaterThanOrEqual(
        MIN_MEDIA[c.shape],
      );
    }
  });

  it("only uses full-bleed-safe images where the layout is full-bleed", () => {
    // Task 12's own brief was tripped by exactly this rule (a 1163px
    // photograph assigned to a fullBleed slot) — this is the mechanical
    // guard against repeating it. tola-hero, tola-guest-word and tola-table
    // all render edge-to-edge and all check out at 1440px.
    for (const c of TOLA_CHAPTERS) {
      if (!PROPERTY_FULL_BLEED_SHAPES.includes(c.shape)) continue;
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
    // Mirrors content/chapters.test.ts's own rule; scoped to this page, so
    // vann-hero (used cross-page as this page's own invitation sibling, the
    // same move Vann's own invitation makes with tola-candlelit-dinner) is
    // allowed, and a second use of it *here* is not.
    const seen = new Map<string, string>();
    for (const c of TOLA_CHAPTERS) {
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
    for (const c of TOLA_CHAPTERS) {
      switch (c.shape) {
        case "fullBleed":
          if (c.id === "tola-hero") {
            expect(TOLA_COPY.heroCopy, `"${c.id}" has no hero copy`).toBeDefined();
          } else {
            expect(TOLA_COPY.quoteCopy?.[c.id], `"${c.id}" has no quote copy`).toBeDefined();
          }
          break;
        case "column":
          expect(TOLA_COPY.columnCopy?.[c.id], `"${c.id}" has no column copy`).toBeDefined();
          break;
        case "map":
          expect(TOLA_COPY.mapCopy?.[c.id], `"${c.id}" has no map copy`).toBeDefined();
          break;
        case "showcase": {
          const rooms = TOLA_COPY.showcaseCopy?.[c.id]?.rooms;
          expect(rooms, `"${c.id}" has no showcase copy`).toBeDefined();
          expect(rooms?.map((r) => r.mediaId)).toEqual([...c.media]);
          break;
        }
        case "pair": {
          const experiences = TOLA_COPY.pairCopy?.[c.id]?.experiences;
          expect(experiences, `"${c.id}" has no pair copy`).toBeDefined();
          expect(experiences?.map((e) => e.mediaId)).toEqual([...c.media]);
          break;
        }
        case "invitation": {
          const invitation = TOLA_COPY.invitationCopy?.[c.id];
          expect(invitation, `"${c.id}" has no invitation copy`).toBeDefined();
          expect([invitation?.sibling.mediaId]).toEqual([...c.media]);
          break;
        }
      }
    }
  });

  it("marks every shared room photograph with a note saying what is shown", () => {
    // Vacuous on this page by construction — the showcase's four rows each
    // use their own distinct photograph (Super Deluxe Cottage, which shares
    // the Suite's styling, is named in the intro paragraph rather than given
    // a row, since it has no interior photograph of its own to share a row
    // with without repeating a media id within the chapter). Kept as a guard
    // against the regression the pre-redesign file shipped with.
    for (const showcase of Object.values(TOLA_COPY.showcaseCopy ?? {})) {
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
    const map = TOLA_COPY.mapCopy?.["tola-where"];
    expect(map, "no map copy").toBeDefined();
    for (const l of [...(map?.labels ?? []), map!.lodge]) {
      expect(l.x, `${l.text} x`).toBeGreaterThanOrEqual(0);
      expect(l.x, `${l.text} x`).toBeLessThanOrEqual(1);
      expect(l.y, `${l.text} y`).toBeGreaterThanOrEqual(0);
      expect(l.y, `${l.text} y`).toBeLessThanOrEqual(1);
    }
  });

  it("keeps an even number of quiet experiences between each hero", () => {
    // ExperiencePair lays out in a two-column grid where a `hero` spans both
    // columns. If a `hero` is preceded by an ODD number of `quiet` entries,
    // CSS grid cannot fit it in the half-row left over and leaves a visible
    // empty cell (Task 6's carry-forward note, same guard as Vann's file).
    const experiences = TOLA_COPY.pairCopy?.["tola-day"]?.experiences ?? [];
    expect(experiences.length, "tola-day has no experiences to check").toBeGreaterThan(0);
    let quietRun = 0;
    for (const e of experiences) {
      if (e.weight === "quiet") {
        quietRun++;
        continue;
      }
      expect(
        quietRun % 2,
        `"${e.name}" is a hero preceded by ${quietRun} quiet experience(s) — an odd run orphans a grid cell`,
      ).toBe(0);
      quietRun = 0;
    }
  });

  it("dims a word that is actually in its heading, exactly once", () => {
    // Mirrors content/home.test.ts's own guard and content/mahua-vann.test.ts's
    // copy of it. Collected structurally: any object anywhere in TOLA_COPY
    // with a string `text` and a string `dim` is a TwoTone — nothing else in
    // this file's copy shapes combines those two keys.
    const found: { text: string; dim: string }[] = [];
    const walk = (value: unknown) => {
      if (!value || typeof value !== "object") return;
      const obj = value as Record<string, unknown>;
      if (typeof obj.text === "string" && typeof obj.dim === "string") {
        found.push({ text: obj.text, dim: obj.dim });
      }
      for (const v of Object.values(obj)) walk(v);
    };
    walk(TOLA_COPY);

    expect(found.length, "found no TwoTone headings in TOLA_COPY at all").toBeGreaterThan(0);
    for (const { text, dim } of found) {
      const occurrences = text.split(dim).length - 1;
      expect(occurrences, `"${dim}" appears ${occurrences}× in "${text}"`).toBe(1);
    }
  });

  it("does not reuse Mahua Vann's opening headline, invitation line, or chapter-01 opening sentence", () => {
    // Both pages shipped on 9 Aug with "Five kilometres from the gate" as
    // chapter 01. Nothing tells a visitor they are reading a template faster
    // than two properties introducing themselves in the same words.
    expect(TOLA_COPY.columnCopy?.["tola-reserve"]?.heading.text).not.toBe(
      VANN_COPY.columnCopy?.["vann-forest"]?.heading.text,
    );

    // Widened in the whole-branch review's fix wave (10 Aug 2026): the
    // headline guard above shipped alone, and two more sentences sat right
    // below it byte-identical bar a gate name — the closing invitation's
    // line (the last sentence a visitor reads on either page) and chapter
    // 01's own opening clause. A plain `.not.toBe` would not have caught
    // either: "The forest is five kilometres from Turia Gate…" and "…from
    // Kolara Gate…" are technically unequal strings while reading as one
    // description with the nouns swapped, which is the exact complaint this
    // whole redesign exists to answer ("very wordpress and templaty").
    // `stripGateNames` closes that loophole by normalising both known gate
    // names to one token before comparing, so a rewrite that only swaps the
    // gate back in cannot silently pass this test again.
    const stripGateNames = (s: string) => s.replace(/Turia Gate/g, "GATE").replace(/Kolara Gate/g, "GATE");

    const vannLine = VANN_COPY.invitationCopy?.["vann-invitation"]?.line;
    const tolaLine = TOLA_COPY.invitationCopy?.["tola-invitation"]?.line;
    expect(vannLine, "Mahua Vann has no invitation line").toBeDefined();
    expect(tolaLine, "Mahua Tola has no invitation line").toBeDefined();
    expect(tolaLine, "invitation lines are byte-identical").not.toBe(vannLine);
    expect(
      stripGateNames(tolaLine!),
      "invitation lines differ only by the gate name",
    ).not.toBe(stripGateNames(vannLine!));

    const vannOpener = VANN_COPY.columnCopy?.["vann-forest"]?.body[0];
    const tolaOpener = TOLA_COPY.columnCopy?.["tola-reserve"]?.body[0];
    expect(vannOpener, "Mahua Vann has no chapter 01 opening paragraph").toBeDefined();
    expect(tolaOpener, "Mahua Tola has no chapter 01 opening paragraph").toBeDefined();
    expect(tolaOpener, "chapter 01 openers are byte-identical").not.toBe(vannOpener);
    expect(
      stripGateNames(tolaOpener!),
      "chapter 01 openers differ only by the gate name",
    ).not.toBe(stripGateNames(vannOpener!));
  });

  /*
   * **"reuses its guest quote byte-identical to the attributed original in
   * content/home.ts" was here until 26 August 2026, and it is retired rather
   * than repaired.** It cross-checked `TOLA_COPY.quoteCopy["tola-guest-word"]`
   * against `HOME.chapters.invitation.quotes` — Vedant, 2019, Tripadvisor — so
   * an edit to one without the other could not silently ship unattributed
   * words.
   *
   * **The original it checked against no longer exists.** Task 2 of the 26 Aug
   * restructure deleted `invitation.quotes` outright: the client's own Elfsight
   * widget replaced the curated three-quote set, and there is nothing left in
   * `content/home.ts` for this page's `tola-guest-word` to stay byte-identical
   * WITH. This is not this page's change — `content/mahua-tola.ts` itself is
   * untouched here, on that task's own ruling, because `tola-guest-word` is
   * scheduled to be deleted outright in Task 5 of the same restructure
   * (`docs/superpowers/plans/2026-08-26-restructure-and-reviews.md` §3.1). A
   * guard with nothing left to compare would either fail on a defect that
   * belongs to a different task's copy or be quietly weakened to pass, and
   * either is worse than removing it here and letting Task 5 finish the job.
   */

  it("has the client's 26 Aug spine — two fewer full-bleed bands, an unheaded map, renumbered chapters", () => {
    // `tola-press` does not exist yet — Task 8 of this restructure adds it
    // between `tola-day` and `tola-invitation`
    // (docs/superpowers/plans/2026-08-26-restructure-and-reviews.md §3.1), so
    // this assertion checks the whole spine as it stands today rather than a
    // slice of a bigger one: Task 8's own edit is "insert tola-press here",
    // not "extend a truncated assertion". `numbered` is one entry short of
    // Vann's four for the same reason — "04 Written About" is `tola-press`'s
    // own number/label, and it ships with the chapter, not before it.
    const ids = TOLA_CHAPTERS.map((c) => c.id);
    expect(ids).toEqual([
      "tola-hero", "tola-reserve", "tola-where", "tola-rooms", "tola-day", "tola-invitation",
    ]);
    const numbered = TOLA_CHAPTERS.filter((c) => c.number).map((c) => `${c.number} ${c.label}`);
    expect(numbered).toEqual([
      "01 The Reserve", "02 The Rooms", "03 The Experience",
    ]);
  });

  it("gives the map no heading — it is an extension of 01, by the client's ruling", () => {
    const map = TOLA_CHAPTERS.find((c) => c.id === "tola-where");
    expect(map?.number).toBeUndefined();
    expect(map?.label).toBeUndefined();
  });

  it("carries no full-bleed quote copy — both bands went on 26 Aug 2026", () => {
    expect(TOLA_COPY.quoteCopy).toBeUndefined();
  });
});
