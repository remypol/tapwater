import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { TARGET_POSTCODES } from "@/lib/postcodes";
import { processPostcode } from "@/lib/ea-fetcher";
import { writePostcodeData } from "@/lib/db-writer";
import type { StreamRecord } from "@/lib/stream-api";
import { getStreamSource } from "@/lib/stream-sources";
import { fetchStreamData } from "@/lib/stream-api";
import { getLsoasForDistrict } from "@/lib/lsoa-lookup";
import { getSupplier } from "@/lib/suppliers";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  // Auth check
  const secret = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { runId: string; batchIndex: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { runId, batchIndex } = body;
  const db = getSupabase();

  // Load pipeline run
  const { data: run } = await db
    .from("pipeline_runs")
    .select("*")
    .eq("id", runId)
    .single();

  if (!run || run.status !== "running") {
    return NextResponse.json({ error: "Pipeline not found or not running" }, { status: 404 });
  }

  const batchSize = run.batch_size ?? 12;
  const start = batchIndex * batchSize;
  const end = Math.min(start + batchSize, TARGET_POSTCODES.length);
  const batch = TARGET_POSTCODES.slice(start, end);
  const totalBatches = Math.ceil(TARGET_POSTCODES.length / batchSize);

  console.log(`[pipeline/batch] Batch ${batchIndex + 1}/${totalBatches}: postcodes ${start}-${end - 1}`);

  let processed = 0;

  try {
    for (const district of batch) {
      try {
        const seedData = await processPostcode(district);

        // Fetch Stream tap water data
        let streamRecords: StreamRecord[] = [];
        try {
          if (seedData) {
            const supplier = getSupplier(seedData.city);
            const streamSource = getStreamSource(supplier.id);
            if (streamSource) {
              const lsoas = await getLsoasForDistrict(district);
              if (lsoas.length > 0) {
                streamRecords = await fetchStreamData(streamSource, lsoas);
                console.log(`  → ${district}: ${streamRecords.length} Stream records from ${lsoas.length} LSOAs`);
              }
            }
          }
        } catch (err) {
          console.error(`  ⚠ ${district} Stream fetch error:`, err);
          // Continue with EA-only data
        }

        if (seedData) {
          await writePostcodeData(seedData, streamRecords.length > 0 ? streamRecords : undefined);
          console.log(`  ✓ ${district}`);
        } else {
          console.log(`  ✗ ${district} — no data from EA/postcodes.io`);
        }
      } catch (err) {
        // Log but continue — don't let one postcode kill the batch
        console.error(`  ✗ ${district} — error:`, err);
      }
      processed++;
    }

    // Update pipeline run progress
    const totalProcessed = start + processed;
    await db
      .from("pipeline_runs")
      .update({
        processed_postcodes: totalProcessed,
        current_batch: batchIndex,
      })
      .eq("id", runId);

    // Check if more batches
    const nextBatchIndex = batchIndex + 1;
    const hasMore = nextBatchIndex * batchSize < TARGET_POSTCODES.length;

    if (hasMore) {
      // Fire next batch (fire-and-forget)
      const proto = request.headers.get("x-forwarded-proto") ?? "https";
      const host = request.headers.get("host") ?? process.env.VERCEL_URL ?? "localhost:3000";
      const baseUrl = `${proto}://${host}`;

      fetch(`${baseUrl}/api/pipeline/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
        body: JSON.stringify({ runId, batchIndex: nextBatchIndex }),
      }).catch((err) => {
        console.error("[pipeline/batch] Failed to fire next batch:", err);
      });

      return NextResponse.json({
        ok: true,
        batch: batchIndex,
        processed,
        remaining: TARGET_POSTCODES.length - totalProcessed,
      });
    }

    // Final batch — mark complete and trigger deploy
    await db
      .from("pipeline_runs")
      .update({
        status: "completed",
        processed_postcodes: totalProcessed,
        completed_at: new Date().toISOString(),
      })
      .eq("id", runId);

    // Log to scrape_log
    await db.from("scrape_log").insert({
      source: "ea-pipeline",
      status: "success",
      records_fetched: totalProcessed,
      records_updated: totalProcessed,
      started_at: run.started_at,
      completed_at: new Date().toISOString(),
    });

    // Trigger Vercel deploy hook to rebuild with fresh data
    const deployHook = process.env.DEPLOY_HOOK_URL;
    if (deployHook) {
      try {
        await fetch(deployHook, { method: "POST" });
        console.log("[pipeline/batch] Deploy hook triggered");
      } catch (err) {
        console.error("[pipeline/batch] Deploy hook failed:", err);
      }
    }

    console.log(`[pipeline/batch] Pipeline complete! ${totalProcessed} postcodes processed.`);

    return NextResponse.json({
      ok: true,
      batch: batchIndex,
      processed,
      complete: true,
      totalProcessed,
    });
  } catch (err) {
    // Mark pipeline as failed
    const message = err instanceof Error ? err.message : String(err);
    await db
      .from("pipeline_runs")
      .update({
        status: "failed",
        error_message: `Batch ${batchIndex}: ${message}`,
      })
      .eq("id", runId);

    console.error(`[pipeline/batch] Fatal error in batch ${batchIndex}:`, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
