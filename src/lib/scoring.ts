/**
 * Safety Score Engine for TapWater.uk
 *
 * Computes a 0-10 safety score from environmental readings.
 * See /about/methodology for the public-facing explanation.
 *
 * Phase 1: Uses EA environmental data only (supplementary layer).
 * Phase 2: Will incorporate DWI drinking water data (primary layer, 80% weight).
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
  arsenic: { ukLimit: 0.01, whoGuideline: 0.01, unit: "µg/L", tier: 1, displayName: "Arsenic" },
  "e coli": { ukLimit: 0, whoGuideline: 0, unit: "count/100ml", tier: 1, displayName: "E. coli" },
  "coliform bacteria": { ukLimit: 0, whoGuideline: 0, unit: "count/100ml", tier: 1, displayName: "Coliform bacteria" },

  // Tier 2 (weight 2.0) — significant concern at elevated levels
  nitrate: { ukLimit: 50, whoGuideline: 50, unit: "mg/L", tier: 2, displayName: "Nitrate" },
  nitrite: { ukLimit: 0.5, whoGuideline: 3, unit: "mg/L", tier: 2, displayName: "Nitrite" },
  copper: { ukLimit: 2, whoGuideline: 2, unit: "mg/L", tier: 2, displayName: "Copper" },
  cadmium: { ukLimit: 0.005, whoGuideline: 0.003, unit: "mg/L", tier: 2, displayName: "Cadmium" },
  chromium: { ukLimit: 0.05, whoGuideline: 0.05, unit: "mg/L", tier: 2, displayName: "Chromium" },
  mercury: { ukLimit: 0.001, whoGuideline: 0.006, unit: "mg/L", tier: 2, displayName: "Mercury" },
  ammonia: { ukLimit: 0.5, whoGuideline: null, unit: "mg/L", tier: 2, displayName: "Ammonia" },
  phosphate: { ukLimit: null, whoGuideline: null, unit: "mg/L", tier: 2, displayName: "Phosphate" },

  // Tier 3 (weight 1.0) — aesthetic/indirect
  iron: { ukLimit: 0.2, whoGuideline: 0.3, unit: "mg/L", tier: 3, displayName: "Iron" },
  manganese: { ukLimit: 0.05, whoGuideline: 0.08, unit: "mg/L", tier: 3, displayName: "Manganese" },
  zinc: { ukLimit: null, whoGuideline: null, unit: "mg/L", tier: 3, displayName: "Zinc" },
  ph: { ukLimit: null, whoGuideline: null, unit: "pH", tier: 3, displayName: "pH" },
  "dissolved oxygen": { ukLimit: null, whoGuideline: null, unit: "mg/L", tier: 3, displayName: "Dissolved Oxygen" },
  temperature: { ukLimit: null, whoGuideline: null, unit: "°C", tier: 3, displayName: "Temperature" },
  turbidity: { ukLimit: 4, whoGuideline: 4, unit: "NTU", tier: 3, displayName: "Turbidity" },
  conductivity: { ukLimit: null, whoGuideline: null, unit: "µS/cm", tier: 3, displayName: "Conductivity" },
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
  if (lower.includes("e.coli") || lower.includes("e coli") || lower === "escherichia coli") return "e coli";
  if (lower.includes("coliform")) return "coliform bacteria";
  if (lower.includes("nitrate") && !lower.includes("nitrite")) return "nitrate";
  if (lower.includes("nitrite")) return "nitrite";
  if (lower.includes("copper")) return "copper";
  if (lower.includes("cadmium")) return "cadmium";
  if (lower.includes("chromium")) return "chromium";
  if (lower.includes("mercury")) return "mercury";
  if (lower.includes("ammonia") || lower.includes("ammoniacal")) return "ammonia";
  if (lower.includes("phosphate") || lower.includes("phosphorus")) return "phosphate";
  if (lower.includes("iron") && !lower.includes("environment")) return "iron";
  if (lower.includes("manganese")) return "manganese";
  if (lower.includes("zinc")) return "zinc";
  if (lower === "ph" || lower === "p h") return "ph";
  if (lower.includes("dissolved oxygen") || lower === "o diss") return "dissolved oxygen";
  if (lower.includes("temp") && !lower.includes("temporal")) return "temperature";
  if (lower.includes("turbidity")) return "turbidity";
  if (lower.includes("conductivity")) return "conductivity";

  return null;
}

// ── Score computation ──

export interface ScoredReading extends ContaminantReading {
  tier: 1 | 2 | 3;
  parameterScore: number;
}

export interface ScoreResult {
  safetyScore: number;
  scoreGrade: "excellent" | "good" | "fair" | "poor" | "very-poor";
  readings: ContaminantReading[];
  contaminantsTested: number;
  contaminantsFlagged: number;
  pfasDetected: boolean;
  pfasLevel: number | null;
}

export function computeScore(
  observations: { determinand: string; value: number; unit: string; date: string }[]
): ScoreResult {
  // Deduplicate: keep most recent per determinand
  const latest = new Map<string, { value: number; unit: string; date: string }>();
  for (const obs of observations) {
    const key = normalizeDeterminand(obs.determinand);
    if (!key) continue;
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

    const limit = limits.ukLimit ?? limits.whoGuideline;
    let paramScore = 10;
    let status: "pass" | "warning" | "fail" = "pass";

    if (limit !== null && limit > 0) {
      const ratio = obs.value / limit;
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
      paramScore = obs.value === 0 ? 10 : 0;
      if (obs.value > 0) {
        status = "fail";
        flagged++;
      }
    }

    const weight = TIER_WEIGHTS[limits.tier];
    weightedSum += paramScore * weight;
    totalWeight += weight;

    readings.push({
      name: limits.displayName,
      value: obs.value,
      unit: limits.unit,
      ukLimit: limits.ukLimit,
      whoGuideline: limits.whoGuideline,
      status,
    });
  }

  // Check PFAS in raw observations
  let pfasDetected = false;
  let pfasLevel: number | null = null;
  for (const obs of observations) {
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
  const rawScore = totalWeight > 0 ? weightedSum / totalWeight : 7.5; // default if no data
  const safetyScore = Math.round(rawScore * 10) / 10;

  const scoreGrade =
    safetyScore >= 9
      ? "excellent"
      : safetyScore >= 7
        ? "good"
        : safetyScore >= 5
          ? "fair"
          : safetyScore >= 3
            ? "poor"
            : "very-poor";

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
