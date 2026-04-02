/**
 * Safety Score Engine for TapWater.uk
 *
 * Computes a 0-10 safety score from environmental readings.
 * See /about/methodology for the public-facing explanation.
 *
 * Uses dual-layer data: Stream Water Data Portal (drinking water, primary)
 * and EA environmental data (supplementary layer).
 */

import type { ContaminantReading } from "./types";

// ── UK drinking water limits (mg/L unless noted) ──

interface LimitEntry {
  ukLimit: number | null;
  whoGuideline: number | null;
  unit: string;
  tier: 1 | 2 | 3; // Health significance tier
  displayName: string;
}

const LIMITS: Record<string, LimitEntry> = {
  // Tier 1 (weight 3.0) — acute/chronic health risk
  lead: { ukLimit: 0.01, whoGuideline: 0.01, unit: "mg/L", tier: 1, displayName: "Lead" },
  arsenic: { ukLimit: 0.01, whoGuideline: 0.01, unit: "mg/L", tier: 1, displayName: "Arsenic" },
  "e.coli": { ukLimit: 0, whoGuideline: 0, unit: "count/100ml", tier: 1, displayName: "E. coli" },
  coliforms: { ukLimit: 0, whoGuideline: 0, unit: "count/100ml", tier: 1, displayName: "Coliform Bacteria" },

  // Tier 2 (weight 2.0) — significant concern at elevated levels
  nitrate: { ukLimit: 50, whoGuideline: 50, unit: "mg/L", tier: 2, displayName: "Nitrate" },
  nitrite: { ukLimit: 0.5, whoGuideline: 3, unit: "mg/L", tier: 2, displayName: "Nitrite" },
  copper: { ukLimit: 2, whoGuideline: 2, unit: "mg/L", tier: 2, displayName: "Copper" },
  cadmium: { ukLimit: 0.005, whoGuideline: 0.003, unit: "mg/L", tier: 2, displayName: "Cadmium" },
  chromium: { ukLimit: 0.05, whoGuideline: 0.05, unit: "mg/L", tier: 2, displayName: "Chromium" },
  mercury: { ukLimit: 0.001, whoGuideline: 0.006, unit: "mg/L", tier: 2, displayName: "Mercury" },
  ammonia: { ukLimit: 0.5, whoGuideline: null, unit: "mg/L", tier: 2, displayName: "Ammonia" },
  phosphate: { ukLimit: null, whoGuideline: null, unit: "mg/L", tier: 2, displayName: "Phosphate" },
  nickel: { ukLimit: 0.02, whoGuideline: 0.07, unit: "mg/L", tier: 2, displayName: "Nickel" },
  trihalomethanes: { ukLimit: 0.1, whoGuideline: null, unit: "mg/L", tier: 2, displayName: "Trihalomethanes" },
  bromate: { ukLimit: 0.01, whoGuideline: 0.01, unit: "mg/L", tier: 2, displayName: "Bromate" },
  fluoride: { ukLimit: 1.5, whoGuideline: 1.5, unit: "mg/L", tier: 2, displayName: "Fluoride" },
  antimony: { ukLimit: 0.005, whoGuideline: 0.02, unit: "mg/L", tier: 2, displayName: "Antimony" },
  selenium: { ukLimit: 0.04, whoGuideline: 0.04, unit: "mg/L", tier: 2, displayName: "Selenium" },

  // Tier 3 (weight 1.0) — aesthetic/indirect
  iron: { ukLimit: 0.2, whoGuideline: 0.3, unit: "mg/L", tier: 3, displayName: "Iron" },
  manganese: { ukLimit: 0.05, whoGuideline: 0.08, unit: "mg/L", tier: 3, displayName: "Manganese" },
  zinc: { ukLimit: null, whoGuideline: null, unit: "mg/L", tier: 3, displayName: "Zinc" },
  boron: { ukLimit: 1.0, whoGuideline: 2.4, unit: "mg/L", tier: 3, displayName: "Boron" },
  ph: { ukLimit: null, whoGuideline: null, unit: "pH", tier: 3, displayName: "pH" },
  "dissolved oxygen": { ukLimit: null, whoGuideline: null, unit: "mg/L", tier: 3, displayName: "Dissolved Oxygen" },
  temperature: { ukLimit: null, whoGuideline: null, unit: "°C", tier: 3, displayName: "Temperature" },
  turbidity: { ukLimit: 4, whoGuideline: 4, unit: "NTU", tier: 3, displayName: "Turbidity" },
  conductivity: { ukLimit: null, whoGuideline: null, unit: "µS/cm", tier: 3, displayName: "Conductivity" },
  aluminium: { ukLimit: 0.2, whoGuideline: null, unit: "mg/L", tier: 3, displayName: "Aluminium" },
  colour: { ukLimit: 20, whoGuideline: null, unit: "mg/L Pt/Co", tier: 3, displayName: "Colour" },
};

const TIER_WEIGHTS = { 1: 3.0, 2: 2.0, 3: 1.0 };

// ── Normalize EA determinand labels to our lookup keys ──

function normalizeDeterminand(label: string): string | null {
  const lower = label.toLowerCase().trim();

  // Direct matches
  if (LIMITS[lower]) return lower;

  // Common EA label variations
  if (lower.includes("lead") && !lower.includes("mislead")) return "lead";
  if (lower.includes("arsenic")) return "arsenic";
  // Bacteria excluded — EA monitors raw environmental water, not treated tap water.
  // Coliforms/E.coli in rivers are expected; water treatment removes them completely.
  // Will be re-added in Phase 2 with DWI treated-water data.
  if (lower.includes("nitrate") && !lower.includes("nitrite")) return "nitrate";
  if (lower.includes("nitrite")) return "nitrite";
  if (lower.includes("nitrogen, total oxidised")) return "nitrate";
  if (lower.includes("copper")) return "copper";
  if (lower.includes("cadmium")) return "cadmium";
  if (lower.includes("chromium")) return "chromium";
  if (lower.includes("mercury")) return "mercury";
  if (lower.includes("ammonia") || lower.includes("ammoniacal")) return "ammonia";
  if (lower.includes("phosphate") || lower.includes("phosphorus")) return "phosphate";
  if (lower.includes("nickel")) return "nickel";
  if (lower.includes("iron") && !lower.includes("environment")) return "iron";
  if (lower.includes("manganese")) return "manganese";
  if (lower.includes("zinc")) return "zinc";
  if (lower.includes("boron")) return "boron";
  if (lower.startsWith("ph")) return "ph";
  if (lower.includes("dissolved oxygen") || lower === "o diss" || lower.startsWith("oxygen, dissolved")) return "dissolved oxygen";
  if (lower.includes("temp") && !lower.includes("temporal")) return "temperature";
  if (lower.includes("turbidity")) return "turbidity";
  if (lower.includes("conductivity")) return "conductivity";

  // Stream Water Data Portal determinand names
  if (lower.includes("e.coli") || lower.includes("e. coli") || lower.includes("escherichia")) return "e.coli";
  if (lower.includes("coliform") && !lower.includes("e.coli") && !lower.includes("e. coli")) return "coliforms";
  if (lower.includes("trihalomethane")) return "trihalomethanes";
  if (lower.includes("bromate")) return "bromate";
  if (lower.includes("fluoride")) return "fluoride";
  if (lower.includes("antimony")) return "antimony";
  if (lower.includes("selenium")) return "selenium";
  if (lower.includes("aluminium")) return "aluminium";
  if (lower.includes("colour") && !lower.includes("colourless")) return "colour";

  return null;
}

// ── Unit validation & conversion helpers ──

/**
 * Water-compatible units whitelist. Readings in other units (e.g. ug/kg from
 * biota/sediment samples) are not comparable to drinking water limits and
 * must be rejected.
 */
const WATER_UNITS = new Set([
  "mg/l", "µg/l", "ug/l", "μg/l", "?g/l", "ng/l",
  "ph", "ntu", "°c", "cel",
  "µs/cm", "us/cm", "?s/cm", "ms/cm",
  "count/100ml", "no/100ml", "no. /100ml", "no./100ml", "cfu/100ml",
  "mg/l as",  // EA sometimes uses "mg/l as N" etc.
]);

function isWaterUnit(unit: string): boolean {
  const lower = unit.toLowerCase().trim();
  return [...WATER_UNITS].some((wu) => lower.startsWith(wu) || lower.includes("/l"));
}

/**
 * Normalizes the observation value to match the unit expected by the LIMITS entry.
 * EA API sometimes reports metals in µg/L while our limits are in mg/L (factor of 1000).
 */
function normalizeUnit(value: number, obsUnit: string, limitUnit: string): number {
  const obs = obsUnit.toLowerCase();
  const lim = limitUnit.toLowerCase();

  // Handle mangled unicode: ?g/L, µg/L, ug/L, μg/L all mean micrograms/litre
  const obsIsUg = obs.includes("ug") || obs.includes("µg") || obs.includes("μg") || obs.includes("?g");
  const obsIsMg = obs.includes("mg");
  const limIsUg = lim.includes("ug") || lim.includes("µg") || lim.includes("μg");
  const limIsMg = lim.includes("mg");

  if (obsIsUg && limIsMg) {
    return value / 1000;
  }
  if (obsIsMg && limIsUg) {
    return value * 1000;
  }

  return value;
}

// ── Score computation ──

export interface ScoredReading extends ContaminantReading {
  tier: 1 | 2 | 3;
  parameterScore: number;
}

export interface ScoreResult {
  safetyScore: number;
  scoreGrade: "excellent" | "good" | "fair" | "poor" | "very-poor" | "insufficient-data";
  readings: ContaminantReading[];
  contaminantsTested: number;
  contaminantsFlagged: number;
  pfasDetected: boolean;
  pfasLevel: number | null;
}

// Determinands that should only be scored from drinking water (Stream) data,
// NOT from EA environmental monitoring. Bacteria in rivers are expected and normal.
const DRINKING_WATER_ONLY = new Set(["e.coli", "coliforms"]);

export function computeScore(
  observations: { determinand: string; value: number; unit: string; date: string }[],
  source: "drinking" | "environmental" = "drinking",
): ScoreResult {
  // Deduplicate: keep most recent per determinand, rejecting non-water units.
  // The dedup naturally keeps the freshest reading — no hard cutoff needed.
  // We only flag staleness in the output, not by filtering data out entirely,
  // so the site never goes empty even if no new data arrives for years.
  const latest = new Map<string, { value: number; unit: string; date: string }>();
  for (const obs of observations) {
    // Skip biota/sediment readings (ug/kg, mg/kg, %, g, UNITLESS, etc.)
    if (!isWaterUnit(obs.unit)) continue;

    const key = normalizeDeterminand(obs.determinand);
    if (!key) continue;
    // Skip bacteria from EA environmental data (expected in rivers, not meaningful for tap water)
    if (source === "environmental" && DRINKING_WATER_ONLY.has(key)) continue;
    const existing = latest.get(key);
    if (!existing || obs.date > existing.date) {
      latest.set(key, { value: obs.value, unit: obs.unit, date: obs.date });
    }
  }

  // Score each parameter
  const readings: ContaminantReading[] = [];
  let weightedSum = 0;
  let totalWeight = 0;
  let flagged = 0;

  for (const [key, obs] of latest.entries()) {
    const limits = LIMITS[key];
    if (!limits) continue;

    // Normalize value to the unit used in LIMITS before comparing
    const normalizedValue = normalizeUnit(obs.value, obs.unit, limits.unit);

    const limit = limits.ukLimit ?? limits.whoGuideline;
    let paramScore = 10;
    let status: "pass" | "warning" | "fail" = "pass";

    if (limit !== null && limit > 0) {
      const ratio = normalizedValue / limit;
      paramScore = Math.max(0, Math.min(10, 10 * (1 - ratio)));

      if (ratio > 1) {
        status = "fail";
        flagged++;
      } else if (ratio > 0.75) {
        status = "warning";
        flagged++;
      }
    } else if (limit === 0) {
      // Zero tolerance (e.g., E. coli)
      paramScore = normalizedValue === 0 ? 10 : 0;
      if (normalizedValue > 0) {
        status = "fail";
        flagged++;
      }
    }

    // Skip zinc from weighted scoring (informational only — no meaningful limits)
    if (key !== "zinc") {
      const weight = TIER_WEIGHTS[limits.tier];
      weightedSum += paramScore * weight;
      totalWeight += weight;
    }

    readings.push({
      name: limits.displayName,
      value: normalizedValue,
      unit: limits.unit,
      ukLimit: limits.ukLimit,
      whoGuideline: limits.whoGuideline,
      status,
    });
  }

  // Check PFAS in raw observations (water units only)
  let pfasDetected = false;
  let pfasLevel: number | null = null;
  for (const obs of observations) {
    if (!isWaterUnit(obs.unit)) continue;
    const lower = obs.determinand.toLowerCase();
    if (
      lower.includes("perfluoro") ||
      lower.includes("pfos") ||
      lower.includes("pfoa") ||
      lower.includes("pfas")
    ) {
      pfasDetected = true;
      if (pfasLevel === null || obs.value > pfasLevel) {
        pfasLevel = obs.value;
      }
    }
  }

  if (pfasDetected && pfasLevel !== null) {
    readings.push({
      name: "PFAS (total)",
      value: pfasLevel,
      unit: "µg/L",
      ukLimit: null,
      whoGuideline: 0.1,
      status: pfasLevel > 0.075 ? "warning" : "pass",
      isPfas: true,
    });
  }

  // Compute final score
  let safetyScore: number;
  let scoreGrade: ScoreResult["scoreGrade"];

  // Count how many parameters actually contributed to the score
  const scoredCount = readings.filter((r) => {
    const limit = r.ukLimit ?? r.whoGuideline;
    return limit !== null;
  }).length;

  if (totalWeight === 0 || scoredCount < 2) {
    // Not enough data for a meaningful score
    safetyScore = -1;
    scoreGrade = "insufficient-data";
  } else {
    const rawScore = weightedSum / totalWeight;
    safetyScore = Math.round(rawScore * 10) / 10;
    scoreGrade =
      safetyScore >= 9
        ? "excellent"
        : safetyScore >= 7
          ? "good"
          : safetyScore >= 5
            ? "fair"
            : safetyScore >= 3
              ? "poor"
              : "very-poor";
  }

  // Sort readings: flagged first, then by tier
  readings.sort((a, b) => {
    if (a.status !== "pass" && b.status === "pass") return -1;
    if (a.status === "pass" && b.status !== "pass") return 1;
    return 0;
  });

  return {
    safetyScore,
    scoreGrade,
    readings,
    contaminantsTested: readings.length,
    contaminantsFlagged: flagged,
    pfasDetected,
    pfasLevel,
  };
}
