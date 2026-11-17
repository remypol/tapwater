/**
 * Work out hardness as CaCO3 for a company that publishes it as calcium, from
 * the samples already stored. The refresh job does this on every pass
 * (writeStreamReadings); this script does it straight away for every district,
 * without fetching anything.
 *
 *   export $(grep -E "^(NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY)=" .env.local | xargs)
 *   npx tsx scripts/derive-hardness.ts southern-water [--dry-run]
 */
import { getSupabase } from "../src/lib/supabase";
import { getStreamSource } from "../src/lib/stream-sources";
import { DERIVED_HARDNESS_REF, HARDNESS_AS_CACO3, deriveHardnessAsCaCO3, type HardnessSample } from "../src/lib/derived-hardness";

const [supplierId, ...flags] = process.argv.slice(2);
const dryRun = flags.includes("--dry-run");
const determinand = supplierId ? getStreamSource(supplierId)?.hardnessAsCalcium : undefined;
if (!supplierId || !determinand) {
  console.error("Usage: derive-hardness.ts <supplier-id> [--dry-run]   (the supplier needs hardnessAsCalcium in stream-sources.ts)");
  process.exit(1);
}

const db = getSupabase();

async function main() {
  const { data: districts, error } = await db.from("postcode_districts").select("id").eq("supplier_id", supplierId).order("id");
  if (error) throw error;
  let written = 0;
  let thin = 0;
  for (const d of districts ?? []) {
    const samples: HardnessSample[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error: readError } = await db
        .from("drinking_water_readings")
        .select("id, determinand, value, sample_date")
        .eq("postcode_district", d.id)
        .eq("source", "stream_portal")
        .eq("determinand", determinand as string)
        .order("id", { ascending: true })
        .range(offset, offset + 999);
      if (readError) throw new Error(`${d.id}: ${readError.message}`);
      for (const r of data ?? []) samples.push({ determinand: r.determinand, value: Number(r.value), sampleDate: r.sample_date });
      if (!data || data.length < 1000) break;
    }
    const hardness = deriveHardnessAsCaCO3(samples, determinand as string);
    if (!hardness) {
      thin++;
      console.log(`  ${String(d.id).padEnd(5)} too few samples (${samples.length})`);
      continue;
    }
    console.log(`  ${String(d.id).padEnd(5)} ${String(hardness.value).padStart(4)} mg/L as CaCO3 from ${hardness.samples} samples to ${hardness.sampleDate}`);
    written++;
    if (dryRun) continue;
    await db.from("drinking_water_readings").delete().eq("postcode_district", d.id).eq("source", "stream_portal").eq("source_ref", DERIVED_HARDNESS_REF);
    const { error: insError } = await db.from("drinking_water_readings").insert({
      postcode_district: d.id,
      supplier_id: supplierId,
      supply_zone: null,
      determinand: HARDNESS_AS_CACO3,
      value: hardness.value,
      unit: "mg/l",
      uk_limit: null,
      who_guideline: null,
      sample_date: hardness.sampleDate,
      source: "stream_portal",
      source_ref: DERIVED_HARDNESS_REF,
    });
    if (insError) throw new Error(`${d.id}: ${insError.message}`);
  }
  console.log(`${supplierId}: ${written} districts ${dryRun ? "would get" : "given"} a hardness reading, ${thin} with too few samples`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
