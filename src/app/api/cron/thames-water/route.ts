/**
 * Thames Water monthly check.
 *
 * Thames publishes one report per supply zone, covering a calendar year. This
 * job downloads a single report, reads the year it covers and compares it with
 * the year of the Thames readings we hold. If Thames has moved on a year it
 * says so in scrape_log, and the weekly health report repeats it.
 *
 * It does not import anything. The import needs about 250 reports, and Thames's
 * firewall blocks a client that asks faster than one every few seconds (it
 * blocked us on 17 November 2026), so it cannot finish inside one serverless
 * run. The old version of this job tried to, at five requests a second, and
 * never completed once. The import is a script, run once a year:
 *
 *   python3 scripts/fetch-thames-zone-reports.py --refresh
 *   npx tsx scripts/build-thames-zone-map.ts
 *   npx tsx scripts/import-thames-water.ts
 *
 * Schedule: 0 4 1 * *  (1st of each month, 04:00 UTC)
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { parseThamesZonePdf } from "@/lib/thames-pdf-parser";
import { THAMES_CHECK_SOURCE, thamesZoneCodes } from "@/lib/thames-zones";

export const maxDuration = 60;

const THAMES_API_BASE = "https://water-quality-api.prod.p.webapp.thameswater.co.uk/water-quality-api";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || cronSecret.length < 24) {
    console.error("[thames-check] CRON_SECRET is missing or too short (min 24 chars)");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getSupabase();
  const startedAt = new Date().toISOString();
  const log = async (status: string, message: string | null) => {
    await db.from("scrape_log").insert({
      source: THAMES_CHECK_SOURCE,
      status,
      records_fetched: 1,
      records_updated: 0,
      error_message: message,
      started_at: startedAt,
      completed_at: new Date().toISOString(),
    });
  };

  // The year of the Thames readings we hold.
  const { data: held } = await db
    .from("drinking_water_readings")
    .select("sample_date")
    .eq("source", "thames_water_zone")
    .order("sample_date", { ascending: false })
    .limit(1);
  const heldYear = held?.[0]?.sample_date ? Number(String(held[0].sample_date).slice(0, 4)) : null;

  // One report is enough: Thames republishes every zone at the same time.
  const code = thamesZoneCodes()[0];
  let publishedYear: number | null = null;
  try {
    const res = await fetch(`${THAMES_API_BASE}/Zone/${code}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "application/pdf,*/*",
      },
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      await log("error", `Thames returned HTTP ${res.status} for zone ${code}`);
      return NextResponse.json({ ok: false, error: `HTTP ${res.status}` }, { status: 502 });
    }
    const zone = await parseThamesZonePdf(Buffer.from(await res.arrayBuffer()), code);
    publishedYear = zone?.year ?? null;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await log("error", `Could not read zone ${code}: ${message}`);
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }

  if (publishedYear == null) {
    await log("error", `Zone ${code} could not be parsed`);
    return NextResponse.json({ ok: false, error: "parse failed" }, { status: 502 });
  }

  const newer = heldYear == null || publishedYear > heldYear;
  await log(
    newer ? "new-report" : "success",
    newer ? `Thames Water has published its ${publishedYear} zone reports; we hold ${heldYear ?? "none"}. Run the yearly import (see scripts/import-thames-water.ts).` : null,
  );
  console.log(`[thames-check] zone ${code}: published ${publishedYear}, held ${heldYear ?? "none"}`);
  return NextResponse.json({ ok: true, zone: code, publishedYear, heldYear, newer });
}
