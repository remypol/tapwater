/**
 * Rebuild page_data for one supplier's districts from the drinking water
 * readings already stored, without fetching anything again.
 *
 * The refresh cron takes about four days to come round to every district, and
 * re-fetches all of it from the Stream portal and the EA on the way. After a
 * fix to stored readings (26 Sept 2026: units for Southern Water's extract)
 * this recomputes the scores straight away through the same upsertPageData the
 * cron uses. The EA layer is taken from what page_data already holds.
 *
 * Usage:
 *   export $(grep -E "^(NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY)=" .env.local | xargs)
 *   npx tsx scripts/rebuild-page-data.ts southern-water [--dry-run] [--only BN1,SO14]
 */

import { getSupabase } from "../src/lib/supabase";
import { upsertPageData } from "../src/lib/db-writer";
import { computeScore } from "../src/lib/scoring";
import type { PostcodeSeedData } from "../src/lib/ea-fetcher";
import type { StreamRecord } from "../src/lib/stream-api";

const [supplierId, ...flags] = process.argv.slice(2);
const dryRun = flags.includes("--dry-run");
const onlyIdx = flags.indexOf("--only");
const only = onlyIdx >= 0 ? new Set(flags[onlyIdx + 1].split(",").map((d) => d.trim().toUpperCase())) : null;

if (!supplierId) {
  console.error("Usage: rebuild-page-data.ts <supplier-id> [--dry-run] [--only BN1,SO14]");
  process.exit(1);
}

const db = getSupabase();

async function storedReadings(district: string): Promise<StreamRecord[]> {
  const rows: StreamRecord[] = [];
  const PAGE = 1000;
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await db
      .from("drinking_water_readings")
      .select("id, determinand, value, unit, sample_date, source_ref")
      .eq("postcode_district", district)
      .eq("source", "stream_portal")
      .order("id", { ascending: true })
      .range(offset, offset + PAGE - 1);
    if (error) throw new Error(`${district}: ${error.message}`);
    for (const r of data ?? []) {
      rows.push({
        sampleId: r.source_ref ?? "",
        sampleDate: r.sample_date,
        determinand: r.determinand,
        dwiCode: "",
        unit: r.unit ?? "",
        belowDetectionLimit: false,
        value: Number(r.value),
        lsoa: "",
      });
    }
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

async function main() {
  const { data: districts, error } = await db
    .from("postcode_districts")
    .select("id, area_name, city, region, latitude, longitude")
    .eq("supplier_id", supplierId)
    .order("id");
  if (error) throw error;

  const targets = (districts ?? []).filter((d) => !only || only.has(String(d.id).toUpperCase()));
  console.log(`${supplierId}: ${targets.length} districts${dryRun ? " (dry run)" : ""}`);

  let rebuilt = 0, skipped = 0;
  for (const d of targets) {
    const { data: page } = await db
      .from("page_data")
      .select("safety_score, environmental_context")
      .eq("postcode_district", d.id)
      .maybeSingle();
    const records = await storedReadings(d.id);
    if (!page || records.length === 0) {
      skipped++;
      console.log(`  ${d.id.padEnd(5)} skipped (${!page ? "no page_data row" : "no stored readings"})`);
      continue;
    }

    const ctx = (page.environmental_context ?? {}) as Partial<PostcodeSeedData>;
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

    const score = computeScore(records.map((r) => ({ determinand: r.determinand, value: r.value, unit: r.unit, date: r.sampleDate })));
    const flagged = score.readings.filter((r) => r.status !== "pass").map((r) => `${r.name} ${r.status}`);
    console.log(
      `  ${d.id.padEnd(5)} ${String(page.safety_score).padStart(4)} -> ${String(score.safetyScore).padStart(4)}  ` +
      `${score.contaminantsTested} tested, ${records.length} rows${flagged.length ? `  [${flagged.join(", ")}]` : ""}`,
    );
    if (!dryRun) await upsertPageData(seed, records);
    rebuilt++;
  }
  console.log(`${supplierId}: ${rebuilt} rebuilt, ${skipped} skipped`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
