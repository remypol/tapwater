/**
 * Check that every company's published samples are read in the right units.
 *
 * For each company's newest dataset, ask the portal for the average and highest
 * result per substance and unit, then score the average the way a page would.
 * No company's average lead, iron or nitrite is over the legal limit, so a
 * substance that "fails" on its company-wide average is being misread: a unit we
 * do not recognise, or a row whose name means something else.
 *
 * Found on 17 November 2026, the first time SES Water's data was loaded: its
 * unit column says "�g/L" where it means µg/L, so iron at 6 µg/L was read
 * as 6 mg/L and eleven districts scored 2 out of 10.
 *
 *   npx tsx scripts/audit-stream-units.ts            # every company
 *   npx tsx scripts/audit-stream-units.ts ses-water  # one
 *
 * Run it whenever a company is added to stream-sources.ts or changes dataset.
 * Exit code 1 when anything is flagged.
 */
import { getAllStreamSupplierIds, getStreamSource } from "../src/lib/stream-sources";
import { normalizeStreamRecord } from "../src/lib/stream-api";
import { computeScore } from "../src/lib/scoring";

const BASE = "https://services-eu1.arcgis.com";

interface Row { determinand: string; unit: string; n: number; avg: number; max: number }

async function stats(orgId: string, service: string, fields: { det: string; unit: string; result: string }): Promise<Row[] | null> {
  const params = new URLSearchParams({
    where: "1=1",
    groupByFieldsForStatistics: `${fields.det},${fields.unit}`,
    outStatistics: JSON.stringify([
      { statisticType: "count", onStatisticField: fields.result, outStatisticFieldName: "n" },
      { statisticType: "avg", onStatisticField: fields.result, outStatisticFieldName: "avg" },
      { statisticType: "max", onStatisticField: fields.result, outStatisticFieldName: "max" },
    ]),
    f: "json",
  });
  const res = await fetch(`${BASE}/${orgId}/ArcGIS/rest/services/${service.replace(/ /g, "%20")}/FeatureServer/0/query?${params}`, { signal: AbortSignal.timeout(120_000) });
  if (!res.ok) return null;
  const json = (await res.json()) as { error?: unknown; features?: { attributes: Record<string, unknown> }[] };
  if (json.error || !json.features) return null;
  return json.features.map((f) => ({
    determinand: String(f.attributes[fields.det] ?? ""),
    unit: String(f.attributes[fields.unit] ?? ""),
    n: Number(f.attributes.n ?? 0),
    avg: Number(f.attributes.avg ?? 0),
    max: Number(f.attributes.max ?? 0),
  }));
}

/**
 * For datasets that store the result as text, where the portal cannot average:
 * list the substance and unit pairs, then average up to 200 samples of each here.
 */
async function sampledStats(orgId: string, service: string): Promise<Row[] | null> {
  const url = `${BASE}/${orgId}/ArcGIS/rest/services/${service.replace(/ /g, "%20")}/FeatureServer/0/query`;
  const pairsRes = await fetch(`${url}?${new URLSearchParams({ where: "1=1", outFields: "Determinand,Units", returnDistinctValues: "true", returnGeometry: "false", f: "json" })}`, { signal: AbortSignal.timeout(120_000) });
  if (!pairsRes.ok) return null;
  const pairs = ((await pairsRes.json()) as { features?: { attributes: { Determinand?: string; Units?: string | null } }[] }).features;
  if (!pairs) return null;
  const rows: Row[] = [];
  for (const { attributes } of pairs) {
    const det = attributes.Determinand ?? "";
    if (!det) continue;
    const unit = attributes.Units;
    const where = `Determinand='${det.replace(/'/g, "''")}' AND ${unit == null ? "Units IS NULL" : `Units='${unit.replace(/'/g, "''")}'`}`;
    const res = await fetch(`${url}?${new URLSearchParams({ where, outFields: "Result", resultRecordCount: "200", returnGeometry: "false", f: "json" })}`, { signal: AbortSignal.timeout(60_000) });
    if (!res.ok) continue;
    const values = (((await res.json()) as { features?: { attributes: { Result?: unknown } }[] }).features ?? [])
      .map((f) => Number(f.attributes.Result))
      .filter((v) => Number.isFinite(v));
    if (values.length === 0) continue;
    rows.push({ determinand: det, unit: unit ?? "", n: values.length, avg: values.reduce((a, b) => a + b, 0) / values.length, max: Math.max(...values) });
    await new Promise((r) => setTimeout(r, 100));
  }
  return rows;
}

async function main() {
  const wanted = process.argv.slice(2);
  const ids = wanted.length ? wanted : getAllStreamSupplierIds();
  let problems = 0;
  for (const id of ids) {
    const source = getStreamSource(id);
    if (!source) {
      console.log(`${id}: not a company with published samples`);
      continue;
    }
    const service = [...source.services].sort((a, b) => b.year - a.year)[0];
    const rows =
      (await stats(source.orgId, service.serviceName, { det: "DETERMINAND", unit: "UNITS", result: "RESULT" })) ??
      (await stats(source.orgId, service.serviceName, { det: "Determinand", unit: "Units", result: "Result" })) ??
      (await stats(source.orgId, service.serviceName, { det: "DETERMINAND", unit: "Units", result: "Result" })) ??
      (await sampledStats(source.orgId, service.serviceName));
    if (!rows) {
      console.log(`\n${id}: could not read statistics for ${service.serviceName}`);
      problems++;
      continue;
    }
    const flagged: string[] = [];
    const notes: string[] = [];
    let scored = 0;
    for (const row of rows) {
      if (!row.determinand || row.n < 20) continue;
      if (source.skipDeterminands?.includes(row.determinand)) continue;
      // Through the same door a real sample comes in by, so unit repairs apply.
      const rec = normalizeStreamRecord({ DETERMINAND: row.determinand, UNITS: row.unit, RESULT: row.avg, SAMPLE_DATE: 0 }, "upper", "epoch", source.unitFallback);
      const score = computeScore([{ determinand: rec.determinand, value: rec.value, unit: rec.unit, date: "2025-01-01" }]);
      const reading = score.readings[0];
      if (!reading) continue;
      scored++;
      // Bacteria have a limit of zero, so any average above zero "fails"; that is real, not a unit problem.
      // A warning (over three quarters of a limit) can be real too: Cambridge's nitrate averages 41 mg/L against 50.
      if (reading.status === "warning") notes.push(`  note: ${row.determinand} [${row.unit}] averages ${Number(row.avg.toPrecision(4))}, close to its limit (${row.n} samples)`);
      if (reading.status === "fail" && !/coli|enterococ|clostrid/i.test(row.determinand)) {
        flagged.push(`  ${row.determinand} [${row.unit || "no unit"}]: average ${Number(row.avg.toPrecision(4))} read as ${reading.value} ${reading.unit}, ${reading.status} (${row.n} samples, highest ${row.max})`);
      }
    }
    console.log(`\n${id}: ${service.serviceName}, ${rows.length} substance and unit pairs, ${scored} scored`);
    if (notes.length) console.log(notes.join("\n"));
    if (flagged.length) {
      problems += flagged.length;
      console.log(flagged.join("\n"));
    } else {
      console.log("  nothing fails on its average");
    }
  }
  if (problems) {
    console.log(`\n${problems} to look at. A company-wide average over a legal limit is a reading problem until shown otherwise.`);
    process.exit(1);
  }
  console.log("\nEvery company's averages are within the limits.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
