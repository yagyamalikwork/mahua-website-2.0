import { Enter } from "@/components/motion/Enter";
import { ExperienceCard } from "@/components/sections/ExperienceCard";
import { ChapterMark } from "@/components/ui/ChapterMark";
import { ChapterSurface } from "@/components/ui/ChapterSurface";
import type { ScrimStrength } from "@/components/ui/Scrim";
import { TwoToneHeading } from "@/components/ui/TwoToneHeading";
import type { Chapter } from "@/content/chapters";
import { chapterCopy, HOME, type ChapterCopyKey, type ExperienceCopy, type TwoTone } from "@/content/home";
import type { MediaId } from "@/lib/media";

type StripCopy = {
  readonly heading: TwoTone;
  readonly body: readonly string[];
  readonly experiences: readonly ExperienceCopy[];
};

/**
 * One id shape, composed in exactly one place — a pager link and the card it
 * points at cannot disagree about a string neither of them spells out.
 *
 * The coverflow needed a whole module for this (`lib/coverflow.ts`, retired
 * 19 Aug 2026) because its targets were zero-size boxes positioned by CSS
 * arithmetic at the scroll offsets where each card was centred, and getting that
 * placement wrong cost a task. Here the target is the card, and the card is a
 * real box in normal flow inside a real scroll container: the browser brings it
 * into view because that is what an anchor does.
 */
export function experienceCardId(chapterId: string, index: number) {
  return `${chapterId}-card-${index}`;
}

/**
 * The wash between each card's photograph and the cream type laid on it.
 *
 * **Solved from scratch on 19 Aug 2026 against the rendered page, six frames,
 * six figures**, each raised only until the worst single pixel under that card's
 * type clears 4.5:1 and no further. Re-derivable:
 * `scripts/check_contrast_over_photos.mjs` carries a run per card, and the sweep
 * is `docs/reviews/2026-08-19-home-v2/strip.md` §4.
 *
 * **None of the coverflow's six figures was carried over, and that is the point
 * rather than an oversight.** Not one of these photographs was on that stage —
 * four are new to the page entirely — and five of the six are freshly cropped to
 * 0.74 portrait in the image pipeline. `docs/DECISIONS.md` §20.5 records what
 * carrying a scrim across a re-crop cost the last time: figures solved on 17 Aug
 * put two cards at 3.47:1 and 3.61:1 the moment the type moved, both under the
 * floor, while a third came out at 8.00 — over-washed by a mile. **A scrim
 * answers to the pixels under the glyphs. New pixels, or new glyph positions,
 * and it is a new solve.** Both changed here.
 *
 * **Unwashed, the six measure 1.04 / 1.03 / 1.14 / 1.66 / 2.01 / 1.08** in the
 * order below, against a 4.5 floor — two of them within a hundredth of 1.00:1,
 * which is cream type on pixels of exactly its own luminance. Solved, they are
 * **4.66 / 4.64 / 4.65 / 4.76 / 4.75 / 4.64**: a 12-hundredth spread, because
 * every one was taken to the same place and stopped.
 *
 * ## The shape is `bottom` + `flat`, and the geometry is why
 *
 * The words sit at the foot of a 0.74 card, so `bottom` — a gradient over the
 * lower 72% of the frame — is the layer whose shape matches the type, and it
 * carries most of every figure here. Where a `flat` appears beside it, it is
 * because that photograph's bright pixels are spread across the whole frame
 * rather than gathered at one end, which no shaped layer can answer: five of the
 * six carry one and `star-talks`, whose bright pixels are all lawn, does not.
 *
 * No `centre` and no `corner` anywhere in this set. `centre` is a radial for
 * centred type and there is none; `corner` is a wedge into the bottom-LEFT under
 * a headline standing on the floor of the frame, and these words span the card's
 * full measure.
 *
 * **All four widths bind something, and no two cards are bound by the same
 * one.** 390 binds cards 01 and 03, 768 binds 06, 1440 binds 02, 1920 binds 04
 * and 05. Re-run the rig at every width after touching any of these — a
 * desktop-only or phone-only check would pass a build that fails somewhere else.
 *
 * **Do not lighten these further.** The tightest three sit at 4.64-4.66, which is
 * 3% over the floor, and `check_contrast_over_photos.mjs` is the only instrument
 * on this project that can see it.
 *
 * **Keyed by photograph, not by activity, and not in `content/`.** What a scrim
 * answers to is the exposure of a frame; the activity that happens to name it is
 * irrelevant. And a wash opacity is a rendering figure rather than copy, which is
 * the whole of the architecture rule that keeps `content/` free of numbers like
 * this one.
 *
 * `Partial<Record<…>>` rather than `Record<MediaId, ScrimStrength>`: `MediaId` is
 * all fifty-nine curated photographs and this map is about six of them. The
 * fallback below is a deliberately heavy wash, so a card whose photograph is
 * swapped without a figure being solved for it fails towards muddy — which a
 * reviewer sees — rather than towards illegible, which they may not.
 */
const CARD_SCRIM: Partial<Record<MediaId, ScrimStrength>> = {
  // **Unwashed 1.04:1 — the second-worst starting point of the six.** A night
  // forest lit by one fire, so the mid-tones under the words are firelit grass
  // and the bright pixels are the lit canopy high in the frame, which a `bottom`
  // gradient never reaches. That is why the flat is the second heaviest here: it
  // is answering the top of the frame, not the foot.
  // → 4.66 at 390 (binding), 4.79 at 768, 4.72 at 1024, 4.73 at 1440, 4.66 at 1920.
  "bonfire-dinner": { flat: 0.22, bottom: 0.95 },
  // **Unwashed 1.03:1, the theoretical floor** — cream type on pixels of very
  // nearly its own luminance. The figure is a surprise until the frame is
  // opened: it reads as a dark photograph, and it is, except that the woman's
  // white cotton is backlit and sits exactly where the sentence lands.
  //
  // **Trimmed from `{ bottom: 0.95, flat: 0.24 }` when the card grew to 340px.**
  // At the 300px card that pair solved to 4.64; at 340 the same pair measured
  // **7.33** — the words are a smaller fraction of a bigger card, so they sit
  // further inside the `bottom` gradient's strong end and the same figure does
  // more. 7.33 on the darkest photograph of the six is mud, and this was the one
  // card of the six where the difference is visible.
  "sound-healing": { flat: 0.08, bottom: 0.85 },
  // **Unwashed 1.14:1**, and the only card in the set that needs no flat at all.
  // Night lawn under a floodlight: the bright pixels are the grass, they are low
  // in the frame, and a `bottom` gradient is exactly the shape of that. It is
  // also the one photograph here that arrived portrait, so its foot is the
  // photographer's foot rather than a crop's.
  // → 4.65 at 390 (binding), 4.75 at 768, 4.68 at 1024, 4.72 at 1440, 4.70 at 1920.
  "star-talks": { bottom: 0.82 },
  // **Unwashed 1.66:1 — the best of the six**, and it takes the lightest wash to
  // match. The guide's dark fleece fills the lower half of the portrait crop and
  // the blown sunrise flare is up beside his binoculars, well clear of the type.
  // The flat is answering that flare, which is spread rather than gathered.
  // → 4.83 at 390, 4.82 at 768 and 1024, 4.85 at 1440, 4.76 at 1920 (binding).
  "guide-sunrise": { flat: 0.14, bottom: 0.7 },
  // **Unwashed 2.01:1, by a distance the easiest frame here** — wet clay under
  // diffuse shade is mid-tone everywhere and has no specular highlight in it at
  // all. Worth contrasting with `vann-potters-village`, the *other* pottery
  // frame on this site, which measures 1.00:1 unwashed and which
  // `docs/OWED-ORIGINALS.md` asks for a different crop of: white-glazed pots
  // are the hardest surface on this page to put cream type over, and unglazed
  // clay is one of the easiest.
  // → 4.99 at 390, 4.82 at 768/1024, 4.83 at 1440, 4.75 at 1920 (binding).
  "potters-hands": { flat: 0.05, bottom: 0.85 },
  // **Unwashed 1.08:1.** Sunlit golden grass fills the bottom third of the
  // portrait crop and the tiger is DARKER than the grass around it, which is the
  // wrong way round for type: the wash is set by the grass the cat is walking
  // through, not by the cat. Nearly as heavy as the two night frames, on the
  // brightest photograph of the six.
  // → 5.20 at 390, 4.64 at 768 (binding), 4.74 at 1024, 4.73 at 1440, 4.71 at 1920.
  "tiger-golden-grass": { flat: 0.19, bottom: 0.95 },
};

/**
 * The fallback for a photograph nobody has solved a figure for.
 *
 * An unsolved card must fail towards legible-but-muddy, which a reviewer sees,
 * not towards illegible, which they may not. Nothing reaches it today — all six
 * cards are in `CARD_SCRIM` — and it exists for the swap that changes one
 * `mediaId` in `content/home.ts` without coming back here.
 *
 * **It dominates every solved figure above, layer by layer, and that was
 * checked against the solved set rather than assumed**: the heaviest `bottom` in
 * the set is 0.95 and the heaviest `flat` 0.24, so this is 1.0 and 0.4. The same
 * promise was briefly untrue on the coverflow — one card there needed a `centre`
 * of 0.8 against a fallback of 0.7 — and saying so was cheaper than a reader
 * discovering it. The `centre` here answers to nothing in the solved set at all,
 * which is the point: an unsolved photograph gets a layer under the middle of
 * the card as well, because nobody knows where its bright pixels are.
 */
const PLACEHOLDER_SCRIM: ScrimStrength = { flat: 0.4, bottom: 1, centre: 0.5 };

/**
 * `05 · Experiences` as a horizontal card strip — six activities, six tall
 * portrait cards, the page scrolling past normally while the strip is dragged or
 * jumped sideways.
 *
 * **The client's ruling, 19 Aug 2026**: *"We change the cards to this new layout
 * with vertical cards that you can see in the 'Curated Group Departures' section
 * on ecotriip.co."* Offered the choice between keeping the pinned coverflow built
 * 16-18 Aug and a plain sideways strip, and told what the second discards, he
 * chose the strip. So the pin, the scroll pacing, the flank behaviour, the
 * end-holds and the whole of `lib/coverflow.ts` are gone rather than preserved
 * under a flag — `docs/DECISIONS.md` §20 is the record of what they were and what
 * they cost, and §20.1 in particular is a finding about `position: sticky` that
 * outlives the component it was learned on.
 *
 * **A server component, and that is the whole budget claim.** Everything here is
 * markup and CSS — `app/globals.css`'s `.experience-strip*` block, from the
 * numbers `app/layout.tsx` publishes out of `STRIP` in `lib/motion.ts`. No
 * `"use client"` here and none in `ExperienceCard`, and the strip is a native
 * overflow scroller, so a drag, a trackpad swipe, a shift-wheel and the keyboard
 * all work with no script at all.
 *
 * ## The three shapes this section is made of
 *
 * 1. **A header band**, carrying the chapter mark, the heading, the dawn-gate
 *    paragraph and the tiger film. **Unchanged from the coverflow's, deliberately
 *    and to the pixel** — the client: *"We keep the text and the tiger where they
 *    are and not touch them."* Same 7/5 split, same `gap-x-10`, same
 *    `lg:items-start`, same type sizes, same `figure` slot.
 * 2. **The strip**, a flex row in a native `overflow-x: auto` scroller.
 * 3. **The pager**, six links below it, one per card.
 *
 * ## Why the words are ON the photograph, when the client's own document puts
 * them under it
 *
 * `Brand&Design-Guidelines/mahua-home-v2-dusk.html` — his document, the one the
 * copy below comes from — builds its card as a `3/3.6` figure with a `.body`
 * block of type beneath it on `var(--night-2)`. That page is dark throughout;
 * this one is cream throughout, and the difference is not cosmetic:
 *
 * - **A dark foot is the one thing non-negotiable #3 does not allow.** Cream is
 *   the page, and the single exception the client has ever made to it is the
 *   footer's brand brown. Six dark blocks in the middle of a chapter is not a
 *   translation of his document, it is a different rule.
 * - **A cream foot costs the density this chapter exists to fix.** `field-days`
 *   was 43.9% mean / 57.9% worst before the coverflow; a third of every card
 *   given over to cream is the shape of the problem, not the fix.
 * - **He has already ruled on this exact card, for this exact chapter.** 16 Aug:
 *   *"like section between the 01-The Lodges and 02-Rooted Like The Mahua, where
 *   we have an image with text on it"* (`docs/DECISIONS.md` §20.5). The strip is
 *   a new *arrangement* of cards; it is not a reopening of what a card is.
 *
 * So the card is the photograph, and the reference's dark foot is a solved scrim
 * foot — which is the cream page's own way of saying the same thing, and the one
 * that has an instrument behind it.
 *
 * ## The tiger, and the blend that can break
 *
 * The film is the header band's right-hand column, exactly where the coverflow
 * put it and where the client reaffirmed it on 17 Aug (*"keep the tiger where it
 * is now"*). Its white ground is erased by `mix-blend-mode: darken` against the
 * chapter's cream, so **no ancestor between it and that cream may become a
 * stacking context** — not `.experience-figure`, not the grid row, not
 * `ChapterSurface`'s container (`docs/DECISIONS.md` §14). The gate for that claim
 * is `scripts/check_films.mjs` passing on pixels at six widths, never a reading
 * of this markup.
 *
 * **One thing about the film is genuinely better here than under the coverflow**,
 * and it is worth recording because it removes a constraint rather than moving
 * it: there is no pinned stage any more, so the film's old hard rule — that it
 * can never be inside the pinned viewport at any desktop shape, which is what
 * ruled out both of its earlier homes — no longer binds anything. If it is ever
 * asked to move again, that argument is spent and the question is open.
 */
export function ExperienceStrip({
  chapter,
  surface = false,
  figure,
}: {
  chapter: Chapter;
  surface?: boolean;
  /**
   * The chapter's drawn figure. `field-days` passes the ink tiger; nothing else
   * uses it.
   *
   * The same slot name and shape the coverflow had, on purpose: mounting this
   * section is one component name in `app/page.tsx` and nothing else. A slot
   * rather than a `chapter.id` check in here, because every chapter section is
   * self-contained and *which* chapter carries the tiger belongs to the page's
   * spine.
   */
  figure?: React.ReactNode;
}) {
  const copy = chapterCopy(chapter.id as ChapterCopyKey) as StripCopy;
  const strip = HOME.strip;

  return (
    // `tight`, carried over from the coverflow unchanged — the client's third
    // change of 18 Aug 2026, *"make sure it fits snugly and has no large
    // unnecessary, disconnecting space before or after"*. `py-10 md:py-12
    // lg:py-14` against the default `py-14 md:py-16 lg:py-20`.
    <ChapterSurface id={chapter.id} surface={surface} tight>
      {/* The header band. **Not one class in this block changed on 19 Aug 2026**,
          and that is the client's ruling rather than laziness: *"We keep the
          text and the tiger where they are and not touch them."* Its
          composition was solved against a measurement — 7/5 rather than 5/7
          because a 7-column slot for a 300px film left 461px of bare cream
          inside its own column, and `lg:items-start` because the film column is
          the taller of the two and bottom-aligning would push the chapter mark
          210px down the page. Both are still true. */}
      <div className="grid gap-8 lg:grid-cols-12 lg:items-start lg:gap-x-10">
        <div className="lg:col-span-7">
          <Enter>
            <div>
              {chapter.number && chapter.label && (
                <ChapterMark number={chapter.number} label={chapter.label} />
              )}
              <TwoToneHeading heading={copy.heading} className="mt-6 max-w-[16ch]" />
              <p
                className="mt-7 max-w-[54ch] font-[family-name:var(--font-body)] text-[1.15rem] leading-[1.68] md:text-xl"
                style={{ color: "var(--text)" }}
              >
                {copy.body[0]}
              </p>
            </div>
          </Enter>
        </div>

        <div className="lg:col-span-5">
          {/* The tiger. Deliberately NOT wrapped in `ImageReveal`: that is a
              masked entrance, and a mask is a stacking context, which is what
              erases this film's white ground. `.experience-figure` must not
              become one either — see the note on this component, and
              `scripts/check_films.mjs`, which is the gate. */}
          {figure && <div className="experience-figure">{figure}</div>}
        </div>
      </div>

      {/*
        The strip.

        `tabIndex={0}` is not decoration: a scroll container with no focusable
        children is not reachable by keyboard in every browser, and this one has
        none by design (see `content/home.ts` on why no card is a link). With it,
        the arrow keys, Home, End and Page keys all scroll the strip, which is
        WCAG 2.1.1 for a scrollable region and costs no JavaScript.

        `aria-label` rather than a heading: the chapter already has one, and the
        strip is a list of six things inside it rather than a new section of the
        page.
      */}
      <ul
        className="experience-strip mt-8 lg:mt-10"
        tabIndex={0}
        aria-label={strip.region}
      >
        {copy.experiences.map((experience, i) => (
          <ExperienceCard
            key={experience.title}
            experience={experience}
            scrim={CARD_SCRIM[experience.mediaId] ?? PLACEHOLDER_SCRIM}
            id={experienceCardId(chapter.id, i)}
          />
        ))}
      </ul>

      {/*
        The pager, and the hint beside it.

        **Six links, not two arrows, and that is a consequence of costing zero
        JavaScript rather than a preference.** A "next" arrow has to know where
        the strip currently is; nothing without script does, and a pair of arrows
        that always jumped to the same two cards would be two controls lying
        about what they do. Six anchors each name one card, are correct at every
        scroll position, are announced with the activity's own title, and are the
        same mechanism the coverflow's arrows used — `<a href="#…">` and the
        browser's own "bring this into view", which here means scrolling the
        strip because the strip is the nearest scrollable ancestor.

        The hint is the client's own document's, verbatim: `.hint { Scroll → }`.
        It is the only thing on the page that says a strip is a strip before a
        visitor touches it, and it is why the card peeks past the screen's edge
        at 390 as well.
      */}
      <div className="mt-5 flex items-center justify-between gap-6 border-t pt-3" style={{ borderColor: "var(--accent)" }}>
        <p
          className="font-[family-name:var(--font-label)] text-[0.62rem] uppercase tracking-[0.2em]"
          style={{ color: "var(--dim)" }}
          aria-hidden="true"
        >
          {strip.hint}
        </p>
        <nav aria-label={strip.region} className="flex items-center gap-4">
          {copy.experiences.map((experience, i) => (
            <a
              key={experience.title}
              href={`#${experienceCardId(chapter.id, i)}`}
              // The visible text is a number and six numbers tell a screen
              // reader nothing apart. The activity's own title is the name — no
              // new copy, and distinct by construction.
              aria-label={`${strip.jump} — ${experience.title}`}
              className="rule-in font-[family-name:var(--font-label)] text-[0.62rem] uppercase tracking-[0.2em] focus-visible:outline-2 focus-visible:outline-offset-4"
              style={{ color: "var(--dim)" }}
            >
              {String(i + 1).padStart(2, "0")}
            </a>
          ))}
        </nav>
      </div>
    </ChapterSurface>
  );
}
