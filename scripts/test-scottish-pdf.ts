/**
 * Test parsing a Scottish Water zone PDF to understand the format.
 */
import { PDFParse } from "pdf-parse";
import { readFileSync } from "fs";

async function main() {
  const buffer = readFileSync("data/scottish-water/test-mannofield-north.pdf");
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  const text = result.text;
  await parser.destroy();

  console.log("=== RAW TEXT ===");
  console.log(text);
  console.log("\n=== LINES ===");
  const lines = text.split("\n");
  lines.forEach((line, i) => {
    console.log(`[${i}] "${line}"`);
  });
}

main().catch(console.error);
