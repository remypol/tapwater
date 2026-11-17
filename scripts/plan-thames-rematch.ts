/**
 * Dry run for re-matching Thames Water districts to their real supply zones.
 * Writes nothing: it reads the zone lookup results and the zone reports and
 * says what each district would become.
 *
 *   npx tsx scripts/plan-thames-rematch.ts            # summary
 *   npx tsx scripts/plan-thames-rematch.ts --all      # every district
 *
 * Inputs:
 *   data/thames-district-zones.json   from scripts/map-thames-zones.ts: for each
 *                                     district, the zones Thames named for sampled
 *                                     postcodes and how often
 *   data/thames-water/all-zones.json  the parsed zone reports
 *
 * What it found on 17 November 2026, before the switch:
 * - Thames's lookup cannot answer five-character postcodes (E1 5HR, N1 9GU,
 *   W2 1HB): every district with a one-letter area and one digit comes back
 *   empty. Thames's own website can, but it sits behind an "I am not a robot"
 *   check, so those districts stay approximate.
 * - The zone reports file holds 150 zones, and the lookup names zones that are
 *   not in it (NLW51 to NLW61, NLE1, SLW4, LV28 and others). They were missed
 *   because the original search only tried two-digit codes under 50.
 * - A district usually spans several zones, so its hardness is the average of
 *   its zones weighted by how often each was named.
 */
import { existsSync, readFileSync } from "node:fs";

interface DistrictZones { zones: Record<string, number>; sampled: number; answered: number }
interface ZoneParam { parameter: string; mean: { value: number } | null; max: { value: number } | null }
interface Zone { mapCode: string; parameters: ZoneParam[] }

const HARDNESS = "Hardness (Total) as CaCO3";
/** One-letter area and one digit: the lookup cannot answer these. */
const SHORT = /^[A-Z][0-9]$/;

function main() {
  const mapPath = "data/thames-district-zones.json";
  if (!existsSync(mapPath)) {
    console.error(`${mapPath} not found. Run: npx tsx scripts/map-thames-zones.ts`);
    process.exit(1);
  }
  const map = JSON.parse(readFileSync(mapPath, "utf8")) as Record<string, DistrictZones>;
  const zones = new Map((JSON.parse(readFileSync("data/thames-water/all-zones.json", "utf8")) as Zone[]).map((z) => [z.mapCode, z]));
  const hardnessOf = (code: string): number | null => {
    const p = zones.get(code)?.parameters.find((x) => x.parameter === HARDNESS);
    return p?.mean?.value ?? p?.max?.value ?? null;
  };

  const rows: { district: string; kind: string; zone: string; hardness: number | null; note: string }[] = [];
  const missing = new Map<string, number>();
  for (const [district, d] of Object.entries(map).sort()) {
    const named = Object.entries(d.zones).sort((a, b) => b[1] - a[1]);
    if (named.length === 0) {
      rows.push({ district, kind: SHORT.test(district) ? "short" : "not-thames", zone: "", hardness: null, note: SHORT.test(district) ? "lookup cannot answer; stays approximate" : "Thames names no zone" });
      continue;
    }
    for (const [code, n] of named) if (!zones.has(code)) missing.set(code, (missing.get(code) ?? 0) + n);
    const held = named.filter(([code]) => hardnessOf(code) != null);
    if (held.length === 0) {
      rows.push({ district, kind: "zone-missing", zone: named[0][0], hardness: null, note: `no report held for ${named.map(([c]) => c).join(", ")}` });
      continue;
    }
    const weight = held.reduce((s, [, n]) => s + n, 0);
    const hardness = Math.round(held.reduce((s, [code, n]) => s + (hardnessOf(code) as number) * n, 0) / weight);
    const share = Math.round((weight / named.reduce((s, [, n]) => s + n, 0)) * 100);
    rows.push({ district, kind: "matched", zone: held[0][0], hardness, note: `${held.length} zone${held.length === 1 ? "" : "s"} held, ${share}% of answers` });
  }

  const count = (kind: string) => rows.filter((r) => r.kind === kind).length;
  console.log(`${rows.length} districts looked up.`);
  console.log(`  matched to a zone we hold a report for: ${count("matched")}`);
  console.log(`  named zone has no report yet:           ${count("zone-missing")}`);
  console.log(`  Thames names no zone (not theirs):      ${count("not-thames")}  ${rows.filter((r) => r.kind === "not-thames").map((r) => r.district).join(" ")}`);
  console.log(`  short postcodes, lookup cannot answer:  ${count("short")}  ${rows.filter((r) => r.kind === "short").map((r) => r.district).join(" ")}`);
  console.log(`\nZone reports to fetch (${missing.size}): ${[...missing].sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c}×${n}`).join(" ")}`);
  if (process.argv.includes("--all")) {
    console.log("");
    for (const r of rows) console.log(`${r.district.padEnd(6)} ${r.kind.padEnd(13)} ${r.zone.padEnd(8)} ${String(r.hardness ?? "").padStart(4)}  ${r.note}`);
  }
}

main();
