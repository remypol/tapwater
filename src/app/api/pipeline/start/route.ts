import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { TARGET_POSTCODES } from "@/lib/postcodes";

const BATCH_SIZE = 6;

export async function POST(request: NextRequest) {
  // Auth check
  const secret = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getSupabase();

  // Check for already-running pipeline
  const { data: running } = await db
    .from("pipeline_runs")
    .select("id, started_at")
    .eq("status", "running")
    .order("started_at", { ascending: false })
    .limit(1);

  if (running && running.length > 0) {
    const runAge = Date.now() - new Date(running[0].started_at).getTime();
    // If a run has been "running" for over 12 hours, it's stale — allow a new one
    if (runAge < 12 * 60 * 60 * 1000) {
      return NextResponse.json(
        { error: "Pipeline already running", runId: running[0].id },
        { status: 409 },
      );
    }
    // Mark stale run as failed
    await db
      .from("pipeline_runs")
      .update({ status: "failed", error_message: "Timed out (stale)" })
      .eq("id", running[0].id);
  }

  // Create new pipeline run
  const { data: run, error } = await db
    .from("pipeline_runs")
    .insert({
      status: "running",
      total_postcodes: TARGET_POSTCODES.length,
      batch_size: BATCH_SIZE,
    })
    .select("id")
    .single();

  if (error || !run) {
    return NextResponse.json({ error: "Failed to create pipeline run" }, { status: 500 });
  }

  // Fire first batch using after() — runs after response is sent
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const host = request.headers.get("host") ?? process.env.VERCEL_URL ?? "localhost:3000";
  const baseUrl = `${proto}://${host}`;

  after(async () => {
    try {
      await fetch(`${baseUrl}/api/pipeline/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
        body: JSON.stringify({ runId: run.id, batchIndex: 0 }),
      });
    } catch (err) {
      console.error("[pipeline/start] Failed to fire first batch:", err);
    }
  });

  return NextResponse.json({
    ok: true,
    runId: run.id,
    totalPostcodes: TARGET_POSTCODES.length,
    totalBatches: Math.ceil(TARGET_POSTCODES.length / BATCH_SIZE),
  });
}
