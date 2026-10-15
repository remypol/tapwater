import { postcodeAreaName } from "./postcode-areas";

/**
 * The numbers behind the "our data" block on the buying guides.
 *
 * Input is measured districts only (getMeasuredHardness), so every figure the
 * block prints is a reading a water company published for that district, not a
 * postcode-area estimate. An area's median uses the same rule as the area
 * estimate in data.ts (middle value, or the rounded mean of the middle two), so
 * the figure a guide quotes for "LU" is the figure /hardness/lu shows.
 */

export interface MeasuredDistrict {
  district: string;
  value: number;
}

export interface AreaHardness {
  /** Postcode area letters, "LU". */
  area: string;
  /** Royal Mail town name, "Luton". */
  name: string;
  /** Median of the area's measured districts, mg/L CaCO3. */
  median: number;
  /** Measured districts in the area. */
  districts: number;
}

export interface HardnessSummary {
  /** Districts with a reading of their own. */
  measured: number;
  threshold: number;
  /** Districts at or above the threshold. */
  atOrAbove: number;
  /** atOrAbove as a whole percentage of measured. */
  percent: number;
  /** Hardest qualifying areas, hardest first. */
  hardest: AreaHardness[];
  /** Softest qualifying areas, softest first; never repeats an area from hardest. */
  softest: AreaHardness[];
  /** The areas asked for in `areas`, hardest first, when they qualify. */
  picked: AreaHardness[];
  /** Measured districts in the asked-for areas, qualifying or not (London's EC and WC count here). */
  pickedMeasured: number;
  pickedAtOrAbove: number;
  pickedPercent: number;
}

export interface SummaryOptions {
  /** mg/L CaCO3; a district at exactly this value counts as at or above. */
  threshold: number;
  /** How many areas in each of hardest and softest. */
  top?: number;
  /** An area needs this many measured districts before it is named. */
  minDistricts?: number;
  /** Specific areas to report, for example the London postcode areas. */
  areas?: string[];
}

/** "SW1A" -> "SW", "G12" -> "G". Hardness follows supply geography, which tracks the letters. */
export function postcodeAreaOf(district: string): string {
  const upper = district.trim().toUpperCase();
  return upper.match(/^[A-Z]{1,2}/)?.[0] ?? upper;
}

export function medianRounded(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

export function summariseHardness(
  rows: MeasuredDistrict[],
  { threshold, top = 5, minDistricts = 3, areas = [] }: SummaryOptions,
): HardnessSummary | null {
  const clean = rows.filter((r) => r.district && Number.isFinite(r.value) && r.value >= 0);
  if (clean.length === 0) return null;

  const atOrAbove = clean.filter((r) => r.value >= threshold).length;

  const byArea = new Map<string, number[]>();
  for (const r of clean) {
    const area = postcodeAreaOf(r.district);
    const list = byArea.get(area) ?? [];
    list.push(r.value);
    byArea.set(area, list);
  }
  const qualifying: AreaHardness[] = [];
  for (const [area, values] of byArea) {
    if (values.length < minDistricts) continue;
    qualifying.push({ area, name: postcodeAreaName(area), median: medianRounded(values), districts: values.length });
  }
  const hardFirst = [...qualifying].sort((a, b) => b.median - a.median || a.area.localeCompare(b.area));
  const hardest = hardFirst.slice(0, top);
  const taken = new Set(hardest.map((a) => a.area));
  const softest = [...qualifying]
    .sort((a, b) => a.median - b.median || a.area.localeCompare(b.area))
    .filter((a) => !taken.has(a.area))
    .slice(0, top);
  const wanted = new Set(areas.map((a) => a.toUpperCase()));
  const picked = hardFirst.filter((a) => wanted.has(a.area));
  const inWanted = clean.filter((r) => wanted.has(postcodeAreaOf(r.district)));
  const pickedAtOrAbove = inWanted.filter((r) => r.value >= threshold).length;

  return {
    measured: clean.length,
    threshold,
    atOrAbove,
    percent: Math.round((atOrAbove / clean.length) * 100),
    hardest,
    softest,
    picked,
    pickedMeasured: inWanted.length,
    pickedAtOrAbove,
    pickedPercent: inWanted.length ? Math.round((pickedAtOrAbove / inWanted.length) * 100) : 0,
  };
}

/** The London postcode areas, in the order Royal Mail lists them. */
export const LONDON_POSTCODE_AREAS = ["E", "EC", "N", "NW", "SE", "SW", "W", "WC"];
