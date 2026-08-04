"use client";

import { useInView } from "./useInView";

/**
 * A rise and settle as the element enters — the reference site's entrance,
 * replacing the `Reveal` that faded from 96% scale and was too subtle to
 * register. The whole animation is two CSS custom properties and a transition
 * in `app/globals.css`; the only JavaScript is one `IntersectionObserver`.
 *
 * Fail-safe by construction. The element renders with no `data-enter` at all,
 * which is the at-rest state, so no JavaScript, a thrown error and
 * `prefers-reduced-motion` each leave it plainly visible. Script may only stage
 * it — and only once it has confirmed the element is below the fold, where
 * nobody can see the staging happen. See `useInView` for the state machine.
 *
 * **Do not wrap a short, final element in this.** The observer's default
 * `rootMargin` trims 12% off the foot of the viewport, so something under 12vh
 * tall and flush with the bottom of the document could be staged with no scroll
 * left to settle it. The full rule is on `useInView`.
 *
 * `delay` is a transition delay, not a second animation: a group staggers by
 * giving each of its members a larger one, and they all still move at the same
 * speed.
 */
export function Enter({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, state } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={className}
      // Omitted rather than written as "rest", so the attribute's presence
      // always means script is driving this element.
      {...(state === "rest" ? {} : { "data-enter": state })}
      style={delay ? ({ "--enter-delay": `${delay}s` } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
