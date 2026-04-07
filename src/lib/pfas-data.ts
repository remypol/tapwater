import { getSupabase } from "./supabase";
import { CITIES } from "./cities";

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
