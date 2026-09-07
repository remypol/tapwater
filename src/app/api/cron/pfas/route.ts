import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { runPfasIngest } from "@/lib/pfas-ingest-run";

export const maxDuration = 300; // Vercel cap

/**
 * Daily PFAS ingest from the EA Water Quality Archive into `pfas_detections`.
 *
 * Works to a deadline: the EA API must be called sequentially (403 under
 * concurrency) and a big city takes ~90 s, so each run covers the stalest few
 * cities and the next run carries on. Every run logs per-city and summary rows to
 * `source_checks`; the weekly health report raises an issue when a run fetches
 * nothing, errors, or stops happening. See `src/lib/pfas-ingest.ts` for the API
 * details that made the original version silently fetch zero rows.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || cronSecret.length < 24) {
    console.error("[pfas-cron] CRON_SECRET is missing or too short (min 24 chars)");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Leave ~50 s of the 300 s budget for the in-flight city and the final upserts.
    const result = await runPfasIngest({ db: getSupabase(), deadlineMs: 240_000 });
    const status = result.rowsFetched === 0 && result.citiesProcessed > 0 ? 502 : 200;
    return NextResponse.json(result, { status });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[pfas-cron] run failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
