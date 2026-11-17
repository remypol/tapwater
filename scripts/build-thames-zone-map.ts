/**
 * Build src/data/thames-zone-map.json: for every district Thames Water mainly
 * supplies, the supply zones it falls in and how much of it each one covers.
 *
 *   npx tsx scripts/build-thames-zone-map.ts
 *
 * Inputs:
 *   data/thames-district-zones.json   Thames's own answers, from scripts/map-thames-zones.ts
 *   src/data/district-suppliers.json  who supplies each district, from Ofwat's map
 *
 * A district is Thames's when Ofwat's map gives Thames the largest share of it.
 * Its zones are the ones Thames's lookup named for real postcodes there.
 *
 * Thames's lookup cannot answer five-character postcodes (E1 5HR, N1 9GU,
 * W2 1HB), so districts with a one-letter area and one digit have no answer
 * of their own. They take the zones of the three nearest districts that do
 * have one (north of the river only), closer ones counting for more, and are marked `approx` with the
 * districts they borrowed from. Pages must say so and rankings leave them out.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { getDistrictSuppliers } from "../src/lib/suppliers";

const OUT = "src/data/thames-zone-map.json";
/** Borrow only from districts whose centre is this close. */
const MAX_NEIGHBOUR_KM = 5;
const NEIGHBOURS = 3;
/**
 * The districts that need to borrow (E, N and W) all lie north of the Thames,
 * and no supply zone crosses the river: north-bank zones are coded NLE, NLW or
 * LV, south-bank ones SLE and SLW. Without this, E1 borrowed from Bermondsey.
 */
const NORTH_BANK_ZONE = /^(NL|LV)/;

interface Lookup { zones: Record<string, number>; sampled: number; answered: number }
interface Entry { zones: Record<string, number>; approx?: string[] }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function centre(outcode: string): Promise<[number, number] | null> {
  try {
    const res = await fetch(`https://api.postcodes.io/outcodes/${encodeURIComponent(outcode)}`, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return null;
    const body = (await res.json()) as { result?: { latitude?: number; longitude?: number } | null };
    const { latitude, longitude } = body.result ?? {};
    return latitude != null && longitude != null ? [latitude, longitude] : null;
  } catch {
    return null;
  }
}

function km(a: [number, number], b: [number, number]): number {
  const rad = Math.PI / 180;
  const dLat = (b[0] - a[0]) * rad;
  const dLng = (b[1] - a[1]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** A neighbour's answers with south-bank zones taken out. */
function northBank(v: Lookup): Lookup {
  const zones = Object.fromEntries(Object.entries(v.zones).filter(([code]) => NORTH_BANK_ZONE.test(code)));
  return { zones, sampled: v.sampled, answered: Object.values(zones).reduce((s, n) => s + n, 0) };
}

async function main() {
  const lookup = JSON.parse(readFileSync("data/thames-district-zones.json", "utf8")) as Record<string, Lookup>;
  const suppliers = JSON.parse(readFileSync("src/data/district-suppliers.json", "utf8")) as Record<string, [string, number][]>;

  const thames = Object.keys(suppliers).filter((d) => getDistrictSuppliers(d)?.[0].id === "thames-water").sort();
  const answered = Object.entries(lookup).filter(([, v]) => v.answered > 0);
  const unanswered = thames.filter((d) => lookup[d] && lookup[d].answered === 0);
  const neverAsked = thames.filter((d) => !lookup[d]);

  const map: Record<string, Entry> = {};
  for (const d of thames) if (lookup[d]?.answered > 0) map[d] = { zones: lookup[d].zones };

  // Districts with no answer of their own borrow from their nearest neighbours.
  const centres = new Map<string, [number, number]>();
  if (unanswered.length > 0) {
    for (const d of [...unanswered, ...answered.map(([k]) => k)]) {
      const c = await centre(d);
      if (c) centres.set(d, c);
      await sleep(60);
    }
  }
  const stillMissing: string[] = [];
  for (const d of unanswered) {
    const here = centres.get(d);
    const near = here
      ? answered
          .map(([k, v]) => ({ k, v: northBank(v), dist: centres.has(k) ? km(here, centres.get(k) as [number, number]) : Infinity }))
          .filter((n) => n.dist <= MAX_NEIGHBOUR_KM && n.v.answered > 0)
          .sort((a, b) => a.dist - b.dist)
          .slice(0, NEIGHBOURS)
      : [];
    if (near.length === 0) {
      stillMissing.push(d);
      continue;
    }
    const zones: Record<string, number> = {};
    for (const n of near) {
      const closeness = 1 / (n.dist + 0.5);
      for (const [code, count] of Object.entries(n.v.zones)) zones[code] = (zones[code] ?? 0) + (count / n.v.answered) * closeness;
    }
    const total = Object.values(zones).reduce((s, x) => s + x, 0);
    map[d] = {
      zones: Object.fromEntries(Object.entries(zones).sort((a, b) => b[1] - a[1]).map(([code, w]) => [code, Math.round((w / total) * 100) / 100]).filter(([, w]) => (w as number) > 0)),
      approx: near.map((n) => n.k),
    };
  }

  const sorted = Object.fromEntries(Object.entries(map).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })));
  writeFileSync(OUT, "{\n" + Object.entries(sorted).map(([d, e]) => `  ${JSON.stringify(d)}: ${JSON.stringify(e)}`).join(",\n") + "\n}\n");

  const approx = Object.entries(sorted).filter(([, e]) => e.approx);
  console.log(`${Object.keys(sorted).length} districts written to ${OUT}`);
  console.log(`  ${Object.keys(sorted).length - approx.length} from Thames's own answer`);
  console.log(`  ${approx.length} borrowed from neighbours: ${approx.map(([d, e]) => `${d}(${(e.approx as string[]).join("+")})`).join(" ")}`);
  if (stillMissing.length) console.log(`  no neighbour within ${MAX_NEIGHBOUR_KM} km, left out: ${stillMissing.join(" ")}`);
  if (neverAsked.length) console.log(`  Thames per Ofwat but never looked up (run map-thames-zones.ts for those with a page): ${neverAsked.join(" ")}`);
}

main();
