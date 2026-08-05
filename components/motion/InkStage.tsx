"use client";

import { useCallback, useRef } from "react";
import { useInView } from "./useInView";
import { useReenter } from "./useReenter";

/**
 * Gives its children a `data-ink` state, on the page's existing entrance engine.
 *
 * Fail-safe on the same terms as `Enter`: **the absence of the attribute is the
 * drawn state**, so no JavaScript, a thrown error and `prefers-reduced-motion`
 * each leave the tiger complete and still. Script may only stage it, and only
 * after `useInView` has confirmed it is below the fold — a tiger that erased
 * itself on screen and redrew would be the exact flicker that hook exists to
 * prevent.
 *
 * **It takes `children` rather than importing the artwork.** A client component's
 * `import`s ship to the browser; its children do not. Importing `lib/tiger-art.ts`
 * here would push 17 KB of path data into a JavaScript chunk when it belongs in
 * the HTML, and `npm run verify:budget` is what proves it did not.
 *
 * The tiger is well below the fold, so the default `rootMargin` is right: it
 * cannot be one of the short, final elements the hook's usage rule warns about.
 */
export function InkStage({ children }: { children: React.ReactNode }) {
  const { ref, state } = useInView<HTMLDivElement>();
  const node = useRef<HTMLDivElement | null>(null);

  /**
   * The stir. Coming back to a dozing tiger wakes it.
   *
   * **Resetting `currentTime` is the only reliable way to restart a CSS
   * animation here.** Toggling an attribute the rule already matches does not do
   * it — the animation simply carries on — and remounting the SVG would re-run
   * the ink as well, which must not happen: once drawn, the tiger stays drawn.
   *
   * It is also exactly what `scripts/check_ink_tiger.mjs` asserts, so the check
   * and the mechanism are the same claim rather than two guesses about each other.
   */
  const stir = useCallback(() => {
    for (const animation of node.current?.getAnimations({ subtree: true }) ?? []) {
      animation.currentTime = 0;
      animation.play();
    }
  }, []);

  const reenterRef = useReenter<HTMLDivElement>(stir);

  return (
    <div
      // Two hooks want this element, so the ref is a callback that feeds both.
      ref={(el) => {
        node.current = el;
        ref.current = el;
        reenterRef.current = el;
      }}
      // Omitted rather than written as "rest", so the attribute's presence always
      // means script is driving this element.
      {...(state === "rest" ? {} : { "data-ink": state })}
    >
      {children}
    </div>
  );
}
