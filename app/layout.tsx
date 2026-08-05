import type { Metadata } from "next";
import { Grain } from "@/components/motion/Grain";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import LeafCursorMount from "@/components/signature/leaf-cursor";
import { DURATION, ENTER, IMAGE_FROM } from "@/lib/motion";
import { PALETTE } from "@/lib/palette";
import { HOME } from "@/content/home";
import { body, display, label } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: HOME.meta.title,
  description: HOME.meta.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
          // The emblem's single half-turn as the page arrives. Same terms again:
          // the number lives in `lib/motion.ts`, the keyframes in
          // `app/globals.css`, and neither can drift from the other.
          "--emblem-turn-duration": `${DURATION.emblemTurn}s`,
          // The hairline that slides in under a link, on the same terms as
          // everything above it: the number lives in `lib/motion.ts`, the rule
          // lives in `app/globals.css`, and neither can drift from the other.
          "--rule-in-duration": `${DURATION.ruleIn}s`,
        } as React.CSSProperties
      }
    >
      <body className={`${display.variable} ${label.variable} ${body.variable}`}>
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
        </SmoothScroll>
      </body>
    </html>
  );
}
