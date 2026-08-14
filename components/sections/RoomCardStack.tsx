import { Enter } from "@/components/motion/Enter";
import { ChapterMark } from "@/components/ui/ChapterMark";
import { ChapterSurface } from "@/components/ui/ChapterSurface";
import { Photo } from "@/components/ui/Photo";
import { TwoToneHeading } from "@/components/ui/TwoToneHeading";
import type { PropertyChapter } from "@/content/property-chapters";
import { SITE } from "@/content/site";
import { ENTER } from "@/lib/motion";
import { RoomCard } from "./RoomCard";
import type { RoomShowcaseCopy } from "./RoomShowcase.types";

/** One id shape, composed in exactly one place. Task 7's rigs and the tests
 * both re-derive it; a card's trigger and its panel can never disagree. */
export function roomGalleryId(chapterId: string, index: number) {
  return `room-gallery-${chapterId}-${index}`;
}

/**
 * Where "close" points. Deliberately an id NO element in the document ever
 * carries — not the bare `"#"` that a naive close link would reach for, which
 * the HTML fragment-navigation algorithm special-cases to mean "scroll to the
 * top of the document," a real and jarring jump on a long property page.
 * Navigating to a fragment that names no element is a genuine no-op: the spec
 * finds no "indicated part," so nothing scrolls and `:target` matches nothing
 * — every `.room-gallery` panel falls back to its default `display: none`.
 * One sentinel, not one per chapter: `:target` is a document-wide, single-
 * value match (`location.hash` is one string), so there is never more than
 * one target regardless of how many chapters' galleries exist on the page.
 */
export const ROOM_GALLERY_CLOSED = "room-gallery-closed";

/** Exported for `lib/sizes.test.ts`. The enlarged photo is `object-contain`
 * inside ~88vw x ~78svh, so its drawn width is min(88vw, 78svh x aspect) —
 * ~80vw for the 3:2 rooms on a 1440x900 screen, less for the portrait; 80vw
 * over-states the portrait's need, which is the safe direction (`ui/Photo.tsx`
 * says which way to round).
 *
 * **Deliberately left as `80vw`, not widened, by the image-sizing Task 8 fix
 * below (14 Aug 2026).** This string governs which FILE `srcset` selects, not
 * layout — the `<Photo>`'s own CSS `max-width` (see its `className`, below)
 * is what actually bounds the rendered width now, so a viewport wide enough
 * to overflow `.room-gallery-box` can no longer do so regardless of what this
 * constant says. `ui/Photo.tsx`'s own comment states the rounding direction
 * this relies on: over-stating a `sizes` box costs a tier of bytes at worst;
 * under-stating it ships a visibly soft photograph, the one failure mode this
 * page cannot afford. */
export const GALLERY_SIZES = "(min-width: 768px) 80vw, calc(100vw - 32px)";

/**
 * The rooms, as a stack of cards the visitor scrolls through.
 *
 * Client request, 11 Aug 2026: "pile up, with recede" — each card sticks below
 * the header while the next rises over it, and a covered card scales down and
 * dims so the deck reads as depth rather than as stacked paper.
 *
 * **It carries no JavaScript.** The stacking is `position: sticky`; the recede
 * is a CSS scroll-driven animation, but not off each card's own view timeline —
 * a sticky element's own `view()` timeline freezes while it is actually stuck,
 * which would only let a covered card dim after it had already scrolled out of
 * view (measured; see `app/globals.css`'s comment above `.room-stack`). Each
 * card instead reads a NAMED timeline (`--room-slot-N`) sourced from its own
 * non-sticky `.room-slot` sibling below, published into scope here via
 * `timelineScope`. There is no hook here, no scroll listener and no
 * `"use client"` — which is what let this ship against 3.7 KB of budget
 * headroom.
 *
 * The mechanics live in `app/globals.css` under `.room-stack`; the numbers live
 * in `lib/motion.ts` as `ROOM_STACK`. Neither is written here.
 */
export function RoomCardStack({
  chapter,
  copy,
  surface = false,
}: {
  chapter: PropertyChapter;
  copy: RoomShowcaseCopy;
  surface?: boolean;
}) {
  return (
    <ChapterSurface id={chapter.id} surface={surface}>
      <div>
        <div className="grid gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
          <Enter>
            <div>
              {chapter.number && chapter.label && (
                <ChapterMark number={chapter.number} label={chapter.label} />
              )}
              <TwoToneHeading heading={copy.heading} className="mt-6 max-w-[16ch]" />
            </div>
          </Enter>
          <Enter delay={ENTER.stagger}>
            <p
              className="max-w-[58ch] font-[family-name:var(--font-body)] text-[1.05rem] leading-[1.72] md:text-lg"
              style={{ color: "var(--dim)" }}
            >
              {copy.intro}
            </p>
          </Enter>
        </div>

        {/*
         * `--room-count` is what makes the deck depth a calculation rather than
         * a number per property: Vann has three rooms and Tola four, so their
         * decks are 28px and 42px and their cards differ in height by 14px.
         * Written here because this is the only place that knows the count.
         *
         * `timelineScope` lists every card's own named view-timeline
         * (`--room-slot-0`, `--room-slot-1`, …, one per room — `RoomCard.tsx`).
         * Each is declared on a `.room-slot` sibling and consumed by its
         * `.room-card` sibling, not by an ancestor — see `.room-slot`'s comment
         * in `app/globals.css` for why siblings, and why this property is what
         * lets a sibling's declaration reach a sibling's consumer at all.
         */}
        <ol
          className="room-stack mt-10 md:mt-12"
          style={
            {
              "--room-count": String(copy.rooms.length),
              timelineScope: Array.from(
                { length: copy.rooms.length },
                (_, i) => `--room-slot-${i}`,
              ).join(", "),
            } as React.CSSProperties
          }
        >
          {copy.rooms.map((room, i) => (
            <RoomCard
              key={room.name}
              room={room}
              index={i}
              onSurface={surface}
              isLast={i === copy.rooms.length - 1}
              galleryId={roomGalleryId(chapter.id, i)}
            />
          ))}
        </ol>

        {/*
         * The gallery: one panel per room, shown by CSS `:target` against its
         * own `id` — no `popover`, no script.
         *
         * **Why `:target` and not `popover` (image-sizing Task 7 fix, 14 Aug
         * 2026).** `popover="auto"` shipped first and measured wrong: the HTML
         * Popover API's own "topmost popover ancestor" rule treats a popover
         * invoked from a button INSIDE another open popover as NESTED rather
         * than a replacement, and the arrows have to live inside their own
         * panel to sit next to its own figure. Confirmed with an isolated
         * two-popover fixture before touching this file: an invoker inside its
         * sibling popover nests (both stay open); the same markup with the
         * invoker moved outside replaces cleanly. `:target` does not have this
         * failure mode BY CONSTRUCTION, not by care: `location.hash` is one
         * string, so at most one element in the whole document can ever match
         * `:target` at a time, regardless of where the link that set it lives.
         * `scripts/check_room_gallery.mjs`'s own "exactly one panel open"
         * assertion is what this construction exists to satisfy, and it is
         * watched failing against a deliberately broken CSS variant, not
         * assumed safe because the mechanism sounds right — that is exactly
         * the mistake the popover version made.
         *
         * **What this costs, plainly: `:target` has no Escape key.** Popover
         * gave Esc for free (UA behaviour); `:target` is a URL/CSS mechanism
         * with no keyboard binding at all, and adding one back would need a
         * `keydown` listener — script this construction deliberately has none
         * of. Closing is by the close control or the backdrop only — either
         * reached from the keyboard by Tab then Enter (an `<a href>`
         * activates on ENTER ONLY; Space scrolls the page, it does not
         * activate a link — said precisely because an earlier draft of this
         * comment said "Enter/Space" and that is wrong). Not a silent
         * regression: recorded here, in `check_room_gallery.mjs`'s own
         * header (which replaces its old "Esc closes" assertion with one that
         * tests the close control and the backdrop instead, rather than
         * quietly deleting the check), and in `docs/DECISIONS.md`.
         *
         * **A second cost in the same family, also not free: closing does not
         * return focus.** The popover version's hide algorithm restored focus
         * to whichever element had opened it — UA behaviour, free. `:target`
         * has nothing equivalent: closing navigates to `ROOM_GALLERY_CLOSED`,
         * a fragment matching no element, so no "focusing steps" run at all
         * (see the panel's own `tabIndex={-1}` note above for what DOES run
         * them on OPEN) and the previously-focused link — now inside a
         * `display: none` subtree — is dropped by the browser to `<body>`. A
         * keyboard visitor who opens the third room and closes it does not
         * land back on that room's own trigger; they restart Tab from the top
         * of the page. Measured, not assumed: `check_room_gallery.mjs` reads
         * `document.activeElement` after the close control fires, the same
         * way it already does after opening, so this is visible in the rig's
         * own output rather than only in this paragraph.
         *
         * **A genuine side effect, arguably a feature: the back button steps
         * back through opened rooms.** Every fragment navigation is a real
         * history entry. Measured three deep, not merely once: open room 0,
         * then 1, then 2, then press Back three times — each step returns to
         * the previous room in turn and the fourth lands on the page with
         * nothing open, on both routes (`check_room_gallery.mjs`'s own
         * `backButtonDeep` check) — a lightbox behaviour `popover` never gave
         * this page, unasked for but free.
         *
         * **Structure, per panel:**
         * - The panel itself (`id={roomGalleryId(...)}`) is `display: none`
         *   by default, shown by `.room-gallery:target` (`app/globals.css`).
         *   `tabIndex={-1}` makes it a valid PROGRAMMATIC focus target: the
         *   HTML fragment-navigation algorithm runs its "focusing steps" on
         *   the indicated element if it has ANY `tabindex`, which is the only
         *   reason focus moves into the gallery at all on open — without it,
         *   `:target` still shows the panel but leaves focus wherever it was.
         *   `check_room_gallery.mjs` reads `document.activeElement` after
         *   opening rather than assuming this fires.
         * - A full-viewport `<a>` behind the panel's own box is the light-
         *   dismiss backdrop, replacing the old `::backdrop` pseudo-element
         *   (which only exists for popover/dialog top-layer elements — a
         *   plain `:target` div gets no such thing, so this is a REAL DOM
         *   node). It points at the same close sentinel as the close link,
         *   carries `aria-hidden="true"` AND `tabIndex={-1}` (no accessible
         *   name either way, since it has no text, but a focusable-yet-hidden
         *   element is its own anti-pattern, so both together keep it out of
         *   the accessibility tree and out of the tab order — a visitor never
         *   lands on an announced-as-nothing tab stop). Same wash colour as
         *   the retired `::backdrop`, still decorative, still carries no text.
         * - The visible box (figure, caption, arrows) is centred with
         *   `position: fixed` + `top/left: 50%` + `translate(-50%, -50%)` —
         *   chosen explicitly over `margin: auto` for the OPPOSITE reason
         *   `.room-gallery`'s own CSS comment records: Tailwind's own
         *   preflight (`* { margin: 0 }`) is what silently defeated the
         *   popover UA stylesheet's `margin: auto` centring in the first
         *   place (Finding 2, same fix round), and a translate never touches
         *   `margin` at all, so the same reset cannot reach it a second time.
         * - Previous/next are `<a href="#…">` at the neighbour's id, the same
         *   wraparound arithmetic already verified for both n=3 (Vann) and
         *   n=4 (Tola). Close is an `<a>` to `ROOM_GALLERY_CLOSED`, never a
         *   bare `"#"` — see that constant's own comment for why.
         *
         * The page can still scroll behind an open panel (Lenis bypasses CSS
         * locks, §2 #9) — known, client-informed, accepted 13 Aug 2026, and
         * unchanged by this fix. `check_room_gallery.mjs` also measures
         * `window.scrollY` before/after every open — `:target`'s own "scroll
         * the indicated part into view" step should be a no-op against a
         * `position: fixed` element (its box is already viewport-relative,
         * independent of document scroll), but that is measured, not assumed.
         *
         * **`:target` applies on first paint, which reaches the welcome
         * screen.** A room's own fragment can already be in the URL before
         * this component ever mounts — a reload, a bookmarked or copied
         * link, Back into a page that had a panel open (every open is a real
         * history entry, per the paragraph above) — so the panel can be
         * showing from the very first frame, while `WelcomeScreen` is still
         * holding. `.room-gallery`'s own `z-index: 60` in `app/globals.css`
         * is chosen so the (opaque, full-viewport) welcome screen's `z-index:
         * 90` sits above it for that whole hold, deliberately, and that
         * file's own comment reads every other stacked value on the page
         * rather than stating one — an earlier draft of it stated
         * `[data-site-header]` as `z-index: 90` without checking, and it is
         * not (§2 #51). Deep-link-opens is kept as a real, working capability
         * — the panel is correctly open the moment the welcome clears — and
         * `check_room_gallery.mjs`'s "welcome collision" check loads a route
         * with a room fragment already in the URL and reads what is actually
         * painted mid-hold, not just the z-index numbers on paper.
         */}
        {copy.rooms.map((room, i) => {
          const n = copy.rooms.length;
          return (
            <div
              key={`gallery-${room.name}`}
              id={roomGalleryId(chapter.id, i)}
              role="dialog"
              aria-label={`${room.name} — ${SITE.roomGallery.open}`}
              tabIndex={-1}
              className="room-gallery"
            >
              <a
                href={`#${ROOM_GALLERY_CLOSED}`}
                aria-hidden="true"
                tabIndex={-1}
                className="room-gallery-backdrop"
              />
              <div className="room-gallery-box">
                <figure>
                  {/*
                   * `max-w-[min(88vw,93rem)]`, not the bare `max-w-[88vw]`
                   * this shipped with until this measured fix (image-sizing
                   * Task 8, 14 Aug 2026). `.room-gallery-box`'s own
                   * `max-width` (`app/globals.css`) is `min(calc(88vw +
                   * 3rem), 96rem)` — it SATURATES at `96rem` past ~1690.9px
                   * of viewport width and stops growing. This image's old
                   * bound, a bare `88vw`, had no matching ceiling and kept
                   * growing past that point, so a wide-enough, tall-enough
                   * viewport (a window snapped to half a 4K/ultrawide
                   * display; a portrait monitor) pushed the photograph past
                   * its own box — measured, before this fix, at 26px of
                   * overflow at 1920x1500, growing to 410px+ beyond it.
                   *
                   * The fix makes this bound and the box's own INNER width
                   * (its cap minus its `3rem` of padding) the same formula,
                   * not merely "wide enough": `min(88vw + 3rem, 96rem) -
                   * 3rem = min(88vw, 96rem - 3rem) = min(88vw, 93rem)`. The
                   * two are then IDENTICALLY EQUAL at every viewport width —
                   * `88vw` below ~1690.9px (neither side has saturated),
                   * `93rem` above it (both have) — not merely never-smaller,
                   * so no future viewport shape can pull them apart again.
                   * `GALLERY_SIZES` (above) is deliberately left at `80vw` —
                   * it picks a FILE, this picks a LAYOUT WIDTH, and the two
                   * no longer need to agree for this overflow to stay closed.
                   * Full derivation: `scripts/check_room_gallery.mjs`'s own
                   * `checkWideOverflow` comment; measured proof:
                   * `docs/reviews/2026-08-13-image-sizing/gallery.json`'s
                   * `wideOverflow` field; narrative: `docs/DECISIONS.md` §18.
                   */}
                  <Photo
                    id={room.mediaId}
                    sizes={GALLERY_SIZES}
                    pictureClassName="block"
                    className="mx-auto h-auto max-h-[78svh] w-auto max-w-[min(88vw,93rem)]"
                  />
                  <figcaption className="mt-4 flex items-baseline justify-between gap-6">
                    <span className="font-[family-name:var(--font-display)] text-xl text-[color:var(--text)]">
                      {room.name}
                    </span>
                    <span
                      className="font-[family-name:var(--font-label)] text-[0.62rem] uppercase tracking-[0.2em]"
                      style={{ color: "var(--accent-text)" }}
                    >
                      {room.facts.join(" · ")}
                    </span>
                  </figcaption>
                </figure>
                <div className="mt-4 flex justify-between gap-6 border-t pt-3" style={{ borderColor: "var(--accent)" }}>
                  {n > 1 && (
                    <a
                      href={`#${roomGalleryId(chapter.id, (i + n - 1) % n)}`}
                      className="rule-in font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[color:var(--text)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent-text)]"
                    >
                      {SITE.roomGallery.previous}
                    </a>
                  )}
                  {n > 1 && (
                    <a
                      href={`#${roomGalleryId(chapter.id, (i + 1) % n)}`}
                      className="rule-in font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[color:var(--text)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent-text)]"
                    >
                      {SITE.roomGallery.next}
                    </a>
                  )}
                  <a
                    href={`#${ROOM_GALLERY_CLOSED}`}
                    className="rule-in font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[color:var(--text)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent-text)]"
                  >
                    {SITE.roomGallery.close}
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ChapterSurface>
  );
}
