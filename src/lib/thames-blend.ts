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
  min?: ZoneValue | null;
  mean: ZoneValue | null;
  max: ZoneValue | null;
  total_samples: number | null;
  /** How many of the year's samples broke the limit. */
  contraventions?: number | null;
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

/**
 * A zone's figure for one parameter: the year's mean, with two exceptions.
 *
 * Bacteria counts (limit of zero). Thames gives no mean for them, only the
 * lowest and highest sample of the year; Scottish Water gives a mean such as
 * 0.01, which is one positive sample in 156. Either way the reading used to be
 * "above zero", which marked 122 of 264 Thames districts and 99 Scottish ones
 * as failing for coliform bacteria on the strength of a single sample each.
 * The figure is the typical sample instead: the lowest value, unless at least
 * half of the year's samples broke the limit. That matches the other
 * companies, where the reading is the latest sample.
 *
 * And one lone outlier: see withoutLoneOutlier.
 *
 * Exported for the Scottish Water import, whose zone reports have the same shape.
 */
export function zoneFigure(p: ZoneReportParameter): number | null {
  const failed = p.contraventions ?? 0;
  const limit = p.regulatory_limit != null && p.regulatory_limit !== "" ? parseFloat(p.regulatory_limit) : NaN;
  const mostlyFailing = p.total_samples != null && p.total_samples > 0 && failed * 2 >= p.total_samples;
  // A count of organisms: a limit of zero, no mean at all, or a unit "per 100 ml"
  // (Scottish reports leave the limit column empty for bacteria).
  const isCount = limit === 0 || !p.mean || /\/\s*100\s*ml/i.test(p.unit);
  if (isCount) {
    if (mostlyFailing) return p.mean?.value ?? p.max?.value ?? p.min?.value ?? null;
    return p.min?.value ?? p.mean?.value ?? p.max?.value ?? null;
  }
  return withoutLoneOutlier(p, failed) ?? (p.mean as ZoneValue).value;
}

/**
 * The mean of a zone's other samples when exactly one sample broke the limit and
 * that one sample alone pushes the year's mean over it.
 *
 * Lead and nickel come from a home's own pipes and taps. Zone SLE25 had nine
 * lead samples in 2025: one at 562 µg/l, the mean 63.6. The other eight average
 * 1.3. Reporting 63.6 as the district's lead level told three districts their
 * water had six times the legal limit. The report gives the count, the mean and
 * the highest value, so the mean without the highest is exact, not an estimate.
 * Null when the rule does not apply.
 */
function withoutLoneOutlier(p: ZoneReportParameter, failed: number): number | null {
  const limit = p.regulatory_limit ? parseFloat(p.regulatory_limit) : NaN;
  const n = p.total_samples ?? 0;
  if (!p.mean || !p.max || failed !== 1 || n < 3 || !Number.isFinite(limit)) return null;
  if (p.mean.value <= limit) return null;
  const rest = (p.mean.value * n - p.max.value) / (n - 1);
  // Rounding in the report can push this a hair below zero.
  return rest <= limit ? Math.max(0, rest) : null;
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
      const v = p ? zoneFigure(p) : null;
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
