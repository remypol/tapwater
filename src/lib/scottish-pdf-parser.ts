/**
 * Scottish Water Zone PDF Parser
 *
 * Parses Scottish Water zone PDFs using pdf-parse v2 to extract
 * water quality parameters. Scottish Water PDFs have multi-line
 * parameter names which makes line-by-line parsing tricky.
 *
 * Strategy: Reconstruct the table by identifying data lines
 * (lines starting with a number that match a data pattern)
 * and treating all preceding non-data lines as the parameter name.
 */

import { PDFParse } from "pdf-parse";

export interface ScottishZoneParameter {
  parameter: string;
  unit: string;
  regulatory_limit: string | null;
  min: { value: number; below_limit: boolean } | null;
  mean: { value: number; below_limit: boolean } | null;
  max: { value: number; below_limit: boolean } | null;
  total_samples: number | null;
  fail_percent: number;
}

export interface ParsedScottishZone {
  zone_name: string;
  zone_slug: string;
  parameters: ScottishZoneParameter[];
  source: "scottish_water_zone_report";
  year: number;
  date_from: string;
  date_to: string;
}

function parseNum(s: string): { value: number; below_limit: boolean } | null {
  if (!s || s === "-" || s.toLowerCase() === "n/a" || s === "") return null;
  s = s.replace(/,/g, "").trim();
  const belowLimit = s.startsWith("<");
  const clean = s.replace(/^[<>]\s*/, "");
  const n = parseFloat(clean);
  if (isNaN(n)) return null;
  return { value: n, below_limit: belowLimit };
}

/**
 * Check if a line is a "data line" — starts with a number (numResults)
 * and has the pattern: numResults PCV unit failPct min mean max
 *
 * These lines appear when a multi-line parameter name has the data on
 * a continuation line, e.g.:
 *   "Coliform"
 *   "Bacteria"
 *   "(Total"
 *   "coliforms)"
 *   "120 0 CFU/100ml 0 0 0 0"
 */
function parseDataOnlyLine(line: string): {
  numResults: number;
  pcv: string | null;
  unit: string;
  failPct: number;
  min: string;
  mean: string;
  max: string;
} | null {
  const trimmed = line.trim();
  // Must start with a number
  if (!/^\d/.test(trimmed)) return null;

  // Try two patterns:
  // 1. WITH PCV: numResults PCV unit failPct min mean max
  //    e.g. "120 0 CFU/100ml 0 0 0 0"
  // 2. WITHOUT PCV: numResults unit failPct min mean max
  //    e.g. "119 CFU/ml 0 0 5.44 300"

  // Pattern 1: with PCV (PCV is a numeric value)
  const withPcv = trimmed.match(
    /^(\d+)\s+([\d.]+)\s+(\S+(?:\s+\S+)*?)\s+([\d.]+)\s+((?:<\s*)?[\d.]+)\s+((?:<\s*)?[\d.]+)\s+((?:<\s*)?[\d.]+)$/,
  );
  if (withPcv) {
    const [, numStr, pcvStr, unit, failStr, minStr, meanStr, maxStr] = withPcv;
    const numResults = parseInt(numStr, 10);
    if (!isNaN(numResults)) {
      return {
        numResults,
        pcv: pcvStr !== "0" ? pcvStr : null,
        unit: unit.trim(),
        failPct: parseFloat(failStr) || 0,
        min: minStr,
        mean: meanStr,
        max: maxStr,
      };
    }
  }

  // Pattern 2: without PCV (unit starts immediately after numResults)
  const noPcv = trimmed.match(
    /^(\d+)\s+(\S+(?:\s+\S+)*?)\s+([\d.]+)\s+((?:<\s*)?[\d.]+)\s+((?:<\s*)?[\d.]+)\s+((?:<\s*)?[\d.]+)$/,
  );
  if (noPcv) {
    const [, numStr, unit, failStr, minStr, meanStr, maxStr] = noPcv;
    const numResults = parseInt(numStr, 10);
    if (!isNaN(numResults)) {
      return {
        numResults,
        pcv: null,
        unit: unit.trim(),
        failPct: parseFloat(failStr) || 0,
        min: minStr,
        mean: meanStr,
        max: maxStr,
      };
    }
  }

  return null;
}

/**
 * Try to parse a full data line where param name is on the same line.
 * "Colour 31 20 mg/l Pt/Co 0 < 2 < 2 < 2"
 */
function parseFullLine(line: string): {
  paramName: string;
  numResults: number;
  pcv: string | null;
  unit: string;
  failPct: number;
  min: string;
  mean: string;
  max: string;
} | null {
  const trimmed = line.trim();
  if (!trimmed || /^\d/.test(trimmed)) return null;

  // Try multiple regex patterns since the column layout varies:
  //
  // Pattern A (with PCV): ParamName numResults PCV unit failPct min mean max
  //   e.g. "Colour 31 20 mg/l Pt/Co 0 < 2 < 2 < 2"
  //   e.g. "ion (pH) 31 9.5 pH units 0 7.30 7.61 7.90"
  //
  // Pattern B (no PCV): ParamName numResults unit failPct min mean max
  //   e.g. "number 0 0 0 0"  (Odour continuation: unit=Dilution is on prev line)

  // Pattern A: with PCV
  const withPcv = trimmed.match(
    /^(.+?)\s+(\d+)\s+([\d.]+)\s+(\S+(?:\s+\S+)*?)\s+([\d.]+)\s+((?:<\s*)?[\d.]+)\s+((?:<\s*)?[\d.]+)\s+((?:<\s*)?[\d.]+)$/,
  );

  if (withPcv) {
    const [, paramName, numStr, pcvStr, unit, failStr, minStr, meanStr, maxStr] = withPcv;
    const numResults = parseInt(numStr, 10);
    if (!isNaN(numResults)) {
      if (/^(Page|Parameter|Name|Results|Measure|Failing|PCV|Min)/.test(paramName)) return null;
      return {
        paramName: paramName.trim(),
        numResults,
        pcv: pcvStr !== "0" ? pcvStr : null,
        unit: unit.trim(),
        failPct: parseFloat(failStr) || 0,
        min: minStr,
        mean: meanStr,
        max: maxStr,
      };
    }
  }

  // Pattern B: without PCV (param continuation + unit + data)
  const noPcv = trimmed.match(
    /^(.+?)\s+(\d+)\s+(\S+(?:\s+\S+)*?)\s+([\d.]+)\s+((?:<\s*)?[\d.]+)\s+((?:<\s*)?[\d.]+)\s+((?:<\s*)?[\d.]+)$/,
  );

  if (noPcv) {
    const [, paramName, numStr, unit, failStr, minStr, meanStr, maxStr] = noPcv;
    const numResults = parseInt(numStr, 10);
    if (!isNaN(numResults)) {
      if (/^(Page|Parameter|Name|Results|Measure|Failing|PCV|Min)/.test(paramName)) return null;
      return {
        paramName: paramName.trim(),
        numResults,
        pcv: null,
        unit: unit.trim(),
        failPct: parseFloat(failStr) || 0,
        min: minStr,
        mean: meanStr,
        max: maxStr,
      };
    }
  }

  return null;
}

const SKIP_LINES = new Set([
  "Scottish Water",
  "Water Register",
]);

function isHeaderLine(line: string): boolean {
  const trimmed = line.trim();
  return (
    SKIP_LINES.has(trimmed) ||
    trimmed.startsWith("Date range of sample:") ||
    trimmed.startsWith("Regulation Zone") ||
    /^Page \d/.test(trimmed) ||
    trimmed === "Parameter" ||
    trimmed === "Name No. of" ||
    trimmed === "Results PCV Units of" ||
    trimmed === "Measure Results" ||
    trimmed === "Failing" ||
    trimmed === "PCV (%)" ||
    trimmed === "Min Mean Max" ||
    /^--\s*\d+\s*of\s*\d+\s*--$/.test(trimmed)
  );
}

/**
 * Parse a Scottish Water zone PDF buffer.
 */
export async function parseScottishZonePdf(
  buffer: Buffer,
  zoneSlug: string,
): Promise<ParsedScottishZone | null> {
  let parser: InstanceType<typeof PDFParse> | null = null;
  try {
    parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    const text = result.text;

    // Extract zone name
    const zoneMatch = text.match(/Regulation Zone\s*=\s*(.+)/);
    const zoneName = zoneMatch ? zoneMatch[1].trim() : zoneSlug;

    // Extract date range
    const dateMatch = text.match(
      /Date range of sample:\s*(\d{2}\/\d{2}\/\d{4})\s*to\s*(\d{2}\/\d{2}\/\d{4})/,
    );
    let dateFrom = "";
    let dateTo = "";
    let year = new Date().getFullYear() - 1;

    if (dateMatch) {
      const [, from, to] = dateMatch;
      const [fd, fm, fy] = from.split("/");
      const [td, tm, ty] = to.split("/");
      dateFrom = `${fy}-${fm}-${fd}`;
      dateTo = `${ty}-${tm}-${td}`;
      year = parseInt(ty, 10);
    }

    const lines = text.split("\n");
    const parameters: ScottishZoneParameter[] = [];

    let inTable = false;
    let pendingNameParts: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip empty lines
      if (!trimmed) continue;

      // Detect table start
      if (trimmed === "Min Mean Max") {
        inTable = true;
        pendingNameParts = [];
        continue;
      }

      if (!inTable) continue;

      // Skip header/footer lines (they repeat on each page)
      if (isHeaderLine(trimmed)) {
        // If we hit a page break pattern, we'll pick up again after "Min Mean Max"
        if (/^--\s*\d+\s*of\s*\d+\s*--$/.test(trimmed) || trimmed === "Scottish Water") {
          inTable = false; // Will re-enter after next "Min Mean Max"
          pendingNameParts = [];
        }
        continue;
      }

      // Try to parse as a full data line (param name + data on same line)
      const fullParsed = parseFullLine(trimmed);
      if (fullParsed) {
        let paramName = fullParsed.paramName;
        if (pendingNameParts.length > 0) {
          paramName = [...pendingNameParts, paramName].join(" ");
          pendingNameParts = [];
        }

        parameters.push({
          parameter: cleanParameterName(paramName),
          unit: fullParsed.unit,
          regulatory_limit: fullParsed.pcv,
          min: parseNum(fullParsed.min),
          mean: parseNum(fullParsed.mean),
          max: parseNum(fullParsed.max),
          total_samples: fullParsed.numResults,
          fail_percent: fullParsed.failPct,
        });
        continue;
      }

      // Try to parse as a data-only line (no param name, just numbers)
      const dataOnly = parseDataOnlyLine(trimmed);
      if (dataOnly) {
        const paramName = pendingNameParts.join(" ");
        pendingNameParts = [];

        if (paramName) {
          parameters.push({
            parameter: cleanParameterName(paramName),
            unit: dataOnly.unit,
            regulatory_limit: dataOnly.pcv,
            min: parseNum(dataOnly.min),
            mean: parseNum(dataOnly.mean),
            max: parseNum(dataOnly.max),
            total_samples: dataOnly.numResults,
            fail_percent: dataOnly.failPct,
          });
        }
        continue;
      }

      // Otherwise, accumulate as part of a multi-line parameter name
      pendingNameParts.push(trimmed);
    }

    if (parameters.length === 0) {
      console.warn(`[scottish-pdf-parser] No parameters found for ${zoneSlug}`);
      return null;
    }

    return {
      zone_name: zoneName,
      zone_slug: zoneSlug,
      parameters,
      source: "scottish_water_zone_report",
      year,
      date_from: dateFrom,
      date_to: dateTo,
    };
  } catch (err) {
    console.error(`[scottish-pdf-parser] Error parsing ${zoneSlug}:`, err);
    return null;
  } finally {
    if (parser) {
      await parser.destroy().catch(() => {});
    }
  }
}

/** Normalise common parameter name variations from PDF extraction */
function cleanParameterName(name: string): string {
  return name
    .replace(/\s+/g, " ")
    .replace(/ø/g, "°")
    .replace(/^Hydrogen ion \(pH\)$/i, "Hydrogen Ion (pH)")
    .replace(/^Ammonium \(total\)$/i, "Ammonium (Total)")
    .replace(/^Coliform Bacteria \(Total coliforms\)$/i, "Coliform Bacteria")
    .replace(/^E\. coli \(Faecal coliforms\)$/i, "E. coli")
    .replace(/^Enterococci \(Faecal streptococci\s*\)$/i, "Enterococci")
    .replace(/^Clostridium perfringens \(Sulphite Reducing Clostridia\)$/i, "Clostridium Perfringens")
    .replace(/^Colony Counts After 3 Days At 22.c$/i, "Colony Counts (22°C)")
    .replace(/^Residual Disinfectant - Free$/i, "Free Chlorine")
    .replace(/^Residual Disinfectant - Total$/i, "Total Chlorine")
    .replace(/^PAH - Sum Of 4 Substances$/i, "PAH (Sum of 4)")
    .replace(/^Tetrachloro methane$/i, "Tetrachloromethane")
    .replace(/^Tetrachloroethene\/Trichloroethene.*$/i, "Tetrachloroethene/Trichloroethene")
    .replace(/^Total Trihalomethanes$/i, "Total Trihalomethanes")
    .replace(/^1_2 Dichloroethane$/i, "1,2-Dichloroethane")
    .replace(/^Pesticides - Total Substances$/i, "Pesticides (Total)")
    .replace(/^Benzo 3_4 Pyrene$/i, "Benzo(a)pyrene")
    .replace(/^Gross Alpha Activity$/i, "Gross Alpha")
    .replace(/^Gross Beta Activity$/i, "Gross Beta")
    .replace(/^Nitrite\/Nitrat e formula$/i, "Nitrite/Nitrate Formula")
    .replace(/^Total organic carbon$/i, "Total Organic Carbon")
    .replace(/^HAA5 Total$/i, "HAA5 (Total)")
    .replace(/^BISPHENOL A$/i, "Bisphenol A")
    .replace(/^BISPHENO L A$/i, "Bisphenol A")
    .replace(/^Microcystin LR$/i, "Microcystin-LR")
    .replace(/^Tetrachloro ethene\/Tric hloroethene - Sum Of 2 Substances$/i, "Tetrachloroethene/Trichloroethene")
    .replace(/^Total Trihalometh anes$/i, "Total Trihalomethanes")
    .replace(/^1_2 Dichloroeth ane$/i, "1,2-Dichloroethane")
    .trim();
}
