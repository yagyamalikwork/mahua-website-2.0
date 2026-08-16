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
  fullBleedQuote: 1,
  // The reference's signature move is two or three photographs floating at the
  // margins around centred text. With fewer it is just a text screen.
  chapterIntro: 3,
  // The same composition, pinned. If anything the floor is higher here — a
  // pinned scene with one photograph in it is two screens of scroll spent on
  // nothing — but three is what the layout is built for.
  pinnedCollage: 3,
  splitFeature: 2,
  // Six activities, one card each. Below that it is not a carousel; the pin
  // reserves scroll for cards that are not there — non-negotiable #9.
  coverflow: 6,
  plateGrid: 3,
  lodgeCards: 2,
  testimonials: 1,
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

  it("runs eleven to thirteen chapters", () => {
    // The rejected build was 13.4 screens and felt empty; the reference is 8.2
    // and feels full. Length was never the problem, but there is no version of
    // this page that needs twenty chapters either.
    expect(CHAPTERS.length).toBeGreaterThanOrEqual(11);
    expect(CHAPTERS.length).toBeLessThanOrEqual(13);
  });

  it("never runs two quiet screens back to back", () => {
    // The rhythm rule. Two consecutive text-led sections is exactly the
    // sparseness the client rejected.
    for (let i = 0; i < CHAPTERS.length - 1; i++) {
      const a = IMAGE_LED_KINDS.includes(CHAPTERS[i].kind);
      const b = IMAGE_LED_KINDS.includes(CHAPTERS[i + 1].kind);
      expect(a || b, `"${CHAPTERS[i].id}" and "${CHAPTERS[i + 1].id}" are both quiet`).toBe(true);
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

  it("gives every coverflow activity a photograph the chapter actually carries", () => {
    // A card puts a photograph and an activity's name in one box, so the pairing
    // becomes a claim. This asserts the weaker, mechanical half of that: every
    // activity names a real id, and every id it names is in the chapter's own
    // media list, so a card can never reach for a photograph the chapter does not
    // declare (and that `measure_density.mjs` therefore does not count).
    for (const chapter of CHAPTERS.filter((c) => c.kind === "coverflow")) {
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

  it("draws on at least twenty distinct photographs", () => {
    // "Too few images" was the client's first complaint, and Task 8 measures it
    // on the built page — too late to be cheap to fix. Asserting it on the spine
    // means the page cannot be built failing it.
    //
    // This does not guard against trimming a grid: `MIN_MEDIA` plus the
    // no-repeats rule already force 24 on the current twelve-chapter shape (it
    // carries 32). What it catches is a *restructure* onto the cheap kinds —
    // eleven chapters of hero/pull-quote/testimonial alternate perfectly, pass
    // every other assertion here, and show eleven photographs.
    expect(new Set(ALL_MEDIA).size).toBeGreaterThanOrEqual(20);
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
