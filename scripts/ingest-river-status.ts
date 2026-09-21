/**
 * River classification ingest, run by hand: the same code path as
 * /api/cron/river-status (monthly).
 *
 * Usage:
 *   export $(grep -E "^(NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY)=" .env.local | xargs)
 *   npx tsx scripts/ingest-river-status.ts
 *
 * Idempotent: rivers upsert on water body id, districts on postcode district.
 */

import { createClient } from "@supabase/supabase-js";
import { runRiverStatusIngest } from "../src/lib/river-status-ingest";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

runRiverStatusIngest({ db: createClient(url, key) })
  .then((r) => console.log(JSON.stringify(r, null, 2)))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
