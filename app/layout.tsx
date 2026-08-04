import type { Metadata } from "next";
import { Grain } from "@/components/motion/Grain";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
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
        } as React.CSSProperties
      }
    >
      <body className={`${display.variable} ${label.variable} ${body.variable}`}>
        <SmoothScroll>
          <Grain />
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
