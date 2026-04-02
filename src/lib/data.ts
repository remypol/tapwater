/**
 * Data layer for TapWater.uk
 *
 * Reads from Supabase (primary) with JSON seed fallback.
 * All functions are async — pages must await them.
 */

import { supabase } from "./supabase";
import { getSupplier } from "./suppliers";
import { computeScore, type ScoreResult } from "./scoring";
import type { PostcodeData, ContaminantReading } from "./types";

// ── JSON fallback (used when Supabase is not configured) ──

let jsonFallbackCache: Map<string, PostcodeData> | null = null;

async function loadJsonFallback(): Promise<Map<string, PostcodeData>> {
  if (jsonFallbackCache) return jsonFallbackCache;

  let seedData: SeedEntry[];
  try {
    const mod = await import("@/data/seed-postcodes.json");
    seedData = (mod.default ?? mod) as SeedEntry[];
  } catch {
    // JSON file doesn't exist — return empty
    jsonFallbackCache = new Map();
    return jsonFallbackCache;
  }

  const cache = new Map<string, PostcodeData>();

  for (const entry of seedData) {
    const supplier = getSupplier(entry.city);
    const observations = entry.topReadings.map((r) => ({
      determinand: r.determinand,
      value: r.value,
      unit: r.unit,
      date: r.date,
    }));
    const score: ScoreResult = computeScore(observations, "environmental");

    const nearby = seedData
      .filter(
        (other) =>
          other.district !== entry.district &&
          (other.city === entry.city ||
            Math.abs(other.latitude - entry.latitude) < 0.05),
      )
      .map((o) => o.district)
      .slice(0, 10);

    const dates = entry.topReadings
      .map((r) => r.date?.split("T")[0])
      .filter(Boolean)
      .sort()
      .reverse();
    const lastDate = dates[0] ?? "2000-01-01";

    cache.set(entry.district.toUpperCase(), {
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
      lastUpdated: lastDate,
      lastSampleDate: lastDate,
      readings: score.readings,
      nearbyPostcodes: nearby,
      dataSource: "ea-only",
      drinkingWaterReadings: [],
      environmentalReadings: score.readings.map((r) => ({ ...r, source: "environmental" as const })),
      sampleCount: 0,
      dateRange: null,
    });
  }

  jsonFallbackCache = cache;
  return cache;
}

// ── Supabase data layer ──

let supabaseCache: Map<string, PostcodeData> | null = null;

async function loadFromSupabase(): Promise<Map<string, PostcodeData> | null> {
  if (supabaseCache) return supabaseCache;
  if (!supabase) return null;

  try {
    const { data: rows, error } = await supabase
      .from("page_data")
      .select(`
        postcode_district,
        safety_score,
        score_grade,
        contaminants_tested,
        contaminants_flagged,
        pfas_detected,
        pfas_level,
        pfas_source,
        all_readings,
        environmental_context,
        nearby_postcodes,
        last_data_update,
        data_source,
        drinking_water_readings,
        sample_count,
        date_range_from,
        date_range_to,
        postcode_districts!inner (
          area_name,
          city,
          region,
          latitude,
          longitude,
          supplier_id,
          supply_zone
        )
      `);

    if (error || !rows || rows.length === 0) return null;

    const cache = new Map<string, PostcodeData>();

    for (const row of rows) {
      const pd = row.postcode_districts as unknown as {
        area_name: string;
        city: string;
        region: string;
        latitude: number;
        longitude: number;
        supplier_id: string | null;
        supply_zone: string | null;
      };

      const supplier = pd.supplier_id
        ? await getSupplierById(pd.supplier_id)
        : getSupplier(pd.city);

      const drinkingReadings = ((row.drinking_water_readings ?? []) as ContaminantReading[])
        .map((r) => ({ ...r, source: "drinking" as const }));
      const envReadings = (row.all_readings ?? []) as ContaminantReading[];
      const lastDate = row.last_data_update?.split("T")[0] ?? "2000-01-01";

      cache.set(row.postcode_district.toUpperCase(), {
        district: row.postcode_district,
        areaName: pd.area_name,
        city: pd.city,
        region: pd.region,
        latitude: pd.latitude,
        longitude: pd.longitude,
        supplier: supplier.name,
        supplierId: supplier.id,
        supplyZone: pd.supply_zone ?? `${pd.city} Central`,
        safetyScore: row.safety_score,
        scoreGrade: row.score_grade as PostcodeData["scoreGrade"],
        contaminantsTested: row.contaminants_tested,
        contaminantsFlagged: row.contaminants_flagged,
        pfasDetected: row.pfas_detected,
        pfasLevel: row.pfas_level,
        pfasSource: row.pfas_source as PostcodeData["pfasSource"],
        lastUpdated: lastDate,
        lastSampleDate: lastDate,
        readings: drinkingReadings.length > 0 ? drinkingReadings : envReadings,
        nearbyPostcodes: row.nearby_postcodes ?? [],
        dataSource: (row.data_source ?? "ea-only") as PostcodeData["dataSource"],
        drinkingWaterReadings: drinkingReadings,
        environmentalReadings: envReadings.map((r) => ({ ...r, source: "environmental" as const })),
        sampleCount: row.sample_count ?? 0,
        dateRange: row.date_range_from && row.date_range_to
          ? { from: row.date_range_from.split("T")[0], to: row.date_range_to.split("T")[0] }
          : null,
      });
    }

    supabaseCache = cache;
    return cache;
  } catch (err) {
    console.error("[data] Supabase load failed, falling back to JSON:", err);
    return null;
  }
}

async function getSupplierById(
  id: string,
): Promise<{ name: string; id: string }> {
  if (!supabase) return { name: "Unknown", id };

  const { data } = await supabase
    .from("water_suppliers")
    .select("name")
    .eq("id", id)
    .single();

  return { name: data?.name ?? "Unknown", id };
}

// ── Unified loader: Supabase first, JSON fallback ──

async function loadData(): Promise<Map<string, PostcodeData>> {
  const fromDb = await loadFromSupabase();
  if (fromDb && fromDb.size > 0) return fromDb;
  return loadJsonFallback();
}

// ── Seed entry type (for JSON fallback) ──

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

// ── Public API (all async) ──

export async function getPostcodeData(
  district: string,
): Promise<PostcodeData | null> {
  const cache = await loadData();
  return cache.get(district.toUpperCase()) ?? null;
}

export async function getAllPostcodeDistricts(): Promise<string[]> {
  const cache = await loadData();
  return Array.from(cache.keys()).sort();
}

/**
 * Returns only postcode districts with a valid safety score (>= 0).
 * Use this for generating static pages — avoids thin/empty pages.
 */
export async function getScoredPostcodeDistricts(): Promise<string[]> {
  const cache = await loadData();
  return Array.from(cache.entries())
    .filter(([, data]) => data.safetyScore >= 0)
    .map(([district]) => district)
    .sort();
}

export async function getPostcodesByCity(
  city: string,
): Promise<PostcodeData[]> {
  const cache = await loadData();
  return Array.from(cache.values()).filter(
    (p) => p.city.toLowerCase() === city.toLowerCase(),
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

export async function getMapPostcodes(): Promise<MapPostcode[]> {
  const cache = await loadData();
  return Array.from(cache.values()).map((data) => ({
    district: data.district,
    areaName: data.areaName,
    lat: data.latitude,
    lng: data.longitude,
    score: data.safetyScore,
    scoreGrade: data.scoreGrade,
  }));
}
