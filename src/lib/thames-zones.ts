/**
 * Which Thames Water supply zones each postcode district falls in.
 *
 * Thames publishes its test results per supply zone, not per postcode. Until
 * November 2026 zone results were handed to districts in rotation within a
 * part of London, from a hand-written list that also held 165 districts Thames
 * does not supply. Now:
 *
 * - a district is Thames's when Ofwat's map gives Thames the largest share
 *   (src/data/district-suppliers.json);
 * - its zones are the ones Thames's own lookup named for real postcodes there
 *   (scripts/map-thames-zones.ts, joined up by scripts/build-thames-zone-map.ts).
 *
 * Thames's lookup cannot answer five-character postcodes, so E1 to E9, N1 to
 * N9 and W2 to W9 borrow the zones of their nearest neighbours. Those are
 * marked approximate: pages say so, and they are left out of rankings.
 */
import zoneMap from "../data/thames-zone-map.json";

export interface ThamesDistrictZones {
  /** Zone code → weight: how many sampled postcodes fell in it, or a share when borrowed. */
  zones: Record<string, number>;
  /** Present when the zones were borrowed: the neighbouring districts they came from. */
  approx?: string[];
}

const MAP = zoneMap as unknown as Record<string, ThamesDistrictZones>;

/** scrape_log source written by the monthly check (src/app/api/cron/thames-water). */
export const THAMES_CHECK_SOURCE = "thames-water-check";

/** Every district Thames Water mainly supplies and we know zones for. */
export const THAMES_DISTRICTS: string[] = Object.keys(MAP);

/** Zones for a district, or null when Thames is not its main supplier. */
export function getThamesZones(district: string): ThamesDistrictZones | null {
  return MAP[district.trim().toUpperCase()] ?? null;
}

/**
 * True for the Thames districts whose zones were borrowed from neighbours.
 * Their figures describe the surrounding area, not a zone Thames confirmed for
 * the district, so they may not be presented as the district's own reading.
 */
export function isThamesApproximateDistrict(district: string): boolean {
  return MAP[district.trim().toUpperCase()]?.approx != null;
}

/** Every zone code some district needs a report for. */
export function thamesZoneCodes(): string[] {
  return [...new Set(Object.values(MAP).flatMap((e) => Object.keys(e.zones)))].sort();
}
