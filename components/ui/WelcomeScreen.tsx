import { BrandMark } from "@/components/ui/BrandMark";

/**
 * The welcome: the brand lockup on cream, the flower turning once, and then it
 * goes. The client's request, 8 Aug 2026 — "quick enough that it doesn't come as
 * too long of a break and gently welcoming".
 *
 * ## It has no JavaScript, and that is the whole design
 *
 * A welcome screen that fails to leave is a site nobody can use, and every route
 * that could strand one runs through script: a chunk that never loads, a handler
 * that throws, a timer in a backgrounded tab. So there is none. The screen is
 * server-rendered and a CSS animation takes it away, which means the thing that
 * removes it is the same thing that drew it.
 *
 * **The base style is hidden, and only the animation's backwards fill makes it
 * visible.** That is not a detail — it is the direction the failure falls in.
 * With `animation-fill-mode: both` the `from` keyframe applies from the first
 * painted frame, so a visitor sees the welcome exactly as they would if it were
 * visible by default; but if the animation never runs at all, the base style
 * wins and they get the site with no welcome. The opposite arrangement — visible
 * in CSS, hidden by the animation — fails into a cream screen with a logo on it
 * and no way past. Every rule is in `app/globals.css` under `[data-welcome]`.
 *
 * `prefers-reduced-motion` therefore needs no special handling beyond
 * `animation: none`, which is what the rest of the page already does: with no
 * animation there is no welcome, which is the correct answer for someone who has
 * asked not to be shown movement.
 *
 * ## Why it sits below the leaf cursor
 *
 * `z-index: 90` — above the header (40) and the menu overlay (50), below the
 * leaf cursor (100). The cursor replaces the visitor's arrow outright once they
 * move the pointer, so covering it would leave a desktop visitor with no pointer
 * at all for the first second and a third of their visit.
 *
 * ## Bytes
 *
 * None. The flower is already in the first load for the header, at the same two
 * encoded widths, and the name is live type in a font the page has loaded
 * anyway. The welcome adds markup and no requests — which is the only reason it
 * can sit in front of a hero that is already 1,475 ms over its budget
 * (non-negotiable #6) without making that worse. `scripts/check_welcome.mjs`
 * measures that rather than assuming it.
 */
export function WelcomeScreen() {
  return (
    <div
      data-welcome
      /*
       * `aria-hidden`, and not focusable. It is a decorative curtain over content
       * that is already in the DOM and already announced — a screen reader should
       * be reading the page, not a logo that is on its way out.
       */
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 flex items-center justify-center bg-[color:var(--bg)]"
    >
      {/*
       * `standalone`: this lockup is not the header's, and must not carry the two
       * hooks that say it is. See the prop's note — reusing them cost a build,
       * because `check_contrast_over_photos.mjs` finds `data-contrast` globally
       * and measured this one, hidden, against the hero photograph.
       */}
      <BrandMark standalone />
    </div>
  );
}
