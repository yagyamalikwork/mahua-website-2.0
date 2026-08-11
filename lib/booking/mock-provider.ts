import { BookingError, type BookingErrorCode } from "./errors";
import type { BookingProvider } from "./provider";
import {
  addMoney,
  nightsBetween,
  rupees,
  type Booking,
  type GuestDetails,
  type Money,
  type PropertyId,
  type Quote,
  type RoomOffer,
  type SearchQuery,
  type SearchResult,
} from "./types";

/**
 * A provider with no engine behind it.
 *
 * **Room names, occupancy caps and counts are real** — read from the client's
 * own booking engine on 12 Aug 2026 and stable across five date ranges spanning
 * nine months (see the spec's §3).
 *
 * **THE RATES ARE INVENTED AND MUST STAY THAT WAY.** They are round numbers,
 * chosen to be obviously fake, and they are not Mahua's tariff. The real
 * figures are seasonal, were sampled once, and a "View Other Available Rates"
 * control was never opened. Publishing a made-up price as this client's is the
 * same failure as the made-up capacity figure this project has already caught
 * once — see `docs/DECISIONS.md`.
 */
export type MockScenario = BookingErrorCode | "happy";

type RoomShape = { id: string; name: string; maxAdults: number; maxChildren: number; remaining: number; nightlyPaise: number };

/** Fictional. See the warning above. */
const ROOMS: Record<PropertyId, readonly RoomShape[]> = {
  "mahua-vann": [
    { id: "vann-deluxe", name: "Deluxe Room", maxAdults: 3, maxChildren: 2, remaining: 13, nightlyPaise: 1_000_000 },
    { id: "vann-cottage-deck", name: "Cottage With Deck", maxAdults: 3, maxChildren: 2, remaining: 8, nightlyPaise: 1_200_000 },
    { id: "vann-cottage-plain", name: "Cottage Without Deck", maxAdults: 4, maxChildren: 2, remaining: 5, nightlyPaise: 1_100_000 },
  ],
  "mahua-tola": [
    { id: "tola-deluxe", name: "Deluxe Room", maxAdults: 3, maxChildren: 2, remaining: 5, nightlyPaise: 800_000 },
    { id: "tola-suite", name: "Suite Room", maxAdults: 4, maxChildren: 2, remaining: 2, nightlyPaise: 900_000 },
    { id: "tola-super-deluxe", name: "Super Deluxe Cottages", maxAdults: 3, maxChildren: 2, remaining: 3, nightlyPaise: 1_000_000 },
    { id: "tola-family", name: "Family Suite Room", maxAdults: 5, maxChildren: 2, remaining: 1, nightlyPaise: 1_100_000 },
  ],
};

/** The engine's own three, named exactly as it names them. Uplift is fictional. */
const PLANS = [
  { id: "cp", name: "Room with Breakfast", upliftPaise: 0 },
  { id: "map", name: "Room with Breakfast & Lunch/Dinner", upliftPaise: 100_000 },
  { id: "ap", name: "Room With All Meals", upliftPaise: 300_000 },
] as const;

export class MockProvider implements BookingProvider {
  private readonly scenario: MockScenario;
  private readonly quotes = new Map<string, Quote>();
  private counter = 0;

  constructor(options: { scenario?: MockScenario } = {}) {
    this.scenario = options.scenario ?? "happy";
  }

  async search(query: SearchQuery): Promise<SearchResult> {
    if (this.scenario === "PROVIDER_DOWN") {
      throw new BookingError("PROVIDER_DOWN", "We could not reach the booking system.", "mock: forced");
    }

    let nights: number;
    try {
      nights = nightsBetween(query.checkIn, query.checkOut);
    } catch (e) {
      throw new BookingError("INVALID_DATES", "Those dates do not make a stay.", String(e));
    }
    if (this.scenario === "INVALID_DATES") {
      throw new BookingError("INVALID_DATES", "Those dates do not make a stay.", "mock: forced");
    }

    const shapes = ROOMS[query.property];
    for (const room of query.rooms) {
      const fits = shapes.some((s) => room.adults <= s.maxAdults && room.children <= s.maxChildren);
      if (!fits || this.scenario === "OCCUPANCY") {
        throw new BookingError("OCCUPANCY", "No room here takes a party that size.", "mock");
      }
    }

    if (this.scenario === "SOLD_OUT") {
      return { query, offers: [], continuation: this.next("cont") };
    }

    const roomCount = query.rooms.length;
    const offers: RoomOffer[] = shapes.map((s) => ({
      id: s.id,
      name: s.name,
      maxAdults: s.maxAdults,
      maxChildren: s.maxChildren,
      remaining: s.remaining,
      ratePlans: PLANS.map((p) => {
        const perNight = rupees(s.nightlyPaise + p.upliftPaise);
        return {
          id: p.id,
          name: p.name,
          perRoomPerNight: perNight,
          total: rupees(perNight.amount * nights * roomCount),
        };
      }),
    }));

    return { query, offers, continuation: this.next("cont") };
  }

  async quote(input: { continuation: string; roomId: string; ratePlanId: string }): Promise<Quote> {
    if (this.scenario === "SOLD_OUT") {
      throw new BookingError("SOLD_OUT", "That room has just gone.", "mock: forced");
    }
    if (this.scenario === "PRICE_CHANGED") {
      throw new BookingError("PRICE_CHANGED", "The price for those dates has changed.", "mock: forced");
    }
    if (this.scenario === "PROVIDER_DOWN") {
      throw new BookingError("PROVIDER_DOWN", "We could not reach the booking system.", "mock: forced");
    }

    const shape = Object.values(ROOMS)
      .flat()
      .find((s) => s.id === input.roomId);
    const plan = PLANS.find((p) => p.id === input.ratePlanId);
    if (!shape || !plan) {
      throw new BookingError("SOLD_OUT", "That room is no longer available.", `mock: unknown ${input.roomId}`);
    }

    const base: Money = rupees(shape.nightlyPaise + plan.upliftPaise);
    const quote: Quote = {
      id: this.next("quote"),
      total: addMoney(base, rupees(0)),
      // The mock holds nothing. `null` is the honest answer and the one the UI
      // must be built against — a provider that cannot hold a room should never
      // let a confirmation screen imply it did.
      heldUntil: null,
      cancellationPolicy: "MOCK POLICY — not Mahua's terms. Replace with the provider's own wording.",
      charges: [{ label: "MOCK CHARGE — not a real tax line", amount: rupees(0) }],
    };
    this.quotes.set(quote.id, quote);
    return quote;
  }

  async book(input: { quoteId: string; guest: GuestDetails }): Promise<Booking> {
    if (this.scenario === "QUOTE_EXPIRED") {
      throw new BookingError("QUOTE_EXPIRED", "That hold has expired. Please search again.", "mock: forced");
    }
    if (this.scenario === "PROVIDER_DOWN") {
      throw new BookingError("PROVIDER_DOWN", "We could not reach the booking system.", "mock: forced");
    }
    const quote = this.quotes.get(input.quoteId);
    if (!quote) {
      throw new BookingError("QUOTE_EXPIRED", "That hold has expired. Please search again.", "mock: unknown quote");
    }
    return {
      reference: this.next("MOCK"),
      property: "mahua-tola",
      checkIn: "2026-11-14" as Booking["checkIn"],
      checkOut: "2026-11-16" as Booking["checkOut"],
      total: quote.total,
      // Nothing was charged. Saying so is the point of the field.
      payment: "unpaid",
    };
  }

  private next(prefix: string): string {
    this.counter += 1;
    return `${prefix}-${this.counter}`;
  }
}
