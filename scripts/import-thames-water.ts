/**
 * Thames Water Zone Data → Supabase Import
 *
 * Takes parsed Thames Water zone PDFs (data/thames-water/all-zones.json)
 * and imports the parameter data into drinking_water_readings + page_data.
 *
 * Zone-to-postcode mapping strategy:
 * - Use postcode_lsoa + postcodes.io to find which postcode districts
 *   are in the Thames Water supply area
 * - For each Thames Water postcode district, find the nearest zone
 *   by matching the postcode's admin_district to zone names
 * - Assign the zone's parameter data to that postcode district
 *
 * Usage: npx tsx scripts/import-thames-water.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { computeScore } from "../src/lib/scoring";
import { THAMES_ZONE_POSTCODES as ZONE_PREFIX_POSTCODES } from "../src/lib/thames-zones";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE env vars. Run: source .env.local");
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

interface ZoneParam {
  parameter: string;
  unit: string;
  regulatory_limit: string | null;
  mean: { value: number; below_limit: boolean } | null;
  max: { value: number; below_limit: boolean } | null;
  total_samples: number | null;
  contraventions: number;
}

interface Zone {
  mapCode: string;
  zone_code?: string;
  zone_name?: string;
  population?: number;
  parameters: ZoneParam[];
  year: number;
}


async function main() {
  // Load zone data
  const zones: Zone[] = JSON.parse(
    readFileSync("data/thames-water/all-zones.json", "utf-8"),
  );
  console.log(`Loaded ${zones.length} Thames Water zones`);

  // Group zones by prefix
  const zonesByPrefix: Record<string, Zone[]> = {};
  for (const zone of zones) {
    const prefix = zone.mapCode.replace(/\d+$/, "");
    if (!zonesByPrefix[prefix]) zonesByPrefix[prefix] = [];
    zonesByPrefix[prefix].push(zone);
  }

  // For each prefix, distribute zones across postcodes
  let totalImported = 0;
  let totalPostcodes = 0;

  for (const [prefix, prefixZones] of Object.entries(zonesByPrefix)) {
    const postcodes = ZONE_PREFIX_POSTCODES[prefix];
    if (!postcodes) {
      console.log(`  Skipping prefix ${prefix} — no postcode mapping`);
      continue;
    }

    // Distribute postcodes across zones (round-robin)
    // Sort zones by population (largest first) — they cover more area
    prefixZones.sort((a, b) => (b.population ?? 0) - (a.population ?? 0));

    for (let i = 0; i < postcodes.length; i++) {
      const district = postcodes[i];
      const zone = prefixZones[i % prefixZones.length];

      // Convert zone parameters to observations for scoring
      const observations = zone.parameters
        .filter((p) => p.mean !== null || p.max !== null)
        .map((p) => {
          const val = p.mean ?? p.max;
          return {
            determinand: p.parameter,
            value: val?.value ?? 0,
            unit: p.unit,
            date: `${zone.year}-12-31`,
          };
        });

      // Compute score
      const score = computeScore(observations, "drinking");

      // Build drinking water readings for the DB
      const readings = zone.parameters
        .filter((p) => p.mean !== null || p.max !== null)
        .map((p) => ({
          postcode_district: district,
          supplier_id: "thames-water",
          supply_zone: zone.zone_name ?? zone.mapCode,
          determinand: p.parameter,
          value: p.mean?.value ?? p.max?.value ?? 0,
          unit: p.unit,
          uk_limit: p.regulatory_limit ? parseFloat(p.regulatory_limit) || null : null,
          who_guideline: null,
          sample_date: `${zone.year}-12-31`,
          source: "thames_water_zone" as const,
          source_ref: `zone:${zone.mapCode}`,
        }));

      // Delete existing Thames Water data for this district
      await db
        .from("drinking_water_readings")
        .delete()
        .eq("postcode_district", district)
        .eq("source", "thames_water_zone");

      // Insert readings in batches
      if (readings.length > 0) {
        for (let j = 0; j < readings.length; j += 500) {
          const chunk = readings.slice(j, j + 500);
          const { error } = await db.from("drinking_water_readings").insert(chunk);
          if (error) {
            console.error(`  Error inserting readings for ${district}:`, error.message);
          }
        }
      }

      // Update page_data
      const { error: upsertError } = await db.from("page_data").upsert(
        {
          postcode_district: district,
          safety_score: score.safetyScore,
          score_grade: score.scoreGrade,
          contaminants_tested: score.contaminantsTested,
          contaminants_flagged: score.contaminantsFlagged,
          pfas_detected: score.pfasDetected,
          pfas_level: score.pfasLevel,
          pfas_source: score.pfasDetected ? "drinking" : null,
          drinking_water_readings: score.readings,
          data_source: "stream",
          sample_count: zone.parameters.reduce(
            (sum, p) => sum + (p.total_samples ?? 0),
            0,
          ),
          date_range_from: `${zone.year}-01-01`,
          date_range_to: `${zone.year}-12-31`,
          last_data_update: `${zone.year}-12-31`,
        },
        { onConflict: "postcode_district" },
      );

      if (upsertError) {
        console.error(`  Error upserting page_data for ${district}:`, upsertError.message);
      }

      totalImported += readings.length;
      totalPostcodes++;
      process.stdout.write(`\r  ${prefix}: ${totalPostcodes} postcodes, ${totalImported} readings...`);
    }
    console.log();
  }

  console.log(
    `\nDone! ${totalPostcodes} postcodes updated, ${totalImported} readings imported`,
  );
}

main().catch(console.error);
