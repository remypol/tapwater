# Stream Tap Water Data Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace EA environmental water data with actual tap water quality data from the Stream Water Data Portal as the primary scoring source, keeping EA as a supplementary environmental layer.

**Architecture:** Two-layer data system. Layer 1 (primary): Stream Water Data Portal ArcGIS REST API provides real tap water samples at LSOA granularity, mapped to postcode districts via ONS lookup. Layer 2 (supplementary): existing EA environmental data, clearly labelled. Pipeline fetches both in parallel, scores independently, stores in existing unused DB tables.

**Tech Stack:** Next.js 16, Supabase (PostGIS), ArcGIS REST API (no auth), ONS NSPL CSV, Vitest

**Spec:** `docs/superpowers/specs/2026-04-02-stream-tap-water-integration-design.md`

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `src/lib/stream-api.ts` | ArcGIS REST client — query, paginate, normalize across company schemas |
| `src/lib/stream-sources.ts` | Water company → ArcGIS service registry (org IDs, service names, field mappings) |
| `src/lib/lsoa-lookup.ts` | Postcode district → LSOA[] resolver via Supabase |
| `scripts/seed-lsoa.ts` | One-time ONS postcode-to-LSOA CSV import into Supabase |
| `supabase/migrations/002_stream_data.sql` | New postcode_lsoa table, page_data columns, constraint updates |
| `vitest.config.ts` | Vitest configuration |
| `src/lib/__tests__/stream-api.test.ts` | Stream API client tests |
| `src/lib/__tests__/scoring.test.ts` | Scoring engine tests (existing + new determinands) |
| `src/lib/__tests__/stream-sources.test.ts` | Source registry tests |

### Modified Files

| File | Changes |
|------|---------|
| `src/lib/types.ts` | Add `dataSource`, `drinkingWaterReadings`, `environmentalReadings`, `sampleCount`, `dateRange` to PostcodeData; add `source`, `belowDetectionLimit` to ContaminantReading; remove `historicalScores` |
| `src/lib/scoring.ts` | Add 9 new determinands (E.coli, coliforms, THMs, bromate, fluoride, antimony, selenium, aluminium, colour); add Stream determinand normalization; handle below-detection-limit |
| `src/lib/data.ts` | Load both reading arrays from page_data; remove `buildHistoricalScores()`; update JSON fallback to set `dataSource: "ea-only"` |
| `src/lib/db-writer.ts` | Add `writeStreamReadings()` for drinking_water_readings table; update `upsertPageData()` for dual scores, new columns |
| `src/app/api/pipeline/batch/route.ts` | Add Stream fetch alongside EA fetch; pass both datasets to writer |
| `src/app/postcode/[district]/page.tsx` | Remove fake trend chart; add "Environmental water quality" section; update provenance badges; update summary text |
| `src/components/contaminant-table.tsx` | Add below-detection-limit indicator |
| `package.json` | Add vitest dev dependency |

---

## Task 1: Test Infrastructure

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Install vitest**

```bash
npm install -D vitest
```

- [ ] **Step 2: Create vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 3: Add test script to package.json**

Add to `"scripts"` in `package.json`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Create test directory**

```bash
mkdir -p src/lib/__tests__
```

- [ ] **Step 5: Verify vitest runs (no tests yet)**

Run: `npx vitest run`
Expected: "No test files found" or similar clean output, no errors.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts package.json package-lock.json src/lib/__tests__
git commit -m "chore: add vitest test infrastructure"
```

---

## Task 2: Database Migration

**Files:**
- Create: `supabase/migrations/002_stream_data.sql`

- [ ] **Step 1: Write the migration SQL**

Create `supabase/migrations/002_stream_data.sql`:

```sql
-- ============================================================
-- Stream Water Data Portal integration
-- ============================================================

-- Postcode-to-LSOA mapping (seeded from ONS NSPL)
CREATE TABLE IF NOT EXISTS postcode_lsoa (
  postcode    TEXT NOT NULL PRIMARY KEY,  -- full postcode: 'DE21 4AA'
  lsoa_code   TEXT NOT NULL,              -- 'E01013062'
  lsoa_name   TEXT                        -- 'Derby 001A'
);

CREATE INDEX IF NOT EXISTS idx_postcode_lsoa_lsoa
  ON postcode_lsoa (lsoa_code);

-- Functional index for postcode district prefix lookups
-- Extracts the district part (everything before the space)
CREATE INDEX IF NOT EXISTS idx_postcode_lsoa_district
  ON postcode_lsoa (split_part(postcode, ' ', 1));

-- Update drinking_water_readings source constraint to allow 'stream_portal'
ALTER TABLE drinking_water_readings
  DROP CONSTRAINT IF EXISTS drinking_water_readings_source_check;

ALTER TABLE drinking_water_readings
  ADD CONSTRAINT drinking_water_readings_source_check
  CHECK (source IN ('dwi_annual', 'company_scrape', 'stream_portal'));

-- Add new columns to page_data for dual-layer data
ALTER TABLE page_data ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'ea-only';
ALTER TABLE page_data ADD COLUMN IF NOT EXISTS drinking_water_readings JSONB;
ALTER TABLE page_data ADD COLUMN IF NOT EXISTS sample_count INTEGER DEFAULT 0;
ALTER TABLE page_data ADD COLUMN IF NOT EXISTS date_range_from DATE;
ALTER TABLE page_data ADD COLUMN IF NOT EXISTS date_range_to DATE;
```

- [ ] **Step 2: Apply migration to Supabase**

Run the migration via Supabase dashboard SQL editor or CLI:

```bash
# If using Supabase CLI:
npx supabase db push
# Or paste the SQL into the Supabase dashboard SQL editor
```

Expected: Tables created, constraints updated, no errors.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/002_stream_data.sql
git commit -m "feat: add postcode_lsoa table and page_data stream columns"
```

---

## Task 3: Type Updates

**Files:**
- Modify: `src/lib/types.ts`
- Create: `src/lib/__tests__/types.test.ts`

- [ ] **Step 1: Write test for type helper functions**

Create `src/lib/__tests__/types.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { getScoreColor, getScoreGrade, getPercentOfLimit } from "../types";
import type { ContaminantReading } from "../types";

describe("getScoreColor", () => {
  it("returns safe for scores >= 7", () => {
    expect(getScoreColor(7)).toBe("safe");
    expect(getScoreColor(10)).toBe("safe");
  });

  it("returns warning for scores 4-6.9", () => {
    expect(getScoreColor(4)).toBe("warning");
    expect(getScoreColor(6.9)).toBe("warning");
  });

  it("returns danger for scores < 4", () => {
    expect(getScoreColor(3.9)).toBe("danger");
    expect(getScoreColor(0)).toBe("danger");
  });
});

describe("getPercentOfLimit", () => {
  it("handles below-detection-limit readings", () => {
    const reading: ContaminantReading = {
      name: "Lead",
      value: 0.001,
      unit: "mg/L",
      ukLimit: 0.01,
      whoGuideline: 0.01,
      status: "pass",
      belowDetectionLimit: true,
    };
    expect(getPercentOfLimit(reading)).toBe(10);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/types.test.ts`
Expected: FAIL — `belowDetectionLimit` property doesn't exist on type yet.

- [ ] **Step 3: Update types**

In `src/lib/types.ts`, replace the entire file:

```typescript
export interface ContaminantReading {
  name: string;
  value: number;
  unit: string;
  ukLimit: number | null;
  whoGuideline: number | null;
  status: "pass" | "warning" | "fail";
  isPfas?: boolean;
  source?: "drinking" | "environmental";
  belowDetectionLimit?: boolean;
}

export interface PostcodeData {
  district: string;
  areaName: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
  supplier: string;
  supplierId: string;
  supplyZone: string;
  safetyScore: number;
  scoreGrade: "excellent" | "good" | "fair" | "poor" | "very-poor" | "insufficient-data";
  contaminantsTested: number;
  contaminantsFlagged: number;
  pfasDetected: boolean;
  pfasLevel: number | null;
  pfasSource: "environmental" | "drinking" | null;
  lastUpdated: string;
  lastSampleDate: string;
  readings: ContaminantReading[];
  nearbyPostcodes: string[];
  dataSource: "stream" | "ea-only" | "mixed";
  drinkingWaterReadings: ContaminantReading[];
  environmentalReadings: ContaminantReading[];
  sampleCount: number;
  dateRange: { from: string; to: string } | null;
}

export interface FilterProduct {
  id: string;
  brand: string;
  model: string;
  category: "jug" | "under_sink" | "whole_house" | "countertop";
  removes: string[];
  certifications: string[];
  priceGbp: number;
  affiliateUrl: string;
  imageUrl: string;
  rating: number;
  badge: "best-match" | "budget" | "whole-house";
}

export interface SupplierData {
  id: string;
  name: string;
  region: string;
  customersM: number;
  complianceRate: number;
  website: string;
  postcodeAreas: string[];
}

export type ScoreColor = "safe" | "warning" | "danger";

export function getScoreColor(score: number): ScoreColor {
  if (score >= 7) return "safe";
  if (score >= 4) return "warning";
  return "danger";
}

export function getScoreGrade(score: number): string {
  if (score >= 9) return "Excellent";
  if (score >= 7) return "Good";
  if (score >= 5) return "Fair";
  if (score >= 3) return "Poor";
  return "Very Poor";
}

export function getStatusColor(reading: ContaminantReading): ScoreColor {
  if (reading.status === "pass") return "safe";
  if (reading.status === "warning") return "warning";
  return "danger";
}

export function getPercentOfLimit(reading: ContaminantReading): number {
  const limit = reading.ukLimit ?? reading.whoGuideline;
  if (!limit || limit === 0) return 0;
  return Math.min((reading.value / limit) * 100, 100);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/types.test.ts`
Expected: PASS

- [ ] **Step 5: Fix TypeScript compilation errors**

The removal of `historicalScores` from PostcodeData will cause errors in files that reference it. Run:

```bash
npx tsc --noEmit 2>&1 | head -40
```

Note all files with errors — they'll be fixed in later tasks (data.ts, page.tsx). For now, just confirm the type file itself is correct.

- [ ] **Step 6: Commit**

```bash
git add src/lib/types.ts src/lib/__tests__/types.test.ts
git commit -m "feat: update PostcodeData types for dual-layer data model"
```

---

## Task 4: Stream Sources Registry

**Files:**
- Create: `src/lib/stream-sources.ts`
- Create: `src/lib/__tests__/stream-sources.test.ts`

- [ ] **Step 1: Write tests**

Create `src/lib/__tests__/stream-sources.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { getStreamSource, getAllStreamSupplierIds } from "../stream-sources";

describe("getStreamSource", () => {
  it("returns config for yorkshire-water", () => {
    const source = getStreamSource("yorkshire-water");
    expect(source).not.toBeNull();
    expect(source!.orgId).toBe("1WqkK5cDKUbF0CkH");
    expect(source!.geoField).toBe("LSOA");
    expect(source!.services.length).toBeGreaterThan(0);
    expect(source!.services[0].year).toBeGreaterThanOrEqual(2024);
  });

  it("returns config for severn-trent", () => {
    const source = getStreamSource("severn-trent");
    expect(source).not.toBeNull();
    expect(source!.orgId).toBe("XxS6FebPX29TRGDJ");
  });

  it("returns null for thames-water (not on Stream)", () => {
    expect(getStreamSource("thames-water")).toBeNull();
  });

  it("returns null for unknown supplier", () => {
    expect(getStreamSource("nonexistent")).toBeNull();
  });

  it("lists all stream supplier IDs", () => {
    const ids = getAllStreamSupplierIds();
    expect(ids).toContain("yorkshire-water");
    expect(ids).toContain("severn-trent");
    expect(ids).not.toContain("thames-water");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/stream-sources.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement stream-sources.ts**

Create `src/lib/stream-sources.ts`:

```typescript
/**
 * Water company → Stream Water Data Portal ArcGIS service registry.
 *
 * Most companies publish to the shared Stream org (XxS6FebPX29TRGDJ).
 * Yorkshire Water uses its own org (1WqkK5cDKUbF0CkH).
 *
 * Field schemas vary between companies:
 * - Yorkshire Water: UPPER_CASE fields, epoch ms dates
 * - Most others: CamelCase fields, string dates ("1/2/2024 12:00:00 AM")
 */

export interface StreamService {
  year: number;
  serviceName: string;
}

export interface StreamSource {
  orgId: string;
  services: StreamService[];
  geoField: string;
  fieldCase: "upper" | "camel";
  dateFormat: "epoch" | "string";
}

const STREAM_ORG = "XxS6FebPX29TRGDJ";

const STREAM_SOURCES: Record<string, StreamSource> = {
  "yorkshire-water": {
    orgId: "1WqkK5cDKUbF0CkH",
    services: [
      { year: 2026, serviceName: "Yorkshire Water Drinking Water Quality 2026" },
      { year: 2025, serviceName: "Yorkshire Water Drinking Water Quality 2025" },
      { year: 2024, serviceName: "Yorkshire Water Drinking Water Quality 2024" },
    ],
    geoField: "LSOA",
    fieldCase: "upper",
    dateFormat: "epoch",
  },
  "severn-trent": {
    orgId: STREAM_ORG,
    services: [
      { year: 2024, serviceName: "Severn_Trent_Water_Domestic_Water_Quality_2024" },
      { year: 2023, serviceName: "Severn_Trent_Water_Domestic_Water_Quality_2023" },
    ],
    geoField: "LSOA",
    fieldCase: "camel",
    dateFormat: "string",
  },
  "southern-water": {
    orgId: STREAM_ORG,
    services: [
      { year: 2025, serviceName: "Southern_Water_Domestic_Drinking_Water_Quality_2025" },
      { year: 2024, serviceName: "Southern_Water_Domestic_Drinking_Water_Quality_2024" },
    ],
    geoField: "LSOA",
    fieldCase: "camel",
    dateFormat: "string",
  },
  "united-utilities": {
    orgId: STREAM_ORG,
    services: [
      { year: 2023, serviceName: "United_Utilities_Domestic_Drinking_Water_Quality_2023" },
    ],
    geoField: "LSOA",
    fieldCase: "camel",
    dateFormat: "string",
  },
  "anglian-water": {
    orgId: STREAM_ORG,
    services: [
      { year: 2024, serviceName: "Anglian_Water_Domestic_Water_Quality_2024" },
    ],
    geoField: "LSOA",
    fieldCase: "camel",
    dateFormat: "string",
  },
  "south-west-water": {
    orgId: STREAM_ORG,
    services: [
      { year: 2024, serviceName: "South_West_Water_(SWB)_Drinking_Water_Quality_2024" },
    ],
    geoField: "LSOA",
    fieldCase: "camel",
    dateFormat: "string",
  },
  "portsmouth-water": {
    orgId: STREAM_ORG,
    services: [
      { year: 2024, serviceName: "Portsmouth_Water_Drinking_Water_Quality_Data_2022_2023_2024" },
    ],
    geoField: "LSOA",
    fieldCase: "camel",
    dateFormat: "string",
  },
  "welsh-water": {
    orgId: STREAM_ORG,
    services: [
      { year: 2024, serviceName: "Dwr_Cymru_Welsh_Water_Drinking_Water_Quality_2024" },
    ],
    geoField: "LSOA",
    fieldCase: "camel",
    dateFormat: "string",
  },
  "northumbrian-water": {
    orgId: STREAM_ORG,
    services: [
      { year: 2024, serviceName: "Northumbrian_Water_Domestic_Water_Quality" },
    ],
    geoField: "LSOA",
    fieldCase: "camel",
    dateFormat: "string",
  },
};

export function getStreamSource(supplierId: string): StreamSource | null {
  return STREAM_SOURCES[supplierId] ?? null;
}

export function getAllStreamSupplierIds(): string[] {
  return Object.keys(STREAM_SOURCES);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/stream-sources.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/stream-sources.ts src/lib/__tests__/stream-sources.test.ts
git commit -m "feat: add Stream Water Data Portal source registry"
```

---

## Task 5: Stream API Client

**Files:**
- Create: `src/lib/stream-api.ts`
- Create: `src/lib/__tests__/stream-api.test.ts`

- [ ] **Step 1: Write tests for normalization logic**

Create `src/lib/__tests__/stream-api.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { normalizeStreamRecord, parseStreamDate } from "../stream-api";

describe("parseStreamDate", () => {
  it("parses epoch milliseconds", () => {
    expect(parseStreamDate(1743206400000, "epoch")).toBe("2025-03-29");
  });

  it("parses string date format", () => {
    expect(parseStreamDate("1/2/2024 12:00:00 AM", "string")).toBe("2024-01-02");
  });

  it("parses string date with different format", () => {
    expect(parseStreamDate("12/31/2024 12:00:00 AM", "string")).toBe("2024-12-31");
  });

  it("returns empty string for null", () => {
    expect(parseStreamDate(null, "epoch")).toBe("");
  });
});

describe("normalizeStreamRecord", () => {
  it("normalizes Yorkshire Water UPPER_CASE fields", () => {
    const record = {
      SAMPLE_ID: "abc123",
      SAMPLE_DATE: 1743206400000,
      DETERMINAND: "Lead (10)",
      DWI_CODE: "PB01",
      UNITS: "ug/l",
      OPERATOR: "<",
      RESULT: 0.5,
      LSOA: "E01013386",
    };
    const result = normalizeStreamRecord(record, "upper", "epoch");
    expect(result).toEqual({
      sampleId: "abc123",
      sampleDate: "2025-03-29",
      determinand: "Lead (10)",
      dwiCode: "PB01",
      unit: "ug/l",
      belowDetectionLimit: true,
      value: 0.5,
      lsoa: "E01013386",
    });
  });

  it("normalizes Severn Trent CamelCase fields", () => {
    const record = {
      Sample_Id: "ZBR17E01009349",
      Sample_Date: "1/2/2024 12:00:00 AM",
      Determinand: "Coliform Bacteria",
      DWI_Code: "C001A",
      Units: "No. / 100ml",
      Operator: null,
      Result: 0,
      LSOA: "E01009349",
      Data_Provider: "Severn Trent",
    };
    const result = normalizeStreamRecord(record, "camel", "string");
    expect(result).toEqual({
      sampleId: "ZBR17E01009349",
      sampleDate: "2024-01-02",
      determinand: "Coliform Bacteria",
      dwiCode: "C001A",
      unit: "No. / 100ml",
      belowDetectionLimit: false,
      value: 0,
      lsoa: "E01009349",
    });
  });

  it("handles unicode micro sign in units", () => {
    const record = {
      SAMPLE_ID: "x",
      SAMPLE_DATE: 1743206400000,
      DETERMINAND: "Aluminium (Total)",
      DWI_CODE: "A021",
      UNITS: "\u03bcg/l Al",
      OPERATOR: "<",
      RESULT: 8.37,
      LSOA: "E01010929",
    };
    const result = normalizeStreamRecord(record, "upper", "epoch");
    expect(result.unit).toBe("µg/l Al");
    expect(result.belowDetectionLimit).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/stream-api.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement stream-api.ts**

Create `src/lib/stream-api.ts`:

```typescript
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
    unit: rawUnit.replace("\u03bc", "µ"),  // normalize unicode micro sign
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/stream-api.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/stream-api.ts src/lib/__tests__/stream-api.test.ts
git commit -m "feat: add Stream Water Data Portal ArcGIS REST client"
```

---

## Task 6: Scoring Engine Updates

**Files:**
- Modify: `src/lib/scoring.ts`
- Create: `src/lib/__tests__/scoring.test.ts`

- [ ] **Step 1: Write tests for new determinands and below-detection-limit**

Create `src/lib/__tests__/scoring.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { computeScore } from "../scoring";

describe("computeScore", () => {
  it("scores lead correctly", () => {
    const result = computeScore([
      { determinand: "Lead", value: 0.005, unit: "mg/l", date: "2025-01-01" },
    ]);
    expect(result.safetyScore).toBe(-1); // insufficient data (only 1 param with limit)
    const leadReading = result.readings.find((r) => r.name === "Lead");
    expect(leadReading).toBeDefined();
    expect(leadReading!.status).toBe("pass");
  });

  it("flags lead exceeding UK limit", () => {
    const result = computeScore([
      { determinand: "Lead", value: 0.015, unit: "mg/l", date: "2025-01-01" },
      { determinand: "Nitrate", value: 10, unit: "mg/l", date: "2025-01-01" },
    ]);
    const leadReading = result.readings.find((r) => r.name === "Lead");
    expect(leadReading!.status).toBe("fail");
    expect(result.contaminantsFlagged).toBeGreaterThanOrEqual(1);
  });

  it("scores E.coli at zero as pass", () => {
    const result = computeScore([
      { determinand: "E.Coli (faecal coliforms Confirmed)", value: 0, unit: "No. /100ml", date: "2025-01-01" },
      { determinand: "Coliform Bacteria", value: 0, unit: "No. /100ml", date: "2025-01-01" },
      { determinand: "Lead", value: 0.005, unit: "mg/l", date: "2025-01-01" },
    ]);
    const ecoli = result.readings.find((r) => r.name === "E. coli");
    expect(ecoli).toBeDefined();
    expect(ecoli!.status).toBe("pass");
  });

  it("flags E.coli detected", () => {
    const result = computeScore([
      { determinand: "E.Coli (faecal coliforms Confirmed)", value: 1, unit: "No. /100ml", date: "2025-01-01" },
      { determinand: "Lead", value: 0.005, unit: "mg/l", date: "2025-01-01" },
    ]);
    const ecoli = result.readings.find((r) => r.name === "E. coli");
    expect(ecoli!.status).toBe("fail");
  });

  it("scores trihalomethanes", () => {
    const result = computeScore([
      { determinand: "Trihalomethanes (Total)", value: 0.05, unit: "mg/l", date: "2025-01-01" },
      { determinand: "Lead", value: 0.005, unit: "mg/l", date: "2025-01-01" },
    ]);
    const thm = result.readings.find((r) => r.name === "Trihalomethanes");
    expect(thm).toBeDefined();
    expect(thm!.status).toBe("pass");
  });

  it("handles ug/l to mg/l conversion", () => {
    const result = computeScore([
      { determinand: "Lead", value: 5, unit: "µg/l", date: "2025-01-01" },
      { determinand: "Nitrate", value: 10, unit: "mg/l", date: "2025-01-01" },
    ]);
    const leadReading = result.readings.find((r) => r.name === "Lead");
    expect(leadReading!.value).toBe(0.005);
    expect(leadReading!.status).toBe("pass");
  });

  it("keeps most recent reading per determinand", () => {
    const result = computeScore([
      { determinand: "Lead", value: 0.015, unit: "mg/l", date: "2024-01-01" },
      { determinand: "Lead", value: 0.005, unit: "mg/l", date: "2025-01-01" },
      { determinand: "Nitrate", value: 10, unit: "mg/l", date: "2025-01-01" },
    ]);
    const leadReading = result.readings.find((r) => r.name === "Lead");
    expect(leadReading!.value).toBe(0.005);
    expect(leadReading!.status).toBe("pass");
  });

  it("returns insufficient-data when fewer than 2 scored params", () => {
    const result = computeScore([
      { determinand: "pH", value: 7.5, unit: "ph", date: "2025-01-01" },
    ]);
    expect(result.safetyScore).toBe(-1);
    expect(result.scoreGrade).toBe("insufficient-data");
  });

  it("detects PFAS", () => {
    const result = computeScore([
      { determinand: "Perfluorooctane Sulfonate (PFOS)", value: 0.05, unit: "µg/l", date: "2025-01-01" },
      { determinand: "Lead", value: 0.005, unit: "mg/l", date: "2025-01-01" },
      { determinand: "Nitrate", value: 10, unit: "mg/l", date: "2025-01-01" },
    ]);
    expect(result.pfasDetected).toBe(true);
    expect(result.pfasLevel).toBe(0.05);
  });
});
```

- [ ] **Step 2: Run test to verify current state**

Run: `npx vitest run src/lib/__tests__/scoring.test.ts`
Expected: FAIL on E.coli, Trihalomethanes tests (determinands not yet in LIMITS).

- [ ] **Step 3: Add new determinands to LIMITS and normalizeDeterminand()**

In `src/lib/scoring.ts`, add these entries to the `LIMITS` object after the existing entries:

After the existing Tier 1 entries (lead, arsenic), add:
```typescript
  "e.coli": { ukLimit: 0, whoGuideline: 0, unit: "count/100ml", tier: 1, displayName: "E. coli" },
  coliforms: { ukLimit: 0, whoGuideline: 0, unit: "count/100ml", tier: 1, displayName: "Coliform Bacteria" },
```

After the existing Tier 2 entries (nickel), add:
```typescript
  trihalomethanes: { ukLimit: 0.1, whoGuideline: null, unit: "mg/L", tier: 2, displayName: "Trihalomethanes" },
  bromate: { ukLimit: 0.01, whoGuideline: 0.01, unit: "mg/L", tier: 2, displayName: "Bromate" },
  fluoride: { ukLimit: 1.5, whoGuideline: 1.5, unit: "mg/L", tier: 2, displayName: "Fluoride" },
  antimony: { ukLimit: 0.005, whoGuideline: 0.02, unit: "mg/L", tier: 2, displayName: "Antimony" },
  selenium: { ukLimit: 0.04, whoGuideline: 0.04, unit: "mg/L", tier: 2, displayName: "Selenium" },
```

After the existing Tier 3 entries (conductivity), add:
```typescript
  aluminium: { ukLimit: 0.2, whoGuideline: null, unit: "mg/L", tier: 3, displayName: "Aluminium" },
  colour: { ukLimit: 20, whoGuideline: null, unit: "mg/L Pt/Co", tier: 3, displayName: "Colour" },
```

In `normalizeDeterminand()`, add these mappings after the existing ones:

```typescript
  // Stream Water Data Portal determinand names
  if (lower.includes("e.coli") || lower.includes("e. coli") || lower.includes("escherichia")) return "e.coli";
  if (lower.includes("coliform") && !lower.includes("e.coli") && !lower.includes("e. coli")) return "coliforms";
  if (lower.includes("trihalomethane")) return "trihalomethanes";
  if (lower.includes("bromate")) return "bromate";
  if (lower.includes("fluoride")) return "fluoride";
  if (lower.includes("antimony")) return "antimony";
  if (lower.includes("selenium")) return "selenium";
  if (lower.includes("aluminium")) return "aluminium";
  if (lower.includes("colour") && !lower.includes("colourless")) return "colour";
```

Also add `"count/100ml"` and `"no. /100ml"` and `"no./100ml"` to the `WATER_UNITS` set if not already there.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/scoring.test.ts`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/scoring.ts src/lib/__tests__/scoring.test.ts
git commit -m "feat: add DWI drinking water determinands to scoring engine"
```

---

## Task 7: LSOA Lookup Module

**Files:**
- Create: `src/lib/lsoa-lookup.ts`

- [ ] **Step 1: Implement LSOA lookup**

Create `src/lib/lsoa-lookup.ts`:

```typescript
/**
 * Postcode district → LSOA resolver.
 *
 * Queries the postcode_lsoa table (seeded from ONS NSPL) to find
 * all LSOAs that fall within a postcode district.
 */

import { supabase } from "./supabase";

/**
 * Get all unique LSOA codes for a postcode district.
 * e.g., "DE21" → ["E01013062", "E01013063", ...]
 */
export async function getLsoasForDistrict(district: string): Promise<string[]> {
  if (!supabase) return [];

  const pattern = `${district.toUpperCase()} %`;

  const { data, error } = await supabase
    .from("postcode_lsoa")
    .select("lsoa_code")
    .like("postcode", pattern);

  if (error || !data) {
    console.error(`[lsoa-lookup] Failed to get LSOAs for ${district}:`, error);
    return [];
  }

  // Deduplicate
  return [...new Set(data.map((row) => row.lsoa_code))];
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/lsoa-lookup.ts
git commit -m "feat: add LSOA lookup for postcode districts"
```

---

## Task 8: LSOA Seed Script

**Files:**
- Create: `scripts/seed-lsoa.ts`

- [ ] **Step 1: Write the seed script**

Create `scripts/seed-lsoa.ts`:

```typescript
/**
 * One-time script: Import ONS postcode-to-LSOA mappings into Supabase.
 *
 * Downloads the ONS "Postcode to OA to LSOA to MSOA to LAD" best-fit lookup,
 * extracts postcode + LSOA columns, and bulk-inserts into postcode_lsoa table.
 *
 * Usage: npx tsx scripts/seed-lsoa.ts <path-to-csv>
 *
 * The CSV can be downloaded from:
 * https://open-geography-portalx-ons.hub.arcgis.com/datasets/postcode-to-oa-2021-to-lsoa-to-msoa-to-lad-february-2025-best-fit-lookup-in-the-uk
 *
 * Expected columns: PCDS (postcode), LSOA21CD (LSOA code), LSOA21NM (LSOA name)
 * or: pcds, lsoa21cd, lsoa21nm (lowercase)
 */

import { createClient } from "@supabase/supabase-js";
import { createReadStream } from "fs";
import { createInterface } from "readline";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: npx tsx scripts/seed-lsoa.ts <path-to-csv>");
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  const rl = createInterface({ input: createReadStream(csvPath) });
  let headers: string[] = [];
  let postcodeIdx = -1;
  let lsoaCodeIdx = -1;
  let lsoaNameIdx = -1;
  let batch: { postcode: string; lsoa_code: string; lsoa_name: string }[] = [];
  let total = 0;
  let skipped = 0;

  const BATCH_SIZE = 5000;

  for await (const line of rl) {
    if (headers.length === 0) {
      headers = line.split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
      postcodeIdx = headers.findIndex((h) => h === "pcds" || h === "pcd8");
      lsoaCodeIdx = headers.findIndex((h) => h === "lsoa21cd");
      lsoaNameIdx = headers.findIndex((h) => h === "lsoa21nm");

      if (postcodeIdx === -1 || lsoaCodeIdx === -1) {
        console.error("CSV must have PCDS and LSOA21CD columns");
        console.error("Found columns:", headers.join(", "));
        process.exit(1);
      }
      console.log(`Columns found: postcode=${headers[postcodeIdx]}, lsoa=${headers[lsoaCodeIdx]}`);
      continue;
    }

    const cols = line.split(",").map((c) => c.trim().replace(/"/g, ""));
    const postcode = cols[postcodeIdx];
    const lsoaCode = cols[lsoaCodeIdx];
    const lsoaName = lsoaNameIdx >= 0 ? cols[lsoaNameIdx] : "";

    if (!postcode || !lsoaCode) {
      skipped++;
      continue;
    }

    batch.push({ postcode, lsoa_code: lsoaCode, lsoa_name: lsoaName });

    if (batch.length >= BATCH_SIZE) {
      const { error } = await db
        .from("postcode_lsoa")
        .upsert(batch, { onConflict: "postcode", ignoreDuplicates: true });

      if (error) {
        console.error(`Batch insert error at row ${total}:`, error.message);
      }

      total += batch.length;
      batch = [];
      process.stdout.write(`\r  ${total.toLocaleString()} rows imported...`);
    }
  }

  // Final batch
  if (batch.length > 0) {
    await db
      .from("postcode_lsoa")
      .upsert(batch, { onConflict: "postcode", ignoreDuplicates: true });
    total += batch.length;
  }

  console.log(`\nDone! ${total.toLocaleString()} postcodes imported, ${skipped} skipped.`);
}

main().catch(console.error);
```

- [ ] **Step 2: Add seed-lsoa script to package.json**

Add to `"scripts"` in `package.json`:

```json
"seed:lsoa": "tsx scripts/seed-lsoa.ts"
```

- [ ] **Step 3: Download ONS CSV and run the seed**

Download the ONS Postcode to LSOA lookup CSV from:
https://open-geography-portalx-ons.hub.arcgis.com/datasets/ons::postcode-to-oa-2021-to-lsoa-to-msoa-to-lad-february-2025-best-fit-lookup-in-the-uk

Then run:
```bash
npx tsx scripts/seed-lsoa.ts /path/to/downloaded.csv
```

Expected: ~2.6M rows imported over a few minutes.

- [ ] **Step 4: Verify the data**

Check via Supabase dashboard SQL:
```sql
SELECT count(*) FROM postcode_lsoa;
-- Expected: ~2,600,000

SELECT DISTINCT lsoa_code FROM postcode_lsoa WHERE postcode LIKE 'DE21%';
-- Expected: 10-30 LSOAs for the DE21 district
```

- [ ] **Step 5: Commit**

```bash
git add scripts/seed-lsoa.ts package.json
git commit -m "feat: add ONS postcode-to-LSOA seed script"
```

---

## Task 9: Data Layer Updates

**Files:**
- Modify: `src/lib/data.ts`

- [ ] **Step 1: Update loadFromSupabase() for new columns**

In `src/lib/data.ts`, update the `select` query in `loadFromSupabase()` to include the new columns. Add `data_source`, `drinking_water_readings`, `sample_count`, `date_range_from`, `date_range_to` to the select string.

Update the row-to-PostcodeData mapping to populate:
- `dataSource` from `row.data_source`
- `drinkingWaterReadings` from `row.drinking_water_readings ?? []`
- `environmentalReadings` from `row.all_readings ?? []`
- `readings` — use `drinkingWaterReadings` if available, else `environmentalReadings`
- `sampleCount` from `row.sample_count`
- `dateRange` from `row.date_range_from` and `row.date_range_to`

- [ ] **Step 2: Remove buildHistoricalScores()**

Delete the `buildHistoricalScores()` function entirely from `data.ts`.

Remove all references to `historicalScores` in both `loadFromSupabase()` and `loadJsonFallback()`.

- [ ] **Step 3: Update loadJsonFallback() for new fields**

In `loadJsonFallback()`, add the new fields to the cache entry:

```typescript
dataSource: "ea-only" as const,
drinkingWaterReadings: [],
environmentalReadings: score.readings.map((r) => ({ ...r, source: "environmental" as const })),
sampleCount: 0,
dateRange: null,
```

And set `readings` to the same as `environmentalReadings` (EA-only fallback).

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -40`
Expected: Errors only in `page.tsx` (historicalScores references removed later).

- [ ] **Step 5: Commit**

```bash
git add src/lib/data.ts
git commit -m "feat: update data layer for dual-source readings"
```

---

## Task 10: DB Writer Updates

**Files:**
- Modify: `src/lib/db-writer.ts`

- [ ] **Step 1: Add Stream reading type and writer function**

Add to `db-writer.ts`:

```typescript
import type { StreamRecord } from "./stream-api";

/**
 * Bulk insert Stream tap water readings into drinking_water_readings table.
 */
export async function writeStreamReadings(
  district: string,
  supplierId: string,
  records: StreamRecord[],
): Promise<void> {
  const db = getSupabase();

  // Delete previous readings for this district to avoid duplicates
  await db
    .from("drinking_water_readings")
    .delete()
    .eq("postcode_district", district)
    .eq("source", "stream_portal");

  if (records.length === 0) return;

  const rows = records.map((r) => ({
    postcode_district: district,
    supplier_id: supplierId,
    supply_zone: null,
    determinand: r.determinand,
    value: r.value,
    unit: r.unit,
    uk_limit: null,  // limits live in scoring.ts, not the DB
    who_guideline: null,
    sample_date: r.sampleDate,
    source: "stream_portal",
    source_ref: r.sampleId,
  }));

  // Batch insert in chunks of 1000
  for (let i = 0; i < rows.length; i += 1000) {
    const chunk = rows.slice(i, i + 1000);
    const { error } = await db.from("drinking_water_readings").insert(chunk);
    if (error) {
      console.error(`[db-writer] drinking_water_readings insert failed for ${district}:`, error);
    }
  }
}
```

- [ ] **Step 2: Update upsertPageData() for dual scoring**

Modify `upsertPageData()` to accept an optional `streamRecords` parameter and compute dual scores:

```typescript
export async function upsertPageData(
  seedData: PostcodeSeedData,
  streamRecords?: StreamRecord[],
): Promise<void> {
  const db = getSupabase();

  // Score EA environmental readings
  const eaObservations = seedData.topReadings.map((r) => ({
    determinand: r.determinand,
    value: r.value,
    unit: r.unit,
    date: r.date,
  }));
  const eaScore = computeScore(eaObservations);

  // Score Stream drinking water readings (if available)
  const hasStream = streamRecords && streamRecords.length > 0;
  let drinkingScore: ScoreResult | null = null;

  if (hasStream) {
    const drinkingObs = streamRecords.map((r) => ({
      determinand: r.determinand,
      value: r.value,
      unit: r.unit,
      date: r.sampleDate,
    }));
    drinkingScore = computeScore(drinkingObs);
  }

  // Primary score: drinking water if available, else EA
  const primaryScore = drinkingScore ?? eaScore;

  // Nearby postcodes (unchanged logic)
  const nearby: string[] = [];
  const { data: allDistricts } = await db
    .from("postcode_districts")
    .select("id, city, latitude, longitude")
    .neq("id", seedData.district);

  if (allDistricts) {
    for (const other of allDistricts) {
      if (
        other.city === seedData.city ||
        Math.abs(other.latitude - seedData.latitude) < 0.05
      ) {
        nearby.push(other.id);
      }
      if (nearby.length >= 10) break;
    }
  }

  // Date range from Stream records
  let dateRangeFrom: string | null = null;
  let dateRangeTo: string | null = null;
  if (hasStream) {
    const dates = streamRecords
      .map((r) => r.sampleDate)
      .filter(Boolean)
      .sort();
    dateRangeFrom = dates[0] ?? null;
    dateRangeTo = dates[dates.length - 1] ?? null;
  }

  // Most recent date (from whichever source has data)
  const allDates = [
    ...(hasStream ? streamRecords.map((r) => r.sampleDate) : []),
    ...seedData.topReadings.map((r) => r.date?.split("T")[0]).filter(Boolean),
  ].sort().reverse();
  const lastDataUpdate = allDates[0] ?? null;

  const dataSource = hasStream ? "stream" : "ea-only";

  const row = {
    postcode_district: seedData.district,
    safety_score: primaryScore.safetyScore,
    score_grade: primaryScore.scoreGrade,
    contaminants_tested: primaryScore.contaminantsTested,
    contaminants_flagged: primaryScore.contaminantsFlagged,
    pfas_detected: primaryScore.pfasDetected,
    pfas_level: primaryScore.pfasLevel,
    pfas_source: primaryScore.pfasDetected
      ? (hasStream ? "drinking" : "environmental")
      : null,
    all_readings: eaScore.readings,
    drinking_water_readings: drinkingScore?.readings ?? null,
    environmental_context: {
      samplingPointCount: seedData.samplingPointCount,
      recentObservations: seedData.recentObservations,
      topReadings: seedData.topReadings,
    },
    nearby_postcodes: nearby,
    last_data_update: lastDataUpdate,
    summary_text: null,
    data_source: dataSource,
    sample_count: hasStream ? streamRecords.length : 0,
    date_range_from: dateRangeFrom,
    date_range_to: dateRangeTo,
  };

  const { error } = await db
    .from("page_data")
    .upsert(row, { onConflict: "postcode_district" });

  if (error) {
    console.error(`[db-writer] page_data upsert failed for ${seedData.district}:`, error);
    throw error;
  }
}
```

- [ ] **Step 3: Update writePostcodeData() to accept Stream records**

```typescript
export async function writePostcodeData(
  seedData: PostcodeSeedData,
  streamRecords?: StreamRecord[],
): Promise<void> {
  await upsertPostcodeDistrict(seedData);

  if (streamRecords && streamRecords.length > 0) {
    const supplier = getSupplier(seedData.city);
    await writeStreamReadings(seedData.district, supplier.id, streamRecords);
  }

  await upsertPageData(seedData, streamRecords);
}
```

- [ ] **Step 4: Add missing import**

Add `import type { StreamRecord } from "./stream-api";` and `import type { ScoreResult } from "./scoring";` at the top of the file.

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -40`

- [ ] **Step 6: Commit**

```bash
git add src/lib/db-writer.ts
git commit -m "feat: update db-writer for dual-layer Stream + EA data"
```

---

## Task 11: Pipeline Batch Update

**Files:**
- Modify: `src/app/api/pipeline/batch/route.ts`

- [ ] **Step 1: Add Stream fetch to pipeline**

Add imports at top of route.ts:

```typescript
import { getStreamSource } from "@/lib/stream-sources";
import { fetchStreamData } from "@/lib/stream-api";
import { getLsoasForDistrict } from "@/lib/lsoa-lookup";
import { getSupplier } from "@/lib/suppliers";
```

Inside the `for (const district of batch)` loop, after `const seedData = await processPostcode(district);`, add Stream fetch:

```typescript
// Fetch Stream tap water data
let streamRecords: StreamRecord[] = [];
try {
  if (seedData) {
    const supplier = getSupplier(seedData.city);
    const streamSource = getStreamSource(supplier.id);
    if (streamSource) {
      const lsoas = await getLsoasForDistrict(district);
      if (lsoas.length > 0) {
        streamRecords = await fetchStreamData(streamSource, lsoas);
        console.log(`  → ${district}: ${streamRecords.length} Stream records from ${lsoas.length} LSOAs`);
      }
    }
  }
} catch (err) {
  console.error(`  ⚠ ${district} Stream fetch error:`, err);
  // Continue with EA-only data
}
```

Update the `writePostcodeData` call to pass Stream records:

```typescript
await writePostcodeData(seedData, streamRecords.length > 0 ? streamRecords : undefined);
```

Add `import type { StreamRecord } from "@/lib/stream-api";` at the top.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/pipeline/batch/route.ts
git commit -m "feat: add Stream tap water fetch to pipeline batch handler"
```

---

## Task 12: Postcode Page Restructure

**Files:**
- Modify: `src/app/postcode/[district]/page.tsx`
- Modify: `src/components/contaminant-table.tsx`

- [ ] **Step 1: Update contaminant table for below-detection-limit**

In `src/components/contaminant-table.tsx`, find where `reading.value` is displayed and update to show `< ` prefix when `reading.belowDetectionLimit` is true.

For example, wherever the value is rendered, use:

```typescript
{reading.belowDetectionLimit ? `< ${reading.value}` : reading.value}
```

- [ ] **Step 2: Remove fake trend chart from page.tsx**

In `src/app/postcode/[district]/page.tsx`:

Delete the entire `getTrendNote()` function (lines 61-69).

Delete the entire "How it's changed" `<ScrollReveal>` section (the section with `data.historicalScores.map`). This is approximately lines 240-288.

- [ ] **Step 3: Update data provenance badge**

Replace the existing provenance section (the `<div>` with "Environment Agency data" badge) with:

```tsx
{/* Data provenance — transparency about where this comes from */}
<div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
  {data.dataSource === "stream" || data.dataSource === "mixed" ? (
    <span className="inline-flex items-center gap-1.5 bg-wash border border-rule rounded-full px-3 py-1">
      <span className="w-1.5 h-1.5 rounded-full bg-safe" />
      Drinking water quality data
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 bg-wash border border-rule rounded-full px-3 py-1">
      <span className="w-1.5 h-1.5 rounded-full bg-warning" />
      Environmental monitoring only
    </span>
  )}
  <span>Last sampled: <span className="font-data text-ink">{data.lastSampleDate}</span></span>
  {data.sampleCount > 0 && (
    <>
      <span>·</span>
      <span>{data.sampleCount.toLocaleString()} samples</span>
    </>
  )}
  {data.dataSource === "ea-only" && (
    <>
      <span>·</span>
      <span>Tap water test data not yet available for {data.supplier}</span>
    </>
  )}
  <Link href="/about/data-sources" className="text-accent hover:underline">
    How we score
  </Link>
</div>
```

- [ ] **Step 4: Update summary paragraph**

Replace "Based on government water tests" with dynamic text:

```tsx
<p className="text-base text-body leading-relaxed">
  {data.dataSource === "stream" || data.dataSource === "mixed" ? (
    <>Based on drinking water tests</>
  ) : (
    <>Based on environmental water monitoring</>
  )}
  , your water in{" "}
  {data.district} ({data.areaName}) is supplied by{" "}
  <Link href={`/supplier/${data.supplierId}/`} className="font-medium text-ink hover:text-accent transition-colors">
    {data.supplier}
  </Link>
  . Based on the latest data (last sampled {data.lastSampleDate}),{" "}
  <span className="font-data">{data.contaminantsTested}</span> things
  were tested with{" "}
  <span className="font-data">{data.contaminantsFlagged}</span> exceeding
  recommended levels.{" "}
  The overall water quality score for {data.district} is{" "}
  <span className="font-data font-bold">{data.safetyScore}/10</span>
  {data.pfasDetected && data.pfasLevel != null && (
    <>
      . PFAS (forever chemicals) were detected at{" "}
      <span className="font-data">{data.pfasLevel}</span> µg/L
      {data.pfasSource === "drinking"
        ? " in local tap water tests"
        : " in nearby environmental monitoring"}
      {" "}— the UK currently has no legal limit for PFAS in drinking water
    </>
  )}
  .
</p>
```

- [ ] **Step 5: Add Environmental Water Quality section**

After the "What we found" section and before the email capture section, add:

```tsx
{/* Environmental Water Quality — EA data, clearly labelled */}
{data.environmentalReadings.length > 0 && (
  <ScrollReveal delay={100}>
    <section className="mt-8">
      <h2 className="font-display text-2xl text-ink italic">
        Environmental water nearby
      </h2>
      <p className="text-sm text-muted mt-1 mb-5">
        Rivers, groundwater and reservoirs near {data.district}. This is
        environmental monitoring — not your tap water.
      </p>
      <ContaminantTable readings={data.environmentalReadings} />
    </section>
  </ScrollReveal>
)}
```

- [ ] **Step 6: Update "What we found" heading for Stream data**

Change the "What we found" heading to be contextual:

```tsx
<h2 className="font-display text-2xl text-ink italic">
  {data.dataSource === "stream" || data.dataSource === "mixed"
    ? "What\u2019s in your tap water"
    : "What we found"}
</h2>
<p className="text-sm text-muted mt-1 mb-5">
  {data.dataSource === "stream" || data.dataSource === "mixed"
    ? `Results from drinking water tests in ${data.areaName}.`
    : "Here\u2019s what government tests found in water near you."}
</p>
```

- [ ] **Step 7: Update methodology footer**

Replace the existing footer text:

```tsx
<footer id="methodology-footer" className="mt-10 pb-4 text-sm text-faint leading-relaxed scroll-mt-20">
  {hasData ? <>Based on {data.contaminantsTested} tests. </> : null}
  {data.dataSource === "stream" || data.dataSource === "mixed"
    ? "Drinking water quality data from your water company via the Stream Water Data Portal. "
    : "Environmental water monitoring data from the Environment Agency. "}
  See our{" "}
  <Link href="/about/methodology" className="underline underline-offset-2 hover:text-muted transition-colors">
    methodology
  </Link>{" "}
  for how scores are calculated.
</footer>
```

- [ ] **Step 8: Verify build succeeds**

Run: `npx next build 2>&1 | tail -20`
Expected: Build completes successfully (or only non-blocking warnings).

- [ ] **Step 9: Commit**

```bash
git add src/app/postcode/[district]/page.tsx src/components/contaminant-table.tsx
git commit -m "feat: restructure postcode page for dual-layer tap + environmental data"
```

---

## Task 13: Fix Remaining Compilation Errors

**Files:**
- Modify: various files with `historicalScores` references

- [ ] **Step 1: Find all remaining TypeScript errors**

Run: `npx tsc --noEmit 2>&1`

Fix any remaining references to `historicalScores` or other removed/changed fields across:
- `src/app/page.tsx` (homepage — if it references historicalScores)
- `src/components/json-ld.tsx` (if it references historicalScores)
- Any other files

- [ ] **Step 2: Verify clean build**

Run: `npx next build 2>&1 | tail -20`
Expected: Build completes.

- [ ] **Step 3: Run all tests**

Run: `npx vitest run`
Expected: ALL PASS

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "fix: resolve remaining TypeScript errors from type changes"
```

---

## Task 14: Run the Pipeline

This is the manual verification step.

- [ ] **Step 1: Verify LSOA data is seeded**

```sql
SELECT count(*) FROM postcode_lsoa;
-- Expected: > 2,000,000
```

- [ ] **Step 2: Test Stream API connectivity**

Test with a single postcode in the Yorkshire Water area:

```bash
curl "https://services-eu1.arcgis.com/1WqkK5cDKUbF0CkH/ArcGIS/rest/services/Yorkshire%20Water%20Drinking%20Water%20Quality%202025/FeatureServer/0/query?where=LSOA%20IN%20('E01007669')&outFields=*&resultRecordCount=5&f=json"
```

Expected: JSON with `features` array containing tap water readings.

- [ ] **Step 3: Trigger a pipeline run locally**

```bash
curl -X POST http://localhost:3000/api/pipeline/start \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json"
```

Monitor console output. Expected: batches processing with both EA and Stream data.

- [ ] **Step 4: Verify a postcode page shows tap water data**

Visit `http://localhost:3000/postcode/LS1/` (Leeds, Yorkshire Water area).

Expected:
- Green "Drinking water quality data" badge
- Recent sample date (2024 or 2025)
- Real contaminant readings from tap water tests
- Environmental section below with EA data

- [ ] **Step 5: Verify EA-only fallback**

Visit `http://localhost:3000/postcode/SW1A/` (Westminster, Thames Water — not on Stream).

Expected:
- Amber "Environmental monitoring only" badge
- "Tap water test data not yet available for Thames Water"
- EA readings in the main table
