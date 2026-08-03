import type { Metadata } from "next";
import { Grain } from "@/components/motion/Grain";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
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
