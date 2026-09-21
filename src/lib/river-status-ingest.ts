/**
 * River classification ingest: Environment Agency → `river_status` and
 * `district_river_status`.
 *
 * Source: "WFD River Water Body Catchments Classification (Simplified)" and "WFD
 * Transitional and Coastal Water Bodies Classification (Simplified)" on the Defra Data
 * Services Platform, served as OGC API Features collections. About 3,800 river
 * catchments and 166 estuaries and coastal waters, 45 MB of GeoJSON, fetched in six
 * pages in under half a minute.
 *
 * Each classification release is a new dataset with the year in its slug, so the
 * run tries next year's and this year's slugs before falling back to the 2025
 * release. When the Environment Agency publishes a new round the monthly cron picks
 * it up without a code change, provided they keep the naming. If they do not, the
 * run still succeeds on the older release and the weekly health check shows the
 * classification year standing still.
 *
 * The geometry is only used here, to work out which catchment each postcode
 * district's centre falls in. It is not stored.
 *
 * Used by `/api/cron/river-status` and `scripts/ingest-river-status.ts`.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  findCatchment,
  geometryBBox,
  nearestWaterBody,
  parseRiverFeature,
  RIVER_STATUS_SOURCE,
  type CatchmentGeometry,
  type CatchmentShape,
  type RiverStatus,
} from "./river-status";

const FIRST_RELEASE_YEAR = 2025;
const PAGE_LIMIT = 1000;
const NEAREST_MAX_KM = 5;
const HEADERS = { Accept: "application/geo+json, application/json", "User-Agent": "tapwater.uk river status ingest" };

/** Cycle number printed in the dataset name: cycle 4 covers classifications from 2025. */
function cycleForYear(year: number): number {
  return year >= 2025 ? 4 : 3;
}

/** The two releases we read: river catchments, and estuaries plus coastal waters. */
export const DATASETS = ["River_Water_Body_Catchments", "Transitional_and_Coastal_Water_Bodies"] as const;
export type Dataset = (typeof DATASETS)[number];

export function collectionUrl(year: number, dataset: Dataset = "River_Water_Body_Catchments"): string {
  const cycle = cycleForYear(year);
  const collection = `Simplified_WFD_${dataset}_Cycle_${cycle}_Classification_${year}`;
  const slug = collection.toLowerCase().replace(/_/g, "-");
  return `https://environment.data.gov.uk/spatialdata/${slug}/ogc/features/v1/collections/${collection}/items`;
}

/** Newest first: next year, this year, … down to the first release we know exists. */
export function candidateYears(now: Date): number[] {
  const years: number[] = [];
  for (let y = now.getUTCFullYear() + 1; y >= FIRST_RELEASE_YEAR; y--) years.push(y);
  return years;
}

interface Feature {
  properties: Record<string, unknown> | null;
  geometry: CatchmentGeometry | null;
}

async function fetchPage(url: string): Promise<{ features: Feature[]; next: string | null } | null> {
  const res = await fetch(url, { headers: HEADERS });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`EA river classification API answered ${res.status} for ${url}`);
  const body = (await res.json()) as {
    features?: Feature[];
    links?: { rel: string; href: string }[];
  };
  const next = body.links?.find((l) => l.rel === "next")?.href ?? null;
  return { features: body.features ?? [], next };
}

export interface FetchedRivers {
  year: number;
  rivers: RiverStatus[];
  shapes: CatchmentShape[];
}

/** Download the newest release of one dataset that exists. */
export async function fetchRiverClassifications(
  dataset: Dataset = "River_Water_Body_Catchments",
  now = new Date(),
): Promise<FetchedRivers> {
  for (const year of candidateYears(now)) {
    let url: string | null = `${collectionUrl(year, dataset)}?f=json&limit=${PAGE_LIMIT}`;
    const first = await fetchPage(url);
    if (!first) continue; // no release for this year

    const rivers: RiverStatus[] = [];
    const shapes: CatchmentShape[] = [];
    let page: Awaited<ReturnType<typeof fetchPage>> = first;
    // Guard against a paging loop if the API ever repeats a `next` link.
    for (let guard = 0; page && guard < 50; guard++) {
      for (const f of page.features) {
        const river = f.properties ? parseRiverFeature(f.properties) : null;
        if (!river) continue;
        rivers.push(river);
        if (f.geometry && (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon")) {
          shapes.push({ waterBodyId: river.waterBodyId, bbox: geometryBBox(f.geometry), geometry: f.geometry });
        }
      }
      url = page.next;
      if (!url) break;
      page = await fetchPage(url);
    }
    if (rivers.length > 0) return { year, rivers, shapes };
  }
  throw new Error(`No Environment Agency classification release could be fetched for ${dataset}`);
}

export interface RiverIngestResult {
  classificationYear: number;
  riversUpserted: number;
  districtsMatched: number;
  districtsUnmatched: number;
}

/** The parts of a rating a reader would notice changing. */
export function ratingFingerprint(
  year: number,
  ecological: string | null,
  chemical: string | null,
  elements: unknown,
): string {
  const list = Array.isArray(elements) ? elements : [];
  const parts = list
    .map((e) => `${(e as { key?: string }).key}=${(e as { status?: string }).status}`)
    .sort();
  return [year, ecological ?? "", chemical ?? "", ...parts].join("|");
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function loadDistrictCentroids(
  db: SupabaseClient,
): Promise<{ district: string; lat: number; lng: number }[]> {
  const out: { district: string; lat: number; lng: number }[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await db
      .from("postcode_districts")
      .select("id, latitude, longitude")
      .order("id", { ascending: true })
      .range(offset, offset + 999);
    if (error) throw new Error(`postcode_districts read failed: ${error.message}`);
    for (const r of (data ?? []) as { id: string; latitude: number | null; longitude: number | null }[]) {
      if (r.latitude != null && r.longitude != null) out.push({ district: r.id, lat: r.latitude, lng: r.longitude });
    }
    if (!data || data.length < 1000) break;
  }
  return out;
}

export async function runRiverStatusIngest({ db }: { db: SupabaseClient }): Promise<RiverIngestResult> {
  let error: string | null = null;
  let result: RiverIngestResult = {
    classificationYear: 0,
    riversUpserted: 0,
    districtsMatched: 0,
    districtsUnmatched: 0,
  };

  try {
    const riverRelease = await fetchRiverClassifications("River_Water_Body_Catchments");
    const { year, shapes } = riverRelease;
    // A partial download must not replace a full table. England has ~3,800 river catchments.
    if (riverRelease.rivers.length < 3000) {
      throw new Error(`Only ${riverRelease.rivers.length} river catchments fetched; refusing to write a partial release`);
    }
    const coastal = await fetchRiverClassifications("Transitional_and_Coastal_Water_Bodies");

    // A catchment drawn in several parts arrives as several features with one id.
    const byId = new Map<string, RiverStatus>();
    for (const r of [...riverRelease.rivers, ...coastal.rivers]) byId.set(r.waterBodyId, r);
    const rivers = Array.from(byId.values());

    const now = new Date().toISOString();

    // `updated_at` is the date a rating last changed, not the date we last looked: pages
    // and the sitemap publish it as their modified date, and a date that moves every
    // month while the content stands still teaches search engines to ignore it.
    const existing = new Map<string, { fingerprint: string; updatedAt: string }>();
    for (let offset = 0; ; offset += 1000) {
      const { data, error: readError } = await db
        .from("river_status")
        .select("water_body_id, classification_year, ecological_class, chemical_class, elements, updated_at")
        .order("water_body_id", { ascending: true })
        .range(offset, offset + 999);
      if (readError) throw new Error(`river_status read failed: ${readError.message}`);
      for (const r of data ?? []) {
        existing.set(r.water_body_id, {
          fingerprint: ratingFingerprint(r.classification_year, r.ecological_class, r.chemical_class, r.elements),
          updatedAt: r.updated_at,
        });
      }
      if (!data || data.length < 1000) break;
    }
    const updatedAtFor = (r: RiverStatus): string => {
      const prev = existing.get(r.waterBodyId);
      const fp = ratingFingerprint(r.classificationYear || year, r.ecologicalClass, r.chemicalClass, r.elements);
      return prev && prev.fingerprint === fp ? prev.updatedAt : now;
    };

    for (const batch of chunk(rivers, 500)) {
      const { error: upsertError } = await db.from("river_status").upsert(
        batch.map((r) => ({
          water_body_id: r.waterBodyId,
          name: r.name,
          water_body_type: r.type,
          modified: r.modified,
          river_basin_district: r.riverBasinDistrict,
          management_catchment: r.managementCatchment,
          operational_catchment: r.operationalCatchment,
          classification_year: r.classificationYear || year,
          ecological_class: r.ecologicalClass,
          chemical_class: r.chemicalClass,
          priority_hazardous_class: r.priorityHazardousClass,
          ecological_change: r.ecologicalChange,
          drinking_water_protected_area: r.drinkingWaterProtectedArea,
          elements: r.elements,
          updated_at: updatedAtFor(r),
        })),
        { onConflict: "water_body_id" },
      );
      if (upsertError) throw new Error(`river_status upsert failed: ${upsertError.message}`);
    }

    const districts = await loadDistrictCentroids(db);
    const matches: {
      postcode_district: string;
      water_body_id: string;
      match_type: "within" | "nearest";
      distance_km: number | null;
      updated_at: string;
    }[] = [];
    // Tidal and seaside districts sit in no river catchment; they take the nearest
    // river, estuary or coastal water within NEAREST_MAX_KM. Anything further away
    // (Scotland, Wales, Northern Ireland) gets no row and the page shows nothing.
    const allShapes = [...shapes, ...coastal.shapes];
    for (const d of districts) {
      const id = findCatchment(d.lng, d.lat, shapes);
      if (id) {
        matches.push({ postcode_district: d.district, water_body_id: id, match_type: "within", distance_km: null, updated_at: now });
        continue;
      }
      const near = nearestWaterBody(d.lng, d.lat, allShapes, NEAREST_MAX_KM);
      if (near) {
        matches.push({
          postcode_district: d.district,
          water_body_id: near.waterBodyId,
          match_type: "nearest",
          distance_km: near.distanceKm,
          updated_at: now,
        });
      }
    }
    for (const batch of chunk(matches, 500)) {
      const { error: upsertError } = await db
        .from("district_river_status")
        .upsert(batch, { onConflict: "postcode_district" });
      if (upsertError) throw new Error(`district_river_status upsert failed: ${upsertError.message}`);
    }

    result = {
      classificationYear: year,
      riversUpserted: rivers.length,
      districtsMatched: matches.length,
      districtsUnmatched: districts.length - matches.length,
    };
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  const { error: logError } = await db.from("source_checks").insert({
    source: RIVER_STATUS_SOURCE,
    source_name: `classification ${result.classificationYear || "unknown"}`,
    status_code: error ? 500 : 200,
    items_found: result.riversUpserted,
    error,
  });
  if (logError) console.error("[river-status] failed to log source_check:", logError.message);

  if (error) throw new Error(error);
  return result;
}
