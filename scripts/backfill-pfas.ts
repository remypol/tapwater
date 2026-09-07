/**
 * PFAS backfill: run the same ingest as /api/cron/pfas, but for every city in one
 * go (the cron works to a 240 s deadline and covers a few cities per run).
 *
 * Usage:
 *   export $(grep -E "^(NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY)=" .env.local | xargs)
 *   npx tsx scripts/backfill-pfas.ts                 # all 50 cities, writes to Supabase
 *   npx tsx scripts/backfill-pfas.ts --dry-run       # fetch + parse, no writes
 *   npx tsx scripts/backfill-pfas.ts --cities london,bath
 *
 * Idempotent: the upsert ignores rows already present (unique on sampling point,
 * determinand, sample date).
 */

import { createClient } from "@supabase/supabase-js";
import { pfasCities, runPfasIngest } from "../src/lib/pfas-ingest-run";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const citiesArg = args[args.indexOf("--cities") + 1];
const wanted = args.includes("--cities") && citiesArg ? new Set(citiesArg.split(",")) : null;
const cities = wanted ? pfasCities().filter((c) => wanted.has(c.slug)) : undefined;

if (wanted && (!cities || cities.length === 0)) {
  console.error(`No cities matched ${citiesArg}`);
  process.exit(1);
}

async function main() {
const result = await runPfasIngest({
  db: createClient(url!, key!),
  deadlineMs: 6 * 60 * 60 * 1000,
  cities,
  dryRun,
  log: (line) => console.log(`${new Date().toISOString()} ${line}`),
});

console.log("\nSummary");
console.log(`  cities processed : ${result.citiesProcessed}/${result.citiesTotal}`);
console.log(`  detections       : ${result.rowsFetched}`);
console.log(`  upserted         : ${result.rowsUpserted}${dryRun ? " (dry run — nothing written)" : ""}`);
console.log(`  errors           : ${result.errors.length}`);
for (const e of result.errors) console.log(`    - ${e}`);
console.log(`  cities with data : ${result.cities.filter((c) => c.rowsFetched > 0).length}`);
console.log(
  `  top cities       : ${result.cities
    .filter((c) => c.rowsFetched > 0)
    .sort((a, b) => b.rowsFetched - a.rowsFetched)
    .slice(0, 8)
    .map((c) => `${c.city} ${c.rowsFetched}`)
    .join(", ")}`,
);

process.exit(result.errors.length > 0 && result.rowsFetched === 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
