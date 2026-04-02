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
    // Format: "1/2/2024 12:00:00 AM" → parse M/D/YYYY
    const datePart = raw.split(" ")[0];
    const parts = datePart.split("/");
    if (parts.length !== 3) return "";
    const [month, day, year] = parts;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // Fallback: try epoch even if format says string
  if (typeof raw === "number") {
    return new Date(raw).toISOString().split("T")[0];
  }

  return "";
}

// ── Record normalization ──

function getField(attrs: Record<string, unknown>, fieldCase: "upper" | "camel", upperName: string, camelName: string): unknown {
  return fieldCase === "upper" ? attrs[upperName] : (attrs[camelName] ?? attrs[upperName]);
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
    lsoa: String(attrs.LSOA ?? ""),  // LSOA field is always uppercase
  };
}

// ── ArcGIS REST query ──

export async function queryStreamService(
  source: StreamSource,
  serviceName: string,
  lsoaCodes: string[],
): Promise<StreamRecord[]> {
  if (lsoaCodes.length === 0) return [];

  const baseUrl = `${ARCGIS_BASE}/${source.orgId}/ArcGIS/rest/services/${encodeURIComponent(serviceName)}/FeatureServer/0/query`;
  const lsoaList = lsoaCodes.map((c) => `'${c}'`).join(",");
  const where = `${source.geoField} IN (${lsoaList})`;

  const allRecords: StreamRecord[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
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
 * Fetch the most recent year's data for a supplier and set of LSOAs.
 * Tries services in order (newest first) until one returns data.
 */
export async function fetchStreamData(
  source: StreamSource,
  lsoaCodes: string[],
): Promise<StreamRecord[]> {
  for (const service of source.services) {
    const records = await queryStreamService(source, service.serviceName, lsoaCodes);
    if (records.length > 0) return records;
  }
  return [];
}
