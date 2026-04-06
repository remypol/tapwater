/**
 * Data layer for TapWater.uk
 *
 * Reads from Supabase (primary) with JSON seed fallback.
 * All functions are async — pages must await them.
 */

import { supabase } from "./supabase";
import { getSupplier } from "./suppliers";
import { computeScore, type ScoreResult } from "./scoring";
import type { PostcodeData, ContaminantReading, SupplierData } from "./types";

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
    // Paginated fetch — Supabase returns max 1000 rows per request
    const PAGE_SIZE = 1000;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allRows: any[] = [];
    let offset = 0;
    let hasMore = true;

    const selectQuery = `
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
      `;

    while (hasMore) {
      const { data: batch, error: batchError } = await supabase
        .from("page_data")
        .select(selectQuery)
        .range(offset, offset + PAGE_SIZE - 1);

      if (batchError || !batch) break;
      allRows.push(...batch);
      hasMore = batch.length === PAGE_SIZE;
      offset += PAGE_SIZE;
    }

    const rows = allRows;
    if (rows.length === 0) return null;

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
 * Returns only postcode districts with a valid safety score (>= 0)
 * AND data from the last 3 years. Stale pages hurt credibility.
 * Use this for generating static pages and sitemap — avoids thin/stale pages.
 */
export async function getScoredPostcodeDistricts(): Promise<string[]> {
  const cache = await loadData();
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 3);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  return Array.from(cache.entries())
    .filter(([, data]) => data.safetyScore >= 0 && data.lastSampleDate >= cutoffStr)
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

/**
 * Fetches the list of water suppliers.
 * Tries Supabase first, falls back to MOCK_SUPPLIERS.
 */
export async function getSuppliersList(): Promise<SupplierData[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("water_suppliers")
        .select("id, name, region, customers_m, compliance_rate, website, postcode_areas")
        .order("customers_m", { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((row) => ({
          id: row.id,
          name: row.name,
          region: row.region,
          customersM: row.customers_m,
          complianceRate: row.compliance_rate,
          website: row.website,
          postcodeAreas: row.postcode_areas ?? [],
        }));
      }
    } catch {
      // Fall through to mock data
    }
  }

  // Fallback to static data
  const { MOCK_SUPPLIERS } = await import("./mock-data");
  return MOCK_SUPPLIERS;
}

/**
 * Lightweight trust metrics — single aggregate query instead of loading all postcodes.
 */
export async function getTrustMetrics(): Promise<
  { value: string; label: string }[]
> {
  if (supabase) {
    try {
      const { data, error } = await supabase.rpc("homepage_trust_metrics");
      if (!error && data) {
        const { valid_count, pfas_count, total_samples } = data;
        const testLabel =
          total_samples > 1000
            ? `${Math.round(total_samples / 1000)}k+`
            : total_samples > 0
              ? Number(total_samples).toLocaleString()
              : "25,000+";
        return [
          { value: Number(valid_count).toLocaleString(), label: "Areas covered" },
          { value: testLabel, label: "Water tests" },
          { value: pfas_count > 0 ? `${pfas_count}+` : "Monitoring", label: "PFAS alerts" },
          { value: "Daily", label: "Updates" },
        ];
      }
    } catch {
      // Fall through to cache-based approach
    }
  }

  // Fallback: use the full cache (same as before, but only as fallback)
  const cache = await loadData();
  let validCount = 0;
  let pfasCount = 0;
  let totalSamples = 0;
  for (const d of cache.values()) {
    if (d.safetyScore >= 0) {
      validCount++;
      if (d.pfasDetected) pfasCount++;
      totalSamples += d.sampleCount;
    }
  }
  const testLabel =
    totalSamples > 1000
      ? `${Math.round(totalSamples / 1000)}k+`
      : totalSamples > 0
        ? totalSamples.toLocaleString()
        : "25,000+";
  return [
    { value: validCount.toLocaleString(), label: "Areas covered" },
    { value: testLabel, label: "Water tests" },
    { value: pfasCount > 0 ? `${pfasCount}+` : "Monitoring", label: "PFAS alerts" },
    { value: "Daily", label: "Updates" },
  ];
}

/**
 * Returns the 3 worst and 3 best scoring postcodes — targeted query.
 */
export async function getRankedPostcodes(): Promise<{
  worst: PostcodeData[];
  best: PostcodeData[];
}> {
  if (supabase) {
    try {
      const selectCols = `
        postcode_district, safety_score, score_grade,
        contaminants_tested, contaminants_flagged,
        pfas_detected, pfas_level, pfas_source,
        all_readings, drinking_water_readings,
        nearby_postcodes, last_data_update, data_source,
        sample_count, date_range_from, date_range_to,
        postcode_districts!inner (
          area_name, city, region, latitude, longitude, supplier_id, supply_zone
        )
      `;

      const [worstRes, bestRes] = await Promise.all([
        supabase
          .from("page_data")
          .select(selectCols)
          .gt("safety_score", 0)
          .order("safety_score", { ascending: true })
          .limit(3),
        supabase
          .from("page_data")
          .select(selectCols)
          .gt("safety_score", 0)
          .order("safety_score", { ascending: false })
          .limit(3),
      ]);

      if (!worstRes.error && !bestRes.error && worstRes.data && bestRes.data) {
        const mapRow = async (row: typeof worstRes.data[0]): Promise<PostcodeData> => {
          const pd = row.postcode_districts as unknown as {
            area_name: string; city: string; region: string;
            latitude: number; longitude: number;
            supplier_id: string | null; supply_zone: string | null;
          };
          const supplier = pd.supplier_id
            ? await getSupplierById(pd.supplier_id)
            : getSupplier(pd.city);
          const drinkingReadings = ((row.drinking_water_readings ?? []) as ContaminantReading[])
            .map((r) => ({ ...r, source: "drinking" as const }));
          const envReadings = (row.all_readings ?? []) as ContaminantReading[];
          const lastDate = row.last_data_update?.split("T")[0] ?? "2000-01-01";

          return {
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
          };
        };

        return {
          worst: await Promise.all(worstRes.data.map(mapRow)),
          best: await Promise.all(bestRes.data.map(mapRow)),
        };
      }
    } catch {
      // Fall through to cache-based approach
    }
  }

  // Fallback
  const cache = await loadData();
  const all = Array.from(cache.values()).filter((d) => d.safetyScore >= 0);
  all.sort((a, b) => a.safetyScore - b.safetyScore);
  return { worst: all.slice(0, 3), best: all.slice(-3).reverse() };
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
