import { describe, expect, it } from "vitest";
import { media } from "@/lib/media";
import { CHAPTERS, FULL_BLEED_KINDS, IMAGE_LED_KINDS, type ChapterKind } from "./chapters";
import { chapterCopy, type ChapterCopyKey, type ExperienceCopy } from "./home";

/**
 * The fewest photographs each layout needs before it stops being the layout.
 *
 * `satisfies Record<ChapterKind, number>` is doing real work: adding a kind to
 * `ChapterKind` without giving it a floor here is a type error, so a new section
 * cannot quietly arrive with no density requirement at all.
 */
const MIN_MEDIA = {
  hero: 1,
  // One photograph across the width of the screen, which is the whole chapter.
  // `fullBleedQuote: 1` came out on 19 Aug 2026 with the kind; this is what
  // replaced it on `02 · The Jungles`.
  junglesBand: 1,
  // **Two, and this floor is exact rather than cautious.** The chapter is the
  // two lodges side by side; with one photograph it is not the split the client
  // asked for, it is a banner. `lodgeCards: 2` was the same number for the same
  // reason and left with its kind on 19 Aug 2026 — but the cards drew FOUR
  // frames against that floor of two, where the panels draw exactly two, so this
  // assertion is load-bearing here in a way it never was there.
  lodgePanels: 2,
  // The reference's signature move is two or three photographs floating at the
  // margins around centred text — with fewer it is just a text screen — pinned,
  // so if anything the floor is higher here: a pinned scene with one photograph
  // in it is two screens of scroll spent on nothing. Three is what the layout is
  // built for, and both `rooted` and `philosophy` sit exactly on it.
  //
  // `chapterIntro`'s own floor (also 3) came out on 19 Aug 2026 with the kind,
  // when `06 · The Lantern Hour` left the page.
  pinnedCollage: 3,
  // Six activities, one card each. Below that it is not a strip — it is a row of
  // cards with cream where the rest should be, which at 1440 shows four of them
  // at once and would leave the sixth position visibly empty.
  //
  // **`field-days` sits EXACTLY on this floor, with no margin at all**, and has
  // since 17 Aug 2026 when the client deleted the chapter's four-photograph
  // header band. Dropping one photograph from `content/chapters.ts` fails here
  // rather than merely thinning a band. `coverflow: 6` was this same number
  // under the kind's old name; the strip needs exactly as many.
  experienceStrip: 6,
  // `plateGrid: 3` and `testimonials: 1` came out on 19 Aug 2026 with their
  // kinds — the three plate boards and the guests band all left the page in the
  // v2 restructure. `lodgeCards: 2` and `fullBleedQuote: 1` came out later the
  // same day, when `01 · The Lodges` became two panels and `02 · The Jungles`
  // became a band; both floors are restated above under the kinds that replaced
  // them.
  invitation: 1,
} satisfies Record<ChapterKind, number>;

const ALL_MEDIA = CHAPTERS.flatMap((c) => [...c.media]);

describe("CHAPTERS", () => {
  it("opens on the hero and closes on the invitation", () => {
    expect(CHAPTERS[0].kind).toBe("hero");
    expect(CHAPTERS[CHAPTERS.length - 1].kind).toBe("invitation");
  });

  it("has unique ids", () => {
    expect(new Set(CHAPTERS.map((c) => c.id)).size).toBe(CHAPTERS.length);
  });

  it("runs six to nine chapters", () => {
    // The rejected build was 13.4 screens and felt empty; the reference is 8.2
    // and feels full. Length was never the problem, but there is no version of
    // this page that needs twenty chapters either.
    //
    // **Was eleven to thirteen until 19 Aug 2026.** The stakeholders' restructure
    // takes the page from twelve chapters to seven — hero, five numbered
    // chapters, close — so the old band would fail on a shape the client
    // approved. The new band is drawn round that seven with one either side: it
    // still catches a restructure that dissolves the page into fragments or
    // collapses it into a landing page, which is all this ever did.
    expect(CHAPTERS.length).toBeGreaterThanOrEqual(6);
    expect(CHAPTERS.length).toBeLessThanOrEqual(9);
  });

  /**
   * ONE dated exception, granted by the client on 19 Aug 2026, and it must not
   * grow a second member.
   *
   * `03 · Rooted Like The Mahua` and `04 · Mahua Philosophy` are both
   * `pinnedCollage`, which this file classes as QUIET — see the kind's own
   * comment above: below its pin viewport, and under reduced motion, it renders
   * as an ordinary `chapterIntro`, so three photographs at the margins of
   * centred text is exactly the composition #10 was written to call quiet.
   *
   * **The measurements agreed with the rule, not with the layout.** `philosophy`
   * carries ONE moved paragraph — `check_pinned_collage.mjs` reports **55 words
   * against `rooted`'s 139** — in a composition built for three, holding the
   * same 900px pin. It measured 44.1% mean / 44.6% worst, clearing the 45%
   * ceiling by 0.4pp, which is inside that instrument's own ±3-7pp error
   * (`DECISIONS.md` §5a). The page's two emptiest screens became the joins
   * either side of it.
   *
   * Put to the client with four ways out. His ruling: *"We will later add more
   * text to the philosophy, for now keep this."* So this is a **deferral, not a
   * relaxation** — the rule still guards every other adjacency on all three
   * pages, and this pair is named rather than the rule being widened.
   *
   * **Delete this exception the moment that copy lands.** If it still fails
   * afterwards, the extra words were not enough and the composition is wrong for
   * the content — which is the finding, not a reason to widen the list again.
   */
  const RHYTHM_EXCEPTIONS: ReadonlySet<string> = new Set(["rooted→philosophy"]);

  it("never runs two quiet screens back to back", () => {
    // The rhythm rule. Two consecutive text-led sections is exactly the
    // sparseness the client rejected.
    for (let i = 0; i < CHAPTERS.length - 1; i++) {
      const pair = `${CHAPTERS[i].id}→${CHAPTERS[i + 1].id}`;
      if (RHYTHM_EXCEPTIONS.has(pair)) continue;
      const a = IMAGE_LED_KINDS.includes(CHAPTERS[i].kind);
      const b = IMAGE_LED_KINDS.includes(CHAPTERS[i + 1].kind);
      expect(a || b, `"${CHAPTERS[i].id}" and "${CHAPTERS[i + 1].id}" are both quiet`).toBe(true);
    }
  });

  it("keeps every rhythm exception real, so none can outlive its reason", () => {
    // An exception naming a pair that no longer exists is an exception nobody
    // will ever delete — it just sits there looking principled. This fails the
    // day `philosophy` moves, is renamed, or stops being adjacent to `rooted`.
    for (const pair of RHYTHM_EXCEPTIONS) {
      const [before, after] = pair.split("→");
      const i = CHAPTERS.findIndex((c) => c.id === before);
      expect(i, `rhythm exception "${pair}" names a chapter that is gone`).toBeGreaterThan(-1);
      expect(CHAPTERS[i + 1]?.id, `rhythm exception "${pair}" is no longer adjacent`).toBe(after);
      const stillNeeded =
        !IMAGE_LED_KINDS.includes(CHAPTERS[i].kind) && !IMAGE_LED_KINDS.includes(CHAPTERS[i + 1].kind);
      expect(stillNeeded, `rhythm exception "${pair}" is no longer needed — delete it`).toBe(true);
    }
  });

  it("requires a photograph in every kind the rhythm rule counts as image-led", () => {
    // Without this the rule above is satisfiable by a lie: a `plateGrid` with
    // `media: []` counts as image-led, breaks up two quiet neighbours on paper,
    // and renders as a third empty screen. The alternation is only meaningful
    // if the image-led kinds are actually carrying images.
    for (const kind of IMAGE_LED_KINDS) {
      expect(MIN_MEDIA[kind], `${kind} counts as image-led but requires no image`).toBeGreaterThanOrEqual(1);
    }
  });

  it("carries enough photographs in each chapter for its layout", () => {
    for (const c of CHAPTERS) {
      expect(
        c.media.length,
        `"${c.id}" is a ${c.kind} with ${c.media.length} image(s); it needs ${MIN_MEDIA[c.kind]}`,
      ).toBeGreaterThanOrEqual(MIN_MEDIA[c.kind]);
    }
  });

  it("gives every strip activity a photograph the chapter actually carries", () => {
    // A card puts a photograph and an activity's name in one box, so the pairing
    // becomes a claim. This asserts the weaker, mechanical half of that: every
    // activity names a real id, and every id it names is in the chapter's own
    // media list, so a card can never reach for a photograph the chapter does not
    // declare (and that `measure_density.mjs` therefore does not count).
    for (const chapter of CHAPTERS.filter((c) => c.kind === "experienceStrip")) {
      const copy = chapterCopy(chapter.id as ChapterCopyKey) as { experiences: readonly ExperienceCopy[] };
      expect(copy.experiences.length).toBeGreaterThan(0);
      for (const experience of copy.experiences) {
        // `media` is a FUNCTION that throws on an unknown id, not a record — the
        // rest of this file already calls it that way (see the "references only
        // real images" case below).
        expect(() => media(experience.mediaId), `${experience.title} names "${experience.mediaId}"`).not.toThrow();
        expect(
          chapter.media,
          `"${chapter.id}" must declare ${experience.mediaId} — ${experience.title} shows it`,
        ).toContain(experience.mediaId);
      }
    }
  });

  it("only uses full-bleed-safe images where the layout is full-bleed", () => {
    for (const c of CHAPTERS) {
      if (!FULL_BLEED_KINDS.includes(c.kind)) continue;
      expect(c.media.length, `"${c.id}" has no photograph to fill the screen`).toBeGreaterThan(0);
      for (const id of c.media) {
        const m = media(id);
        expect(m.fullBleedSafe, `${id} is only ${m.width}px wide — too narrow for "${c.id}"`).toBe(
          true,
        );
      }
    }
  });

  it("references only real images", () => {
    for (const c of CHAPTERS) for (const id of c.media) expect(() => media(id)).not.toThrow();
  });

  it("never shows the same photograph twice", () => {
    // Repetition reads as a thin library even when the library is not thin, and
    // it is the cheapest possible way to fake density.
    const seen = new Map<string, string>();
    for (const c of CHAPTERS) {
      for (const id of c.media) {
        expect(seen.get(id), `${id} appears in both "${seen.get(id)}" and "${c.id}"`).toBeUndefined();
        seen.set(id, c.id);
      }
    }
  });

  it("draws on at least seventeen distinct photographs", () => {
    // "Too few images" was the client's first complaint, and the density rig
    // measures it on the built page — too late to be cheap to fix. Asserting it
    // on the spine means the page cannot be built failing it.
    //
    // What it catches is a *restructure* onto the cheap kinds: a spine of
    // hero/pull-quote/testimonial alternates perfectly, passes every other
    // assertion here, and shows one photograph per chapter.
    //
    // **Twenty until 19 Aug 2026, and lowered because the page is half the
    // length, not because a chapter was thinned.** The v2 spine carried 19
    // distinct photographs across seven chapters (1 + 4 + 1 + 3 + 3 + 6 + 1),
    // where the twelve-chapter page carried 32; seventeen was set as that
    // spine's own mechanical floor — `MIN_MEDIA` plus the no-repeats rule — in
    // anticipation of spec §2.
    //
    // **The page now sits exactly on it, later the same day.** `01 · The Lodges`
    // is two panels on two photographs rather than two cards on four, so the
    // spine is 1 + 2 + 1 + 3 + 3 + 6 + 1 = **17**. This assertion is therefore
    // as tight as it can be without becoming a restatement of `MIN_MEDIA`, and
    // it is load-bearing again the moment a chapter is swapped onto a cheaper
    // kind. Do not lower it to make room for another such swap: the swap is the
    // thing to look at.
    expect(new Set(ALL_MEDIA).size).toBeGreaterThanOrEqual(17);
  });

  it("shows all four of the guidelines' photography categories", () => {
    const shown = [...new Set(ALL_MEDIA.map((id) => media(id).category))];
    for (const c of ["lanternHour", "forest", "lodgeLife", "details"] as const) {
      expect(shown, `no ${c} photography anywhere on the page`).toContain(c);
    }
  });

  it("numbers its chapters 01, 02, 03 … with no gaps, repeats or reordering", () => {
    const numbered = CHAPTERS.filter((c) => c.number);
    expect(numbered.map((c) => Number(c.number))).toEqual(numbered.map((_, i) => i + 1));
    for (const c of numbered) {
      expect(c.number, `"${c.id}" must be zero-padded, e.g. "01"`).toMatch(/^(0[1-9]|[1-9][0-9])$/);
      expect(c.label, `"${c.id}" is numbered but has no label to sit beside the number`).toBeTruthy();
    }
  });
});
