/**
 * The hard water line in the building regulations guidance for England.
 *
 * Approved Document L, Volume 1: Dwellings (2021 edition incorporating 2023
 * amendments), read from the gov.uk PDF on 17 November 2026:
 *
 *   Paragraph 8.8: "In hard water areas, suitable measures should be taken to
 *   treat the feed water to water heaters and the hot water circuit of
 *   combination boilers to reduce limescale accumulation."
 *
 *   Appendix A, key terms: "For the purposes of this approved document, hard
 *   water is water that has a total water hardness of greater than 200ppm of
 *   CaCO3."
 *
 * 1 ppm of CaCO3 is 1 mg/L as calcium carbonate, the unit our readings use.
 * Pure, so the rule and the packing are unit-tested.
 */

export const PART_L_HARD_WATER_PPM = 200;
export const PART_L_SOURCE_URL = "https://www.gov.uk/government/publications/conservation-of-fuel-and-power-approved-document-l";
export const PART_L_PARAGRAPH =
  "In hard water areas, suitable measures should be taken to treat the feed water to water heaters and the hot water circuit of combination boilers to reduce limescale accumulation.";
export const PART_L_DEFINITION =
  "For the purposes of this approved document, hard water is water that has a total water hardness of greater than 200ppm of CaCO3.";

/** Greater than 200, as the document words it: exactly 200 is not over the line. */
export function isOverPartLLine(mgPerLitre: number): boolean {
  return mgPerLitre > PART_L_HARD_WATER_PPM;
}

export interface PartLDistrict {
  district: string;
  value: number;
  /** "m" a reading for the district, "e" its postcode area's median, "a" a supply-zone figure matched approximately. */
  basis: "m" | "e" | "a";
}

/** "RG1:295a,CB1:330e,IP1:402m": small enough to ship in the page for an instant check. */
export function packDistricts(rows: PartLDistrict[]): string {
  return rows.map((r) => `${r.district.toUpperCase()}:${Math.round(r.value)}${r.basis}`).join(",");
}

export function unpackDistricts(packed: string): Map<string, PartLDistrict> {
  const out = new Map<string, PartLDistrict>();
  for (const part of packed.split(",")) {
    const m = /^([A-Z0-9]+):(\d+)([mea])$/.exec(part);
    if (m) out.set(m[1], { district: m[1], value: Number(m[2]), basis: m[3] as PartLDistrict["basis"] });
  }
  return out;
}

export interface PartLAreaRow {
  area: string;
  /** Districts in the area with a reading of their own. */
  measured: number;
  over: number;
  median: number;
}

export interface PartLSummary {
  measured: number;
  over: number;
  /** Postcode areas where every measured district is over the line, largest first. */
  areas: PartLAreaRow[];
}

const areaOf = (district: string) => district.toUpperCase().replace(/[0-9].*$/, "");

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Counts from readings only: an area-median estimate says nothing about one district. */
export function summarisePartL(rows: PartLDistrict[]): PartLSummary {
  const measured = rows.filter((r) => r.basis !== "e");
  const byArea = new Map<string, number[]>();
  for (const r of measured) byArea.set(areaOf(r.district), [...(byArea.get(areaOf(r.district)) ?? []), r.value]);
  const areas = [...byArea]
    .map(([area, values]) => ({ area, measured: values.length, over: values.filter(isOverPartLLine).length, median: Math.round(median(values)) }))
    .filter((a) => a.over > 0)
    .sort((a, b) => b.over - a.over || b.median - a.median);
  return { measured: measured.length, over: measured.filter((r) => isOverPartLLine(r.value)).length, areas };
}
