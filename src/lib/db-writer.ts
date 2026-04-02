/**
 * Database writer for TapWater.uk pipeline
 *
 * Takes raw EA seed data, computes scores, and upserts into Supabase.
 */

import { getSupabase } from "./supabase";
import { getSupplier } from "./suppliers";
import { computeScore } from "./scoring";
import type { PostcodeSeedData } from "./ea-fetcher";
import { TARGET_POSTCODES } from "./postcodes";

interface PageDataRow {
  postcode_district: string;
  safety_score: number;
  score_grade: string;
  contaminants_tested: number;
  contaminants_flagged: number;
  pfas_detected: boolean;
  pfas_level: number | null;
  pfas_source: string | null;
  all_readings: unknown;
  environmental_context: unknown;
  nearby_postcodes: string[];
  last_data_update: string | null;
  summary_text: string | null;
}

/**
 * Upsert a postcode district into the database.
 * Creates the postcode_districts row with geo data and supplier mapping.
 */
export async function upsertPostcodeDistrict(seedData: PostcodeSeedData): Promise<void> {
  const db = getSupabase();
  const supplier = getSupplier(seedData.city);

  // Ensure supplier exists
  if (supplier.id !== "unknown") {
    await db.from("water_suppliers").upsert(
      {
        id: supplier.id,
        name: supplier.name,
        region: seedData.region,
      },
      { onConflict: "id" },
    );
  }

  await db.from("postcode_districts").upsert(
    {
      id: seedData.district,
      area_name: seedData.areaName,
      city: seedData.city,
      region: seedData.region,
      latitude: seedData.latitude,
      longitude: seedData.longitude,
      supplier_id: supplier.id !== "unknown" ? supplier.id : null,
      supply_zone: `${seedData.city} Central`,
      has_page: true,
    },
    { onConflict: "id" },
  );
}

/**
 * Compute score from seed data and upsert into page_data.
 */
export async function upsertPageData(seedData: PostcodeSeedData): Promise<void> {
  const db = getSupabase();

  // Compute score
  const observations = seedData.topReadings.map((r) => ({
    determinand: r.determinand,
    value: r.value,
    unit: r.unit,
    date: r.date,
  }));
  const score = computeScore(observations);

  // Find nearby postcodes (same city or geographically close)
  // We check against all target postcodes to find neighbors
  // For a more accurate result, we'd query the DB, but this is fast enough
  const allPostcodes = TARGET_POSTCODES as readonly string[];
  const nearby: string[] = [];

  // We'll store a basic nearby list based on the target postcodes
  // The full nearby computation happens in the data layer at read time
  // For now, store empty — the data layer computes it
  // Actually, let's compute a basic version by querying existing postcode_districts
  const { data: allDistricts } = await db
    .from("postcode_districts")
    .select("id, city, latitude, longitude")
    .neq("id", seedData.district);

  if (allDistricts) {
    for (const other of allDistricts) {
      if (
        other.city === seedData.city ||
        Math.abs(other.latitude - seedData.latitude) < 0.05
      ) {
        nearby.push(other.id);
      }
      if (nearby.length >= 10) break;
    }
  }

  // Most recent observation date
  const dates = seedData.topReadings
    .map((r) => r.date?.split("T")[0])
    .filter(Boolean)
    .sort()
    .reverse();
  const lastDataUpdate = dates[0] ?? null;

  const row: PageDataRow = {
    postcode_district: seedData.district,
    safety_score: score.safetyScore,
    score_grade: score.scoreGrade,
    contaminants_tested: score.contaminantsTested,
    contaminants_flagged: score.contaminantsFlagged,
    pfas_detected: score.pfasDetected,
    pfas_level: score.pfasLevel,
    pfas_source: score.pfasDetected ? "environmental" : null,
    all_readings: score.readings,
    environmental_context: {
      samplingPointCount: seedData.samplingPointCount,
      recentObservations: seedData.recentObservations,
      topReadings: seedData.topReadings,
    },
    nearby_postcodes: nearby,
    last_data_update: lastDataUpdate,
    summary_text: null,
  };

  const { error } = await db.from("page_data").upsert(row, { onConflict: "postcode_district" });

  if (error) {
    console.error(`[db-writer] page_data upsert failed for ${seedData.district}:`, error);
    throw error;
  }
}

/**
 * Process and store a single postcode's data.
 * Calls upsertPostcodeDistrict then upsertPageData in sequence.
 */
export async function writePostcodeData(seedData: PostcodeSeedData): Promise<void> {
  await upsertPostcodeDistrict(seedData);
  await upsertPageData(seedData);
}
