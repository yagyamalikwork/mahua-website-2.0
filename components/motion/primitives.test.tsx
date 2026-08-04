/* Plain <img> is deliberate here — next/image renders a wrapper and its own
   loader, which would put a layer between the test and the thing being tested. */
/* eslint-disable @next/next/no-img-element */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { act, cleanup, render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Enter } from "./Enter";
import { ImageReveal } from "./ImageReveal";
import { SplitLines } from "./SplitLines";
import { StickyScene } from "./StickyScene";

/**
 * The plan asked for these components in prose — "never leave text hidden behind
 * a mask that never lifts" — and prescribed no test for it. That is the exact
 * failure that shipped once already: `Reveal` applied GSAP's "from" state when
 * its ScrollTrigger was created, so anything on screen at hydration went
 * invisible and stayed there. It was caught by eye, late. These are the checks
 * that would have caught it early.
 */

const HEADLINE = "A legacy of conservation woven through generations";

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

/** Text as a reader would see it, with the per-word boxes flattened back out. */
function visibleText(node: HTMLElement) {
  return (node.textContent ?? "").replace(/\s+/g, " ").trim();
}

/**
 * jsdom reports every rect as zeros, so everything looks on-screen-at-mount.
 * Push the element below the fold to exercise the scroll-triggered path, where
 * GSAP applies its "from" state at mount and the words really are displaced.
 */
function placeBelowTheFold() {
  const rect = { top: 5000, bottom: 5400, left: 0, right: 900, width: 900, height: 400, x: 0, y: 5000 };
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    ...rect,
    toJSON: () => rect,
  } as DOMRect);
}

/**
 * Make the headline wrap.
 *
 * jsdom lays nothing out, so every word reports `offsetTop` 0 and a headline
 * measures as a single line — which would let "each line is later than the one
 * above it" pass against a component that never staggered anything, because
 * there would only ever be one line and one delay of zero. So give the words a
 * real wrap: a new line every `perLine` words, in document order.
 *
 * Derived from each word's index rather than from a call counter, so it stays
 * correct however many times the component reads it.
 */
function wrapEvery(perLine: number) {
  vi.spyOn(HTMLElement.prototype, "offsetTop", "get").mockImplementation(function (
    this: HTMLElement,
  ) {
    if (!this.hasAttribute("data-word")) return 0;
    const words = [...(this.closest("h1, h2, h3, p")?.querySelectorAll("[data-word]") ?? [])];
    const index = words.indexOf(this);
    return index < 0 ? 0 : Math.floor(index / perLine) * 60;
  });
}

/** Source of a motion component, for the two budget rules below. */
const MOTION_DIR = path.join(process.cwd(), "components", "motion");
const motionSource = (file: string) => readFileSync(path.join(MOTION_DIR, file), "utf8");

/**
 * jsdom ships no `IntersectionObserver`, and `useInView` deliberately leaves the
 * page at rest on a browser that has none — so without a fake here every
 * entrance assertion below would pass by nothing ever animating at all. That is
 * this project's oldest failure shape wearing a new hat, so: the smallest
 * observer that can deliver the one first-look callback the hook stages on.
 */
let firstLooks: Array<(isIntersecting: boolean) => void> = [];

function installIntersectionObserver() {
  firstLooks = [];
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      private targets: Element[] = [];
      constructor(private cb: IntersectionObserverCallback) {
        firstLooks.push((isIntersecting) =>
          this.cb(
            this.targets.map((target) => ({ target, isIntersecting }) as IntersectionObserverEntry),
            this as unknown as IntersectionObserver,
          ),
        );
      }
      observe(el: Element) {
        this.targets.push(el);
      }
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    },
  );
}

/**
 * The browser delivers observer callbacks outside React; `act` flushes them.
 * An observer always delivers one callback shortly after `observe()`, so this
 * is the real first look and not an invented event.
 */
function look(isIntersecting: boolean) {
  act(() => {
    for (const fire of firstLooks) fire(isIntersecting);
  });
}

beforeEach(() => {
  installIntersectionObserver();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("SplitLines", () => {
  it("renders the headline as ordinary readable text with no JavaScript at all", () => {
    // Server markup is what a visitor gets before hydration, and all a visitor
    // with JavaScript disabled will ever get.
    const html = renderToStaticMarkup(<SplitLines as="h1">{HEADLINE}</SplitLines>);
    const text = html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

    expect(text).toBe(HEADLINE);
    expect(html, "nothing may be hidden in markup that script has to undo").not.toMatch(
      /opacity:\s*0|visibility:\s*hidden|display:\s*none/,
    );
    expect(html, "no transform may displace the words at rest").not.toMatch(/transform:/);
  });

  it("leaves a headline that is already on screen completely alone", () => {
    // Measured in a real browser: animating an on-screen-at-mount headline
    // paints it settled, then drops it out of view and lifts it back — a
    // flicker. There is nothing to reveal, so nothing should move.
    withReducedMotion(false);
    const { container } = render(<SplitLines as="h2">{HEADLINE}</SplitLines>);
    look(false);
    const heading = container.querySelector("h2");

    expect(heading).not.toBeNull();
    expect(visibleText(heading as HTMLElement)).toBe(HEADLINE);
    expect(
      heading?.getAttribute("data-lines-enter"),
      "an on-screen headline was staged anyway",
    ).toBeNull();
  });

  it("does stage the words when the headline is still below the fold", () => {
    // The other half of the rule above: if nothing is ever staged, the
    // reveal is not happening at all and the tests below prove nothing.
    withReducedMotion(false);
    placeBelowTheFold();
    const { container } = render(<SplitLines as="h2">{HEADLINE}</SplitLines>);
    look(false);
    expect(
      container.querySelector("h2")?.getAttribute("data-lines-enter"),
      "no word was staged for its reveal",
    ).toBe("pending");
  });

  it("settles the headline it staged, rather than leaving it behind its mask", () => {
    withReducedMotion(false);
    placeBelowTheFold();
    const { container } = render(<SplitLines as="h2">{HEADLINE}</SplitLines>);
    look(false);
    look(true);
    expect(container.querySelector("h2")?.getAttribute("data-lines-enter")).toBe("in");
  });

  it("leaves the words untransformed when the visitor asked for less motion", () => {
    withReducedMotion(true);
    // Below the fold on purpose: on screen, the component skips the reveal for
    // an unrelated reason, and this test would pass without reduced motion
    // doing any work at all.
    placeBelowTheFold();
    const { container } = render(<SplitLines as="h2">{HEADLINE}</SplitLines>);
    look(false);

    expect(
      container.querySelector("h2")?.getAttribute("data-lines-enter"),
      "reduced motion must be a still state, not a slow one",
    ).toBeNull();
    expect(visibleText(container.querySelector("h2") as HTMLElement)).toBe(HEADLINE);
  });

  it("never writes a displacement of its own, so an unmount cannot strand a word", () => {
    // This replaces "puts the words back if it is unmounted mid-animation".
    // That test guarded a real hazard of the GSAP version: a killed tween could
    // leave inline transforms on the words. The movement is now CSS keyed off
    // an attribute, so the only thing that could strand a word is the component
    // writing a displacement inline — which is the property worth guarding.
    // The one inline style it may write is the per-line delay.
    withReducedMotion(false);
    placeBelowTheFold();
    wrapEvery(3);
    const { container } = render(<SplitLines as="h2">{HEADLINE}</SplitLines>);
    look(false);

    for (const inner of container.querySelectorAll<HTMLElement>("[data-line-inner]")) {
      expect(
        inner.getAttribute("style") ?? "",
        "a word carries an inline displacement no unmount would clear",
      ).not.toMatch(/transform|translate\s*:|scale|opacity|visibility|display/);
    }
  });

  it("gives each line a later delay than the one above it", () => {
    withReducedMotion(false);
    placeBelowTheFold();
    // Without a wrap there is one line, one delay of zero, and nothing to sort.
    wrapEvery(3);
    const { container } = render(<SplitLines as="h2">{HEADLINE}</SplitLines>);
    const delays = [...container.querySelectorAll<HTMLElement>("[data-line-inner]")].map((e) =>
      Number((e.style.getPropertyValue("--enter-delay") || "0s").replace("s", "")),
    );
    expect(delays.length).toBeGreaterThan(0);
    expect(delays).toEqual([...delays].sort((a, b) => a - b));
    expect(Math.max(...delays)).toBeGreaterThan(0);
  });

  it("measures the delays off where the headline really wraps", () => {
    // The hard-won half of the rule above. A stagger computed from an assumed
    // line count is a stagger that is wrong at every viewport but one: the same
    // headline is three lines on a phone and one on a desktop. Same headline,
    // two wraps, two different sets of delays — so the measurement is real.
    withReducedMotion(false);
    placeBelowTheFold();

    wrapEvery(2);
    const narrow = render(<SplitLines as="h2">{HEADLINE}</SplitLines>);
    const narrowDelays = [
      ...narrow.container.querySelectorAll<HTMLElement>("[data-line-inner]"),
    ].map((e) => e.style.getPropertyValue("--enter-delay"));
    cleanup();

    wrapEvery(4);
    const wide = render(<SplitLines as="h2">{HEADLINE}</SplitLines>);
    const wideDelays = [...wide.container.querySelectorAll<HTMLElement>("[data-line-inner]")].map(
      (e) => e.style.getPropertyValue("--enter-delay"),
    );

    expect(new Set(narrowDelays).size, "a two-word wrap produced one line").toBeGreaterThan(
      new Set(wideDelays).size,
    );
  });

  it("carries every delay with a unit on it", () => {
    // `--enter-delay: 0.09` with no unit is an invalid `transition-delay`, which
    // CSS drops silently — the whole headline would then arrive at once and
    // every assertion above would still pass.
    withReducedMotion(false);
    placeBelowTheFold();
    wrapEvery(3);
    const { container } = render(<SplitLines as="h2">{HEADLINE}</SplitLines>);
    for (const inner of container.querySelectorAll<HTMLElement>("[data-line-inner]")) {
      expect(inner.style.getPropertyValue("--enter-delay")).toMatch(/^\d+(\.\d+)?s$/);
    }
  });

  it("renders the tag it was asked for", () => {
    withReducedMotion(false);
    const { container } = render(<SplitLines as="p">{HEADLINE}</SplitLines>);
    expect(container.querySelector("p")).not.toBeNull();
    expect(container.querySelector("h2")).toBeNull();
  });
});

describe("the JavaScript budget", () => {
  it("keeps GSAP out of everything that is only an entrance", () => {
    // The budget rule this task exists to enforce: a tween library may only be
    // imported by something that scrubs. An entrance that reaches for GSAP is
    // 115 KB paying for a transition CSS already does.
    const mayScrub = new Set(["Parallax.tsx", "SmoothScroll.tsx", "PinnedCollage.tsx"]);
    for (const f of readdirSync(MOTION_DIR).filter(
      (n) => /\.tsx?$/.test(n) && !n.includes(".test."),
    )) {
      if (mayScrub.has(f)) continue;
      expect(motionSource(f), `${f} imports gsap but does not scrub`).not.toMatch(/from "gsap/);
    }
  });

  it("does not put GSAP in the first load", () => {
    // Every scrubbed effect on this page is below the fold, so the library has
    // no business blocking first paint. A static import puts it there.
    // `scrub.ts` is in the list because it is where the dynamic import lives:
    // if the deferral is ever "simplified" back to a static import, this is the
    // file it would happen in.
    for (const f of ["Parallax.tsx", "SmoothScroll.tsx", "scrub.ts"]) {
      expect(motionSource(f), `${f} imports gsap statically`).not.toMatch(/^import .* from "gsap/m);
    }
  });

  it("still loads GSAP somewhere, or the scrubbing is gone rather than deferred", () => {
    // The failure mode of the test above, taken to its conclusion: deleting the
    // import passes it. Parallax is mounted in ten places and has to keep
    // moving, so the library must still be reachable — dynamically.
    expect(motionSource("scrub.ts")).toMatch(/import\("gsap"\)/);
    expect(motionSource("scrub.ts")).toMatch(/import\("gsap\/ScrollTrigger"\)/);
  });
});

describe("Enter", () => {
  it("renders its children at rest with no JavaScript", () => {
    const html = renderToStaticMarkup(<Enter>visible</Enter>);
    expect(html).toContain("visible");
    expect(html, "nothing may be staged in markup that script must undo").not.toMatch(
      /data-enter="pending"|opacity:\s*0/,
    );
  });

  it("leaves an element that is already on screen alone", () => {
    // The 4 Aug flicker: settled text painting, then dropping out of view and
    // lifting back. There is nothing to reveal, so nothing may move.
    withReducedMotion(false);
    const { container } = render(<Enter>visible</Enter>);
    look(false);
    expect(container.firstElementChild?.getAttribute("data-enter")).toBeNull();
  });

  it("stages an element that is still below the fold", () => {
    // The other half of the rule above. If nothing is ever staged, there is no
    // entrance at all and the tests either side of this one prove nothing.
    withReducedMotion(false);
    placeBelowTheFold();
    const { container } = render(<Enter>visible</Enter>);
    look(false);
    expect(container.firstElementChild?.getAttribute("data-enter")).toBe("pending");
  });

  it("settles what it staged, rather than leaving it invisible", () => {
    withReducedMotion(false);
    placeBelowTheFold();
    const { container } = render(<Enter>visible</Enter>);
    look(false);
    look(true);
    expect(container.firstElementChild?.getAttribute("data-enter")).toBe("in");
  });

  it("does not stage anything when the visitor asked for less motion", () => {
    // Below the fold on purpose: on screen, the hook declines for an unrelated
    // reason and this would pass without reduced motion doing any work.
    withReducedMotion(true);
    placeBelowTheFold();
    const { container } = render(<Enter>visible</Enter>);
    look(false);
    expect(container.firstElementChild?.getAttribute("data-enter")).toBeNull();
  });

  it("carries a stagger as a delay with a unit on it", () => {
    // Whether the delay is *felt* is a browser question, not a jsdom one. What
    // is worth catching here is the silent version: `--enter-delay: 0.24` with
    // no unit is an invalid `transition-delay`, which CSS drops, which means a
    // whole group arrives at once and nothing in the suite notices.
    withReducedMotion(false);
    const { container } = render(<Enter delay={0.24}>visible</Enter>);
    const style = (container.firstElementChild as HTMLElement).style;
    expect(style.getPropertyValue("--enter-delay")).toBe("0.24s");
  });
});

describe("ImageReveal", () => {
  it("shows the photograph, not a cream panel, with no JavaScript", () => {
    const html = renderToStaticMarkup(
      <ImageReveal>
        <img src="/media/tiger-golden-grass-1440.jpg" alt="A tiger in golden grass" />
      </ImageReveal>,
    );
    // The mask must be collapsed in the markup. `scale-y-0` is the Tailwind
    // class that does it; if this is ever inverted to a covered-at-rest mask,
    // every photograph on the page goes blank without script.
    expect(html).toMatch(/data-image-mask[^>]*class="[^"]*scale-y-0/);
    expect(html).toContain("A tiger in golden grass");
    expect(html, "server markup staged a photograph script may never un-stage").not.toContain(
      "data-image-enter",
    );
  });

  it("hides the mask from assistive technology", () => {
    const { container } = render(
      <ImageReveal>
        <img src="/media/tiger-golden-grass-1440.jpg" alt="A tiger in golden grass" />
      </ImageReveal>,
    );
    expect(container.querySelector("[data-image-mask]")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("lowers the mask over a photograph below the fold, then wipes it off", () => {
    withReducedMotion(false);
    placeBelowTheFold();
    const { container } = render(
      <ImageReveal>
        <img src="/media/tiger-golden-grass-1440.jpg" alt="A tiger in golden grass" />
      </ImageReveal>,
    );
    look(false);
    expect(container.firstElementChild?.getAttribute("data-image-enter")).toBe("pending");
    look(true);
    expect(
      container.firstElementChild?.getAttribute("data-image-enter"),
      "a mask was raised over a photograph and never lowered again",
    ).toBe("in");
  });

  it("leaves a photograph the visitor is already looking at alone", () => {
    withReducedMotion(false);
    const { container } = render(
      <ImageReveal>
        <img src="/media/tiger-golden-grass-1440.jpg" alt="A tiger in golden grass" />
      </ImageReveal>,
    );
    look(false);
    expect(container.firstElementChild?.getAttribute("data-image-enter")).toBeNull();
  });

  it("is a still photograph under reduced motion, not a fast one", () => {
    withReducedMotion(true);
    placeBelowTheFold();
    const { container } = render(
      <ImageReveal>
        <img src="/media/tiger-golden-grass-1440.jpg" alt="A tiger in golden grass" />
      </ImageReveal>,
    );
    look(false);
    expect(container.firstElementChild?.getAttribute("data-image-enter")).toBeNull();
  });

  it("never stages the photograph at all when told it is static", () => {
    withReducedMotion(false);
    // Below the fold with motion allowed is the one arrangement that *does*
    // stage a photograph — "lowers the mask over a photograph below the fold"
    // above is the proof. So a pass here is `static` opting out, and not the
    // circumstances declining to animate anything in the first place.
    placeBelowTheFold();
    const { container } = render(
      <ImageReveal static>
        <img src="/media/reception-path-dusk-1440.jpg" alt="A lantern-lit path at dusk" />
      </ImageReveal>,
    );
    look(false);
    look(true);

    // The LCP escape hatch: the hero is never handed to the observer, so no
    // state is ever written and nothing can be charged to the metric.
    expect(container.firstElementChild?.getAttribute("data-image-enter")).toBeNull();
    const inner = container.querySelector<HTMLElement>("[data-image-inner]");
    expect(inner?.style.transform).toBe("");
    expect(inner?.style.scale).toBe("");
  });
});

describe("StickyScene", () => {
  it("clamps the scroll it reserves", () => {
    for (const [asked, expected] of [
      [9, 3],
      [0, 1],
      [-4, 1],
      [2, 2],
    ] as const) {
      const html = renderToStaticMarkup(<StickyScene screens={asked}>scene</StickyScene>);
      expect(html, `asked for ${asked} screens`).toContain(`--sticky-screens:${expected}`);
    }
  });
});
