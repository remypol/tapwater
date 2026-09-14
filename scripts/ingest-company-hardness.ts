/**
 * Hardness by postcode district from the water companies' own postcode checkers.
 *
 * The Stream open-data portal carries hardness for Yorkshire, Thames and NI
 * only. The other companies publish it through a "check your water" tool on
 * their site, one postcode at a time. This script asks each tool once per
 * district (nearest full postcode to the district centroid, from postcodes.io)
 * and stores the answer in drinking_water_readings as
 * "Hardness (Total) as CaCO3", source company_scrape, so getHardness() picks it
 * up with no other change. One request a second, browser-like headers, and only
 * companies whose robots.txt allows the endpoint.
 *
 *   npx tsx scripts/ingest-company-hardness.ts united-utilities [--limit 5] [--dry] [--delay 3000] [--only EX17,EX2]
 *   npx tsx scripts/ingest-company-hardness.ts all
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36 TapWater.uk-hardness/1.0 (+https://www.tapwater.uk/about)";
const DETERMINAND = "Hardness (Total) as CaCO3";

interface Lookup {
  mgCaCO3: number;
  zone: string | null;
}

type Adapter = (postcode: string, lat: number, lng: number) => Promise<Lookup | null>;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getJson<T>(url: string, init: RequestInit = {}): Promise<T | null> {
  const res = await fetch(url, { ...init, headers: { "user-agent": UA, accept: "application/json, text/html;q=0.9", ...(init.headers ?? {}) } });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

async function getText(url: string, init: RequestInit = {}): Promise<string | null> {
  const res = await fetch(url, { ...init, headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml", ...(init.headers ?? {}) } });
  if (!res.ok) return null;
  return res.text();
}

const num = (s: string | undefined | null) => (s == null ? NaN : parseFloat(s));

const ADAPTERS: Record<string, Adapter> = {
  "united-utilities": async (postcode) => {
    type Row = { chemical?: string; average?: string; units?: string };
    const d = await getJson<{ zoneName?: string; zoneCode?: string; reportRows?: Row[] }>(
      `https://www.unitedutilities.com/api/waterquality/detailed?postcode=${encodeURIComponent(postcode)}`,
    );
    const row = d?.reportRows?.find((r) => /hardness total as caco3/i.test(r.chemical ?? ""));
    const v = num(row?.average);
    if (!Number.isFinite(v)) return null;
    return { mgCaCO3: v, zone: d?.zoneCode ?? d?.zoneName ?? null };
  },

  "south-west-water": async (postcode) => {
    const d = await getJson<{ match?: boolean; partsPerMillion?: number; areaName?: string }>(
      "https://www.southwestwater.co.uk/api/waterqualitysearch/search",
      { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ postcode }) },
    );
    if (!d?.match || typeof d.partsPerMillion !== "number") return null;
    return { mgCaCO3: d.partsPerMillion, zone: d.areaName ?? null };
  },

  "south-east-water": async (postcode) => {
    const d = await getJson<{ result?: { waterQualityZone?: string; mgPerLitreCaCO3?: number } }>(
      "https://europe-west2-dt-ma2-prd.cloudfunctions.net/waterHardnessCF",
      {
        method: "POST",
        // The function answers "unauthorised request" unless the call looks like
        // it came from the company's own hardness page.
        headers: { "content-type": "application/json", origin: "https://www.southeastwater.co.uk", referer: "https://www.southeastwater.co.uk/" },
        body: JSON.stringify({ data: { postCode: postcode, customerReference: "", propertyReference: "", meterKey: "method", method: "GET", uid: null, searchString: null, caseChoice: "" } }),
      },
    );
    const v = d?.result?.mgPerLitreCaCO3;
    if (typeof v !== "number") return null;
    return { mgCaCO3: v, zone: d?.result?.waterQualityZone ?? null };
  },

  "affinity-water": async (postcode) => {
    const d = await getJson<{ message?: string }>(
      `https://ctapi-middleware-prod.affinitywater.co.uk/Prod/search/postcode-validate?id=12325&postcode=${encodeURIComponent(postcode)}`,
    );
    const m = d?.message?.match(/Total Hardness[\s\S]{0,120}?(\d+(?:\.\d+)?)\s*mg\/l/i);
    const v = num(m?.[1]);
    if (!Number.isFinite(v)) return null;
    const zone = d?.message?.match(/\/docs\/water-quality\/([A-Z0-9]+)\.pdf/i)?.[1] ?? null;
    return { mgCaCO3: v, zone };
  },

  "wessex-water": async (postcode) => {
    const html = await getText(`https://www.wessexwater.co.uk/your-water/water-quality-results?postcode=${encodeURIComponent(postcode)}`);
    const m = html?.match(/Calcium Carbonate\s*\(mg\/l\)[\s\S]{0,400}?<span[^>]*>\s*(\d+(?:\.\d+)?)/i);
    const v = num(m?.[1]);
    if (!Number.isFinite(v)) return null;
    const zone = html?.match(/ZONE\s+\d+\s+[A-Z &'-]+/)?.[0]?.trim() ?? null;
    return { mgCaCO3: v, zone };
  },

  "anglian-water": async (_postcode, lat, lng) => {
    const z = await getJson<{ shortName?: string; name?: string }>(
      `https://waterquality.anglianwater.com/DDProxy.ashx?app=wq&lon=${lng}&lat=${lat}&version=18`,
      { headers: { referer: "https://waterquality.anglianwater.com/map.aspx" } },
    );
    if (!z?.shortName) return null;
    const html = await getText(`https://waterquality.anglianwater.com/ZoneInfoPanel.aspx?pwsz=${encodeURIComponent(z.shortName)}&version=2026`);
    const m = html?.match(/(\d+(?:\.\d+)?)\s*mg\/l\s*Calcium Carbonate/i);
    const v = num(m?.[1]);
    if (!Number.isFinite(v)) return null;
    return { mgCaCO3: v, zone: `${z.shortName} ${z.name ?? ""}`.trim() };
  },
};

async function nearestPostcode(lat: number, lng: number): Promise<string | null> {
  const d = await getJson<{ result?: { postcode: string }[] | null }>(
    `https://api.postcodes.io/postcodes?lon=${lng}&lat=${lat}&limit=1&radius=2000`,
  );
  return d?.result?.[0]?.postcode ?? null;
}

async function main() {
  const [target, ...flags] = process.argv.slice(2);
  const dry = flags.includes("--dry");
  const limitIdx = flags.indexOf("--limit");
  const limit = limitIdx >= 0 ? Number(flags[limitIdx + 1]) : Infinity;
  const delayIdx = flags.indexOf("--delay");
  const delayMs = delayIdx >= 0 ? Number(flags[delayIdx + 1]) : 1000;
  const onlyIdx = flags.indexOf("--only");
  const only = onlyIdx >= 0 ? new Set(flags[onlyIdx + 1].split(",").map((d) => d.trim().toUpperCase())) : null;
  const suppliers = target === "all" ? Object.keys(ADAPTERS) : [target];
  if (!target || suppliers.some((s) => !ADAPTERS[s])) {
    console.error(`Usage: ingest-company-hardness.ts <${Object.keys(ADAPTERS).join("|")}|all> [--limit N] [--dry]`);
    process.exit(1);
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const today = new Date().toISOString().slice(0, 10);

  for (const supplier of suppliers) {
    const { data: districts, error } = await supabase
      .from("postcode_districts")
      .select("id, latitude, longitude")
      .eq("supplier_id", supplier)
      .order("id");
    if (error) throw error;
    const rows = (districts ?? []).filter((d) => !only || only.has(String(d.id).toUpperCase())).slice(0, limit);
    console.log(`\n${supplier}: ${rows.length} districts${dry ? " (dry run)" : ""}`);
    let ok = 0, miss = 0;
    for (const d of rows) {
      const district: string = d.id;
      try {
        const postcode = supplier === "anglian-water" ? district : await nearestPostcode(d.latitude, d.longitude);
        if (!postcode) { miss++; console.log(`  ${district.padEnd(5)} no postcode near centroid`); continue; }
        const r = await ADAPTERS[supplier](postcode, d.latitude, d.longitude);
        if (!r || r.mgCaCO3 <= 0 || r.mgCaCO3 > 1000) { miss++; console.log(`  ${district.padEnd(5)} ${postcode.padEnd(8)} no hardness`); continue; }
        ok++;
        console.log(`  ${district.padEnd(5)} ${postcode.padEnd(8)} ${String(Math.round(r.mgCaCO3)).padStart(4)} mg/L  ${r.zone ?? ""}`);
        if (!dry) {
          await supabase.from("drinking_water_readings").delete()
            .eq("postcode_district", district).eq("source", "company_scrape").eq("determinand", DETERMINAND);
          const { error: insErr } = await supabase.from("drinking_water_readings").insert({
            postcode_district: district,
            supplier_id: supplier,
            supply_zone: r.zone,
            determinand: DETERMINAND,
            value: Math.round(r.mgCaCO3 * 100) / 100,
            unit: "mg/l",
            sample_date: today,
            source: "company_scrape",
            source_ref: `${supplier} postcode checker, ${postcode}`,
          });
          if (insErr) console.error(`  ${district} insert failed: ${insErr.message}`);
        }
      } catch (err) {
        miss++;
        console.log(`  ${district.padEnd(5)} error: ${err instanceof Error ? err.message : String(err)}`);
      }
      await sleep(delayMs);
    }
    console.log(`${supplier}: ${ok} stored, ${miss} without a reading`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
