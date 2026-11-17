/**
 * Scottish Water Zone Data → Supabase Import
 *
 * Downloads zone PDFs from Scottish Water, parses them, and imports
 * parameter data into drinking_water_readings + page_data.
 *
 * Usage:
 *   export $(grep -E "^(NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY)=" .env.local | xargs)
 *   npx tsx scripts/import-scottish-water.ts            # download every zone report and import
 *   npx tsx scripts/import-scottish-water.ts --stored   # import again from the reports parsed last time
 */

import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "fs";
import { parseScottishZonePdf } from "../src/lib/scottish-pdf-parser";
import { rebuildPageFromRecords } from "../src/lib/db-writer";
import { scottishZoneReadings } from "../src/lib/scottish-zone-readings";
import { SCOTTISH_ZONE_POSTCODES, SCOTTISH_ZONE_SLUGS } from "../src/lib/scottish-zones";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE env vars. Run:");
  console.error('  export $(grep -E "^(NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY)=" .env.local | xargs)');
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

const SW_PDF_BASE =
  "https://www.scottishwater.co.uk/-/media/scottishwater/water-quality/data/123/202512/water-202501";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-GB,en;q=0.9",
  Referer: "https://www.scottishwater.co.uk/",
};

const DATA_DIR = "data/scottish-water/zones";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** --stored: write the figures again from the reports parsed last time, without downloading. */
const stored = process.argv.includes("--stored");

async function downloadZonePdf(slug: string): Promise<Buffer | null> {
  // Check local cache first
  const localPath = `${DATA_DIR}/${slug}.pdf`;
  if (existsSync(localPath)) {
    const buf = readFileSync(localPath);
    if (buf.length > 500) return buf;
  }

  const url = `${SW_PDF_BASE}-${slug}-last-12-months.pdf`;
  try {
    const res = await fetch(url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      console.warn(`  ${slug}: HTTP ${res.status}`);
      return null;
    }
    const arrayBuf = await res.arrayBuffer();
    const buf = Buffer.from(arrayBuf);

    // Verify it's actually a PDF
    if (buf.length < 500 || buf.toString("utf-8", 0, 5) !== "%PDF-") {
      console.warn(`  ${slug}: not a valid PDF (${buf.length} bytes)`);
      return null;
    }

    // Cache locally
    writeFileSync(localPath, buf);
    return buf;
  } catch (err) {
    console.warn(`  ${slug}: download failed — ${err instanceof Error ? err.message : err}`);
    return null;
  }
}

async function main() {
  mkdirSync(DATA_DIR, { recursive: true });

  // Get unique zone slugs
  const uniqueSlugs = [...new Set(Object.values(SCOTTISH_ZONE_SLUGS))];
  console.log(`Downloading ${uniqueSlugs.length} zone PDFs...`);

  // ── Step 1: Download and parse all zone PDFs ─────────────────────────────
  type ParsedZone = Awaited<ReturnType<typeof parseScottishZonePdf>>;
  const parsedZones = new Map<string, NonNullable<ParsedZone>>();
  let downloadFailed = 0;
  let parseFailed = 0;

  if (stored) {
    // Reuse the reports parsed last time; nothing is downloaded.
    for (const z of JSON.parse(readFileSync("data/scottish-water/all-zones.json", "utf-8")) as NonNullable<ParsedZone>[]) parsedZones.set(z.zone_slug, z);
  }
  for (let i = 0; !stored && i < uniqueSlugs.length; i++) {
    const slug = uniqueSlugs[i];

    const buffer = await downloadZonePdf(slug);
    if (!buffer) {
      downloadFailed++;
      await sleep(200);
      continue;
    }

    const zone = await parseScottishZonePdf(buffer, slug);
    if (!zone) {
      parseFailed++;
      await sleep(200);
      continue;
    }

    parsedZones.set(slug, zone);
    process.stdout.write(`\r  [${i + 1}/${uniqueSlugs.length}] ${slug} — ${zone.parameters.length} params`);

    await sleep(200);
  }

  console.log(`\n\nDownloaded: ${parsedZones.size} OK, ${downloadFailed} download failures, ${parseFailed} parse failures`);

  if (parsedZones.size === 0) {
    console.error("No zones parsed — aborting");
    process.exit(1);
  }

  // Save all-zones.json for reference
  const allZones = Array.from(parsedZones.values());
  if (!stored) {
    writeFileSync("data/scottish-water/all-zones.json", JSON.stringify(allZones, null, 2));
    console.log(`Saved ${allZones.length} zones to data/scottish-water/all-zones.json`);
  }

  // ── Step 2: Import to database ───────────────────────────────────────────
  console.log("\nImporting to Supabase...");

  let totalPostcodes = 0;
  let totalReadings = 0;

  for (const [zoneName, postcodes] of Object.entries(SCOTTISH_ZONE_POSTCODES)) {
    const slug = SCOTTISH_ZONE_SLUGS[zoneName];
    if (!slug) continue;

    const zone = parsedZones.get(slug);
    if (!zone) {
      console.log(`  Skipping ${zoneName} — no parsed data`);
      continue;
    }

    const figures = scottishZoneReadings(zone);
    const sampleDate = zone.date_to || `${zone.year}-12-31`;
    for (const district of postcodes) {
      const readings = figures.map((r) => ({
        postcode_district: district,
        supplier_id: "scottish-water",
        supply_zone: zone.zone_name,
        determinand: r.determinand,
        value: r.value,
        unit: r.unit,
        uk_limit: r.ukLimit,
        who_guideline: null,
        sample_date: sampleDate,
        source: "scottish_water_zone" as const,
        source_ref: `sw-zone:${zone.zone_slug}`,
      }));
      if (readings.length === 0) continue;

      // Delete existing Scottish Water data for this district
      await db.from("drinking_water_readings").delete().eq("postcode_district", district).eq("source", "scottish_water_zone");
      for (let j = 0; j < readings.length; j += 500) {
        const { error } = await db.from("drinking_water_readings").insert(readings.slice(j, j + 500));
        if (error) console.error(`  Error inserting readings for ${district}:`, error.message);
      }

      // The page figures, built the way the refresh job builds them.
      await rebuildPageFromRecords(
        district,
        figures.map((r) => ({ sampleId: `sw-zone:${zone.zone_slug}`, sampleDate, determinand: r.determinand, dwiCode: "", unit: r.unit, belowDetectionLimit: false, value: r.value, lsoa: "" })),
      );
      await db.from("postcode_districts").update({ supply_zone: zone.zone_name }).eq("id", district);

      totalReadings += readings.length;
      totalPostcodes++;
    }

    process.stdout.write(`\r  ${zoneName}: done (${totalPostcodes} postcodes, ${totalReadings} readings total)`);
  }

  console.log(`\n\nDone! ${totalPostcodes} postcodes updated, ${totalReadings} readings imported`);
}

main().catch(console.error);
