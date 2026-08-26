import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReviewWidget } from "@/components/ui/ReviewWidget";
import { ELFSIGHT_SCRIPT, REVIEWS_APP_ID } from "@/lib/elfsight";

/**
 * A non-firing `IntersectionObserver` stub, so `ElfsightLoader`'s "no
 * `IntersectionObserver`" fallback (load immediately — see that component's
 * own doc comment) does not mask the thing this file actually tests. jsdom
 * ships no `IntersectionObserver` at all, and *that* absence is what would
 * otherwise make the platform load eagerly here for the wrong reason.
 */
function stubNonFiringObserver() {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      disconnect = vi.fn();
      unobserve = vi.fn();
      observe = vi.fn();
      constructor() {}
    },
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.querySelectorAll(`script[src="${ELFSIGHT_SCRIPT}"]`).forEach((s) => s.remove());
});

describe("ReviewWidget", () => {
  it("renders the vendor's mount, which their platform finds by class name", () => {
    const { container } = render(<ReviewWidget />);
    const mount = container.querySelector(`.elfsight-app-${REVIEWS_APP_ID}`);
    expect(mount).not.toBeNull();
  });

  it("keeps the lazy attribute, so the widget is not fetched above the fold", () => {
    const { container } = render(<ReviewWidget />);
    const mount = container.querySelector(`.elfsight-app-${REVIEWS_APP_ID}`);
    expect(mount?.hasAttribute("data-elfsight-app-lazy")).toBe(true);
  });

  /**
   * This used to assert the opposite — that React 19's hoist-and-dedupe
   * behaviour for `<script async src>` put the platform script straight into
   * `document.head` on render, with a substantial comment explaining why no
   * cleanup could ever strip it back out between tests (React's own
   * bookkeeping, not the live DOM, decides whether a hoisted `src` is
   * inserted again). That was treated as proof the widget "cannot block the
   * first screen." **Measured 26 August 2026, that was false**:
   * `data-elfsight-app-lazy` does not defer the platform script at all — an
   * eagerly rendered `<script>` fetched 588 KB over 9 requests on `load`,
   * regardless of the widget sitting in the page's last chapter, taking
   * desktop initial transfer to 1,554 KB against non-negotiable #6's 1,500 KB
   * ceiling and the hero's arrival from 4,616 ms to 5,377 ms. See
   * `docs/reviews/2026-08-26-restructure/widget-network-cost.md`.
   *
   * The fix (`ElfsightLoader`, an `IntersectionObserver` gate) means the
   * opposite is now true, and this test asserts it: the script must be
   * **absent** from `document.head` on render. It stubs a non-firing
   * `IntersectionObserver` first, because jsdom's *natural* lack of one would
   * otherwise trip `ElfsightLoader`'s own "old browser, load immediately"
   * fallback and mask exactly the gate this test exists to prove — the
   * fallback is real behaviour, but `ElfsightLoader.test.tsx` is where it is
   * asserted, not here. The `afterEach` above removes the script and unstubs
   * the global so this test's stub cannot leak into a sibling test in this
   * file — unlike the old assertion, this one has something to clean up.
   */
  it("does not load the platform script on render — it is gated behind ElfsightLoader", () => {
    stubNonFiringObserver();
    render(<ReviewWidget />);
    const script = document.querySelector('script[src="https://elfsightcdn.com/platform.js"]');
    expect(script).toBeNull();
  });

  it("is labelled, because a region a screen reader lands in must say what it is", () => {
    const { getByRole } = render(<ReviewWidget label="What guests say" />);
    expect(getByRole("region", { name: "What guests say" })).toBeTruthy();
  });
});
