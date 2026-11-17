/**
 * Database writer for TapWater.uk pipeline
 *
 * Takes raw EA seed data, computes scores, and upserts into Supabase.
 */

import { getSupabase } from "./supabase";
import { getSupplierFor } from "./suppliers";
import { computeScore } from "./scoring";
import type { PostcodeSeedData } from "./ea-fetcher";
import type { StreamRecord } from "./stream-api";
import type { ScoreResult } from "./scoring";

/**
 * Upsert a postcode district into the database.
 * Creates the postcode_districts row with geo data and supplier mapping.
 */
export async function upsertPostcodeDistrict(seedData: PostcodeSeedData): Promise<void> {
  const db = getSupabase();
  const supplier = getSupplierFor(seedData.district, seedData.city);

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
      // supply_zone is left alone: it used to be written as "<council> Central",
      // a name no water company uses. Only imports that know the real zone set it.
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

  // Only replace existing data if we have new data — prevents data loss on API outages
  if (records.length === 0) return;

  // Delete previous readings ONLY when we have replacements
  await db
    .from("drinking_water_readings")
    .delete()
    .eq("postcode_district", district)
    .eq("source", "stream_portal");

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
      throw new Error(`drinking_water_readings insert failed for ${district}: ${error.message}`);
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

  // Nearby postcodes — same city first, then geographically close
  const { data: sameCity } = await db
    .from("postcode_districts")
    .select("id")
    .eq("city", seedData.city)
    .neq("id", seedData.district)
    .limit(10);

  const nearby: string[] = (sameCity ?? []).map((d) => d.id);

  if (nearby.length < 10) {
    const buffer = 0.05; // ~5.5 km
    const { data: geoNearby } = await db
      .from("postcode_districts")
      .select("id")
      .neq("id", seedData.district)
      .gte("latitude", seedData.latitude - buffer)
      .lte("latitude", seedData.latitude + buffer)
      .gte("longitude", seedData.longitude - buffer)
      .lte("longitude", seedData.longitude + buffer)
      .limit(10 - nearby.length);

    for (const d of geoNearby ?? []) {
      if (!nearby.includes(d.id)) nearby.push(d.id);
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
 * Readings that a script imported, for companies we cannot fetch on each pass:
 * Thames Water and Scottish Water publish reports per supply zone, and NI
 * Water's samples come from its own yearly file.
 *
 * The refresh job must use these when a company has no live source. Until
 * November 2026 it only did so for Thames, so every pass rewrote the 522
 * Scottish and Northern Irish districts as "no tap-water results" although the
 * table held 92,000 readings for them.
 */
const IMPORTED_BY_SUPPLIER: Record<string, string> = {
  "thames-water": "thames_water_zone",
  "scottish-water": "scottish_water_zone",
  // NI Water's rows were stored under the portal's label by its import script.
  "ni-water": "stream_portal",
};

export async function getImportedReadings(district: string, supplierId: string): Promise<StreamRecord[] | null> {
  const source = IMPORTED_BY_SUPPLIER[supplierId];
  if (!source) return null;

  const db = getSupabase();
  const records: StreamRecord[] = [];
  const PAGE = 1000;
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await db
      .from("drinking_water_readings")
      .select("id, determinand, value, unit, sample_date, source_ref")
      .eq("postcode_district", district)
      .eq("supplier_id", supplierId)
      .eq("source", source)
      .order("id", { ascending: true })
      .range(offset, offset + PAGE - 1);
    if (error) return null;
    for (const r of data ?? []) {
      records.push({
        sampleId: r.source_ref ?? "",
        sampleDate: r.sample_date,
        determinand: r.determinand,
        dwiCode: "",
        unit: r.unit ?? "",
        belowDetectionLimit: false,
        value: Number(r.value),
        lsoa: "",
      });
    }
    if (!data || data.length < PAGE) break;
  }
  return records.length > 0 ? records : null;
}

/**
 * Rebuild one district's page figures from tap-water records, keeping the
 * Environment Agency layer the page already has. For import scripts, which
 * know the readings and must not fetch the river layer again. Pass no records
 * to leave the page on the river and groundwater layer alone. Returns false
 * when the district has no row.
 */
export async function rebuildPageFromRecords(district: string, records?: StreamRecord[]): Promise<boolean> {
  const db = getSupabase();
  const { data: row } = await db
    .from("postcode_districts")
    .select("area_name, city, region, latitude, longitude")
    .eq("id", district)
    .maybeSingle();
  if (!row) return false;
  const { data: page } = await db.from("page_data").select("environmental_context").eq("postcode_district", district).maybeSingle();
  const ctx = (page?.environmental_context ?? {}) as Partial<PostcodeSeedData>;
  await upsertPageData(
    {
      district,
      areaName: row.area_name,
      city: row.city,
      region: row.region,
      latitude: row.latitude,
      longitude: row.longitude,
      samplingPointCount: ctx.samplingPointCount ?? 0,
      recentObservations: ctx.recentObservations ?? 0,
      pfasDetected: false,
      topReadings: ctx.topReadings ?? [],
    },
    records && records.length > 0 ? records : undefined,
  );
  return true;
}

/**
 * Process and store a single postcode's data.
 * Calls upsertPostcodeDistrict then upsertPageData in sequence. Fetched
 * records are stored first; imported ones are only used for the page figures.
 */
export async function writePostcodeData(
  seedData: PostcodeSeedData,
  streamRecords?: StreamRecord[],
  /** True when the records came from getImportedReadings: they are already stored and must not be written again. */
  alreadyStored = false,
): Promise<void> {
  await upsertPostcodeDistrict(seedData);

  if (streamRecords && streamRecords.length > 0 && !alreadyStored) {
    const supplier = getSupplierFor(seedData.district, seedData.city);
    await writeStreamReadings(seedData.district, supplier.id, streamRecords);
  }

  await upsertPageData(seedData, streamRecords);
}
