/**
 * Hardness as calcium carbonate for companies that publish it as calcium.
 *
 * Southern Water's samples carry "HARDNESS (TOTAL)" in mg/l of calcium, not of
 * calcium carbonate (it equals CALCIUM + MAGNESIUM × 40.08/24.31 on the same
 * sample; see stream-sources.ts). Everything else on the site, and every
 * hardness scale people know, is in mg/l as CaCO3. One gram of calcium is the
 * same hardness as 100.09/40.08 grams of calcium carbonate, so the conversion
 * is exact: Brighton's 113 mg/l as calcium is 282 mg/l as CaCO3, very hard.
 *
 * Pure: no database, no network.
 */

/** Molar mass of calcium carbonate over that of calcium. */
export const CALCIUM_TO_CACO3 = 100.09 / 40.08;
/** The name the rest of the site reads hardness under. */
export const HARDNESS_AS_CACO3 = "Hardness (Total) as CaCO3";
/** source_ref of a derived row, so it can be found and replaced. */
export const DERIVED_HARDNESS_REF = "derived:hardness-as-caco3";
/** Samples older than this, counted back from the newest one, are left out. */
const WINDOW_MONTHS = 24;
/** Fewer samples than this is too thin to call a district's hardness. */
const MIN_SAMPLES = 3;

export interface HardnessSample {
  determinand: string;
  value: number;
  sampleDate: string;
}

export interface DerivedHardness {
  /** mg/l as CaCO3, rounded to a whole number. */
  value: number;
  /** Date of the newest sample used. */
  sampleDate: string;
  samples: number;
}

/**
 * Mean hardness of the last two years of samples, converted to CaCO3.
 * `determinand` is the company's exact name for hardness as calcium.
 * Null when there are too few samples.
 */
export function deriveHardnessAsCaCO3(records: HardnessSample[], determinand: string): DerivedHardness | null {
  const samples = records.filter((r) => r.determinand === determinand && Number.isFinite(r.value) && r.value > 0 && r.sampleDate);
  if (samples.length === 0) return null;
  const newest = samples.reduce((a, b) => (a.sampleDate > b.sampleDate ? a : b)).sampleDate;
  const cutoff = new Date(`${newest}T00:00:00Z`);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - WINDOW_MONTHS);
  const from = cutoff.toISOString().slice(0, 10);
  const recent = samples.filter((r) => r.sampleDate >= from);
  if (recent.length < MIN_SAMPLES) return null;
  const mean = recent.reduce((s, r) => s + r.value, 0) / recent.length;
  return { value: Math.round(mean * CALCIUM_TO_CACO3), sampleDate: newest, samples: recent.length };
}
