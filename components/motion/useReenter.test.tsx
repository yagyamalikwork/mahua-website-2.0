import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useReenter } from "./useReenter";

/**
 * The hook that makes the tiger stir when you come back to it.
 *
 * jsdom has no `IntersectionObserver`, so one is installed here that hands back
 * its callback — which is also the only way to drive "left the viewport, came
 * back" deterministically.
 */
let fire: ((entries: { isIntersecting: boolean }[]) => void) | null = null;
let disconnected = 0;

beforeEach(() => {
  fire = null;
  disconnected = 0;
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
        fire = cb;
      }
      observe() {}
      disconnect() {
        disconnected += 1;
      }
    },
  );
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }));
});

afterEach(() => vi.unstubAllGlobals());

function Probe({ onReenter }: { onReenter: () => void }) {
  const ref = useReenter<HTMLDivElement>(onReenter);
  return <div ref={ref} />;
}

describe("useReenter", () => {
  it("does not fire on the first entry", () => {
    // The first arrival is the tiger being drawn. `InkStage` owns that; a stir on
    // top of it would restart the living phase before the ink had finished.
    const onReenter = vi.fn();
    render(<Probe onReenter={onReenter} />);
    fire!([{ isIntersecting: true }]);
    expect(onReenter).not.toHaveBeenCalled();
  });

  it("fires on every entry after the element has left", () => {
    const onReenter = vi.fn();
    render(<Probe onReenter={onReenter} />);
    fire!([{ isIntersecting: true }]);
    fire!([{ isIntersecting: false }]);
    fire!([{ isIntersecting: true }]);
    expect(onReenter).toHaveBeenCalledTimes(1);
    fire!([{ isIntersecting: false }]);
    fire!([{ isIntersecting: true }]);
    expect(onReenter).toHaveBeenCalledTimes(2);
  });

  it("does not fire twice without leaving in between", () => {
    // An observer can deliver repeat callbacks. Without the latch this would
    // restart the living phase every time one arrived, which is a tiger that
    // never dozes.
    const onReenter = vi.fn();
    render(<Probe onReenter={onReenter} />);
    fire!([{ isIntersecting: true }]);
    fire!([{ isIntersecting: false }]);
    fire!([{ isIntersecting: true }]);
    fire!([{ isIntersecting: true }]);
    expect(onReenter).toHaveBeenCalledTimes(1);
  });

  it("observes nothing at all under reduced motion", () => {
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: true, media: q, addEventListener() {}, removeEventListener() {} }));
    const onReenter = vi.fn();
    render(<Probe onReenter={onReenter} />);
    // No observer was even constructed, so there is nothing to fire.
    expect(fire).toBeNull();
    expect(onReenter).not.toHaveBeenCalled();
  });

  it("disconnects on unmount", () => {
    const { unmount } = render(<Probe onReenter={() => {}} />);
    unmount();
    expect(disconnected).toBe(1);
  });
});
