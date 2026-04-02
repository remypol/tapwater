# Stream Tap Water Data Integration

**Date:** 2026-04-02
**Status:** Approved
**Goal:** Replace EA environmental water data with actual tap water quality data from the Stream Water Data Portal as the primary data source, keeping EA as a supplementary environmental layer.

---

## Problem

TapWater.uk currently scores water quality using Environment Agency data that monitors rivers, canals, boreholes, and springs — not treated drinking water. The site says "Your water in DE21" but shows data from the Grand Union Canal. Seed data dates from Feb 2000. The historical trend chart is fabricated. This is a credibility and trust problem that blocks launch.

## Solution

Integrate the **Stream Water Data Portal** (ArcGIS REST API) — a platform where 16 of 18 UK water companies publish actual tap water quality results, sampled from household kitchen taps, at LSOA granularity. No authentication required.

---

## Architecture

### Two-Layer Data System

```
LAYER 1 — TAP WATER (primary, drives the score)
  Source: Stream Water Data Portal (ArcGIS REST API)
  Data: Actual samples from kitchen taps
  Granularity: LSOA (~1,500 people) → mapped to postcode districts
  Parameters: 121+ DWI-regulated determinands
  Coverage: Yorkshire Water, Severn Trent, Anglian Water, Southern Water,
            Portsmouth Water, Cambridge Water, United Utilities (more being added)
  Auth: None required

LAYER 2 — ENVIRONMENTAL (secondary, supplementary section)
  Source: EA Water Quality Archive (existing code, kept as-is)
  Data: Rivers, groundwater, canals near postcode
  Label: Clearly marked as environmental monitoring
  Purpose: Extra context, SEO content, differentiator
```

### Pipeline Data Flow

```
Daily cron (4am UTC, unchanged trigger) →

1. POSTCODE → LSOA MAPPING
   postcode_lsoa table (seeded from ONS CSV, ~2.6M rows)
   Query: SELECT DISTINCT lsoa_code FROM postcode_lsoa WHERE postcode LIKE '{district}%'
   Result: 5-30 LSOAs per postcode district

2. LSOA → STREAM API
   For each water company with data on Stream:
     ArcGIS REST query:
       URL: https://services-eu1.arcgis.com/{orgId}/ArcGIS/rest/services/{serviceName}/FeatureServer/0/query
       WHERE: LSOA IN ('E01013062','E01013063',...)
       outFields: DETERMINAND,RESULT,UNITS,SAMPLE_DATE,DWI_CODE,OPERATOR,LSOA
       f: json
     Pagination: resultOffset + resultRecordCount (max 2000 per request)
   No auth, JSON response

3. EA API (existing, unchanged)
   Runs in parallel with Stream fetch
   Same lat/lng → sampling points → observations flow

4. SCORE COMPUTATION
   Primary score: computed from Stream drinking water readings only
   Environmental score: computed from EA readings (displayed separately)
   Postcodes with no Stream coverage: show EA-only with clear "no tap water data" indicator

5. DATABASE WRITES
   drinking_water_readings ← Stream data (table already exists, currently unused)
   environmental_readings ← EA data (table already exists, currently unused)
   page_data ← updated with dual-layer scores and readings
```

---

## Stream API Details

### Water Company Registry

Each water company has its own ArcGIS organization with annual datasets:

```typescript
interface StreamSource {
  orgId: string;           // ArcGIS org ID
  services: {              // annual datasets
    year: number;
    serviceName: string;
  }[];
  geoField: string;        // "LSOA" for England/Wales, "DATA_ZONE" for Scotland
  coverageRegion: string;
}

const STREAM_SOURCES: Record<string, StreamSource> = {
  "yorkshire-water": {
    orgId: "1WqkK5cDKUbF0CkH",
    services: [
      { year: 2025, serviceName: "Yorkshire Water Drinking Water Quality 2025" },
      { year: 2024, serviceName: "Yorkshire Water Drinking Water Quality 2024" },
    ],
    geoField: "LSOA",
    coverageRegion: "Yorkshire",
  },
  // ... other companies discovered during implementation
};
```

### ArcGIS REST Query Format

```
GET https://services-eu1.arcgis.com/{orgId}/ArcGIS/rest/services/{serviceName}/FeatureServer/0/query
  ?where=LSOA IN ('E01013062','E01013063')
  &outFields=SAMPLE_ID,SAMPLE_DATE,DETERMINAND,DWI_CODE,UNITS,OPERATOR,RESULT,LSOA
  &f=json
  &resultRecordCount=2000
  &resultOffset=0
```

Response:
```json
{
  "features": [
    {
      "attributes": {
        "SAMPLE_ID": "YW-2025-001234",
        "SAMPLE_DATE": 1710460800000,
        "DETERMINAND": "Lead (10)",
        "DWI_CODE": "PB01",
        "UNITS": "ug/l",
        "OPERATOR": "<",
        "RESULT": 0.5,
        "LSOA": "E01013062"
      }
    }
  ],
  "exceededTransferLimit": true
}
```

Notes:
- `SAMPLE_DATE` is epoch milliseconds
- `OPERATOR` = "<" means below detection limit (value is the detection limit, not actual concentration)
- `exceededTransferLimit: true` means paginate with `resultOffset`
- Field names vary slightly by company — normalize during parsing

### Companies NOT on Stream

Thames Water, Northumbrian Water, Welsh Water, Scottish Water, South West Water, Wessex Water, Bristol Water may not have data on Stream yet. For these:
- Show EA environmental data as fallback
- Display clear indicator: "Tap water test data not yet available for {supplier}. Showing environmental monitoring data."
- No fabricated score — show what we have honestly

---

## Database Changes

### New Table: postcode_lsoa

```sql
CREATE TABLE postcode_lsoa (
  postcode    TEXT NOT NULL,         -- full postcode: 'DE21 4AA'
  lsoa_code   TEXT NOT NULL,         -- 'E01013062'
  lsoa_name   TEXT,                  -- 'Derby 001A'
  PRIMARY KEY (postcode)
);
CREATE INDEX idx_postcode_lsoa_lsoa ON postcode_lsoa (lsoa_code);
CREATE INDEX idx_postcode_lsoa_district ON postcode_lsoa (substring(postcode from 1 for position(' ' in postcode) - 1));
```

Seeded from ONS National Statistics Postcode Lookup (NSPL) CSV.
~2.6M rows. One-time import via `scripts/seed-lsoa.ts`.

### Existing Tables (already created, currently unused)

**drinking_water_readings** — Stream data goes here:
- `postcode_district` → links to postcode_districts
- `supplier_id` → links to water_suppliers
- `determinand`, `value`, `unit`, `uk_limit`, `who_guideline`
- `sample_date`
- `source` → set to `'stream_portal'` (schema CHECK constraint needs updating from `('dwi_annual', 'company_scrape')`)

**environmental_readings** — EA data goes here (currently written to page_data.environmental_context JSONB instead):
- Already has the right schema for EA observations

### page_data Updates

Add columns:
```sql
ALTER TABLE page_data ADD COLUMN data_source TEXT DEFAULT 'ea-only';
-- values: 'stream', 'ea-only', 'mixed'

ALTER TABLE page_data ADD COLUMN drinking_water_readings JSONB;
-- Stream tap water readings (separate from all_readings which becomes EA)

ALTER TABLE page_data ADD COLUMN sample_count INTEGER DEFAULT 0;
ALTER TABLE page_data ADD COLUMN date_range_from DATE;
ALTER TABLE page_data ADD COLUMN date_range_to DATE;
```

### drinking_water_readings source constraint update

```sql
ALTER TABLE drinking_water_readings DROP CONSTRAINT drinking_water_readings_source_check;
ALTER TABLE drinking_water_readings ADD CONSTRAINT drinking_water_readings_source_check
  CHECK (source IN ('dwi_annual', 'company_scrape', 'stream_portal'));
```

---

## Scoring Changes

### New Determinands

Add to `LIMITS` in `scoring.ts`:

```typescript
// Tier 1 (weight 3.0) — zero tolerance / acute health risk
"e.coli":     { ukLimit: 0,     whoGuideline: 0,     unit: "count/100ml", tier: 1, displayName: "E. coli" },
"coliforms":  { ukLimit: 0,     whoGuideline: 0,     unit: "count/100ml", tier: 1, displayName: "Coliform Bacteria" },

// Tier 2 (weight 2.0) — significant concern
"trihalomethanes": { ukLimit: 0.1,   whoGuideline: null,  unit: "mg/L", tier: 2, displayName: "Trihalomethanes" },
"bromate":         { ukLimit: 0.01,  whoGuideline: 0.01,  unit: "mg/L", tier: 2, displayName: "Bromate" },
"fluoride":        { ukLimit: 1.5,   whoGuideline: 1.5,   unit: "mg/L", tier: 2, displayName: "Fluoride" },
"antimony":        { ukLimit: 0.005, whoGuideline: 0.02,  unit: "mg/L", tier: 2, displayName: "Antimony" },
"selenium":        { ukLimit: 0.04,  whoGuideline: 0.04,  unit: "mg/L", tier: 2, displayName: "Selenium" },

// Tier 3 (weight 1.0) — aesthetic
"aluminium": { ukLimit: 0.2,  whoGuideline: null, unit: "mg/L",      tier: 3, displayName: "Aluminium" },
"colour":    { ukLimit: 20,   whoGuideline: null, unit: "mg/L Pt/Co", tier: 3, displayName: "Colour" },
```

### Stream Determinand Normalization

Stream uses DWI names like `"Lead (10)"`, `"Nitrate (Total)"`, `"Trihalomethanes (Total)"`. Add mappings to `normalizeDeterminand()`:

```typescript
if (lower.includes("trihalomethane")) return "trihalomethanes";
if (lower.includes("bromate")) return "bromate";
if (lower.includes("fluoride")) return "fluoride";
if (lower.includes("antimony")) return "antimony";
if (lower.includes("selenium")) return "selenium";
if (lower.includes("aluminium")) return "aluminium";
if (lower.includes("coliform") && !lower.includes("e.")) return "coliforms";
if (lower.includes("e. coli") || lower.includes("e.coli") || lower.includes("escherichia")) return "e.coli";
if (lower.includes("colour")) return "colour";
```

### Below-Detection-Limit Handling

Stream data includes `OPERATOR: "<"` for readings below detection limit. These should be treated as the detection limit value (conservative approach). This is standard practice for drinking water quality assessment.

### Dual Scoring

`computeScore()` gets an optional `source` parameter:
- When called with drinking water readings → produces the primary safety score
- When called with EA readings → produces the environmental score (displayed separately)
- No blending between the two — they're independent assessments

---

## Type Changes

### PostcodeData Updates

```typescript
interface PostcodeData {
  // Existing fields — unchanged
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
  nearbyPostcodes: string[];

  // CHANGED: primary readings are now from tap water when available
  readings: ContaminantReading[];

  // NEW: data source transparency
  dataSource: "stream" | "ea-only" | "mixed";
  drinkingWaterReadings: ContaminantReading[];   // Stream tap water data
  environmentalReadings: ContaminantReading[];   // EA rivers/groundwater

  // NEW: replaces fake historicalScores
  sampleCount: number;
  dateRange: { from: string; to: string } | null;

  // REMOVED: historicalScores (was fabricated)
}
```

### ContaminantReading — minor addition

```typescript
interface ContaminantReading {
  name: string;
  value: number;
  unit: string;
  ukLimit: number | null;
  whoGuideline: number | null;
  status: "pass" | "warning" | "fail";
  isPfas?: boolean;
  source?: "drinking" | "environmental";  // NEW
  belowDetectionLimit?: boolean;           // NEW: true when OPERATOR was "<"
}
```

---

## New Files

### `src/lib/stream-api.ts`

ArcGIS REST client. Functions:
- `queryStreamData(orgId, serviceName, lsoaCodes[])` — paginated query, returns normalized readings
- `normalizeStreamReading(feature)` — maps ArcGIS attributes to `{ determinand, value, unit, date, lsoa, belowDetectionLimit }`

### `src/lib/stream-sources.ts`

Water company → ArcGIS service registry. Maps `supplierId` to Stream API config.
Export: `getStreamSource(supplierId): StreamSource | null`

### `src/lib/lsoa-lookup.ts`

Postcode district → LSOA resolver. Functions:
- `getLsoasForDistrict(district)` — queries `postcode_lsoa` table
- Falls back gracefully when no LSOAs found

### `scripts/seed-lsoa.ts`

One-time script to download ONS NSPL CSV and import postcode→LSOA mappings into Supabase. Run manually once, not part of the daily pipeline.

### `supabase/migrations/002_stream_data.sql`

Schema changes: `postcode_lsoa` table, `page_data` new columns, constraint updates.

---

## Modified Files

### `src/lib/scoring.ts`
- Add new determinands to LIMITS table (E.coli, coliforms, trihalomethanes, bromate, fluoride, antimony, selenium, aluminium, colour)
- Add Stream determinand name mappings to `normalizeDeterminand()`
- Handle below-detection-limit readings (OPERATOR: "<")
- No structural changes to the scoring algorithm itself

### `src/lib/types.ts`
- Add `dataSource`, `drinkingWaterReadings`, `environmentalReadings`, `sampleCount`, `dateRange` to PostcodeData
- Add `source`, `belowDetectionLimit` to ContaminantReading
- Remove `historicalScores` from PostcodeData

### `src/lib/data.ts`
- `loadFromSupabase()` reads new page_data columns, populates both reading arrays
- `loadJsonFallback()` updated to mark readings as `source: "environmental"` and set `dataSource: "ea-only"`
- Remove `buildHistoricalScores()` function entirely

### `src/lib/db-writer.ts`
- Add `writeStreamReadings()` — bulk insert into `drinking_water_readings`
- Update `upsertPageData()` to compute dual scores, set `data_source`, `drinking_water_readings` JSONB, `sample_count`, `date_range_from/to`

### `src/lib/ea-fetcher.ts`
- No changes to EA fetching logic itself
- `PostcodeSeedData` interface gains optional `streamReadings` array

### `src/app/api/pipeline/batch/route.ts`
- After EA fetch, also run Stream fetch for the same postcode
- Look up supplier → Stream source → LSOAs → query Stream API
- Pass both datasets to `writePostcodeData()`

### `src/app/postcode/[district]/page.tsx`
- Score section: unchanged visually, now driven by tap water data
- Stat cards: "Last checked" shows actual recent date
- Data provenance badge: "Drinking water quality data" (green) or "Environmental monitoring only" (amber)
- "What we found" section: shows `drinkingWaterReadings` as primary table
- NEW section: "Environmental water quality" — shows `environmentalReadings` in a separate, clearly-labelled table
- REMOVE: "How it's changed" fake trend chart — replace with sample count and date range info
- Summary text: "Based on drinking water tests" when Stream data available

### `src/components/stat-cards.tsx`
- No structural changes, just receives accurate dates now

### `src/components/contaminant-table.tsx`
- Add subtle indicator for below-detection-limit readings (e.g., "< 0.001" instead of "0.001")
- Optional source badge per reading

---

## Unchanged

- Homepage (rankings, search, map)
- Water drop score component (visual unchanged, better data)
- SEO (sitemap, robots, JSON-LD — auto-updated from new data)
- Email capture, subscribe API
- Cron trigger mechanism (`vercel.json`)
- About/guides/legal pages
- Supplier pages
- Header/footer/navigation

---

## Edge Cases

1. **Company not on Stream** — EA-only data with honest labelling, no fabricated score
2. **LSOA has no readings** — expand search to adjacent LSOAs, or fall back to company-level averages
3. **Stream API down** — fall back to most recent cached data in `drinking_water_readings` table
4. **Detection limit readings** — treat as the detection limit value (conservative), mark with `belowDetectionLimit: true`
5. **Multiple years of Stream data** — use most recent year's data for scoring, store older years for future real trend analysis
6. **Scottish postcodes** — Stream uses "DATA_ZONE" instead of "LSOA" for Scottish Water. ONS publishes a separate postcode→DataZone lookup.

---

## Out of Scope (Future Work)

- NI Water integration (CSV-based, different pipeline)
- DWI annual report scraping (company-level only, less useful)
- Water company postcode tool scraping (fragile)
- Real historical trend analysis (needs multi-year Stream data accumulation)
- Filter product recommendations (separate feature)
