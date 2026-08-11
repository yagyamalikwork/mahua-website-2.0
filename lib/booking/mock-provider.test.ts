import { describe, expect, it } from "vitest";
import { BOOKING_ERROR_CODES, BookingError, type BookingErrorCode } from "./errors";
import { MockProvider } from "./mock-provider";
import { stayDate } from "./types";

const QUERY = {
  property: "mahua-tola" as const,
  checkIn: stayDate("2026-11-14"),
  checkOut: stayDate("2026-11-16"),
  rooms: [{ adults: 2, children: 0 }],
};

const GUEST = { fullName: "A Guest", email: "guest@example.com", phone: "+919876543210" };

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

describe("MockProvider.quote", () => {
  it("quotes the same total the offer showed — nights and rooms carried through", async () => {
    const provider = new MockProvider();
    const result = await provider.search(QUERY);
    const offer = result.offers[0];
    const plan = offer.ratePlans[0];
    const quote = await provider.quote({
      continuation: result.continuation,
      roomId: offer.id,
      ratePlanId: plan.id,
    });
    expect(quote.total).toEqual(plan.total);
  });

  it("will not quote one property's room against the other's search", async () => {
    const provider = new MockProvider();
    const tola = await provider.search(QUERY); // QUERY is mahua-tola
    await expect(
      provider.quote({ continuation: tola.continuation, roomId: "vann-cottage-deck", ratePlanId: "cp" }),
    ).rejects.toMatchObject({ code: "SOLD_OUT" });
  });
});

/**
 * Where in the search → quote → book chain a guest actually meets each
 * failure. Pinning this, not just the error code, is the point of the mock:
 * a provider that raises the right code from the wrong step is exactly as
 * useless to a UI as one that raises the wrong code, because the UI wires a
 * different screen to each step.
 */
const EXPECTED_STEP: Record<BookingErrorCode, "search" | "quote" | "book"> = {
  INVALID_DATES: "search",
  OCCUPANCY: "search",
  PROVIDER_DOWN: "search",
  SOLD_OUT: "quote",
  PRICE_CHANGED: "quote",
  QUOTE_EXPIRED: "book",
};

/**
 * Walks search → quote → book against ids from a happy search, stopping at
 * and recording the first step that rejects. `step: null` means the whole
 * chain succeeded.
 */
async function walkChain(
  provider: MockProvider,
  roomId: string,
  ratePlanId: string,
): Promise<{ step: "search" | "quote" | "book" | null; error: unknown }> {
  let result;
  try {
    result = await provider.search(QUERY);
  } catch (error) {
    return { step: "search", error };
  }

  let quote;
  try {
    quote = await provider.quote({ continuation: result.continuation, roomId, ratePlanId });
  } catch (error) {
    return { step: "quote", error };
  }

  try {
    await provider.book({ quoteId: quote.id, guest: GUEST });
  } catch (error) {
    return { step: "book", error };
  }

  return { step: null, error: null };
}

describe("MockProvider scenarios", () => {
  it("can produce every named failure mode, at the step a guest would actually meet it", async () => {
    // A room id and rate-plan id taken from a happy search, so SOLD_OUT (which
    // returns zero offers from `search`) still has something to quote against.
    const { offers: happyOffers } = await new MockProvider({ scenario: "happy" }).search(QUERY);
    const roomId = happyOffers[0].id;
    const ratePlanId = happyOffers[0].ratePlans[0].id;

    for (const code of BOOKING_ERROR_CODES) {
      const provider = new MockProvider({ scenario: code });
      const { step, error } = await walkChain(provider, roomId, ratePlanId);

      expect(error, `expected scenario "${code}" to reject somewhere in the chain`).toBeInstanceOf(BookingError);
      expect((error as BookingError).code).toBe(code);
      expect(step, `expected scenario "${code}" to reject at "${EXPECTED_STEP[code]}", got "${step}"`).toBe(
        EXPECTED_STEP[code],
      );
    }
  });
});

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

  it("carries the searched property and dates into the booking, not a hard-coded stay", async () => {
    const provider = new MockProvider();
    const result = await provider.search(QUERY);
    const quote = await provider.quote({
      continuation: result.continuation,
      roomId: result.offers[0].id,
      ratePlanId: result.offers[0].ratePlans[0].id,
    });
    const booking = await provider.book({ quoteId: quote.id, guest: GUEST });
    expect(booking.property).toBe("mahua-tola");
    expect(booking.checkIn).toBe(QUERY.checkIn);
    expect(booking.checkOut).toBe(QUERY.checkOut);
  });

  it("refuses a quote id it never issued", async () => {
    await expect(
      new MockProvider().book({ quoteId: "not-a-quote", guest: GUEST }),
    ).rejects.toMatchObject({ code: "QUOTE_EXPIRED" });
  });
});
