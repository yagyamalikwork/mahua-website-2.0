/**
 * The booking vocabulary. See
 * `docs/superpowers/specs/2026-08-12-branded-checkout-design.md` §5.1 for why
 * the two primitives below are branded rather than plain.
 */

declare const PAISE: unique symbol;

/**
 * Integer minor units with an explicit currency. `{ amount: 1545000 }` is
 * ₹15,450.00.
 *
 * **Never a float.** Binary floating point cannot hold 0.1, so a total summed
 * as rupees drifts by fractions of a paisa and a guest's bill stops matching
 * the arithmetic behind it. Integers make that impossible rather than unlikely.
 *
 * Compile-time only — `declare const` emits no runtime property, so a Money
 * survives JSON serialisation. `rupees()` is the sole constructor.
 */
export type Money = {
  readonly amount: number;
  readonly currency: "INR";
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
