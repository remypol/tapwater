/**
 * Stream Water Data Portal — ArcGIS REST API client
 *
 * Fetches real tap water quality data from water company datasets.
 * Handles schema differences between companies (field casing, date formats).
 * No authentication required.
 */

import type { StreamSource } from "./stream-sources";

const ARCGIS_BASE = "https://services-eu1.arcgis.com";
const PAGE_SIZE = 2000;

// ── Normalized record type ──

export interface StreamRecord {
  sampleId: string;
  sampleDate: string;   // ISO date: "2025-03-29"
  determinand: string;
  dwiCode: string;
  unit: string;
  belowDetectionLimit: boolean;
  value: number;
  lsoa: string;
}

// ── Date parsing ──

export function parseStreamDate(
  raw: number | string | null,
  format: "epoch" | "string",
): string {
  if (raw === null || raw === undefined) return "";

  if (format === "epoch" && typeof raw === "number") {
    return new Date(raw).toISOString().split("T")[0];
  }

  if (format === "string" && typeof raw === "string") {
    const datePart = raw.split(" ")[0];

    // Format A: slash-separated dates
    // Severn Trent: "1/2/2024 12:00:00 AM" → M/D/YYYY
    // Welsh Water: "05/04/2024 11:12" → DD/MM/YYYY
    // Detect by checking if first number > 12 (must be day, not month)
    if (datePart.includes("/")) {
      const parts = datePart.split("/");
      if (parts.length !== 3) return "";
      const first = parseInt(parts[0], 10);
      if (first > 12) {
        // DD/MM/YYYY — European format
        const [day, month, year] = parts;
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
      // M/D/YYYY — American format (or ambiguous, default to M/D)
      const [month, day, year] = parts;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    // Format B: "2024-20-12" → YYYY-DD-MM (Welsh Water)
    // Detect by checking if middle value > 12 (must be day, not month)
    if (datePart.includes("-")) {
      const parts = datePart.split("-");
      if (parts.length !== 3) return "";
      const [year, second, third] = parts;
      if (parseInt(second, 10) > 12) {
        // YYYY-DD-MM → swap to YYYY-MM-DD
        return `${year}-${third.padStart(2, "0")}-${second.padStart(2, "0")}`;
      }
      // Already YYYY-MM-DD
      return `${year}-${second.padStart(2, "0")}-${third.padStart(2, "0")}`;
    }

    return "";
  }

  // Fallback: try epoch even if format says string
  if (typeof raw === "number") {
    return new Date(raw).toISOString().split("T")[0];
  }

  return "";
}

// ── Record normalization ──

function getField(attrs: Record<string, unknown>, _fieldCase: "upper" | "camel", upperName: string, camelName: string): unknown {
  // Try both casings — some companies have mixed casing (e.g., South West Water: DETERMINAND + Sample_Date)
  return attrs[upperName] ?? attrs[camelName];
}

export function normalizeStreamRecord(
  attrs: Record<string, unknown>,
  fieldCase: "upper" | "camel",
  dateFormat: "epoch" | "string",
): StreamRecord {
  const rawDate = getField(attrs, fieldCase, "SAMPLE_DATE", "Sample_Date");
  const rawOperator = getField(attrs, fieldCase, "OPERATOR", "Operator");
  const rawUnit = String(getField(attrs, fieldCase, "UNITS", "Units") ?? "");

  return {
    sampleId: String(getField(attrs, fieldCase, "SAMPLE_ID", "Sample_Id") ?? ""),
    sampleDate: parseStreamDate(rawDate as number | string | null, dateFormat),
    determinand: String(getField(attrs, fieldCase, "DETERMINAND", "Determinand") ?? ""),
    dwiCode: String(getField(attrs, fieldCase, "DWI_CODE", "DWI_Code") ?? ""),
    unit: rawUnit.replace("\u03bc", "\u00b5"),  // normalize greek mu to micro sign
    belowDetectionLimit: rawOperator === "<",
    value: Number(getField(attrs, fieldCase, "RESULT", "Result") ?? 0),
    lsoa: String(attrs.LSOA ?? attrs.LSOA_Name ?? attrs.LSOA21CD ?? attrs.lsoa21cd ?? attrs.lsoa ?? ""),
  };
}

// ── ArcGIS REST query ──

export async function queryStreamService(
  source: StreamSource,
  serviceName: string,
  lsoaCodes: string[],
): Promise<StreamRecord[]> {
  if (lsoaCodes.length === 0) return [];

  // Don't over-encode: ArcGIS REST paths need spaces encoded but parentheses left as-is
  const encodedName = serviceName.replace(/ /g, "%20");
  const baseUrl = `${ARCGIS_BASE}/${source.orgId}/ArcGIS/rest/services/${encodedName}/FeatureServer/0/query`;
  const lsoaList = lsoaCodes.map((c) => `'${c.replace(/'/g, "")}'`).join(",");
  const where = `${source.geoField} IN (${lsoaList})`;

  const allRecords: StreamRecord[] = [];
  let offset = 0;
  const MAX_PAGES = 50;
  let hasMore = true;
  let page = 0;

  while (hasMore && page < MAX_PAGES) {
    page++;
    const params = new URLSearchParams({
      where,
      outFields: "*",
      f: "json",
      resultRecordCount: String(PAGE_SIZE),
      resultOffset: String(offset),
    });

    try {
      const res = await fetch(`${baseUrl}?${params}`);
      if (!res.ok) {
        console.error(`[stream-api] HTTP ${res.status} for ${serviceName}`);
        break;
      }

      const json = await res.json() as {
        features?: { attributes: Record<string, unknown> }[];
        exceededTransferLimit?: boolean;
      };

      const features = json.features ?? [];
      for (const f of features) {
        const record = normalizeStreamRecord(f.attributes, source.fieldCase, source.dateFormat);
        if (record.determinand && record.sampleDate) {
          allRecords.push(record);
        }
      }

      hasMore = json.exceededTransferLimit === true;
      offset += features.length;

      // Rate limit: 200ms between pages
      if (hasMore) await new Promise((r) => setTimeout(r, 200));
    } catch (err) {
      console.error(`[stream-api] Query failed for ${serviceName}:`, err);
      break;
    }
  }

  return allRecords;
}

/**
 * Discover available drinking water quality services for an ArcGIS org.
 * Queries the org's service listing and filters for water quality datasets.
 * Returns service names sorted by year descending (newest first).
 */
async function discoverServices(orgId: string): Promise<string[]> {
  try {
    const url = `${ARCGIS_BASE}/${orgId}/ArcGIS/rest/services?f=json`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json() as { services?: { name: string; type: string }[] };
    const services = (json.services ?? [])
      .filter((s) => s.type === "FeatureServer")
      .map((s) => s.name)
      .filter((name) => {
        const lower = name.toLowerCase();
        return (
          (lower.includes("drinking") || lower.includes("domestic")) &&
          lower.includes("water") &&
          lower.includes("quality")
        );
      })
      // Sort by year descending (extract year from name)
      .sort((a, b) => {
        const yearA = parseInt(a.match(/\d{4}/)?.[0] ?? "0", 10);
        const yearB = parseInt(b.match(/\d{4}/)?.[0] ?? "0", 10);
        return yearB - yearA;
      });
    return services;
  } catch {
    return [];
  }
}

/**
 * Fetch the most recent year's data for a supplier and set of LSOAs.
 * First tries hardcoded services (fast), then discovers new ones if none work.
 */
export async function fetchStreamData(
  source: StreamSource,
  lsoaCodes: string[],
): Promise<StreamRecord[]> {
  // Try hardcoded services first (fast path)
  for (const service of source.services) {
    const records = await queryStreamService(source, service.serviceName, lsoaCodes);
    if (records.length > 0) return records;
  }

  // Fallback: discover services dynamically (handles new yearly datasets)
  const discovered = await discoverServices(source.orgId);
  for (const serviceName of discovered) {
    // Skip services we already tried
    if (source.services.some((s) => s.serviceName === serviceName)) continue;
    const records = await queryStreamService(source, serviceName, lsoaCodes);
    if (records.length > 0) return records;
  }

  return [];
}
