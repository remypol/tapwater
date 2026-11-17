/**
 * Town pages for water hardness: "Water hardness in Wokingham".
 *
 * People search by town, and our hardness pages were organised by postcode
 * area, so a search for Wokingham landed on a postcode page far down the
 * results. A town page groups the districts Royal Mail assigns to that post
 * town and reports only readings we actually hold.
 *
 * Pure, so the rules about which towns get a page are unit-tested.
 */

import type { PostTown } from "@/data/post-towns";
import { POSTCODE_AREA_NAMES } from "./postcode-areas";

export interface TownDistrict {
  district: string;
  /** Local authority the district sits in, for the table. */
  areaName: string;
  value: number;
  /** False when the figure is the postcode area's median, not a reading for this district. */
  measured: boolean;
}

export interface HardnessTown {
  slug: string;
  /** "Wokingham", or "Whitchurch, Hampshire" where two towns share a name. */
  name: string;
  town: string;
  county: string;
  /** Postcode area, "RG". */
  area: string;
  /** Hardest first. */
  districts: TownDistrict[];
  measuredCount: number;
  /** Median of the measured districts only, mg/L as calcium carbonate. */
  median: number;
  min: number;
  max: number;
}

export interface TownSourceDistrict {
  district: string;
  areaName: string;
  value: number;
  measured: boolean;
}

export function townSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

const sameName = (a: string, b: string) => townSlug(a) === townSlug(b);

/**
 * The towns that get a page.
 *
 * Left out on purpose:
 * - London: it spans eight postcode areas, each with its own page.
 * - The town a postcode area is named after (Reading for RG): /hardness/rg
 *   already answers "is Reading a hard water area", and two pages for one
 *   question compete with each other.
 * - Towns with no district of their own measured: a page built only from the
 *   area median would say nothing the area page does not.
 * - Any slug of one or two letters, which is reserved for postcode areas.
 */
export function buildHardnessTowns(postTowns: PostTown[], districts: TownSourceDistrict[]): HardnessTown[] {
  const byDistrict = new Map(districts.map((d) => [d.district.toUpperCase(), d]));

  // Merge rows that are the same town listed under one area more than once.
  const merged = new Map<string, PostTown>();
  for (const row of postTowns) {
    const key = `${townSlug(row.town)}|${townSlug(row.county)}|${row.area}`;
    const existing = merged.get(key);
    if (existing) existing.districts = [...new Set([...existing.districts, ...row.districts])];
    else merged.set(key, { ...row, districts: [...row.districts] });
  }

  const nameCounts = new Map<string, number>();
  for (const row of merged.values()) nameCounts.set(townSlug(row.town), (nameCounts.get(townSlug(row.town)) ?? 0) + 1);

  const towns: HardnessTown[] = [];
  const usedSlugs = new Set<string>();
  for (const row of merged.values()) {
    if (sameName(row.town, "London")) continue;
    const areaNamesake = POSTCODE_AREA_NAMES[row.area];
    if (areaNamesake && sameName(row.town, areaNamesake)) continue;

    const mine: TownDistrict[] = [];
    for (const code of row.districts) {
      const d = byDistrict.get(code.toUpperCase());
      if (d) mine.push({ district: d.district, areaName: d.areaName, value: Math.round(d.value), measured: d.measured });
    }
    const measured = mine.filter((d) => d.measured);
    if (measured.length === 0) continue;

    const duplicateName = (nameCounts.get(townSlug(row.town)) ?? 0) > 1;
    const name = duplicateName && row.county ? `${row.town}, ${row.county}` : row.town;
    let slug = townSlug(name);
    if (slug.length <= 2 || usedSlugs.has(slug)) slug = townSlug(`${row.town} ${row.area}`);
    if (slug.length <= 2 || usedSlugs.has(slug)) continue;
    usedSlugs.add(slug);

    const values = measured.map((d) => d.value);
    towns.push({
      slug,
      name,
      town: row.town,
      county: row.county,
      area: row.area,
      districts: mine.sort((a, b) => b.value - a.value || a.district.localeCompare(b.district)),
      measuredCount: measured.length,
      median: Math.round(median(values)),
      min: Math.min(...values),
      max: Math.max(...values),
    });
  }
  return towns.sort((a, b) => a.name.localeCompare(b.name));
}

/** Other towns in the same postcode area, closest in hardness first, for the "nearby" links. */
export function nearbyTowns(town: HardnessTown, all: HardnessTown[], limit = 6): HardnessTown[] {
  return all
    .filter((t) => t.area === town.area && t.slug !== town.slug)
    .sort((a, b) => Math.abs(a.median - town.median) - Math.abs(b.median - town.median) || a.name.localeCompare(b.name))
    .slice(0, limit);
}
