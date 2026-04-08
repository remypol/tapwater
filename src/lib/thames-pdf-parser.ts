/**
 * Thames Water Zone PDF Parser (Node.js)
 *
 * Parses Thames Water zone PDFs using pdf-parse v2 to extract zone metadata
 * and parameter tables. Replaces the Python pdfplumber-based parser in
 * scripts/fetch-thames-water.py.
 *
 * PDF text layout (tab-separated):
 *   Header: "Water Supply Zone: NNNN \t ZONE_NAME \t Population: N,NNN"
 *   Table rows: "Param \t Unit \t Limit \t Min \t Mean \t Max \t Total \t Contrav \t %"
 *   Page break: "Thames Water Utilities Limited\nWater Quality Report..."
 *   After break: header line repeats, then another "Parameter \t Units..." header
 */

import { PDFParse } from "pdf-parse";

export interface ZoneParameter {
  parameter: string;
  unit: string;
  regulatory_limit: string | null;
  min: { value: number; below_limit: boolean } | null;
  mean: { value: number; below_limit: boolean } | null;
  max: { value: number; below_limit: boolean } | null;
  total_samples: number | null;
  contraventions: number;
}

export interface ParsedZone {
  mapCode: string;
  zone_code?: string;
  zone_name?: string;
  population?: number;
  parameters: ZoneParameter[];
  source: "thames_water_zone_report";
  year: number;
}

/**
 * Parse a numeric cell value. Returns null for empty/dash/n/a.
 * Handles: "<0.01" (below detection), ">300" (above detection), plain numbers.
 */
function parseNum(s: string): { value: number; below_limit: boolean } | null {
  if (!s || s === "-" || s.toLowerCase() === "n/a" || s === "") return null;
  s = s.replace(/,/g, "").trim();
  const belowLimit = s.startsWith("<");
  // Strip leading < or >
  const clean = s.replace(/^[<>]/, "");
  const n = parseFloat(clean);
  if (isNaN(n)) return null;
  return { value: n, below_limit: belowLimit };
}

/**
 * Parse a Thames Water zone PDF buffer.
 * Returns a ParsedZone object, or null on failure.
 */
export async function parseThamesZonePdf(
  buffer: Buffer,
  mapCode: string,
): Promise<ParsedZone | null> {
  let parser: InstanceType<typeof PDFParse> | null = null;
  try {
    parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    const text = result.text;

    // ── Extract zone metadata ──────────────────────────────────────────────
    // Format: "Water Supply Zone: 0058 \t PARLIAMENT \t Population: 55,282"
    let zone_code: string | undefined;
    let zone_name: string | undefined;
    let population: number | undefined;

    const zoneHeaderMatch = text.match(
      /Water Supply Zone:\s*(\d+)\s*\t\s*([^\t\n]+?)\s*\t\s*Population:\s*([\d,]+)/,
    );
    if (zoneHeaderMatch) {
      zone_code = zoneHeaderMatch[1];
      zone_name = zoneHeaderMatch[2].trim();
      population = parseInt(zoneHeaderMatch[3].replace(/,/g, ""), 10);
    }

    // ── Parse parameter table ──────────────────────────────────────────────
    // Split into lines; find lines after "Parameter \tUnits" header,
    // stop at "Key to table" or "Notes:" section.
    const lines = text.split("\n");
    const parameters: ZoneParameter[] = [];

    let inTable = false;
    for (const rawLine of lines) {
      const line = rawLine.trim();

      // Start of table — the column header line
      if (/^Parameter\s*\tUnits/.test(line)) {
        inTable = true;
        continue;
      }

      // End of table — glossary or key section begins
      if (inTable && /^Key to (table|the results)/.test(line)) {
        break;
      }

      if (!inTable) continue;

      // Skip blank lines, page footers, and repeated headers
      if (
        !line ||
        line.startsWith("Thames Water Utilities") ||
        line.startsWith("Water Quality Report") ||
        line.startsWith("© 20") ||
        line.startsWith("Clearwater Court") ||
        line.startsWith("Page ") ||
        line.startsWith("-- ") ||
        line.startsWith("Water Supply Zone:") ||
        line.startsWith("Time Period:") ||
        /^Concentration or Value/.test(line)
      ) {
        continue;
      }

      // Split row on tabs
      const cols = line.split("\t").map((c) => c.trim());
      if (cols.length < 7) continue;

      const paramName = cols[0];
      // Skip if first col looks like a header word
      if (
        !paramName ||
        paramName.toLowerCase() === "parameter" ||
        paramName.startsWith("No. of Samples") ||
        paramName.startsWith("% of Samples")
      ) {
        continue;
      }

      const unit = cols[1] ?? "";
      const regLimitRaw = cols[2] ?? "";
      const minRaw = cols[3] ?? "";
      const meanRaw = cols[4] ?? "";
      const maxRaw = cols[5] ?? "";
      const totalRaw = cols[6] ?? "";
      const contraventionsRaw = cols[7] ?? "";

      const regLimit =
        regLimitRaw && regLimitRaw !== "-" ? regLimitRaw : null;
      const minVal = parseNum(minRaw);
      const meanVal = parseNum(meanRaw);
      const maxVal = parseNum(maxRaw);
      const totalSamples = /^\d+$/.test(totalRaw)
        ? parseInt(totalRaw, 10)
        : null;
      const contraventions = /^\d+$/.test(contraventionsRaw)
        ? parseInt(contraventionsRaw, 10)
        : 0;

      // Only include if there's at least some measurement data
      if (meanVal === null && maxVal === null) continue;

      parameters.push({
        parameter: paramName,
        unit,
        regulatory_limit: regLimit,
        min: minVal,
        mean: meanVal,
        max: maxVal,
        total_samples: totalSamples,
        contraventions,
      });
    }

    if (parameters.length === 0) {
      console.warn(`[thames-pdf-parser] No parameters found for ${mapCode}`);
      return null;
    }

    // Detect year from "Time Period: 1 Jan YYYY to 31 Dec YYYY"
    const yearMatch = text.match(/Time Period:.*?(\d{4})/);
    const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear() - 1;

    return {
      mapCode,
      zone_code,
      zone_name,
      population,
      parameters,
      source: "thames_water_zone_report",
      year,
    };
  } catch (err) {
    console.error(`[thames-pdf-parser] Error parsing ${mapCode}:`, err);
    return null;
  } finally {
    if (parser) {
      await parser.destroy().catch(() => {});
    }
  }
}
