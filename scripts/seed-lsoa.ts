/**
 * One-time script: Import ONS postcode-to-LSOA mappings into Supabase.
 *
 * Downloads the ONS "Postcode to OA to LSOA to MSOA to LAD" best-fit lookup,
 * extracts postcode + LSOA columns, and bulk-inserts into postcode_lsoa table.
 *
 * Usage: npx tsx scripts/seed-lsoa.ts <path-to-csv>
 *
 * The CSV can be downloaded from:
 * https://open-geography-portalx-ons.hub.arcgis.com/datasets/postcode-to-oa-2021-to-lsoa-to-msoa-to-lad-february-2025-best-fit-lookup-in-the-uk
 *
 * Expected columns: PCDS (postcode), LSOA21CD (LSOA code), LSOA21NM (LSOA name)
 * or: pcds, lsoa21cd, lsoa21nm (lowercase)
 */

import { createClient } from "@supabase/supabase-js";
import { createReadStream } from "fs";
import { createInterface } from "readline";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: npx tsx scripts/seed-lsoa.ts <path-to-csv>");
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  const rl = createInterface({ input: createReadStream(csvPath) });
  let headers: string[] = [];
  let postcodeIdx = -1;
  let lsoaCodeIdx = -1;
  let lsoaNameIdx = -1;
  let batch: { postcode: string; lsoa_code: string; lsoa_name: string }[] = [];
  let total = 0;
  let skipped = 0;

  const BATCH_SIZE = 5000;

  for await (const line of rl) {
    if (headers.length === 0) {
      headers = line.split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
      postcodeIdx = headers.findIndex((h) => h === "pcds" || h === "pcd8");
      lsoaCodeIdx = headers.findIndex((h) => h === "lsoa21cd");
      lsoaNameIdx = headers.findIndex((h) => h === "lsoa21nm");

      if (postcodeIdx === -1 || lsoaCodeIdx === -1) {
        console.error("CSV must have PCDS and LSOA21CD columns");
        console.error("Found columns:", headers.join(", "));
        process.exit(1);
      }
      console.log(`Columns found: postcode=${headers[postcodeIdx]}, lsoa=${headers[lsoaCodeIdx]}`);
      continue;
    }

    const cols = line.split(",").map((c) => c.trim().replace(/"/g, ""));
    const postcode = cols[postcodeIdx];
    const lsoaCode = cols[lsoaCodeIdx];
    const lsoaName = lsoaNameIdx >= 0 ? cols[lsoaNameIdx] : "";

    if (!postcode || !lsoaCode) {
      skipped++;
      continue;
    }

    batch.push({ postcode, lsoa_code: lsoaCode, lsoa_name: lsoaName });

    if (batch.length >= BATCH_SIZE) {
      const { error } = await db
        .from("postcode_lsoa")
        .upsert(batch, { onConflict: "postcode", ignoreDuplicates: true });

      if (error) {
        console.error(`Batch insert error at row ${total}:`, error.message);
      }

      total += batch.length;
      batch = [];
      process.stdout.write(`\r  ${total.toLocaleString()} rows imported...`);
    }
  }

  // Final batch
  if (batch.length > 0) {
    await db
      .from("postcode_lsoa")
      .upsert(batch, { onConflict: "postcode", ignoreDuplicates: true });
    total += batch.length;
  }

  console.log(`\nDone! ${total.toLocaleString()} postcodes imported, ${skipped} skipped.`);
}

main().catch(console.error);
