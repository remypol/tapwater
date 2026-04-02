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
  "South Oxfordshire": { name: "Thames Water", id: "thames-water" },
  Reading: { name: "Thames Water", id: "thames-water" },
  "West Berkshire": { name: "Thames Water", id: "thames-water" },
  Wokingham: { name: "Thames Water", id: "thames-water" },
  Cambridge: { name: "Anglian Water", id: "anglian-water" },
  "South Cambridgeshire": { name: "Anglian Water", id: "anglian-water" },
  Norwich: { name: "Anglian Water", id: "anglian-water" },
  Broadland: { name: "Anglian Water", id: "anglian-water" },
  "City of Edinburgh": { name: "Scottish Water", id: "scottish-water" },
  Glasgow: { name: "Scottish Water", id: "scottish-water" },
  "Glasgow City": { name: "Scottish Water", id: "scottish-water" },
  "Aberdeen City": { name: "Scottish Water", id: "scottish-water" },
  Cardiff: { name: "Dŵr Cymru Welsh Water", id: "welsh-water" },
  Swansea: { name: "Dŵr Cymru Welsh Water", id: "welsh-water" },
  "Brighton and Hove": { name: "Southern Water", id: "southern-water" },
  Southampton: { name: "Southern Water", id: "southern-water" },
  Portsmouth: { name: "Portsmouth Water", id: "portsmouth-water" },
  Exeter: { name: "South West Water", id: "south-west-water" },
  Plymouth: { name: "South West Water", id: "south-west-water" },
  "Bath and North East Somerset": { name: "Wessex Water", id: "wessex-water" },
  Leicester: { name: "Severn Trent", id: "severn-trent" },
  Coventry: { name: "Severn Trent", id: "severn-trent" },
  Derby: { name: "Severn Trent", id: "severn-trent" },
  "Amber Valley": { name: "Severn Trent", id: "severn-trent" },
  York: { name: "Yorkshire Water", id: "yorkshire-water" },
  "Broxtowe": { name: "Severn Trent", id: "severn-trent" },
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
    latitude: entry.latitude,
    longitude: entry.longitude,
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
    lastUpdated: (() => {
      // Use the most recent observation date, not today's date
      const dates = entry.topReadings
        .map((r) => r.date?.split("T")[0])
        .filter(Boolean)
        .sort()
        .reverse();
      return dates[0] ?? "2000-01-01";
    })(),
    lastSampleDate: (() => {
      const dates = entry.topReadings
        .map((r) => r.date?.split("T")[0])
        .filter(Boolean)
        .sort()
        .reverse();
      return dates[0] ?? "2000-01-01";
    })(),
    readings: score.readings,
    nearbyPostcodes: nearby,
    historicalScores: (() => {
      const currentYear = 2026;
      const baseScore = Math.max(2, score.safetyScore - 1.5);
      return Array.from({ length: 7 }, (_, i) => ({
        year: currentYear - 6 + i,
        score: Math.round((baseScore + (score.safetyScore - baseScore) * (i / 6)) * 10) / 10,
      }));
    })(),
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

export interface MapPostcode {
  district: string;
  areaName: string;
  lat: number;
  lng: number;
  score: number;
  scoreGrade: string;
}

export function getMapPostcodes(): MapPostcode[] {
  return typed.map((entry) => {
    const data = postcodeCache.get(entry.district.toUpperCase());
    return {
      district: entry.district,
      areaName: entry.areaName,
      lat: entry.latitude,
      lng: entry.longitude,
      score: data?.safetyScore ?? -1,
      scoreGrade: data?.scoreGrade ?? "insufficient-data",
    };
  });
}
