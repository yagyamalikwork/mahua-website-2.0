import { act, cleanup, render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useInView } from "./useInView";

/**
 * The engine every entrance in Plan 4 runs on. What is being checked here is
 * what a visitor ends up looking at, not that an observer was constructed:
 * nothing may be staged that is already on screen, nothing may be staged for a
 * visitor who asked for less motion, and nothing may be staged in markup that
 * script never reaches. Each of these was verified to fail against a
 * deliberately broken hook before being kept.
 */

/** The instances the hook created, with a handle on each callback. */
type FakeObserver = {
  options: IntersectionObserverInit | undefined;
  targets: Element[];
  disconnected: number;
  fire: (isIntersecting: boolean) => void;
};

let observers: FakeObserver[] = [];

function installIntersectionObserver() {
  observers = [];
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(
        private cb: IntersectionObserverCallback,
        options?: IntersectionObserverInit,
      ) {
        observers.push({
          options,
          targets: [],
          disconnected: 0,
          fire: (isIntersecting) =>
            this.cb(
              observers[observers.length - 1].targets.map(
                (target) => ({ target, isIntersecting }) as IntersectionObserverEntry,
              ),
              this as unknown as IntersectionObserver,
            ),
        });
      }
      observe(el: Element) {
        observers[observers.length - 1].targets.push(el);
      }
      unobserve() {}
      disconnect() {
        observers[observers.length - 1].disconnected += 1;
      }
      takeRecords() {
        return [];
      }
    },
  );
}

function withReducedMotion(reduce: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: reduce && query.includes("prefers-reduced-motion"),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

/**
 * jsdom reports every rect as zeros, so by default everything looks on-screen
 * at mount. Push the element below the fold to exercise the staged path.
 */
function placeBelowTheFold() {
  const rect = { top: 5000, bottom: 5400, left: 0, right: 900, width: 900, height: 400, x: 0, y: 5000 };
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    ...rect,
    toJSON: () => rect,
  } as DOMRect);
}

/** A consumer of the shape Tasks 2 and 3 will write. */
function Entering({ rootMargin }: { rootMargin?: string }) {
  const { ref, state } = useInView<HTMLDivElement>(rootMargin ? { rootMargin } : undefined);
  return (
    <div ref={ref} data-enter={state} data-testid="subject">
      A tigress crossing the Turia road
    </div>
  );
}

function stateOf(container: HTMLElement) {
  return container.querySelector("[data-testid=subject]")?.getAttribute("data-enter");
}

/**
 * The browser delivers observer callbacks outside React; `act` flushes them.
 * An observer always delivers one callback shortly after `observe()`, so
 * `report(o, false)` is the first-look callback and not an invented event.
 */
function report(observer: FakeObserver, isIntersecting: boolean) {
  act(() => observer.fire(isIntersecting));
}

beforeEach(() => {
  installIntersectionObserver();
  withReducedMotion(false);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("useInView", () => {
  it("renders readable, unhidden markup before any script runs", () => {
    // What a visitor gets before hydration, and all a visitor with JavaScript
    // disabled will ever get. `pending` in server markup would be a paragraph
    // that never arrives.
    const html = renderToStaticMarkup(<Entering />);

    expect(html).toContain("A tigress crossing the Turia road");
    expect(html, "server markup staged an element script may never un-stage").not.toContain("pending");
    expect(html).not.toMatch(/opacity:\s*0|visibility:\s*hidden|display:\s*none/);
  });

  it("leaves something the visitor is already looking at completely alone", () => {
    // The 4 Aug flicker: settled text painting, then dropping out of view and
    // lifting back. There is nothing to reveal, so nothing may move — and it
    // must stay `rest` permanently, not merely start there.
    const { container } = render(<Entering />);

    expect(stateOf(container)).toBe("rest");
    expect(observers, "an on-screen element was handed to an observer anyway").toHaveLength(0);
  });

  it("stages what is below the fold, then settles it when it arrives", () => {
    placeBelowTheFold();
    const { container } = render(<Entering />);

    // Nothing is staged until the observer has confirmed it for itself; the
    // page is readable in the gap.
    expect(stateOf(container)).toBe("rest");

    report(observers[0], false);
    expect(stateOf(container), "nothing was staged, so the entrance never happens").toBe("pending");

    report(observers[0], true);
    expect(stateOf(container)).toBe("in");
  });

  it("settles outright when the first look already finds it in view", () => {
    // The visitor scrolled here before the browser got round to the first
    // callback. Staging now would fade out something they are looking at.
    placeBelowTheFold();
    const { container } = render(<Entering />);

    report(observers[0], true);
    expect(stateOf(container)).toBe("in");
  });

  it("does not stage anything for a visitor who asked for less motion", () => {
    withReducedMotion(true);
    // Below the fold on purpose: on screen, the hook declines for an unrelated
    // reason and this test would pass without reduced motion doing any work.
    placeBelowTheFold();
    const { container } = render(<Entering />);

    expect(stateOf(container), "reduced motion must be a still state, not a fast one").toBe("rest");
    expect(observers).toHaveLength(0);
  });

  it("never un-settles something once it has arrived", () => {
    // Deliberately does not trust `disconnect()` to have silenced the observer.
    // A settled element re-staged is the "text behind a mask that never lifts"
    // failure, and it must be impossible from the state machine alone.
    placeBelowTheFold();
    const { container } = render(<Entering />);
    report(observers[0], false);
    report(observers[0], true);
    report(observers[0], false);

    expect(stateOf(container), "a settled element was dropped back out of view").toBe("in");
    expect(observers[0].disconnected).toBeGreaterThan(0);
  });

  it("leaves it staged, never settled, while it is still out of view", () => {
    placeBelowTheFold();
    const { container } = render(<Entering />);
    report(observers[0], false);
    report(observers[0], false);

    expect(stateOf(container)).toBe("pending");
  });

  it("stops watching when the element goes away", () => {
    placeBelowTheFold();
    const { unmount } = render(<Entering />);
    unmount();

    expect(observers[0].disconnected, "an unmounted element left an observer running").toBeGreaterThan(0);
  });

  it("waits until an element is meaningfully in view, not for its first pixel", () => {
    placeBelowTheFold();
    render(<Entering />);
    const bottom = observers[0].options?.rootMargin?.split(/\s+/)[2] ?? "";

    expect(Number.parseFloat(bottom), `rootMargin was "${observers[0].options?.rootMargin}"`).toBeLessThan(0);
  });

  it("honours a rootMargin it is given", () => {
    placeBelowTheFold();
    render(<Entering rootMargin="0px 0px -30% 0px" />);

    expect(observers[0].options?.rootMargin).toBe("0px 0px -30% 0px");
  });

  it("leaves the page at rest on a browser with no IntersectionObserver", () => {
    // The failure mode that matters is not "no animation" — it is an element
    // staged to invisible with nothing left that can ever settle it.
    vi.stubGlobal("IntersectionObserver", undefined);
    placeBelowTheFold();
    const { container } = render(<Entering />);

    expect(stateOf(container)).toBe("rest");
  });
});
