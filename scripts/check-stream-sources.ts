/**
 * Compare the Stream portal's published water quality services with what
 * stream-sources.ts knows about. Run monthly, or when a supplier's newest sample
 * date on the site looks old. Prints any service the config does not list.
 *
 *   npx tsx scripts/check-stream-sources.ts
 */
import { getAllStreamSupplierIds, getStreamSource } from "../src/lib/stream-sources";

const ORGS = new Set<string>();
const known = new Set<string>();
for (const id of getAllStreamSupplierIds()) {
  const src = getStreamSource(id);
  if (!src) continue;
  ORGS.add(src.orgId);
  for (const s of src.services) known.add(s.serviceName);
}

async function main() {
  let unknown = 0;
  for (const org of ORGS) {
    const res = await fetch(`https://services-eu1.arcgis.com/${org}/ArcGIS/rest/services?f=json`);
    const json = (await res.json()) as { services?: { name: string; type: string }[] };
    const names = (json.services ?? [])
      .filter((s) => s.type === "FeatureServer")
      .map((s) => s.name)
      .filter((n) => /water.?quality|drinking|domestic_water/i.test(n) && !/consumption/i.test(n));
    for (const n of names.sort()) {
      if (!known.has(n)) {
        unknown++;
        console.log(`NOT IN CONFIG  ${n}`);
      }
    }
  }
  console.log(unknown ? `\n${unknown} service(s) the config does not use. Probe them and add the newest per supplier.` : "Config covers every published water quality service.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
