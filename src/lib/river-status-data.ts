/**
 * Loaders for the Environment Agency river classifications stored by
 * `river-status-ingest.ts`. Pure logic lives in `river-status.ts`.
 */

import { supabase } from "./supabase";
import {
  isEcologicalClass,
  summariseRivers,
  type RiverElement,
  type RiverStatus,
  type RiverStatusSummary,
  type WaterBodyType,
} from "./river-status";

export interface DistrictRiver {
  river: RiverStatus;
  /** "within": the district's centre is in this river's catchment. "nearest": tidal or seaside district. */
  matchType: "within" | "nearest";
  distanceKm: number | null;
}

interface RiverRow {
  water_body_id: string;
  name: string;
  water_body_type: string;
  modified: string | null;
  river_basin_district: string;
  management_catchment: string;
  operational_catchment: string;
  classification_year: number;
  ecological_class: string | null;
  chemical_class: string | null;
  priority_hazardous_class: string | null;
  ecological_change: string | null;
  drinking_water_protected_area: string | null;
  elements: RiverElement[] | null;
}

interface RiverStore {
  rivers: Map<string, RiverStatus>;
  byDistrict: Map<string, { waterBodyId: string; matchType: "within" | "nearest"; distanceKm: number | null }>;
}

function toRiver(r: RiverRow): RiverStatus {
  return {
    waterBodyId: r.water_body_id,
    name: r.name,
    type: (r.water_body_type === "Transitional" || r.water_body_type === "Coastal" ? r.water_body_type : "River") as WaterBodyType,
    modified: r.modified,
    riverBasinDistrict: r.river_basin_district,
    managementCatchment: r.management_catchment,
    operationalCatchment: r.operational_catchment,
    classificationYear: r.classification_year,
    ecologicalClass: isEcologicalClass(r.ecological_class) ? r.ecological_class : null,
    chemicalClass: r.chemical_class,
    priorityHazardousClass: r.priority_hazardous_class,
    ecologicalChange: r.ecological_change,
    drinkingWaterProtectedArea: r.drinking_water_protected_area,
    elements: Array.isArray(r.elements) ? r.elements : [],
  };
}

// PostgREST caps a response at 1,000 rows, so both tables are paged.
async function loadPaged<T>(table: string, columns: string, orderBy: string): Promise<T[]> {
  if (!supabase) return [];
  const rows: T[] = [];
  for (let offset = 0; ; offset += 1000) {
    const page = await supabase
      .from(table)
      .select(columns)
      .order(orderBy, { ascending: true })
      .range(offset, offset + 999);
    if (page.error) throw new Error(`${table}: ${page.error.message}`);
    rows.push(...((page.data ?? []) as T[]));
    if (!page.data || page.data.length < 1000) break;
  }
  return rows;
}

/**
 * Both tables, loaded once per process and shared by every page in a build. The
 * promise is cached, not the result, so concurrent pages wait on the same load.
 */
let storeCache: Promise<RiverStore> | null = null;

async function loadStore(): Promise<RiverStore> {
  const store: RiverStore = { rivers: new Map(), byDistrict: new Map() };
  try {
    const [rivers, districts] = await Promise.all([
      loadPaged<RiverRow>("river_status", "*", "water_body_id"),
      loadPaged<{ postcode_district: string; water_body_id: string; match_type: string; distance_km: number | null }>(
        "district_river_status",
        "postcode_district, water_body_id, match_type, distance_km",
        "postcode_district",
      ),
    ]);
    for (const r of rivers) store.rivers.set(r.water_body_id, toRiver(r));
    for (const d of districts) {
      store.byDistrict.set(d.postcode_district, {
        waterBodyId: d.water_body_id,
        matchType: d.match_type === "nearest" ? "nearest" : "within",
        distanceKm: d.distance_km,
      });
    }
  } catch (err) {
    // Supplementary module: a failed load must leave pages rendering without it.
    console.error("River status load failed:", err);
  }
  return store;
}

function getStore(): Promise<RiverStore> {
  if (!storeCache) storeCache = loadStore();
  return storeCache;
}

/** The river (or estuary, or coastal water) a postcode district belongs to. Null outside England. */
export async function getRiverForDistrict(district: string): Promise<DistrictRiver | null> {
  const store = await getStore();
  const link = store.byDistrict.get(district.toUpperCase());
  if (!link) return null;
  const river = store.rivers.get(link.waterBodyId);
  return river ? { river, matchType: link.matchType, distanceKm: link.distanceKm } : null;
}

export interface AreaRivers {
  summary: RiverStatusSummary;
  /** Each water body once, with the districts that belong to it, worst ecological class first. */
  rivers: { river: RiverStatus; districts: string[] }[];
}

const WORST_FIRST: Record<string, number> = { Bad: 0, Poor: 1, Moderate: 2, Good: 3, High: 4 };

/** The rivers behind a set of districts: a city, a region or a supplier's patch. */
export async function getRiversForDistricts(districts: string[]): Promise<AreaRivers | null> {
  const store = await getStore();
  const grouped = new Map<string, string[]>();
  for (const d of districts) {
    const link = store.byDistrict.get(d.toUpperCase());
    if (!link) continue;
    const list = grouped.get(link.waterBodyId) ?? [];
    list.push(d.toUpperCase());
    grouped.set(link.waterBodyId, list);
  }
  const rivers: AreaRivers["rivers"] = [];
  for (const [id, list] of grouped) {
    const river = store.rivers.get(id);
    if (river) rivers.push({ river, districts: list.sort((a, b) => a.localeCompare(b, "en", { numeric: true })) });
  }
  if (rivers.length === 0) return null;
  rivers.sort(
    (a, b) =>
      (WORST_FIRST[a.river.ecologicalClass ?? ""] ?? 5) - (WORST_FIRST[b.river.ecologicalClass ?? ""] ?? 5) ||
      b.districts.length - a.districts.length ||
      a.river.name.localeCompare(b.river.name),
  );
  return { summary: summariseRivers(rivers.map((r) => r.river)), rivers };
}

export interface NationalRivers {
  /** Rivers, estuaries and coastal waters together. */
  all: RiverStatusSummary;
  riversOnly: RiverStatusSummary;
  /** Every water body that has at least one postcode district, for the index table. */
  withDistricts: { river: RiverStatus; districts: string[] }[];
}

export async function getNationalRivers(): Promise<NationalRivers | null> {
  const store = await getStore();
  if (store.rivers.size === 0) return null;
  const everything = Array.from(store.rivers.values());
  const area = await getRiversForDistricts(Array.from(store.byDistrict.keys()));
  return {
    all: summariseRivers(everything),
    riversOnly: summariseRivers(everything.filter((r) => r.type === "River")),
    withDistricts: area?.rivers ?? [],
  };
}
