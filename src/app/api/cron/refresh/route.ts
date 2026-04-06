import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { TARGET_POSTCODES } from "@/lib/postcodes";
import { processPostcode } from "@/lib/ea-fetcher";
import { writePostcodeData, getThamesReadings } from "@/lib/db-writer";
import type { StreamRecord } from "@/lib/stream-api";
import { getStreamSource } from "@/lib/stream-sources";
import { fetchStreamData } from "@/lib/stream-api";
import { getLsoasForDistrict } from "@/lib/lsoa-lookup";
import { getSupplier } from "@/lib/suppliers";

export const maxDuration = 300;

/**
 * Incremental pipeline — runs every cron invocation and picks up where it left off.
 *
 * Instead of chaining 471 batches via after(), this processes a single batch
 * per cron tick. Each invocation:
 * 1. Finds the next unprocessed batch
 * 2. Processes BATCH_SIZE postcodes
 * 3. Updates progress in pipeline_runs
 * 4. Exits cleanly
 *
 * The cron runs every 5 minutes. With 6 postcodes per batch and 2,821 total,
 * the full cycle completes in ~4 days. Since Stream data is annual and EA data
 * updates slowly, this cadence is more than sufficient.
 *
 * When all postcodes are processed, it fires the deploy hook and marks complete.
 * The next cron invocation starts a fresh run.
 */

const BATCH_SIZE = 6;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || cronSecret.length < 24) {
    console.error("[cron] CRON_SECRET is missing or too short (min 24 chars)");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getSupabase();

  // Find or create a pipeline run
  let run: { id: string; processed_postcodes: number; current_batch: number; started_at: string } | null = null;

  // Check for an in-progress run
  const { data: existing } = await db
    .from("pipeline_runs")
    .select("id, processed_postcodes, current_batch, started_at")
    .eq("status", "running")
    .order("started_at", { ascending: false })
    .limit(1);

  if (existing && existing.length > 0) {
    const runAge = Date.now() - new Date(existing[0].started_at).getTime();
    // If the run is older than 7 days, it's stale — mark failed and start fresh
    if (runAge > 7 * 24 * 60 * 60 * 1000) {
      await db
        .from("pipeline_runs")
        .update({ status: "failed", error_message: "Stale (>7 days)" })
        .eq("id", existing[0].id);
    } else {
      run = existing[0];
    }
  }

  // If no active run, create a new one
  if (!run) {
    const { data: newRun, error } = await db
      .from("pipeline_runs")
      .insert({
        status: "running",
        total_postcodes: TARGET_POSTCODES.length,
        batch_size: BATCH_SIZE,
        processed_postcodes: 0,
        current_batch: 0,
      })
      .select("id, processed_postcodes, current_batch, started_at")
      .single();

    if (error || !newRun) {
      return NextResponse.json({ error: "Failed to create pipeline run" }, { status: 500 });
    }
    run = newRun;
    console.log(`[cron] New pipeline run ${run.id}: ${TARGET_POSTCODES.length} postcodes`);
  }

  // Calculate next batch
  const batchIndex = run.current_batch;
  const start = batchIndex * BATCH_SIZE;
  const end = Math.min(start + BATCH_SIZE, TARGET_POSTCODES.length);
  const batch = TARGET_POSTCODES.slice(start, end);
  const totalBatches = Math.ceil(TARGET_POSTCODES.length / BATCH_SIZE);

  if (batch.length === 0) {
    // All done — mark complete and fire deploy hook
    await db
      .from("pipeline_runs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", run.id);

    await db.from("scrape_log").insert({
      source: "ea-pipeline",
      status: "success",
      records_fetched: run.processed_postcodes,
      records_updated: run.processed_postcodes,
      started_at: run.started_at,
      completed_at: new Date().toISOString(),
    });

    const deployHook = process.env.DEPLOY_HOOK_URL;
    if (deployHook) {
      await fetch(deployHook, { method: "POST" }).catch(() => {});
      console.log("[cron] Pipeline complete — deploy hook triggered");
    }

    return NextResponse.json({
      ok: true,
      complete: true,
      totalProcessed: run.processed_postcodes,
    });
  }

  console.log(`[cron] Batch ${batchIndex + 1}/${totalBatches}: postcodes ${start}-${end - 1}`);

  let processed = 0;

  for (const district of batch) {
    try {
      const seedData = await processPostcode(district);

      let streamRecords: StreamRecord[] = [];
      try {
        if (seedData) {
          const supplier = getSupplier(seedData.city);
          const streamSource = getStreamSource(supplier.id);
          if (streamSource) {
            const lsoas = await getLsoasForDistrict(district);
            if (lsoas.length > 0) {
              streamRecords = await fetchStreamData(streamSource, lsoas);
            }
          }

          // Thames Water fallback: if no Stream data, check for pre-imported zone data
          if (streamRecords.length === 0 && supplier.id === "thames-water") {
            const thamesData = await getThamesReadings(district);
            if (thamesData) {
              streamRecords = thamesData.map((r) => ({
                sampleId: `thames-zone-${district}`,
                sampleDate: r.sampleDate,
                determinand: r.determinand,
                dwiCode: "",
                unit: r.unit,
                belowDetectionLimit: false,
                value: r.value,
                lsoa: "",
              }));
            }
          }
        }
      } catch {
        // Continue with EA-only data
      }

      if (seedData) {
        await writePostcodeData(seedData, streamRecords.length > 0 ? streamRecords : undefined);
        console.log(`  ✓ ${district}${streamRecords.length > 0 ? ` (${streamRecords.length} Stream records)` : ""}`);
      } else {
        console.log(`  ✗ ${district} — no data`);
      }
    } catch (err) {
      console.error(`  ✗ ${district}:`, err);
    }
    processed++;
  }

  // Update progress
  const totalProcessed = start + processed;
  await db
    .from("pipeline_runs")
    .update({
      processed_postcodes: totalProcessed,
      current_batch: batchIndex + 1,
    })
    .eq("id", run.id);

  return NextResponse.json({
    ok: true,
    batch: batchIndex,
    processed,
    totalProcessed,
    remaining: TARGET_POSTCODES.length - totalProcessed,
    nextBatch: batchIndex + 1,
    totalBatches,
  });
}
