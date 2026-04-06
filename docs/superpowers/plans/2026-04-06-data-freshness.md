# Data Freshness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve tap water data coverage from ~50% to ~65-70% by fixing stale stream sources, self-healing fetch logic, and integrating Thames Water zone data into the pipeline.

**Architecture:** Three independent improvements: (1) update stream source config with missing/newer services, (2) rewrite `fetchStreamData` to prefer newest data and auto-discover new services, (3) wire Thames Water zone data into the existing pipeline. Plus a research task for Scottish Water.

**Tech Stack:** TypeScript, Vitest, Supabase (PostgreSQL), ArcGIS REST API, Next.js API routes

**Spec:** `docs/superpowers/specs/2026-04-06-data-freshness-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/lib/stream-sources.ts` | Modify | Add Cambridge Water, add no-year services for UU/Anglian |
| `src/lib/stream-api.ts` | Modify | Rewrite `fetchStreamData` with newest-first + discovery |
| `src/lib/__tests__/stream-sources.test.ts` | Modify | Add tests for new sources |
| `src/lib/__tests__/stream-api.test.ts` | Modify | Add tests for new fetch logic |
| `src/lib/thames-zones.ts` | Create | Shared zone-to-postcode mapping |
| `scripts/import-thames-water.ts` | Modify | Import from shared mapping |
| `src/app/api/cron/refresh/route.ts` | Modify | Add Thames Water fallback in pipeline |
| `src/lib/db-writer.ts` | Modify | Add `getThamesReadings` function |
| `docs/superpowers/specs/2026-04-06-scottish-water-research.md` | Create | Research findings |

---

### Task 1: Add Cambridge Water to Stream Sources

**Files:**
- Modify: `src/lib/stream-sources.ts:27-153`
- Modify: `src/lib/__tests__/stream-sources.test.ts`

First we need to determine Cambridge Water's field schema. Query a sample record from their service.

- [ ] **Step 1: Query Cambridge Water ArcGIS service for field metadata**

Use WebFetch or curl to check the service fields:
```
https://services-eu1.arcgis.com/XxS6FebPX29TRGDJ/ArcGIS/rest/services/CAM_DomesticWaterQuality/FeatureServer/0?f=json
```

Check the `fields` array in the response for:
- Whether field names are UPPER_CASE or CamelCase (look for DETERMINAND vs Determinand)
- Whether SAMPLE_DATE is epoch or string
- What the LSOA field is called (LSOA, LSOA21CD, lsoa21cd, LSOA_Name)

- [ ] **Step 2: Write failing test for Cambridge Water source**

Add to `src/lib/__tests__/stream-sources.test.ts`:

```typescript
it("returns config for cambridge-water", () => {
  const source = getStreamSource("cambridge-water");
  expect(source).not.toBeNull();
  expect(source!.orgId).toBe("XxS6FebPX29TRGDJ");
  expect(source!.services.length).toBeGreaterThan(0);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/stream-sources.test.ts`
Expected: FAIL — `getStreamSource("cambridge-water")` returns null

- [ ] **Step 4: Add Cambridge Water config to stream-sources.ts**

Add to the `STREAM_SOURCES` object in `src/lib/stream-sources.ts` (after `"hafren-dyfrdwy"`):

```typescript
"cambridge-water": {
  orgId: STREAM_ORG,
  services: [
    { year: 2024, serviceName: "CAM_DomesticWaterQuality" },
  ],
  geoField: "LSOA",       // confirm from Step 1
  fieldCase: "camel",      // confirm from Step 1
  dateFormat: "string",    // confirm from Step 1
},
```

**Important:** Replace the `geoField`, `fieldCase`, and `dateFormat` values with what you discovered in Step 1.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/stream-sources.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/stream-sources.ts src/lib/__tests__/stream-sources.test.ts
git commit -m "feat: add Cambridge Water to Stream sources"
```

---

### Task 2: Add No-Year Services for United Utilities and Anglian Water

**Files:**
- Modify: `src/lib/stream-sources.ts:59-76`

These companies have newer "no-year" services that may contain more recent data than the year-specific ones.

- [ ] **Step 1: Add no-year service to United Utilities**

In `src/lib/stream-sources.ts`, replace the `"united-utilities"` entry:

```typescript
"united-utilities": {
  orgId: STREAM_ORG,
  services: [
    { year: 2025, serviceName: "United_Utilities_Domestic_Water_Quality" },
    { year: 2023, serviceName: "United_Utilities_Domestic_Drinking_Water_Quality_2023" },
  ],
  geoField: "LSOA",
  fieldCase: "camel",
  dateFormat: "string",
},
```

Note: the no-year service is assigned `year: 2025` because it's assumed to contain the latest data. The fetch logic (Task 4) will treat `currentYear` as the threshold.

- [ ] **Step 2: Add no-year service to Anglian Water**

In `src/lib/stream-sources.ts`, replace the `"anglian-water"` entry:

```typescript
"anglian-water": {
  orgId: STREAM_ORG,
  services: [
    { year: 2025, serviceName: "Anglian_Water_Domestic_Water_Quality" },
    { year: 2024, serviceName: "Anglian_Water_Domestic_Water_Quality_2024" },
  ],
  geoField: "LSOA21CD",
  fieldCase: "camel",
  dateFormat: "epoch",
},
```

- [ ] **Step 3: Run existing tests**

Run: `npx vitest run src/lib/__tests__/stream-sources.test.ts`
Expected: PASS (existing tests should still pass — they only check services.length > 0)

- [ ] **Step 4: Commit**

```bash
git add src/lib/stream-sources.ts
git commit -m "feat: add no-year services for United Utilities and Anglian Water"
```

---

### Task 3: Check Stream Portal for Wessex, Bristol, Thames

**Files:** None (research task, may result in additions to `src/lib/stream-sources.ts`)

- [ ] **Step 1: Query the Stream org for Wessex Water services**

Fetch:
```
https://services-eu1.arcgis.com/XxS6FebPX29TRGDJ/ArcGIS/rest/services?f=json
```

Search the response for service names containing "wessex" (case-insensitive). If found, query a sample record to determine field schema, then add to `stream-sources.ts` following the same pattern as Task 1.

- [ ] **Step 2: Query for Bristol Water services**

Search the same response for "bristol". If found, add to config.

- [ ] **Step 3: Query for Thames Water services**

Search for "thames". If found (unlikely), this would be a major win — add to config.

- [ ] **Step 4: Commit any additions**

```bash
git add src/lib/stream-sources.ts src/lib/__tests__/stream-sources.test.ts
git commit -m "feat: add newly discovered water companies to Stream sources"
```

If none were found, skip this commit.

---

### Task 4: Rewrite fetchStreamData with Newest-First + Discovery

**Files:**
- Modify: `src/lib/stream-api.ts:216-236`
- Modify: `src/lib/__tests__/stream-api.test.ts`

- [ ] **Step 1: Write failing tests for the new fetch logic**

Add to `src/lib/__tests__/stream-api.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

// At the top of the file, add these imports if not already present:
import type { StreamSource } from "../stream-sources";

describe("fetchStreamData", () => {
  // We'll test the exported function by mocking the underlying queryStreamService
  // and discoverServices. Since they're in the same module, we use vi.mock.

  const mockSource: StreamSource = {
    orgId: "test-org",
    services: [
      { year: 2025, serviceName: "Company_Water_Quality_2025" },
      { year: 2024, serviceName: "Company_Water_Quality_2024" },
    ],
    geoField: "LSOA",
    fieldCase: "camel",
    dateFormat: "string",
  };

  it("returns data from newest hardcoded service when available", async () => {
    // This test verifies the fast path: newest service has data, no discovery needed.
    // We test this by checking that the function returns records
    // when the newest service responds.
    // Actual implementation test with mocked fetch — see Step 3.
  });

  it("triggers discovery when only older services have data", async () => {
    // This test verifies that discovery fires when the newest
    // hardcoded service fails but an older one succeeds.
  });

  it("prefers discovered service over stale hardcoded data", async () => {
    // This test verifies that a discovered 2026 service beats
    // hardcoded 2024 data.
  });
});
```

Note: The actual test implementations require mocking `fetch` since `queryStreamService` and `discoverServices` call the ArcGIS API. Complete test code is in Step 3.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/__tests__/stream-api.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement the new fetchStreamData function**

Replace the `fetchStreamData` function in `src/lib/stream-api.ts` (lines 216-236):

```typescript
/**
 * Extract a year from a service name, or return current year if none found.
 * Services without a year (e.g., "Affinity_Water_Domestic_Water_Quality")
 * are assumed to contain the latest data.
 */
function extractServiceYear(serviceName: string): number {
  const match = serviceName.match(/\d{4}/);
  return match ? parseInt(match[0], 10) : new Date().getFullYear();
}

/**
 * Fetch the most recent year's data for a supplier and set of LSOAs.
 *
 * Strategy:
 * 1. Try hardcoded services newest-first (fast path)
 * 2. If best data is older than our newest config, run discovery
 * 3. If discovery finds a newer service with data, prefer it
 */
export async function fetchStreamData(
  source: StreamSource,
  lsoaCodes: string[],
): Promise<StreamRecord[]> {
  if (lsoaCodes.length === 0) return [];

  // Sort hardcoded services newest-first (enforce regardless of config order)
  const sortedServices = [...source.services].sort((a, b) => b.year - a.year);
  const newestHardcodedYear = sortedServices[0]?.year ?? 0;

  // Try hardcoded services newest-first
  let bestRecords: StreamRecord[] = [];
  let bestYear = 0;

  for (const service of sortedServices) {
    const records = await queryStreamService(source, service.serviceName, lsoaCodes);
    if (records.length > 0) {
      bestRecords = records;
      bestYear = service.year;
      break; // fast path: newest available worked
    }
  }

  // If our best data is older than the newest hardcoded year, or we have nothing,
  // try discovering newer services on the portal
  if (bestYear < newestHardcodedYear || bestRecords.length === 0) {
    const discovered = await discoverServices(source.orgId);
    const triedNames = new Set(sortedServices.map((s) => s.serviceName));

    for (const serviceName of discovered) {
      if (triedNames.has(serviceName)) continue;

      const discoveredYear = extractServiceYear(serviceName);
      if (discoveredYear <= bestYear) continue; // already have newer data

      const records = await queryStreamService(source, serviceName, lsoaCodes);
      if (records.length > 0) {
        console.log(
          `[stream-api] Discovered newer service: ${serviceName} (${discoveredYear}) — update stream-sources.ts`,
        );
        bestRecords = records;
        bestYear = discoveredYear;
        break; // found newer data
      }
    }
  }

  return bestRecords;
}
```

- [ ] **Step 4: Update tests with complete mocked implementations**

Replace the `fetchStreamData` describe block in `src/lib/__tests__/stream-api.test.ts` with tests that work against the real function. Since the function calls `fetch` internally, mock `globalThis.fetch`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchStreamData } from "../stream-api";
import type { StreamSource } from "../stream-sources";

describe("fetchStreamData", () => {
  const mockSource: StreamSource = {
    orgId: "test-org",
    services: [
      { year: 2025, serviceName: "Company_2025" },
      { year: 2024, serviceName: "Company_2024" },
    ],
    geoField: "LSOA",
    fieldCase: "upper",
    dateFormat: "epoch",
  };

  const makeFeature = (determinand: string, date: number) => ({
    attributes: {
      SAMPLE_ID: "s1",
      SAMPLE_DATE: date,
      DETERMINAND: determinand,
      DWI_CODE: "X1",
      UNITS: "mg/l",
      OPERATOR: null,
      RESULT: 1.0,
      LSOA: "E01000001",
    },
  });

  const makeArcGISResponse = (features: unknown[], exceededLimit = false) =>
    new Response(JSON.stringify({ features, exceededTransferLimit: exceededLimit }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  const emptyResponse = () => makeArcGISResponse([]);

  const discoveryResponse = (services: string[]) =>
    new Response(
      JSON.stringify({
        services: services.map((name) => ({ name, type: "FeatureServer" })),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );

  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("returns data from newest hardcoded service (fast path)", async () => {
    fetchSpy.mockResolvedValueOnce(
      makeArcGISResponse([makeFeature("Lead", 1743206400000)]),
    );

    const records = await fetchStreamData(mockSource, ["E01000001"]);
    expect(records.length).toBe(1);
    expect(records[0].determinand).toBe("Lead");
    // Should only have called fetch once (newest service worked)
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("falls through to older service when newest is empty", async () => {
    fetchSpy
      .mockResolvedValueOnce(emptyResponse()) // 2025 empty
      .mockResolvedValueOnce(
        makeArcGISResponse([makeFeature("Chlorine", 1700000000000)]),
      ) // 2024 has data
      .mockResolvedValueOnce(discoveryResponse(["Company_2025", "Company_2024"])); // discovery (no new ones)

    const records = await fetchStreamData(mockSource, ["E01000001"]);
    expect(records.length).toBe(1);
    expect(records[0].determinand).toBe("Chlorine");
  });

  it("prefers discovered newer service over stale hardcoded data", async () => {
    fetchSpy
      .mockResolvedValueOnce(emptyResponse()) // 2025 empty
      .mockResolvedValueOnce(
        makeArcGISResponse([makeFeature("Chlorine", 1700000000000)]),
      ) // 2024 has data
      .mockResolvedValueOnce(
        discoveryResponse([
          "Company_Drinking_Water_Quality_2026",
          "Company_2025",
          "Company_2024",
        ]),
      ) // discovery finds 2026
      .mockResolvedValueOnce(
        makeArcGISResponse([makeFeature("Lead", 1770000000000)]),
      ); // 2026 has data

    const records = await fetchStreamData(mockSource, ["E01000001"]);
    expect(records.length).toBe(1);
    expect(records[0].determinand).toBe("Lead"); // got the 2026 data
  });

  it("returns empty array when no services have data", async () => {
    fetchSpy
      .mockResolvedValueOnce(emptyResponse())
      .mockResolvedValueOnce(emptyResponse())
      .mockResolvedValueOnce(discoveryResponse([]));

    const records = await fetchStreamData(mockSource, ["E01000001"]);
    expect(records).toEqual([]);
  });

  it("returns empty array for empty lsoa list", async () => {
    const records = await fetchStreamData(mockSource, []);
    expect(records).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 5: Run all tests**

Run: `npx vitest run src/lib/__tests__/stream-api.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/stream-api.ts src/lib/__tests__/stream-api.test.ts
git commit -m "feat: fetchStreamData prefers newest data with auto-discovery fallback"
```

---

### Task 5: Extract Thames Zone Mapping to Shared Module

**Files:**
- Create: `src/lib/thames-zones.ts`
- Modify: `scripts/import-thames-water.ts:51-62`

- [ ] **Step 1: Create the shared thames-zones module**

Create `src/lib/thames-zones.ts`:

```typescript
/**
 * Thames Water zone-to-postcode mapping.
 *
 * Thames Water divides its supply area into zones with prefixes:
 * - NLE: North London East (E, N postcodes)
 * - NLW: North London West (W, NW, HA, TW postcodes)
 * - SLE: South London East (SE, BR, DA postcodes)
 * - SLW: South London West (SW, CR, KT, SM postcodes)
 * - OX: Oxford / Thames Valley
 */

export const THAMES_ZONE_POSTCODES: Record<string, string[]> = {
  NLE: ["E1", "E2", "E3", "E5", "E6", "E7", "E8", "E9", "E10", "E11", "E13", "E14", "E15", "E16", "E17", "E18", "E20", "N1", "N4", "N5", "N7", "N8", "N10", "N15", "N16", "N17", "N19"],
  NLW: ["W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W10", "W11", "W12", "W13", "W14", "NW1", "NW2", "NW3", "NW5", "NW6", "NW7", "NW8", "NW9", "NW10", "NW11", "HA0", "HA1", "HA2", "HA3", "HA9", "TW1", "TW2", "TW3", "TW4", "TW5", "TW7", "TW8", "TW9", "TW11", "TW12", "TW13", "TW14"],
  SLE: ["SE1", "SE2", "SE3", "SE4", "SE5", "SE6", "SE7", "SE8", "SE9", "SE10", "SE12", "SE13", "SE14", "SE15", "SE16", "SE17", "SE18", "SE19", "SE20", "SE21", "SE22", "SE23", "SE24", "SE25", "SE26", "SE27", "SE28", "BR1", "BR2", "BR3", "BR5", "BR6", "BR7", "DA1", "DA2", "DA5", "DA6", "DA7", "DA8", "DA14", "DA15", "DA16", "DA17", "DA18"],
  SLW: ["SW1A", "SW1V", "SW2", "SW3", "SW4", "SW5", "SW6", "SW7", "SW8", "SW9", "SW10", "SW11", "SW12", "SW13", "SW14", "SW15", "SW16", "SW17", "SW18", "SW19", "SW20", "CR0", "CR2", "CR3", "CR4", "CR5", "CR7", "CR8", "KT1", "KT2", "KT3", "KT4", "KT5", "KT6", "KT7", "KT8", "SM1", "SM2", "SM3", "SM4", "SM5", "SM6"],
  OX: ["OX1", "OX2", "OX3", "OX4", "OX5", "OX7", "OX9", "OX10", "OX11", "OX12", "OX13", "OX14", "OX15", "OX16", "OX17", "OX18", "OX25", "OX26", "OX27", "OX28", "OX29", "OX33", "OX39", "OX44", "OX49"],
};

/**
 * Look up which Thames zone prefix a postcode district belongs to.
 * Returns null if the postcode is not in a Thames Water zone.
 */
export function getThamesZonePrefix(district: string): string | null {
  for (const [prefix, postcodes] of Object.entries(THAMES_ZONE_POSTCODES)) {
    if (postcodes.includes(district)) return prefix;
  }
  return null;
}

/**
 * Check if a postcode district is served by Thames Water zones.
 */
export function isThamesPostcode(district: string): boolean {
  return getThamesZonePrefix(district) !== null;
}
```

- [ ] **Step 2: Update the import script to use the shared module**

In `scripts/import-thames-water.ts`, replace the `ZONE_PREFIX_POSTCODES` declaration (lines 51-62) with:

```typescript
import { THAMES_ZONE_POSTCODES as ZONE_PREFIX_POSTCODES } from "../src/lib/thames-zones";
```

- [ ] **Step 3: Run existing tests**

Run: `npx vitest run`
Expected: PASS (no tests break)

- [ ] **Step 4: Commit**

```bash
git add src/lib/thames-zones.ts scripts/import-thames-water.ts
git commit -m "refactor: extract Thames zone mapping to shared module"
```

---

### Task 6: Wire Thames Water Data into the Pipeline

**Files:**
- Modify: `src/lib/db-writer.ts`
- Modify: `src/app/api/cron/refresh/route.ts:136-166`

- [ ] **Step 1: Add Thames data reader to db-writer.ts**

Add this function to the end of `src/lib/db-writer.ts` (before the final `writePostcodeData` function):

```typescript
import { getThamesZonePrefix } from "./thames-zones";

/**
 * Check if Thames Water zone data exists in drinking_water_readings
 * for a given postcode district. Returns the records if they exist.
 */
export async function getThamesReadings(
  district: string,
): Promise<{ determinand: string; value: number; unit: string; sampleDate: string }[] | null> {
  const prefix = getThamesZonePrefix(district);
  if (!prefix) return null;

  const db = getSupabase();
  const { data, error } = await db
    .from("drinking_water_readings")
    .select("determinand, value, unit, sample_date")
    .eq("postcode_district", district)
    .eq("source", "thames_water_zone")
    .order("sample_date", { ascending: false })
    .limit(100);

  if (error || !data || data.length === 0) return null;

  return data.map((r) => ({
    determinand: r.determinand,
    value: r.value,
    unit: r.unit,
    sampleDate: r.sample_date,
  }));
}
```

- [ ] **Step 2: Update the cron refresh to use Thames data as a fallback**

In `src/app/api/cron/refresh/route.ts`, add the Thames import at the top:

```typescript
import { getThamesReadings } from "@/lib/db-writer";
```

Then modify the processing loop (lines 136-166). Replace the `for (const district of batch)` block:

```typescript
for (const district of batch) {
  try {
    const seedData = await processPostcode(district);

    let streamRecords: StreamRecord[] = [];
    try {
      if (seedData) {
        const supplier = getSupplier(seedData.city);
        const streamSource = getStreamSource(supplier.id);
        if (streamSource) {
          const lsoas = await getLsoasForDistrict(district);
          if (lsoas.length > 0) {
            streamRecords = await fetchStreamData(streamSource, lsoas);
          }
        }

        // Thames Water fallback: if no Stream data, check for pre-imported zone data
        if (streamRecords.length === 0 && supplier.id === "thames-water") {
          const thamesData = await getThamesReadings(district);
          if (thamesData) {
            // Convert Thames readings to StreamRecord format for writePostcodeData
            streamRecords = thamesData.map((r) => ({
              sampleId: `thames-zone-${district}`,
              sampleDate: r.sampleDate,
              determinand: r.determinand,
              dwiCode: "",
              unit: r.unit,
              belowDetectionLimit: false,
              value: r.value,
              lsoa: "",
            }));
          }
        }
      }
    } catch {
      // Continue with EA-only data
    }

    if (seedData) {
      await writePostcodeData(seedData, streamRecords.length > 0 ? streamRecords : undefined);
      console.log(`  ✓ ${district}${streamRecords.length > 0 ? ` (${streamRecords.length} Stream records)` : ""}`);
    } else {
      console.log(`  ✗ ${district} — no data`);
    }
  } catch (err) {
    console.error(`  ✗ ${district}:`, err);
  }
  processed++;
}
```

- [ ] **Step 3: Run all tests**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/lib/db-writer.ts src/app/api/cron/refresh/route.ts
git commit -m "feat: pipeline falls back to Thames Water zone data when Stream unavailable"
```

---

### Task 7: Run Thames Water Import to Populate Data

**Files:** None (runs existing scripts)

This task populates the `drinking_water_readings` table with Thames Water zone data so the pipeline (Task 6) can read it.

- [ ] **Step 1: Verify Thames Water zone data exists**

Check if `data/thames-water/all-zones.json` exists:

```bash
ls -la data/thames-water/all-zones.json
```

If it doesn't exist, run the Python fetcher first:

```bash
python scripts/fetch-thames-water.py
```

- [ ] **Step 2: Run the Thames Water import script**

```bash
npx tsx scripts/import-thames-water.ts
```

Expected: Output like `Done! 215 postcodes updated, 5930 readings imported`

- [ ] **Step 3: Verify data in Supabase**

Run this SQL against Supabase to confirm:

```sql
SELECT COUNT(*) as readings, COUNT(DISTINCT postcode_district) as postcodes
FROM drinking_water_readings
WHERE source = 'thames_water_zone';
```

Expected: ~5,000+ readings across ~200+ postcodes.

- [ ] **Step 4: Verify page_data was updated**

```sql
SELECT COUNT(*) FROM page_data
WHERE data_source = 'stream'
AND postcode_district IN ('SW1A', 'E1', 'N1', 'SE1', 'W1');
```

Expected: These should now show `data_source = 'stream'` instead of `'ea-only'`.

---

### Task 8: Scottish Water Research

**Files:**
- Create: `docs/superpowers/specs/2026-04-06-scottish-water-research.md`

- [ ] **Step 1: Check DWQR for open data**

Search:
- `https://dwqr.scot` — look for data downloads, API, or annual reports
- `https://data.gov.scot` — search for "drinking water quality"
- `https://www.scottishwater.co.uk` — look for water quality data, zone reports, or APIs

Document what you find: data format, coverage level (zone, LSOA, postcode), update frequency.

- [ ] **Step 2: Check SEPA for environmental data**

Search:
- `https://www.sepa.org.uk` — look for water quality monitoring data
- This would be Scotland's equivalent of the EA API

- [ ] **Step 3: Write research findings document**

Create `docs/superpowers/specs/2026-04-06-scottish-water-research.md` with:

```markdown
# Scottish Water Data Sources — Research Findings

**Date:** 2026-04-06
**Goal:** Identify data sources for Scotland's 442 postcodes

## Sources Investigated

### 1. DWQR (dwqr.scot)
- [findings]

### 2. data.gov.scot
- [findings]

### 3. Scottish Water website
- [findings]

### 4. SEPA
- [findings]

## Recommendation
- [recommended approach, effort estimate]
```

- [ ] **Step 4: Commit research document**

```bash
git add docs/superpowers/specs/2026-04-06-scottish-water-research.md
git commit -m "docs: Scottish Water data source research findings"
```

---

## Execution Order

Tasks 1-4 are independent and can be parallelised. Tasks 5-6 depend on each other. Task 7 depends on Task 5. Task 8 is fully independent.

```
Task 1 (Cambridge Water) ──────────────┐
Task 2 (UU + Anglian services) ────────┤
Task 3 (Check Wessex/Bristol/Thames) ──┼── All independent
Task 4 (Fetch logic rewrite) ──────────┤
Task 8 (Scottish Water research) ──────┘

Task 5 (Thames zones shared module) ───→ Task 6 (Pipeline integration) ───→ Task 7 (Import data)
```
