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
 * `count + 1` steps, not `count`: a card is centred at the MIDDLE of its own
 * window, so the first card needs half a window before it and the last one half
 * a window after. Windows deliberately overlap by one step — a card must be
 * leaving while its successor arrives, or there is a moment mid-scroll with
 * nothing centred and a stage of bare cream.
 */
export function coverflowWindow(index: number, count: number) {
  const step = 100 / (count + 1);
  return { start: index * step, end: (index + 2) * step };
}
