# A Mahua-branded checkout — design

**Status:** design agreed 12 Aug 2026. **Implementation is blocked on one vendor answer** (§8).
This spec covers the booking *contract* and a mock behind it. It does **not** cover screens or payments —
see §7 for why each is deliberately absent.

---

## 1. What the client asked for

> "Currently the checkouts and inventory is using a Non-Branded, outsourced thirdparty called Asia Tech…
> We want to build a Mahua Resorts Branded Checkout page like all other competetors."

Asked where money should change hands, he chose **fully on our site**: the guest picks dates, sees live
rooms and rates, enters details and pays on mahuaresorts.com, and never sees AsiaTech.

This does not fight non-negotiable #2 ("seduce, not convert"). That rule is about not turning the site into
a funnel. Handing a guest who has already decided to a generic grey form is the same templated feeling the
client rejected on the property pages — finishing the journey in Mahua's voice is that argument applied to
the last screen.

## 2. What is there today

Nothing but a link. `bookHref` is threaded through `PropertyPage` to `PropertyBar` and
`PropertyInvitation`, and every "Plan your stay" is a plain anchor to
`asiatech.in/booking_engine/index3?token=…` — Vann is property `8351`, Tola `8350`. No state is shared, no
dates are carried, nothing comes back.

**AsiaTech is not only a checkout.** They are a channel manager and PMS: they hold live inventory, sync it
across the OTAs so the lodges are not double-booked, and their engine carries the payment integration.
Replacing the visible tip is a website project; replacing the rest is a commercial migration.

## 3. What is actually sold — measured, not assumed

Read from the client's own engine, 12 Aug 2026, by running searches as a guest would. **Per room, per
night, three meal plans.** Not per person. Occupancy is adults/children with a per-room-type maximum. The
engine displays a stay total and an "Avg. Per Room/Night" beside it.

Room types, stable across five date ranges spanning nine months (Sept 2026 – May 2027):

| Mahua Vann (`8351`) | Rooms | Max adults | Max child |
|---|---|---|---|
| Deluxe Room | 13 | 3 | 2 |
| Cottage With Deck | 8 | 3 | 2 |
| Cottage Without Deck | 4–5 | 4 | 2 |

| Mahua Tola (`8350`) | Rooms | Max adults | Max child |
|---|---|---|---|
| Deluxe Room | 5 | 3 | 2 |
| Suite Room | 2 | 4 | 2 |
| Super Deluxe Cottages | 3 | 3 | 2 |
| Family Suite Room | 1 | 5 | 2 |

Rate plans, verbatim: `Room with Breakfast`, `Room with Breakfast & Lunch/Dinner`, `Room With All Meals`.

**Treat every rate figure captured during this research as an example, not a tariff.** They come from one
sampled date range, they are almost certainly seasonal, and a "View Other Available Rates" control was
deliberately not opened. **No rate, tax, or policy may enter the codebase from this document.** This
project has already nearly shipped an invented capacity figure as a claim about the client's property; a
made-up price would be worse.

The guest journey their engine runs: **Search → Available Rooms → Enhance Your Stay → Your Details →
Review Your Booking**, with an availability calendar (Available / Partial / Sold Out), and stated
cancellation and check-in policies.

## 4. The integration surface, and why we are blocked

Their stack is PHP with jQuery 1.9.1. Two endpoints were observed:

- `POST /booking_engine/rooms_availabilty1.php` — `ckin_date, ckout_date, choose_rooms, adults[], childs[], regid` → **HTML fragment**
- `POST /booking_engine/availability-calender.php` — `regid, bs1_id, date` → calendar HTML

**There is no JSON, no partner token, no versioning. This is not an API and must not be scraped.** It would
break on their next markup change, and it is the client's booking revenue.

**Pre-filling their engine was tested and does not work.** All three mechanisms fail:

| Mechanism | Result |
|---|---|
| GET on the results endpoint | HTTP **500** |
| Dates as query params on the entry page | **200, silently ignored** — the fields come back empty |
| Cross-origin form POST | Returns real rates as an **orphaned fragment** |

The third is the trap. It carries the room data but none of the surrounding page — no calendar, no
policies, and **no route onward** to *Enhance Your Stay*, guest details or payment, because their own page
injects that fragment with JavaScript. A guest sent there is stranded.

So the interim idea of "collect dates on our page, hand them over pre-filled" **is not buildable**, and
building a branded search box without it would make the guest type their dates twice — worse than the clean
handoff shipping today.

## 5. The design: one contract, two implementations

Build the **contract** now and the screens when the contract is real.

### 5.1 `lib/booking/types.ts` — the vocabulary

Two primitives set before anything else, because both are classic sources of silent money and date bugs.

**Money is integer minor units with an explicit currency. Never a float.**

```ts
declare const PAISE: unique symbol;

/** Paise for INR. ₹15,450.00 is 1_545_000. Obtainable only from `rupees()`. */
export type Money = {
  readonly amount: number;
  readonly currency: "INR";
  readonly [PAISE]: true;
};
```

**The brand is not decoration, and this spec had it wrong first.** As originally written, `Money` was a
plain `{ amount; currency }`, and review caught that `const m: Money = { amount: 100.5, currency: "INR" }`
type-checked with **no cast at all** — walking straight past `rupees()`'s integer and negative checks, which
is the entire reason the type exists. `StayDate` at least forced a visible `as`. The brand closes that.

**`declare const`, not a real `Symbol()`.** A runtime symbol would put an actual property on every money
value, and `JSON.stringify` drops symbol keys — so a `Money` arriving from a provider's JSON response would
have lost its brand at runtime while the type still claimed it. `Money` is the one value here guaranteed to
cross HTTP. A `declare`d symbol emits nothing, costs nothing, and cannot be named outside the module;
`rupees()` carries the single `as Money` cast, after its validation.

**A stay date is a civil calendar date, not an instant.** A hotel night is "the 14th of November" in the
lodge's own reckoning; a `Date` carries a timezone and will shift the night under a guest in another one.

```ts
/** `YYYY-MM-DD`, in the property's local calendar. Never a `Date`. */
export type StayDate = string & { readonly __brand: "StayDate" };
```

```ts
export type PropertyId = "mahua-vann" | "mahua-tola";

export type Occupancy = { readonly adults: number; readonly children: number };

export type SearchQuery = {
  readonly property: PropertyId;
  readonly checkIn: StayDate;
  readonly checkOut: StayDate;
  /** One entry per room wanted; its own occupancy. Length is the room count. */
  readonly rooms: readonly Occupancy[];
};

export type RatePlan = {
  readonly id: string;
  /** As the provider names it — "Room with Breakfast". Never re-worded in code. */
  readonly name: string;
  /** Whole stay, all rooms. The figure a guest is committing to. */
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
   * Opaque provider state to be handed back on `quote`. Lets a provider carry a
   * session, a cart id, or nothing at all, without the UI knowing which.
   */
  readonly continuation: string;
};
```

**A search result is a snapshot, not a reservation**, and the type says so by making the next step take a
`continuation` rather than letting the UI reconstruct a booking from remembered fields.

### 5.2 The provider

```ts
export interface BookingProvider {
  /** Rooms and rates for a date range. Throws `BookingError` on a bad range or unknown property. */
  search(query: SearchQuery): Promise<SearchResult>;

  /**
   * Re-price one chosen room and rate plan and hold it briefly. Separate from
   * `search` because a price can move and a room can sell between a guest
   * choosing and a guest paying — this is where that is caught, not at payment.
   */
  quote(input: {
    readonly continuation: string;
    readonly roomId: string;
    readonly ratePlanId: string;
  }): Promise<Quote>;

  /** Commit. The only call that creates something a guest can be charged for. */
  book(input: { readonly quoteId: string; readonly guest: GuestDetails }): Promise<Booking>;
}
```

```ts
export type Quote = {
  readonly id: string;
  readonly total: Money;
  /** Null when the provider offers no hold — the UI must then warn rather than promise. */
  readonly heldUntil: string | null;
  /** Provider's own wording. Displayed verbatim; never summarised by us. */
  readonly cancellationPolicy: string;
  /** Tax lines as the provider states them. We do not compute GST ourselves. */
  readonly charges: readonly { readonly label: string; readonly amount: Money }[];
};
```

**Two things in there are deliberate refusals.** `cancellationPolicy` is a string displayed verbatim, and
`charges` are whatever the provider says they are. We do not restate a legal term in nicer words and we do
not compute Indian GST from a slab we looked up — both are ways to publish a claim we cannot stand behind.

The two remaining types `book` needs:

```ts
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

Nothing here stores a card number, and `GuestDetails` carries no address. Both are decisions rather than
omissions: see §7 on payments, and add an address only when a provider's booking call demands one.

### 5.3 Errors are the design

A booking system is mostly its failure modes. These are named, not left to exceptions:

```ts
export type BookingErrorCode =
  | "SOLD_OUT"        // gone between search and quote
  | "PRICE_CHANGED"   // quote differs from the searched rate
  | "QUOTE_EXPIRED"   // the hold lapsed before the guest finished
  | "INVALID_DATES"   // check-out not after check-in, past dates, beyond the horizon
  | "OCCUPANCY"       // more guests than the room type takes
  | "PROVIDER_DOWN";  // the engine is unreachable or returned nonsense

/** What every method rejects with. `BookingError` is the only rejection type a caller must handle. */
export class BookingError extends Error {
  constructor(
    readonly code: BookingErrorCode,
    message: string,
    /** The provider's own message, kept for the log. Never shown to a guest raw. */
    readonly providerDetail?: string,
  ) {
    super(message);
  }
}
```

**`SOLD_OUT` and `PRICE_CHANGED` are the two that matter and the two most likely to be skipped**, because
neither can be produced on demand against a real engine — which is precisely why `MockProvider` must be
able to produce both.

### 5.4 `MockProvider`

Returns the real shape with the real room types and occupancy caps from §3, and **rates clearly marked as
fictional**. It exists so the whole flow can be built and tested with no vendor at all, and so every error
in §5.3 can be produced on demand — a `SOLD_OUT` that never fires in development is a path that ships
untested.

### 5.5 `AsiaTechProvider`

Every method throws `PROVIDER_DOWN` with "not implemented — awaiting AsiaTech API documentation". It exists
so the wiring, the config and the property-id mapping are real, and the day their documentation arrives the
work is one file.

## 6. Testing

- The types compile; `Money` and `StayDate` are branded so a bare number or string cannot be passed.
- `MockProvider` satisfies `BookingProvider` structurally.
- Every `BookingErrorCode` is reachable and asserted.
- **Money arithmetic is integer-only** — a test that fails if any total is computed through a float.
- No rate, tax or policy string in the repository is presented as Mahua's real commercial terms.

## 7. Explicitly out of scope

- **Screens.** Search, room list, guest details and review are not designed here. Their content depends on
  the provider's real contract, and markup is where guesses get baked in.
- **Payments.** Whether Mahua can hold a merchant account, whether the gateway sits with Mahua or AsiaTech,
  and whether card data ever touches our servers are commercial answers with PCI consequences. Own spec.
- **Replacing AsiaTech.** If they have no API, a fully on-site checkout means migrating inventory, rates and
  OTA sync to another engine. That is a business decision, not a website one.

## 8. The blocking questions, for AsiaTech

1. **Prefill deep link** — can their engine be opened from our site with dates, rooms and guests applied, landing on results? Exact URL format and parameter names. *Small; unblocks an interim improvement.*
2. **Partner API** — availability and rates by date range and room type; create and cancel a booking; payment or handoff to Mahua's own gateway. Documentation, credentials, sandbox, and whether the gateway can be in Mahua Resorts' name. *Large; unblocks this spec.*
3. **Total inventory per room type at both properties**, not just what is free on a date.

Question 3 already paid for itself: reading their engine settled Tola's long-open room count at **eleven**,
exposed a retired Camping Hut still being advertised, and found the home page quoting a future room count in
the present tense. All three were fixed on 12 Aug (`docs/DECISIONS.md` §1).

## 9. Constraints inherited from the project

- Colour, duration and copy come from dials (`lib/palette.ts`, `lib/motion.ts`, `content/`). No component
  hard-codes any of the three.
- A client component's imports ship to the browser; `lib/media-manifest.ts` must never be reachable from
  one.
- The initial page transfer budget is 1.5 MB and the JS budget is measured by `npm run verify:budget`. A
  checkout is new JavaScript on a route that has none — it must be measured, not assumed.
- Contrast is checked by test, not by eye; any new surface needs its own probe.
- British spelling. No user-facing string outside `content/`.
