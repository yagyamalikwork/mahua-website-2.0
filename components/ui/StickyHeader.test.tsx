import { act, cleanup, render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StickyHeader } from "./StickyHeader";

/**
 * The header that stays, and the one failure it must never produce.
 *
 * A `fixed` bar that cannot learn the photograph beneath it has run out is cream
 * type on a cream page — not "unanimated", *invisible*, for the whole length of
 * the page. Every check here is about what a visitor ends up looking at rather
 * than about an observer having been constructed, and each was run against a
 * deliberately broken component before being kept.
 */

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
        const record: FakeObserver = {
          options,
          targets: [],
          disconnected: 0,
          fire: (isIntersecting) =>
            this.cb(
              record.targets.map((target) => ({ target, isIntersecting }) as IntersectionObserverEntry),
              this as unknown as IntersectionObserver,
            ),
        };
        observers.push(record);
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

/** jsdom has no ResizeObserver, and the component must not need one. */
function installResizeObserver() {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(private cb: ResizeObserverCallback) {}
      observe() {
        this.cb([], this as unknown as ResizeObserver);
      }
      unobserve() {}
      disconnect() {}
    },
  );
}

/** The hero the bar watches. Without it in the document there is nothing to observe. */
function withHero() {
  const hero = document.createElement("section");
  hero.id = "arrival";
  document.body.append(hero);
  return hero;
}

function Header({ heroId = "arrival" }: { heroId?: string } = {}) {
  return (
    <StickyHeader heroId={heroId}>
      <span data-testid="row">Menu</span>
    </StickyHeader>
  );
}

function barOf(container: HTMLElement) {
  return container.querySelector("[data-site-header]") as HTMLElement;
}

/** The browser delivers observer callbacks outside React; `act` flushes them. */
function report(observer: FakeObserver, isIntersecting: boolean) {
  act(() => observer.fire(isIntersecting));
}

beforeEach(() => {
  installIntersectionObserver();
  installResizeObserver();
});

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("StickyHeader", () => {
  it("renders a readable, un-fixed bar before any script runs", () => {
    // What a visitor gets before hydration and all a visitor with JavaScript
    // disabled will ever get. `fixed` in server markup would be a cream-on-cream
    // header for the whole page, because nothing would ever tell it to change.
    const html = renderToStaticMarkup(<Header />);

    expect(html).toContain("Menu");
    expect(html, "the server shipped a bar nothing can ever un-stick").toContain("absolute");
    expect(html).not.toContain("fixed");
    expect(html, "the server shipped the scrolled state").not.toContain("data-scrolled");
  });

  it("follows the visitor only once an observer has reported a state", () => {
    withHero();
    const { container } = render(<Header />);

    // Attached, but nothing has been reported yet: still exactly where it was.
    expect(barOf(container).className).toContain("absolute");

    report(observers[0], true);
    expect(barOf(container).className).toContain("fixed");
    expect(barOf(container).className).not.toContain("absolute");
  });

  it("gains the scrolled state when the hero leaves, and gives it back", () => {
    withHero();
    const { container } = render(<Header />);

    report(observers[0], true);
    expect(barOf(container).hasAttribute("data-scrolled")).toBe(false);

    report(observers[0], false);
    expect(barOf(container).hasAttribute("data-scrolled"), "the bar never went cream").toBe(true);

    // Scrolling back up. A one-way flag here would leave a cream bar sitting on
    // the hero photograph for the rest of the visit.
    report(observers[0], true);
    expect(barOf(container).hasAttribute("data-scrolled")).toBe(false);
  });

  it("never animates into the first state it paints", async () => {
    // A reload part-way down the page renders `static`, then learns from the
    // observer that it is `scrolled`. Animating that is 0.9s of a cream bar
    // fading in over a cream chapter while the type fades out of cream — the
    // illegible window HERO_TAIL keeps over the photograph, arriving by a route
    // no rootMargin can see. `app/globals.css` hangs both transitions off
    // `data-settled`, so its absence is what makes the first state instant.
    withHero();
    const { container } = render(<Header />);

    report(observers[0], false);
    expect(barOf(container).hasAttribute("data-scrolled")).toBe(true);
    expect(
      barOf(container).hasAttribute("data-settled"),
      "the transition was live for the very first state, so it faded into it",
    ).toBe(false);

    // **This asserts that the gate is deferred, not that it is deferred by
    // enough.** jsdom never paints, so collapsing the component's two frames to
    // one still passes here — verified by doing it. The frame count is a browser
    // question and `scripts/check_header.mjs`'s mid-page reload owns it: with a
    // single frame it measures the bar at 31% cream and the wordmark at
    // rgb(206,189,160) 320ms into a reload, and fails. What is guarded here is
    // that the attribute exists, starts absent, and arrives later.
    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(
      barOf(container).hasAttribute("data-settled"),
      "the transition never switched on, so no later change will ever animate",
    ).toBe(true);
  });

  it("stays where it was on a browser with no IntersectionObserver", () => {
    // The failure that matters is not "the bar does not follow" — it is a bar
    // that follows with no way of ever being told to change colour.
    vi.stubGlobal("IntersectionObserver", undefined);
    withHero();
    const { container } = render(<Header />);

    expect(barOf(container).className).toContain("absolute");
    expect(barOf(container).hasAttribute("data-scrolled")).toBe(false);
  });

  it("stays where it was when the chapter it watches is not in the document", () => {
    // `app/page.tsx` composes this beside a chapter list it does not control.
    const { container } = render(<Header heroId="not-a-chapter" />);

    expect(observers, "an observer was pointed at nothing").toHaveLength(0);
    expect(barOf(container).className).toContain("absolute");
  });

  it("publishes its own height for anchors, and only while it is following", () => {
    withHero();
    // jsdom reports every box as zero; a real height proves the value is read
    // from the element rather than written from a constant.
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
      height: 77, width: 1440, top: 0, left: 0, right: 1440, bottom: 77, x: 0, y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    const { unmount } = render(<Header />);
    expect(document.documentElement.style.getPropertyValue("--header-height")).toBe("77px");

    // A header that is not following must not offset anchors by anything.
    unmount();
    expect(document.documentElement.style.getPropertyValue("--header-height")).toBe("");
  });

  it("leaves nothing observing the page once it goes away", () => {
    withHero();
    const { unmount } = render(<Header />);
    unmount();

    expect(observers[0].disconnected).toBeGreaterThan(0);
  });

  it("starts changing while the hero is still on screen", () => {
    // The two legible states are cream type on a photograph and dark type on a
    // cream bar, and every frame of the crossfade between them is worse than
    // either end. So the change has to begin with photograph still under the
    // bar: a negative top rootMargin, never zero.
    withHero();
    render(<Header />);
    const top = observers[0].options?.rootMargin?.split(/\s+/)[0] ?? "";

    expect(
      Number.parseFloat(top),
      `rootMargin was "${observers[0].options?.rootMargin}" — the fade would start over cream`,
    ).toBeLessThan(0);
  });
});
