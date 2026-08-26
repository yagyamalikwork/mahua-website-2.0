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
 * which is cream type on pixels of exactly its own luminance. Every solved
 * figure since is in the per-card comments; the shipped set is the 20 Aug one
 * below, and the numbers the 19 Aug sweep stopped at (4.64-4.76, every card
 * taken to the floor and no further) are history rather than a target — see the
 * next section for why stopping there was too fine.
 *
 * ## Four of the six were re-solved on 20 Aug 2026, and one of them was failing
 *
 * **The 19 Aug sweep solved these at 390 and up, where the card is a flat 340px.
 * At 360 it is `78vw` = 281px, and that is a size nobody had measured.**
 * `check_contrast_over_photos.mjs` sweeps from 360 now (its `WIDTHS` carries the
 * reasoning) and read `strip · card 02` at **3.30 against its 4.5 floor** there.
 *
 * The cause is worth stating because it will recur on any fixed-size card whose
 * words are bottom-anchored: **the card got 23px narrower and card 02's sentence
 * wrapped from one line to two.** The block grows upward from the foot, so every
 * line above the wrap moves up with it — the label's top went from **22.7% of
 * the card's height to 29.6%** — and 29.6% is where `Scrim`'s `bottom` gradient
 * has fallen to 59% of its own strength. Straight onto the one bright patch in
 * this frame, the backlit white cotton: the pixel under the label is
 * **[240, 228, 214]** at 360 against [181, 158, 142] at 390. Nothing about the
 * photograph or the crop changed; a line of type moved 24px.
 *
 * **No `flat`+`bottom` pair can serve both.** Every layer in `ui/Scrim.tsx`
 * except `top` gets *stronger* toward the foot, and `top` does not reach; so any
 * figure that lifts the label at 360 lifts the two lines below it by at least as
 * much, and the pair that carries 360 to 4.5 takes 390's foot to ~10:1 — a solid
 * bar, which is what shipped at 0.85 and what the 19 Aug review already trimmed
 * this card back from. What broke the deadlock is **`corner`**, whose wedge is
 * thickest exactly where this block sits (bottom-left) and which is *lighter* at
 * the top of the frame than the flat it replaces. Solved against every pixel of
 * every line box at six widths: **mean alpha over the whole frame 0.362 →
 * 0.416**, i.e. five points more wash on the photograph, and the top of the
 * frame is lighter than before.
 *
 * **Three more were lifted while the instrument was pointed at them, and none of
 * them was failing.** Cards 01, 03 and 04 measured 4.77-4.82 at their worst
 * width — 0.27 above the floor, which is real margin but not much of it, and
 * this project's standing instruction since `DECISIONS.md` §20.5 is to re-solve
 * with headroom rather than to the floor. They are ~5.2-5.5 now. **Cards 05 and
 * 06 were left exactly as they were** (4.90 and 5.13 at their worst), because a
 * scrim raised for no measured reason is a photograph darkened for no measured
 * reason.
 *
 * ## The shape is `bottom` + `flat`, and the geometry is why
 *
 * The words sit at the foot of a 0.74 card, so `bottom` — a gradient over the
 * lower 72% of the frame — is the layer whose shape matches the type, and it
 * carries most of every figure here. The `flat` beside it is answering bright
 * pixels spread across the whole frame rather than gathered at one end, which no
 * shaped layer can reach — the lit canopy above `bonfire-dinner`'s fire is the
 * clearest case. **All six carry one since 20 Aug 2026**; `star-talks`, whose
 * bright pixels are all lawn and all low in the frame, went without until then
 * and carries the lightest of the six.
 *
 * No `centre` anywhere in this set — that is a radial for centred type and there
 * is none. **One `corner`, added 20 Aug 2026** on `sound-healing` alone: the
 * argument against it was that these words span the card's full measure, which
 * is true and is not the whole story — the block *starts* at the bottom-left,
 * and on the one card where a `flat`+`bottom` pair could not reach the top line
 * without drowning the bottom two, the wedge is what closed it.
 *
 * **360 is now the binding width for most of the six**, which is what happens
 * when a rig's narrowest sample moves: 360 binds 01, 02, 03 and 05, 390 binds 06,
 * and 04 is flat across the whole range. Re-run the rig at **every** width after
 * touching any of these — a desktop-only or phone-only check would pass a build
 * that fails somewhere else, and this set has now been caught by exactly that
 * once.
 *
 * **Do not lighten these further.** The tightest of the six sits at 4.90, and
 * `check_contrast_over_photos.mjs` is the only instrument on this project that
 * can see it.
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
  // gradient never reaches. That is why the flat is the heaviest here: it is
  // answering the top of the frame, not the foot.
  //
  // **`flat` 0.22 → 0.28 on 20 Aug 2026, for headroom rather than for a
  // failure.** It read 4.78 at 360 and 4.97 at 390, its two narrowest widths and
  // its two thinnest margins; it is ~5.1-5.5 across the range now. Six points of
  // flat on a night photograph that is already mostly black.
  "bonfire-dinner": { flat: 0.28, bottom: 0.95 },
  // **Unwashed 1.03:1, the theoretical floor** — cream type on pixels of very
  // nearly its own luminance. The figure is a surprise until the frame is
  // opened: it reads as a dark photograph, and it is, except that the woman's
  // white cotton is backlit and sits exactly where the sentence lands.
  //
  // **This is the card that failed at 360, and the only one in the set carrying
  // a `corner`.** It was `{ flat: 0.08, bottom: 0.85 }` and measured **3.30**
  // there — see the component's own note for why a line of type moving 24px did
  // that, and why no `flat`+`bottom` pair can answer it. The wedge is thickest
  // under the bottom-left block where these words are and *thinner than the
  // 0.08 flat it replaces* at the top of the frame, which is why the subject
  // survives a solve that adds five points of mean alpha.
  //
  // Its own history, kept because it is the same lesson twice: it was
  // `{ bottom: 0.95, flat: 0.24 }` at the 300px card, where it solved to 4.64;
  // at 340 the identical pair measured **7.33**, because the words are a smaller
  // fraction of a bigger card and sit further inside the gradient's strong end.
  // 7.33 was mud on the darkest photograph of the six. **A card's size is part
  // of its solve, at both ends of the range.**
  "sound-healing": { flat: 0.05, bottom: 0.45, corner: 0.75 },
  // **Unwashed 1.14:1.** Night lawn under a floodlight: the bright pixels are
  // the grass, they are low in the frame, and a `bottom` gradient is exactly the
  // shape of that. It is also the one photograph here that arrived portrait, so
  // its foot is the photographer's foot rather than a crop's.
  //
  // **It carried no `flat` at all until 20 Aug 2026 and now carries 0.10**, for
  // headroom: 4.77 at 768 and 1440 was the thinnest reading anywhere in the set.
  // It is the lightest wash of the six either way.
  "star-talks": { bottom: 0.82, flat: 0.1 },
  // **Unwashed 1.66:1 — the best of the six**, and it takes the lightest wash to
  // match. The guide's dark fleece fills the lower half of the portrait crop and
  // the blown sunrise flare is up beside his binoculars, well clear of the type.
  // The flat is answering that flare, which is spread rather than gathered.
  //
  // **Lifted from `{ flat: 0.14, bottom: 0.7 }` on 20 Aug 2026**, again for
  // headroom rather than a failure: it was the flattest card in the set at
  // 4.80-4.82 at *every* width, which is 0.3 of margin and no more. ~5.4-5.5 now.
  "guide-sunrise": { flat: 0.2, bottom: 0.75 },
  // **Unwashed 2.01:1, by a distance the easiest frame here** — wet clay under
  // diffuse shade is mid-tone everywhere and has no specular highlight in it at
  // all. Worth contrasting with `vann-potters-village`, the *other* pottery
  // frame on this site, which measures 1.00:1 unwashed and which
  // `docs/OWED-ORIGINALS.md` asks for a different crop of: white-glazed pots
  // are the hardest surface on this page to put cream type over, and unglazed
  // clay is one of the easiest.
  // → 4.90 at 360 (binding), 5.11 at 390, 7.51 at 768, 7.97 at 1024, 7.60 at
  //   1440, 7.97 at 1920. Untouched on 20 Aug 2026: 4.90 is the thinnest margin
  //   left in the set and it is still 0.40 of it.
  "potters-hands": { flat: 0.05, bottom: 0.85 },
  // **Unwashed 1.08:1.** Sunlit golden grass fills the bottom third of the
  // portrait crop and the tiger is DARKER than the grass around it, which is the
  // wrong way round for type: the wash is set by the grass the cat is walking
  // through, not by the cat. Nearly as heavy as the two night frames, on the
  // brightest photograph of the six.
  // → 5.21 at 360, 5.13 at 390 (binding), 5.19 at 768, 5.15 at 1024, 5.21 at
  //   1440, 5.20 at 1920. The flattest reading in the set and comfortably clear,
  //   so it was left alone on 20 Aug 2026.
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
 * the set is 0.95, the heaviest `flat` 0.28 and the heaviest `corner` 0.75, so
 * this is 1.0, 0.4 and 0.8. The same promise was briefly untrue on the coverflow
 * — one card there needed a `centre` of 0.8 against a fallback of 0.7 — and
 * saying so was cheaper than a reader discovering it.
 *
 * **`corner` joined it on 20 Aug 2026, the day a solved card first used one**
 * (`sound-healing`), which is the whole of why it is here: a fallback that omits
 * a layer the set uses is a fallback that can land *lighter* than a solved
 * figure. The `centre` still answers to nothing in the set at all, and that is
 * the point — an unsolved photograph gets a layer under the middle of the card
 * as well, because nobody knows where its bright pixels are.
 */
const PLACEHOLDER_SCRIM: ScrimStrength = { flat: 0.4, bottom: 1, centre: 0.5, corner: 0.8 };

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
 * 1. **A header band**, carrying the chapter mark, the heading and the
 *    dawn-gate paragraph. **A single column since 26 Aug 2026** — it carried
 *    the tiger film in a 7/5 grid from 19 Aug until the client asked for the
 *    film gone, and closing the grid with it is what this file's own top-of-file
 *    comment records.
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
 * ## The tiger came off on 26 Aug 2026, and the header band closed behind it
 *
 * Client: *"Remove the tiger from 'The Experience' section, hence removing the
 * big gap between the activities and the text for this section."* The film was
 * the header band's right-hand column in a 12-column grid — copy in
 * `lg:col-span-7`, film in `lg:col-span-5` — and the gap he is pointing at is
 * those five columns, empty, once the film is gone. Taking the film out alone
 * would have fixed nothing: the band is now a single column, not a 7/5 split
 * with one side vacated.
 *
 * **The film is unmounted, not deleted** — `components/signature/
 * SignatureFilm.tsx`, `/media/tiger-film.mp4`, its poster and
 * `scripts/check_films.mjs` are all untouched, exactly as the lantern, the
 * potter's film and the hornbill tint were handled when the v2 restructure
 * dropped them (see the unmount comments in `app/page.tsx`). `feat/image-sizing`
 * still ships it. `scripts/check_films.mjs` therefore has nothing left to check
 * on this branch and fails — that failure is the client's ruling, not a
 * regression; see `docs/DECISIONS.md` §22 and `CLAUDE.md`. Do not "fix" it by
 * remounting the film.
 *
 * **The 7/5 split's own reasoning is spent, not wrong.** It was 7/5 rather than
 * 5/7 because a 7-column slot for a 300px film left 461px of bare cream inside
 * its own column, and `lg:items-start` because the film column was the taller of
 * the two and bottom-aligning would have pushed the chapter mark 210px down the
 * page. Both facts were about a film that is no longer here, so neither survives
 * as a reason to keep any part of the grid.
 */
export function ExperienceStrip({
  chapter,
  surface = false,
}: {
  chapter: Chapter;
  surface?: boolean;
}) {
  const copy = chapterCopy(chapter.id as ChapterCopyKey) as StripCopy;
  const strip = HOME.strip;

  return (
    // `tight`, carried over from the coverflow unchanged — the client's third
    // change of 18 Aug 2026, *"make sure it fits snugly and has no large
    // unnecessary, disconnecting space before or after"*. `py-10 md:py-12
    // lg:py-14` against the default `py-14 md:py-16 lg:py-20`.
    <ChapterSurface id={chapter.id} surface={surface} tight>
      {/*
        The header band.

        **It was a 7/5 grid until 26 August 2026, and the tiger held the five.**
        Client: *"Remove the tiger from 'The Experience' section, hence removing
        the big gap between the activities and the text for this section."* The
        gap he is pointing at is those five columns, empty — so the film going
        was only half the fix and the band collapses to one column with it.

        **The 7/5 was not arbitrary and its reasoning is now spent rather than
        wrong:** 7/5 rather than 5/7 because a 7-column slot for a 300px film
        left 461px of bare cream inside its own column, and `lg:items-start`
        because bottom-aligning the shorter column would push the chapter mark
        210px down the page. Both facts were about a film that is no longer
        here.

        **The film is unmounted, not deleted** —
        `components/signature/SignatureFilm.tsx`, `/media/tiger-film.mp4` and
        `scripts/check_films.mjs` are untouched, exactly as the lantern, the
        potter's film and the hornbill tint were handled when the v2
        restructure dropped them. `feat/image-sizing` still ships it.

        **`scripts/check_films.mjs` therefore has nothing left to check on this
        branch and will fail. That failure is the client's ruling, not a
        regression** — see `docs/DECISIONS.md` §22 and CLAUDE.md. Do not "fix"
        it by remounting the film.
      */}
      <Enter>
        <div>
          {chapter.number && chapter.label && (
            <ChapterMark number={chapter.number} label={chapter.label} />
          )}
          <TwoToneHeading heading={copy.heading} className="mt-6 max-w-[20ch]" />
          <p
            className="mt-7 max-w-[62ch] font-[family-name:var(--font-body)] text-[1.15rem] leading-[1.68] md:text-xl"
            style={{ color: "var(--text)" }}
          >
            {copy.body[0]}
          </p>
        </div>
      </Enter>

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
