/**
 * One set of readings for a district from the Thames Water zone reports it
 * falls in.
 *
 * Thames publishes results per supply zone, and a postcode district usually
 * spans more than one zone. scripts/map-thames-zones.ts asks Thames's own
 * lookup which zone a handful of real postcodes in the district belong to; the
 * district's figure for each parameter is the average of its zones' figures,
 * weighted by how many of those postcodes fell in each zone.
 *
 * Pure: no database, no network. Used by scripts/import-thames-water.ts.
 */

export interface ZoneValue {
  value: number;
  below_limit: boolean;
}

export interface ZoneReportParameter {
  parameter: string;
  unit: string;
  regulatory_limit: string | null;
  mean: ZoneValue | null;
  max: ZoneValue | null;
  total_samples: number | null;
}

export interface ZoneReport {
  mapCode: string;
  zone_name?: string;
  year: number;
  parameters: ZoneReportParameter[];
}

export interface BlendedReading {
  determinand: string;
  value: number;
  unit: string;
  ukLimit: number | null;
}

export interface DistrictBlend {
  readings: BlendedReading[];
  /** Zones used, largest share first. Share is a percentage of the answers that named a held zone. */
  zones: { code: string; name: string; share: number }[];
  /** The year the reports cover. */
  year: number;
  /** Samples behind the readings, summed over the zones used. */
  sampleCount: number;
}

/** A zone's figure for one parameter: the year's mean, or the maximum where no mean is reported (bacteria counts). */
function figure(p: ZoneReportParameter): number | null {
  return p.mean?.value ?? p.max?.value ?? null;
}

/** Four significant figures: enough for 0.0004 µg/l and for 312 mg/l, without float noise. */
function tidy(n: number): number {
  return n === 0 ? 0 : Number(n.toPrecision(4));
}

/**
 * Blend the zone reports a district falls in.
 *
 * `weights` is zone code → how many sampled postcodes Thames placed in it.
 * Zones we hold no report for are left out and the rest re-weighted. Returns
 * null when none of the named zones has a report.
 */
export function blendZones(reports: Map<string, ZoneReport>, weights: Record<string, number>): DistrictBlend | null {
  const used = Object.entries(weights)
    .filter(([code, n]) => n > 0 && reports.has(code))
    .map(([code, n]) => ({ report: reports.get(code) as ZoneReport, weight: n }))
    .sort((a, b) => b.weight - a.weight || a.report.mapCode.localeCompare(b.report.mapCode));
  if (used.length === 0) return null;
  const total = used.reduce((s, u) => s + u.weight, 0);

  // Parameters in the order the largest zone lists them, then any only a smaller zone has.
  const order: string[] = [];
  for (const u of used) for (const p of u.report.parameters) if (!order.includes(p.parameter)) order.push(p.parameter);

  const readings: BlendedReading[] = [];
  let sampleCount = 0;
  for (const name of order) {
    let sum = 0;
    let weight = 0;
    let unit: string | null = null;
    let limit: number | null = null;
    for (const u of used) {
      const p = u.report.parameters.find((x) => x.parameter === name);
      const v = p ? figure(p) : null;
      if (!p || v == null) continue;
      // A zone reporting the same parameter in another unit cannot be averaged in.
      if (unit != null && p.unit !== unit) continue;
      unit = p.unit;
      if (limit == null && p.regulatory_limit) {
        const parsed = parseFloat(p.regulatory_limit);
        if (Number.isFinite(parsed)) limit = parsed;
      }
      sum += v * u.weight;
      weight += u.weight;
      sampleCount += p.total_samples ?? 0;
    }
    if (weight === 0 || unit == null) continue;
    readings.push({ determinand: name, value: tidy(sum / weight), unit, ukLimit: limit });
  }
  if (readings.length === 0) return null;

  return {
    readings,
    zones: used.map((u) => ({ code: u.report.mapCode, name: u.report.zone_name ?? u.report.mapCode, share: Math.round((u.weight / total) * 100) })),
    year: Math.max(...used.map((u) => u.report.year)),
    sampleCount,
  };
}

/** "Reading Central" for one zone, "Esher and Chessington and 2 other zones" for several. */
export function zoneLabel(zones: DistrictBlend["zones"]): string {
  if (zones.length === 0) return "";
  if (zones.length === 1) return zones[0].name;
  return `${zones[0].name} and ${zones.length - 1} other zone${zones.length === 2 ? "" : "s"}`;
}
