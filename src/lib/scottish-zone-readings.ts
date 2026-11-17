/**
 * One figure per parameter from a Scottish Water zone report, for the import
 * script and the monthly job. Pure: no database, no network.
 *
 * Uses the same rule as the Thames zone reports (zoneFigure): the year's mean,
 * except that a bacteria count is the typical sample, not a mean dragged above
 * zero by one positive sample in a hundred and fifty.
 */
import type { ParsedScottishZone } from "./scottish-pdf-parser";
import { zoneFigure } from "./thames-blend";

export interface ScottishReading {
  determinand: string;
  value: number;
  unit: string;
  ukLimit: number | null;
}

/**
 * The report parser sometimes glues the odour and taste rows onto the front
 * of the pH row's name ("Odour 40 0 Dilution number 0 0 0 0 Taste … Hydrogen ion (pH)").
 */
function cleanName(name: string): string {
  const ph = name.match(/Hydrogen ion \(pH\)\s*$/);
  return ph ? "Hydrogen ion (pH)" : name.trim();
}

export function scottishZoneReadings(zone: ParsedScottishZone): ScottishReading[] {
  const out: ScottishReading[] = [];
  for (const p of zone.parameters) {
    const samples = p.total_samples ?? 0;
    const value = zoneFigure({
      parameter: p.parameter,
      unit: p.unit,
      regulatory_limit: p.regulatory_limit,
      min: p.min,
      mean: p.mean,
      max: p.max,
      total_samples: p.total_samples,
      // The report gives the share of samples that failed, not the count.
      contraventions: Math.round(((p.fail_percent ?? 0) / 100) * samples),
    });
    if (value == null) continue;
    const limit = p.regulatory_limit ? parseFloat(p.regulatory_limit) : NaN;
    out.push({ determinand: cleanName(p.parameter), value, unit: p.unit, ukLimit: Number.isFinite(limit) && limit !== 0 ? limit : null });
  }
  return out;
}
