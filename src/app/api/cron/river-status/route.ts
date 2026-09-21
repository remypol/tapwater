import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { runRiverStatusIngest } from "@/lib/river-status-ingest";

export const maxDuration = 300; // Vercel cap

/**
 * Monthly refresh of the Environment Agency's river classifications into
 * `river_status`, and of the catchment each postcode district sits in.
 *
 * The Environment Agency republishes these every few years, so monthly is far more
 * often than the data changes; the point is that a new release is picked up without
 * anyone remembering to look. Each run logs to `source_checks` (source
 * "ea-river-status") for the weekly health report.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || cronSecret.length < 24) {
    console.error("[river-status-cron] CRON_SECRET is missing or too short (min 24 chars)");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runRiverStatusIngest({ db: getSupabase() });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[river-status-cron] run failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
