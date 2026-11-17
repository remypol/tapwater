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
 * Checked and left out: Severn Trent. Its checker calls /bin/waterquality/info.json,
 * and its robots.txt disallows /bin (17 Nov 2026). Its open dataset carries no
 * hardness, calcium or magnesium either, so the Midlands stay without a figure.
 *
 *   npx tsx scripts/ingest-company-hardness.ts united-utilities [--limit 5] [--dry] [--delay 3000] [--only EX17,EX2] [--skip-existing]
 *   npx tsx scripts/ingest-company-hardness.ts all
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { PDFParse } from "pdf-parse";

config({ path: ".env.local" });

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36 TapWater.uk-hardness/1.0 (+https://www.tapwater.uk/about)";
const DETERMINAND = "Hardness (Total) as CaCO3";

interface Lookup {
  mgCaCO3: number;
  zone: string | null;
}

type Adapter = (postcode: string, lat: number, lng: number) => Promise<Lookup | null>;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Set when a company answers 429 (too many requests): the run for that company stops at once. */
let rateLimited = false;

async function getJson<T>(url: string, init: RequestInit = {}): Promise<T | null> {
  const res = await fetch(url, { ...init, headers: { "user-agent": UA, accept: "application/json, text/html;q=0.9", ...(init.headers ?? {}) } });
  if (!res.ok) {
    console.log(`     HTTP ${res.status} from ${new URL(url).host}`);
    if (res.status === 429) rateLimited = true;
    return null;
  }
  return (await res.json()) as T;
}

async function getText(url: string, init: RequestInit = {}): Promise<string | null> {
  const res = await fetch(url, { ...init, headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml", ...(init.headers ?? {}) } });
  if (!res.ok) return null;
  return res.text();
}

const num = (s: string | undefined | null) => (s == null ? NaN : parseFloat(s));

/** What South West Water's and SES Water's postcode searches answer with. */
interface WaterQualitySearch {
  match?: boolean;
  areaName?: string;
  partsPerMillion?: number;
  clarkeDegrees?: number;
}

/**
 * Hardness as CaCO3 from a "waterqualitysearch" answer.
 *
 * Both sites give "partsPerMillion" beside Clark degrees, but not of the same
 * thing: South West Water's are of calcium carbonate, SES Water's of calcium
 * (74 beside 13 Clark degrees; 13 × 14.254 = 185 and 74 × 100.09/40.08 = 185).
 * The Clark degrees say which: one Clark degree is 14.254 mg/l as CaCO3. A
 * figure that fits neither reading is left out. Without Clark degrees the
 * parts per million are taken as CaCO3, as before.
 */
function fromWaterQualitySearch(d: WaterQualitySearch | null, postcode: string): Lookup | null {
  if (!d?.match || typeof d.partsPerMillion !== "number" || !(d.partsPerMillion > 0)) return null;
  const ppm = d.partsPerMillion;
  const zone = d.areaName ?? null;
  const clark = Number(d.clarkeDegrees);
  if (!(clark > 0)) return { mgCaCO3: ppm, zone };
  const fromClark = clark * 14.254;
  // Clark degrees are whole numbers, so allow the half-degree of rounding too.
  const fits = (v: number) => Math.abs(v - fromClark) <= Math.max(0.1 * fromClark, 8);
  if (fits(ppm)) return { mgCaCO3: ppm, zone };
  const asCaCO3 = ppm * (100.09 / 40.08);
  if (fits(asCaCO3)) return { mgCaCO3: Math.round(asCaCO3), zone };
  console.log(`     ${postcode}: ${ppm} ppm and ${clark} Clark degrees fit neither reading, left out`);
  return null;
}

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
    const d = await getJson<WaterQualitySearch>(
      "https://www.southwestwater.co.uk/api/waterqualitysearch/search",
      { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ postcode }) },
    );
    return fromWaterQualitySearch(d, postcode);
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

  // Bristol Water's "Water Quality and Hardness checker". The field numbers are
  // the ones its own page script reads: 1 zone name, 8 total hardness in mg/l as
  // CaCO3 (6 calcium, 7 magnesium, 9 to 11 Clark, French and German degrees).
  // An empty list means the postcode is not Bristol Water's. robots.txt only
  // disallows /_hcms/preview/. Read on 17 Nov 2026.
  "bristol-water": async (postcode) => {
    const d = await getJson<{ objects?: { values?: Record<string, unknown> }[] }>(
      `https://www.bristolwater.co.uk/_hcms/api/getWQHubdbDataInfo?q=${encodeURIComponent(postcode)}`,
    );
    const values = d?.objects?.[0]?.values;
    const v = num(values?.["8"] == null ? null : String(values["8"]));
    if (!Number.isFinite(v) || v <= 0) return null;
    return { mgCaCO3: v, zone: values?.["1"] ? String(values["1"]) : null };
  },

  // SES Water's "water quality and hardness report" search, on the same system
  // as South West Water's (see fromWaterQualitySearch). SES softens its water at
  // the works, which is why Sutton and Redhill read about 185 and not the 280 of
  // their neighbours. robots.txt disallows /episerver/ and /utils/ only. It
  // answers 429 after about seven requests at one a second: use --delay 20000.
  // Read on 17 Nov 2026.
  "ses-water": async (postcode) => {
    const d = await getJson<WaterQualitySearch>(
      "https://www.seswater.co.uk/api/waterqualitysearch/search",
      { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ postcode }) },
    );
    return fromWaterQualitySearch(d, postcode);
  },

  "anglian-water": async (_postcode, lat, lng) => {
    const z = await getJson<{ shortName?: string; name?: string; awOwned?: string }>(
      `https://waterquality.anglianwater.com/DDProxy.ashx?app=wq&lon=${lng}&lat=${lat}&version=18`,
      { headers: { referer: "https://waterquality.anglianwater.com/map.aspx" } },
    );
    // Centroids inside Cambridge Water or Essex & Suffolk come back with the
    // other company's name and awOwned "False"; there is no zone panel for those.
    if (!z?.shortName || z.awOwned === "False") return null;
    const html = await getText(`https://waterquality.anglianwater.com/ZoneInfoPanel.aspx?pwsz=${encodeURIComponent(z.shortName)}&version=2026`);
    // The panel puts the value before its label: `227.03</span>&nbsp;mg/l</td><td>:Calcium Carbonate</td>`
    const m = html?.match(/(\d+(?:\.\d+)?)<\/span>(?:&nbsp;|\s)*mg\/l[\s\S]{0,80}?Calcium Carbonate/i);
    const v = num(m?.[1]);
    if (!Number.isFinite(v)) return null;
    return { mgCaCO3: v, zone: `${z.shortName} ${z.name ?? ""}`.trim() };
  },
};

// ── Scottish Water: zone name from the lookup, hardness from the annual PDF ──
//
// The postcode lookup returns the regulatory supply zone ("Glencorse B") but no
// hardness. Scottish Water publishes hardness per zone once a year as a PDF
// table (name, Ca, Mg, CaCO3, Clark, French, German, level). Parse it once.
const SCOTTISH_HARDNESS_PDF =
  "https://www.scottishwater.co.uk/-/media/scottishwater/document-hub/key-publications/water-quality/130225waterhardnessdata24.pdf";
let scottishTable: Promise<Map<string, number>> | null = null;

async function loadScottishTable(): Promise<Map<string, number>> {
  const res = await fetch(SCOTTISH_HARDNESS_PDF, { headers: { "user-agent": UA } });
  if (!res.ok) throw new Error(`Scottish hardness PDF: HTTP ${res.status}`);
  const parser = new PDFParse({ data: Buffer.from(await res.arrayBuffer()) });
  const { text } = await parser.getText();
  const table = new Map<string, number>();
  for (const line of text.split("\n")) {
    // "Glencorse B \t10.36 \t1.36 \t31.44 \t2.21 \t3.14 \t1.76 \tSoft"
    const m = line.trim().match(/^(.+?)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+[\d.]+\s+[\d.]+\s+[\d.]+\s+[A-Za-z ]+$/);
    if (!m) continue;
    table.set(m[1].trim().toLowerCase(), parseFloat(m[4]));
  }
  if (table.size < 100) throw new Error(`Scottish hardness PDF parsed to only ${table.size} zones`);
  return table;
}

ADAPTERS["scottish-water"] = async (postcode) => {
  scottishTable ??= loadScottishTable();
  const table = await scottishTable;
  const html = await getText(`https://www.scottishwater.co.uk/api/feature/WaterQuality/Results?q=${encodeURIComponent(postcode)}&t=t`);
  const m = html?.replace(/<[^>]+>/g, " ").match(/Site Name:\s*([A-Za-z0-9 &'()/.-]+?)\s{2,}/);
  const zone = m?.[1]?.trim();
  if (!zone) return null;
  // The lookup says "Bradan Milngavie Gorbals Zone RSZ"; the PDF says "Amlaird
  // Milngavie Gorbals". Normalise, then fall back to the longest shared prefix
  // of two or more words, which is the works name the zones are grouped under.
  const norm = (z: string) => z.toLowerCase().replace(/\b(zone|rsz|wtw|bh)\b/g, " ").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  const key = norm(zone);
  let v = table.get(zone.toLowerCase()) ?? [...table.entries()].find(([k]) => norm(k) === key)?.[1];
  if (v == null) {
    const words = key.split(" ");
    for (let n = words.length - 1; n >= 2 && v == null; n--) {
      const prefix = words.slice(0, n).join(" ");
      const hits = [...table.entries()].filter(([k]) => norm(k).startsWith(prefix));
      if (hits.length > 0) v = Math.round(hits.reduce((sum, [, x]) => sum + x, 0) / hits.length);
    }
  }
  if (v == null) { console.log(`     zone "${zone}" not in hardness table`); return null; }
  return { mgCaCO3: v, zone };
};

// ── Northumbrian Water (and Essex & Suffolk): token-protected JSON, mg/L Ca ──
let nwlSession: Promise<{ cookie: string; token: string }> | null = null;
async function loadNwlSession(): Promise<{ cookie: string; token: string }> {
  const res = await fetch("https://www.nwl.co.uk/check-your-area/", { headers: { "user-agent": UA } });
  const html = await res.text();
  const token = html.match(/id="VerificationToken"[^>]*value="([^"]+)"/)?.[1];
  const cookie = (res.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
  if (!token) throw new Error("Northumbrian: no verification token on the page");
  return { cookie, token };
}

const nwlLookup = (areas: string[]): Adapter => async (postcode, lat, lng) => {
  nwlSession ??= loadNwlSession();
  const { cookie, token } = await nwlSession;
  for (const area of areas) {
    const d = await getJson<{ WaterQualityZones?: { WaterQuality?: { zone: string; quality: string }[] }[] }>(
      "https://www.nwl.co.uk/api/ActivityManagement/GetIYASummary",
      {
        method: "POST",
        headers: { "content-type": "application/json", cookie, RequestVerificationToken: token, referer: "https://www.nwl.co.uk/check-your-area/" },
        body: JSON.stringify({ area, postcode, lat, lng, radius: 5, recLimit: 10 }),
      },
    );
    const wq = d?.WaterQualityZones?.[0]?.WaterQuality?.[0];
    const ca = num(wq?.quality);
    // The site multiplies mg/L calcium by 2.5 to show calcium carbonate.
    if (Number.isFinite(ca) && ca > 0) return { mgCaCO3: Math.round(ca * 2.5 * 10) / 10, zone: wq?.zone ?? null };
  }
  return null;
};
ADAPTERS["northumbrian-water"] = nwlLookup(["N", "S"]);
// Essex & Suffolk Water is the same group and the same lookup, area "S".
ADAPTERS["essex-suffolk-water"] = nwlLookup(["S"]);

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
  // For companies that rate-limit hard (South West Water allows about twenty
  // calls an hour): run in chunks and skip districts already stored.
  const skipExisting = flags.includes("--skip-existing");
  const suppliers = target === "all" ? Object.keys(ADAPTERS) : [target];
  if (!target || suppliers.some((s) => !ADAPTERS[s])) {
    console.error(`Usage: ingest-company-hardness.ts <${Object.keys(ADAPTERS).join("|")}|all> [--limit N] [--dry]`);
    process.exit(1);
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const today = new Date().toISOString().slice(0, 10);

  for (const supplier of suppliers) {
    rateLimited = false;
    const { data: districts, error } = await supabase
      .from("postcode_districts")
      .select("id, latitude, longitude")
      .eq("supplier_id", supplier)
      .order("id");
    if (error) throw error;
    let existing = new Set<string>();
    if (skipExisting) {
      const { data: have } = await supabase
        .from("drinking_water_readings")
        .select("postcode_district")
        .eq("supplier_id", supplier)
        .eq("source", "company_scrape")
        .eq("determinand", DETERMINAND)
        .limit(5000);
      existing = new Set((have ?? []).map((r) => String(r.postcode_district).toUpperCase()));
    }
    const rows = (districts ?? [])
      .filter((d) => !only || only.has(String(d.id).toUpperCase()))
      .filter((d) => !existing.has(String(d.id).toUpperCase()))
      .slice(0, limit);
    console.log(`\n${supplier}: ${rows.length} districts${dry ? " (dry run)" : ""}`);
    let ok = 0, miss = 0;
    for (const [index, d] of rows.entries()) {
      // The pause comes before every request after the first. It used to sit at
      // the end of the loop, where a district without a reading skipped it, so a
      // run of misses went out as fast as the network allowed and drew a 429.
      if (index > 0) await sleep(delayMs);
      const district: string = d.id;
      try {
        const postcode = supplier === "anglian-water" ? district : await nearestPostcode(d.latitude, d.longitude);
        if (!postcode) { miss++; console.log(`  ${district.padEnd(5)} no postcode near centroid`); continue; }
        const r = await ADAPTERS[supplier](postcode, d.latitude, d.longitude);
        if (rateLimited) {
          // Asking again straight away is what a rate limit is there to stop.
          console.log(`  ${supplier} says we are asking too fast. Stopped here; run again later with --skip-existing and a larger --delay.`);
          break;
        }
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
    }
    console.log(`${supplier}: ${ok} stored, ${miss} without a reading`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
