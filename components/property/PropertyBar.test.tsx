import { act } from "react";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PropertyBar } from "./PropertyBar";

const props = {
  name: "Mahua Vann · Pench",
  bookHref: "https://asiatech.in/booking_engine/index3?token=ODM1MQ==",
  bookLabel: "Book",
  contact: {
    phone: { label: "Speak to us", value: "+91 87448 67278", href: "tel:+918744867278" },
    email: { label: "Write", value: "sales@mahuaresorts.com", href: "mailto:sales@mahuaresorts.com" },
    address: { label: "Find us", value: "Village Kuppitola, Khawasa, Madhya Pradesh 480881" },
  },
  heroId: "vann-hero",
  invitationId: "vann-invitation",
  footerId: "site-footer",
};

describe("PropertyBar", () => {
  it("does not exist until script says so", () => {
    // Fail towards absent — the welcome screen's contract (DECISIONS.md §14),
    // and the reason the same rule binds here: this is fixed chrome over the
    // page's content, so with no JavaScript, a thrown error, or a browser with
    // no IntersectionObserver it must be NOT THERE rather than permanently
    // parked over the copy.
    vi.stubGlobal("IntersectionObserver", undefined);
    const { container } = render(<PropertyBar {...props} />);
    expect(container.querySelector("[data-property-bar]")).toBeNull();
    vi.unstubAllGlobals();
  });

  it("carries the property's name, the booking and the phone once shown", () => {
    const { getByText, container } = render(<PropertyBar {...props} shown />);
    expect(getByText("Mahua Vann · Pench")).toBeTruthy();
    expect(getByText("Book")).toBeTruthy();
    expect(container.querySelector("a[href='tel:+918744867278']")).not.toBeNull();
  });

  it("steps aside once the closing invitation is on screen", () => {
    // The ask must never be on screen twice at once. Driven here through the
    // observer callbacks rather than by scrolling, because jsdom has no
    // layout — the browser half of this is Task 15's own check.
    const observers: Array<(entries: { isIntersecting: boolean }[]) => void> = [];
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
          observers.push(cb);
        }
        observe() {}
        disconnect() {}
      },
    );
    // All three targets must exist for the component to observe them.
    document.body.innerHTML = `<div id="vann-hero"></div><div id="vann-invitation"></div><div id="site-footer"></div>`;
    const { container } = render(<PropertyBar {...props} />);

    // Hero has left the viewport: the bar arrives.
    act(() => observers[0]([{ isIntersecting: false }]));
    expect(container.querySelector("[data-property-bar]")).not.toBeNull();

    // The invitation comes into view: the bar leaves again.
    act(() => observers[1]([{ isIntersecting: true }]));
    expect(container.querySelector("[data-property-bar]")).toBeNull();
  });

  it("stays away while the footer is on screen", () => {
    // Without this, the bar steps aside at the invitation and then REAPPEARS
    // over the directory footer — a Book bar floating over the directory's
    // own contact details, doubling the ask the invitation just made quietly.
    const observers: Array<(entries: { isIntersecting: boolean }[]) => void> = [];
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
          observers.push(cb);
        }
        observe() {}
        disconnect() {}
      },
    );
    document.body.innerHTML = `<div id="vann-hero"></div><div id="vann-invitation"></div><div id="site-footer"></div>`;
    const { container } = render(<PropertyBar {...props} footerId="site-footer" />);
    // observers: [hero, invitation, footer] in mount order.
    act(() => observers[0]([{ isIntersecting: false }])); // past the hero — bar arrives
    expect(container.querySelector("[data-property-bar]")).not.toBeNull();
    act(() => observers[2]([{ isIntersecting: true }])); // footer on screen — bar leaves
    expect(container.querySelector("[data-property-bar]")).toBeNull();
    act(() => observers[2]([{ isIntersecting: false }])); // scrolled back up — bar returns
    expect(container.querySelector("[data-property-bar]")).not.toBeNull();
  });
});
