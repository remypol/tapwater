/**
 * Mint an API key for a B2B customer. Prints the key once; only its hash is stored.
 *
 *   npx tsx scripts/create-api-key.ts "Acme Lettings" ops@acme.co.uk pilot 1000
 */
import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "node:crypto";
import { config } from "dotenv";

config({ path: ".env.local" });

const [customer, contactEmail, plan = "pilot", quotaArg = "1000"] = process.argv.slice(2);
if (!customer) {
  console.error('Usage: npx tsx scripts/create-api-key.ts "<customer>" [email] [plan] [monthly quota]');
  process.exit(1);
}

async function main() {
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const key = `tw_live_${randomBytes(24).toString("base64url")}`;
const { data, error } = await supabase
  .from("api_keys")
  .insert({
    key_hash: createHash("sha256").update(key).digest("hex"),
    key_prefix: key.slice(0, 12),
    customer,
    contact_email: contactEmail ?? null,
    plan,
    monthly_quota: Number(quotaArg),
  })
  .select("id")
  .single();
if (error) {
  console.error(error.message);
  process.exit(1);
}
console.log(`Key #${data.id} for ${customer} (${plan}, ${quotaArg}/month). Shown once:\n\n  ${key}\n`);
console.log(`Try it:\n  curl -H "x-api-key: ${key}" "https://www.tapwater.uk/api/v1/report?postcode=SW1A%201AA"`);
}

main();
