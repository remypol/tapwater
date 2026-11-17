/**
 * Published UK water softener prices, each read from the seller's or maker's
 * own page on the date in `checked`. Nothing here is an estimate: a brand with
 * no published price is listed in NO_PUBLISHED_PRICE instead of being given a
 * guessed figure. The cost guide renders this file directly, so the table, the
 * opening answer and the FAQ cannot drift apart.
 *
 * To refresh: open each sourceUrl, update the price and the `checked` date, and
 * drop any row whose page no longer shows a price.
 */

export type SoftenerPriceIncludes = "unit" | "installed";

export interface SoftenerPrice {
  brand: string;
  model: string;
  /** Plain-English design, e.g. "Twin tank, non-electric". */
  type: string;
  /** A single published price, VAT included. */
  priceGbp?: number;
  /** A "from" price (and the top of the range, where the source gives one). */
  priceFromGbp?: number;
  priceToGbp?: number;
  includes: SoftenerPriceIncludes;
  sourceName: string;
  sourceUrl: string;
  /** ISO date the source page was read. */
  checked: string;
  note?: string;
}

const CHECKED = "2026-11-17";
const CITY_PLUMBING = "City Plumbing";

export const SOFTENER_PRICES: SoftenerPrice[] = [
  {
    brand: "Culligan Harvey",
    model: "Basic installation package",
    type: "Twin tank, non-electric, block salt",
    priceFromGbp: 1195,
    includes: "installed",
    sourceName: "Harvey Water Softeners",
    sourceUrl: "https://www.harveywatersofteners.co.uk/facts-culligan-harvey/",
    checked: CHECKED,
    note: "A starting price. Harvey says all pricing is subject to a site survey and pipework complexity, and does not publish a price for each model.",
  },
  {
    brand: "Harvey",
    model: "Crown",
    type: "Twin tank, non-electric, block salt",
    priceFromGbp: 974,
    includes: "unit",
    sourceName: "East Midlands Water",
    sourceUrl: "https://eastmidlandswater.com/collections/meter-controlled-softeners",
    checked: CHECKED,
    note: "An independent retailer's sale price for a Harvey-made unit; its regular price is shown as £1,128. The listing we read did not say whether VAT is included.",
  },
  {
    brand: "Scalemaster",
    model: "Softline SL-Twin (900322)",
    type: "Twin tank, non-electric",
    priceGbp: 976.49,
    includes: "unit",
    sourceName: CITY_PLUMBING,
    sourceUrl:
      "https://www.cityplumbing.co.uk/p/scalemaster-softline-sl-twin-twin-tank-non-electric-water-softener-900322/p/101947",
    checked: CHECKED,
  },
  {
    brand: "Monarch",
    model: "Ultra HE (PSU027HE)",
    type: "Twin tank, battery operated",
    priceGbp: 935.99,
    includes: "unit",
    sourceName: CITY_PLUMBING,
    sourceUrl:
      "https://www.cityplumbing.co.uk/p/monarch-ultra-he-twin-tank-water-softener-psu027he/p/633867",
    checked: CHECKED,
  },
  {
    brand: "Sentinel",
    model: "Sumo (SUMO-SOFTENER-GB)",
    type: "Non-electric, compact",
    priceGbp: 912.6,
    includes: "unit",
    sourceName: CITY_PLUMBING,
    sourceUrl:
      "https://www.cityplumbing.co.uk/p/sentinel-sumo-water-softener-sumo-softener-gb/p/638091",
    checked: CHECKED,
  },
  {
    brand: "BWT",
    model: "Perla Silk 10L",
    type: "Electric, mains powered",
    priceGbp: 870,
    includes: "unit",
    sourceName: CITY_PLUMBING,
    sourceUrl: "https://www.cityplumbing.co.uk/p/bwt-perla-silk-10l-water-softener/p/488669",
    checked: CHECKED,
  },
  {
    brand: "Tapworks",
    model: "NSC11PRO, 1 to 7 people",
    type: "Single tank, electric",
    priceGbp: 690.76,
    includes: "unit",
    sourceName: CITY_PLUMBING,
    sourceUrl:
      "https://www.cityplumbing.co.uk/p/tapworks-domestic-automatic-water-softener-for-1-to-7-person-household-nsc11pro/p/464662",
    checked: CHECKED,
  },
  {
    brand: "BWT",
    model: "WS355 14L",
    type: "Single tank, electric, metered",
    priceGbp: 660,
    includes: "unit",
    sourceName: CITY_PLUMBING,
    sourceUrl:
      "https://www.cityplumbing.co.uk/p/bwt-ws-355-standard-electronic-water-softener-14l/p/285252",
    checked: CHECKED,
  },
  {
    brand: "Monarch",
    model: "Ultimate Midi HE (MIDM002HE)",
    type: "Single tank, electric, metered",
    priceGbp: 604.44,
    includes: "unit",
    sourceName: CITY_PLUMBING,
    sourceUrl:
      "https://www.cityplumbing.co.uk/p/monarch-ultimate-midi-he-water-softener-midm002he/p/396625",
    checked: CHECKED,
    note: "Shown as reduced from £671.60 on the day we checked.",
  },
  {
    brand: "Calmag",
    model: "Calsoft Mini 12.5L with 15mm fitting kit",
    type: "Electric, metered",
    priceGbp: 591.83,
    includes: "unit",
    sourceName: CITY_PLUMBING,
    sourceUrl:
      "https://www.cityplumbing.co.uk/p/calmag-metered-water-softner-12-5l-and-15mm-installation-kit/p/345261",
    checked: CHECKED,
  },
];

/**
 * The marketplace guide the installed range leans on. MyJobQuote collects
 * tradespeople's prices; its figures are for a softener supplied and fitted.
 */
export const MARKETPLACE_GUIDE = {
  sourceName: "MyJobQuote",
  sourceUrl: "https://www.myjobquote.co.uk/costs/water-softener-installation",
  checked: CHECKED,
  averageInstalledGbp: 1250,
  installedBands: [
    { label: "Basic unit", low: 540, high: 1000 },
    { label: "Mid-range unit", low: 940, high: 1900 },
    { label: "High-end unit", low: 1750, high: 2900 },
  ],
  labour: { low: 150, high: 600 },
  serviceYearly: { low: 50, high: 100 },
} as const;

/** Brands whose own sites give no pound figure and send you to a quote form. */
export const NO_PUBLISHED_PRICE: { brand: string; sourceUrl: string; says: string }[] = [
  {
    brand: "Kinetico",
    sourceUrl: "https://www.kinetico.co.uk/products/water-softeners",
    says: "No prices on its UK site. It asks you to get a free quote from a local dealer.",
  },
  {
    brand: "TwinTec",
    sourceUrl: "https://www.twintec.com/",
    says: "No prices for the Cobalt or S4. It asks you to request a quote or find a supplier.",
  },
];

export interface PriceRange {
  low: number;
  high: number;
}

/** The lowest figure a row publishes: its single price, or its "from" price. */
export function lowestPrice(row: SoftenerPrice): number {
  return row.priceGbp ?? row.priceFromGbp ?? Number.NaN;
}

/** The highest figure a row publishes; for a bare "from" price, that same figure. */
function highestPrice(row: SoftenerPrice): number {
  return row.priceGbp ?? row.priceToGbp ?? row.priceFromGbp ?? Number.NaN;
}

/**
 * What a softener sold as a fitted package costs in the UK.
 *
 *   low  = the lowest price among the rows with includes: "installed". Today
 *          that is Harvey's published starting price for a basic installation
 *          package.
 *   high = the top of the highest installed band in MARKETPLACE_GUIDE
 *          (MyJobQuote's "high-end unit" band).
 *
 * The low end deliberately ignores MyJobQuote's "basic unit" band, which is a
 * merchant unit fitted by an independent plumber. The page covers that route
 * separately from the unit rows plus the labour range, so the two are not
 * blended into one number.
 */
export function installedPriceRange(): PriceRange {
  const installed = SOFTENER_PRICES.filter((r) => r.includes === "installed").map(lowestPrice);
  const low = Math.min(...installed);
  const high = Math.max(...MARKETPLACE_GUIDE.installedBands.map((b) => b.high));
  return { low, high };
}

/** Cheapest and dearest unit-only rows, as published. */
export function unitPriceRange(): PriceRange {
  const units = SOFTENER_PRICES.filter((r) => r.includes === "unit");
  return {
    low: Math.min(...units.map(lowestPrice)),
    high: Math.max(...units.map(highestPrice)),
  };
}

/** "£1,195", or "£604.44" when the price has pence. */
export function formatGbp(amount: number): string {
  const whole = Number.isInteger(amount);
  return `£${amount.toLocaleString("en-GB", {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  })}`;
}

/** "£1,195 to £2,900". */
export function formatPriceRange(range: PriceRange): string {
  return `${formatGbp(range.low)} to ${formatGbp(range.high)}`;
}
