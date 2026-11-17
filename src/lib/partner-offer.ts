/**
 * The installer offer, in one place. Change a number here and the partner page,
 * the emails, the checkout and the routing all follow.
 */

/** Leads a new installer receives before paying anything. Matches the column default. */
export const FREE_LEADS = 3;

/** Leads in one paid top-up. */
export const PACK_LEADS = 5;

/** Price of one top-up, in pence, before VAT. £175 = £35 a lead. */
export const PACK_PRICE_PENCE = 17_500;

/** A homeowner's request goes to at most this many installers. */
export const MAX_INSTALLERS_PER_LEAD = 2;

/** Leads older than this are not handed to a newly approved installer. */
export const BACKLOG_MAX_AGE_DAYS = 30;

/** A repeat request from the same person for the same district inside this window is one lead. */
export const DUPLICATE_WINDOW_HOURS = 24;

export const PACK_PRICE_GBP = PACK_PRICE_PENCE / 100;
export const PRICE_PER_LEAD_GBP = Math.round(PACK_PRICE_PENCE / PACK_LEADS) / 100;

export function formatGbp(amount: number): string {
  return `£${Number.isInteger(amount) ? amount : amount.toFixed(2)}`;
}

/**
 * An area to yourself: every request in one postcode area, sent to one installer
 * only, for a flat monthly fee. Offered by arrangement (the installer emails us)
 * until an area is sold, then it gets its own card subscription. A month that
 * brings fewer than the floor is not charged, so nobody pays for an empty area.
 * At the floor the fee works out at about the per-lead price, without sharing.
 */
export const EXCLUSIVE_AREA_MONTHLY_GBP = 149;
export const EXCLUSIVE_AREA_MIN_REQUESTS = 3;
