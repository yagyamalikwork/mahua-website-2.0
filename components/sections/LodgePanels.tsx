import { Enter } from "@/components/motion/Enter";
import { ImageReveal } from "@/components/motion/ImageReveal";
import { SplitLines } from "@/components/motion/SplitLines";
import { ChapterMark } from "@/components/ui/ChapterMark";
import { Photo } from "@/components/ui/Photo";
import { PillButton } from "@/components/ui/PillButton";
import { Scrim, type ScrimStrength } from "@/components/ui/Scrim";
import { TwoToneHeading } from "@/components/ui/TwoToneHeading";
import type { ChapterLike } from "@/content/chapters";
import { chapterCopy, type ChapterCopyKey, type LodgeCopy, type TwoTone } from "@/content/home";
import { SITE } from "@/content/site";
import type { MediaId } from "@/lib/media";
import { LODGE_PANELS } from "@/lib/motion";

type LodgesCopy = {
  readonly heading: TwoTone;
  readonly intro: string;
  readonly lodges: readonly LodgeCopy[];
};

/**
 * How wide a panel is actually drawn.
 *
 * The band is edge-to-edge, so a panel is the whole viewport while the two are
 * stacked and half of it once they sit side by side.
 *
 * **`50vw` is exact from 20 Aug 2026, where it used to round up.** There was a
 * 16px gutter between the panels until the client asked for them joined, and
 * this string deliberately over-stated a `calc(50vw - 8px)` panel by eight
 * pixels on `ui/Photo.tsx`'s rule that a `sizes` rounds up where it is unsure.
 * There is now nothing to round: the two panels share the viewport exactly.
 *
 * The breakpoint is interpolated from `LODGE_PANELS.twoUpFromPx` rather than
 * written as `1024`, for the same reason `CoverflowCard`'s `CARD_SIZES` is
 * interpolated from `COVERFLOW`: there is then no second copy of the number to
 * drift from. The Tailwind variant beside it must still be the literal `lg:` —
 * a variant assembled at runtime is a utility Tailwind never emits — and
 * `lib/sizes.test.ts` is what holds the two together.
 */
export const PANEL_SIZES = `(min-width: ${LODGE_PANELS.twoUpFromPx}px) 50vw, 100vw`;

/**
 * The panel's shape, and the box the photograph is `object-cover` inside.
 * `aspect-[4/3]` in the markup below; the crop table is on `LODGE_PANELS`.
 */
export const PANEL_BOX = LODGE_PANELS.boxW / LODGE_PANELS.boxH;

/**
 * The wash between each lodge photograph and the cream type laid on it, at `lg`
 * and above. Below that the words are on cream and there is no wash at all —
 * see the component's own note on why.
 *
 * **Solved against the rendered page, per photograph, never chosen** — the rule
 * `ui/Scrim.tsx` records, and the reason these are two entries rather than one
 * number: the two frames are nothing alike. `vann-hero` is a lit ochre veranda
 * over a pale stone floor, warm and bright everywhere; `tola-hero` is a lodge
 * under trees whose top third is blown-out white sky and whose bottom third is a
 * dark lily pond. A single figure heavy enough for the first would drown the
 * second, which is exactly the mud `Scrim`'s own comment describes.
 *
 * **`corner` and `bottom` carry it and the `flat` is small, which is the whole
 * point of the responsive split.** Both photographs' subject is in the upper
 * half; a wash that reaches a full-width block of type sitting a third of the
 * way down a panel has to be a `flat`, and a `flat` heavy enough for these two
 * frames measured **0.56-0.60** — mud, and over the entire subject. The solver
 * minimises the mean alpha over the panel's top 45% rather than over the whole
 * of it, precisely so it cannot buy the type's legibility with the photograph.
 *
 * The binding viewport is **1024**, not 1440 and not 390: it is the narrowest
 * width at which the panels are side by side, so it is where the block is
 * tallest as a fraction of the panel (the type's top edge sits at 37% of the
 * panel's height at 1024, 44% at 1440 and 56% at 1920 — and the `bottom`
 * gradient's own alpha ramps from zero at 28%).
 *
 * Figures and the widths that bind them are in
 * `docs/reviews/2026-08-19-home-v2/shapes.md`; re-derive with
 * `node scripts/check_contrast_over_photos.mjs`, whose `RUNS` table carries one
 * run per panel. That table is hand-written and discovers nothing — a panel
 * absent from it is a panel nobody has checked.
 */
const PANEL_SCRIM: Partial<Record<MediaId, ScrimStrength>> = {
  // Lit ochre plaster over a pale stone floor. The floor is what the words sit
  // on and it is bright everywhere, so this frame needs the heavier corner of
  // the two — there is no dark patch under the type to help.
  "vann-hero": { corner: 0.72, bottom: 0.96, flat: 0.44 },
  // The lily pond under the words is the darkest part of this frame, so the
  // bottom gradient does most of the work; the corner is here for the pale sand
  // bank that crosses the block's left edge.
  "tola-hero": { corner: 0.96, bottom: 0.94, flat: 0.24 },
};

/**
 * The fallback for a photograph nobody has solved a figure for.
 *
 * Dominates both solved entries layer by layer, so a swapped `mediaId` can never
 * land LIGHTER than the fallback by accident. Nothing reaches it today; it
 * exists for the edit that changes a photograph in `content/chapters.ts` without
 * coming back here. Heavy fails towards legible-but-muddy, which a reviewer
 * sees; light fails towards illegible, which they may not.
 */
const PLACEHOLDER_SCRIM: ScrimStrength = { corner: 0.95, bottom: 0.95, flat: 0.3 };

/**
 * `01 · The Lodges` as two photographs side by side, each carrying its own name.
 *
 * Client's model, 19 Aug 2026: ecotriip.co's India / Africa split, supplied as a
 * screenshot. Spec §2. It replaces `components/sections/LodgeCards.tsx` — two
 * cream cards, each an asymmetric pair of photographs with the words beneath —
 * which is still in the tree and still compiles, and is now routed by nothing.
 *
 * ## Three things here that are not free to change
 *
 * 1. **The panels are edge-to-edge and the header is not.** That split is the
 *    whole density argument: this chapter measured 43.7% mean / **48.6% worst**
 *    on the v2 spine, one of only two chapters over non-negotiable #8's ceiling,
 *    and a chapter's density is set by how much of a 900px window is photograph.
 *    Every pixel of container padding at 1440 is 96px of cream across the band's
 *    full height. The header keeps the padding because it is type, and type in a
 *    1,600px measure is what the rest of the page does.
 * 2. **The words are ON the photograph only from `lg` up, and that was decided
 *    by a solver rather than by taste.** Below `lg` a panel is 390-1023px wide
 *    and 4:3, so the block — a label, a lodge's name, two sentences and a pill —
 *    is 83% of its height at 390 and starts 17% down it. `ui/Scrim`'s shaped
 *    layers cannot reach that: the `bottom` gradient's alpha is zero above 28%,
 *    and the `corner` wedge has faded to nothing by the time the body copy's
 *    lines reach the panel's right-hand side. The only layer that covers it is a
 *    `flat`, and the lightest flat that carried both frames' worst pixel to
 *    4.5:1 measured **0.56 and 0.60** — over the whole photograph, subject
 *    included, which is precisely the mud `ui/Scrim.tsx` was written to warn
 *    against. So below `lg` the same block sits under the photograph on cream,
 *    in ink and `--accent-text`, where `lib/palette.test.ts` already guarantees
 *    it; from `lg` it moves onto the frame in cream over a solved wash. One
 *    block, two placements — see the markup's own note on why it is not written
 *    twice.
 * 3. **The panel takes the zoom and refuses the float, and they are one flag
 *    apart.** Client, 20 Aug 2026: *"add the zoom effect on the images for the
 *    cards as we have on other images on our homepage."* So `ImageReveal`'s
 *    `noZoom` is gone. But `[data-no-zoom]` was switching off BOTH homepage
 *    hover effects, and only one of them is wanted here: `FLOAT` translates the
 *    frame 6px upward, which on a photograph that reaches the edge of the screen
 *    opens a 6px seam of the section's cream along its foot — and now that the
 *    two panels are joined, that seam runs the full width of the window. It
 *    would also slide the photograph out from under its own `Scrim`, which is a
 *    sibling layer rather than a child of the frame. So the frame carries
 *    `no-float`, the class `app/globals.css` excludes from the float rules and
 *    from their reduced-motion mirror; the zoom, which scales the `<picture>`
 *    INSIDE a frame that never moves, is fully contained by the panel's own
 *    `overflow-hidden` and shows nothing at the join.
 *
 * ## Where each word comes from
 *
 * Nothing here is written. The lodge's `body` and `cta` are its own entry in
 * `content/home.ts`; the name, the region label and the route are read off
 * `content/site.ts`, matched by `href`, so no lodge name is written twice and a
 * renamed route is a thrown error rather than a panel with no label (spec §2).
 * `place`, `gate` and `rooms` are deliberately not drawn: the reference's panel
 * is a label, a name, a sentence and a button, and those three facts open the
 * property page this button goes to.
 *
 * Photographs are read positionally — panel *n* is `chapter.media[n]`, in the
 * order `content/chapters.ts` declares them, which is the order the copy lists
 * the lodges in. `content/chapters.ts` says so beside the list.
 */
export function LodgePanels({
  chapter,
  surface = false,
}: {
  chapter: ChapterLike;
  surface?: boolean;
}) {
  const copy = chapterCopy(chapter.id as ChapterCopyKey) as LodgesCopy;

  return (
    <section
      id={chapter.id}
      // `overflow-x-clip`, never `overflow-x-hidden` — the same rule
      // `ui/ChapterSurface.tsx` records: `hidden` makes the page a scroll
      // container and breaks `position: sticky` inside it.
      //
      // This section does not use `ChapterSurface` because that component puts
      // every child inside its padded 1,600px container, and the band below has
      // to reach the edge of the screen. The padding, the surface swap and the
      // `--bg` redefinition are copied from it deliberately, so the two chapters
      // sit on the same rhythm and the alternating creams still alternate.
      className="relative overflow-x-clip bg-[color:var(--bg)] py-14 md:py-16 lg:py-20"
      style={surface ? ({ "--bg": "var(--surface)" } as React.CSSProperties) : undefined}
    >
      <div className="mx-auto max-w-[1600px] px-6 md:px-12">
        <Enter>
          {/* A two-column header rather than the centred block `LodgeCards`
              used, and it is a density decision as much as a compositional one:
              the heading beside the intro is ~130px of cream where the two
              stacked and centred were ~290px. `ChapterMark`'s own comment names
              this as one of the two arrangements it exists for. */}
          <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-x-10">
            <div className="lg:col-span-6">
              {chapter.number && chapter.label && (
                <ChapterMark number={chapter.number} label={chapter.label} />
              )}
              <TwoToneHeading heading={copy.heading} className="mt-6 max-w-[16ch]" />
            </div>
            <p
              className="max-w-[58ch] font-[family-name:var(--font-body)] text-[1.08rem] leading-[1.72] md:text-lg lg:col-span-6"
              style={{ color: "var(--dim)" }}
            >
              {copy.intro}
            </p>
          </div>
        </Enter>
      </div>

      {/*
        Edge to edge, and **joined** — client, 20 Aug 2026: *"Remove the gap
        between the two property cards and I want them joined together, no gap
        in between."* `lg:gap-4` was 16px of cream down the middle until then,
        argued for on the grounds that two different photographs would otherwise
        read as one botched stitch; the client looked at it and ruled the other
        way, and the two frames turn out to be far enough apart in colour and
        subject that the join reads as a join (see this task's report).

        **`gap-12` below `lg` is not the same gap and stays.** There the panels
        are stacked, and what sits between them is not two photographs meeting —
        it is the first lodge's own words, on cream, under its photograph. Taking
        that to zero would butt one lodge's paragraph against the next lodge's
        frame.
      */}
      <div className="mt-10 grid gap-12 md:mt-12 lg:grid-cols-2 lg:gap-0">
        {copy.lodges.map((lodge, i) => {
          const mediaId = chapter.media[i];
          // The site's own record of this place. Matched by route rather than by
          // name or by index: a route is the one field both files are already
          // required to agree on (the button below navigates to it), so a
          // mismatch here is a real inconsistency and not a formatting one.
          const place = SITE.places.find((p) => p.href === lodge.href);
          if (!place?.region) {
            throw new Error(
              `LodgePanels: no place with a region in content/site.ts for ${lodge.href}. ` +
                `The panel's label, name and route all come from there — see spec §2.`,
            );
          }

          return (
            /* `zoom-from-parent` makes the WHOLE panel the zoom's trigger, not
               just the part of it the photograph's own frame can be hovered
               through. The block of words below is a later sibling of that
               frame and takes the pointer events over the bottom half of the
               panel; `app/globals.css` carries the finding and the reason this
               is a second selector rather than `pointer-events: none` on the
               words. */
            <article key={lodge.href} className="zoom-from-parent relative">
              {/* `isolate` so the frame is its own stacking context and the two
                  `-z-10` layers stay inside it rather than sliding under the
                  section. */}
              <div className="relative isolate aspect-[4/3] overflow-hidden">
                <div className="absolute inset-0 -z-10">
                  {/* `no-float` and no `noZoom` — see point 3 on the component.
                      The class rides in on `className` because `ImageReveal`
                      applies it to the frame element itself, which is the
                      element `[data-image-frame]` names and the one the float
                      would translate. */}
                  <ImageReveal className="no-float h-full w-full">
                    <Photo
                      id={mediaId}
                      sizes={PANEL_SIZES}
                      box={PANEL_BOX}
                      pictureClassName="block h-full w-full"
                      className="h-full w-full object-cover"
                    />
                  </ImageReveal>
                </div>
                {/* No wash below `lg`, because there is no type on the
                    photograph below `lg` — see the note on the component. A
                    scrim there would darken a frame nothing is written on. */}
                <div className="absolute inset-0 -z-10 hidden lg:block">
                  <Scrim {...(PANEL_SCRIM[mediaId] ?? PLACEHOLDER_SCRIM)} />
                </div>
              </div>

              {/*
                One block of words, two placements. Below `lg` it is an ordinary
                block under the photograph, in ink on cream; from `lg` it is
                absolutely positioned at the foot of the frame, in cream on the
                photograph. Rendering it once and moving it — rather than writing
                it twice behind `hidden`/`lg:block` — is what stops the two
                copies drifting, and it is why every colour below is a pair of
                classes rather than an inline `style`.

                Padding is written per axis (`px-*`, `pb-*`) and never as `p-*`.
                Two padding utilities on one element are resolved by whichever
                property Tailwind emits later, not by the breakpoint — this
                project's single most-catalogued defect shape (`DECISIONS.md`
                §2). Per-axis utilities cannot collide.
              */}
              <div className="mt-6 px-6 md:px-12 lg:absolute lg:inset-x-0 lg:bottom-0 lg:mt-0 lg:px-7 lg:pb-7 xl:px-10 xl:pb-10">
                {/* `data-contrast`, not a structural selector: this is the hook
                    `scripts/check_contrast_over_photos.mjs` crops to, and a run
                    whose selector went stale on this project once reported "not
                    visible" and was neither a pass nor a failure for a whole
                    task (see that file's `brand-wordmark` comment). */}
                <div data-contrast="lodge-panel" className="max-w-[46ch]">
                  {/*
                    Every type size below carries an `lg:` arm, and it is
                    arithmetic rather than taste: at `lg` the panel halves to
                    50vw while a `vw` unit does not, so a clamp tuned on a
                    full-width panel is drawn twice as large relative to its box
                    the moment the two sit side by side. Each `lg:` arm is the
                    same clamp with its `vw` term halved, which keeps the words a
                    roughly constant fraction of the panel across the whole
                    range. The coverflow card learnt this the expensive way — its
                    own note on `label`.

                    The region label is `--accent-text` gold on cream and cream
                    on the photograph, which is non-negotiable #7 read straight:
                    goldText is legible on cream and only on cream (3.43:1 on the
                    menu's glass, 2.0:1 on the footer's brown), so it cannot
                    follow the block onto a photograph.
                  */}
                  <p className="font-[family-name:var(--font-label)] text-[clamp(0.55rem,1.7vw,0.7rem)] uppercase tracking-[0.28em] text-[color:var(--accent-text)] lg:text-[clamp(0.55rem,0.85vw,0.7rem)] lg:text-[color:var(--bg)]">
                    {place.region}
                  </p>
                  {/*
                    **`SplitLines`, not a plain `<h3>` — client, 20 Aug 2026:**
                    *"add the 3D effect on the text that is on these cards,
                    exactly like the one we have on the text we have placed over
                    the images like on the last section."* The effect he is
                    pointing at is the closing chapter's heading, which is a
                    `TwoToneHeading`, which is this component with the page's
                    standard chapter-heading classes wrapped round it: each
                    visual line rises out from behind its own mask, staggered,
                    once the block scrolls in.

                    **It is `SplitLines` directly rather than `TwoToneHeading`,
                    and the three reasons are all this composition's rather than
                    preference.** (1) `TwoToneHeading` takes a `TwoTone` — a
                    headline plus the run of words inside it to soften — and a
                    lodge's name is a bare string off `content/site.ts` with no
                    such run; inventing one would be writing copy, and passing an
                    empty one would be lying to `content/home.test.ts`'s rule
                    about it. (2) Its `onPhoto` sets `text-[color:var(--bg)]`
                    unprefixed, and these words are on the photograph only from
                    `lg` — below that they are ink on cream, and cream on cream
                    is invisible. The pair below is the same idea written so the
                    two arms cannot collide. (3) Its size is one unprefixed
                    clamp, and this heading needs the `lg:` arm described above
                    (a `vw` term does not halve when the panel does).
                  */}
                  <SplitLines
                    as="h3"
                    className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.5rem,4.6vw,3rem)] font-light leading-[1.06] tracking-[-0.01em] text-[color:var(--text)] lg:mt-4 lg:text-[clamp(1.5rem,2.3vw,3rem)] lg:text-[color:var(--bg)]"
                  >
                    {place.label}
                  </SplitLines>
                  <p className="mt-4 font-[family-name:var(--font-body)] text-[clamp(0.9rem,2.6vw,1.05rem)] leading-[1.62] text-[color:var(--text)] lg:mt-5 lg:text-[clamp(0.9rem,1.3vw,1.05rem)] lg:text-[color:var(--bg)]">
                    {lodge.body}
                  </p>
                </div>

                {/* Its own hook, because the pill is measured differently: it is
                    a solid gold fill, so the rig hides its label's colour rather
                    than the element, and reads `--overlay` on gold rather than
                    cream on a photograph. `ui/PillButton.tsx` explains why the
                    `<span>` inside it is the rectangle to crop. */}
                <div data-contrast="lodge-panel-pill" className="mt-6 lg:mt-7">
                  {/* `raise` — client, 20 Aug 2026: *"make the buttons rise when
                      hovered on both of these like the section we have above the
                      website directory."* That is `.pill-raise`, the class the
                      two lodge buttons closing `08 · The Invitation` already
                      carry, and it is the same prop with the same numbers. */}
                  <PillButton href={place.href} raise>
                    {lodge.cta}
                  </PillButton>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
