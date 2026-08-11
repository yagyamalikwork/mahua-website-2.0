import { describe, expect, it } from "vitest";
import { BOOKING_ERROR_CODES, BookingError } from "./errors";

describe("BookingError", () => {
  it("carries a code a caller can branch on", () => {
    const e = new BookingError("SOLD_OUT", "That room has just gone.");
    expect(e.code).toBe("SOLD_OUT");
    expect(e).toBeInstanceOf(Error);
  });

  it("keeps the provider's own words separately from the message shown to a guest", () => {
    const e = new BookingError("PROVIDER_DOWN", "We could not reach the booking system.", "ECONNREFUSED 10.0.0.1:443");
    expect(e.message).not.toContain("ECONNREFUSED");
    expect(e.providerDetail).toContain("ECONNREFUSED");
  });

  it("lists every code, so a caller can be exhaustive and a mock can produce each", () => {
    expect([...BOOKING_ERROR_CODES]).toEqual([
      "SOLD_OUT",
      "PRICE_CHANGED",
      "QUOTE_EXPIRED",
      "INVALID_DATES",
      "OCCUPANCY",
      "PROVIDER_DOWN",
    ]);
  });
});
