import { getSupabase, supabase } from "./supabase";
import { CITIES } from "./cities";
import { getPostcodeData } from "./data";

// --- Types ---

export interface PfasDetectionPoint {
  lat: number;
  lng: number;
  label: string;
  maxLevel: number;
  compound: string;
  city: string;
  latestDate: string;
}

export interface PfasCitySummary {
  city: string;
  slug: string;
  region: string;
  detectionCount: number;
  compoundsFound: number;
  highestLevel: number;
  latestDate: string;
}

export interface PfasNationalSummary {
  totalDetections: number;
  citiesWithDetections: number;
  citiesMonitored: number;
  highestLevel: number;
  highestLevelCity: string;
  highestLevelCompound: string;
  latestDetectionDate: string;
  totalSamplingPoints: number;
  detectionsByCity: PfasCitySummary[];
  allDetectionPoints: PfasDetectionPoint[];
}

export interface PfasTrendPoint {
  date: string;
  totalLevel: number;
}

export interface PfasCompoundBreakdown {
  compound: string;
  maxLevel: number;
  detectionCount: number;
  latestDate: string;
}

export interface PfasCityData {
  city: string;
  region: string;
  detectionCount: number;
  compoundsDetected: string[];
  samplingPointCount: number;
  highestLevel: number;
  highestCompound: string;
  latestDate: string;
  pfasDetected: boolean;
  detectionPoints: PfasDetectionPoint[];
  trendData: PfasTrendPoint[];
  compoundBreakdown: PfasCompoundBreakdown[];
}

// --- Helpers ---

interface PfasRow {
  sampling_point_id: string;
  sampling_point_label: string;
  lat: number;
  lng: number;
  city: string;
  region: string;
  compound: string;
  determinand_notation: string;
  value: number;
  unit: string;
  sample_date: string;
}

function cityNameToSlug(name: string): string {
  return CITIES.find((c) => c.name === name)?.slug ?? name.toLowerCase().replace(/\s+/g, "-");
}

function slugToCityName(slug: string): string | undefined {
  return CITIES.find((c) => c.slug === slug)?.name;
}

function cityRegion(name: string): string {
  return CITIES.find((c) => c.name === name)?.region ?? "England";
}

// --- Functions ---

export async function getPfasNationalSummary(): Promise<PfasNationalSummary | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("pfas_detections")
    .select("*")
    .order("sample_date", { ascending: false });

  if (error) {
    console.error("Error fetching PFAS national data:", error);
    return null;
  }

  const rows = data as PfasRow[];
  if (!rows || rows.length === 0) return null;

  // Aggregate by city
  const cityMap = new Map<
    string,
    { detections: number; compounds: Set<string>; maxLevel: number; latestDate: string; region: string }
  >();

  for (const row of rows) {
    const existing = cityMap.get(row.city);
    if (existing) {
      existing.detections++;
      existing.compounds.add(row.compound);
      if (row.value > existing.maxLevel) existing.maxLevel = row.value;
      if (row.sample_date > existing.latestDate) existing.latestDate = row.sample_date;
    } else {
      cityMap.set(row.city, {
        detections: 1,
        compounds: new Set([row.compound]),
        maxLevel: row.value,
        latestDate: row.sample_date,
        region: row.region,
      });
    }
  }

  // Aggregate by sampling point for map markers
  const pointMap = new Map<
    string,
    { lat: number; lng: number; label: string; maxLevel: number; compound: string; city: string; latestDate: string }
  >();

  for (const row of rows) {
    const existing = pointMap.get(row.sampling_point_id);
    if (existing) {
      if (row.value > existing.maxLevel) {
        existing.maxLevel = row.value;
        existing.compound = row.compound;
      }
      if (row.sample_date > existing.latestDate) existing.latestDate = row.sample_date;
    } else {
      pointMap.set(row.sampling_point_id, {
        lat: row.lat,
        lng: row.lng,
        label: row.sampling_point_label,
        maxLevel: row.value,
        compound: row.compound,
        city: row.city,
        latestDate: row.sample_date,
      });
    }
  }

  // Find overall highest
  let highestLevel = 0;
  let highestLevelCity = "";
  let highestLevelCompound = "";
  for (const row of rows) {
    if (row.value > highestLevel) {
      highestLevel = row.value;
      highestLevelCity = row.city;
      highestLevelCompound = row.compound;
    }
  }

  const detectionsByCity: PfasCitySummary[] = Array.from(cityMap.entries())
    .map(([city, info]) => ({
      city,
      slug: cityNameToSlug(city),
      region: info.region,
      detectionCount: info.detections,
      compoundsFound: info.compounds.size,
      highestLevel: info.maxLevel,
      latestDate: info.latestDate,
    }))
    .sort((a, b) => b.highestLevel - a.highestLevel);

  const allDetectionPoints: PfasDetectionPoint[] = Array.from(pointMap.values());

  return {
    totalDetections: rows.length,
    citiesWithDetections: cityMap.size,
    citiesMonitored: CITIES.length,
    highestLevel,
    highestLevelCity,
    highestLevelCompound,
    latestDetectionDate: rows[0].sample_date,
    totalSamplingPoints: pointMap.size,
    detectionsByCity,
    allDetectionPoints,
  };
}

export async function getPfasCityData(citySlug: string): Promise<PfasCityData> {
  const cityName = slugToCityName(citySlug);
  const region = cityName ? cityRegion(cityName) : "England";

  const emptyResult: PfasCityData = {
    city: cityName ?? citySlug,
    region,
    detectionCount: 0,
    compoundsDetected: [],
    samplingPointCount: 0,
    highestLevel: 0,
    highestCompound: "",
    latestDate: "",
    pfasDetected: false,
    detectionPoints: [],
    trendData: [],
    compoundBreakdown: [],
  };

  if (!cityName) return emptyResult;

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("pfas_detections")
    .select("*")
    .eq("city", cityName)
    .order("sample_date", { ascending: true });

  if (error) {
    console.error(`Error fetching PFAS data for ${cityName}:`, error);
    return emptyResult;
  }

  const rows = data as PfasRow[];
  if (!rows || rows.length === 0) return emptyResult;

  // Detection points aggregated by sampling point
  const pointMap = new Map<
    string,
    { lat: number; lng: number; label: string; maxLevel: number; compound: string; city: string; latestDate: string }
  >();

  for (const row of rows) {
    const existing = pointMap.get(row.sampling_point_id);
    if (existing) {
      if (row.value > existing.maxLevel) {
        existing.maxLevel = row.value;
        existing.compound = row.compound;
      }
      if (row.sample_date > existing.latestDate) existing.latestDate = row.sample_date;
    } else {
      pointMap.set(row.sampling_point_id, {
        lat: row.lat,
        lng: row.lng,
        label: row.sampling_point_label,
        maxLevel: row.value,
        compound: row.compound,
        city: row.city,
        latestDate: row.sample_date,
      });
    }
  }

  // Trend data: monthly aggregation (sum of values per month)
  const monthMap = new Map<string, number>();
  for (const row of rows) {
    const monthKey = row.sample_date.substring(0, 7); // YYYY-MM
    monthMap.set(monthKey, (monthMap.get(monthKey) ?? 0) + row.value);
  }

  const trendData: PfasTrendPoint[] = Array.from(monthMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, totalLevel]) => ({ date, totalLevel }));

  // Compound breakdown
  const compoundMap = new Map<
    string,
    { maxLevel: number; detectionCount: number; latestDate: string }
  >();

  for (const row of rows) {
    const existing = compoundMap.get(row.compound);
    if (existing) {
      existing.detectionCount++;
      if (row.value > existing.maxLevel) existing.maxLevel = row.value;
      if (row.sample_date > existing.latestDate) existing.latestDate = row.sample_date;
    } else {
      compoundMap.set(row.compound, {
        maxLevel: row.value,
        detectionCount: 1,
        latestDate: row.sample_date,
      });
    }
  }

  const compoundBreakdown: PfasCompoundBreakdown[] = Array.from(compoundMap.entries())
    .map(([compound, info]) => ({
      compound,
      maxLevel: info.maxLevel,
      detectionCount: info.detectionCount,
      latestDate: info.latestDate,
    }))
    .sort((a, b) => b.maxLevel - a.maxLevel);

  // Overall highest
  let highestLevel = 0;
  let highestCompound = "";
  for (const row of rows) {
    if (row.value > highestLevel) {
      highestLevel = row.value;
      highestCompound = row.compound;
    }
  }

  const compoundsDetected = Array.from(compoundMap.keys());
  const latestDate = rows[rows.length - 1].sample_date;

  return {
    city: cityName,
    region,
    detectionCount: rows.length,
    compoundsDetected,
    samplingPointCount: pointMap.size,
    highestLevel,
    highestCompound,
    latestDate,
    pfasDetected: true,
    detectionPoints: Array.from(pointMap.values()),
    trendData,
    compoundBreakdown,
  };
}

export function getPfasCitySlugs(): string[] {
  return CITIES.map((c) => c.slug);
}

// --- PFAS near a postcode district ---
//
// The postcode page leads with tap-water tests. PFAS sits underneath it as a
// clearly labelled module built from Environment Agency river and groundwater
// samples within a radius of the district centroid. Nothing here describes tap
// water, and the copy that consumes it must not say it does.

/** The columns the nearby summary needs; the rest of the row is never loaded. */
export interface PfasNearbyRow {
  sampling_point_id: string;
  sampling_point_label: string;
  lat: number;
  lng: number;
  city: string;
  compound: string;
  value: number;
  sample_date: string;
}

export interface PfasNearbyHighest {
  /** µg/L */
  value: number;
  compound: string;
  date: string;
  samplingPointLabel: string;
  distanceKm: number;
}

export interface PfasNearbyCompound {
  compound: string;
  detectionCount: number;
}

export interface PfasNearbySummary {
  radiusKm: number;
  detectionCount: number;
  samplingPointCount: number;
  highest: PfasNearbyHighest;
  /** Up to three compounds, most detections first. */
  topCompounds: PfasNearbyCompound[];
  latestDate: string;
  /** Slug of the closest city that has a /pfas/[city] page, or null. */
  nearestCitySlug: string | null;
  nearestCityName: string | null;
}

/**
 * The Drinking Water Inspectorate's guideline for individual PFAS compounds in
 * drinking water, in µg/L. England and Wales have no statutory limit; this is the
 * reference value the /pfas pages already quote. Environmental samples are not
 * drinking water, so it is a yardstick for scale, never a pass/fail.
 */
export const DWI_PFAS_GUIDELINE_UG_L = 0.1;

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance between two WGS84 points, in km. */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * Aggregate every row within `radiusKm` of a point. Pure, so it is unit-tested
 * directly; the loader below only supplies the rows and the centroid.
 *
 * A cheap bounding box runs first: one degree of latitude is ~111 km and a degree
 * of longitude at UK latitudes is ~65 km, so the box is padded generously and the
 * haversine only runs on the handful of rows that survive it.
 */
export function summarisePfasNearby(
  rows: PfasNearbyRow[],
  lat: number,
  lng: number,
  radiusKm: number,
): PfasNearbySummary | null {
  const latPad = radiusKm / 111 + 0.01;
  const lngPad = radiusKm / (111 * Math.cos((lat * Math.PI) / 180)) + 0.01;

  let highest: PfasNearbyHighest | null = null;
  let latestDate = "";
  let nearestKm = Infinity;
  let nearestCity: string | null = null;
  const points = new Set<string>();
  const compounds = new Map<string, number>();
  let detectionCount = 0;

  for (const row of rows) {
    if (Math.abs(row.lat - lat) > latPad || Math.abs(row.lng - lng) > lngPad) continue;
    const distanceKm = haversineKm(lat, lng, row.lat, row.lng);
    if (distanceKm > radiusKm) continue;
    if (!(row.value > 0)) continue;

    detectionCount++;
    points.add(row.sampling_point_id);
    compounds.set(row.compound, (compounds.get(row.compound) ?? 0) + 1);
    if (row.sample_date > latestDate) latestDate = row.sample_date;
    if (distanceKm < nearestKm) {
      nearestKm = distanceKm;
      nearestCity = row.city;
    }
    if (
      !highest ||
      row.value > highest.value ||
      (row.value === highest.value && row.sample_date > highest.date)
    ) {
      highest = {
        value: row.value,
        compound: row.compound,
        date: row.sample_date,
        samplingPointLabel: row.sampling_point_label,
        distanceKm: Math.round(distanceKm * 10) / 10,
      };
    }
  }

  if (!highest || detectionCount === 0) return null;

  const topCompounds = Array.from(compounds.entries())
    .map(([compound, count]) => ({ compound, detectionCount: count }))
    .sort((a, b) => b.detectionCount - a.detectionCount || a.compound.localeCompare(b.compound))
    .slice(0, 3);

  const cityInfo = nearestCity ? CITIES.find((c) => c.name === nearestCity) : undefined;

  return {
    radiusKm,
    detectionCount,
    samplingPointCount: points.size,
    highest,
    topCompounds,
    latestDate,
    nearestCitySlug: cityInfo?.slug ?? null,
    nearestCityName: cityInfo?.name ?? null,
  };
}

/**
 * Every detection, loaded once per process and shared by all postcode pages.
 *
 * ~12,000 rows of eight narrow columns, twelve paginated requests. A build
 * renders 2,782 postcode pages; one shared load beats one radius query per page
 * many times over. The promise is cached, not the result, for the same reason
 * as `getHardness` in data.ts: concurrent callers must wait on the same load,
 * not each find an empty cache and start their own.
 */
let pfasRowsCache: Promise<PfasNearbyRow[]> | null = null;

async function loadAllPfasRows(): Promise<PfasNearbyRow[]> {
  if (!supabase) return [];
  const rows: PfasNearbyRow[] = [];
  const PAGE_SIZE = 1000;

  try {
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const page = await supabase
        .from("pfas_detections")
        .select("sampling_point_id, sampling_point_label, lat, lng, city, compound, value, sample_date")
        // Paging without an order is not stable in Postgres.
        .order("id", { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1);
      if (page.error) {
        console.error("Error fetching PFAS rows for nearby summaries:", page.error);
        break;
      }
      rows.push(...((page.data ?? []) as PfasNearbyRow[]));
      if (!page.data || page.data.length < PAGE_SIZE) break;
    }
  } catch (err) {
    // The module is supplementary; a failure here must not take the page down.
    console.error("PFAS nearby load failed:", err);
  }

  return rows;
}

function getAllPfasRows(): Promise<PfasNearbyRow[]> {
  if (!pfasRowsCache) pfasRowsCache = loadAllPfasRows();
  return pfasRowsCache;
}

/**
 * PFAS measured in rivers and groundwater within `radiusKm` of a postcode
 * district's centroid. Null when the district is unknown or nothing was
 * sampled within range, in which case the page renders no PFAS module.
 */
export async function getPfasNearDistrict(
  district: string,
  radiusKm = 10,
): Promise<PfasNearbySummary | null> {
  const postcode = await getPostcodeData(district);
  if (!postcode) return null;
  const rows = await getAllPfasRows();
  return summarisePfasNearby(rows, postcode.latitude, postcode.longitude, radiusKm);
}
