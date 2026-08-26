import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { VANN_BAR, VANN_CHAPTERS, VANN_COPY } from "@/content/mahua-vann";
import { PropertyPage } from "./PropertyPage";

// SiteHeader renders SiteMenu, which reads the current route — mirrors
// SiteHeader.test.tsx's own mock, needed here because PropertyPage mounts
// SiteHeader for real rather than standing in for it.
vi.mock("next/navigation", () => ({ usePathname: () => "/mahua-vann" }));

const props = {
  copy: VANN_COPY,
  scrim: {},
  bookHref: "https://asiatech.in/booking_engine/index3?token=ODM1MQ==",
  bar: VANN_BAR,
  siblingHref: "/mahua-tola",
};

describe("PropertyPage", () => {
  it("stands the map on the same cream as the chapter above, and does not advance the alternation", () => {
    // The client's ruling: the map "is an extention to the first sections on
    // both the pages" — the site's existing meaning for that phrase (19 Aug
    // 2026, `04 · Mahua Philosophy`) is the same cream and no band between.
    // A continuing chapter must not itself consume a turn of the cream
    // alternation, or every chapter beneath it silently flips surface.
    const { container } = render(<PropertyPage chapters={VANN_CHAPTERS} {...props} />);
    const forest = container.querySelector("#vann-forest");
    const map = container.querySelector("#vann-where");
    const rooms = container.querySelector("#vann-rooms");

    // The map continues the chapter above it…
    expect(map?.getAttribute("data-surface")).toBe(forest?.getAttribute("data-surface"));
    // …and the chapter below still steps off it, which it would not if the
    // continuing chapter had consumed a turn of the cycle.
    expect(rooms?.getAttribute("data-surface")).not.toBe(map?.getAttribute("data-surface"));
  });
});
