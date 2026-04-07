# PFAS City Pages + Data Pipeline — Design Spec

**Date:** 2026-04-07
**Status:** Draft
**Goal:** Build a national PFAS tracker page and 29 city-level PFAS pages with interactive maps, trend charts, and compound breakdowns, powered by a dedicated weekly EA API pipeline storing data in a new `pfas_detections` Supabase table.

---

## 1. Data Pipeline

### 1.1 New Supabase Table: `pfas_detections`

```sql
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

The UNIQUE constraint prevents duplicate observations on re-ingestion.

### 1.2 Weekly PFAS Cron: `/api/cron/pfas`

**Schedule:** Weekly, Sunday 3am UTC.

**Logic:**
1. Iterate over all 29 cities in `CITIES` (from `src/lib/cities.ts`)
2. For each city, use its centroid lat/lng to query the EA API for sampling points within a radius (e.g., 15km)
3. For each sampling point, fetch observations for PFAS determinands (notation range 2942-3037+ and any containing "perfluoro", "pfos", "pfoa", "pfas" in the label)
4. Filter to observations from the last 3 years
5. Upsert each observation into `pfas_detections` with the city and region mapped from the CITIES data
6. Log summary: total new observations, cities with detections, highest level found

**EA API query pattern:**
- `GET /water-quality/sampling-point?lat={lat}&long={lng}&dist={km}` — find sampling points near each city
- `GET /water-quality/sampling-point/{id}/observation?determinand={notation}&minyear={year}` — fetch PFAS observations per point

**Rate limiting:** The EA API is free but has soft rate limits. Add a 200ms delay between requests. With 29 cities x ~10-20 sampling points each x 50+ determinands, batch by sampling point (not by determinand) to reduce total requests.

**Error handling:** Log failures per city, continue to next city. Don't fail the entire cron on a single city error.

### 1.3 PFAS Determinand Identification

A PFAS compound is identified by:
- Determinand notation in range 2942-3037 (known PFAS compounds in EA system)
- OR label containing: "perfluoro", "pfos", "pfoa", "pfhxs", "pfas", "genx", "pfbs", "pfda", "pfna", "pfhpa"

Known key compounds to track:
| Compound | Notation | Full Name |
|----------|----------|-----------|
| PFOS | 2968 | Perfluorooctane sulfonate |
| PFOA | 2966 | Perfluorooctanoic acid |
| PFHxS | 2965 | Perfluorohexane sulfonate |
| GenX | ~3030 | Hexafluoropropylene oxide dimer acid |
| PFBS | 2963 | Perfluorobutane sulfonate |
| PFNA | 2969 | Perfluorononanoic acid |
| PFHpA | 2967 | Perfluoroheptanoic acid |
| PFDA | 2964 | Perfluorodecanoic acid |

### 1.4 Auto-Update Flow

```
Weekly cron (Sunday 3am)
  → Query EA API for PFAS determinands per city
  → Upsert into pfas_detections (UNIQUE constraint prevents duplicates)
  → PFAS pages use ISR (revalidate = 86400) so they refresh on next visit
  → No manual intervention required
```

---

## 2. Data Access Layer: `src/lib/pfas-data.ts`

Functions that query `pfas_detections` in Supabase and return structured data for the pages:

### 2.1 `getPfasNationalSummary()`

Returns:
```typescript
{
  totalDetections: number;        // total rows in pfas_detections
  citiesWithDetections: number;   // count of distinct cities with any detection
  citiesMonitored: number;        // 29 (all cities)
  highestLevel: number;           // max value across all detections
  highestLevelCity: string;       // city with the highest reading
  highestLevelCompound: string;   // compound name
  latestDetectionDate: string;    // most recent sample_date
  totalSamplingPoints: number;    // distinct sampling point count
  detectionsByCity: {             // array sorted by total detections desc
    city: string;
    region: string;
    detectionCount: number;
    compoundsFound: number;
    highestLevel: number;
    latestDate: string;
  }[];
  allDetectionPoints: {           // for the national map
    lat: number;
    lng: number;
    label: string;
    maxLevel: number;
    compound: string;
    city: string;
    latestDate: string;
  }[];
}
```

### 2.2 `getPfasCityData(citySlug: string)`

Returns:
```typescript
{
  city: string;
  region: string;
  detectionCount: number;
  compoundsDetected: string[];       // unique compound names
  samplingPointCount: number;
  highestLevel: number;
  highestCompound: string;
  latestDate: string;
  pfasDetected: boolean;             // any detections at all?
  detectionPoints: {                 // for the city map
    lat: number;
    lng: number;
    label: string;
    maxLevel: number;
    compounds: string[];
    latestDate: string;
  }[];
  trendData: {                       // for trend chart
    date: string;                    // YYYY-MM format
    totalLevel: number;              // sum of all compound levels that month
    compoundLevels: Record<string, number>; // per-compound level
  }[];
  compoundBreakdown: {               // for compound bar chart
    compound: string;
    maxLevel: number;
    detectionCount: number;
    latestDate: string;
  }[];
  nearbyPostcodes: string[];         // postcodes in this city with PFAS flagged
}
```

### 2.3 `getPfasCitySlugs()`

Returns list of all city slugs for `generateStaticParams`.

---

## 3. Page Structure

### 3.1 National PFAS Tracker: `/pfas`

Route: `src/app/pfas/page.tsx`

**Metadata:**
- Title: "PFAS in UK Water: Live Tracker (2026)" (38 chars)
- Description: "Track PFAS forever chemicals across UK water sources. Interactive map, city rankings, and compound data from Environment Agency monitoring." (140 chars)

**Schema:** FAQSchema (6 questions), BreadcrumbSchema, ArticleSchema

**Content sections:**
1. Breadcrumb (Home > PFAS Tracker)
2. H1: "PFAS in UK Water: Live Tracker"
3. GEO summary callout: "According to TapWater.uk's analysis of Environment Agency monitoring data, PFAS compounds have been detected at [X] sampling points across [Y] UK cities. The UK has no legal limit for PFAS in drinking water as of [year]."
4. Stat cards row: total detections, cities affected, highest level, latest date
5. **PfasMap** component — full-width interactive Mapbox map showing all UK detection points
6. City ranking table — all 29 cities sorted by PFAS detection level, with detection count, compounds found, highest level, link to city page
7. "What is PFAS?" explainer section (2-3 paragraphs)
8. "UK vs EU regulation" comparison (UK has no limit, EU set 0.1 µg/L in 2026)
9. "How to remove PFAS from your water" — RO system recommendation with ProductCard
10. FAQ section (6 Q&As)
11. Related links (PFAS guide, contaminant page, RO system guide)

### 3.2 City PFAS Pages: `/pfas/[city]`

Route: `src/app/pfas/[city]/page.tsx`

**Metadata:**
- Title: "PFAS in [City] Water ([year])" (under 45 chars)
- Description: "PFAS detection data for [City]. [X] compounds found at [Y] sampling points. Interactive map, trends, and how to protect yourself." (under 155 chars)

**Schema:** FAQSchema (4 questions), BreadcrumbSchema, ArticleSchema

**Content sections:**
1. Breadcrumb (Home > PFAS Tracker > [City])
2. H1: "PFAS in [City] Water"
3. GEO summary callout with city-specific data
4. Stat cards: compounds detected, sampling points, highest level, latest date
5. **PfasMap** component — zoomed to city bounds with local sampling points
6. **PfasTrendChart** — line chart showing PFAS levels over the last 3 years
7. **PfasCompoundChart** — horizontal bar chart showing max level per compound, WHO guideline reference line
8. Sampling point detail section — expandable table with point name, coordinates, compounds, latest reading
9. "What this means for your tap water" — explanation that EA data is environmental monitoring, not tap water testing
10. "How to reduce PFAS exposure" — RO system + PFAS filter recommendations with ProductCard
11. Nearby city PFAS links
12. Postcode search CTA
13. FAQ section

**Cities with no PFAS detected:**
- Same page structure but with reassurance messaging: "No PFAS detected in [City] — Good news: Environment Agency monitoring has not detected PFAS compounds in water sources near [City] as of [date]."
- Still show the map (with green "no detection" markers at sampling points)
- Still show the protection section (PFAS can enter water from sources not yet monitored)

---

## 4. Visual Components

### 4.1 PfasMap: `src/components/pfas-map.tsx`

- `"use client"` component, dynamically imported (`next/dynamic` with `ssr: false`)
- Uses `mapbox-gl` (added to `package.json`)
- Requires `NEXT_PUBLIC_MAPBOX_TOKEN` environment variable
- CSP already allows `api.mapbox.com` in connect-src

**Props:**
```typescript
interface PfasMapProps {
  points: {
    lat: number;
    lng: number;
    label: string;
    maxLevel: number;
    compound: string;
    city?: string;
    latestDate: string;
  }[];
  center?: [number, number];  // [lng, lat] — defaults to UK center
  zoom?: number;              // defaults to 5.5 for national, ~11 for city
}
```

**Rendering:**
- Light basemap style (e.g., `mapbox://styles/mapbox/light-v11`)
- Circle markers at each point, colored by PFAS level:
  - Green (#22c55e): < 0.01 µg/L (very low)
  - Amber (#f59e0b): 0.01-0.075 µg/L (moderate)
  - Red (#ef4444): > 0.075 µg/L (approaching/exceeding WHO guideline of 0.1 µg/L)
- Popup on click: point label, compound name, level, date
- Auto-fit bounds to all markers
- Height: 400px on desktop, 300px on mobile

**Loading state:** `<div className="h-[400px] animate-pulse bg-muted/20 rounded-lg" />`

### 4.2 PfasTrendChart: `src/components/pfas-trend-chart.tsx`

- `"use client"` component, dynamically imported
- **Pure SVG implementation** — no chart library. The data is simple (monthly totals over 3 years = max 36 data points). An SVG line chart with axis labels is ~80 lines of code.

**Props:**
```typescript
interface PfasTrendChartProps {
  data: {
    date: string;       // "YYYY-MM"
    totalLevel: number;
  }[];
  whoGuideline?: number; // defaults to 0.1
}
```

**Rendering:**
- SVG viewBox scaled to data range
- Line path connecting monthly data points
- Dashed horizontal line at WHO guideline (0.1 µg/L)
- X-axis: date labels (every 6 months)
- Y-axis: µg/L
- Responsive: full container width, 250px height
- Colors: line in PFAS purple (#a855f7), WHO line in red (#ef4444) with label

### 4.3 PfasCompoundChart: `src/components/pfas-compound-chart.tsx`

- Server component (no interactivity needed)
- **Pure CSS horizontal bar chart** — zero JS dependency

**Props:**
```typescript
interface PfasCompoundChartProps {
  compounds: {
    compound: string;
    maxLevel: number;
    detectionCount: number;
  }[];
  whoGuideline?: number; // defaults to 0.1
}
```

**Rendering:**
- Each compound = a row with label + horizontal bar
- Bar width = `(maxLevel / maxValue) * 100%`
- Bar color: green/amber/red based on level relative to WHO guideline
- Vertical dashed line at WHO guideline position
- No JS needed — pure Tailwind `w-[{pct}%]` classes or inline styles

---

## 5. Mapbox Configuration

- **Package:** `mapbox-gl` (npm)
- **CSS:** Import `mapbox-gl/dist/mapbox-gl.css` in the map component
- **Token:** `NEXT_PUBLIC_MAPBOX_TOKEN` env var (already in CSP)
- **Dynamic import:** Only loaded on `/pfas` and `/pfas/[city]` pages
- **Bundle impact:** ~60KB gzipped, isolated to PFAS pages via dynamic import

---

## 6. File Structure

### New Files
- `supabase/migrations/006_pfas_detections.sql` — table + indexes
- `src/lib/pfas-data.ts` — data access layer for pfas_detections table
- `src/app/api/cron/pfas/route.ts` — weekly PFAS ingestion cron
- `src/app/pfas/page.tsx` — national PFAS tracker
- `src/app/pfas/[city]/page.tsx` — city PFAS pages
- `src/components/pfas-map.tsx` — Mapbox interactive map
- `src/components/pfas-trend-chart.tsx` — SVG trend line chart
- `src/components/pfas-compound-chart.tsx` — CSS compound bar chart

### Modified Files
- `src/app/sitemap.ts` — add /pfas and /pfas/[city] routes
- `src/app/llms.txt/route.ts` — add PFAS tracker links
- `package.json` — add `mapbox-gl` + `@types/mapbox-gl`
- `next.config.ts` — no changes needed (CSP already allows mapbox)
- `vercel.json` — add PFAS cron schedule (if using Vercel Cron)

---

## 7. What This Does NOT Include

- Real-time PFAS alerts or push notifications
- User-submitted PFAS reports or crowdsourced data
- PFAS in tap water claims (EA data is environmental monitoring, not tap water)
- Drinking Water Inspectorate PFAS data (not yet available via API)
- Historical data beyond 3 years (EA API limitation)
- Custom Mapbox styles (using built-in light-v11)

---

## 8. Success Metrics

- PFAS pages indexed by Google within 2 weeks of launch
- `/pfas` tracker page ranks for "pfas uk water" within 3 months
- City PFAS pages rank for "pfas in [city] water" within 3 months
- At least 1 journalist/press citation within 6 months
- PFAS page visitors → RO system affiliate click-through rate > 2%
- Weekly cron completes without errors for 4 consecutive weeks
