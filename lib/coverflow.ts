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
 *
 * **Where the geometry itself lives, since it is not here.** `app/globals.css`'s
 * `--cf-step` is the live arithmetic — the pinned window divided into
 * `count − 1` steps, so the six activities' centred moments tile the pin — and
 * `docs/reviews/2026-08-16-coverflow/task-1-timeline-probe.md` §11.7 is its
 * derivation. A `coverflowWindow()` helper describing an older, percentage-based
 * scheme lived here until 18 Aug 2026; it was consumed by nothing but its own
 * test, it had been marked retired since 17 Aug, and by then its prose described
 * two constructions the page no longer had. Deleted rather than corrected a
 * third time: the history is in `docs/DECISIONS.md` §20 and
 * `docs/reviews/2026-08-16-coverflow/linear.md`, and a live module is a bad
 * place to keep a page that does not exist.
 */

/** One id shape, composed in exactly one place — an arrow and its target can never disagree. */
export function coverflowTargetId(chapterId: string, index: number) {
  return `${chapterId}-card-${index}`;
}

/**
 * Which cards the arrows on card `index` point at — and `null` where there is
 * no such card.
 *
 * **The carousel is LINEAR, 18 Aug 2026, and this reverses the 16 Aug ruling
 * that made it wrap.** The client, having seen the loop: *"let's make it linear
 * and just keep it 01 to 06, so that when I come to the carousel I see card 01
 * in focus with no card placed before it … and when I scroll down to card 06 I
 * see [05] beside it but no card placed after it. So if the person wants to see
 * the 01 card again and currently sits on card 06, they will have to scroll back
 * to card 01 and vice-versa."*
 *
 * That last sentence is about the SCROLL, and the arrows are the same
 * navigation: a "previous" on card 01 that jumped to card 06 would be the
 * wrap-around he has just asked to be rid of, arriving by a different route. So
 * card 01 has no previous and card 06 has no next — the ends are ends.
 *
 * **`null`, never `-1`, and that is the whole reason this returns what it
 * returns.** The retired implementation was `(index + count - 1) % count`, whose
 * own comment warned that the naive `(index - 1) % count` returns `-1` at index
 * 0 — an arrow pointing at an id no element carries, a link that silently does
 * nothing, in the tail of a carousel where nobody looks. A sentinel index would
 * have brought that failure back by choice: `-1` is a `number`, so
 * `experiences[previous]` compiles, yields `undefined`, and the defect surfaces
 * as a blank aria-label or a crash three components away. `null` is not a
 * `number`, so every caller has to say what it does about the end of the
 * carousel before TypeScript will build.
 */
export function coverflowNeighbours(
  index: number,
  count: number,
): { previous: number | null; next: number | null } {
  return {
    previous: index > 0 ? index - 1 : null,
    next: index < count - 1 ? index + 1 : null,
  };
}
