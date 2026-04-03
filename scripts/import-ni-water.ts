/**
 * NI Water CSV → Supabase Import
 *
 * Downloads and imports NI Water tap water quality data from OpenDataNI.
 * NI Water publishes annual CSVs with actual postcodes for Customer Tap samples.
 *
 * Usage: npx tsx scripts/import-ni-water.ts
 *
 * Source: https://admin.opendatani.gov.uk/dataset/ni-water-customer-tap-authorised-supply-point-results
 */

import { createClient } from "@supabase/supabase-js";
import { createReadStream } from "fs";
import { createInterface } from "readline";
import { computeScore } from "../src/lib/scoring";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE env vars");
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

const CSV_URL =
  "https://admin.opendatani.gov.uk/dataset/38a9a8f1-9346-41a2-8e5f-944d87d9caf2/resource/02d85526-c082-482c-b205-a318f97fd18d/download/2024-ni-water-customer-tap-supply-point-results.csv";

const LOCAL_PATH = "/tmp/ni-water-2024.csv";

interface NiReading {
  district: string;
  parameter: string;
  value: number;
  unit: string;
  pcvLimit: string;
  date: string;
  belowLimit: boolean;
}

function parseDate(dateStr: string): string {
  // Format: "06/02/2024 07:45" → DD/MM/YYYY
  const parts = dateStr.split(" ")[0].split("/");
  if (parts.length !== 3) return "";
  const [day, month, year] = parts;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

async function main() {
  // Download if not present
  const fs = await import("fs");
  if (!fs.existsSync(LOCAL_PATH)) {
    console.log("Downloading NI Water 2024 CSV...");
    const res = await fetch(CSV_URL);
    const text = await res.text();
    fs.writeFileSync(LOCAL_PATH, text);
    console.log("Downloaded.");
  }

  // Parse CSV
  const readingsByDistrict = new Map<string, NiReading[]>();
  const rl = createInterface({ input: createReadStream(LOCAL_PATH, { encoding: "utf-8" }) });

  let headers: string[] = [];
  let lineNum = 0;

  for await (const line of rl) {
    lineNum++;
    if (lineNum === 1) {
      headers = parseCsvLine(line.replace(/^\uFEFF/, ""));
      continue;
    }

    const cols = parseCsvLine(line);
    const location = cols[headers.indexOf("Sample Location")];
    if (location !== "Customer Tap") continue;

    const postcode = cols[headers.indexOf("Postcode")]?.trim();
    if (!postcode || postcode === "Withheld") continue;

    // Extract district (everything before last space+3-digit part)
    const district = postcode.split(" ")[0];
    if (!district.startsWith("BT")) continue;

    const result = cols[headers.indexOf("Result")]?.trim() || "";
    const belowLimit = result.startsWith("<");
    const numVal = parseFloat(result.replace(/^</, "")) || 0;

    const reading: NiReading = {
      district,
      parameter: cols[headers.indexOf("Parameter")]?.trim() || "",
      value: numVal,
      unit: cols[headers.indexOf("Units")]?.trim() || "",
      pcvLimit: cols[headers.indexOf("PCV Limit")]?.trim() || "",
      date: parseDate(cols[headers.indexOf("Sample Date")] || ""),
      belowLimit,
    };

    if (!readingsByDistrict.has(district)) {
      readingsByDistrict.set(district, []);
    }
    readingsByDistrict.get(district)!.push(reading);
  }

  console.log(`Parsed ${readingsByDistrict.size} NI postcode districts`);

  // Ensure NI Water supplier exists
  await db.from("water_suppliers").upsert(
    { id: "ni-water", name: "NI Water", region: "Northern Ireland" },
    { onConflict: "id" },
  );

  // Process each district
  let imported = 0;
  let totalReadings = 0;

  for (const [district, readings] of readingsByDistrict.entries()) {
    // Ensure postcode_districts row exists
    await db.from("postcode_districts").upsert(
      {
        id: district,
        area_name: district,
        city: "Northern Ireland",
        region: "Northern Ireland",
        latitude: 54.6,
        longitude: -6.0,
        supplier_id: "ni-water",
        has_page: true,
      },
      { onConflict: "id" },
    );

    // Delete old NI Water data
    await db
      .from("drinking_water_readings")
      .delete()
      .eq("postcode_district", district)
      .eq("source", "stream_portal");

    // Insert readings
    const rows = readings.map((r) => ({
      postcode_district: district,
      supplier_id: "ni-water",
      determinand: r.parameter,
      value: r.value,
      unit: r.unit,
      uk_limit: r.pcvLimit ? parseFloat(r.pcvLimit) || null : null,
      sample_date: r.date,
      source: "stream_portal" as const,
      source_ref: `ni-water-2024:${district}`,
    }));

    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500);
      await db.from("drinking_water_readings").insert(chunk);
    }

    // Compute score
    const observations = readings.map((r) => ({
      determinand: r.parameter,
      value: r.value,
      unit: r.unit,
      date: r.date,
    }));
    const score = computeScore(observations, "drinking");

    // Get date range
    const dates = readings.map((r) => r.date).filter(Boolean).sort();

    // Update page_data
    await db.from("page_data").upsert(
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
        sample_count: readings.length,
        date_range_from: dates[0] || null,
        date_range_to: dates[dates.length - 1] || null,
        last_data_update: dates[dates.length - 1] || null,
        all_readings: null,
        nearby_postcodes: [],
      },
      { onConflict: "postcode_district" },
    );

    imported++;
    totalReadings += readings.length;
    process.stdout.write(`\r  ${imported}/${readingsByDistrict.size} districts, ${totalReadings} readings...`);
  }

  console.log(`\nDone! ${imported} NI districts imported, ${totalReadings} readings`);
}

main().catch(console.error);
