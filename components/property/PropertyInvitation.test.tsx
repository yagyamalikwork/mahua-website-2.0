import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PropertyInvitation, type PropertyInvitationCopy } from "./PropertyInvitation";

const COPY: PropertyInvitationCopy = {
  heading: { text: "Come and see it", dim: "see" },
  line: "Rooms from the river, and the gate five minutes away.",
  bookLabel: "Book Mahua Vann",
  contact: {
    phone: { label: "Speak to us", value: "+91 87448 67278", href: "tel:+918744867278" },
    email: { label: "Write", value: "sales@mahuaresorts.com", href: "mailto:sales@mahuaresorts.com" },
    address: { label: "Find us", value: "Village Kuppitola, Khawasa, Madhya Pradesh 480881" },
  },
  sibling: { mediaId: "tola-candlelit-dinner", label: "Looking for Tadoba instead? Mahua Tola" },
};

const props = {
  chapter: { id: "vann-invitation", shape: "invitation", media: ["tola-candlelit-dinner"] } as const,
  copy: COPY,
  bookHref: "https://asiatech.in/booking_engine/index3?token=ODM1MQ==",
  siblingHref: "/mahua-tola",
};

describe("PropertyInvitation", () => {
  it("carries a photograph, so it is not a second quiet screen", () => {
    // On Mahua Vann this sits directly after the type-led press band. Two
    // quiet screens in a row breaks the rhythm rule (non-negotiable #10),
    // which binds independently of the no-repeated-shape rule.
    const { container } = render(<PropertyInvitation {...props} />);
    expect(container.querySelectorAll("picture, img").length).toBeGreaterThan(0);
  });

  it("offers the booking and a way to reach a person", () => {
    const { getByText, container } = render(<PropertyInvitation {...props} />);
    expect(getByText("Book Mahua Vann")).toBeTruthy();
    // A real tel: link, not type that looks like a number — the whole reason
    // the client chose details over a form is that details cannot fail.
    expect(container.querySelector("a[href='tel:+918744867278']")).not.toBeNull();
  });

  it("sends Book out to the real engine, in a new tab", () => {
    const { container } = render(<PropertyInvitation {...props} />);
    const book = container.querySelector("a[href^='https://asiatech.in']");
    expect(book?.getAttribute("target")).toBe("_blank");
  });
});
