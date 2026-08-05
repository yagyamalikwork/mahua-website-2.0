"use client";

import { useInView } from "./useInView";

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

  return (
    <div
      ref={ref}
      // Omitted rather than written as "rest", so the attribute's presence always
      // means script is driving this element.
      {...(state === "rest" ? {} : { "data-ink": state })}
    >
      {children}
    </div>
  );
}
