/**
 * Ask Thames Water which supply zone each postcode district is in.
 *
 * Until November 2026 zone results were handed to districts in rotation within a
 * region, so a district's "readings" were often another zone's, and the list
 * included districts Thames Water does not supply at all. This replaces the
 * guess with Thames's own answer.
 *
 * For each district: take a few real postcodes (postcodes.io), ask Thames's
 * lookup for each, and keep every zone it names with how often. A district where
 * Thames names no zone for any sampled postcode is not supplied by Thames.
 *
 *   npx tsx scripts/map-thames-zones.ts            # all districts in src/lib/thames-zones.ts
 *   npx tsx scripts/map-thames-zones.ts RG1 KT17   # just these
 *
 * Writes data/thames-district-zones.json. Safe to re-run; it resumes.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { THAMES_ZONE_POSTCODES } from "../src/lib/thames-zones";

const OUT = "data/thames-district-zones.json";
const THAMES = "https://water-quality-api.prod.p.webapp.thameswater.co.uk/water-quality-api/PostCode";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const SAMPLES = 6;
/** Pause between Thames calls. A run at 120 ms with four workers got this machine blocked on 17 Nov 2026. */
const THAMES_PAUSE_MS = 4000;
let blocked = false;

export interface DistrictZones {
  /** Zone code → how many sampled postcodes Thames placed in it. */
  zones: Record<string, number>;
  /** Real postcodes sampled. */
  sampled: number;
  /** Postcodes Thames answered for. 0 means Thames does not supply this district. */
  answered: number;
  checked: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function randomPostcode(district: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.postcodes.io/random/postcodes?outcode=${encodeURIComponent(district)}`, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return null;
    const body = (await res.json()) as { result?: { postcode?: string } | null };
    return body.result?.postcode ?? null;
  } catch {
    return null;
  }
}

/** Zone code, null when Thames says the postcode is not theirs, undefined when the call failed. */
async function thamesZone(postcode: string): Promise<string | null | undefined> {
  try {
    const res = await fetch(`${THAMES}/${postcode.replace(/\s+/g, "")}`, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(20_000) });
    if (res.status === 404) return null;
    // 403 is Thames's firewall refusing us for asking too fast. Stop the whole
    // run: carrying on only records wrong "not Thames" answers and extends the block.
    if (res.status === 403) {
      blocked = true;
      return undefined;
    }
    if (!res.ok) return undefined;
    const body = (await res.json()) as { mapCode?: string };
    return body.mapCode ?? null;
  } catch {
    return undefined;
  }
}

async function mapDistrict(district: string): Promise<DistrictZones | null> {
  const seen = new Set<string>();
  for (let i = 0; i < SAMPLES * 2 && seen.size < SAMPLES; i++) {
    const pc = await randomPostcode(district);
    if (pc) seen.add(pc);
  }
  if (seen.size === 0) return null;
  const zones: Record<string, number> = {};
  let answered = 0;
  let failed = 0;
  for (const pc of seen) {
    const zone = await thamesZone(pc);
    if (zone === undefined) failed++;
    else if (zone) {
      zones[zone] = (zones[zone] ?? 0) + 1;
      answered++;
    }
    if (blocked) return null;
    await sleep(THAMES_PAUSE_MS);
  }
  // If every call failed we learned nothing; do not record "not Thames".
  if (failed === seen.size) return null;
  return { zones, sampled: seen.size, answered, checked: new Date().toISOString().slice(0, 10) };
}

async function main() {
  const wanted = process.argv.slice(2).map((d) => d.toUpperCase());
  const all = [...new Set(Object.values(THAMES_ZONE_POSTCODES).flat())];
  const districts = wanted.length > 0 ? wanted : all;
  const result: Record<string, DistrictZones> = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};
  const todo = districts.filter((d) => wanted.length > 0 || !result[d]);
  console.log(`${todo.length} districts to check (${Object.keys(result).length} already done)`);

  let done = 0;
  const queue = [...todo];
  async function worker() {
    for (;;) {
      const d = queue.shift();
      if (!d || blocked) return;
      const r = await mapDistrict(d);
      if (r) result[d] = r;
      done++;
      if (done % 5 === 0) {
        writeFileSync(OUT, JSON.stringify(result, null, 1));
        console.log(`${done}/${todo.length}`);
      }
    }
  }
  // One worker only: see THAMES_PAUSE_MS. About 25 seconds a district, three hours for the full list.
  await worker();
  if (blocked) console.log("Stopped: Thames returned 403 (blocked). Wait a day and re-run; finished districts are kept.");
  writeFileSync(OUT, JSON.stringify(result, null, 1));
  const vals = Object.values(result);
  console.log(`done: ${vals.length} districts, ${vals.filter((v) => v.answered > 0).length} supplied by Thames, ${vals.filter((v) => v.answered === 0).length} not`);
}

main();
