/**
 * The shell every cream chapter shares: the section element, its anchor, its
 * vertical rhythm, its measure, and which of the two cream surfaces it sits on.
 *
 * It exists because five sections had grown five copies of the same three class
 * strings, and the vertical rhythm is a dial — "there is too much air between
 * chapters" should be one edit, not five.
 *
 * **`surface` alternates the two creams**, and does it by redefining `--bg` for
 * the subtree rather than by setting a background colour. That is deliberate:
 * `ImageReveal`'s mask and the cream padding behind overlapping photographs both
 * paint `var(--bg)`, and if the section merely painted itself a different colour
 * those would wipe and frame in the *other* cream. Redefining the variable keeps
 * every one of them correct without a single component having to be told which
 * surface it is standing on.
 *
 * `PALETTE.paperDeep` is the guidelines' own second surface and CLAUDE.md
 * non-negotiable #3 names it. It is here for a measured reason: with all eight
 * cream chapters on one colour, the ~160px where one section's bottom padding
 * meets the next one's top padding reads as a hole in the page. As a tonal step
 * it reads as two panels meeting, which is what it is.
 *
 * **That stack was 192px until 5 Aug 2026** — `lg:py-24` twice over — and the
 * five emptiest screens on the whole page were all of them chapter joins, at
 * 67-71% empty, belonging to no chapter and so appearing in no chapter's score
 * (`docs/reviews/2026-08-05-density/`). 80px a side is the dial this comment
 * always said it was; nothing was removed to turn it.
 *
 * **`tight` is a second, narrower rhythm, added Task 15 (9/10 Aug 2026) and
 * opt-in only — the default above is untouched, which is what keeps this
 * change off the home page.** `OpeningColumn`, `PropertyMap` and `PressBand`
 * are the property pages' three shortest chapters, each well under one
 * 900px screen tall (`0.61`–`0.79` of one in `measure_density.mjs`'s own
 * count), which is exactly the shape that fails non-negotiable #8: a chapter
 * shorter than a screen is measured on the single 900px window centred on
 * it, and the shorter the chapter, the more of that window is unavoidably
 * some neighbour's own top/bottom padding rather than either chapter's real
 * content. `vann-press` measured 88.4% empty this way. Shrinking the padding
 * is "taking height back" in the same sense CLAUDE.md's own #8 examples
 * are — it does not add anything, it removes air the chapter does not need
 * to make its case, and it was re-measured after, not assumed:
 * `docs/reviews/2026-08-09-property-redesign/README.md`.
 */
export function ChapterSurface({
  id,
  children,
  surface = false,
  tight = false,
  className,
}: {
  id: string;
  children: React.ReactNode;
  /** Sit on `paperDeep` rather than `paper`. */
  surface?: boolean;
  /** The narrower rhythm — see the doc comment above. */
  tight?: boolean;
  className?: string;
}) {
  return (
    <section
      id={id}
      // `overflow-x-clip`, never `overflow-x-hidden`: several chapters push a
      // photograph past the viewport edge on purpose, and `hidden` would make
      // the page a scroll container and break `position: sticky` inside it.
      className={`relative overflow-x-clip bg-[color:var(--bg)] ${tight ? "py-10 md:py-12 lg:py-14" : "py-14 md:py-16 lg:py-20"} ${className ?? ""}`}
      style={surface ? ({ "--bg": "var(--surface)" } as React.CSSProperties) : undefined}
    >
      <div className="mx-auto max-w-[1600px] px-6 md:px-12">{children}</div>
    </section>
  );
}
