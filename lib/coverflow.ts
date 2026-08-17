/**
 * The coverflow's arithmetic — `components/sections/Coverflow.tsx`.
 *
 * Here rather than in the component for the reason `lib/room-card.ts` exists:
 * the parts of a scroll effect that can be checked without a browser should be,
 * because the parts that cannot are expensive to check and this project has
 * learned that the hard way (`docs/DECISIONS.md` §17).
 *
 * Nothing in this file may import React, `next/*` or anything touching the DOM.
 * The moment it does, the cheap half of the effect stops being cheap to check.
 */

/** One id shape, composed in exactly one place — an arrow and its target can never disagree. */
export function coverflowTargetId(chapterId: string, index: number) {
  return `${chapterId}-card-${index}`;
}

/**
 * Which cards the arrows on card `index` point at.
 *
 * `(index + count - 1) % count`, never `(index - 1) % count`: JavaScript's `%`
 * keeps the sign of the dividend, so the naive form returns `-1` at index 0 and
 * the previous arrow would point at an id no element carries — a link that
 * silently does nothing, in the tail of a carousel, where nobody looks.
 */
export function coverflowNeighbours(index: number, count: number) {
  return {
    previous: (index + count - 1) % count,
    next: (index + 1) % count,
  };
}

/**
 * The slice of the shared timeline over which card `index` travels from
 * off-right to off-left, as percentages.
 *
 * **RETIRED 17 Aug 2026 — the arithmetic below is NOT what the page does.**
 * Imported by nothing but its own test; no component, script or stylesheet
 * reads it. Kept because deleting it is a decision worth taking on its own
 * rather than folding into a change that already touched five files.
 *
 * Two supersessions, in order. Task 1 §11 replaced percentages of `cover` with
 * lengths anchored to the pinned window, because dividing `cover` into steps
 * forces `screens ≥ card count` — six screens of pin for six cards. Then the
 * step denominator went from `count + 1` to `count − 1`: under `count + 1` all
 * EIGHT cards including the two flank ghosts tiled the pin, so the leading
 * ghost — a copy of the last activity — took a centred moment of its own, and
 * the client saw the carousel open on activity 06. The six activities tile the
 * pin now, card 01 centred exactly where the stage locks and card 06 exactly
 * where it releases, with the ghosts held at the flanks by their own keyframes.
 *
 * **Do not reason from this function.** `app/globals.css`'s `--cf-step` is the
 * live arithmetic and `docs/reviews/2026-08-16-coverflow/task-1-timeline-probe.md`
 * §11.7 is its derivation. This note exists so the only prose in `lib/`
 * describing this geometry does not quietly describe the defect.
 *
 * The original, for the record: `count + 1` steps put a card at the MIDDLE of
 * its own window, so the first needed half a window before it and the last half
 * a window after, and adjacent windows overlapped by one step so a card was
 * always leaving as its successor arrived.
 */
export function coverflowWindow(index: number, count: number) {
  const step = 100 / (count + 1);
  return { start: index * step, end: (index + 2) * step };
}
