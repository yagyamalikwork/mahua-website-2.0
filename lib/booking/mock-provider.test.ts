import { describe, expect, it } from "vitest";
import { BOOKING_ERROR_CODES, BookingError } from "./errors";
import { MockProvider } from "./mock-provider";
import { stayDate } from "./types";

const QUERY = {
  property: "mahua-tola" as const,
  checkIn: stayDate("2026-11-14"),
  checkOut: stayDate("2026-11-16"),
  rooms: [{ adults: 2, children: 0 }],
};

describe("MockProvider.search", () => {
  it("returns Tola's four real room types", async () => {
    const { offers } = await new MockProvider().search(QUERY);
    expect(offers.map((o) => o.name)).toEqual([
      "Deluxe Room",
      "Suite Room",
      "Super Deluxe Cottages",
      "Family Suite Room",
    ]);
  });

  it("returns Vann's three", async () => {
    const { offers } = await new MockProvider().search({ ...QUERY, property: "mahua-vann" });
    expect(offers.map((o) => o.name)).toEqual(["Deluxe Room", "Cottage With Deck", "Cottage Without Deck"]);
  });

  it("gives every room the three meal plans, named as the engine names them", async () => {
    const { offers } = await new MockProvider().search(QUERY);
    for (const offer of offers) {
      expect(offer.ratePlans.map((r) => r.name)).toEqual([
        "Room with Breakfast",
        "Room with Breakfast & Lunch/Dinner",
        "Room With All Meals",
      ]);
    }
  });

  it("totals whole paise — a two-night stay is exactly twice the nightly rate", async () => {
    const { offers } = await new MockProvider().search(QUERY);
    for (const offer of offers) {
      for (const plan of offer.ratePlans) {
        expect(Number.isInteger(plan.total.amount)).toBe(true);
        expect(plan.total.amount).toBe(plan.perRoomPerNight.amount * 2);
      }
    }
  });

  it("rejects an occupancy the room type cannot take", async () => {
    // Tola's Family Suite Room takes the most adults of any room, at five.
    await expect(
      new MockProvider().search({ ...QUERY, rooms: [{ adults: 6, children: 0 }] }),
    ).rejects.toMatchObject({ code: "OCCUPANCY" });
  });

  it("rejects a check-out that is not after check-in", async () => {
    await expect(
      new MockProvider().search({ ...QUERY, checkOut: stayDate("2026-11-14") }),
    ).rejects.toMatchObject({ code: "INVALID_DATES" });
  });
});

describe("MockProvider scenarios", () => {
  it("can produce every named failure mode", async () => {
    // A room id and rate-plan id taken from a happy search, so SOLD_OUT (which
    // returns zero offers from `search`) still has something to quote against.
    // Under SOLD_OUT the failure is asserted at the `quote` step instead of
    // `search`, rather than reaching into `result.offers[0]` of an empty array.
    const { offers: happyOffers } = await new MockProvider({ scenario: "happy" }).search(QUERY);
    const roomId = happyOffers[0].id;
    const ratePlanId = happyOffers[0].ratePlans[0].id;

    for (const code of BOOKING_ERROR_CODES) {
      const provider = new MockProvider({ scenario: code });
      const attempt = async () => {
        if (code === "SOLD_OUT") {
          const result = await provider.search(QUERY);
          await provider.quote({ continuation: result.continuation, roomId, ratePlanId });
          return;
        }
        const result = await provider.search(QUERY).catch((e: unknown) => {
          throw e;
        });
        const quote = await provider.quote({
          continuation: result.continuation,
          roomId: result.offers[0].id,
          ratePlanId: result.offers[0].ratePlans[0].id,
        });
        await provider.book({ quoteId: quote.id, guest: GUEST });
      };
      await expect(attempt()).rejects.toBeInstanceOf(BookingError);
      await expect(attempt()).rejects.toMatchObject({ code });
    }
  });
});

const GUEST = { fullName: "A Guest", email: "guest@example.com", phone: "+919876543210" };

describe("MockProvider.book", () => {
  it("returns a reference and says plainly that no money moved", async () => {
    const provider = new MockProvider();
    const result = await provider.search(QUERY);
    const quote = await provider.quote({
      continuation: result.continuation,
      roomId: result.offers[0].id,
      ratePlanId: result.offers[0].ratePlans[0].id,
    });
    const booking = await provider.book({ quoteId: quote.id, guest: GUEST });
    expect(booking.reference).toMatch(/^MOCK-/);
    expect(booking.payment).toBe("unpaid");
    expect(booking.total).toEqual(quote.total);
  });

  it("refuses a quote id it never issued", async () => {
    await expect(
      new MockProvider().book({ quoteId: "not-a-quote", guest: GUEST }),
    ).rejects.toMatchObject({ code: "QUOTE_EXPIRED" });
  });
});
