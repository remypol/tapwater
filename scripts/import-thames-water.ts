/**
 * Thames Water zone reports → the database, district by district.
 *
 * For every district Thames mainly supplies (src/data/thames-zone-map.json) the
 * readings are the average of the zone reports it falls in, weighted by how much
 * of the district each zone covers (src/lib/thames-blend.ts). This replaces the
 * old import, which handed zone reports to districts in rotation.
 *
 * It also clears Thames zone readings from districts that are no longer on the
 * map: places another company supplies, which carried a Thames zone's figures
 * by mistake. Those districts get their real supplier's results from
 * scripts/refresh-districts.ts.
 *
 *   export $(grep -E "^(NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY)=" .env.local | xargs)
 *   npx tsx scripts/import-thames-water.ts --dry-run
 *   npx tsx scripts/import-thames-water.ts [--only RG1,KT1]
 *
 * The full yearly routine, when Thames publishes a new year's reports:
 *   npx tsx scripts/map-thames-zones.ts                      (only for districts not yet asked)
 *   python3 scripts/fetch-thames-zone-reports.py --refresh    (every report again, one every four seconds)
 *   npx tsx scripts/build-thames-zone-map.ts
 *   npx tsx scripts/import-thames-water.ts
 */
import { readFileSync } from "node:fs";
import { getSupabase } from "../src/lib/supabase";
import { upsertPageData, writeStreamReadings } from "../src/lib/db-writer";
import { blendZones, zoneLabel, type ZoneReport } from "../src/lib/thames-blend";
import { THAMES_DISTRICTS, getThamesZones } from "../src/lib/thames-zones";
import type { PostcodeSeedData } from "../src/lib/ea-fetcher";
import type { StreamRecord } from "../src/lib/stream-api";

const flags = process.argv.slice(2);
const dryRun = flags.includes("--dry-run");
const onlyIdx = flags.indexOf("--only");
const only = onlyIdx >= 0 ? new Set(flags[onlyIdx + 1].split(",").map((d) => d.trim().toUpperCase())) : null;

const HARDNESS = "Hardness (Total) as CaCO3";
const SOURCE = "thames_water_zone";
const db = getSupabase();

interface DistrictRow { id: string; area_name: string; city: string; region: string; latitude: number; longitude: number }

async function allDistricts(): Promise<Map<string, DistrictRow>> {
  const out = new Map<string, DistrictRow>();
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await db.from("postcode_districts").select("id, area_name, city, region, latitude, longitude").order("id").range(offset, offset + 999);
    if (error) throw error;
    for (const d of data ?? []) out.set(d.id, d as DistrictRow);
    if (!data || data.length < 1000) break;
  }
  return out;
}

/** Districts that hold Thames zone readings today, with their hardness. */
async function currentThamesHardness(): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await db
      .from("drinking_water_readings")
      .select("id, postcode_district, value")
      .eq("source", SOURCE)
      .eq("determinand", HARDNESS)
      .order("id")
      .range(offset, offset + 999);
    if (error) throw error;
    for (const r of data ?? []) out.set(r.postcode_district, Number(r.value));
    if (!data || data.length < 1000) break;
  }
  return out;
}

async function main() {
  const reports = new Map((JSON.parse(readFileSync("data/thames-water/all-zones.json", "utf8")) as ZoneReport[]).map((z) => [z.mapCode, z]));
  const districts = await allDistricts();
  const before = await currentThamesHardness();
  console.log(`${reports.size} zone reports, ${THAMES_DISTRICTS.length} Thames districts on the map, ${before.size} districts hold Thames readings today${dryRun ? " (dry run)" : ""}`);

  // ── 1. Districts on the map: write the blend of their zones ──
  let written = 0;
  const noPage: string[] = [];
  const noReport: string[] = [];
  for (const district of THAMES_DISTRICTS) {
    if (only && !only.has(district)) continue;
    const row = districts.get(district);
    if (!row) {
      noPage.push(district);
      continue;
    }
    const entry = getThamesZones(district);
    const blend = entry ? blendZones(reports, entry.zones) : null;
    if (!entry || !blend) {
      noReport.push(district);
      continue;
    }
    const hardness = blend.readings.find((r) => r.determinand === HARDNESS)?.value;
    const was = before.get(district);
    const label = zoneLabel(blend.zones);
    console.log(
      `  ${district.padEnd(5)} ${String(was ?? "-").padStart(5)} -> ${String(hardness ?? "-").padStart(5)} mg/L  ` +
      `${blend.zones.map((z) => `${z.code} ${z.share}%`).join(", ")}${entry.approx ? `  (borrowed from ${entry.approx.join(", ")})` : ""}`,
    );
    written++;
    if (dryRun) continue;

    const sampleDate = `${blend.year}-12-31`;
    const sourceRef = `${blend.zones.length === 1 ? "zone" : "zones"}:${blend.zones.map((z) => z.code).join(",")}`.slice(0, 200);
    const { error: delError } = await db.from("drinking_water_readings").delete().eq("postcode_district", district).eq("source", SOURCE);
    if (delError) throw new Error(`${district}: ${delError.message}`);
    const { error: insError } = await db.from("drinking_water_readings").insert(
      blend.readings.map((r) => ({
        postcode_district: district,
        supplier_id: "thames-water",
        supply_zone: label,
        determinand: r.determinand,
        value: r.value,
        unit: r.unit,
        uk_limit: r.ukLimit,
        who_guideline: null,
        sample_date: sampleDate,
        source: SOURCE,
        source_ref: sourceRef,
      })),
    );
    if (insError) throw new Error(`${district}: ${insError.message}`);

    // The page reads page_data, built the same way the refresh job builds it.
    const records: StreamRecord[] = blend.readings.map((r) => ({
      sampleId: `thames-zone-${district}`,
      sampleDate,
      determinand: r.determinand,
      dwiCode: "",
      unit: r.unit,
      belowDetectionLimit: false,
      value: r.value,
      lsoa: "",
    }));
    await writeStreamReadings(district, "thames-water", records);
    const { data: page } = await db.from("page_data").select("environmental_context").eq("postcode_district", district).maybeSingle();
    const ctx = (page?.environmental_context ?? {}) as Partial<PostcodeSeedData>;
    await upsertPageData(
      {
        district,
        areaName: row.area_name,
        city: row.city,
        region: row.region,
        latitude: row.latitude,
        longitude: row.longitude,
        samplingPointCount: ctx.samplingPointCount ?? 0,
        recentObservations: ctx.recentObservations ?? 0,
        pfasDetected: false,
        topReadings: ctx.topReadings ?? [],
      },
      records,
    );
    // The zone name is only worth showing when one zone covers most of the district.
    const main = blend.zones[0];
    await db
      .from("postcode_districts")
      .update({ supplier_id: "thames-water", supply_zone: !entry.approx && main.share >= 60 ? main.name : null })
      .eq("id", district);
  }

  // ── 2. Districts off the map that still hold Thames zone readings: clear them ──
  const onMap = new Set(THAMES_DISTRICTS);
  const stale = [...before.keys()].filter((d) => !onMap.has(d) && (!only || only.has(d))).sort();
  console.log(`\n${stale.length} districts hold Thames zone readings but Thames is not their main supplier: ${stale.join(" ")}`);
  if (!dryRun) {
    for (const district of stale) {
      // Both the zone rows and the copies the refresh job made of them.
      await db.from("drinking_water_readings").delete().eq("postcode_district", district).eq("source", SOURCE);
      await db.from("drinking_water_readings").delete().eq("postcode_district", district).eq("source", "stream_portal").eq("source_ref", `thames-zone-${district}`);
    }
  }

  console.log(`\n${written} districts ${dryRun ? "would be" : ""} written, ${stale.length} cleared`);
  if (noPage.length) console.log(`on the map but without a page: ${noPage.length}`);
  if (noReport.length) console.log(`no zone report held, left as they are: ${noReport.join(" ")}`);
  if (stale.length && !dryRun) console.log(`Next: npx tsx scripts/refresh-districts.ts ${stale.slice(0, 3).join(" ")} … (or --changed) to give the cleared districts their real supplier's results.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
