import { HOME } from "@/content/home";

/**
 * Placeholder. The nine-band day-arc composition this page used to render was
 * retired 3 Aug 2026 along with the colour system it depended on — Task 7
 * (docs/superpowers/plans) builds the real page on top of the flat cream
 * palette in lib/palette.ts.
 */
export default function Home() {
  return <h1>{HOME.chapters.arrival.headline}</h1>;
}
