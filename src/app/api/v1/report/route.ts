import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { getSupabase } from "@/lib/supabase";
import { getPostcodeData, getHardness } from "@/lib/data";
import { getPfasNearDistrict } from "@/lib/pfas-data";
import { getActiveIncidentsForPostcode } from "@/lib/incidents";
import { extractDistrict } from "@/lib/postcode-parse";

/**
 * GET /api/v1/report?postcode=SW1A 1AA
 * Header: x-api-key: <key>
 *
 * The address-level water report as JSON: score, hardness, flagged readings,
 * PFAS nearby, live incidents, provenance. One call per address lookup on the
 * customer's side. Keys and quotas live in api_keys; every call is logged.
 */

export const dynamic = "force-dynamic";

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

function json(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...extra },
  });
}

export async function GET(request: NextRequest) {
  const key = request.headers.get("x-api-key")?.trim();
  if (!key) {
    return json({ error: "Missing x-api-key header. Request a key at https://www.tapwater.uk/for-business" }, 401);
  }

  const supabase = getSupabase();
  const { data: keyRow } = await supabase
    .from("api_keys")
    .select("id, customer, plan, monthly_quota, revoked_at")
    .eq("key_hash", hashKey(key))
    .maybeSingle();

  if (!keyRow || keyRow.revoked_at) {
    return json({ error: "Unknown or revoked API key" }, 401);
  }

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const { count: used } = await supabase
    .from("api_usage")
    .select("*", { count: "exact", head: true })
    .eq("key_id", keyRow.id)
    .gte("called_at", monthStart.toISOString())
    .eq("status", 200);

  const remaining = keyRow.monthly_quota - (used ?? 0);
  const quotaHeaders = {
    "X-RateLimit-Limit": String(keyRow.monthly_quota),
    "X-RateLimit-Remaining": String(Math.max(0, remaining)),
  };

  const raw = request.nextUrl.searchParams.get("postcode") ?? "";
  const district = extractDistrict(raw);

  // A repeat of a postcode already served today is logged as 208 (Already
  // Reported) so it does not count against the quota. Portals re-render the same
  // listing many times a day; charging for each render would punish exactly the
  // integration we want.
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const isRepeat = async (): Promise<boolean> => {
    if (!district) return false;
    const { count } = await supabase
      .from("api_usage")
      .select("*", { count: "exact", head: true })
      .eq("key_id", keyRow.id)
      .eq("status", 200)
      .gte("called_at", dayStart.toISOString())
      .ilike("postcode", `${district}%`);
    return (count ?? 0) > 0;
  };

  const log = async (status: number) => {
    await supabase.from("api_usage").insert({
      key_id: keyRow.id,
      path: "/api/v1/report",
      postcode: raw.slice(0, 12) || null,
      status,
    });
    if (status === 200) {
      await supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyRow.id);
    }
  };

  if (remaining <= 0 && !(await isRepeat())) {
    await log(429);
    return json({ error: `Monthly quota of ${keyRow.monthly_quota} lookups used. Contact hello@tapwater.uk to raise it.` }, 429, quotaHeaders);
  }

  if (!district) {
    await log(400);
    return json({ error: "postcode must be a UK postcode or postcode district, e.g. 'SW1A 1AA' or 'SW1A'" }, 400, quotaHeaders);
  }

  const data = await getPostcodeData(district);
  if (!data) {
    await log(404);
    return json({ error: `No data for district ${district}`, district }, 404, quotaHeaders);
  }

  const [hardness, pfasNearby, incidents] = await Promise.all([
    getHardness(district),
    data.safetyScore >= 0 ? getPfasNearDistrict(district) : Promise.resolve(null),
    getActiveIncidentsForPostcode(district),
  ]);

  const flagged = data.readings
    .filter((r) => r.status !== "pass")
    .map((r) => ({
      name: r.name,
      value: r.value,
      unit: r.unit,
      ukLimit: r.ukLimit,
      status: r.status,
    }));

  const body = {
    postcode: raw.trim().toUpperCase() || district,
    district: data.district,
    areaName: data.areaName,
    city: data.city,
    region: data.region,
    supplier: { name: data.supplier, id: data.supplierId },
    score: data.safetyScore >= 0 ? data.safetyScore : null,
    grade: data.scoreGrade,
    hardness: hardness
      ? { mgPerLitre: hardness.value, label: hardness.label, estimated: hardness.estimated, estimatedFromArea: hardness.estimatedFrom ?? null }
      : null,
    contaminants: { tested: data.contaminantsTested, flagged: data.contaminantsFlagged, flaggedReadings: flagged },
    pfas: {
      inTapWaterTests: data.pfasDetected && data.pfasLevel != null ? { level: data.pfasLevel, unit: "µg/L", source: data.pfasSource } : null,
      nearbyMonitoring: pfasNearby
        ? { radiusKm: pfasNearby.radiusKm, detections: pfasNearby.detectionCount, sites: pfasNearby.samplingPointCount, highest: pfasNearby.highest, latestDate: pfasNearby.latestDate }
        : null,
    },
    incidents: incidents.map((i) => ({ title: i.title, type: i.type, severity: i.severity, detectedAt: i.detected_at, url: `https://www.tapwater.uk/news/${i.slug}` })),
    provenance: {
      dataSource: data.dataSource,
      sampleCount: data.sampleCount,
      lastSampleDate: data.lastSampleDate,
      dateRange: data.dateRange,
      reportUrl: `https://www.tapwater.uk/postcode/${data.district}`,
      attribution: "Data: TapWater.uk, from water company and Environment Agency published tests",
    },
  };

  const repeat = await isRepeat();
  await log(repeat ? 208 : 200);
  return json(body, 200, { ...quotaHeaders, "X-RateLimit-Remaining": String(repeat ? remaining : remaining - 1) });
}
