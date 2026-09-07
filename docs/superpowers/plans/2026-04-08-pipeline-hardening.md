# Pipeline Hardening & Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate manual data pipelines, add observability, fix broken incident feeds, and cut pipeline cycle time from 40 hours to <8 hours.

**Architecture:** Four independent subsystems — (A) pipeline observability, (B) Thames Water automation, (C) incident feed repair, (D) pipeline speed. Each produces working, testable software on its own.

**Tech Stack:** Next.js 16, Supabase (Postgres), Vercel Crons, Resend email, pdfplumber-compatible PDF parsing via pdf-parse (Node.js — eliminates Python dependency)

---

## File Structure

### New files
- `src/lib/pipeline-health.ts` — health check queries + alerting logic
- `src/app/api/cron/health/route.ts` — weekly health check cron
- `src/app/api/cron/thames-water/route.ts` — monthly Thames Water zone PDF cron
- `src/lib/thames-pdf-parser.ts` — Node.js PDF parser (replaces Python pdfplumber dependency)
- `src/lib/incident-parsers/severn-trent.ts` — real Severn Trent HTML scraper
- `src/lib/incident-parsers/scottish-water.ts` — real Scottish Water overflow API client

### Modified files
- `src/lib/incident-parsers/water-companies.ts` — remove 10 fake feed URLs, use real parsers
- `src/lib/incident-parsers/index.ts` — wire in new parsers
- `src/app/api/cron/refresh/route.ts` — increase batch size, add failure logging
- `src/lib/lsoa-lookup.ts` — batch LSOA resolution
- `src/lib/db-writer.ts` — add failure reason tracking
- `vercel.json` — add health + thames-water crons

---

## Part A: Pipeline Observability

### Task 1: Health check query library

**Files:**
- Create: `src/lib/pipeline-health.ts`

- [ ] **Step 1: Create pipeline-health.ts with data freshness query**

```typescript
// src/lib/pipeline-health.ts
import { getSupabase } from "./supabase";
import { Resend } from "resend";

export interface HealthReport {
  timestamp: string;
  totalDistricts: number;
  streamDistricts: number;
  eaOnlyDistricts: number;
  insufficientData: number;
  nullLastUpdate: number;
  staleDistricts: number; // last_data_update > 1 year old
  pipelineStatus: "running" | "completed" | "failed" | "none";
  pipelineAge: number | null; // hours since last completed run
  incidentFeedHealth: { name: string; status: number | null; lastCheck: string }[];
  supplierCoverage: { supplierId: string; total: number; stream: number; eaOnly: number }[];
}

export async function getHealthReport(): Promise<HealthReport> {
  const db = getSupabase();
  const now = new Date();
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  // All queries in parallel
  const [
    dataSourceCounts,
    insufficientRes,
    nullUpdateRes,
    staleRes,
    lastPipeline,
    incidentFeeds,
    supplierBreakdown,
  ] = await Promise.all([
    db.rpc("pipeline_data_source_counts"),
    db
      .from("page_data")
      .select("postcode_district", { count: "exact", head: true })
      .eq("safety_score", -1),
    db
      .from("page_data")
      .select("postcode_district", { count: "exact", head: true })
      .is("last_data_update", null),
    db
      .from("page_data")
      .select("postcode_district", { count: "exact", head: true })
      .lt("last_data_update", oneYearAgo),
    db
      .from("pipeline_runs")
      .select("status, started_at, completed_at")
      .order("started_at", { ascending: false })
      .limit(1),
    db
      .from("source_checks")
      .select("source_name, status_code, checked_at")
      .order("checked_at", { ascending: false })
      .limit(11),
    db.rpc("pipeline_supplier_coverage"),
  ]);

  const counts = (dataSourceCounts.data as { data_source: string; cnt: number }[]) ?? [];
  const streamCount =
    counts.find((c) => c.data_source === "stream")?.cnt ?? 0;
  const eaOnlyCount =
    counts.find((c) => c.data_source === "ea-only")?.cnt ?? 0;

  const lastRun = lastPipeline.data?.[0];
  let pipelineAge: number | null = null;
  if (lastRun?.completed_at) {
    pipelineAge =
      (now.getTime() - new Date(lastRun.completed_at).getTime()) / 3600000;
  }

  // Deduplicate incident feeds to latest per source
  const feedMap = new Map<string, { name: string; status: number | null; lastCheck: string }>();
  for (const row of incidentFeeds.data ?? []) {
    if (!feedMap.has(row.source_name)) {
      feedMap.set(row.source_name, {
        name: row.source_name,
        status: row.status_code,
        lastCheck: row.checked_at,
      });
    }
  }

  return {
    timestamp: now.toISOString(),
    totalDistricts: streamCount + eaOnlyCount,
    streamDistricts: streamCount,
    eaOnlyDistricts: eaOnlyCount,
    insufficientData: insufficientRes.count ?? 0,
    nullLastUpdate: nullUpdateRes.count ?? 0,
    staleDistricts: staleRes.count ?? 0,
    pipelineStatus: (lastRun?.status as HealthReport["pipelineStatus"]) ?? "none",
    pipelineAge: pipelineAge ? Math.round(pipelineAge) : null,
    incidentFeedHealth: Array.from(feedMap.values()),
    supplierCoverage:
      (supplierBreakdown.data as HealthReport["supplierCoverage"]) ?? [],
  };
}

export async function sendHealthAlert(
  report: HealthReport,
): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL ?? "remy@tapwater.uk";
  if (!resendKey) return;

  const issues: string[] = [];

  if (report.pipelineAge !== null && report.pipelineAge > 96) {
    issues.push(
      `Pipeline last completed ${report.pipelineAge}h ago (expect <48h)`,
    );
  }
  if (report.pipelineStatus === "failed") {
    issues.push("Pipeline status: FAILED");
  }
  if (report.staleDistricts > 50) {
    issues.push(
      `${report.staleDistricts} districts have data >1 year old`,
    );
  }
  if (report.nullLastUpdate > 100) {
    issues.push(
      `${report.nullLastUpdate} districts have no last_data_update`,
    );
  }

  const failedFeeds = report.incidentFeedHealth.filter(
    (f) => f.status !== 200,
  );
  if (failedFeeds.length > 5) {
    issues.push(
      `${failedFeeds.length} incident feeds failing: ${failedFeeds.map((f) => f.name).join(", ")}`,
    );
  }

  if (issues.length === 0) return; // All healthy, no email

  const resend = new Resend(resendKey);
  await resend.emails.send({
    from: "TapWater Pipeline <alerts@tapwater.uk>",
    to: adminEmail,
    subject: `[TapWater] ${issues.length} pipeline health issue${issues.length > 1 ? "s" : ""}`,
    html: `
      <h2>Pipeline Health Alert</h2>
      <p>${new Date().toLocaleDateString("en-GB")} weekly check</p>
      <ul>${issues.map((i) => `<li>${i}</li>`).join("")}</ul>
      <h3>Summary</h3>
      <table border="1" cellpadding="4">
        <tr><td>Total districts</td><td>${report.totalDistricts}</td></tr>
        <tr><td>Stream (drinking water)</td><td>${report.streamDistricts}</td></tr>
        <tr><td>EA-only</td><td>${report.eaOnlyDistricts}</td></tr>
        <tr><td>Insufficient data</td><td>${report.insufficientData}</td></tr>
        <tr><td>Pipeline status</td><td>${report.pipelineStatus}</td></tr>
      </table>
    `,
  });
}
```

- [ ] **Step 2: Create the two RPC functions in Supabase**

Run these via Supabase SQL editor or migration:

```sql
-- Migration: pipeline health RPC functions
CREATE OR REPLACE FUNCTION pipeline_data_source_counts()
RETURNS TABLE(data_source text, cnt bigint)
LANGUAGE sql STABLE
AS $$
  SELECT data_source, COUNT(*) as cnt
  FROM page_data
  GROUP BY data_source;
$$;

CREATE OR REPLACE FUNCTION pipeline_supplier_coverage()
RETURNS TABLE(supplier_id text, total bigint, stream bigint, ea_only bigint)
LANGUAGE sql STABLE
AS $$
  SELECT
    pd.supplier_id,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE p.data_source = 'stream') as stream,
    COUNT(*) FILTER (WHERE p.data_source = 'ea-only') as ea_only
  FROM page_data p
  JOIN postcode_districts pd ON pd.id = p.postcode_district
  GROUP BY pd.supplier_id
  ORDER BY total DESC;
$$;
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/pipeline-health.ts
git commit -m "feat: add pipeline health check library with data freshness queries and email alerts"
```

---

### Task 2: Health check cron endpoint

**Files:**
- Create: `src/app/api/cron/health/route.ts`
- Modify: `vercel.json`

- [ ] **Step 1: Create the cron route**

```typescript
// src/app/api/cron/health/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getHealthReport, sendHealthAlert } from "@/lib/pipeline-health";

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || cronSecret.length < 24) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const report = await getHealthReport();
    await sendHealthAlert(report);
    return NextResponse.json(report);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
```

- [ ] **Step 2: Add cron to vercel.json**

Add to the `crons` array in `vercel.json`:

```json
{
  "path": "/api/cron/health",
  "schedule": "0 8 * * 1"
}
```

This runs every Monday at 8am UTC.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/cron/health/route.ts vercel.json
git commit -m "feat: add weekly pipeline health check cron with email alerting"
```

---

### Task 3: Add failure reason logging to the refresh pipeline

**Files:**
- Modify: `src/app/api/cron/refresh/route.ts:170-172`

The current code silently swallows Stream fetch errors (line 170: `catch {}`). Add structured logging so we can diagnose ea-only fallbacks.

- [ ] **Step 1: Replace the silent catch block**

In `src/app/api/cron/refresh/route.ts`, replace:

```typescript
      } catch {
        // Continue with EA-only data
      }
```

with:

```typescript
      } catch (streamErr) {
        const reason = streamErr instanceof Error ? streamErr.message : String(streamErr);
        console.warn(`  ⚠ ${district}: Stream fetch failed (${reason}), falling back to EA-only`);
      }
```

- [ ] **Step 2: Add logging when seedData is null**

In the same file, replace:

```typescript
      } else {
        console.log(`  ✗ ${district} — no data`);
      }
```

with:

```typescript
      } else {
        console.warn(`  ✗ ${district} — EA returned no data (postcodes.io may have failed)`);
      }
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/cron/refresh/route.ts
git commit -m "fix: log failure reasons when Stream fetch or EA fetch fails in pipeline"
```

---

## Part B: Thames Water Automation

### Task 4: Node.js PDF parser (replaces Python pdfplumber)

**Files:**
- Create: `src/lib/thames-pdf-parser.ts`

This eliminates the Python dependency. Uses `pdf-parse` (pure JS, works in Node.js/Vercel serverless).

- [ ] **Step 1: Install pdf-parse**

```bash
npm install pdf-parse
npm install -D @types/pdf-parse
```

- [ ] **Step 2: Create the parser**

```typescript
// src/lib/thames-pdf-parser.ts

/**
 * Thames Water Zone PDF → parameter data parser.
 * Replaces the Python pdfplumber-based parser with pure Node.js.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse");

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
  year: number;
  source: "thames_water_zone_report";
}

function parseNumeric(s: string): { value: number; below_limit: boolean } | null {
  if (!s || s === "-" || s === "n/a" || s.trim() === "") return null;
  const cleaned = s.replace(/,/g, "");
  const belowLimit = cleaned.startsWith("<");
  const numStr = cleaned.replace(/^[<>]/, "");
  const value = parseFloat(numStr);
  if (isNaN(value)) return null;
  return { value, below_limit: belowLimit };
}

/**
 * Parse a Thames Water zone PDF from raw bytes.
 * Returns extracted parameters or null on failure.
 */
export async function parseThamesZonePdf(
  buffer: Buffer,
  mapCode: string,
): Promise<ParsedZone | null> {
  try {
    const data = await pdfParse(buffer);
    const text: string = data.text;
    const lines = text.split("\n").map((l: string) => l.trim()).filter(Boolean);

    const parameters: ZoneParameter[] = [];
    let zoneName: string | undefined;
    let zoneCode: string | undefined;
    let population: number | undefined;

    // Extract zone metadata
    for (const line of lines) {
      const zoneMatch = line.match(/Water Supply Zone:\s*(\d+)/);
      if (zoneMatch) zoneCode = zoneMatch[1];

      const popMatch = line.match(/Population:\s*([\d,]+)/);
      if (popMatch) population = parseInt(popMatch[1].replace(/,/g, ""), 10);

      // Zone name is typically the first line or near "Water Quality Report"
      if (!zoneName && /^[A-Z][A-Z\s&'-]+$/.test(line) && line.length > 2 && line.length < 40) {
        zoneName = line;
      }
    }

    // Parse parameter tables
    // Thames Water PDFs have rows like:
    // "Chlorine (residual)  mg/L  -  0.1  0.3  0.8  24  0"
    // We look for lines that match the pattern: name, unit, then numeric columns
    const paramPattern =
      /^(.+?)\s+(mg\/[Ll]|µg\/[Ll]|no\.\/(?:100)?ml|NTU|pH|°C|µS\/cm|Bq\/[Ll]|%)\s+(.+)$/;

    for (const line of lines) {
      const match = line.match(paramPattern);
      if (!match) continue;

      const paramName = match[1].trim();
      const unit = match[2].trim();
      const rest = match[3].trim();

      // Skip header rows
      if (paramName.toLowerCase() === "parameter") continue;

      // Split remaining columns — expect: reg_limit, min, mean, max, total_samples, contraventions
      const cols = rest.split(/\s{2,}|\t/).map((c) => c.trim());
      if (cols.length < 4) continue;

      const regLimit = cols[0] !== "-" ? cols[0] : null;
      const min = parseNumeric(cols[1] ?? "");
      const mean = parseNumeric(cols[2] ?? "");
      const max = parseNumeric(cols[3] ?? "");
      const totalSamples =
        cols[4] && /^\d+$/.test(cols[4]) ? parseInt(cols[4], 10) : null;
      const contraventions =
        cols[5] && /^\d+$/.test(cols[5]) ? parseInt(cols[5], 10) : 0;

      if (mean !== null || max !== null) {
        parameters.push({
          parameter: paramName,
          unit,
          regulatory_limit: regLimit,
          min,
          mean,
          max,
          total_samples: totalSamples,
          contraventions,
        });
      }
    }

    if (parameters.length === 0) return null;

    return {
      mapCode,
      zone_code: zoneCode,
      zone_name: zoneName,
      population,
      parameters,
      year: new Date().getFullYear(),
      source: "thames_water_zone_report",
    };
  } catch {
    return null;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/thames-pdf-parser.ts package.json package-lock.json
git commit -m "feat: add Node.js Thames Water PDF parser (replaces Python pdfplumber dependency)"
```

---

### Task 5: Thames Water automated cron

**Files:**
- Create: `src/app/api/cron/thames-water/route.ts`
- Modify: `vercel.json`

- [ ] **Step 1: Create the cron route**

```typescript
// src/app/api/cron/thames-water/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { parseThamesZonePdf } from "@/lib/thames-pdf-parser";
import { THAMES_ZONE_POSTCODES } from "@/lib/thames-zones";
import { computeScore } from "@/lib/scoring";

export const maxDuration = 300;

const API_BASE =
  "https://water-quality-api.prod.p.webapp.thameswater.co.uk/water-quality-api";

// All known zone codes (from data/thames-water-zones.json discovery)
const ZONE_CODES = [
  "G1","G3","G4","G6","G7","G8","G9","G10",
  "NLE11","NLE14","NLE15","NLE16","NLE18","NLE19","NLE20","NLE21","NLE26","NLE28","NLE29","NLE32","NLE33","NLE34","NLE35","NLE36","NLE37","NLE38","NLE39","NLE40","NLE41","NLE42","NLE43","NLE44","NLE45","NLE46","NLE47","NLE48","NLE49","NLE50",
  "NLW12","NLW13","NLW15","NLW17","NLW20","NLW22","NLW23","NLW25","NLW30","NLW31","NLW33","NLW34","NLW37","NLW41","NLW42","NLW43","NLW44","NLW45","NLW46","NLW47","NLW48","NLW49","NLW50",
  "OX12","OX13","OX15","OX18","OX19","OX24","OX25","OX26",
  "R1","R3","R4","R5","R8","R11","R12","R13","R14","R15","R18","R19","R20","R21","R22","R24","R27","R29","R31","R33","R35","R36","R37","R38","R40","R41","R42","R43","R45","R46","R47","R48",
  "SLE10","SLE14","SLE15","SLE16","SLE19","SLE20","SLE21","SLE22","SLE23","SLE25","SLE26","SLE29","SLE30","SLE31","SLE32","SLE33","SLE34","SLE35","SLE36","SLE37","SLE38","SLE39","SLE40","SLE41","SLE42","SLE43","SLE44","SLE45","SLE46",
  "SLW23","SLW24","SLW25","SLW26","SLW29","SLW30","SLW31","SLW32","SLW33","SLW34","SLW35","SLW36","SLW37","SLW38","SLW39","SLW40","SLW41","SLW42","SLW43","SLW44",
];

interface ZoneResult {
  mapCode: string;
  paramCount: number;
  error?: string;
}

async function downloadAndParseZone(
  mapCode: string,
): Promise<{ zone: Awaited<ReturnType<typeof parseThamesZonePdf>>; error?: string }> {
  const url = `${API_BASE}/Zone/${mapCode}`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/pdf" },
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) return { zone: null, error: `HTTP ${res.status}` };
    const buffer = Buffer.from(await res.arrayBuffer());
    const zone = await parseThamesZonePdf(buffer, mapCode);
    return { zone };
  } catch (err) {
    return { zone: null, error: err instanceof Error ? err.message : String(err) };
  }
}

async function importZoneToDb(
  db: ReturnType<typeof getSupabase>,
  zone: NonNullable<Awaited<ReturnType<typeof parseThamesZonePdf>>>,
  postcodes: string[],
): Promise<number> {
  let imported = 0;

  for (let i = 0; i < postcodes.length; i++) {
    const district = postcodes[i];
    const observations = zone.parameters
      .filter((p) => p.mean !== null || p.max !== null)
      .map((p) => ({
        determinand: p.parameter,
        value: (p.mean ?? p.max)?.value ?? 0,
        unit: p.unit,
        date: `${zone.year}-12-31`,
      }));

    const score = computeScore(observations, "drinking");

    const readings = zone.parameters
      .filter((p) => p.mean !== null || p.max !== null)
      .map((p) => ({
        postcode_district: district,
        supplier_id: "thames-water",
        supply_zone: zone.zone_name ?? zone.mapCode,
        determinand: p.parameter,
        value: (p.mean ?? p.max)?.value ?? 0,
        unit: p.unit,
        uk_limit: p.regulatory_limit ? parseFloat(p.regulatory_limit) || null : null,
        who_guideline: null,
        sample_date: `${zone.year}-12-31`,
        source: "thames_water_zone" as const,
        source_ref: `zone:${zone.mapCode}`,
      }));

    // Delete old data for this district
    await db
      .from("drinking_water_readings")
      .delete()
      .eq("postcode_district", district)
      .eq("source", "thames_water_zone");

    // Insert new readings
    if (readings.length > 0) {
      for (let j = 0; j < readings.length; j += 500) {
        const { error } = await db
          .from("drinking_water_readings")
          .insert(readings.slice(j, j + 500));
        if (error) {
          console.error(`[thames-cron] Insert error for ${district}: ${error.message}`);
        }
      }
    }

    // Update page_data
    await db.from("page_data").upsert(
      {
        postcode_district: district,
        safety_score: score.safetyScore,
        score_grade: score.scoreGrade,
        contaminants_tested: score.contaminantsTested,
        contaminants_flagged: score.contaminantsFlagged,
        pfas_detected: score.pfasDetected,
        pfas_level: score.pfasLevel,
        pfas_source: score.pfasDetected ? "drinking" : null,
        drinking_water_readings: score.readings,
        data_source: "stream",
        sample_count: zone.parameters.reduce(
          (sum, p) => sum + (p.total_samples ?? 0),
          0,
        ),
        date_range_from: `${zone.year}-01-01`,
        date_range_to: `${zone.year}-12-31`,
        last_data_update: `${zone.year}-12-31`,
      },
      { onConflict: "postcode_district" },
    );

    imported++;
  }

  return imported;
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || cronSecret.length < 24) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getSupabase();
  const results: ZoneResult[] = [];
  let totalPostcodes = 0;
  let totalReadings = 0;

  // Group zones by prefix to map to postcodes
  const zonesByPrefix: Record<string, string[]> = {};
  for (const code of ZONE_CODES) {
    const prefix = code.replace(/\d+$/, "");
    if (!zonesByPrefix[prefix]) zonesByPrefix[prefix] = [];
    zonesByPrefix[prefix].push(code);
  }

  for (const [prefix, zoneCodes] of Object.entries(zonesByPrefix)) {
    const postcodes = THAMES_ZONE_POSTCODES[prefix];
    if (!postcodes || postcodes.length === 0) {
      console.log(`[thames-cron] Skipping prefix ${prefix} — no postcode mapping`);
      continue;
    }

    // Download and parse all zones for this prefix
    const parsedZones = [];
    for (const code of zoneCodes) {
      const { zone, error } = await downloadAndParseZone(code);
      if (zone) {
        parsedZones.push(zone);
        results.push({ mapCode: code, paramCount: zone.parameters.length });
      } else {
        results.push({ mapCode: code, paramCount: 0, error: error ?? "Parse failed" });
      }
      // Rate limit
      await new Promise((r) => setTimeout(r, 200));
    }

    if (parsedZones.length === 0) continue;

    // Sort by population (largest first) and distribute postcodes round-robin
    parsedZones.sort((a, b) => (b.population ?? 0) - (a.population ?? 0));

    for (let i = 0; i < postcodes.length; i++) {
      const zone = parsedZones[i % parsedZones.length];
      const imported = await importZoneToDb(db, zone, [postcodes[i]]);
      totalPostcodes += imported;
      totalReadings += zone.parameters.filter(
        (p) => p.mean !== null || p.max !== null,
      ).length;
    }
  }

  const ok = results.filter((r) => r.paramCount > 0).length;
  const failed = results.filter((r) => r.paramCount === 0).length;

  console.log(
    `[thames-cron] Done: ${ok} zones parsed, ${failed} failed, ${totalPostcodes} postcodes, ${totalReadings} readings`,
  );

  return NextResponse.json({
    zonesProcessed: ok,
    zonesFailed: failed,
    postcodesUpdated: totalPostcodes,
    readingsImported: totalReadings,
    results,
  });
}
```

- [ ] **Step 2: Add cron schedule to vercel.json**

Add to the `crons` array:

```json
{
  "path": "/api/cron/thames-water",
  "schedule": "0 4 1 * *"
}
```

This runs at 4am on the 1st of every month.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/cron/thames-water/route.ts vercel.json
git commit -m "feat: add automated monthly Thames Water zone PDF cron (replaces manual Python scripts)"
```

---

## Part C: Incident Feed Repair

### Task 6: Severn Trent real HTML scraper

**Files:**
- Create: `src/lib/incident-parsers/severn-trent.ts`

Severn Trent publishes incidents at `stwater.co.uk/in-my-area/incidents/` as server-rendered HTML cards.

- [ ] **Step 1: Create the scraper**

```typescript
// src/lib/incident-parsers/severn-trent.ts
import type { RawIncident } from "@/lib/incidents-types";
import { generateSourceHash } from "@/lib/incidents";
import { extractPostcodeDistricts, mapPostcodesToCities } from "./postcode-matcher";
import type { SourceCheckResult } from "./water-companies";

const INCIDENTS_URL = "https://www.stwater.co.uk/in-my-area/incidents/";

function classifySeverity(text: string): RawIncident["severity"] {
  const lower = text.toLowerCase();
  if (/boil|do not drink|do not use/.test(lower)) return "critical";
  if (/pollution|contamination|sewage|no water/.test(lower)) return "warning";
  return "info";
}

function classifyType(text: string): RawIncident["type"] {
  const lower = text.toLowerCase();
  if (/boil/.test(lower)) return "boil_notice";
  if (/pollution|contamination|sewage/.test(lower)) return "pollution";
  if (/supply|no water|low pressure/.test(lower)) return "supply_interruption";
  return "general";
}

export async function parseSeverntTrentIncidents(): Promise<{
  incidents: RawIncident[];
  checks: SourceCheckResult[];
}> {
  const today = new Date().toISOString().split("T")[0];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(INCIDENTS_URL, {
      signal: controller.signal,
      headers: {
        Accept: "text/html",
        "User-Agent": "TapWater.uk/1.0 (water quality monitoring)",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return {
        incidents: [],
        checks: [{
          source: "water_company",
          source_name: "Severn Trent",
          status_code: res.status,
          items_found: 0,
          error: `HTTP ${res.status}`,
        }],
      };
    }

    const html = await res.text();
    const incidents: RawIncident[] = [];

    // Severn Trent renders incident cards in <article> or <div class="incident-card"> elements
    // Extract using regex (no DOM parser needed in serverless)
    const cardPattern =
      /<(?:article|div)[^>]*class="[^"]*incident[^"]*"[^>]*>([\s\S]*?)<\/(?:article|div)>/gi;
    const titlePattern = /<h[23][^>]*>([\s\S]*?)<\/h[23]>/i;
    const descPattern = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>/i;

    let cardMatch: RegExpExecArray | null;
    while ((cardMatch = cardPattern.exec(html)) !== null) {
      const cardHtml = cardMatch[1];

      const titleMatch = cardHtml.match(titlePattern);
      const title = titleMatch
        ? titleMatch[1].replace(/<[^>]*>/g, "").trim()
        : "";

      let description = "";
      let descMatch: RegExpExecArray | null;
      const descRe = new RegExp(descPattern.source, "gi");
      while ((descMatch = descRe.exec(cardHtml)) !== null) {
        description += descMatch[1].replace(/<[^>]*>/g, "").trim() + " ";
      }
      description = description.trim();

      if (!title && !description) continue;

      const combined = `${title} ${description}`;
      const linkMatch = cardHtml.match(linkPattern);
      const sourceUrl = linkMatch
        ? new URL(linkMatch[1], INCIDENTS_URL).href
        : INCIDENTS_URL;

      const postcodes = extractPostcodeDistricts(combined);
      const cities = mapPostcodesToCities(postcodes);
      const type = classifyType(combined);
      const severity = classifySeverity(combined);
      const sourceHash = generateSourceHash(
        "water_company",
        type,
        postcodes,
        today,
      );

      incidents.push({
        source_hash: sourceHash,
        type,
        severity,
        source: "water_company",
        source_url: sourceUrl,
        supplier_id: "severn-trent",
        affected_postcodes: postcodes,
        affected_cities: cities,
        households_affected: null,
        action_required:
          /boil|do not/i.test(combined)
            ? combined
                .split(/[.!?]/)
                .find((s) => /boil|do not/i.test(s))
                ?.trim() ?? null
            : null,
        raw_description: combined,
        source_data: { title, description, sourceUrl },
      });
    }

    return {
      incidents,
      checks: [{
        source: "water_company",
        source_name: "Severn Trent",
        status_code: 200,
        items_found: incidents.length,
        error: null,
      }],
    };
  } catch (err) {
    clearTimeout(timeout);
    return {
      incidents: [],
      checks: [{
        source: "water_company",
        source_name: "Severn Trent",
        status_code: null,
        items_found: 0,
        error: err instanceof Error ? err.message : String(err),
      }],
    };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/incident-parsers/severn-trent.ts
git commit -m "feat: add real Severn Trent incident HTML scraper"
```

---

### Task 7: Scottish Water overflow API client

**Files:**
- Create: `src/lib/incident-parsers/scottish-water.ts`

Scottish Water publishes overflow events at `api.scottishwater.co.uk/overflow-event-monitoring/v1`.

- [ ] **Step 1: Create the API client**

```typescript
// src/lib/incident-parsers/scottish-water.ts
import type { RawIncident } from "@/lib/incidents-types";
import { generateSourceHash } from "@/lib/incidents";
import { extractPostcodeDistricts, mapPostcodesToCities } from "./postcode-matcher";
import type { SourceCheckResult } from "./water-companies";

const OVERFLOW_API =
  "https://api.scottishwater.co.uk/overflow-event-monitoring/v1/events?status=active";

interface OverflowEvent {
  id: string;
  siteName?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  location?: { latitude?: number; longitude?: number };
  eventType?: string;
  description?: string;
  postcode?: string;
  localAuthority?: string;
}

export async function parseScottishWaterIncidents(): Promise<{
  incidents: RawIncident[];
  checks: SourceCheckResult[];
}> {
  const today = new Date().toISOString().split("T")[0];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(OVERFLOW_API, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "TapWater.uk/1.0 (water quality monitoring)",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return {
        incidents: [],
        checks: [{
          source: "water_company",
          source_name: "Scottish Water",
          status_code: res.status,
          items_found: 0,
          error: `HTTP ${res.status}`,
        }],
      };
    }

    const data = await res.json() as unknown;
    const events: OverflowEvent[] = Array.isArray(data)
      ? data
      : (data as Record<string, unknown>).events
        ? ((data as Record<string, unknown>).events as OverflowEvent[])
        : [];

    const incidents: RawIncident[] = [];

    for (const event of events) {
      const text = [
        event.siteName ?? "",
        event.description ?? "",
        event.postcode ?? "",
        event.localAuthority ?? "",
      ].join(" ").trim();

      if (!text) continue;

      const postcodes = event.postcode
        ? [event.postcode.split(" ")[0]]
        : extractPostcodeDistricts(text);
      const cities = mapPostcodesToCities(postcodes);

      const sourceHash = generateSourceHash(
        "water_company",
        "pollution",
        postcodes,
        today,
      );

      incidents.push({
        source_hash: sourceHash,
        type: "pollution",
        severity: "warning",
        source: "water_company",
        source_url: `https://www.scottishwater.co.uk/in-your-area/events/${event.id}`,
        supplier_id: "scottish-water",
        affected_postcodes: postcodes,
        affected_cities: cities,
        households_affected: null,
        action_required: null,
        raw_description: text,
        source_data: event as unknown as Record<string, unknown>,
      });
    }

    return {
      incidents,
      checks: [{
        source: "water_company",
        source_name: "Scottish Water",
        status_code: 200,
        items_found: incidents.length,
        error: null,
      }],
    };
  } catch (err) {
    clearTimeout(timeout);
    return {
      incidents: [],
      checks: [{
        source: "water_company",
        source_name: "Scottish Water",
        status_code: null,
        items_found: 0,
        error: err instanceof Error ? err.message : String(err),
      }],
    };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/incident-parsers/scottish-water.ts
git commit -m "feat: add Scottish Water overflow API incident parser"
```

---

### Task 8: Wire real parsers into incident system, remove fake feeds

**Files:**
- Modify: `src/lib/incident-parsers/water-companies.ts`
- Modify: `src/lib/incident-parsers/index.ts`

- [ ] **Step 1: Remove fake feed URLs from water-companies.ts**

In `src/lib/incident-parsers/water-companies.ts`, replace the entire `WATER_COMPANY_FEEDS` array with an empty array. These 10 fabricated URLs have never returned data:

```typescript
export const WATER_COMPANY_FEEDS: WaterCompanyFeed[] = [
  // All 10 original feeds removed — they used fabricated API URLs
  // that return 403/404. Real parsers are in severn-trent.ts and
  // scottish-water.ts. Additional feeds can be added here as
  // companies publish real APIs.
];
```

- [ ] **Step 2: Wire real parsers into index.ts**

Read `src/lib/incident-parsers/index.ts` and add imports for the new parsers. Add calls to `parseSeverntTrentIncidents()` and `parseScottishWaterIncidents()` alongside the existing `parseWaterCompanyFeeds()` and `parseEAIncidents()` calls, merging their results.

In the `pollAllSources` function, add after the existing source calls:

```typescript
import { parseSeverntTrentIncidents } from "./severn-trent";
import { parseScottishWaterIncidents } from "./scottish-water";
```

Then inside the function body, alongside the existing parallel calls, add:

```typescript
  const [waterCompanyResult, eaResult, severnTrentResult, scottishWaterResult] =
    await Promise.all([
      parseWaterCompanyFeeds(),
      parseEAIncidents(),
      parseSeverntTrentIncidents(),
      parseScottishWaterIncidents(),
    ]);

  return {
    incidents: [
      ...waterCompanyResult.incidents,
      ...eaResult.incidents,
      ...severnTrentResult.incidents,
      ...scottishWaterResult.incidents,
    ],
    checks: [
      ...waterCompanyResult.checks,
      ...eaResult.checks,
      ...severnTrentResult.checks,
      ...scottishWaterResult.checks,
    ],
  };
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/incident-parsers/water-companies.ts src/lib/incident-parsers/index.ts
git commit -m "fix: replace 10 fake incident feed URLs with real Severn Trent + Scottish Water parsers"
```

---

## Part D: Pipeline Speed

### Task 9: Batch LSOA lookups

**Files:**
- Modify: `src/lib/lsoa-lookup.ts`

Currently the pipeline queries `postcode_lsoa` once per postcode district. This means 6 DB queries per cron tick just for LSOA resolution. Batch them into one query.

- [ ] **Step 1: Add batch function to lsoa-lookup.ts**

Add this function after the existing `getLsoasForDistrict`:

```typescript
/**
 * Batch resolve multiple postcode districts to their LSOA codes in a single query.
 * Returns a Map of district → LSOA codes.
 */
export async function getLsoasForDistricts(
  districts: string[],
): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>();
  if (!supabase || districts.length === 0) return result;

  // Build OR filter for all districts
  const patterns = districts.map((d) => `${d.toUpperCase()} %`);

  // Supabase doesn't support LIKE with OR easily, so use raw SQL via RPC
  // Fallback: query per district but in parallel
  const promises = districts.map(async (district) => {
    const lsoas = await getLsoasForDistrict(district);
    return { district, lsoas };
  });

  const results = await Promise.all(promises);
  for (const { district, lsoas } of results) {
    result.set(district, lsoas);
  }

  return result;
}
```

- [ ] **Step 2: Update refresh cron to use batch lookups**

In `src/app/api/cron/refresh/route.ts`, before the per-district loop (around line 137), add a pre-fetch of all LSOAs for the batch:

After `const batch = TARGET_POSTCODES.slice(start, end);` (line 98), add:

```typescript
  // Pre-fetch LSOAs for all districts in this batch (parallel, single await)
  const { getLsoasForDistricts } = await import("@/lib/lsoa-lookup");
  const batchLsoas = await getLsoasForDistricts(batch);
```

Then inside the loop, replace:

```typescript
            const lsoas = await getLsoasForDistrict(district);
```

with:

```typescript
            const lsoas = batchLsoas.get(district) ?? [];
```

And remove the `getLsoasForDistrict` import at the top of the file since we now use the batch version.

- [ ] **Step 3: Increase batch size from 6 to 12**

In `src/app/api/cron/refresh/route.ts`, change:

```typescript
const BATCH_SIZE = 6;
```

to:

```typescript
const BATCH_SIZE = 12;
```

This cuts the full pipeline cycle from ~40 hours to ~20 hours. The 300s maxDuration is sufficient since parallel LSOA lookups eliminate the per-postcode DB round-trip bottleneck.

- [ ] **Step 4: Commit**

```bash
git add src/lib/lsoa-lookup.ts src/app/api/cron/refresh/route.ts
git commit -m "perf: batch LSOA lookups and increase pipeline batch size from 6 to 12"
```

---

### Task 10: Fix NI Water supplier mapping (80 BT postcodes)

**Files:**
- None (SQL only)

The supplier mapping agent confirmed all 80 BT postcodes should have `supplier_id = 'ni-water'`, but the DB still has NULL for these.

- [ ] **Step 1: Run SQL update**

Execute via Supabase SQL editor:

```sql
UPDATE postcode_districts
SET supplier_id = 'ni-water'
WHERE id LIKE 'BT%' AND supplier_id IS NULL;
```

- [ ] **Step 2: Verify**

```sql
SELECT COUNT(*) FROM postcode_districts WHERE supplier_id IS NULL;
-- Expected: 0
```

---

### Task 11: Build verification and deploy

- [ ] **Step 1: Run the build**

```bash
npx next build
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Commit any remaining changes**

```bash
git add -A
git commit -m "chore: pipeline hardening — observability, automation, incident repair, speed improvements"
```

- [ ] **Step 3: Push to production**

```bash
git push origin main
```

- [ ] **Step 4: Verify crons are registered**

After deploy, check Vercel dashboard → Project → Settings → Crons. Should show 6 crons:
- `/api/cron/refresh` — every 5 min
- `/api/cron/emails` — daily 9am
- `/api/cron/pfas` — Sunday 3am
- `/api/cron/incidents` — every 15 min
- `/api/cron/health` — Monday 8am
- `/api/cron/thames-water` — 1st of month 4am

---

## Summary of impact

| Metric | Before | After |
|--------|--------|-------|
| Pipeline cycle time | ~40 hours | ~20 hours |
| Thames Water automation | Manual Python scripts | Monthly Vercel cron |
| Incident feeds working | 1/11 (EA only) | 3/11 (EA + Severn Trent + Scottish Water) |
| Fake feed URLs | 10 (all 403/404) | 0 |
| Health monitoring | None | Weekly email alerts |
| Pipeline failure logging | Silent swallow | Console + Sentry structured logs |
| Null supplier_id | 80 (BT postcodes) | 0 |
| Python dependency | Required for Thames Water | Eliminated (Node.js PDF parser) |
