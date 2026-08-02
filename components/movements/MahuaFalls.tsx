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
      className="flex flex-col justify-center px-[8vw] py-24 short:py-6"
      style={{ minHeight: bandMinHeight("mahua-falls") }}
    >
      {/*
        Both blocks below are `static`, not animated: this band is exactly one
        viewport tall (weight 7 === CROSSING_WEIGHT) and vertically centred, so
        both are on screen at first paint — Lighthouse's LCP breakdown named the
        second block's paragraph (`dawn.body`) as the LCP element specifically
        because its fade tween was what delayed "final paint" (see the task-7
        report's LCP finding). Content visible on load must not be animated in
        (spec section 11 beats section 4.3 here); every band below the fold
        keeps its `Reveal` untouched.
      */}
      <Reveal static>
        <ChapterLabel>{dawn.chapter}</ChapterLabel>
        <h1
          className="mt-6 max-w-[16ch] font-[family-name:var(--font-display)] text-[clamp(2.5rem,8vw,6rem)] font-light leading-[1.05] short:mt-3 short:text-[clamp(1.75rem,7vw,3rem)]"
          style={{ color: "var(--text)" }}
        >
          {HOME.hero.headline}
        </h1>
        <p
          className="mt-8 max-w-[46ch] text-lg leading-relaxed opacity-90 short:mt-4"
          style={{ color: "var(--text)" }}
        >
          {HOME.hero.sub}
        </p>
      </Reveal>

      <Reveal static>
        <h2
          className="mt-20 max-w-[16ch] font-[family-name:var(--font-display)] text-[clamp(1.5rem,3vw,2.25rem)] font-light leading-[1.15] short:mt-6"
          style={{ color: "var(--text)" }}
        >
          {dawn.heading}
        </h2>
        <p className="mt-6 max-w-[60ch] text-lg leading-relaxed short:mt-3" style={{ color: "var(--text)" }}>
          {dawn.body}
        </p>
      </Reveal>
    </section>
  );
}
