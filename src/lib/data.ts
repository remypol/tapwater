/**
 * Data layer for TapWater.uk
 *
 * Phase 1: Reads from seed JSON files (static data)
 * Phase 2: Will query Supabase directly
 */

import seedData from "@/data/seed-postcodes.json";
import { computeScore, type ScoreResult } from "./scoring";
import type { PostcodeData } from "./types";

// ── Water supplier mapping (simplified Phase 1) ──

const SUPPLIER_MAP: Record<string, { name: string; id: string }> = {
  Westminster: { name: "Thames Water", id: "thames-water" },
  Southwark: { name: "Thames Water", id: "thames-water" },
  Greenwich: { name: "Thames Water", id: "thames-water" },
  Hackney: { name: "Thames Water", id: "thames-water" },
  "Tower Hamlets": { name: "Thames Water", id: "thames-water" },
  Camden: { name: "Thames Water", id: "thames-water" },
  "Kensington and Chelsea": { name: "Thames Water", id: "thames-water" },
  "Hammersmith and Fulham": { name: "Thames Water", id: "thames-water" },
  Barnet: { name: "Thames Water", id: "thames-water" },
  Manchester: { name: "United Utilities", id: "united-utilities" },
  Salford: { name: "United Utilities", id: "united-utilities" },
  Liverpool: { name: "United Utilities", id: "united-utilities" },
  Birmingham: { name: "Severn Trent", id: "severn-trent" },
  Nottingham: { name: "Severn Trent", id: "severn-trent" },
  Leeds: { name: "Yorkshire Water", id: "yorkshire-water" },
  Sheffield: { name: "Yorkshire Water", id: "yorkshire-water" },
  "Bristol, City of": { name: "Bristol Water", id: "bristol-water" },
  "North Somerset": { name: "Bristol Water", id: "bristol-water" },
  "Newcastle upon Tyne": { name: "Northumbrian Water", id: "northumbrian-water" },
  Oxford: { name: "Thames Water", id: "thames-water" },
  Cambridge: { name: "Anglian Water", id: "anglian-water" },
  "City of Edinburgh": { name: "Scottish Water", id: "scottish-water" },
  Cardiff: { name: "Dŵr Cymru Welsh Water", id: "welsh-water" },
};

function getSupplier(city: string): { name: string; id: string } {
  return SUPPLIER_MAP[city] ?? { name: "Unknown", id: "unknown" };
}

// ── Build scored data from seed ──

interface SeedEntry {
  district: string;
  areaName: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
  samplingPointCount: number;
  recentObservations: number;
  pfasDetected: boolean;
  topReadings: {
    determinand: string;
    value: number;
    unit: string;
    date: string;
    samplingPoint: string;
  }[];
}

const typed = seedData as SeedEntry[];

// Precompute all postcode data at module load
const postcodeCache = new Map<string, PostcodeData>();

for (const entry of typed) {
  const supplier = getSupplier(entry.city);

  // Compute score from observations
  const observations = entry.topReadings.map((r) => ({
    determinand: r.determinand,
    value: r.value,
    unit: r.unit,
    date: r.date,
  }));

  const score: ScoreResult = computeScore(observations);

  // Find nearby postcodes (same city or geographically close)
  const nearby = typed
    .filter(
      (other) =>
        other.district !== entry.district &&
        (other.city === entry.city ||
          Math.abs(other.latitude - entry.latitude) < 0.05)
    )
    .map((o) => o.district)
    .slice(0, 10);

  const data: PostcodeData = {
    district: entry.district,
    areaName: entry.areaName,
    city: entry.city,
    region: entry.region,
    supplier: supplier.name,
    supplierId: supplier.id,
    supplyZone: `${entry.city} Central`,
    safetyScore: score.safetyScore,
    scoreGrade: score.scoreGrade,
    contaminantsTested: score.contaminantsTested,
    contaminantsFlagged: score.contaminantsFlagged,
    pfasDetected: score.pfasDetected,
    pfasLevel: score.pfasLevel,
    pfasSource: score.pfasDetected ? "environmental" : null,
    lastUpdated: new Date().toISOString().split("T")[0],
    lastSampleDate: entry.topReadings[0]?.date?.split("T")[0] ?? "2026-03-01",
    readings: score.readings,
    nearbyPostcodes: nearby,
    historicalScores: [], // Phase 2: historical data
  };

  postcodeCache.set(entry.district.toUpperCase(), data);
}

// ── Public API ──

export function getPostcodeData(district: string): PostcodeData | null {
  return postcodeCache.get(district.toUpperCase()) ?? null;
}

export function getAllPostcodeDistricts(): string[] {
  return Array.from(postcodeCache.keys()).sort();
}

export function getPostcodesByCity(city: string): PostcodeData[] {
  return Array.from(postcodeCache.values()).filter(
    (p) => p.city.toLowerCase() === city.toLowerCase()
  );
}
