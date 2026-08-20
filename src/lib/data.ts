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
    const lastDate = dates[0] ?? "2024-01-01";

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

    // Batch-load all suppliers upfront to avoid N+1 queries
    const supplierIds = new Set<string>();
    for (const row of rows) {
      const pd = row.postcode_districts as unknown as { supplier_id: string | null };
      if (pd.supplier_id) supplierIds.add(pd.supplier_id);
    }
    const supplierMap = await loadSuppliersBatch(Array.from(supplierIds));

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

      const supplier = pd.supplier_id && supplierMap.has(pd.supplier_id)
        ? supplierMap.get(pd.supplier_id)!
        : getSupplier(pd.city);

      const drinkingReadings = ((row.drinking_water_readings ?? []) as ContaminantReading[])
        .map((r) => ({ ...r, source: "drinking" as const }));
      const envReadings = (row.all_readings ?? []) as ContaminantReading[];
      const lastDate = row.last_data_update?.split("T")[0] ?? "2024-01-01";

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

/** Batch-load suppliers by IDs in a single query to avoid N+1 */
async function loadSuppliersBatch(
  ids: string[],
): Promise<Map<string, { name: string; id: string }>> {
  const result = new Map<string, { name: string; id: string }>();
  if (!supabase || ids.length === 0) return result;

  const { data } = await supabase
    .from("water_suppliers")
    .select("id, name")
    .in("id", ids);

  if (data) {
    for (const row of data) {
      result.set(row.id, { name: row.name ?? "Unknown", id: row.id });
    }
  }
  return result;
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

/**
 * Average water hardness (mg/L CaCO3) per district, loaded once.
 *
 * Hardness is not a regulated contaminant, so it never reaches the scored
 * page_data readings and has to come from drinking_water_readings directly.
 *
 * The promise is cached rather than the Map. The previous version assigned an
 * empty Map before awaiting the query, and a build renders thousands of postcode
 * pages concurrently — so every call after the first found a cache that existed
 * but was still empty, skipped the load and returned null. It worked when called
 * sequentially from a script, which is exactly why the gap was invisible.
 */
/**
 * Every spelling this column uses for total hardness.
 *
 * "Total hardness" was missing here and the comment above the list asserted there
 * were only two. There are three, and the missing one covers 480 rows across 75
 * districts that were reading as "no hardness data" and falling through to a jug.
 * Counted directly against the table rather than inferred, so if a fourth spelling
 * ever appears the same check finds it:
 *
 *   select determinand, count(*) from drinking_water_readings
 *   where determinand ilike '%ardness%' group by 1;
 */
const HARDNESS_DETERMINANDS = [
  "Hardness (Total) as CaCO3",
  "Hardness total",
  "Total hardness",
];

/** Hardness for a district, and whether it was measured there or inferred nearby. */
export interface HardnessReading {
  value: number;
  label: string;
  /** True when no reading exists for this district and the postcode area was used. */
  estimated: boolean;
  /** Postcode area the estimate came from, e.g. "AL". Only set when estimated. */
  estimatedFrom?: string;
}

interface HardnessIndex {
  /** Districts with their own measurement. */
  byDistrict: Map<string, number>;
  /** Median per postcode area, for districts with no measurement of their own. */
  byArea: Map<string, number>;
}

let hardnessCache: Promise<HardnessIndex> | null = null;

/** "AL1" -> "AL". Hardness follows supply geography, which tracks the area letters. */
function postcodeArea(district: string): string {
  return district.toUpperCase().match(/^[A-Z]{1,2}/)?.[0] ?? district.toUpperCase();
}

async function loadHardness(): Promise<HardnessIndex> {
  const result = new Map<string, number>();
  if (!supabase) return { byDistrict: result, byArea: new Map() };

  try {
    const PAGE_SIZE = 1000;
    const rows: { postcode_district: string; value: number }[] = [];

    for (let offset = 0; ; offset += PAGE_SIZE) {
      const page = await supabase
        .from("drinking_water_readings")
        .select("postcode_district, value")
        // Exact names, not ILIKE "%hardness%". A leading wildcard cannot use an
        // index, so that version took 5.4s against this table — fine from a script,
        // but a build fires it from every worker at once and Postgres answered
        // "canceling statement due to statement timeout" on all of them. Hardness
        // then silently vanished from the entire site. These two are the only
        // spellings present, and matching them exactly runs in ~300ms.
        .in("determinand", HARDNESS_DETERMINANDS)
        // Paging without an explicit order is not stable in Postgres: rows repeat
        // across pages and others never appear. Unordered this resolved 521
        // districts from the same rows; ordered, 697.
        .order("id", { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1);

      if (page.error) break;
      rows.push(...(page.data ?? []));
      if (!page.data || page.data.length < PAGE_SIZE) break;
    }

    const sums = new Map<string, { total: number; count: number }>();
    for (const row of rows) {
      const key = row.postcode_district.toUpperCase();
      const entry = sums.get(key) ?? { total: 0, count: 0 };
      entry.total += Number(row.value);
      entry.count += 1;
      sums.set(key, entry);
    }
    for (const [key, { total, count }] of sums) {
      result.set(key, Math.round(total / count));
    }
  } catch {
    // Hardness is informational; a failure here must not take the report down.
  }

  // Only 697 of 2,782 districts carry a reading of their own. Hardness is a property
  // of the supply rather than of a postcode, so neighbours in the same postcode area
  // are a reasonable stand-in and cover a further 286 districts. Median rather than
  // mean: a single soft-water outlier in a hard area should not drag the estimate
  // under the threshold. Where areas were checked with four or more readings, about
  // two thirds sit within 100 mg/L end to end, so this is a fair indication and not a
  // measurement — callers get `estimated: true` and must label it as such.
  const areaValues = new Map<string, number[]>();
  for (const [district, value] of result) {
    const area = postcodeArea(district);
    const list = areaValues.get(area) ?? [];
    list.push(value);
    areaValues.set(area, list);
  }
  const byArea = new Map<string, number>();
  for (const [area, values] of areaValues) {
    values.sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);
    byArea.set(
      area,
      values.length % 2 ? values[mid] : Math.round((values[mid - 1] + values[mid]) / 2),
    );
  }

  return { byDistrict: result, byArea };
}

function hardnessLabelFor(value: number): string {
  return value < 60 ? "soft"
    : value < 120 ? "moderately soft"
    : value < 180 ? "moderately hard"
    : value < 250 ? "hard"
    : "very hard";
}

export async function getHardness(
  district: string,
): Promise<HardnessReading | null> {
  if (!supabase) return null;

  hardnessCache ??= loadHardness();
  const { byDistrict, byArea } = await hardnessCache;
  const key = district.toUpperCase();

  const measured = byDistrict.get(key);
  if (measured != null) {
    return { value: measured, label: hardnessLabelFor(measured), estimated: false };
  }

  const area = postcodeArea(key);
  const nearby = byArea.get(area);
  if (nearby == null) return null;

  return {
    value: nearby,
    label: hardnessLabelFor(nearby),
    estimated: true,
    estimatedFrom: area,
  };
}

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
/** Minimum measured parameters before a district may carry a public ranking claim. */
export const MIN_TESTED_TO_RANK = 5;

/**
 * Whether a district may be named in a public ranking — the homepage lists, the
 * /rankings pages and the press stories that hand journalists ready-made citations.
 *
 * Ranking on score alone put river and groundwater samples at the top of "highest
 * lead levels in drinking water", some of them taken in 2000 and 2008, with named
 * water companies attached. And a 10.0/10 built on two measured parameters says
 * more about the sampling than about the water. A district has to be treated tap
 * water, recently sampled, and actually tested to be worth naming.
 */
export function isRankable(p: PostcodeData): boolean {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 3);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  return (
    p.safetyScore >= 0 &&
    p.dataSource !== "ea-only" &&
    p.lastSampleDate >= cutoffStr &&
    p.contaminantsTested >= MIN_TESTED_TO_RANK
  );
}

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

export interface PostcodeIndexEntry {
  district: string;
  areaName: string;
  city: string;
  region: string;
  safetyScore: number;
}

/**
 * Every scored district with the labels needed to list it, grouped by the caller.
 *
 * Exists for the /postcode index. Postcode pages previously only linked to the handful
 * of neighbours in their own data, so any district outside someone else's neighbour
 * list had no incoming internal links at all — a crawl found 188 of them orphaned,
 * together pulling no organic traffic. The index gives every district one reliable
 * link. Uses the same scored + recent filter as the sitemap so thin and stale pages
 * are not linked into.
 */
export async function getPostcodeIndex(): Promise<PostcodeIndexEntry[]> {
  const cache = await loadData();
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 3);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  return Array.from(cache.values())
    .filter((d) => d.safetyScore >= 0 && d.lastSampleDate >= cutoffStr)
    .map((d) => ({
      district: d.district,
      areaName: d.areaName,
      city: d.city,
      region: d.region,
      safetyScore: d.safetyScore,
    }))
    .sort((a, b) => a.district.localeCompare(b.district, "en", { numeric: true }));
}

/**
 * Returns the most recently updated scored postcodes — used on the homepage
 * to create direct crawl paths into the postcode network beyond popular searches.
 */
export async function getRecentlyUpdatedPostcodes(
  limit = 20,
): Promise<PostcodeData[]> {
  const cache = await loadData();
  return Array.from(cache.values())
    .filter((d) => d.safetyScore >= 0)
    .sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated))
    .slice(0, limit);
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
 * Single supplier by its id/slug.
 *
 * The detail page used to read MOCK_SUPPLIERS directly while the homepage
 * read getSuppliersList (Supabase-first), so a supplier added in Supabase
 * rendered on the homepage but 404'd on its own page. Resolving through the
 * same list keeps every surface consistent.
 */
export async function getSupplierBySlug(
  slug: string,
): Promise<SupplierData | null> {
  const suppliers = await getSuppliersList();
  return suppliers.find((s) => s.id === slug) ?? null;
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

      // These two lists are published on the homepage as "areas to watch" and
      // "cleanest water", naming real places and their water company. Three guards
      // decide what may carry that claim:
      //
      //  - drinking water only. Ranking by score alone surfaced river and groundwater
      //    samples, because environmental monitoring flags far more than treated tap
      //    water does. DA13 was headlined for lead off a sample taken in January 2000,
      //    on a page that says "tap water tests not yet available for Thames Water".
      //  - recent. Same three-year window the sitemap uses (getScoredPostcodeDistricts).
      //  - actually tested. A 10.0/10 built on two measured parameters is not a
      //    finding about the water, it is a finding about the sampling.
      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - 3);
      const cutoffStr = cutoff.toISOString().split("T")[0];
      const MIN_TESTED_TO_RANK = 5;

      const rankable = () =>
        supabase!
          .from("page_data")
          .select(selectCols)
          .gt("safety_score", 0)
          .in("data_source", ["stream", "mixed"])
          .gte("last_data_update", cutoffStr)
          .gte("contaminants_tested", MIN_TESTED_TO_RANK);

      const [worstRes, bestRes] = await Promise.all([
        rankable().order("safety_score", { ascending: true }).limit(3),
        rankable().order("safety_score", { ascending: false }).limit(3),
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
          const lastDate = row.last_data_update?.split("T")[0] ?? "2024-01-01";

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

/**
 * Computes the national average safety score across all scored postcode districts.
 */
export async function getNationalAverageScore(): Promise<number> {
  const cache = await loadData();
  let total = 0;
  let count = 0;
  for (const data of cache.values()) {
    if (data.safetyScore >= 0) {
      total += data.safetyScore;
      count++;
    }
  }
  return count > 0 ? total / count : 0;
}
