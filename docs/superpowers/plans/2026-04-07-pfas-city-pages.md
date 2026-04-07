# PFAS City Pages + Data Pipeline — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a national PFAS tracker (`/pfas`) and 29 city-level PFAS pages (`/pfas/[city]`) with interactive Mapbox maps, SVG trend charts, CSS compound bar charts, powered by a dedicated weekly EA API pipeline storing compound-level data in a `pfas_detections` Supabase table.

**Architecture:** Bottom-up build: (1) database table, (2) data access layer, (3) cron pipeline to populate data, (4) visual components (map, charts), (5) pages that compose everything. Each layer can be tested independently before wiring together.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Supabase, Mapbox GL JS, Vitest

**Spec:** `docs/superpowers/specs/2026-04-07-pfas-city-pages-design.md`

---

### Task 1: Create pfas_detections Supabase table

**Files:**
- Create: `supabase/migrations/006_pfas_detections.sql`

- [ ] **Step 1: Create migration file**

```sql
-- 006_pfas_detections.sql
CREATE TABLE IF NOT EXISTS pfas_detections (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sampling_point_id     TEXT NOT NULL,
  sampling_point_label  TEXT NOT NULL,
  lat                   REAL NOT NULL,
  lng                   REAL NOT NULL,
  city                  TEXT NOT NULL,
  region                TEXT NOT NULL,
  compound              TEXT NOT NULL,
  determinand_notation  TEXT NOT NULL,
  value                 REAL NOT NULL,
  unit                  TEXT NOT NULL DEFAULT 'µg/L',
  sample_date           DATE NOT NULL,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sampling_point_id, determinand_notation, sample_date)
);

CREATE INDEX IF NOT EXISTS idx_pfas_city ON pfas_detections (city);
CREATE INDEX IF NOT EXISTS idx_pfas_date ON pfas_detections (sample_date DESC);
CREATE INDEX IF NOT EXISTS idx_pfas_compound ON pfas_detections (compound);
CREATE INDEX IF NOT EXISTS idx_pfas_point ON pfas_detections (sampling_point_id);
```

- [ ] **Step 2: Apply migration**

Use the Supabase MCP `apply_migration` tool to apply to the live project (project ref: `zxmqmzzwausjradfyttc`). If MCP is unavailable, apply via Supabase dashboard SQL editor.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/006_pfas_detections.sql
git commit -m "feat: add pfas_detections table for PFAS compound-level data"
```

---

### Task 2: Create PFAS data access layer

**Files:**
- Create: `src/lib/pfas-data.ts`

- [ ] **Step 1: Create the data access module**

Create `src/lib/pfas-data.ts` with three exported functions that query the `pfas_detections` table in Supabase.

```typescript
import { getSupabase } from "@/lib/supabase";
import { CITIES } from "@/lib/cities";

// ── Types ──

export interface PfasDetectionPoint {
  lat: number;
  lng: number;
  label: string;
  maxLevel: number;
  compound: string;
  city: string;
  latestDate: string;
}

export interface PfasCitySummary {
  city: string;
  slug: string;
  region: string;
  detectionCount: number;
  compoundsFound: number;
  highestLevel: number;
  latestDate: string;
}

export interface PfasNationalSummary {
  totalDetections: number;
  citiesWithDetections: number;
  citiesMonitored: number;
  highestLevel: number;
  highestLevelCity: string;
  highestLevelCompound: string;
  latestDetectionDate: string;
  totalSamplingPoints: number;
  detectionsByCity: PfasCitySummary[];
  allDetectionPoints: PfasDetectionPoint[];
}

export interface PfasTrendPoint {
  date: string;
  totalLevel: number;
}

export interface PfasCompoundBreakdown {
  compound: string;
  maxLevel: number;
  detectionCount: number;
  latestDate: string;
}

export interface PfasCityData {
  city: string;
  region: string;
  detectionCount: number;
  compoundsDetected: string[];
  samplingPointCount: number;
  highestLevel: number;
  highestCompound: string;
  latestDate: string;
  pfasDetected: boolean;
  detectionPoints: PfasDetectionPoint[];
  trendData: PfasTrendPoint[];
  compoundBreakdown: PfasCompoundBreakdown[];
}

// ── Helpers ──

function citySlugToName(slug: string): string {
  return CITIES.find((c) => c.slug === slug)?.name ?? slug;
}

function cityNameToSlug(name: string): string {
  return CITIES.find((c) => c.name === name)?.slug ?? name.toLowerCase().replace(/\s+/g, "-");
}

// ── Public API ──

export async function getPfasNationalSummary(): Promise<PfasNationalSummary | null> {
  const supabase = getSupabase();

  // Fetch all detections (for map points and aggregation)
  const { data: rows, error } = await supabase
    .from("pfas_detections")
    .select("sampling_point_id, sampling_point_label, lat, lng, city, region, compound, value, sample_date")
    .order("sample_date", { ascending: false });

  if (error || !rows || rows.length === 0) {
    return null;
  }

  // Aggregate by city
  const cityMap = new Map<string, { detections: typeof rows; compounds: Set<string>; maxLevel: number; latestDate: string }>();
  for (const row of rows) {
    const entry = cityMap.get(row.city) ?? { detections: [], compounds: new Set(), maxLevel: 0, latestDate: "" };
    entry.detections.push(row);
    entry.compounds.add(row.compound);
    if (row.value > entry.maxLevel) entry.maxLevel = row.value;
    if (!entry.latestDate || row.sample_date > entry.latestDate) entry.latestDate = row.sample_date;
    cityMap.set(row.city, entry);
  }

  // Build city summaries
  const detectionsByCity: PfasCitySummary[] = Array.from(cityMap.entries())
    .map(([city, data]) => ({
      city,
      slug: cityNameToSlug(city),
      region: data.detections[0]?.region ?? "",
      detectionCount: data.detections.length,
      compoundsFound: data.compounds.size,
      highestLevel: data.maxLevel,
      latestDate: data.latestDate,
    }))
    .sort((a, b) => b.highestLevel - a.highestLevel);

  // Build map points (aggregate by sampling point — take max level per point)
  const pointMap = new Map<string, PfasDetectionPoint>();
  for (const row of rows) {
    const existing = pointMap.get(row.sampling_point_id);
    if (!existing || row.value > existing.maxLevel) {
      pointMap.set(row.sampling_point_id, {
        lat: row.lat,
        lng: row.lng,
        label: row.sampling_point_label,
        maxLevel: row.value,
        compound: row.compound,
        city: row.city,
        latestDate: row.sample_date,
      });
    }
  }

  // Find overall highest
  let highestLevel = 0;
  let highestLevelCity = "";
  let highestLevelCompound = "";
  for (const row of rows) {
    if (row.value > highestLevel) {
      highestLevel = row.value;
      highestLevelCity = row.city;
      highestLevelCompound = row.compound;
    }
  }

  return {
    totalDetections: rows.length,
    citiesWithDetections: cityMap.size,
    citiesMonitored: CITIES.length,
    highestLevel,
    highestLevelCity,
    highestLevelCompound,
    latestDetectionDate: rows[0]?.sample_date ?? "",
    totalSamplingPoints: pointMap.size,
    detectionsByCity,
    allDetectionPoints: Array.from(pointMap.values()),
  };
}

export async function getPfasCityData(citySlug: string): Promise<PfasCityData> {
  const cityName = citySlugToName(citySlug);
  const cityInfo = CITIES.find((c) => c.slug === citySlug);
  const region = cityInfo?.region ?? "England";

  const supabase = getSupabase();
  const { data: rows } = await supabase
    .from("pfas_detections")
    .select("sampling_point_id, sampling_point_label, lat, lng, compound, value, unit, sample_date")
    .eq("city", cityName)
    .order("sample_date", { ascending: true });

  const detections = rows ?? [];
  const pfasDetected = detections.length > 0;

  // Compounds detected
  const compoundsSet = new Set(detections.map((r) => r.compound));

  // Sampling points
  const pointMap = new Map<string, { lat: number; lng: number; label: string; maxLevel: number; compounds: Set<string>; latestDate: string }>();
  for (const row of detections) {
    const existing = pointMap.get(row.sampling_point_id);
    if (!existing) {
      pointMap.set(row.sampling_point_id, { lat: row.lat, lng: row.lng, label: row.sampling_point_label, maxLevel: row.value, compounds: new Set([row.compound]), latestDate: row.sample_date });
    } else {
      if (row.value > existing.maxLevel) existing.maxLevel = row.value;
      existing.compounds.add(row.compound);
      if (row.sample_date > existing.latestDate) existing.latestDate = row.sample_date;
    }
  }

  const detectionPoints: PfasDetectionPoint[] = Array.from(pointMap.values()).map((p) => ({
    lat: p.lat,
    lng: p.lng,
    label: p.label,
    maxLevel: p.maxLevel,
    compound: Array.from(p.compounds).join(", "),
    city: cityName,
    latestDate: p.latestDate,
  }));

  // Trend data (monthly aggregation)
  const trendMap = new Map<string, number>();
  for (const row of detections) {
    const month = row.sample_date.substring(0, 7); // "YYYY-MM"
    trendMap.set(month, (trendMap.get(month) ?? 0) + row.value);
  }
  const trendData: PfasTrendPoint[] = Array.from(trendMap.entries())
    .map(([date, totalLevel]) => ({ date, totalLevel }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Compound breakdown
  const compoundMap = new Map<string, { maxLevel: number; count: number; latestDate: string }>();
  for (const row of detections) {
    const existing = compoundMap.get(row.compound);
    if (!existing) {
      compoundMap.set(row.compound, { maxLevel: row.value, count: 1, latestDate: row.sample_date });
    } else {
      if (row.value > existing.maxLevel) existing.maxLevel = row.value;
      existing.count++;
      if (row.sample_date > existing.latestDate) existing.latestDate = row.sample_date;
    }
  }
  const compoundBreakdown: PfasCompoundBreakdown[] = Array.from(compoundMap.entries())
    .map(([compound, data]) => ({ compound, maxLevel: data.maxLevel, detectionCount: data.count, latestDate: data.latestDate }))
    .sort((a, b) => b.maxLevel - a.maxLevel);

  // Highest
  let highestLevel = 0;
  let highestCompound = "";
  for (const row of detections) {
    if (row.value > highestLevel) {
      highestLevel = row.value;
      highestCompound = row.compound;
    }
  }

  return {
    city: cityName,
    region,
    detectionCount: detections.length,
    compoundsDetected: Array.from(compoundsSet),
    samplingPointCount: pointMap.size,
    highestLevel,
    highestCompound,
    latestDate: detections.length > 0 ? detections[detections.length - 1].sample_date : "",
    pfasDetected,
    detectionPoints,
    trendData,
    compoundBreakdown,
  };
}

export function getPfasCitySlugs(): string[] {
  return CITIES.map((c) => c.slug);
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build 2>&1 | tail -5`

- [ ] **Step 3: Commit**

```bash
git add src/lib/pfas-data.ts
git commit -m "feat: add PFAS data access layer for pfas_detections table"
```

---

### Task 3: Create weekly PFAS cron pipeline

**Files:**
- Create: `src/app/api/cron/pfas/route.ts`
- Modify: `vercel.json`

- [ ] **Step 1: Create the PFAS cron route**

Create `src/app/api/cron/pfas/route.ts`. This route:
1. Authenticates via `CRON_SECRET` (same pattern as `/api/cron/refresh`)
2. Iterates over all 29 cities in CITIES
3. For each city, queries the EA API for sampling points within 15km of the city centroid
4. For each sampling point, fetches observations and filters for PFAS determinands
5. Upserts into `pfas_detections` table
6. Logs a summary

Use the existing `fetchSamplingPointsNear` from `src/lib/ea-api.ts` to find sampling points. For observations, use the EA API directly: `GET /water-quality/sampling-point/{id}/observation?minyear={3yearsAgo}&_limit=500`

The cron must:
- Use `maxDuration = 300` (5 min max for Vercel)
- Add 200ms delay between EA API requests to avoid rate limiting
- Continue to next city on error (don't fail the entire job)
- Use the PFAS detection from `ea-api.ts`: notation range 2942-3037 or label containing "perfluoro"/"pfos"/"pfoa"/"pfas"

Read `src/lib/ea-api.ts` to reuse the existing `isPfasDeterminand`, `fetchSamplingPointsNear`, `eaFetch`, `haversineKm` functions. Some are not exported — if needed, export them or duplicate the logic.

For each PFAS observation found, determine the compound name from the determinand label (e.g., "Perfluorooctane sulfonate" → "PFOS"). Use a simple mapping for known compounds, fall back to the raw label for unknown ones.

Upsert into Supabase using `.upsert()` with `onConflict: "sampling_point_id,determinand_notation,sample_date"`.

The city for each detection comes from the CITIES entry being processed (the city whose centroid was used to find the sampling point).

- [ ] **Step 2: Add PFAS cron to vercel.json**

```json
{
  "crons": [
    {
      "path": "/api/cron/refresh",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/emails",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/pfas",
      "schedule": "0 3 * * 0"
    }
  ]
}
```

`0 3 * * 0` = Sunday 3am UTC.

- [ ] **Step 3: Verify build**

Run: `npm run build 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add src/app/api/cron/pfas/ vercel.json
git commit -m "feat: add weekly PFAS cron pipeline querying EA API for compound-level data"
```

---

### Task 4: Install Mapbox GL JS and create PfasMap component

**Files:**
- Modify: `package.json` (via npm install)
- Create: `src/components/pfas-map.tsx`

- [ ] **Step 1: Install mapbox-gl**

Run: `npm install mapbox-gl`

Check if `@types/mapbox-gl` is needed (mapbox-gl v3+ includes types).

- [ ] **Step 2: Create PfasMap component**

Create `src/components/pfas-map.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface MapPoint {
  lat: number;
  lng: number;
  label: string;
  maxLevel: number;
  compound: string;
  city?: string;
  latestDate: string;
}

interface PfasMapProps {
  points: MapPoint[];
  center?: [number, number];
  zoom?: number;
}

function markerColor(level: number): string {
  if (level >= 0.075) return "#ef4444"; // red — approaching/exceeding WHO
  if (level >= 0.01) return "#f59e0b";  // amber — moderate
  return "#22c55e";                      // green — very low
}

export function PfasMap({ points, center, zoom }: PfasMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.warn("[PfasMap] NEXT_PUBLIC_MAPBOX_TOKEN not set");
      return;
    }

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: center ?? [-2.5, 54.0], // UK center
      zoom: zoom ?? 5.5,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");

    map.on("load", () => {
      // Add markers
      for (const point of points) {
        const el = document.createElement("div");
        el.style.width = "12px";
        el.style.height = "12px";
        el.style.borderRadius = "50%";
        el.style.backgroundColor = markerColor(point.maxLevel);
        el.style.border = "2px solid white";
        el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.3)";
        el.style.cursor = "pointer";

        const popup = new mapboxgl.Popup({ offset: 15, closeButton: false }).setHTML(
          `<div style="font-family:system-ui;font-size:13px;line-height:1.4;">
            <strong>${point.label}</strong><br/>
            ${point.compound}: <strong>${point.maxLevel.toFixed(4)} µg/L</strong><br/>
            <span style="color:#666;">${point.latestDate}</span>
            ${point.city ? `<br/><span style="color:#999;">${point.city}</span>` : ""}
          </div>`
        );

        new mapboxgl.Marker({ element: el })
          .setLngLat([point.lng, point.lat])
          .setPopup(popup)
          .addTo(map);
      }

      // Fit bounds if we have points
      if (points.length > 1) {
        const bounds = new mapboxgl.LngLatBounds();
        for (const p of points) bounds.extend([p.lng, p.lat]);
        map.fitBounds(bounds, { padding: 50, maxZoom: 13 });
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [points, center, zoom]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[300px] sm:h-[400px] rounded-lg overflow-hidden border border-rule"
    />
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/components/pfas-map.tsx
git commit -m "feat: add PfasMap component with Mapbox GL JS"
```

---

### Task 5: Create PfasTrendChart (pure SVG) and PfasCompoundChart (pure CSS)

**Files:**
- Create: `src/components/pfas-trend-chart.tsx`
- Create: `src/components/pfas-compound-chart.tsx`

- [ ] **Step 1: Create PfasTrendChart**

Create `src/components/pfas-trend-chart.tsx` — a pure SVG line chart:

```tsx
"use client";

interface TrendPoint {
  date: string;
  totalLevel: number;
}

interface PfasTrendChartProps {
  data: TrendPoint[];
  whoGuideline?: number;
}

export function PfasTrendChart({ data, whoGuideline = 0.1 }: PfasTrendChartProps) {
  if (data.length === 0) return null;

  const width = 600;
  const height = 250;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data.map((d) => d.totalLevel), whoGuideline * 1.2);
  const xScale = (i: number) => padding.left + (i / (data.length - 1 || 1)) * chartW;
  const yScale = (v: number) => padding.top + chartH - (v / maxVal) * chartH;

  const linePath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${xScale(i).toFixed(1)} ${yScale(d.totalLevel).toFixed(1)}`)
    .join(" ");

  const whoY = yScale(whoGuideline);

  // Show every 6th label
  const dateLabels = data
    .map((d, i) => ({ label: d.date, x: xScale(i), show: i % Math.max(1, Math.floor(data.length / 6)) === 0 }))
    .filter((d) => d.show);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="PFAS levels over time">
      {/* Y-axis labels */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
        const val = pct * maxVal;
        const y = yScale(val);
        return (
          <g key={pct}>
            <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#e2e8f0" strokeWidth={0.5} />
            <text x={padding.left - 6} y={y + 4} textAnchor="end" className="text-[10px] fill-muted">{val.toFixed(3)}</text>
          </g>
        );
      })}

      {/* WHO guideline */}
      <line x1={padding.left} x2={width - padding.right} y1={whoY} y2={whoY} stroke="#ef4444" strokeWidth={1} strokeDasharray="4 3" />
      <text x={width - padding.right + 4} y={whoY + 4} className="text-[9px] fill-[#ef4444]" textAnchor="start">WHO 0.1 µg/L</text>

      {/* Data line */}
      <path d={linePath} fill="none" stroke="#a855f7" strokeWidth={2} strokeLinejoin="round" />

      {/* Data points */}
      {data.map((d, i) => (
        <circle key={i} cx={xScale(i)} cy={yScale(d.totalLevel)} r={3} fill="#a855f7" />
      ))}

      {/* X-axis labels */}
      {dateLabels.map((d) => (
        <text key={d.label} x={d.x} y={height - 8} textAnchor="middle" className="text-[9px] fill-muted">{d.label}</text>
      ))}
    </svg>
  );
}
```

- [ ] **Step 2: Create PfasCompoundChart**

Create `src/components/pfas-compound-chart.tsx` — a pure CSS horizontal bar chart (server component):

```tsx
interface CompoundBar {
  compound: string;
  maxLevel: number;
  detectionCount: number;
}

interface PfasCompoundChartProps {
  compounds: CompoundBar[];
  whoGuideline?: number;
}

export function PfasCompoundChart({ compounds, whoGuideline = 0.1 }: PfasCompoundChartProps) {
  if (compounds.length === 0) return null;

  const maxLevel = Math.max(...compounds.map((c) => c.maxLevel), whoGuideline);

  function barColor(level: number): string {
    if (level >= 0.075) return "bg-danger";
    if (level >= 0.01) return "bg-warning";
    return "bg-safe";
  }

  const guidelinePct = Math.min((whoGuideline / maxLevel) * 100, 100);

  return (
    <div className="space-y-3 relative">
      {/* WHO guideline reference line */}
      <div
        className="absolute top-0 bottom-0 border-l-2 border-dashed border-danger/50 z-10"
        style={{ left: `calc(120px + ${guidelinePct}% * (100% - 120px) / 100%)` }}
      />

      {compounds.map((c) => {
        const pct = Math.max((c.maxLevel / maxLevel) * 100, 2);
        return (
          <div key={c.compound} className="flex items-center gap-3">
            <span className="text-xs text-body font-medium w-[120px] shrink-0 truncate" title={c.compound}>
              {c.compound}
            </span>
            <div className="flex-1 relative h-6">
              <div
                className={`h-full rounded-sm ${barColor(c.maxLevel)} opacity-80`}
                style={{ width: `${pct}%` }}
              />
              <span className="absolute right-1 top-0.5 text-[10px] text-muted font-data">
                {c.maxLevel.toFixed(4)} µg/L ({c.detectionCount})
              </span>
            </div>
          </div>
        );
      })}

      <p className="text-[10px] text-muted mt-1">
        Dashed line = WHO guideline ({whoGuideline} µg/L). Counts in parentheses.
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add src/components/pfas-trend-chart.tsx src/components/pfas-compound-chart.tsx
git commit -m "feat: add PfasTrendChart (SVG) and PfasCompoundChart (CSS) components"
```

---

### Task 6: Create national PFAS tracker page (`/pfas`)

**Files:**
- Create: `src/app/pfas/page.tsx`

- [ ] **Step 1: Create the national tracker page**

Create `src/app/pfas/page.tsx`. This is the centerpiece page.

Read existing pages (`src/app/rankings/page.tsx` or `src/app/city/[slug]/page.tsx`) for styling patterns.

The page should:
- `export const revalidate = 86400`
- Metadata: title "PFAS in UK Water: Live Tracker ({year})", description under 155 chars
- Import and render: `BreadcrumbSchema`, `ArticleSchema`, `FAQSchema` (6 questions about PFAS in UK water)
- Call `getPfasNationalSummary()` to get all data
- Handle null return (no data yet): show "Data collection in progress" message
- Dynamic import for PfasMap: `const PfasMap = dynamic(() => import("@/components/pfas-map").then(m => m.PfasMap), { ssr: false, loading: () => <div className="h-[400px] animate-pulse bg-muted/20 rounded-lg" /> })`

Content sections in order:
1. Breadcrumb
2. H1 + author/date byline
3. GEO summary callout (border-l-4 border-l-[#a855f7] — PFAS purple)
4. 4 stat cards in a grid
5. PfasMap with `allDetectionPoints`
6. City ranking table with links to `/pfas/[slug]`
7. "What is PFAS?" section (2-3 paragraphs)
8. "UK vs EU regulation" section
9. "How to remove PFAS" with link to `/guides/best-water-filter-pfas/` and `/filters/reverse-osmosis-systems`
10. PostcodeSearch CTA
11. FAQ
12. Related links

Import `ProductCard` and `getProductIncludingUnavailable` to show the Waterdrop G3P600 as the recommended RO system in section 9.

- [ ] **Step 2: Verify build**

Run: `npm run build 2>&1 | tail -10`

- [ ] **Step 3: Commit**

```bash
git add src/app/pfas/
git commit -m "feat: add national PFAS tracker page with interactive map and city rankings"
```

---

### Task 7: Create city PFAS pages (`/pfas/[city]`)

**Files:**
- Create: `src/app/pfas/[city]/page.tsx`

- [ ] **Step 1: Create the city PFAS page**

Create `src/app/pfas/[city]/page.tsx`.

```typescript
export const revalidate = 86400;

export function generateStaticParams() {
  return getPfasCitySlugs().map((city) => ({ city }));
}
```

The page should:
- Call `getPfasCityData(citySlug)` for all data
- Handle `pfasDetected === false`: show reassurance message, still render map (if sampling points exist without detections) and protection section
- Dynamic import PfasMap, PfasTrendChart
- Import PfasCompoundChart directly (it's a server component)

Content sections:
1. Breadcrumb (Home > PFAS Tracker > [City])
2. H1: "PFAS in [City] Water"
3. GEO summary callout with city-specific data
4. 4 stat cards
5. PfasMap zoomed to city (compute center from average of detection points, zoom ~11)
6. PfasTrendChart (only if `trendData.length > 1`)
7. PfasCompoundChart (only if `compoundBreakdown.length > 0`)
8. Sampling point detail — expandable list showing each point with compounds and levels
9. "What this means" disclaimer: EA data is environmental monitoring, not tap water
10. RO system recommendation (ProductCard for Waterdrop G3P600)
11. Nearby city PFAS links — link to other city PFAS pages
12. PostcodeSearch CTA
13. FAQ (4 questions, city-specific)

Metadata: title "PFAS in [City] Water ({year})", description under 155 chars

Schema: BreadcrumbSchema, ArticleSchema, FAQSchema

- [ ] **Step 2: Verify build**

Run: `npm run build 2>&1 | tail -10`
Expected: 29 city PFAS pages generated via `generateStaticParams`.

- [ ] **Step 3: Commit**

```bash
git add src/app/pfas/
git commit -m "feat: add 29 city PFAS pages with maps, trend charts, and compound breakdowns"
```

---

### Task 8: Update sitemap, llms.txt, and verify

**Files:**
- Modify: `src/app/sitemap.ts`
- Modify: `src/app/llms.txt/route.ts`

- [ ] **Step 1: Add PFAS pages to sitemap**

In `src/app/sitemap.ts`:

Add imports:
```typescript
import { getPfasCitySlugs } from "@/lib/pfas-data";
```

Add PFAS tracker page:
```typescript
{
  url: `${BASE_URL}/pfas`,
  lastModified: latestDataDate,
  changeFrequency: "weekly" as const,
  priority: 0.9,
},
```

Add PFAS city pages:
```typescript
...getPfasCitySlugs().map((slug) => ({
  url: `${BASE_URL}/pfas/${slug}`,
  lastModified: latestDataDate,
  changeFrequency: "weekly" as const,
  priority: 0.8,
})),
```

- [ ] **Step 2: Update llms.txt**

In `src/app/llms.txt/route.ts`, add a new "PFAS tracker" section:

```
## PFAS tracker

- [PFAS Live Tracker](https://www.tapwater.uk/pfas): National PFAS detection map and city rankings
- City-level PFAS pages: https://www.tapwater.uk/pfas/{city-slug} (e.g. london, manchester, birmingham)
- Data source: Environment Agency Water Quality Archive, PFAS determinands 2942-3037
- Updated weekly with 3 years of historical data
```

- [ ] **Step 3: Full build verification**

Run: `npm run build 2>&1 | tail -30`
Expected: Build succeeds. `/pfas` and 29 `/pfas/[city]` pages in output.

Run: `npm run test 2>&1`
Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/app/sitemap.ts src/app/llms.txt/route.ts
git commit -m "feat: add PFAS tracker and city pages to sitemap and llms.txt"
```

- [ ] **Step 5: Push and deploy**

```bash
git push origin main
```
