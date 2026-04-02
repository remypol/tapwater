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
import type { StreamRecord } from "./stream-api";
import type { ScoreResult } from "./scoring";

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
 * Bulk insert Stream tap water readings into drinking_water_readings table.
 */
export async function writeStreamReadings(
  district: string,
  supplierId: string,
  records: StreamRecord[],
): Promise<void> {
  const db = getSupabase();

  // Delete previous readings for this district to avoid duplicates
  await db
    .from("drinking_water_readings")
    .delete()
    .eq("postcode_district", district)
    .eq("source", "stream_portal");

  if (records.length === 0) return;

  const rows = records.map((r) => ({
    postcode_district: district,
    supplier_id: supplierId,
    supply_zone: null,
    determinand: r.determinand,
    value: r.value,
    unit: r.unit,
    uk_limit: null,
    who_guideline: null,
    sample_date: r.sampleDate,
    source: "stream_portal",
    source_ref: r.sampleId,
  }));

  // Batch insert in chunks of 1000
  for (let i = 0; i < rows.length; i += 1000) {
    const chunk = rows.slice(i, i + 1000);
    const { error } = await db.from("drinking_water_readings").insert(chunk);
    if (error) {
      console.error(`[db-writer] drinking_water_readings insert failed for ${district}:`, error);
    }
  }
}

/**
 * Compute score from seed data (and optional Stream data) and upsert into page_data.
 */
export async function upsertPageData(
  seedData: PostcodeSeedData,
  streamRecords?: StreamRecord[],
): Promise<void> {
  const db = getSupabase();

  // Score EA environmental readings
  const eaObservations = seedData.topReadings.map((r) => ({
    determinand: r.determinand,
    value: r.value,
    unit: r.unit,
    date: r.date,
  }));
  const eaScore: ScoreResult = computeScore(eaObservations, "environmental");

  // Score Stream drinking water readings (if available)
  const hasStream = streamRecords && streamRecords.length > 0;
  let drinkingScore: ScoreResult | null = null;

  if (hasStream) {
    const drinkingObs = streamRecords.map((r) => ({
      determinand: r.determinand,
      value: r.value,
      unit: r.unit,
      date: r.sampleDate,
    }));
    drinkingScore = computeScore(drinkingObs);
  }

  // Primary score: drinking water if available, else EA
  const primaryScore = drinkingScore ?? eaScore;

  // Nearby postcodes
  const nearby: string[] = [];
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

  // Date range from Stream records
  let dateRangeFrom: string | null = null;
  let dateRangeTo: string | null = null;
  if (hasStream) {
    const dates = streamRecords
      .map((r) => r.sampleDate)
      .filter(Boolean)
      .sort();
    dateRangeFrom = dates[0] ?? null;
    dateRangeTo = dates[dates.length - 1] ?? null;
  }

  // Most recent date (from whichever source has data)
  const allDates = [
    ...(hasStream ? streamRecords.map((r) => r.sampleDate) : []),
    ...seedData.topReadings.map((r) => r.date?.split("T")[0]).filter(Boolean),
  ].sort().reverse();
  const lastDataUpdate = allDates[0] ?? null;

  const dataSource = hasStream ? "stream" : "ea-only";

  const row = {
    postcode_district: seedData.district,
    safety_score: primaryScore.safetyScore,
    score_grade: primaryScore.scoreGrade,
    contaminants_tested: primaryScore.contaminantsTested,
    contaminants_flagged: primaryScore.contaminantsFlagged,
    pfas_detected: primaryScore.pfasDetected,
    pfas_level: primaryScore.pfasLevel,
    pfas_source: primaryScore.pfasDetected
      ? (hasStream ? "drinking" : "environmental")
      : null,
    all_readings: eaScore.readings,
    drinking_water_readings: drinkingScore?.readings ?? null,
    environmental_context: {
      samplingPointCount: seedData.samplingPointCount,
      recentObservations: seedData.recentObservations,
      topReadings: seedData.topReadings,
    },
    nearby_postcodes: nearby,
    last_data_update: lastDataUpdate,
    summary_text: null,
    data_source: dataSource,
    sample_count: hasStream ? streamRecords.length : 0,
    date_range_from: dateRangeFrom,
    date_range_to: dateRangeTo,
  };

  const { error } = await db
    .from("page_data")
    .upsert(row, { onConflict: "postcode_district" });

  if (error) {
    console.error(`[db-writer] page_data upsert failed for ${seedData.district}:`, error);
    throw error;
  }
}

/**
 * Process and store a single postcode's data.
 * Calls upsertPostcodeDistrict then upsertPageData in sequence.
 */
export async function writePostcodeData(
  seedData: PostcodeSeedData,
  streamRecords?: StreamRecord[],
): Promise<void> {
  await upsertPostcodeDistrict(seedData);

  if (streamRecords && streamRecords.length > 0) {
    const supplier = getSupplier(seedData.city);
    await writeStreamReadings(seedData.district, supplier.id, streamRecords);
  }

  await upsertPageData(seedData, streamRecords);
}
