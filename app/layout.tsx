import type { Metadata } from "next";
import { Grain } from "@/components/motion/Grain";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import LeafCursorMount from "@/components/signature/leaf-cursor";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { WelcomeScreen } from "@/components/ui/WelcomeScreen";
import {
  DURATION,
  ENTER,
  FLOAT,
  IMAGE_FROM,
  LINES,
  LIVING,
  PHOTO_ZOOM,
  RAISE,
  REVIEWS,
  ROOM_STACK,
  STRIP,
  WELCOME,
} from "@/lib/motion";
import { REVIEW_CARD } from "@/lib/reviews";
import { INDEXING_ALLOWED } from "@/lib/indexing";
import { PALETTE } from "@/lib/palette";
import { HOME } from "@/content/home";
import { body, display, label } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: HOME.meta.title,
  description: HOME.meta.description,
  /*
   * The other half of `app/robots.ts`, and both are needed.
   *
   * `robots.txt` asks a crawler not to *fetch* a page. This tells one that
   * fetched it anyway not to *index* it — which is the case that actually
   * happens, because a page reached by a link from somewhere else is crawled
   * without anyone reading `robots.txt` first.
   *
   * Default is no. Going live means setting `NEXT_PUBLIC_ALLOW_INDEXING=true`
   * in the one environment that is the real site; see `lib/indexing.ts` for why
   * the flag opens rather than closes.
   */
  robots: INDEXING_ALLOWED
    ? undefined
    : {
        index: false,
        follow: false,
        nocache: true,
        googleBot: { index: false, follow: false },
      },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Written once from PALETTE, server-rendered so there is no flash of unstyled
  // colour. The page no longer moves through a scroll-driven sequence of light
  // states, so these values never change after paint (retired 3 Aug 2026).
  // Read from palette.ts rather than written in CSS: one source of truth for colour.
  return (
    <html
      lang="en-GB"
      style={
        {
          "--bg": PALETTE.paper,
          "--surface": PALETTE.paperDeep,
          "--text": PALETTE.ink,
          "--dim": PALETTE.dim,
          "--accent": PALETTE.gold,
          "--accent-text": PALETTE.goldText,
          // The client's own wordmark brown. It appears in exactly one place —
          // the header's lockup, once the bar has gained a cream background to
          // sit on — and it is written here rather than in the header so that
          // `lib/palette.ts` stays the only file that knows a colour.
          "--brand": PALETTE.brand,
          // The only dark value on the page, and only ever laid over a
          // photograph — scrims, and the fill of a pill that sits on one.
          "--overlay": PALETTE.overlay,
          // The entrance, on the same terms as the colour: written once from
          // lib/motion.ts so `app/globals.css` and the tests that guard these
          // numbers read the same source. `--enter-delay` is deliberately
          // absent — it is per-element, set by whatever is staggering a group,
          // and the CSS falls back to 0s.
          "--enter-rise": ENTER.rise,
          "--enter-scale": String(ENTER.scale),
          "--enter-duration": `${ENTER.duration}s`,
          "--enter-ease": ENTER.ease,
          // A photograph's arrival, on the same terms. The mask wipes for
          // `imageMask` while the image itself settles down out of `IMAGE_FROM`
          // over the longer `revealSlow` — the pairing `ImageReveal` has always
          // used, now expressed in CSS instead of a GSAP timeline.
          "--image-from-scale": String(IMAGE_FROM.scale),
          "--image-mask-duration": `${DURATION.imageMask}s`,
          "--image-settle-duration": `${DURATION.revealSlow}s`,
          // A headline arriving line by line. Two values because `SplitLines`
          // has a `slow` variant for the quote laid over a full-bleed
          // photograph, which is longer on screen and reads better unhurried;
          // the component swaps between them rather than carrying a number.
          "--lines-duration": `${DURATION.reveal}s`,
          "--lines-slow-duration": `${DURATION.revealSlow}s`,
          // How far below its own mask a word starts — `LINES.from`, which was
          // the literal `115%` in the stylesheet until 20 Aug 2026. See that
          // token for why it may not go lower.
          "--lines-from": LINES.from,
          // The guests' review carousel. Same terms as everything above: the
          // numbers live in `lib/motion.ts` and `lib/reviews.ts`, the rules live
          // in `app/globals.css`, and neither can drift from the other. The card
          // dimensions are here rather than as Tailwind classes because the
          // marquee's own arithmetic reads them — a duplicate track only lands
          // on the seam if the card's width and its gap are the same two numbers
          // the keyframes were solved against.
          "--reviews-seconds-per-card": `${REVIEWS.secondsPerCard}s`,
          "--reviews-settle-cards": String(REVIEWS.settleCards),
          "--review-card-w": `min(${REVIEW_CARD.widthPx}px, ${REVIEW_CARD.vw}vw)`,
          "--review-card-h": `${REVIEW_CARD.heightPx}px`,
          "--review-card-gap": `${REVIEW_CARD.gapPx}px`,
          "--review-quote-lines": String(REVIEW_CARD.quoteLines),
          // The emblem's single half-turn as the page arrives. Same terms again:
          // the number lives in `lib/motion.ts`, the keyframes in
          // `app/globals.css`, and neither can drift from the other.
          "--emblem-turn-duration": `${DURATION.emblemTurn}s`,
          // The welcome screen. Its flower turns faster than the header's — see
          // the note on `WELCOME` for why — and `--welcome-hold` is an
          // animation-delay rather than a keyframe percentage so both numbers
          // stay changeable from `lib/motion.ts` alone.
          "--welcome-turn": `${WELCOME.turn}s`,
          "--welcome-hold": `${WELCOME.hold}s`,
          "--welcome-fade": `${WELCOME.fade}s`,
          // The rooms card stack, on the same terms as everything above it: the
          // numbers live in `lib/motion.ts`, the rules live in
          // `app/globals.css`, and neither can drift from the other. Published
          // on `<html>` rather than on the section because `--property-bar-reserve`
          // describes a bar that is fixed to the viewport, not to any chapter.
          // The homepage's hover zoom. Same terms as everything else here: the
          // numbers live in `lib/motion.ts`, the rule lives in `app/globals.css`,
          // and neither can drift from the other.
          "--photo-zoom": String(PHOTO_ZOOM.scale),
          "--photo-zoom-out": `${PHOTO_ZOOM.out}s`,
          "--photo-zoom-back": `${PHOTO_ZOOM.back}s`,
          "--photo-zoom-ease": PHOTO_ZOOM.ease,
          "--room-deck-step": `${ROOM_STACK.deckStep}px`,
          "--room-card-gutter": `${ROOM_STACK.gutter}px`,
          "--room-card-height-max": `${ROOM_STACK.heightMax}px`,
          "--room-card-scale-min": String(ROOM_STACK.scaleMin),
          "--room-card-dim": String(ROOM_STACK.dim),
          "--property-bar-reserve": `${ROOM_STACK.barReserve}px`,
          // `05 · Experiences`' card strip, on the same terms as the card
          // stack above it: the numbers live in `lib/motion.ts`, the rules live
          // in `app/globals.css`, and neither can drift from the other.
          //
          // **Three properties where the coverflow published ten**, and the drop
          // is the whole shape of the 19 Aug 2026 change: a pin length, a
          // neighbour's scale, its shift, its veil, a stage gutter in each axis
          // and a card box in two integers were all needed because that effect
          // computed every frame. A native `overflow-x` scroller needs a card's
          // width, its fallback width and the space between two of them.
          "--strip-card-max": `${STRIP.cardMaxPx}px`,
          "--strip-card-vw": `${STRIP.cardVw}vw`,
          "--strip-gap": `${STRIP.gapPx}px`,
          // The base paper, under its own name.
          //
          // `--bg` cannot serve here: `ChapterSurface` shadows it with
          // `var(--surface)` on every second chapter, so inside one of those a
          // card asking for `--bg` gets the deeper paper it is trying to sit
          // ON, and the whole stack goes invisible against its own section.
          // `--surface` is never shadowed, so this is the missing half of the
          // pair. Same value as `--bg` at the root, and never reassigned.
          "--paper": PALETTE.paper,
          // The hairline that slides in under a link, on the same terms as
          // everything above it: the number lives in `lib/motion.ts`, the rule
          // lives in `app/globals.css`, and neither can drift from the other.
          "--rule-in-duration": `${DURATION.ruleIn}s`,
          // The menu tiles' lift under the pointer, on the same terms: the five
          // numbers live in `lib/motion.ts`, the transform lives in
          // `app/globals.css`, and a component may not hard-code either.
          // The homepage photographs' float — `FLOAT` in `lib/motion.ts`. Same
          // terms as every other number here: written once, read by
          // `app/globals.css`, and neither can drift from the other.
          "--float-rise": `${FLOAT.risePx}px`,
          "--float-out": `${FLOAT.out}s`,
          "--float-back": `${FLOAT.back}s`,
          "--float-shadow-alpha": String(FLOAT.shadowAlpha),
          "--float-shadow-blur": `${FLOAT.shadowBlurPx}px`,
          "--float-shadow-drop": `${FLOAT.shadowDropPx}px`,
          "--raise-duration": `${RAISE.duration}s`,
          "--raise-rise": `${RAISE.risePx}px`,
          "--raise-tilt": `${RAISE.tiltDeg}deg`,
          "--raise-perspective": `${RAISE.perspectivePx}px`,
          "--raise-scale": String(RAISE.scale),
          // The tiger drawing itself. Same terms again: the numbers live in
          // `lib/motion.ts`, the transition lives in `app/globals.css`, and the
          // per-stroke delay is written by the component from its wave index.
          "--ink-duration": `${DURATION.tigerInk}s`,
          // The living phase. The counts are whole cycles that fit inside the
          // phase, computed here so no part is cut off mid-movement when the eyes
          // close — and so the numbers stay in `lib/motion.ts` rather than being
          // written twice.
          "--living-breath": `${LIVING.breath}s`,
          "--living-breath-count": String(
            Math.floor(LIVING.phase / LIVING.breath),
          ),
          "--living-blink": `${LIVING.blink}s`,
          "--living-blink-count": String(
            Math.floor(LIVING.phase / LIVING.blink),
          ),
          "--living-phase": `${LIVING.phase}s`,
        } as React.CSSProperties
      }
    >
      <body
        className={`${display.variable} ${label.variable} ${body.variable}`}
      >
        {/*
         * The welcome, outside `SmoothScroll` and before everything else.
         *
         * Outside because it is `position: fixed` and takes no part in the
         * scrolling page; before, so that in the painting order it sits under
         * nothing it needs to cover. It carries no JavaScript at all — see the
         * note on the component, and the base style in `app/globals.css`, which
         * is hidden precisely so that a welcome screen can never become a wall.
         */}
        <WelcomeScreen />
        <SmoothScroll>
          <Grain />
          {/*
           * The leaf cursor, and this line is the whole of it. Delete it and the
           * feature is gone, bytes included — see the note in
           * `components/signature/leaf-cursor/index.tsx`, and the test beside it
           * that fails if anything else ever imports from that directory.
           */}
          <LeafCursorMount />
          {children}
          {/*
           * The Website Directory. Inside the scroller and after the page's
           * own content, so it scrolls with the page like any other footer —
           * only the welcome sits outside `SmoothScroll`. Server-only, zero
           * JavaScript: see the note on the component itself for why that is
           * the one property this section exists to have.
           */}
          <SiteFooter />
        </SmoothScroll>
      </body>
    </html>
  );
}
