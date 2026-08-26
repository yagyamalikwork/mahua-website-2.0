import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ElfsightLoader } from "@/components/ui/ElfsightLoader";
import { ELFSIGHT_SCRIPT } from "@/lib/elfsight";

/** jsdom has no IntersectionObserver. This one lets a test fire it by hand. */
function stubObserver() {
  const instances: { cb: IntersectionObserverCallback; disconnect: () => void }[] = [];
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      disconnect = vi.fn();
      unobserve = vi.fn();
      observe = vi.fn();
      constructor(cb: IntersectionObserverCallback) {
        instances.push({ cb, disconnect: this.disconnect });
      }
    },
  );
  return instances;
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.querySelectorAll(`script[src="${ELFSIGHT_SCRIPT}"]`).forEach((s) => s.remove());
});

describe("ElfsightLoader", () => {
  it("does not load 533 KB of vendor JavaScript before a visitor comes near it", () => {
    stubObserver();
    render(<ElfsightLoader />);
    expect(document.querySelector(`script[src="${ELFSIGHT_SCRIPT}"]`)).toBeNull();
  });

  it("loads the platform once the section approaches the viewport", async () => {
    const observers = stubObserver();
    render(<ElfsightLoader />);
    observers[0].cb([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    await waitFor(() => {
      expect(document.querySelector(`script[src="${ELFSIGHT_SCRIPT}"]`)).not.toBeNull();
    });
  });

  it("loads it once, not once per widget — two on a page must not fetch it twice", async () => {
    const observers = stubObserver();
    render(<><ElfsightLoader /><ElfsightLoader /></>);
    observers.forEach((o) =>
      o.cb([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver),
    );
    await waitFor(() => {
      expect(document.querySelectorAll(`script[src="${ELFSIGHT_SCRIPT}"]`)).toHaveLength(1);
    });
  });

  it("stops observing once it has fired", async () => {
    const observers = stubObserver();
    render(<ElfsightLoader />);
    observers[0].cb([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    await waitFor(() => expect(observers[0].disconnect).toHaveBeenCalled());
  });
});
