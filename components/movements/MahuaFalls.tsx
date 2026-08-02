import { ChapterLabel } from "@/components/ui/ChapterLabel";
import { Reveal } from "@/components/motion/Reveal";
import { bandMinHeight } from "@/lib/band-height";
import { HOME, movementCopy } from "@/content/home";

/**
 * "mahua-falls" — the opening movement (content/movements.ts: dawn).
 * The page's one true title lives here (spec section 3, movement 0): `HOME.hero`
 * carries the H1/sub exactly as the spec gives them, and `movementCopy("dawn")`
 * supplies the chapter label and the mahua-blossom explanation beneath — "not
 * decoration... is the philosophy in one image" per the Master Brand Record.
 *
 * No photograph. The falling blossom the spec describes for this movement is a
 * signature interaction (Plan 3's job, spec section 5), not a still photograph,
 * and nothing in the curated manifest depicts it — this band stays text-only,
 * like the first panel of `app/preview/light-states/page.tsx`.
 */
export function MahuaFalls() {
  const dawn = movementCopy("dawn");

  return (
    <section
      className="flex flex-col justify-center px-[8vw] py-24"
      style={{ minHeight: bandMinHeight("mahua-falls") }}
    >
      <Reveal>
        <ChapterLabel>{dawn.chapter}</ChapterLabel>
        <h1
          className="mt-6 max-w-[16ch] font-[family-name:var(--font-display)] text-[clamp(2.5rem,8vw,6rem)] font-light leading-[1.05]"
          style={{ color: "var(--text)" }}
        >
          {HOME.hero.headline}
        </h1>
        <p
          className="mt-8 max-w-[46ch] text-lg leading-relaxed opacity-90"
          style={{ color: "var(--text)" }}
        >
          {HOME.hero.sub}
        </p>
      </Reveal>

      <Reveal delay={0.15}>
        <h2
          className="mt-20 max-w-[16ch] font-[family-name:var(--font-display)] text-[clamp(1.5rem,3vw,2.25rem)] font-light leading-[1.15]"
          style={{ color: "var(--text)" }}
        >
          {dawn.heading}
        </h2>
        <p className="mt-6 max-w-[60ch] text-lg leading-relaxed" style={{ color: "var(--text)" }}>
          {dawn.body}
        </p>
      </Reveal>
    </section>
  );
}
