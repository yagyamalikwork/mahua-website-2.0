import { ImageReveal } from "@/components/motion/ImageReveal";
import { Photo } from "@/components/ui/Photo";
import { Scrim, type ScrimStrength } from "@/components/ui/Scrim";
import type { ExperienceCopy } from "@/content/home";
import { STRIP } from "@/lib/motion";

/**
 * How wide this card is actually drawn, at every viewport.
 *
 * **It is a fixed width, not a fraction of a container, and that shape is the
 * client's own design document** —
 * `Brand&Design-Guidelines/mahua-home-v2-dusk.html` sets
 * `.card { flex: 0 0 min(300px, 78vw) }`. A strip is not a grid: the cards do
 * not divide the width between them, they are a fixed size and the container
 * shows as many as it can. So `sizes` is genuinely simple here for the first
 * time on this page — two arms, no column arithmetic.
 *
 * | viewport | card |
 * |---|---|
 * | ≥ 436px | a flat 340px |
 * | < 436px | `78vw` |
 *
 * **The 340 is 300 in his document, swept up on density** — see
 * `STRIP.cardMaxPx`, which carries the four-row table and why 320 and 360 were
 * both rejected.
 *
 * **436 is exact, not rounded**: `78vw ≥ 340 ⟺ 100vw ≥ 435.9`, and the
 * breakpoint rounds UP to the first whole pixel at which the flat cap binds, so
 * the `vw` arm is never asked to describe a card the cap has already taken over.
 * Both numbers are interpolated from `STRIP` rather than written here, for the
 * reason `CARD_SIZES` learned across three sweeps of the coverflow's own cap: a
 * width with two copies is a width that can drift, and `sizes` is the copy
 * nobody looks at. That interpolation is why this table is the only thing that
 * needed touching when the sweep moved the card by 40px.
 *
 * **The 78vw arm is what a phone actually gets, and it is deliberate**: at 390px
 * the card is 304px against a 342px container, so ~38px of the next card shows
 * past the screen's edge. That peek is the best affordance the strip has, and it
 * is why the cap is `min(…)` rather than a plain 340px.
 *
 * There is no fourth bound here of the kind the coverflow needed — nothing about
 * this card answers to the viewport's height, because nothing pins.
 */
export const CARD_SIZES = `(min-width: ${Math.ceil((STRIP.cardMaxPx * 100) / STRIP.cardVw)}px) ${STRIP.cardMaxPx}px, ${STRIP.cardVw}vw`;

/**
 * The card's shape, and the box the photograph is `object-cover` inside.
 *
 * **0.74:1 — 37/50 — and every photograph in the strip is cut to it in the image
 * pipeline rather than by this box.** That is the whole finding of this chapter's
 * 19 Aug rebuild and it is worked in full at the head of
 * `scripts/build_images.mjs` ("THE PORTRAIT CROPS"). The short version, because a
 * future editor will reach for this constant first:
 *
 * | frame | file | aspect | what `cover` would take in this box |
 * |---|---|---|---|
 * | `bonfire-dinner` | 1100x733 | 1.501 | 50.7% of its width |
 * | `sound-healing` | 1000x666 | 1.502 | 50.7% |
 * | `guide-sunrise` | 1000x666 | 1.502 | 50.7% |
 * | `potters-hands` | 700x466 | 1.502 | 50.7% |
 * | `star-talks` | 900x1350 | 0.667 | 9.9% of its HEIGHT |
 *
 * This project bounds a WIDTH crop at 25% (`check_card_stack.mjs` assertion 6),
 * which rearranges to "the box may not be narrower than 0.75 × the file's own
 * aspect" — **1.1265 for a 1.5:1 frame.** That is a landscape box. **No portrait
 * card of any ratio can serve these files by `cover`**, so retuning this number
 * does not buy a legal crop; only a different file does. Five of the six are
 * therefore cropped to 0.74 by hand in the pipeline, so what this box does at
 * render time is nothing, and `star-talks` — the one genuinely portrait source —
 * loses 9.9% of its sky, which this project leaves unbounded by design.
 *
 * **Held to the `aspect-[37/50]` class below by `lib/sizes.test.ts`, in both
 * directions.** Change one and the other goes red, which is the only mechanism
 * on this page that connects a Tailwind class to the ratio `sizes` is computed
 * from.
 *
 * The client's own document draws its card differently — a `3/3.6` figure with a
 * body of type *beneath* it — and `ExperienceStrip.tsx` records why this one
 * carries its words on the photograph instead.
 */
export const CARD_BOX = STRIP.cardBoxW / STRIP.cardBoxH;

/**
 * One activity: a portrait photograph with its label, its name and one sentence
 * laid on it.
 *
 * **This knows nothing about the strip.** It is a plain block that happens to be
 * a flex item — no scroll, no position, no neighbours — which is the shape
 * `CoverflowCard` was built in and the one thing about that component worth
 * inheriting: a card that is correct standing still is a card whose failures
 * inside a scroller are certainly the scroller's. `RoomCard` was debugged the
 * other way round and it cost a fix round (`docs/DECISIONS.md` §17).
 *
 * ## Three things here that are not free to change
 *
 * 1. **Every word on the card is `var(--bg)` cream.** Ink on a photograph is
 *    exactly the failure CLAUDE.md's contrast rule exists to prevent, and
 *    `--accent-text` gold is legible on cream and *only* on cream (non-negotiable
 *    #7 — 3.43:1 on the menu's glass, 2.0:1 on the footer's brown).
 * 2. **The wash is a prop and every figure is solved per photograph**, keyed by
 *    `MediaId` in `ExperienceStrip.tsx`. Six frames are six exposures; one figure
 *    for all of them is what `Scrim`'s own comment records as having produced
 *    mud, and carrying a figure across a re-crop is what `docs/DECISIONS.md`
 *    §20.5 records as having shipped type at 1.01-1.32:1. These six are new
 *    photographs in a new shape, so all six were solved from scratch.
 * 3. **The words sit at the FOOT of the card, and the scrim's shape follows
 *    them.** Not centred, as the coverflow's were: a coverflow card was 1.96:1
 *    and mostly sky, and centring bought its scrims three geometric advantages
 *    (§20.5). A 0.74 card is 405px tall at 300px wide, its subject is in the
 *    middle of the frame by construction — every one of the five crops was
 *    positioned on its subject — and words centred on it would sit on the thing
 *    the photograph is of. The foot is where the reference puts them and where
 *    the photographs leave room.
 */
export function ExperienceCard({
  experience,
  scrim,
  id,
}: {
  experience: ExperienceCopy;
  /**
   * The wash between this photograph and the cream type on it.
   *
   * Solved per photograph against the rendered page — see `ExperienceStrip.tsx`'s
   * `CARD_SCRIM`, and `scripts/check_contrast_over_photos.mjs`, which carries a
   * run per card. That table is hand-written and discovers nothing: a card
   * absent from it is a card nobody has checked.
   */
  scrim: ScrimStrength;
  /**
   * The anchor the pager links at.
   *
   * Composed once, in `ExperienceStrip.tsx`, and handed down — a link and its
   * target cannot disagree about an id neither of them spells out. It sits on
   * the card rather than on a separate marker because, unlike the coverflow's,
   * this target is a real box in normal flow inside the scroller: bringing it
   * into view IS bringing the card into view, and the browser does that with no
   * JavaScript at all.
   */
  id: string;
}) {
  return (
    <li
      id={id}
      // `aspect-[37/50]` is `CARD_BOX` written for Tailwind; `lib/sizes.test.ts`
      // holds the two together. The width is the client's own
      // `flex: 0 0 min(300px, 78vw)`, in `app/globals.css` beside the strip that
      // lays it out — the one number this card does not own, because a strip's
      // gap and its card's width have to be solved together.
      //
      // **`zoom-from-parent` is the zoom's ONLY trigger here — client, 20 Aug
      // 2026:** *"I want the image zoom effect, exactly like the one we added to
      // the property cards where the image zooms and the text stays."*
      //
      // It was added by analogy with `01 · The Lodges`, where it is the *second*
      // of two selectors and covers the part of the panel the words take the
      // pointer over. **On this card it is the only one that ever matches, and
      // that was measured rather than assumed**: removing it drops the zoom at
      // all three points the rig hovers, not just the ones over the words.
      //
      // The reason is this card's own shape. `app/globals.css`'s generic rule is
      // `[data-image-frame]:hover`, and the frame here is `absolute inset-0
      // -z-10` — a *descendant* of the card, painted behind everything. The
      // element under the pointer is the card, and `:hover` matches only the hit
      // element and its ANCESTORS, so the frame is never hovered anywhere on the
      // card. Every composition that puts its photograph behind its content this
      // way needs this class, and `check_experience_strip.mjs` assertion 13 is
      // what says so out loud — it was watched failing with the class removed.
      className="experience-card zoom-from-parent relative isolate flex aspect-[37/50] flex-col justify-end overflow-hidden p-5"
      style={{
        // The one dark colour on the page, UNDER the photograph rather than over
        // it — so a card is a card before a byte of imagery arrives and the blur
        // placeholder is never a white hole. `FullBleedQuote` and the retired
        // coverflow card both did exactly this.
        backgroundColor: "var(--overlay)",
      }}
    >
      <div className="absolute inset-0 -z-10">
        {/*
         * **`ImageReveal` for the hover zoom and for nothing else**, which is why
         * it is `static`. `[data-image-frame]` is the hook `app/globals.css`
         * scopes the homepage zoom to, and that attribute belongs to this
         * component rather than being hand-written onto a `<div>` — one owner,
         * so a rule and its target cannot drift apart (the note there records
         * this project doing exactly that twice).
         *
         * `static` because the client asked for a zoom and not for an arrival.
         * Without it every card off the right-hand edge of the strip would be
         * staged behind a cream mask and settle only when scrolled to, which
         * costs the strip its one affordance: the ~38px of the next card that
         * shows past the screen's edge at 390 would be a cream sliver instead of
         * a photograph.
         *
         * **`no-float`, for the same reason `01 · The Lodges`' panels carry it.**
         * `FLOAT` raises the frame 6px; this frame is `absolute inset-0` inside a
         * card that clips, so a rise would open a 6px band of the card's own
         * `--overlay` along its foot and slide the photograph out from under the
         * `Scrim`, which is a sibling layer and not a child. The zoom has neither
         * problem — it scales the `<picture>` inside a frame that never moves.
         */}
        <ImageReveal static className="no-float h-full w-full">
          <Photo
            id={experience.mediaId}
            sizes={CARD_SIZES}
            box={CARD_BOX}
            // The words on this card ARE its accessible content, exactly as with
            // `FullBleed` under a quote — see `ui/Photo.tsx`'s note on
            // `decorative`. Announcing the alt text as well would read the
            // activity twice, once as a caption of a place and once as a
            // description of a picture of it.
            decorative
            pictureClassName="block h-full w-full"
            className="h-full w-full object-cover"
          />
        </ImageReveal>
      </div>
      <div className="absolute inset-0 -z-10">
        <Scrim {...scrim} />
      </div>

      {/* `data-contrast` rather than a structural selector: the six runs in
          `check_contrast_over_photos.mjs` need a hook that survives this block
          being re-composed, which is the lesson that file's own
          `brand-wordmark` comment records — a run whose selector went stale
          reported "not visible" and was neither a pass nor a failure. */}
      <div data-contrast="experience-card" className="relative">
        {/* The reference's status pill, with nothing to report. See
            `ExperienceCopy.label`. `text-indent` is not needed here as it is on
            a centred label — this block is left-aligned, so the trailing
            letter-space falls off the right-hand end where nobody sees it. */}
        <p className="font-[family-name:var(--font-label)] text-[0.62rem] uppercase tracking-[0.28em] text-[color:var(--bg)]">
          {experience.label}
        </p>
        {/* `clamp()`, not a breakpoint step: below 385px the card's width is
            `78vw` and its height therefore `78vw / 0.74`, so its type has to be
            continuous too or it is legible at 390 and clipped at 360. That is
            the shape of defect this project has now shipped three times between
            its fixed sample widths (`DECISIONS.md` §2 #44-45, #52-53, §20.7). */}
        <h3 className="mt-2 font-[family-name:var(--font-display)] text-[clamp(1.05rem,4.2vw,1.3rem)] font-light leading-snug tracking-[-0.01em] text-[color:var(--bg)]">
          {experience.title}
        </h3>
        <p className="mt-2 font-[family-name:var(--font-body)] text-[clamp(0.8rem,3.1vw,0.9rem)] leading-[1.5] text-[color:var(--bg)]">
          {experience.body}
        </p>
      </div>
    </li>
  );
}
