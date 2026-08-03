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
 * cream chapters on one colour, the ~190px where one section's bottom padding
 * meets the next one's top padding reads as a hole in the page. As a tonal step
 * it reads as two panels meeting, which is what it is.
 */
export function ChapterSurface({
  id,
  children,
  surface = false,
  className,
}: {
  id: string;
  children: React.ReactNode;
  /** Sit on `paperDeep` rather than `paper`. */
  surface?: boolean;
  className?: string;
}) {
  return (
    <section
      id={id}
      // `overflow-x-clip`, never `overflow-x-hidden`: several chapters push a
      // photograph past the viewport edge on purpose, and `hidden` would make
      // the page a scroll container and break `position: sticky` inside it.
      className={`relative overflow-x-clip bg-[color:var(--bg)] py-16 md:py-20 lg:py-24 ${className ?? ""}`}
      style={surface ? ({ "--bg": "var(--surface)" } as React.CSSProperties) : undefined}
    >
      <div className="mx-auto max-w-[1600px] px-6 md:px-12">{children}</div>
    </section>
  );
}
