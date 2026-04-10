/**
 * Scottish Water Monthly Cron
 *
 * Downloads zone PDFs from Scottish Water, parses them, and upserts
 * into drinking_water_readings + page_data.
 *
 * Schedule: 0 5 1 * *  (1st of each month, 05:00 UTC)
 * Max duration: 300s (Vercel serverless limit)
 *
 * Strategy:
 * - Load zone→postcode mapping from scottish-zones.ts
 * - Download zone PDFs sequentially with 200ms rate-limit delay
 * - Skip zones that fail to download/parse
 * - Batch DB writes in 500-row chunks
 * - Delete + insert readings per postcode
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { parseScottishZonePdf } from "@/lib/scottish-pdf-parser";
import { computeScore } from "@/lib/scoring";
import { SCOTTISH_ZONE_POSTCODES, SCOTTISH_ZONE_SLUGS } from "@/lib/scottish-zones";

export const maxDuration = 300;

const SW_PDF_BASE =
  "https://www.scottishwater.co.uk/-/media/scottishwater/water-quality/data/123/202512/water-202501";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-GB,en;q=0.9",
  Referer: "https://www.scottishwater.co.uk/",
};

/** Download a zone PDF — returns Buffer or null on failure */
async function downloadZonePdf(slug: string): Promise<Buffer | null> {
  const url = `${SW_PDF_BASE}-${slug}-last-12-months.pdf`;
  try {
    const res = await fetch(url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      console.warn(`[scottish-cron] ${slug}: HTTP ${res.status}`);
      return null;
    }
    const arrayBuf = await res.arrayBuffer();
    const buf = Buffer.from(arrayBuf);
    // Verify it's actually a PDF (not an HTML error page)
    if (buf.length < 500 || buf.toString("utf-8", 0, 5) !== "%PDF-") {
      console.warn(`[scottish-cron] ${slug}: not a valid PDF (${buf.length} bytes)`);
      return null;
    }
    return buf;
  } catch (err) {
    console.warn(
      `[scottish-cron] ${slug}: download failed — ${err instanceof Error ? err.message : err}`,
    );
    return null;
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || cronSecret.length < 24) {
    console.error("[scottish-cron] CRON_SECRET is missing or too short (min 24 chars)");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getSupabase();
  const startedAt = new Date().toISOString();

  // Get unique zone slugs to download
  const zoneSlugs = Object.values(SCOTTISH_ZONE_SLUGS);
  const uniqueSlugs = [...new Set(zoneSlugs)];

  console.log(`[scottish-cron] Starting — ${uniqueSlugs.length} zones`);

  // ── Step 1: Download and parse all zone PDFs ─────────────────────────────
  type ParsedZone = Awaited<ReturnType<typeof parseScottishZonePdf>>;
  const parsedZones = new Map<string, NonNullable<ParsedZone>>();
  let downloadFailed = 0;
  let parseFailed = 0;

  for (let i = 0; i < uniqueSlugs.length; i++) {
    const slug = uniqueSlugs[i];

    const buffer = await downloadZonePdf(slug);
    if (!buffer) {
      downloadFailed++;
      if (i < uniqueSlugs.length - 1) await sleep(200);
      continue;
    }

    const zone = await parseScottishZonePdf(buffer, slug);
    if (!zone) {
      parseFailed++;
      console.warn(`[scottish-cron] ${slug}: parse returned null`);
      if (i < uniqueSlugs.length - 1) await sleep(200);
      continue;
    }

    parsedZones.set(slug, zone);

    // Rate limit — 200ms between requests
    if (i < uniqueSlugs.length - 1) {
      await sleep(200);
    }
  }

  console.log(
    `[scottish-cron] Downloaded: ${parsedZones.size} OK, ${downloadFailed} download failures, ${parseFailed} parse failures`,
  );

  if (parsedZones.size === 0) {
    return NextResponse.json(
      { error: "No zones parsed — aborting" },
      { status: 500 },
    );
  }

  // ── Step 2: Assign zones to postcodes and write to DB ────────────────────
  let totalPostcodes = 0;
  let totalReadings = 0;

  for (const [zoneName, postcodes] of Object.entries(SCOTTISH_ZONE_POSTCODES)) {
    const slug = SCOTTISH_ZONE_SLUGS[zoneName];
    if (!slug) continue;

    const zone = parsedZones.get(slug);
    if (!zone) {
      console.log(`[scottish-cron] Skipping zone ${zoneName} — no parsed data`);
      continue;
    }

    for (const district of postcodes) {
      // Build observations for scoring
      const observations = zone.parameters
        .filter((p) => p.mean !== null || p.max !== null)
        .map((p) => {
          const val = p.mean ?? p.max;
          return {
            determinand: p.parameter,
            value: val?.value ?? 0,
            unit: p.unit,
            date: zone.date_to || `${zone.year}-12-31`,
          };
        });

      const score = computeScore(observations, "drinking");

      // Build DB rows
      const readings = zone.parameters
        .filter((p) => p.mean !== null || p.max !== null)
        .map((p) => ({
          postcode_district: district,
          supplier_id: "scottish-water",
          supply_zone: zone.zone_name,
          determinand: p.parameter,
          value: p.mean?.value ?? p.max?.value ?? 0,
          unit: p.unit,
          uk_limit: p.regulatory_limit ? parseFloat(p.regulatory_limit) || null : null,
          who_guideline: null,
          sample_date: zone.date_to || `${zone.year}-12-31`,
          source: "scottish_water_zone" as const,
          source_ref: `sw-zone:${zone.zone_slug}`,
        }));

      // Delete stale readings for this district
      const { error: delError } = await db
        .from("drinking_water_readings")
        .delete()
        .eq("postcode_district", district)
        .eq("source", "scottish_water_zone");

      if (delError) {
        console.error(`[scottish-cron] Delete error for ${district}:`, delError.message);
      }

      // Insert new readings in 500-row chunks
      for (let j = 0; j < readings.length; j += 500) {
        const chunk = readings.slice(j, j + 500);
        const { error: insError } = await db
          .from("drinking_water_readings")
          .insert(chunk);
        if (insError) {
          console.error(`[scottish-cron] Insert error for ${district}:`, insError.message);
        }
      }

      // Upsert page_data
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
          date_range_from: zone.date_from || `${zone.year}-01-01`,
          date_range_to: zone.date_to || `${zone.year}-12-31`,
          last_data_update: zone.date_to || `${zone.year}-12-31`,
        },
        { onConflict: "postcode_district" },
      );

      if (upsertError) {
        console.error(`[scottish-cron] Upsert page_data error for ${district}:`, upsertError.message);
      }

      totalReadings += readings.length;
      totalPostcodes++;
    }

    console.log(`[scottish-cron] ${zoneName}: ${postcodes.length} postcodes done`);
  }

  const completedAt = new Date().toISOString();
  const elapsed = Math.round(
    (new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000,
  );

  // Log to scrape_log
  await db.from("scrape_log").insert({
    source: "scottish-water-cron",
    status: "success",
    records_fetched: parsedZones.size,
    records_updated: totalPostcodes,
    started_at: startedAt,
    completed_at: completedAt,
  });

  console.log(
    `[scottish-cron] Done in ${elapsed}s — ${totalPostcodes} postcodes, ${totalReadings} readings`,
  );

  return NextResponse.json({
    ok: true,
    zones_parsed: parsedZones.size,
    download_failures: downloadFailed,
    parse_failures: parseFailed,
    postcodes_updated: totalPostcodes,
    readings_inserted: totalReadings,
    elapsed_seconds: elapsed,
  });
}
