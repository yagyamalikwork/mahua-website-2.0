# Booking Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the booking vocabulary, the `BookingProvider` contract, a `MockProvider` that can produce every failure mode on demand, and an `AsiaTechProvider` stub — so that when AsiaTech answers, the remaining work is one file.

**Architecture:** Four files under `lib/booking/`, no React, no network, no UI. Money is integer minor units and a stay date is a branded civil-date string, both enforced by the type system so a bare number or a `Date` cannot be passed. The provider is an interface with two implementations; the mock is the one that exists to be *broken* on purpose, because `SOLD_OUT` and `PRICE_CHANGED` cannot be produced against a real engine.

**Tech Stack:** TypeScript (strict), Vitest. No new dependencies.

**Spec:** [`docs/superpowers/specs/2026-08-12-branded-checkout-design.md`](../specs/2026-08-12-branded-checkout-design.md). Read §5 before starting; it carries the reasoning for every type below.

## Global Constraints

- **No rate, tax, cancellation term, or room count may be presented as Mahua's real commercial terms.** The spec's §3 figures are one sampled date range and almost certainly seasonal. Mock rates must be visibly fictional and labelled as such in code. This project has already nearly shipped an invented capacity figure as a claim about the client's property.
- **Money is `{ amount: number; currency: "INR" }` in integer paise. Never a float, never a formatted string.** No total may be produced by an expression containing `/`, `*` by a non-integer, or `parseFloat`.
- **A stay date is a branded `YYYY-MM-DD` string in the property's own calendar. Never a `Date`.**
- **No user-facing strings.** This is `lib/` only — nothing here renders. Provider-supplied text (cancellation policy, charge labels) passes through verbatim and is never re-worded.
- **British spelling** in comments and any text.
- `npm test`, `npm run build` and `npm run lint` must be green before any commit claiming completion.
- Nothing in `lib/booking/` may import from `components/`, `content/`, or `lib/media-manifest.ts`.

## File Structure

| File | Responsibility |
|---|---|
| `lib/booking/types.ts` | The vocabulary: `Money`, `StayDate`, and their constructors; `PropertyId`, `Occupancy`, `SearchQuery`, `RatePlan`, `RoomOffer`, `SearchResult`, `Quote`, `GuestDetails`, `Booking` |
| `lib/booking/errors.ts` | `BookingErrorCode`, `BookingError` |
| `lib/booking/provider.ts` | The `BookingProvider` interface, and `PROPERTY_REGIDS` |
| `lib/booking/mock-provider.ts` | `MockProvider` — real room shapes, fictional rates, every error reachable |
| `lib/booking/asiatech-provider.ts` | `AsiaTechProvider` — every method throws `PROVIDER_DOWN`, "not implemented" |
| `lib/booking/*.test.ts` | One test file beside each of the above |

---

### Task 1: The vocabulary — `Money` and `StayDate`

The two primitives that stop money and date bugs by construction. Branded types: a plain `number` or plain `string` must not be assignable, so every value passes through a constructor that validates.

**Files:**
- Create: `lib/booking/types.ts`
- Test: `lib/booking/types.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `Money`, `StayDate`, `rupees(paise: number): Money`, `stayDate(iso: string): StayDate`, `addMoney(a: Money, b: Money): Money`, `nightsBetween(checkIn: StayDate, checkOut: StayDate): number`.

- [ ] **Step 1: Write the failing test**

```ts
// lib/booking/types.test.ts
import { describe, expect, it } from "vitest";
import { addMoney, nightsBetween, rupees, stayDate } from "./types";

describe("Money", () => {
  it("holds integer paise and a currency", () => {
    expect(rupees(1545000)).toEqual({ amount: 1545000, currency: "INR" });
  });

  it("refuses a fractional amount — paise are the smallest unit there is", () => {
    expect(() => rupees(100.5)).toThrow(/integer/i);
  });

  it("refuses a negative amount", () => {
    expect(() => rupees(-1)).toThrow(/negative/i);
  });

  it("adds without leaving the integers", () => {
    expect(addMoney(rupees(1545000), rupees(1930000))).toEqual({ amount: 3475000, currency: "INR" });
  });
});

describe("StayDate", () => {
  it("accepts a civil calendar date", () => {
    expect(stayDate("2026-11-14")).toBe("2026-11-14");
  });

  it("refuses anything that is not YYYY-MM-DD", () => {
    expect(() => stayDate("14/11/2026")).toThrow(/YYYY-MM-DD/);
    expect(() => stayDate("2026-11-14T00:00:00Z")).toThrow(/YYYY-MM-DD/);
  });

  it("refuses a date that does not exist", () => {
    expect(() => stayDate("2026-02-31")).toThrow(/not a real date/i);
  });

  it("counts nights, not days — check-in Saturday, check-out Monday is two nights", () => {
    expect(nightsBetween(stayDate("2026-11-14"), stayDate("2026-11-16"))).toBe(2);
  });

  it("counts nights across a month boundary", () => {
    expect(nightsBetween(stayDate("2026-11-29"), stayDate("2026-12-02"))).toBe(3);
  });

  it("refuses a check-out that is not after check-in", () => {
    expect(() => nightsBetween(stayDate("2026-11-16"), stayDate("2026-11-16"))).toThrow(/after/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/booking/types.test.ts`
Expected: FAIL — `Failed to resolve import "./types"`.

- [ ] **Step 3: Write the implementation**

```ts
// lib/booking/types.ts
/**
 * The booking vocabulary. See
 * `docs/superpowers/specs/2026-08-12-branded-checkout-design.md` §5.1 for why
 * the two primitives below are branded rather than plain.
 */

/**
 * Integer minor units with an explicit currency. `{ amount: 1545000 }` is
 * ₹15,450.00.
 *
 * **Never a float.** Binary floating point cannot hold 0.1, so a total summed
 * as rupees drifts by fractions of a paisa and a guest's bill stops matching
 * the arithmetic behind it. Integers make that impossible rather than unlikely.
 */
declare const PAISE: unique symbol;

export type Money = {
  readonly amount: number;
  readonly currency: "INR";
  /**
   * Compile-time only. A `declare`d symbol emits no runtime property, so a
   * Money survives `JSON.stringify` — which a real `Symbol()` would not, and
   * this is the one value here that crosses HTTP. `rupees()` is the sole
   * constructor and carries the single `as Money`, after its validation.
   */
  readonly [PAISE]: true;
};

/** `YYYY-MM-DD` in the property's own calendar. Never a `Date` — see `stayDate`. */
export type StayDate = string & { readonly __brand: "StayDate" };

export function rupees(paise: number): Money {
  if (!Number.isInteger(paise)) throw new Error(`Money must be an integer number of paise, got ${paise}`);
  if (paise < 0) throw new Error(`Money cannot be negative, got ${paise}`);
  return { amount: paise, currency: "INR" } as Money;
}

export function addMoney(a: Money, b: Money): Money {
  return rupees(a.amount + b.amount);
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * A hotel night is a calendar day in the lodge's own reckoning — "the 14th of
 * November at Kolara Gate". A `Date` is an instant, and an instant read in
 * another timezone is a different calendar day: a guest booking from London
 * would shift the night by one. So this stays a string, and the only arithmetic
 * done on it (`nightsBetween`) goes through UTC deliberately, where no offset
 * exists to shift anything.
 */
export function stayDate(iso: string): StayDate {
  if (!ISO_DATE.test(iso)) throw new Error(`A stay date must be YYYY-MM-DD, got "${iso}"`);
  const [y, m, d] = iso.split("-").map(Number);
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== m - 1 || probe.getUTCDate() !== d) {
    throw new Error(`"${iso}" is not a real date`);
  }
  return iso as StayDate;
}

const MS_PER_NIGHT = 86_400_000;

export function nightsBetween(checkIn: StayDate, checkOut: StayDate): number {
  const a = Date.parse(`${checkIn}T00:00:00Z`);
  const b = Date.parse(`${checkOut}T00:00:00Z`);
  const nights = (b - a) / MS_PER_NIGHT;
  if (nights < 1) throw new Error(`Check-out ${checkOut} must be after check-in ${checkIn}`);
  return nights;
}

export type PropertyId = "mahua-vann" | "mahua-tola";

export type Occupancy = { readonly adults: number; readonly children: number };

export type SearchQuery = {
  readonly property: PropertyId;
  readonly checkIn: StayDate;
  readonly checkOut: StayDate;
  /** One entry per room wanted, carrying its own occupancy. Length is the room count. */
  readonly rooms: readonly Occupancy[];
};

export type RatePlan = {
  readonly id: string;
  /** As the provider names it — "Room with Breakfast". Never re-worded in code. */
  readonly name: string;
  /** Whole stay, all rooms. The figure a guest commits to. */
  readonly total: Money;
  /** Per room per night, for display beside the total. Derived by the provider, not by us. */
  readonly perRoomPerNight: Money;
};

export type RoomOffer = {
  readonly id: string;
  readonly name: string;
  readonly maxAdults: number;
  readonly maxChildren: number;
  /** How many of this type the provider will still sell for these dates. */
  readonly remaining: number;
  readonly ratePlans: readonly RatePlan[];
};

export type SearchResult = {
  readonly query: SearchQuery;
  readonly offers: readonly RoomOffer[];
  /**
   * Opaque provider state, handed back on `quote`. Lets a provider carry a
   * session, a cart id, or nothing, without the caller knowing which. A search
   * result is a SNAPSHOT, not a reservation, and this is what says so.
   */
  readonly continuation: string;
};

export type Quote = {
  readonly id: string;
  readonly total: Money;
  /** Null when the provider offers no hold — the caller must then warn rather than promise. */
  readonly heldUntil: string | null;
  /** The provider's own wording, displayed verbatim. We never summarise a legal term. */
  readonly cancellationPolicy: string;
  /** Tax and fee lines as the provider states them. We never compute GST ourselves. */
  readonly charges: readonly { readonly label: string; readonly amount: Money }[];
};

export type GuestDetails = {
  readonly fullName: string;
  readonly email: string;
  /** E.164 where possible. Most traffic is Indian mobile; do not assume a country. */
  readonly phone: string;
  /** Free text the guest chooses to add. Never required, never parsed. */
  readonly notes?: string;
};

export type Booking = {
  /** The provider's own reference — what a guest quotes on the phone. */
  readonly reference: string;
  readonly property: PropertyId;
  readonly checkIn: StayDate;
  readonly checkOut: StayDate;
  readonly total: Money;
  /**
   * Whether money has actually moved. A provider that only reserves must say
   * `"unpaid"` rather than let a confirmation screen imply payment.
   */
  readonly payment: "paid" | "deposit" | "unpaid";
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/booking/types.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/booking/types.ts lib/booking/types.test.ts
git commit -m "feat: the booking vocabulary, with money and dates made safe by construction"
```

---

### Task 2: Errors, because they are the design

A booking system is mostly its failure modes. Naming them as data rather than leaving them to thrown strings is what lets the mock produce each one and the UI handle each one.

**Files:**
- Create: `lib/booking/errors.ts`
- Test: `lib/booking/errors.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `BookingErrorCode`, `BookingError`, `BOOKING_ERROR_CODES`.

- [ ] **Step 1: Write the failing test**

```ts
// lib/booking/errors.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/booking/errors.test.ts`
Expected: FAIL — `Failed to resolve import "./errors"`.

- [ ] **Step 3: Write the implementation**

```ts
// lib/booking/errors.ts
/**
 * A booking system is mostly its failure modes, so they are named rather than
 * left to whatever a provider happens to throw.
 *
 * **`SOLD_OUT` and `PRICE_CHANGED` are the two that matter and the two most
 * likely to ship untested**, because neither can be produced on demand against
 * a real engine — you would have to sell the last room to see it. That is
 * precisely why `MockProvider` must be able to produce both.
 */
export const BOOKING_ERROR_CODES = [
  /** Gone between search and quote. The room a guest just chose is no longer sellable. */
  "SOLD_OUT",
  /** The quoted price differs from the searched one. Never charge through this silently. */
  "PRICE_CHANGED",
  /** The hold lapsed before the guest finished. */
  "QUOTE_EXPIRED",
  /** Check-out not after check-in, a date in the past, or beyond the bookable horizon. */
  "INVALID_DATES",
  /** More guests than the room type takes. */
  "OCCUPANCY",
  /** The engine is unreachable or answered with something we cannot read. */
  "PROVIDER_DOWN",
] as const;

export type BookingErrorCode = (typeof BOOKING_ERROR_CODES)[number];

/** The only rejection type a caller must handle. */
export class BookingError extends Error {
  constructor(
    readonly code: BookingErrorCode,
    message: string,
    /**
     * The provider's own message, kept for the log and deliberately NOT folded
     * into `message`: a raw upstream error is meaningless to a guest and can
     * leak an internal host or a stack.
     */
    readonly providerDetail?: string,
  ) {
    super(message);
    this.name = "BookingError";
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/booking/errors.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/booking/errors.ts lib/booking/errors.test.ts
git commit -m "feat: name the booking failure modes, so the mock can produce each one"
```

---

### Task 3: The provider contract

**Files:**
- Create: `lib/booking/provider.ts`
- Test: `lib/booking/provider.test.ts`

**Interfaces:**
- Consumes: `types.ts`'s `SearchQuery`, `SearchResult`, `Quote`, `GuestDetails`, `Booking`, `PropertyId`.
- Produces: `BookingProvider`, `PROPERTY_REGIDS`.

- [ ] **Step 1: Write the failing test**

The interface itself is compile-time only, so the runtime test covers the one piece of real data in this file — the property mapping — and a structural check that a conforming object type-checks.

```ts
// lib/booking/provider.test.ts
import { describe, expect, it } from "vitest";
import { PROPERTY_REGIDS } from "./provider";

describe("PROPERTY_REGIDS", () => {
  it("maps both properties to the ids their booking engine uses", () => {
    expect(PROPERTY_REGIDS["mahua-vann"]).toBe("8351");
    expect(PROPERTY_REGIDS["mahua-tola"]).toBe("8350");
  });

  it("covers every property and nothing else", () => {
    expect(Object.keys(PROPERTY_REGIDS).sort()).toEqual(["mahua-tola", "mahua-vann"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/booking/provider.test.ts`
Expected: FAIL — `Failed to resolve import "./provider"`.

- [ ] **Step 3: Write the implementation**

```ts
// lib/booking/provider.ts
import type { Booking, GuestDetails, PropertyId, Quote, SearchQuery, SearchResult } from "./types";

/**
 * What any booking engine must be able to do. Three calls, in the order a
 * guest moves through them.
 *
 * Every method rejects with `BookingError` (see `./errors`) and nothing else.
 */
export interface BookingProvider {
  /** Rooms and rates for a date range. */
  search(query: SearchQuery): Promise<SearchResult>;

  /**
   * Re-price one chosen room and rate plan, and hold it briefly.
   *
   * **Separate from `search` on purpose.** A price can move and a room can sell
   * between a guest choosing and a guest paying. This is where that is caught —
   * not at payment, where the guest has already given their card.
   */
  quote(input: {
    readonly continuation: string;
    readonly roomId: string;
    readonly ratePlanId: string;
  }): Promise<Quote>;

  /** Commit. The only call that creates something a guest can be charged for. */
  book(input: { readonly quoteId: string; readonly guest: GuestDetails }): Promise<Booking>;
}

/**
 * The ids Mahua's own booking engine uses for each property, read from the
 * live booking links in `app/mahua-vann/page.tsx` and `app/mahua-tola/page.tsx`
 * (`?token=` is base64 of these). Kept here so a provider adapter never has to
 * guess, and so the mapping is asserted rather than remembered.
 */
export const PROPERTY_REGIDS: Record<PropertyId, string> = {
  "mahua-vann": "8351",
  "mahua-tola": "8350",
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/booking/provider.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/booking/provider.ts lib/booking/provider.test.ts
git commit -m "feat: the BookingProvider contract, and the property ids it maps"
```

---

### Task 4: `MockProvider`

Real room shapes and occupancy caps from the spec's §3; **fictional rates**. It must be able to produce every code in `BOOKING_ERROR_CODES` on demand.

**Files:**
- Create: `lib/booking/mock-provider.ts`
- Test: `lib/booking/mock-provider.test.ts`

**Interfaces:**
- Consumes: `types.ts`, `errors.ts`, `provider.ts`'s `BookingProvider`.
- Produces: `MockProvider`, `MockScenario`.

- [ ] **Step 1: Write the failing test**

```ts
// lib/booking/mock-provider.test.ts
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
    for (const code of BOOKING_ERROR_CODES) {
      const provider = new MockProvider({ scenario: code });
      const attempt = async () => {
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/booking/mock-provider.test.ts`
Expected: FAIL — `Failed to resolve import "./mock-provider"`.

- [ ] **Step 3: Write the implementation**

```ts
// lib/booking/mock-provider.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/booking/mock-provider.test.ts`
Expected: PASS, 10 tests.

**If the "every named failure mode" test fails for `SOLD_OUT`**, that is the test doing its job: `search` under the `SOLD_OUT` scenario returns zero offers, so `result.offers[0]` is `undefined` and the chain throws a `TypeError` rather than a `BookingError`. Fix it in the *test* by asserting `SOLD_OUT` at the `quote` step with a room id taken from a `happy` search — do not weaken the provider to make an easier assertion.

- [ ] **Step 5: Commit**

```bash
git add lib/booking/mock-provider.ts lib/booking/mock-provider.test.ts
git commit -m "feat: a mock booking provider that can fail in every named way"
```

---

### Task 5: `AsiaTechProvider`, and the module's front door

The stub, plus one `index.ts` so consumers import from `@/lib/booking` rather than reaching into files.

**Files:**
- Create: `lib/booking/asiatech-provider.ts`
- Create: `lib/booking/index.ts`
- Test: `lib/booking/asiatech-provider.test.ts`

**Interfaces:**
- Consumes: `provider.ts`'s `BookingProvider`, `errors.ts`.
- Produces: `AsiaTechProvider`; `lib/booking/index.ts` re-exporting everything above.

- [ ] **Step 1: Write the failing test**

```ts
// lib/booking/asiatech-provider.test.ts
import { describe, expect, it } from "vitest";
import { AsiaTechProvider } from "./asiatech-provider";
import { BookingError } from "./errors";
import { stayDate } from "./types";

const QUERY = {
  property: "mahua-vann" as const,
  checkIn: stayDate("2026-11-14"),
  checkOut: stayDate("2026-11-16"),
  rooms: [{ adults: 2, children: 0 }],
};

describe("AsiaTechProvider", () => {
  it("refuses every call, plainly, until AsiaTech supply an API", async () => {
    const p = new AsiaTechProvider();
    const calls = [
      p.search(QUERY),
      p.quote({ continuation: "x", roomId: "y", ratePlanId: "z" }),
      p.book({ quoteId: "q", guest: { fullName: "A", email: "a@b.c", phone: "+91" } }),
    ];
    for (const call of calls) {
      await expect(call).rejects.toBeInstanceOf(BookingError);
      await expect(call).rejects.toMatchObject({ code: "PROVIDER_DOWN" });
      await expect(call).rejects.toThrow(/not implemented/i);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/booking/asiatech-provider.test.ts`
Expected: FAIL — `Failed to resolve import "./asiatech-provider"`.

- [ ] **Step 3: Write the implementation**

```ts
// lib/booking/asiatech-provider.ts
import { BookingError } from "./errors";
import type { BookingProvider } from "./provider";
import type { Booking, GuestDetails, Quote, SearchQuery, SearchResult } from "./types";

/**
 * The real provider, unimplemented on purpose.
 *
 * **AsiaTech had no usable API as of 12 Aug 2026.** Their engine is PHP with
 * jQuery 1.9.1; its two endpoints (`rooms_availabilty1.php`,
 * `availability-calender.php`) take form posts and answer with HTML fragments —
 * no JSON, no partner token, no versioning, no contract. Scraping them would
 * break on their next markup change and would be resting this client's booking
 * revenue on it, so this file waits instead.
 *
 * Three things are needed from them before it can be written; the spec's §8
 * has the wording. When they arrive, this file is the only one that changes —
 * that is what the interface is for.
 *
 * **Do not "temporarily" implement this by posting to those endpoints.**
 */
export class AsiaTechProvider implements BookingProvider {
  private refuse(): never {
    throw new BookingError(
      "PROVIDER_DOWN",
      "Online booking is not available yet.",
      "AsiaTechProvider: not implemented — awaiting AsiaTech API documentation (spec §8)",
    );
  }

  async search(_query: SearchQuery): Promise<SearchResult> {
    this.refuse();
  }

  async quote(_input: { continuation: string; roomId: string; ratePlanId: string }): Promise<Quote> {
    this.refuse();
  }

  async book(_input: { quoteId: string; guest: GuestDetails }): Promise<Booking> {
    this.refuse();
  }
}
```

```ts
// lib/booking/index.ts
/**
 * The booking module's front door. Import from `@/lib/booking`, not from the
 * files inside it, so the internal shape can change without a caller noticing.
 */
export * from "./types";
export * from "./errors";
export * from "./provider";
export { MockProvider, type MockScenario } from "./mock-provider";
export { AsiaTechProvider } from "./asiatech-provider";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/booking/`
Expected: PASS — all four test files, 24 tests.

- [ ] **Step 5: Verify the whole suite and the build**

Run: `npm test && npm run build && npm run lint`
Expected: all green; `npm test` at **443** (419 + 24).

- [ ] **Step 6: Commit**

```bash
git add lib/booking/asiatech-provider.ts lib/booking/asiatech-provider.test.ts lib/booking/index.ts
git commit -m "feat: the AsiaTech adapter, deliberately unimplemented"
```

---

### Task 6: Guard the two rules that matter

Two constraints in this plan are the kind that hold while someone is thinking about them and rot the moment they are not. Both become tests.

**Files:**
- Create: `lib/booking/constraints.test.ts`

**Interfaces:**
- Consumes: everything above, plus `node:fs`.
- Produces: nothing.

- [ ] **Step 1: Write the failing test**

```ts
// lib/booking/constraints.test.ts
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const DIR = path.resolve(__dirname);
const sources = readdirSync(DIR)
  .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"))
  .map((f) => ({ file: f, text: readFileSync(path.join(DIR, f), "utf8") }));

describe("the booking module keeps its two load-bearing rules", () => {
  it("never reaches into the app — no component, content, or media-manifest import", () => {
    // The manifest carries a base64 blur URI per photograph; anything that
    // imports it drags all of them into whatever bundle it lands in.
    for (const { file, text } of sources) {
      expect(text, `${file} imports outside lib/booking`).not.toMatch(
        /from\s+["']@\/(components|content)\/|media-manifest/,
      );
    }
  });

  it("does no floating-point money arithmetic", () => {
    // Paise are integers. A `/` or a `parseFloat` in a file that computes a
    // total is how a bill stops matching the arithmetic behind it.
    for (const { file, text } of sources) {
      const stripped = text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
      expect(stripped, `${file} uses parseFloat`).not.toMatch(/parseFloat|Number\.parseFloat/);
      expect(stripped, `${file} uses toFixed`).not.toMatch(/toFixed/);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Temporarily add `import { PALETTE } from "@/content/home";` to the top of `lib/booking/types.ts` and `const x = parseFloat("1.5");` inside `rupees`.

Run: `npx vitest run lib/booking/constraints.test.ts`
Expected: FAIL, both assertions, naming `types.ts`.

- [ ] **Step 3: Remove the two deliberate breakages**

Delete the import and the `parseFloat` line added in Step 2.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/booking/` then `npm test`
Expected: PASS; suite at **445**.

- [ ] **Step 5: Commit**

```bash
git add lib/booking/constraints.test.ts
git commit -m "test: guard the booking module's import boundary and integer money"
```

---

## Self-review

**Spec coverage.** §5.1 vocabulary → Task 1. §5.2 provider → Task 3. §5.2's `Quote`, `GuestDetails`, `Booking` → Task 1. §5.3 errors → Task 2. §5.4 mock → Task 4. §5.5 AsiaTech stub → Task 5. §6 testing → Tasks 1–6, with the integer-money and import-boundary rules made mechanical in Task 6. §7's exclusions are honoured: no screens, no payment types, no gateway. §8 and §9 need no code.

**Placeholder scan.** No TBD or "handle errors appropriately"; every step carries the code it needs. Task 4 Step 4 names the one failure a competent implementer will actually hit and says how to fix it *in the test* rather than by weakening the provider.

**Type consistency.** `rupees`/`addMoney`/`stayDate`/`nightsBetween` are defined in Task 1 and used with those names in Task 4. `BOOKING_ERROR_CODES`/`BookingError` defined in Task 2, used in Tasks 4 and 5. `BookingProvider`/`PROPERTY_REGIDS` defined in Task 3, implemented in Tasks 4 and 5. `MockScenario` is defined in Task 4 and re-exported in Task 5.

**One deliberate gap.** `MockProvider.book` returns a hard-coded property and dates rather than the ones searched, because the mock does not carry the query through the quote. That is honest for a stub whose job is exercising failure modes, and it is the first thing the real adapter must not copy.
