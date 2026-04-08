/**
 * Thames Water Monthly Cron
 *
 * Downloads zone PDFs from Thames Water API, parses them, and upserts
 * into drinking_water_readings + page_data. Replaces the two-step Python
 * pipeline (fetch-thames-water.py → import-thames-water.ts).
 *
 * Schedule: 0 4 1 * *  (1st of each month, 04:00 UTC)
 * Max duration: 300s (Vercel serverless limit)
 *
 * Strategy for 150 zones × 442 postcodes within the time budget:
 * - Download PDFs sequentially with 200ms rate-limit delay
 * - Skip zones that fail to download/parse — log and continue
 * - Batch DB writes in 500-row chunks
 * - Delete + insert readings per postcode, round-robin zone assignment
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { parseThamesZonePdf } from "@/lib/thames-pdf-parser";
import { computeScore } from "@/lib/scoring";
import { THAMES_ZONE_POSTCODES } from "@/lib/thames-zones";
import zonesJson from "@/../data/thames-water-zones.json";

export const maxDuration = 300;

const THAMES_API_BASE =
  "https://water-quality-api.prod.p.webapp.thameswater.co.uk/water-quality-api";

const ZONE_CODES: string[] = zonesJson as string[];

/** Download a zone PDF — returns Buffer or null on failure */
async function downloadZonePdf(mapCode: string): Promise<Buffer | null> {
  const url = `${THAMES_API_BASE}/Zone/${mapCode}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "application/pdf,*/*",
      },
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      console.warn(`[thames-cron] ${mapCode}: HTTP ${res.status}`);
      return null;
    }
    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  } catch (err) {
    console.warn(
      `[thames-cron] ${mapCode}: download failed — ${err instanceof Error ? err.message : err}`,
    );
    return null;
  }
}

/** Sleep helper for rate-limiting */
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || cronSecret.length < 24) {
    console.error("[thames-cron] CRON_SECRET is missing or too short (min 24 chars)");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getSupabase();
  const startedAt = new Date().toISOString();
  console.log(`[thames-cron] Starting — ${ZONE_CODES.length} zones`);

  // ── Step 1: Download and parse all zone PDFs ─────────────────────────────
  type ParsedZone = Awaited<ReturnType<typeof parseThamesZonePdf>>;
  const parsedZones: NonNullable<ParsedZone>[] = [];
  let downloadFailed = 0;
  let parseFailed = 0;

  for (let i = 0; i < ZONE_CODES.length; i++) {
    const mapCode = ZONE_CODES[i];

    const buffer = await downloadZonePdf(mapCode);
    if (!buffer) {
      downloadFailed++;
      continue;
    }

    const zone = await parseThamesZonePdf(buffer, mapCode);
    if (!zone) {
      parseFailed++;
      console.warn(`[thames-cron] ${mapCode}: parse returned null`);
      continue;
    }

    parsedZones.push(zone);

    // Rate limit — 200ms between requests
    if (i < ZONE_CODES.length - 1) {
      await sleep(200);
    }
  }

  console.log(
    `[thames-cron] Downloaded: ${parsedZones.length} OK, ${downloadFailed} download failures, ${parseFailed} parse failures`,
  );

  if (parsedZones.length === 0) {
    return NextResponse.json(
      { error: "No zones parsed — aborting" },
      { status: 500 },
    );
  }

  // ── Step 2: Group zones by prefix ────────────────────────────────────────
  const zonesByPrefix: Record<string, NonNullable<ParsedZone>[]> = {};
  for (const zone of parsedZones) {
    const prefix = zone.mapCode.replace(/\d+$/, "");
    if (!zonesByPrefix[prefix]) zonesByPrefix[prefix] = [];
    zonesByPrefix[prefix].push(zone);
  }

  // ── Step 3: Distribute postcodes round-robin and write to DB ─────────────
  let totalPostcodes = 0;
  let totalReadings = 0;

  for (const [prefix, prefixZones] of Object.entries(zonesByPrefix)) {
    const postcodes = THAMES_ZONE_POSTCODES[prefix];
    if (!postcodes) {
      console.log(`[thames-cron] Skipping prefix ${prefix} — no postcode mapping`);
      continue;
    }

    // Sort largest zones first so the most-representative data leads
    prefixZones.sort((a, b) => (b.population ?? 0) - (a.population ?? 0));

    for (let i = 0; i < postcodes.length; i++) {
      const district = postcodes[i];
      const zone = prefixZones[i % prefixZones.length];

      // Build observations for scoring
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

      const score = computeScore(observations, "drinking");

      // Build DB rows
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

      // Delete stale readings for this district
      const { error: delError } = await db
        .from("drinking_water_readings")
        .delete()
        .eq("postcode_district", district)
        .eq("source", "thames_water_zone");

      if (delError) {
        console.error(
          `[thames-cron] Delete error for ${district}:`,
          delError.message,
        );
      }

      // Insert new readings in 500-row chunks
      for (let j = 0; j < readings.length; j += 500) {
        const chunk = readings.slice(j, j + 500);
        const { error: insError } = await db
          .from("drinking_water_readings")
          .insert(chunk);
        if (insError) {
          console.error(
            `[thames-cron] Insert error for ${district}:`,
            insError.message,
          );
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
          date_range_from: `${zone.year}-01-01`,
          date_range_to: `${zone.year}-12-31`,
          last_data_update: `${zone.year}-12-31`,
        },
        { onConflict: "postcode_district" },
      );

      if (upsertError) {
        console.error(
          `[thames-cron] Upsert page_data error for ${district}:`,
          upsertError.message,
        );
      }

      totalReadings += readings.length;
      totalPostcodes++;
    }

    console.log(
      `[thames-cron] ${prefix}: ${postcodes.length} postcodes done`,
    );
  }

  const completedAt = new Date().toISOString();
  const elapsed = Math.round(
    (new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000,
  );

  // Log to scrape_log
  await db.from("scrape_log").insert({
    source: "thames-water-cron",
    status: "success",
    records_fetched: parsedZones.length,
    records_updated: totalPostcodes,
    started_at: startedAt,
    completed_at: completedAt,
  });

  console.log(
    `[thames-cron] Done in ${elapsed}s — ${totalPostcodes} postcodes, ${totalReadings} readings`,
  );

  return NextResponse.json({
    ok: true,
    zones_parsed: parsedZones.length,
    download_failures: downloadFailed,
    parse_failures: parseFailed,
    postcodes_updated: totalPostcodes,
    readings_inserted: totalReadings,
    elapsed_seconds: elapsed,
  });
}
