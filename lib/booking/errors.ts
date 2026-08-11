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
    /**
     * An ENGINEER-facing fallback, not approved guest copy. This module is
     * `lib/`, not `content/` — the client reviews every word a visitor reads,
     * and these sentences never have been. A UI must key its wording off
     * `code` and take the actual words from `content/`; shipping `message` to
     * a guest unchanged would put unreviewed copy on the page. Useful as a
     * log line, a test assertion, or a placeholder before `content/` grows
     * the real copy — never as what renders.
     */
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
