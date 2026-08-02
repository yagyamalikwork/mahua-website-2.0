import type { Metadata } from "next";
import { LIGHT_STATES } from "@/lib/palette";
import { HOME } from "@/content/home";
import { body, display, label } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: HOME.meta.title,
  description: HOME.meta.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Seeded from the first light state, server-rendered so there is no flash of
  // unstyled colour. DaySurface overwrites these as the visitor scrolls.
  // Read from palette.ts rather than written in CSS: one source of truth for colour.
  const dawn = LIGHT_STATES[0];

  return (
    <html
      lang="en-GB"
      style={
        {
          "--bg": dawn.bg,
          "--text": dawn.text,
          "--accent": dawn.accent,
          "--accent-text": dawn.accentText,
        } as React.CSSProperties
      }
    >
      <body className={`${display.variable} ${label.variable} ${body.variable}`}>
        {children}
      </body>
    </html>
  );
}
