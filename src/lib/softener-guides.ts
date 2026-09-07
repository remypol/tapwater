/**
 * The water softener guide cluster.
 *
 * One list, consumed by the cluster nav on every guide, by the hardness tool
 * and by the postcode page, so the funnel from "your water is hard" to "get a
 * quote" is the same set of links everywhere. Order is the order a homeowner
 * asks the questions: do I need one, which one, what does it cost, how is it
 * fitted, what do I keep buying.
 */
export interface SoftenerGuideLink {
  slug: string;
  /** Short label for the compact nav. */
  label: string;
  /** One line under the label. */
  blurb: string;
}

export const SOFTENER_GUIDES: SoftenerGuideLink[] = [
  {
    slug: "do-i-need-a-water-softener",
    label: "Do I need a water softener?",
    blurb: "The hardness bands, the symptoms, and when the answer is no",
  },
  {
    slug: "best-water-softener-uk",
    label: "Best water softener UK",
    blurb: "Harvey, Kinetico, BWT, Monarch and Water2Buy compared",
  },
  {
    slug: "water-softener-cost-uk",
    label: "Water softener cost",
    blurb: "Unit, fitting and salt, and how long the payback takes",
  },
  {
    slug: "water-softener-installation-uk",
    label: "Installation explained",
    blurb: "Where it goes, the bypass tap, the drain, DIY or plumber",
  },
  {
    slug: "harvey-vs-kinetico-water-softener",
    label: "Harvey vs Kinetico",
    blurb: "The two premium twin-cylinder brands, side by side",
  },
  {
    slug: "water-softener-salt-guide",
    label: "Softener salt guide",
    blurb: "Tablet, block or granular, and how much you get through",
  },
  {
    slug: "salt-free-water-softener-uk",
    label: "Salt-free softeners",
    blurb: "Conditioners and electronic descalers, honestly assessed",
  },
];

export const SOFTENER_HUB_SLUG = "best-water-softener-uk";

/** Hardness bands used across the cluster, in mg/L as calcium carbonate. */
export const HARDNESS_BANDS = [
  { label: "Soft", from: 0, to: 60 },
  { label: "Moderately soft", from: 60, to: 120 },
  { label: "Slightly hard", from: 120, to: 180 },
  { label: "Hard", from: 180, to: 200 },
  { label: "Very hard", from: 200, to: 400 },
] as const;

/** Above this a softener pays for itself in most homes. */
export const SOFTENER_THRESHOLD_MGL = 200;
