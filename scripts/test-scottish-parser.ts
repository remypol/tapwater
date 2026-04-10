/**
 * Test the Scottish Water PDF parser against a real zone PDF.
 */
import { readFileSync } from "fs";
import { parseScottishZonePdf } from "../src/lib/scottish-pdf-parser";

async function main() {
  const buffer = readFileSync("data/scottish-water/test-mannofield-north.pdf");
  const result = await parseScottishZonePdf(buffer, "mannofield-north");

  if (!result) {
    console.error("Parse returned null!");
    process.exit(1);
  }

  console.log(`Zone: ${result.zone_name}`);
  console.log(`Slug: ${result.zone_slug}`);
  console.log(`Year: ${result.year}`);
  console.log(`Date range: ${result.date_from} to ${result.date_to}`);
  console.log(`Parameters: ${result.parameters.length}`);
  console.log("");

  for (const p of result.parameters) {
    console.log(
      `  ${p.parameter.padEnd(40)} | ${String(p.total_samples).padStart(4)} samples | ` +
      `PCV: ${(p.regulatory_limit ?? "-").padStart(6)} | ` +
      `Unit: ${p.unit.padEnd(12)} | ` +
      `Min: ${p.min ? (p.min.below_limit ? "<" : "") + p.min.value : "-"} | ` +
      `Mean: ${p.mean ? (p.mean.below_limit ? "<" : "") + p.mean.value : "-"} | ` +
      `Max: ${p.max ? (p.max.below_limit ? "<" : "") + p.max.value : "-"}`
    );
  }
}

main().catch(console.error);
