/**
 * Extract Scottish Water zone names from the hardness PDF.
 *
 * Usage: npx tsx scripts/extract-scottish-zones.ts
 */

import { PDFParse } from "pdf-parse";
import { readFileSync, writeFileSync } from "fs";

async function main() {
  const buffer = readFileSync("data/scottish-water/hardness.pdf");
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  const text = result.text;
  await parser.destroy();

  const lines = text.split("\n");
  const zones: string[] = [];

  // Skip header line ("Regulatory supply zone name Calcium...")
  // Each data line: "ZoneName \t number \t number \t ..."
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Skip header/footer lines
    if (trimmed.startsWith("Regulatory supply zone name")) continue;
    if (trimmed.startsWith("#SW")) continue;
    if (trimmed.startsWith("-- ")) continue;

    // Split on tab - first column is zone name
    const cols = trimmed.split("\t");
    if (cols.length < 3) continue;

    const zoneName = cols[0].trim();
    // Validate: second column should be a number (calcium)
    const calcium = parseFloat(cols[1]);
    if (isNaN(calcium)) continue;

    zones.push(zoneName);
  }

  console.log(`Extracted ${zones.length} zone names`);

  // Write zone list
  writeFileSync(
    "data/scottish-water/zones.json",
    JSON.stringify(zones, null, 2),
  );

  // Also create slug mapping
  const slugMap: Record<string, string> = {};
  for (const zone of zones) {
    const slug = zone.toLowerCase().replace(/\s+/g, "-");
    slugMap[zone] = slug;
  }
  writeFileSync(
    "data/scottish-water/zone-slugs.json",
    JSON.stringify(slugMap, null, 2),
  );

  console.log("Written to data/scottish-water/zones.json");
  console.log("Written to data/scottish-water/zone-slugs.json");

  // Print first 10 and last 10 for verification
  console.log("\nFirst 10:");
  zones.slice(0, 10).forEach((z) => console.log(`  ${z}`));
  console.log("\nLast 10:");
  zones.slice(-10).forEach((z) => console.log(`  ${z}`));
}

main().catch(console.error);
