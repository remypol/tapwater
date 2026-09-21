/**
 * The decisions behind the postcode page: what the headline says, which single
 * action leads the page, and where every tested substance floats in the column.
 *
 * The page has one commercial job per visitor. Hard water is the problem people pay
 * to solve, so in a hard district the softener quote leads. Where a result is over a
 * legal limit and a filter removes it, that filter leads and the softener follows.
 * Everywhere else the best general filter leads. One primary action, at most two
 * behind it: three equal choices convert worse than one clear one.
 *
 * Pure, so every rule here is unit-tested.
 */

import type { ContaminantReading, FilterProduct } from "./types";
import { HARDNESS_BANDS } from "./softener-guides";
import { HARD_WATER_THRESHOLD } from "./filters";

export type RecommendedProduct = FilterProduct & { matchedCount: number; matchedContaminants: string[] };

export type TankAction =
  | { kind: "softener"; title: string; reason: string }
  | { kind: "product"; product: RecommendedProduct; title: string; reason: string };

export type TankTone = "clear" | "over" | "thin";

export interface Bubble {
  name: string;
  value: number;
  unit: string;
  limit: number;
  /** Share of the legal limit, 0–1 and beyond. */
  share: number;
  status: ContaminantReading["status"];
}

export interface TankPlan {
  tone: TankTone;
  /** One or two short sentences, set huge. The second is always about hardness. */
  headline: string[];
  basis: string;
  /** Substances with a legal limit above zero, closest to the limit first. */
  bubbles: Bubble[];
  /** Must-be-zero and no-limit readings, shown as chips under the column. */
  others: { name: string; text: string; good: boolean }[];
  closest: Bubble | null;
  primary: TankAction | null;
  secondary: TankAction[];
}

export interface TankPlanInput {
  district: string;
  readings: ContaminantReading[];
  dataSource: string;
  sampleCount: number;
  lastSampleDate: string;
  /** Readings with a threshold to judge against; under 3 makes any verdict provisional. */
  scoredCount: number;
  hardness: { value: number; estimated: boolean; estimatedFrom?: string | null } | null;
  recommendations: RecommendedProduct[];
}

/** "Very hard", "Soft" … from the one hardness scale the site uses. */
export function hardnessBandLabel(value: number): string {
  const band = HARDNESS_BANDS.find((b) => value >= b.from && value < b.to);
  return (band ?? HARDNESS_BANDS[HARDNESS_BANDS.length - 1]).label;
}

export function formatSampleDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/** Trim a reading to the digits that matter: 0.00007000000000000001 → "0.00007". */
export function formatReading(value: number): string {
  if (value === 0) return "0";
  if (Math.abs(value) >= 100) return String(Math.round(value));
  return String(Number(value.toPrecision(3)));
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export function buildTankPlan(input: TankPlanInput): TankPlan {
  const { readings, hardness, recommendations, district } = input;

  const bubbles: Bubble[] = [];
  const others: TankPlan["others"] = [];
  for (const r of readings) {
    if (/hardness/i.test(r.name)) continue; // has its own section
    if (r.ukLimit != null && r.ukLimit > 0) {
      bubbles.push({ name: r.name, value: r.value, unit: r.unit, limit: r.ukLimit, share: r.value / r.ukLimit, status: r.status });
    } else if (r.ukLimit === 0) {
      others.push({
        name: r.name,
        text: r.value === 0 ? "none found" : `${formatReading(r.value)} ${r.unit} found`,
        good: r.value === 0,
      });
    } else {
      others.push({ name: r.name, text: `${formatReading(r.value)} ${r.unit}`, good: true });
    }
  }
  bubbles.sort((a, b) => b.share - a.share);

  const over = readings.filter((r) => r.status === "fail");
  const thin = input.dataSource === "ea-only" || input.scoredCount < 3;
  const tone: TankTone = over.length > 0 ? "over" : thin ? "thin" : "clear";

  const headline: string[] = [];
  if (tone === "over") {
    headline.push(over.length === 1 ? `${over[0].name} is over the limit.` : `${over.length} results are over the limit.`);
  } else if (tone === "thin") {
    headline.push("Too few tap tests to call it.");
  } else {
    headline.push("Safe to drink.");
  }
  if (hardness) headline.push(`${hardnessBandLabel(hardness.value)}.`);

  const closest = bubbles[0] ?? null;
  const counted = `${input.sampleCount > 0 ? `${input.sampleCount.toLocaleString("en-GB")} samples, ` : ""}${readings.length} substances, latest on ${formatSampleDate(input.lastSampleDate)}.`;
  let basis: string;
  if (tone === "over") {
    basis = `${counted} ${joinNames(over.slice(0, 3).map((r) => r.name))} came in above the legal limit. Everything else passed.`;
  } else if (tone === "thin") {
    basis =
      input.dataSource === "ea-only"
        ? `${counted} These are river and groundwater samples near ${district}, not tests of treated tap water, so treat the score as a rough guide.`
        : `${counted} Only ${input.scoredCount} of them have a legal limit to judge against, so treat the score as provisional.`;
  } else if (closest && closest.share >= 0.75) {
    basis = `${counted} Everything is inside the legal limit. One result, ${closest.name.toLowerCase()}, sits close to the line.`;
  } else {
    basis = `${counted} Everything is inside the legal limit, and nothing comes close to it.`;
  }

  // ── The funnel ──
  const isHard = hardness != null && hardness.value >= HARD_WATER_THRESHOLD;
  const softener: TankAction = {
    kind: "softener",
    title: `Get softener quotes for ${district}`,
    reason: hardness
      ? `At ${Math.round(hardness.value)} mg/L a softener is the only thing that stops limescale. Filters do not soften water.`
      : "A softener is the only thing that stops limescale.",
  };
  const asAction = (p: RecommendedProduct): TankAction => ({
    kind: "product",
    product: p,
    title: `${p.brand} ${p.model}`,
    // matchedCount carries ranking boosts (PFAS, hard water) as well as real matches,
    // so the sentence is built from the names, never from the count.
    reason:
      p.matchedContaminants.length > 0
        ? `Removes ${joinNames(p.matchedContaminants.slice(0, 3)).toLowerCase()}, the ${p.matchedContaminants.length === 1 ? "result" : "results"} that stood out in ${district}.`
        : p.bestFor,
  });

  const products = recommendations.map(asAction);
  // A filter only outranks the softener when something is actually over its limit.
  // A result that is merely close is worth a mention, not worth displacing the one
  // problem a hard-water household will pay to solve.
  const flaggedFix =
    recommendations.length > 0 && recommendations[0].matchedContaminants.length > 0 && (over.length > 0 || !isHard);

  let ordered: TankAction[];
  if (flaggedFix) ordered = [products[0], ...(isHard ? [softener] : []), ...products.slice(1)];
  else if (isHard) ordered = [softener, ...products];
  else ordered = products;

  return {
    tone,
    headline,
    basis,
    bubbles,
    others,
    closest,
    primary: ordered[0] ?? null,
    secondary: ordered.slice(1, 3),
  };
}
