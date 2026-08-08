/* Plain <img> is deliberate here — next/image renders a wrapper and its own
   loader, which would put a layer between the test and the thing being tested. */
/* eslint-disable @next/next/no-img-element */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { act, cleanup, render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PARALLAX_MAX, STICKY_SCREENS_MAX } from "@/lib/motion";
import { chapter } from "@/content/chapters";
import { Enter } from "./Enter";
import { ImageReveal } from "./ImageReveal";
import { COLLAGE_RATES, COLLAGE_SCREENS, PinnedCollage } from "./PinnedCollage";
import * as scrub from "./scrub";
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

/**
 * jsdom's own `matchMedia` answers `false` to every query it is ever asked,
 * which is a fine default for reduced motion and useless for anything that
 * decides on viewport size — `CollageStage` asks two questions, not one, and a
 * stub that can only answer the first would let its pin tests pass by the pin
 * never being on.
 */
function withMedia({ reducedMotion = false, pinnable = false } = {}) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("prefers-reduced-motion") ? reducedMotion : pinnable,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

function withReducedMotion(reduce: boolean) {
  withMedia({ reducedMotion: reduce });
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

  it("has no static gsap import — a smoke check, NOT the guarantee", () => {
    // **Read this before trusting it.** This greps the source for a static
    // import. That is a *mechanism*, and the mechanism being right does not mean
    // the bytes are. Widening `whenNear`'s `rootMargin` in `scrub.ts` to `4000%`
    // — a plausible "prefetch a little earlier" edit — puts both GSAP chunks
    // back into the first load while this test, `tsc`, `build` and `lint` all
    // stay green. A reviewer demonstrated exactly that on 5 Aug 2026.
    //
    // **The guarantee is `scripts/measure_js_budget.mjs`**, which loads the real
    // page, samples what the browser transferred before any scroll, and exits 1
    // if a GSAP-carrying chunk is among it. Keep this test for the fast, free
    // catch of the obvious regression; do not let it stand in for the rig.
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

describe("PinnedCollage", () => {
  const ROOTED = chapter("rooted");
  const HEADING = "Rooted like the mahua";

  /** The scene, if there is one. `null` means nothing was pinned. */
  const sceneIn = (container: HTMLElement) =>
    container.querySelector<HTMLElement>(".sticky-scene");

  it("never pins for longer than the clamp allows", () => {
    // A pin is the one construct left that can size a section from a number
    // rather than from its content — the thing that made the rejected build
    // sparse. STICKY_SCREENS_MAX exists for this and must bind here too.
    withMedia({ pinnable: true });
    const { container } = render(<PinnedCollage chapter={ROOTED} />);
    const screens = Number(sceneIn(container)?.style.getPropertyValue("--sticky-screens"));
    expect(screens).toBeGreaterThanOrEqual(1);
    expect(screens).toBeLessThanOrEqual(STICKY_SCREENS_MAX);
    expect(screens, "the component asked for a number the clamp then changed").toBe(
      COLLAGE_SCREENS,
    );
  });

  it("renders every photograph and the headline with no JavaScript", () => {
    // Server markup is what a visitor gets before hydration, and all a visitor
    // with JavaScript disabled will ever get.
    const html = renderToStaticMarkup(<PinnedCollage chapter={ROOTED} />);
    for (const id of ROOTED.media) expect(html, `${id} is missing`).toContain(id);
    expect(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")).toContain(HEADING);
    expect(html, "nothing may be hidden in markup that script has to undo").not.toMatch(
      /opacity:\s*0|visibility:\s*hidden|display:\s*none/,
    );
  });

  it("reserves no scroll at all with no JavaScript", () => {
    // The other half of the rule above, and the one that costs screens rather
    // than pixels: `position: sticky` is pure CSS and would pin perfectly well
    // without a line of script — over a composition that, with no script, can
    // never move. That is two paid-for empty screens, which is the exact thing
    // `StickyScene` was written not to be.
    const html = renderToStaticMarkup(<PinnedCollage chapter={ROOTED} />);
    expect(html, "the server markup pinned a scene nothing can advance").not.toContain(
      "sticky-scene",
    );
  });

  it("drifts each photograph at its own rate, all within the parallax cap", () => {
    // "Each moving at slightly different speeds" is the effect. Identical rates
    // read as one sliding sheet; anything past the cap is movement rather than
    // depth (spec section 4.3 law 3).
    const rates = COLLAGE_RATES;
    expect(new Set(rates).size, "every photograph drifts at the same rate").toBe(rates.length);
    for (const r of rates) expect(Math.abs(r)).toBeLessThanOrEqual(PARALLAX_MAX);
  });

  it("puts one rate on each photograph, where a browser can read it back", () => {
    // `COLLAGE_RATES` being three different numbers is worth nothing if the
    // markup hands the same one to all three, or hands them to nothing at all.
    // The attribute is also what `scripts/check_pinned_collage.mjs` finds these
    // elements by in a real browser, so this is the unit half of a measurement
    // that finishes there.
    withMedia({ pinnable: true });
    const { container } = render(<PinnedCollage chapter={ROOTED} />);
    const written = [...container.querySelectorAll<HTMLElement>("[data-drift]")].map((el) =>
      Number(el.dataset.drift),
    );
    expect(written).toEqual([...COLLAGE_RATES]);
  });

  it("removes the pin *and* the scroll it reserved under reduced motion", () => {
    // Not "the photographs hold still". A visitor who asked for less motion must
    // not have to travel through two empty screens to reach the next chapter, so
    // there must be no scene in the document at all — not a scene left in place
    // for CSS to flatten afterwards.
    withMedia({ reducedMotion: true, pinnable: true });
    const { container } = render(<PinnedCollage chapter={ROOTED} />);
    expect(sceneIn(container)).toBeNull();
    expect(container.querySelectorAll("[data-drift]")).toHaveLength(0);
    // And the chapter is all still there.
    for (const id of ROOTED.media) expect(container.innerHTML).toContain(id);
  });

  it("does not pin a viewport the frozen composition would not fit", () => {
    // The scene is exactly one screen and does not scroll inside itself, so a
    // narrow or short window would have the chapter paint over the one below it.
    withMedia({ pinnable: false });
    const { container } = render(<PinnedCollage chapter={ROOTED} />);
    expect(sceneIn(container)).toBeNull();
    expect(container.innerHTML, "the chapter vanished with the pin").toContain(ROOTED.media[0]);
  });

  it("gives the reserved scroll back when the tween library fails to load", async () => {
    // The Important finding on this task's review. `scrub.ts` memoises its
    // rejected promise, so a chunk that fails once has failed for the visit —
    // and a pin that survives that is 1.9 screens of a composition in which
    // nothing can move. The browser half of this aborts both GSAP chunks at the
    // network and reads the section's height back
    // (`scripts/check_pinned_collage.mjs`); this is the fast half.
    withMedia({ pinnable: true });
    vi.spyOn(scrub, "loadScrubTools").mockRejectedValue(new Error("chunk failed"));

    const { container } = render(<PinnedCollage chapter={ROOTED} />);
    expect(sceneIn(container), "the scene was never pinned, so this proves nothing").not.toBeNull();

    // `whenNear` fires on the observer's first look — but since 9 Aug 2026 it
    // also waits for the visitor to have scrolled at all (the property pages'
    // first scrub target sits inside the observer's margin at load, and the
    // library must not be fetched before the first scrolled pixel). A real
    // visitor near this scene has scrolled to get there; the test does the
    // same. The rejection then has to settle before React re-renders.
    look(true);
    window.dispatchEvent(new Event("scroll"));
    await act(async () => {
      await Promise.resolve();
    });

    expect(sceneIn(container), "a failed scrub left the scene pinned").toBeNull();
    // And the chapter is still all there, on the ordinary composition.
    for (const id of ROOTED.media) expect(container.innerHTML).toContain(id);
  });

  it("does not pin on a browser with no IntersectionObserver", () => {
    // `whenNear` is how the tween library is fetched, and it declines without an
    // observer — so a pin here would hold a still composition for three screens.
    withMedia({ pinnable: true });
    vi.stubGlobal("IntersectionObserver", undefined);
    const { container } = render(<PinnedCollage chapter={ROOTED} />);
    expect(sceneIn(container)).toBeNull();
  });

  it("keeps the chapter's own photographs and heading inside the pin", () => {
    // The pinned tree is a second composition, written out by hand, and the way
    // it goes wrong is quietly: one photograph dropped to make the arithmetic
    // fit a screen. Same three, same heading, pinned or not.
    withMedia({ pinnable: true });
    const { container } = render(<PinnedCollage chapter={ROOTED} />);
    expect(sceneIn(container)).not.toBeNull();
    for (const id of ROOTED.media) expect(container.innerHTML, `${id} is missing`).toContain(id);
    expect(visibleText(container)).toContain(HEADING);
  });
});
