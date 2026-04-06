# Data Freshness: Stream Sources, Fetch Logic & Thames Integration

**Date:** 2026-04-06
**Status:** Approved
**Goal:** Improve tap water data coverage from ~50% to ~65-70% of postcodes (with a path to ~85% after Scottish Water), and ensure existing coverage stays fresh automatically.

---

## Context

The pipeline runs every 5 minutes, processing 6 postcodes per batch across 2,821 UK postcode districts (~40hr full cycle). Two data sources feed it:

- **Stream Water Data Portal** — real tap water quality via ArcGIS (14 water companies)
- **Environment Agency API** — river/lake environmental readings (fallback)

Current state: 1,382 postcodes have Stream tap water data. **1,400 postcodes are "ea-only"** (no tap water data). The biggest gaps: Thames Water (427), Scottish Water (442), unmapped supplier (350).

Additionally, ~1,121 postcodes with Stream data are stuck on 2024 readings because the fetch logic doesn't try newer services when older ones still return data.

---

## Part 1: Stream Sources Config Update

**File:** `src/lib/stream-sources.ts`

### Add missing companies

**Cambridge Water** (new source):
- Service: `CAM_DomesticWaterQuality`
- Org: shared Stream org (`XxS6FebPX29TRGDJ`)
- Need to determine: geoField, fieldCase, dateFormat (query a sample record during implementation)

### Add no-year services to existing companies

These services may contain the latest data without a year suffix:

- **United Utilities**: add `United_Utilities_Domestic_Water_Quality` as first entry (currently only has 2023)
- **Anglian Water**: add `Anglian_Water_Domestic_Water_Quality` as first entry (currently only has 2024)

### Check for new companies

During implementation, query the Stream org for:
- **Wessex Water** (58 ea-only postcodes)
- **Bristol Water** (34 ea-only postcodes)
- **Thames Water** (427 ea-only postcodes — unlikely on Stream but worth checking)

### Ensure newest-first ordering

All `services` arrays must be ordered newest year first. The fetch logic depends on this.

---

## Part 2: Fetch Logic Fix

**File:** `src/lib/stream-api.ts` — `fetchStreamData` function

### Current behaviour (broken)

```
for each hardcoded service:
  if returns data → return immediately
if no data from any hardcoded service:
  discover new services
  try each discovered service
```

Problem: if the 2024 service returns data, the 2025/2026 service is never tried.

### New behaviour

```
bestRecords = null
bestYear = 0

for each hardcoded service (newest first):
  records = query(service)
  if records.length > 0:
    bestRecords = records
    bestYear = service.year
    break  // fast path: newest hardcoded worked

newestHardcodedYear = max(services.map(s => s.year))

if bestYear < newestHardcodedYear OR bestRecords is null:
  // Our best data is stale or empty — check for newer services
  discovered = discoverServices(orgId)
  for each discovered service:
    discoveredYear = extractYear(serviceName)
    if discoveredYear <= bestYear: skip  // already have newer
    if already tried: skip
    records = query(discoveredService)
    if records.length > 0:
      log(`[stream-api] Discovered newer service: ${serviceName}`)
      bestRecords = records
      bestYear = discoveredYear
      break

return bestRecords ?? []
```

### Key properties

- **Fast path preserved:** If newest hardcoded service returns data, no discovery call (same as today)
- **Self-healing:** When a company publishes a 2026 service, discovery finds it even if config still says 2025
- **Logged:** New service discoveries are logged so config can be updated
- **No extra API calls in the happy path:** Only fires discovery when stale

### Year extraction for no-year services

Services without a year in the name (e.g., `Affinity_Water_Domestic_Water_Quality`) should be treated as `currentYear` for comparison purposes — they're assumed to contain the latest data.

---

## Part 3: Thames Water Pipeline Integration

### Approach: Pre-parsed zone data table

Thames Water publishes zone-level PDFs via their API. The existing Python script (`scripts/fetch-thames-water.py`) downloads and parses these. The existing TypeScript script (`scripts/import-thames-water.ts`) maps zones to postcodes and inserts to Supabase.

Rather than running Python in Vercel, we keep the existing scripts as the data source and ensure the pipeline reads from the imported data.

### New table: `thames_zone_readings`

```sql
CREATE TABLE thames_zone_readings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_code text NOT NULL,         -- e.g., "NLE-01"
  parameter text NOT NULL,
  unit text,
  regulatory_limit numeric,
  min_value numeric,
  mean_value numeric,
  max_value numeric,
  contraventions integer DEFAULT 0,
  year integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_thames_zone_year ON thames_zone_readings(zone_code, year);
```

### Zone-to-postcode mapping

Already exists in `import-thames-water.ts` as `ZONE_PREFIX_POSTCODES`. Extract this mapping to a shared module (`src/lib/thames-zones.ts`) so both the import script and the pipeline can use it.

### Pipeline integration

In `src/lib/db-writer.ts` or the batch processor:

1. When processing a Thames Water postcode, look up its zone(s) via the mapping
2. Query `thames_zone_readings` for the latest year's data for those zones
3. Write to `drinking_water_readings` with source `thames_water_zone` (already a valid source type)
4. Update `page_data` with tap water scores instead of ea-only

### Data refresh

- **For now:** Run the existing Python + TypeScript scripts manually to populate `thames_zone_readings`
- **Later:** GitHub Action on a monthly cron to re-fetch Thames PDFs and update the table
- Thames publishes annually, so monthly refresh is more than sufficient

---

## Part 4: Scottish Water Research

### Goal

Identify available data sources for Scotland's 442 postcodes. Research only — no scraper built in this iteration.

### Targets

1. **DWQR** (Drinking Water Quality Regulator for Scotland) — check for open data API or downloadable datasets
2. **Scottish Water website** — check for annual quality reports with zone/postcode-level data
3. **data.gov.scot** — Scotland's open data portal, search for water quality datasets
4. **SEPA** (Scottish Environment Protection Agency) — may have environmental readings similar to EA

### Output

A findings document at `docs/superpowers/specs/2026-04-06-scottish-water-research.md` with:
- What data exists and in what format
- Coverage level (zone, LSOA, postcode)
- Recommended import approach
- Effort estimate

---

## Out of Scope

- Unmapped 350 postcodes (supplier assignment) — deferred
- Scottish Water scraper — pending research findings
- GitHub Action for automated Thames refresh — deferred to after manual import proves out
- Wessex/Bristol Water scrapers — only added if found on Stream Portal

---

## Expected Impact

| Change | Postcodes affected | Before | After |
|--------|-------------------|--------|-------|
| Stream source config fixes | ~500+ | 2024 data or missing | 2025/2026 data |
| Fetch logic self-healing | All 1,382 stream postcodes | Stuck on stale service | Auto-discovers newer |
| Thames integration | 427 | ea-only (rivers) | Zone-level tap water |
| Cambridge Water | ~10-20 | ea-only | Stream tap water |
| **Total improvement** | **~950+** postcodes improved | | |

Coverage moves from ~50% to ~65-70% with tap water data. Scottish Water research paves the way for the remaining ~442.
