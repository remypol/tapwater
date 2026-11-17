/**
 * Give named districts the tap-water results of the company that really
 * supplies them, without waiting for the refresh job to come round (four days)
 * and without fetching the Environment Agency layer again.
 *
 * Written for 17 November 2026, when Ofwat's map showed 476 districts carried
 * the wrong supplier (src/data/district-suppliers.json). For each district:
 *   1. set the supplier from the map;
 *   2. fetch that company's published samples for the district's census areas;
 *   3. if it has some, store them and rebuild the page's figures from them;
 *   4. if it has none (South East Water, Wessex Water and Bristol Water publish
 *      no samples) and the stored results belong to another company, remove
 *      those and rebuild the page from the Environment Agency layer alone.
 * Thames Water districts are skipped: scripts/import-thames-water.ts owns them.
 *
 *   export $(grep -E "^(NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY)=" .env.local | xargs)
 *   npx tsx scripts/refresh-districts.ts --changed [--dry-run]   # every district whose stored supplier differs from the map
 *   npx tsx scripts/refresh-districts.ts GU21 SM1 RM1            # just these
 */
import { getSupabase } from "../src/lib/supabase";
import { upsertPageData, upsertPostcodeDistrict, writeStreamReadings } from "../src/lib/db-writer";
import { getSupplierFor, getDistrictSuppliers } from "../src/lib/suppliers";
import { getStreamSource } from "../src/lib/stream-sources";
import { fetchStreamData, type StreamRecord } from "../src/lib/stream-api";
import { getLsoasForDistrict } from "../src/lib/lsoa-lookup";
import type { PostcodeSeedData } from "../src/lib/ea-fetcher";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const changedOnly = args.includes("--changed");
const named = args.filter((a) => !a.startsWith("--")).map((a) => a.toUpperCase());

const db = getSupabase();

interface DistrictRow { id: string; area_name: string; city: string; region: string; latitude: number; longitude: number; supplier_id: string | null }

async function allDistricts(): Promise<DistrictRow[]> {
  const out: DistrictRow[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await db.from("postcode_districts").select("id, area_name, city, region, latitude, longitude, supplier_id").order("id").range(offset, offset + 999);
    if (error) throw error;
    out.push(...((data ?? []) as DistrictRow[]));
    if (!data || data.length < 1000) break;
  }
  return out;
}

/** Suppliers that own stored sample rows for a district. */
async function storedSuppliers(district: string): Promise<string[]> {
  const { data } = await db
    .from("drinking_water_readings")
    .select("supplier_id")
    .eq("postcode_district", district)
    .in("source", ["stream_portal", "thames_water_zone"])
    .limit(1000);
  return [...new Set((data ?? []).map((r) => r.supplier_id as string))];
}

async function main() {
  if (!changedOnly && named.length === 0) {
    console.error("Usage: refresh-districts.ts --changed [--dry-run] | <district> [<district> …]");
    process.exit(1);
  }
  const districts = await allDistricts();
  const targets = districts.filter((d) => {
    if (named.length > 0) return named.includes(d.id);
    // Only districts the map covers, whose stored supplier disagrees with it.
    return getDistrictSuppliers(d.id) != null && getSupplierFor(d.id, d.city).id !== d.supplier_id;
  });
  console.log(`${targets.length} districts${dryRun ? " (dry run)" : ""}`);

  const tally: Record<string, number> = {};
  const count = (k: string) => (tally[k] = (tally[k] ?? 0) + 1);

  for (const d of targets) {
    const supplier = getSupplierFor(d.id, d.city);
    const moved = supplier.id !== d.supplier_id;
    const label = `${d.id.padEnd(5)} ${(d.supplier_id ?? "none").padEnd(20)} -> ${supplier.id.padEnd(20)}`;
    if (supplier.id === "thames-water") {
      // The import wrote its readings; only the supplier id may be stale.
      if (!dryRun && moved) await db.from("postcode_districts").update({ supplier_id: supplier.id }).eq("id", d.id);
      console.log(`  ${label} Thames district, readings come from the zone import`);
      count("thames");
      continue;
    }

    const source = getStreamSource(supplier.id);
    let records: StreamRecord[] = [];
    let failed = false;
    if (source) {
      try {
        const lsoas = await getLsoasForDistrict(d.id);
        if (lsoas.length > 0) records = await fetchStreamData(source, lsoas);
      } catch (err) {
        failed = true;
        console.log(`  ${label} fetch failed (${err instanceof Error ? err.message : err}), left as it is`);
        count("failed");
      }
    }
    if (failed) continue;

    const stored = await storedSuppliers(d.id);
    const foreign = stored.filter((s) => s !== supplier.id);
    const what = records.length > 0
      ? `${records.length} samples`
      : source
        ? "no samples published for this district"
        : "company publishes no samples";
    console.log(`  ${label} ${what}${foreign.length ? `; removes ${foreign.join(", ")} rows` : ""}`);
    count(records.length > 0 ? "with samples" : foreign.length ? "cleared, river and groundwater layer only" : "no change in results");
    if (dryRun) continue;

    const { data: page } = await db.from("page_data").select("environmental_context").eq("postcode_district", d.id).maybeSingle();
    const ctx = (page?.environmental_context ?? {}) as Partial<PostcodeSeedData>;
    const seed: PostcodeSeedData = {
      district: d.id,
      areaName: d.area_name,
      city: d.city,
      region: d.region,
      latitude: d.latitude,
      longitude: d.longitude,
      samplingPointCount: ctx.samplingPointCount ?? 0,
      recentObservations: ctx.recentObservations ?? 0,
      pfasDetected: false,
      topReadings: ctx.topReadings ?? [],
    };

    await upsertPostcodeDistrict(seed);
    if (records.length > 0) {
      // Another company's rows first: writeStreamReadings only replaces stream_portal rows.
      if (foreign.length) await db.from("drinking_water_readings").delete().eq("postcode_district", d.id).in("source", ["stream_portal", "thames_water_zone"]).in("supplier_id", foreign);
      await writeStreamReadings(d.id, supplier.id, records);
      if (page) await upsertPageData(seed, records);
    } else if (foreign.length) {
      await db.from("drinking_water_readings").delete().eq("postcode_district", d.id).in("source", ["stream_portal", "thames_water_zone"]).in("supplier_id", foreign);
      if (page) await upsertPageData(seed);
    }
  }

  console.log(Object.entries(tally).map(([k, n]) => `${n} ${k}`).join(", "));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
