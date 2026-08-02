import { movementCopy } from "@/content/home";
import { MovementSection } from "./MovementSection";

/**
 * "the-sky" — content/movements.ts: night, the page's closing
 * movement (spec section 3, movement 6). Text-only: nothing in the curated
 * manifest depicts a night sky or a telescope on the lawn — a gap worth noting
 * alongside Task 1's missing hand-drawn map, see the Task 6 report.
 */
export function TheSky() {
  const copy = movementCopy("night");

  return <MovementSection id="the-sky" chapter={copy.chapter} heading={copy.heading} body={copy.body} />;
}
