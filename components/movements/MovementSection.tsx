import type { ReactNode } from "react";
import { ChapterLabel } from "@/components/ui/ChapterLabel";
import { Reveal } from "@/components/motion/Reveal";
import { bandMinHeight } from "@/lib/band-height";

/**
 * Shared layout for the seven text-carrying movements: a chapter label, a
 * heading, body copy, and room underneath for that movement's plates. Every
 * movement component below composes this rather than writing its own
 * `<section>`, so the field-guide rhythm (label above heading, body at the same
 * measure, generous vertical space) can only drift in one place.
 *
 * Height comes from `bandMinHeight(id)`, which reads the band's own `weight`
 * out of `content/movements.ts` — the single source `lib/timeline.ts` also
 * reads to place the light. No movement types its own height (Task 6's binding
 * constraint).
 *
 * Content is anchored near the *top* of the band, not centred in it. A band's
 * height is set by its `weight` (tuned in Task 2 for the light timeline, not
 * for this placeholder copy's word count), so the heaviest bands render far
 * taller than their current short prose fills. Centring would surround that
 * prose with blank space on both sides — the visitor would scroll through a
 * bare field of colour before ever reaching it. Anchoring at the top instead
 * means the content is the first thing in view as the band begins, and any
 * surplus height reads as a deliberate pause in that band's colour before the
 * next movement, not a gap the visitor has to scroll past to find the words.
 *
 * `as` picks the heading tag: `h1` for the page's one true title (the opening
 * movement), `h2` for every other movement — mirroring the same rule already
 * applied in `app/preview/light-states/page.tsx`.
 */
export function MovementSection({
  id,
  chapter,
  heading,
  body,
  as = "h2",
  children,
}: {
  id: string;
  chapter: string;
  heading: string;
  body: string;
  as?: "h1" | "h2";
  children?: ReactNode;
}) {
  const HeadingTag = as;

  return (
    <section
      className="flex flex-col gap-16 px-[8vw] pt-24 pb-32 md:pt-32"
      style={{ minHeight: bandMinHeight(id) }}
    >
      <Reveal>
        <ChapterLabel>{chapter}</ChapterLabel>
        <HeadingTag
          className="mt-6 max-w-[20ch] font-[family-name:var(--font-display)] text-[clamp(2rem,6vw,4rem)] font-light leading-[1.1]"
          style={{ color: "var(--text)" }}
        >
          {heading}
        </HeadingTag>
        <p
          className="mt-8 max-w-[60ch] text-lg leading-relaxed"
          style={{ color: "var(--text)" }}
        >
          {body}
        </p>
      </Reveal>

      {children}
    </section>
  );
}
