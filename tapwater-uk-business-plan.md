# TapWater.uk — Full Business Plan

**Project:** UK Tap Water Quality by Postcode — Programmatic SEO + Affiliate Play
**Date:** April 1, 2026
**Status:** Pre-build

---

## 1. The Opportunity in One Paragraph

The EU Drinking Water Directive kicked in on January 12, 2026, mandating PFAS monitoring across all member states for the first time. The UK has no legal PFAS limits yet and is launching a public consultation this year. There is no aggregated, postcode-searchable UK tap water quality website. Water company tools are siloed (you need to know your supplier first). The UK government publishes multiple open water quality datasets: the Environment Agency monitors 58,000+ sampling points across rivers, groundwater, and source water (72 million observations including 50+ PFAS compounds), while the Drinking Water Inspectorate publishes annual compliance reports for every water company. No one aggregates these into a single postcode-searchable resource. The play: build the UK's TapWaterData.com — thousands of programmatic pages, each answering "is my tap water safe?" for a specific postcode, combining drinking water compliance data with environmental PFAS monitoring, monetized through water filter affiliate links.

---

## 2. Domain Strategy

### Primary Domain: `tapwater.uk`

**Why this wins:**
- 10 characters. Memorable. Typeable.
- Exact keyword match for "tap water" — the most natural UK search term
- `.uk` TLD signals UK authority to Google for local search ranking
- Clean brand that scales ("TapWater" can become the brand name)

**Also register (defensive + expansion):**
- `tapwater.co.uk` — check availability separately (Vercel doesn't support .co.uk pricing)
- `tapwaterdata.co.uk` — available, blocks copycats
- `tapwaterdata.uk` — available, direct competitor naming defense
- `ismywatersafe.co.uk` — available, potential landing page / redirect for high-intent queries

**For EU expansion later:**
- `tapwaterdata.eu` — check availability via EU registrar
- `tapwateruk.com` — available at $11.25/yr (English-language global play)

**Cost:** ~£30-50/yr total for all defensive domains.

---

## 3. Data Pipeline

### Critical Data Architecture Decision

There is NO single API that gives you "tap water quality by postcode." The data comes from three distinct layers, each with different coverage, granularity, and freshness. Understanding this is essential — getting it wrong means the whole site is built on shaky foundations.

**Layer 1: Drinking Water Quality (what comes out of the tap)**
Sources: DWI compliance data + water company postcode lookups.
This is the PRIMARY data layer. It measures water at the point of supply — what people actually drink.

**Layer 2: Environmental Water Quality (rivers, groundwater, sources)**
Source: Environment Agency Water Quality API.
This is SUPPLEMENTARY. It measures rivers, groundwater, and source water — not the treated water in your pipes. But it's invaluable for PFAS detection (environmental monitoring catches PFAS that tap water regulations don't yet require testing for) and for showing the quality of water sources feeding your supply.

**Layer 3: Postcode → Supplier → Supply Zone mapping**
Source: Water UK postcode lookup + individual water companies.
This is the GLUE that connects a postcode to the right data from layers 1 and 2.

### Source Details

**Source 1: Drinking Water Inspectorate (DWI) — PRIMARY**
- URL: `dwi.gov.uk`
- What it measures: Treated drinking water at consumer taps, supply points, and treatment works
- Coverage: All water companies in England & Wales, annual + quarterly
- Parameters: 48 regulated parameters including lead, nitrate, pesticides, turbidity, coliform bacteria, pH, hardness, chlorine residual
- Format: PDF annual reports + Excel data tables (need scraping/extraction)
- Includes: Supply zone-level compliance data, exceedance incidents, enforcement actions, company performance scores
- Limitations: Annual publication cycle (latest data is always 6-12 months old), no PFAS monitoring required yet
- Value: THE authoritative source for "is my tap water safe" — regulated, verified, covers every water company

**Source 2: Water Company Postcode Lookups — PRIMARY**
- Each of the ~20 UK water companies publishes their own water quality tool
- Coverage: Postcode → supply zone → water quality parameters for the water YOU drink
- Key companies: Thames Water, Severn Trent, United Utilities, Anglian Water, Yorkshire Water, Wessex Water, South West Water, Southern Water, Northumbrian Water, Welsh Water (Dŵr Cymru)
- Format: Web scraping required — each company has a different UI, most return JSON/HTML via their postcode lookup
- Update frequency: Varies (some update quarterly, some annually)
- Challenge: 20+ different company formats, needs individual Playwright scrapers
- Value: Most granular and current drinking water data available — this is what the postcode pages are primarily built on

**Source 3: Environment Agency Water Quality API — SUPPLEMENTARY**
- URL: `environment.data.gov.uk/water-quality/`
- API spec: OpenAPI 3.1.0 (version 1.2.1), Swagger at `/water-quality/api/swagger`
- What it measures: ENVIRONMENTAL water quality — rivers, groundwater, trade discharges, sewage effluent. NOT treated drinking water.
- Coverage: 72 million observations, 58,000+ sampling points, 8,070 determinands, 2000–present
- Key endpoints (verified working):
  - `GET /water-quality/sampling-point` — list/search sampling points (supports `lat`, `long`, `dist` for radius search in km)
  - `GET /water-quality/sampling-point/{id}/observation` — measurements for a specific point
  - `GET /water-quality/codelist/determinand` — all measurable parameters
  - `POST /water-quality/data/observation` — bulk data queries
  - Required header: `Accept: application/ld+json`
- PFAS data: 50+ perfluoro compounds tracked (determinand notations 2942-3037+). This is WHERE the PFAS story lives — environmental monitoring catches PFAS contamination that tap water testing doesn't yet cover.
- Sampling point types: River/running surface water, lake/still surface water, groundwater, canal, estuary/tidal, sewage/trade discharge. No "drinking water" category.
- Cost: Free, open data, no API key
- Value for us: (a) PFAS detection data — the headline differentiator; (b) source water quality for supply zones (if a river feeding your treatment works has high nitrate, that's relevant); (c) environmental contamination context for each area

**Source 4: Water UK Postcode Lookup — MAPPING LAYER**
- URL: `water.org.uk/customers/find-your-supplier/`
- Coverage: Every UK postcode → water company mapping
- This is the starting point: enter a postcode, get the water company name
- We scrape this once to build the master mapping table, then maintain it

**Source 5: Scottish Water / Northern Ireland Water — EXPANSION**
- Separate regulatory frameworks (DWQR for Scotland, DWI-NI for Northern Ireland)
- Scottish Water publishes zone-level data; NI Water has similar tools
- Phase 2 expansion — same architecture, different data sources

### How the Data Layers Combine Per Page

For a postcode page like `/postcode/SW1A/`, the data comes from:

```
1. Water UK lookup: SW1A → Thames Water → Supply Zone "London Central"
2. DWI data: Thames Water London Central zone → lead 0.003mg/L ✅, nitrate 28mg/L ✅, etc.
3. Thames Water scraper: SW1A postcode lookup → latest compliance readings
4. EA API: Nearest sampling points to SW1A (lat/long radius search) →
   environmental context + PFAS readings from nearby surface/groundwater
5. Combined: Drinking water quality (DWI + company) + environmental context (EA)
   → safety score + filter recommendations
```

The postcode page then presents:
- **Drinking water quality** (DWI + company data) as the PRIMARY information
- **Environmental water context** (EA data) as supplementary, clearly labelled: "Nearby environmental monitoring also detected..."
- **PFAS section** drawing mainly from EA environmental data, clearly noting: "While not yet monitored in your tap water, PFAS has been detected in nearby water sources at [LEVEL]"

This distinction matters for credibility. We don't claim EA environmental data represents what's in someone's tap. We present it as additional context.

### Data Pipeline Architecture

```
[Water Company Scrapers] ──→ [Playwright/Scrapy] ──→ [Supabase: drinking_water_readings]
[DWI Annual Reports]     ──→ [PDF/Excel Parser]  ──→ [Supabase: dwi_compliance]
[EA Water Quality API]   ──→ [Python ETL]         ──→ [Supabase: environmental_readings]
[Water UK Lookup]        ──→ [One-time scrape]    ──→ [Supabase: postcode_supplier_map]
                                                            ↓
                                                   [Scoring Engine (Python)]
                                                            ↓
                                                   [Supabase: page_data (denormalized)]
                                                            ↓
                                                   [Next.js ISR / SSG]
```

### Postcode → Supply Zone Mapping (Critical Path)

UK water supply zones don't align perfectly with postcodes. The mapping chain:

1. Scrape Water UK's postcode lookup → `postcode_district → water_company`
2. Scrape each water company's zone information → `water_company → supply_zones`
3. Map supply zones to geographic areas using boundary data where available
4. Map postcode centroids (from ONS Postcode Directory, free) to nearest EA sampling points via PostGIS radius queries
5. Result: `postcode → supplier → supply_zone → drinking_water_data + nearest_environmental_data`

This mapping table is built once, then maintained monthly (supply zone boundaries occasionally change when companies reorganize).

### Automation Schedule (AI Agent)

- **Daily (2am):** Query EA API for new environmental observations in areas with live pages. Update environmental readings.
- **Weekly (Monday):** Re-scrape water company postcode tools for the 50 highest-traffic postcodes. Flag any data changes.
- **Monthly:** Full re-scrape of all water company tools. Rebuild postcode→zone mapping. Check for new supply zone configurations.
- **Quarterly:** Ingest new DWI annual/quarterly data when published. Full data refresh across all pages.
- **Event-triggered:** When water company incidents are detected (RSS monitoring), immediately update affected postcode pages.

---

## 4. Site Architecture & Page Structure

### URL Structure

```
tapwater.uk/
├── /                           → Homepage (postcode search box)
├── /postcode/                  → Postcode directory (A-Z)
│   ├── /postcode/SW1A/         → Postcode district page (2,979 pages)
│   ├── /postcode/E1/
│   └── ...
├── /area/                      → Area/city directory
│   ├── /area/london/           → City overview page
│   ├── /area/manchester/
│   ├── /area/birmingham/
│   └── ...                     → (~500-1000 city/town pages)
├── /supplier/                  → Water company pages
│   ├── /supplier/thames-water/
│   ├── /supplier/severn-trent/
│   └── ...                     → (~25 supplier pages)
├── /contaminant/               → Contaminant explainer pages
│   ├── /contaminant/pfas/
│   ├── /contaminant/lead/
│   ├── /contaminant/nitrate/
│   └── ...                     → (~30-50 contaminant pages)
├── /filters/                   → Filter recommendation hub
│   ├── /filters/pfas/          → Best filters for PFAS removal
│   ├── /filters/under-sink/
│   ├── /filters/whole-house/
│   ├── /filters/jug/
│   └── ...                     → (~15-20 filter category pages)
├── /guides/                    → Editorial content
│   ├── /guides/pfas-uk-explained/
│   ├── /guides/water-hardness-map/
│   └── ...                     → (~50-100 guides over time)
└── /about/
    ├── /about/data-sources/
    └── /about/methodology/
```

**Launch page count (Phase 1):** ~50 high-quality postcode pages + 5 editorial guides + tool/about pages = ~65 total
**Growth target:** 200 pages by month 2, 500-800 by month 6, 2,000+ by month 12 — all gated on index coverage staying above 70%

### Postcode District Page Template (The Money Page)

This is the core programmatic page. Every district page follows the same template, populated with data:

```
[H1] Tap Water Quality in {POSTCODE_DISTRICT} ({AREA_NAME}) — {YEAR}

[Safety Score Badge] — Overall: 7.2/10

[Quick Summary]
Your water in {DISTRICT} is supplied by {SUPPLIER}. Based on the latest
Environment Agency data ({LAST_SAMPLE_DATE}), we found {X} contaminants
detected, with {Y} exceeding recommended levels.

[PFAS Alert Banner — if applicable]
⚠️ PFAS (forever chemicals) were detected in your area at {LEVEL} µg/L.
The UK has no legal limit for PFAS in drinking water.
[Link: What is PFAS? → /contaminant/pfas/]

[Table: Key Contaminants]
| Contaminant | Your Level | UK Limit | WHO Guideline | Status |
|-------------|-----------|----------|---------------|--------|
| Lead        | 0.003 mg/L | 0.01    | 0.01          | ✅ Pass |
| Nitrate     | 28 mg/L    | 50      | 50            | ✅ Pass |
| PFAS (sum)  | 0.08 µg/L  | None    | 0.1           | ⚠️ Near limit |

[Section: What's In Your Water]
Detailed breakdown of all measured parameters with context.

[Section: Your Water Supplier]
{SUPPLIER} serves {X} million customers across {REGION}.
Latest compliance rate: {X}%.
[Link: Full supplier report → /supplier/{slug}/]

[Section: How to Improve Your Water] ← AFFILIATE SECTION
Based on the contaminants detected in {DISTRICT}, we recommend:

[Product Card: Best Filter for Your Area]
→ {FILTER_NAME} — Removes PFAS, lead, chlorine
→ Certified: NSF/WQA
→ Price: £{PRICE}
→ [Check Price on Amazon] ← affiliate link
→ [Check Price on {BRAND}] ← direct affiliate link

[Product Card: Budget Option]
→ ...

[Product Card: Whole-House Option]
→ ...

[Section: Nearby Areas]
Internal links to adjacent postcode district pages.

[Section: Methodology]
How we calculate scores, data sources, last updated date.

[Schema.org structured data for local search]
```

### Key SEO Elements Per Page

- **Title tag:** `{POSTCODE} Water Quality: Is It Safe? | {AREA} {YEAR} | TapWater.uk`
- **Meta description:** `Check tap water quality in {POSTCODE}. {X} contaminants tested. PFAS levels, lead, nitrate & more. Free {YEAR} report for {AREA}.`
- **H1:** Unique per page with postcode + area name
- **Internal links:** 5-10 per page (nearby postcodes, supplier, contaminant pages)
- **Schema markup:** LocalBusiness, Dataset, FAQPage
- **Last updated timestamp:** Signals freshness to Google

---

## 5. Monetization Strategy

### Revenue Stream 1: Water Filter Affiliates (Primary — 60% of revenue)

**How it works:**
Each postcode page shows contaminant data, then recommends specific filters that address those contaminants. Recommendations are dynamic — a page with high PFAS shows PFAS-rated filters, a page with high lead shows lead-rated filters.

**Programs to join:**

| Program | Commission | Cookie | Avg. Order Value | Est. EPC |
|---------|-----------|--------|------------------|----------|
| Amazon UK Associates | 3-4% | 24hr | £40-80 | £1.50-3.00 |
| Osmio Water (UK) | TBC (apply) | TBC | £80-300 | est. £10-30 |
| Waterdrop (global) | ~10% | 30 days | £30-100 | £3-10 |
| ZeroWater Europe | TBC (apply) | TBC | £25-60 | est. £3-6 |
| TAPP Water (EU) | TBC (apply) | TBC | £30-50 | est. £3-5 |

**Revenue projections are in Section 11** (three scenarios: best/base/worst, reflecting the cautious rollout and Google risk). See that section for month-by-month numbers.

### Revenue Stream 2: Display Ads (Secondary — 25% of revenue)

- Join Mediavine or Raptive once traffic exceeds 50K sessions/month
- RPM for health/home niche in UK: £8-15 per 1,000 pageviews
- At 80K monthly visitors: £640-1,200/month additional

### Revenue Stream 3: Water Testing Kit Affiliates (10% of revenue)

- Home water testing kits (£15-40 each, 10-20% commission)
- WaterGraph already sells a £30 postal lab test — we can compete or affiliate
- "Want to verify your data? Get your water independently tested"

### Revenue Stream 4: Lead Generation (Future — 5% of revenue)

- Plumber referrals for pipe replacement (lead pipes detected)
- Water softener installation leads (hard water areas)
- £20-50 per qualified lead

### Break-even Analysis

| Cost | Monthly |
|------|---------|
| Hosting (Vercel Pro) | £16 |
| Domain renewals (amortized) | £4 |
| Supabase (Pro) | £20 |
| Data pipeline (serverless functions) | £5-10 |
| **Total fixed costs** | **~£50/month** |

Break-even: ~10 filter sales/month through affiliate links. Achievable within month 2-3.

---

## 6. Tech Stack

| Component | Tool | Why |
|-----------|------|-----|
| Framework | Next.js 14+ (App Router) | ISR for programmatic pages, great SEO |
| Hosting | Vercel | Edge functions, ISR, fast UK delivery |
| Database | Supabase (Postgres) | Free tier is enough to start, PostGIS for geo queries |
| Data pipeline | Python scripts + Supabase Edge Functions | ETL from EA API, scraping |
| Styling | Tailwind CSS | Fast, clean, consistent |
| Search | Postcode autocomplete via OS Places API or free alternative | UX |
| Analytics | Plausible or Umami (self-hosted) | Privacy-first, GDPR compliant |
| Affiliate tracking | Custom redirect layer + UTM | Track which pages convert |
| Maps | Mapbox or Leaflet (free) | Visual water quality map |

### Build Phases

**Phase 1 — Foundation + Quality MVP (Weeks 1-3):**
- Set up Next.js project on Vercel with Supabase backend
- Build data pipeline from EA Water Quality API
- Create postcode → supplier mapping table
- Write 5 core editorial articles (PFAS guide, methodology, lead pipes, water hardness, supplier explainer)
- Build homepage with postcode search + interactive UK water quality map
- Generate **50 high-quality postcode pages** (London zones + top 10 UK cities)
- Each page: unique data, interactive comparison tool, dynamic filter recommendations
- Build about/methodology/data-sources pages (E-E-A-T foundation)
- Basic affiliate integration (Amazon + 1-2 direct programs)
- Deploy and submit 50-page sitemap to GSC

**Phase 2 — Validate & Expand Carefully (Weeks 4-8):**
- Monitor GSC: Are pages being indexed? What's the coverage ratio?
- If indexing healthy (>70%): expand to 200 postcode pages
- Write 10 more editorial guides targeting specific search queries
- Build contaminant explainer pages (PFAS, lead, nitrate, etc.) — ~20 pages
- Add 25 water supplier profile pages
- Implement internal linking strategy
- **Critical check: If indexing rate drops below 70%, STOP expanding and fix quality**

**Phase 3 — Scale With Confidence (Months 3-5):**
- If Phase 2 validates: scale to 500, then 1,000 postcode pages (adding 200-300/month)
- Add city/area overview pages as supporting content (~100 pages)
- Build interactive tools: postcode comparison, filter finder, trend charts
- Start link building (PR around PFAS, local press outreach, resource links)
- Add schema.org markup across all pages
- Set up automated data refresh pipeline (AI agent daily updates)
- Target: 1,000 quality pages by end of month 5

**Phase 4 — Monetization + Continued Growth (Months 5-8):**
- A/B test filter recommendation layouts and CTA positioning
- Build email capture (weekly water quality alerts by postcode)
- Add water testing kit affiliates
- Scale to 2,000+ pages (only if index coverage stays healthy)
- Apply for Mediavine/Raptive when traffic qualifies (50K sessions/month)
- Explore lead gen for plumbers/water softener installers
- Begin Scotland/N. Ireland expansion with same careful rollout approach

---

## 6B. Frontend Design System — 2026 Standards

This section is the build spec for Claude Code. Every component, every colour, every interaction pattern is defined here so the frontend can be built without guessing.

### Design Philosophy

The site sits between two failure modes: (a) ugly data dump that nobody trusts, and (b) over-designed marketing site that buries the data. The target is **Stripe documentation meets BBC News data visualisation** — clean, confident, data-forward, with enough visual polish to signal authority but no gratuitous animations or design flourishes.

Reference benchmark: TapWaterData.com (US competitor) uses card-based layouts, blue/amber colour scheme, lucide-react icons. We beat them with better data density, more interactive tools, tighter typography, and a distinctly British design sensibility.

### Colour System

```
--color-safe:         #22c55e   (green-500 — "all clear")
--color-warning:      #f59e0b   (amber-500 — "watch this")
--color-danger:       #ef4444   (red-500 — "exceeds limit")
--color-info:         #3b82f6   (blue-500 — informational)
--color-pfas:         #a855f7   (purple-500 — PFAS-specific, distinctive)

--color-primary:      #0f172a   (slate-900 — headings, primary text)
--color-secondary:    #475569   (slate-600 — body text, descriptions)
--color-muted:        #94a3b8   (slate-400 — metadata, timestamps)
--color-surface:      #ffffff   (white — card backgrounds)
--color-background:   #f8fafc   (slate-50 — page background)
--color-border:       #e2e8f0   (slate-200 — card borders, dividers)
--color-border-hover: #cbd5e1   (slate-300 — interactive hover states)

--color-cta:          #2563eb   (blue-600 — affiliate buttons, primary CTAs)
--color-cta-hover:    #1d4ed8   (blue-700 — hover state)
```

PFAS gets its own purple because it's the differentiator. Whenever PFAS appears, it stands out from the green/amber/red safety spectrum. This is intentional — it signals "this is something different that the UK doesn't regulate yet."

### Typography

```
--font-heading: 'Inter', system-ui, -apple-system, sans-serif
--font-body:    'Inter', system-ui, -apple-system, sans-serif
--font-mono:    'JetBrains Mono', 'Fira Code', monospace  (data values, measurements)

Scale (mobile → desktop):
--text-hero:    2rem → 3rem      (homepage H1 only)
--text-h1:      1.75rem → 2.25rem (page titles)
--text-h2:      1.25rem → 1.5rem  (section headings)
--text-h3:      1.1rem → 1.25rem  (card titles, subsections)
--text-body:    0.9375rem → 1rem  (15px → 16px — slightly larger than typical for readability)
--text-small:   0.8125rem → 0.875rem (metadata, timestamps, disclaimers)
--text-data:    1.5rem → 2rem     (big numbers in stat cards — monospace)

Line heights: 1.5 for body, 1.3 for headings, 1.2 for data values
Letter spacing: -0.025em for headings, normal for body
```

Inter is loaded from Google Fonts (woff2, subset Latin). JetBrains Mono loaded only on postcode pages where data values appear. Both fonts have `font-display: swap` to prevent FOIT.

### Component Library

All components built with Tailwind CSS utility classes. No component library dependency (no shadcn in production — keeps bundle small). Components listed here are the build spec.

**Component 1: Safety Score Badge**
The hero element of every postcode page. Large circular badge showing the overall score.

```
┌──────────────────────────────────────┐
│                                      │
│           ┌─────────┐                │
│           │  7.2     │  ← score in --text-data, --font-mono
│           │  /10     │  ← smaller, --color-muted
│           └─────────┘                │
│         Overall Score                │
│                                      │
│   Ring colour: green/amber/red       │
│   based on score threshold           │
│   (≥7 green, 4-6.9 amber, <4 red)   │
│                                      │
└──────────────────────────────────────┘
```

Implementation: SVG ring (stroke-dasharray animation on load). Ring colour transitions through the safe→warning→danger scale. Score number uses tabular-nums for stable width. Accessible: `aria-label="Water quality score: 7.2 out of 10, rated good"`.

**Component 2: Stat Cards Row**
Four cards in a row on desktop (2×2 on mobile) showing key metrics at a glance.

```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ 12       │ │ 2        │ │ Thames   │ │ Mar 2026 │
│ Tested   │ │ Flagged  │ │ Water    │ │ Updated  │
│ Params   │ │ ⚠️       │ │ Supplier │ │ ✓        │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

Implementation: `grid grid-cols-2 lg:grid-cols-4 gap-3`. Each card: white bg, 1px border, rounded-lg, p-4. Big number top (--font-mono, --text-data), label below (--text-small, --color-secondary). Flagged card uses amber border-left-4 when count > 0.

**Component 3: Contaminant Data Table**
The core data display. NOT a plain HTML table — a card-based responsive list that works on mobile.

Desktop (≥768px): Traditional table with columns: Contaminant | Your Level | UK Limit | WHO Guideline | Status
Mobile (<768px): Each contaminant becomes a card with key-value pairs stacked vertically.

```
Desktop:
┌─────────────┬──────────┬──────────┬──────────┬────────┐
│ Contaminant │ Level    │ UK Limit │ WHO      │ Status │
├─────────────┼──────────┼──────────┼──────────┼────────┤
│ Lead        │ 0.003    │ 0.010    │ 0.010    │ ✅ OK  │
│ Nitrate     │ 28.0     │ 50.0     │ 50.0     │ ✅ OK  │
│ PFAS (sum)  │ 0.08     │ —        │ 0.10     │ ⚠️     │
└─────────────┴──────────┴──────────┴──────────┴────────┘

Mobile:
┌────────────────────────────────────┐
│ Lead                          ✅   │
│ Your level: 0.003 mg/L            │
│ UK limit: 0.010 │ WHO: 0.010      │
│ ████░░░░░░ 30% of limit           │
├────────────────────────────────────┤
│ PFAS (sum)                    ⚠️   │
│ Your level: 0.08 µg/L             │
│ UK limit: None │ WHO: 0.10        │
│ ████████░░ 80% of WHO guideline   │
│ 🟣 No UK legal limit for PFAS     │
└────────────────────────────────────┘
```

The progress bar (████░░░░░░) is a visual inline bar showing how close the reading is to the limit. Green when <50%, amber 50-90%, red >90%. PFAS rows get the purple accent border.

**Component 4: PFAS Alert Banner**
Conditionally rendered when PFAS detected in the area's environmental monitoring.

```
┌──────────────────────────────────────────────────────────┐
│ 🟣 PFAS Detected Near Your Area                         │
│                                                          │
│ Forever chemicals (PFAS) were found at 0.08 µg/L in     │
│ environmental monitoring near SW1A. The UK has no legal  │
│ limit for PFAS in drinking water.                        │
│                                                          │
│ [What is PFAS?]  [View filters that remove PFAS]        │
└──────────────────────────────────────────────────────────┘
```

Implementation: purple-50 bg, purple-500 left border (4px), purple-700 heading text. Links use --color-cta. Only shows when PFAS environmental readings exist for the area. Dismissible via localStorage (tracks `pfas-banner-dismissed-{postcode}`).

**Component 5: Filter Recommendation Cards**
The affiliate conversion area. Three cards: Best Overall, Best Budget, Best Whole-House.

```
┌────────────────────────────────────────────────────────┐
│ 💧 Recommended Filters for {POSTCODE}                  │
│    Based on contaminants detected in your area          │
│                                                         │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│ │ BEST MATCH  │ │ BUDGET      │ │ WHOLE HOUSE │       │
│ │             │ │             │ │             │       │
│ │ [img]       │ │ [img]       │ │ [img]       │       │
│ │ Brand X     │ │ Brand Y     │ │ Brand Z     │       │
│ │ Pro Ultra   │ │ Basic       │ │ Complete    │       │
│ │             │ │             │ │             │       │
│ │ Removes:    │ │ Removes:    │ │ Removes:    │       │
│ │ ✓ PFAS     │ │ ✓ Chlorine │ │ ✓ PFAS     │       │
│ │ ✓ Lead     │ │ ✓ Lead     │ │ ✓ Lead     │       │
│ │ ✓ Chlorine │ │ ✓ Taste    │ │ ✓ All      │       │
│ │             │ │             │ │             │       │
│ │ £89        │ │ £29        │ │ £349       │       │
│ │ [Check     │ │ [Check     │ │ [Check     │       │
│ │  Price →]  │ │  Price →]  │ │  Price →]  │       │
│ └─────────────┘ └─────────────┘ └─────────────┘       │
│                                                         │
│ *Affiliate disclosure: links may earn commission        │
└────────────────────────────────────────────────────────┘
```

Implementation: Blue-50 bg section wrapper. Cards: white bg, rounded-xl, shadow-sm on hover → shadow-md transition. "Best Match" card gets blue-500 top border. CTA button: bg-blue-600, text-white, rounded-lg, full width within card. Affiliate disclosure: text-xs, slate-400, below the cards.

The filter selection is DATA-DRIVEN: the scoring engine tags each postcode with its problem contaminants, and the filter cards are matched from a `filters` table where each filter has a `removes` array. This is NOT random product placement — it's a recommendation engine.

**Component 6: Trend Chart**
Interactive line chart showing historical water quality for the area. Built with Recharts (React charting library, already in the Next.js ecosystem).

```
Water Quality Trend — SW1A (2020–2026)
Score
10 │
 8 │          ●───●───●───●
 6 │     ●───●                ●───●
 4 │ ●──●
 2 │
   └──────────────────────────────────
     2020  2021  2022  2023  2024  2025
```

Shows overall score over time. Hover shows specific readings for that period. Tabs to switch between overall score, specific contaminants (lead, nitrate, PFAS). Data source: historical EA readings + DWI annual data points.

**Component 7: Postcode Comparison Tool**
Interactive widget — user enters two postcodes, sees side-by-side comparison. This is the "tool not just text" differentiator that Google values.

```
┌──────────────────────────────────────────────────────────┐
│ Compare Water Quality                                     │
│                                                           │
│ ┌──────────────┐  vs  ┌──────────────┐  [Compare →]      │
│ │ SW1A         │      │ E1           │                    │
│ └──────────────┘      └──────────────┘                    │
│                                                           │
│ ┌────────────────────┬────────────────────┐              │
│ │ SW1A (Westminster) │ E1 (Whitechapel)   │              │
│ ├────────────────────┼────────────────────┤              │
│ │ Score: 7.2/10      │ Score: 6.8/10      │              │
│ │ Supplier: Thames   │ Supplier: Thames   │              │
│ │ PFAS: 0.02 µg/L    │ PFAS: 0.08 µg/L   │              │
│ │ Lead: 0.003 mg/L   │ Lead: 0.007 mg/L   │              │
│ │ Hardness: 280 mg/L │ Hardness: 310 mg/L │              │
│ └────────────────────┴────────────────────┘              │
│                                                           │
│ "Moving house? Compare water quality between areas"       │
└──────────────────────────────────────────────────────────┘
```

This tool generates internal links (both postcodes link to their full pages), drives engagement time, and is exactly the kind of functional utility that survives Google's programmatic SEO filters.

**Component 8: Email Capture**
Postcode-specific email alert signup. Below the contaminant data, above the filter recommendations.

```
┌──────────────────────────────────────────────────────────┐
│ 🔔 Get Alerts for {POSTCODE}                             │
│                                                           │
│ We'll email you when water quality data changes in your   │
│ area, or if a water incident affects your supply.         │
│                                                           │
│ ┌──────────────────────────┐ [Subscribe]                  │
│ │ your@email.com           │                              │
│ └──────────────────────────┘                              │
│                                                           │
│ No spam. Monthly updates + breaking alerts only.          │
└──────────────────────────────────────────────────────────┘
```

Implementation: slate-100 bg, rounded-xl, p-6. Input + button inline on desktop, stacked on mobile. Email stored in Supabase `subscribers` table with postcode_district field. Sends via Resend (or Postmark) — transactional emails only, no marketing platform needed at launch.

**Component 9: Homepage**
The homepage is a search tool, not a marketing page. Visitors arrive wanting to check their postcode.

```
┌──────────────────────────────────────────────────────────┐
│                                                           │
│  tapwater.uk                              [About] [Data] │
│                                                           │
│              What's in your tap water?                    │
│                                                           │
│         ┌──────────────────────────────┐                  │
│         │ Enter your postcode...       │  [Check →]       │
│         └──────────────────────────────┘                  │
│                                                           │
│     Free water quality report based on government data    │
│                                                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ 2,979    │ │ 58M+     │ │ 50+      │ │ Updated  │    │
│  │ Postcode │ │ Measure- │ │ PFAS     │ │ Daily    │    │
│  │ Areas    │ │ ments    │ │ Readings │ │          │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
│                                                           │
│  ─── Recent Alerts ───                                    │
│  ⚠ Thames Water: Elevated turbidity in SE London (Mar 26)│
│  ⚠ Yorkshire Water: Boil notice lifted, Harrogate (Mar 2)│
│                                                           │
│  ─── UK Water Quality Map ───                             │
│  [Interactive Mapbox/Leaflet choropleth map               │
│   showing water quality score by postcode district,       │
│   coloured green → amber → red.                           │
│   Click any area → goes to that postcode page]            │
│                                                           │
│  ─── Most Checked Areas ───                               │
│  London SW1 · Manchester M1 · Birmingham B1 · Leeds LS1  │
│                                                           │
│  ─── Latest PFAS Data ───                                 │
│  [3-4 cards showing areas with highest PFAS readings]     │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

The postcode input uses OS Places API (or free postcode.io) for autocomplete. On submit, redirects to `/postcode/{DISTRICT}/`. No page reload — client-side navigation.

### Page Layouts

**Postcode page layout (the money page):**
```
[Header: logo + nav]
[Breadcrumb: Home > Postcode > SW1A]
[H1 + area name + year]
[Safety Score Badge — centred, large]
[4 Stat Cards — row]
[PFAS Alert Banner — conditional]
[Contaminant Data Table/Cards]
[Trend Chart]
[Comparison Tool]
[Email Capture]
[Filter Recommendations — affiliate section]
[Nearby Areas — internal links grid]
[Supplier Info — link to supplier page]
[Methodology Note + data source citations]
[Footer]
```

**Supplier page layout:**
```
[Header]
[H1: {Supplier Name} Water Quality Report]
[Company stats: customers served, region, compliance rate]
[Supply zone map (Leaflet)]
[Compliance history table (DWI data)]
[Top contaminant issues across zones]
[Postcode areas served — links grid]
[Footer]
```

**Contaminant explainer page layout:**
```
[Header]
[H1: {Contaminant} in UK Drinking Water]
[Quick facts card: what it is, where it comes from, health effects]
[UK legal limit vs WHO guideline vs EU standard]
[Map: where this contaminant is highest across UK]
[How to remove it — filter recommendations (affiliate)]
[Related contaminants]
[Footer]
```

### Performance Budget (Core Web Vitals)

These are hard requirements, not aspirations. Google uses CWV as a ranking signal, and programmatic pages with poor performance get deprioritized.

```
Metric          Target      Absolute Max
─────────────────────────────────────────
LCP             < 1.8s      < 2.5s
FID / INP       < 100ms     < 200ms
CLS             < 0.05      < 0.1
TTFB            < 200ms     < 400ms
Total JS        < 120KB     < 200KB (gzipped)
Total CSS       < 20KB      < 40KB (gzipped)
First load      < 300KB     < 500KB (total transfer)
```

How we achieve this:
- Next.js ISR: Pages are pre-rendered as static HTML at build time or on first request, then cached at Vercel's edge. No server-side rendering on every hit.
- Tailwind CSS: Purged in production — only used classes ship. Typically <15KB gzipped.
- Inter font: Subsetted Latin only, woff2, ~20KB. Loaded with `font-display: swap`.
- JetBrains Mono: Loaded lazily (only on pages with data tables), <15KB.
- Recharts: Loaded lazily via `next/dynamic` — only loads when trend chart scrolls into viewport (Intersection Observer).
- Mapbox/Leaflet: Only on homepage and supplier pages. Lazy loaded. GL JS is heavy (~200KB) but deferred.
- Images: Product images (filter recommendations) served via Next.js Image component with WebP/AVIF, lazy loaded, explicit width/height to prevent CLS.
- No client-side data fetching on postcode pages: All data is baked into the static page at build time. Zero API calls on page load.

### What Makes This "Next Level" — The 2026 Design Differentiators

The component spec above is the functional foundation. This section is what makes people screenshot the site, share it on X, and link to it unprompted.

**1. The Score Reveal Animation**
When a user searches their postcode and the page loads, the safety score doesn't just appear — it builds.

```
0.0s: Page loads. Score badge is empty circle (slate-200 stroke).
0.2s: Number counts up from 0.0 to final score (eased, 800ms).
0.3s: Ring stroke animates from 0 to proportional fill (stroke-dashoffset transition).
0.5s: Ring colour transitions from neutral → final colour (green/amber/red).
1.0s: Score grade text fades in below ("Good", "Fair", etc.).
1.2s: Stat cards slide up with stagger (50ms delay between each).
```

This 1.2-second choreographed reveal creates the "moment" — the user feels like they're getting a personal result, not loading a static page. Same psychology as credit score reveals (ClearScore, Experian) which have proven engagement metrics.

`prefers-reduced-motion`: All animations disabled. Score and cards appear immediately.

**2. Contextual Colour Gradients**
The page background isn't flat white. It has a subtle radial gradient in the hero area that reflects the safety score:

```css
/* Score ≥ 7: subtle green glow */
background: radial-gradient(ellipse at top, rgba(34,197,94,0.04) 0%, transparent 60%);

/* Score 4-6.9: subtle amber glow */
background: radial-gradient(ellipse at top, rgba(245,158,11,0.04) 0%, transparent 60%);

/* Score < 4: subtle red glow */
background: radial-gradient(ellipse at top, rgba(239,68,68,0.04) 0%, transparent 60%);
```

It's barely perceptible consciously but it sets the emotional tone of the page. This is the kind of detail that separates "data website" from "feels premium."

**3. The "Water Drop" Interaction Pattern**
Every data card has a subtle water-ripple hover effect. When you hover (or tap on mobile), a CSS-only ripple animation emanates from the cursor position:

```css
.data-card {
  position: relative;
  overflow: hidden;
}
.data-card::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  background: rgba(59, 130, 246, 0.06);
  transform: scale(0);
  transition: transform 0.5s ease-out, opacity 0.5s;
}
.data-card:hover::after {
  transform: scale(4);
  opacity: 0;
}
```

Pure CSS, no JS. Barely adds any weight. But it makes the site feel alive and thematic.

**4. Progress Bars on Contaminant Readings**
Instead of just numbers in a table, each contaminant reading has an animated progress bar showing how close it is to the limit. These bars fill on scroll (Intersection Observer triggers animation when the table enters viewport).

```
Lead    ███░░░░░░░░░░░░  30% of UK limit     ✅
Nitrate ██████████░░░░░  56% of UK limit     ✅
PFAS    ████████████░░░  80% of WHO guideline ⚠️  🟣
```

The PFAS bar uses the purple gradient (`from-purple-400 to-purple-600`) to visually distinguish it from regulated contaminants. Users immediately see "this one is different."

**5. Dark Mode**
Full dark mode support via `prefers-color-scheme: dark` + manual toggle in header.

```
Dark mode overrides:
--color-surface:     #1e293b  (slate-800)
--color-background:  #0f172a  (slate-900)
--color-primary:     #f1f5f9  (slate-100)
--color-secondary:   #94a3b8  (slate-400)
--color-border:      #334155  (slate-700)

Score ring, safety colours, PFAS purple all remain the same
(they're designed to work on both light and dark backgrounds).
```

Dark mode is stored in a cookie (not localStorage) so the server can set it on first render — no flash of wrong theme.

**6. Mobile-First Micro-UX**
Mobile isn't "desktop but smaller." Specific mobile-only patterns:

- **Sticky postcode header:** On scroll, a slim 48px header sticks showing the postcode + score: `SW1A — 7.2/10 ✅`. Tapping it scrolls to top.
- **Swipeable contaminant cards:** On mobile, the contaminant cards are in a horizontal scroll container. User swipes through them. A dot indicator shows position.
- **Bottom sheet for comparison tool:** On mobile, the comparison tool opens as a bottom sheet (slides up from bottom, 60% height) rather than inline. Feels native.
- **Haptic feedback on score reveal:** On iOS Safari, a subtle vibration on the score number landing (using `navigator.vibrate` where available). Tiny detail, big impact on perceived quality.
- **Pull-to-refresh:** On the postcode page, pulling down shows "Checking for new data..." and triggers a revalidation call.

**7. Shareable Water Report Card**
Every postcode page has a "Share your water report" button that generates a social-card-style image (via `html2canvas` or a server-side OG image generator using `@vercel/og`):

```
┌──────────────────────────────┐
│  tapwater.uk                 │
│                              │
│  Water Quality: SW1A         │
│  Westminster, London         │
│                              │
│         7.2 / 10             │
│          Good ✅              │
│                              │
│  PFAS: 0.02 µg/L            │
│  Lead: 0.003 mg/L           │
│  12 contaminants tested      │
│                              │
│  Check yours: tapwater.uk    │
└──────────────────────────────┘
```

This image is the `og:image` for every postcode page (dynamically generated). When someone shares a link on WhatsApp, X, or Facebook, it shows this card with their specific data. This is the viral mechanic — people share their score, friends check theirs.

The OG image is generated server-side using Vercel's `ImageResponse` API (~2ms per image, cached at the edge). No external service needed.

**8. The Homepage Map — Interactive, Not Decorative**
The UK water quality map on the homepage isn't a static image. It's a Mapbox GL JS choropleth map with postcode district boundaries coloured by safety score.

Interaction:
- Hover over any area → tooltip: "SW1A – Westminster – Score: 7.2/10"
- Click → navigates to that postcode page
- Zoom → more detail reveals
- Toggle overlays: Overall score / PFAS levels / Hardness
- On mobile: tap + hold shows tooltip, tap navigates

The map alone is worth linking to. Environmental journalists, bloggers, and Reddit users WILL embed or screenshot "the UK PFAS map." This is link bait built into the core product.

**9. Skeleton Loading States**
No page ever shows a blank white screen or a spinner. Every component has a skeleton state that matches its final layout:

```
┌──────────────────────────────┐
│    ┌─────────┐               │
│    │ ░░░░░░░ │  ← grey pulse │
│    │ ░░░░    │               │
│    └─────────┘               │
│  ░░░░░░░░░░░░░░              │
│                              │
│ ┌──────┐ ┌──────┐ ┌──────┐  │
│ │ ░░░░ │ │ ░░░░ │ │ ░░░░ │  │
│ │ ░░   │ │ ░░   │ │ ░░   │  │
│ └──────┘ └──────┘ └──────┘  │
└──────────────────────────────┘
```

Skeletons use `animate-pulse` (Tailwind built-in). They match the exact dimensions of the final content to prevent CLS.

**10. Micro-Copy That Builds Trust**
Small text details that compound into credibility:

- Below every data value: "Source: DWI 2025 Annual Report" or "Source: EA sampling point TH-SW1A-003, sampled 14 Mar 2026" — clickable to source
- Below the safety score: "Based on 12 regulated parameters. Methodology →"
- Below filter recommendations: "We test our recommendations independently. Affiliate links may earn us a commission at no cost to you."
- In the footer: "Data updated daily from government sources. Last check: [timestamp]"
- On data cells with missing values: "Not tested" (not blank, not "N/A")

This micro-copy is what makes the difference between "this feels like a scraper site" and "this feels like an authoritative resource." Google's quality raters look for exactly this.

### Responsive Breakpoints

```
Mobile:        < 640px    (single column, stacked cards)
Tablet:        640-1024px (2-column grids, side-by-side comparison)
Desktop:       > 1024px   (4-column stat cards, full table layout)
Max width:     1280px     (content centred, comfortable reading width)
```

### Accessibility Requirements

- WCAG 2.1 AA compliance minimum
- All safety colours have text labels (don't rely on colour alone: "✅ OK" not just green)
- Score badge has aria-label with full context
- Data tables use proper `<th>` scope attributes
- Focus states visible on all interactive elements (blue ring, 2px offset)
- Skip-to-content link on every page
- Reduced motion: respect `prefers-reduced-motion` (disable ring animation, chart animations)
- Contrast ratios: all text meets 4.5:1 minimum against its background

### Analytics Event Tracking

Privacy-first analytics via Plausible (hosted) or Umami (self-hosted). No cookies, GDPR-compliant by design.

**Events to track:**

```
Page-level:
- pageview (automatic)
- scroll_depth_50 (did they reach the contaminant table?)
- scroll_depth_75 (did they reach filter recommendations?)
- scroll_depth_100 (read the whole page)

Conversion:
- affiliate_click:{program}:{product_id} (clicked an affiliate link)
- affiliate_click_position:{section} (clicked from which section — hero, table, recommendations)
- email_signup:{postcode} (subscribed to alerts)
- email_signup_source:{page_type} (which page type converts best)

Engagement:
- comparison_tool_used (entered a second postcode)
- filter_finder_used (interacted with filter recommendation engine)
- contaminant_expanded:{contaminant} (clicked to expand details)
- chart_interacted (hovered/clicked on trend chart)
- search_performed:{postcode} (used the postcode search)

Technical:
- cwv_lcp:{value} (Core Web Vitals — real user monitoring)
- cwv_inp:{value}
- cwv_cls:{value}
```

Track CWV via `web-vitals` npm package, report to Plausible as custom events. This gives real field data, not just Lighthouse scores.

---

## 6C. Database Schema (Supabase / PostgreSQL + PostGIS)

Every table defined here so Claude Code can run the migrations directly.

### Tables

**`postcode_districts`** — The master list of UK postcode districts (2,979 rows)
```sql
CREATE TABLE postcode_districts (
  id              TEXT PRIMARY KEY,          -- 'SW1A', 'E1', 'M1', etc.
  area_name       TEXT NOT NULL,             -- 'Westminster', 'Whitechapel', etc.
  city            TEXT,                      -- 'London', 'Manchester', etc.
  region          TEXT,                      -- 'Greater London', 'North West', etc.
  latitude        DOUBLE PRECISION NOT NULL, -- centroid lat
  longitude       DOUBLE PRECISION NOT NULL, -- centroid lng
  geom            GEOMETRY(Point, 4326),     -- PostGIS point for radius queries
  supplier_id     TEXT REFERENCES water_suppliers(id),
  supply_zone     TEXT,                      -- supply zone name from water company
  population_est  INTEGER,                   -- estimated population (ONS)
  has_page        BOOLEAN DEFAULT FALSE,     -- is a page currently published?
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_postcode_geom ON postcode_districts USING GIST(geom);
CREATE INDEX idx_postcode_supplier ON postcode_districts(supplier_id);
CREATE INDEX idx_postcode_has_page ON postcode_districts(has_page);
```

**`water_suppliers`** — UK water companies (~25 rows)
```sql
CREATE TABLE water_suppliers (
  id              TEXT PRIMARY KEY,          -- 'thames-water', 'severn-trent', etc.
  name            TEXT NOT NULL,             -- 'Thames Water'
  region          TEXT,                      -- 'London and Thames Valley'
  customers_m     DECIMAL(4,1),             -- millions of customers
  website         TEXT,
  postcode_lookup_url TEXT,                  -- their water quality check URL
  scraper_type    TEXT,                      -- 'playwright', 'api', 'none'
  compliance_rate DECIMAL(5,2),             -- latest DWI compliance %
  last_scraped    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

**`drinking_water_readings`** — Readings from DWI data + water company scrapers
```sql
CREATE TABLE drinking_water_readings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  postcode_district TEXT REFERENCES postcode_districts(id),
  supplier_id     TEXT REFERENCES water_suppliers(id),
  supply_zone     TEXT,
  determinand     TEXT NOT NULL,             -- 'lead', 'nitrate', 'coliform', etc.
  value           DECIMAL(12,6),            -- measured value
  unit            TEXT NOT NULL,             -- 'mg/L', 'µg/L', 'count/100ml', etc.
  uk_limit        DECIMAL(12,6),            -- current UK legal limit (null if none)
  who_guideline   DECIMAL(12,6),            -- WHO guideline value (null if none)
  sample_date     DATE NOT NULL,
  source          TEXT NOT NULL,             -- 'dwi_annual', 'company_scrape', etc.
  source_ref      TEXT,                      -- DWI report ID or scrape batch ID
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dwr_postcode ON drinking_water_readings(postcode_district);
CREATE INDEX idx_dwr_determinand ON drinking_water_readings(determinand);
CREATE INDEX idx_dwr_date ON drinking_water_readings(sample_date DESC);
CREATE INDEX idx_dwr_postcode_det ON drinking_water_readings(postcode_district, determinand);
```

**`environmental_readings`** — Readings from EA Water Quality API
```sql
CREATE TABLE environmental_readings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sampling_point_id TEXT NOT NULL,           -- EA sampling point notation
  sampling_point_label TEXT,                 -- human-readable name
  sampling_point_type TEXT,                  -- 'river', 'groundwater', 'canal', etc.
  latitude        DOUBLE PRECISION,
  longitude       DOUBLE PRECISION,
  geom            GEOMETRY(Point, 4326),
  determinand_id  TEXT NOT NULL,             -- EA determinand notation (e.g. '2942' for PFOS)
  determinand_label TEXT,                    -- 'PFOS', 'Lead', etc.
  value           DECIMAL(12,6),
  unit            TEXT,
  sample_date     DATE NOT NULL,
  source_ref      TEXT,                      -- EA observation URI
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_env_geom ON environmental_readings USING GIST(geom);
CREATE INDEX idx_env_determinand ON environmental_readings(determinand_id);
CREATE INDEX idx_env_date ON environmental_readings(sample_date DESC);
CREATE INDEX idx_env_point ON environmental_readings(sampling_point_id);
```

**`page_data`** — Denormalized, pre-computed data for each published postcode page
```sql
CREATE TABLE page_data (
  postcode_district TEXT PRIMARY KEY REFERENCES postcode_districts(id),
  safety_score     DECIMAL(3,1) NOT NULL,    -- 0.0 to 10.0
  score_grade      TEXT NOT NULL,             -- 'excellent', 'good', 'fair', 'poor'
  contaminants_tested INTEGER,
  contaminants_flagged INTEGER,              -- exceeding limits or guidelines
  pfas_detected    BOOLEAN DEFAULT FALSE,
  pfas_level       DECIMAL(12,6),            -- µg/L, null if not detected
  pfas_source      TEXT,                      -- 'environmental' or 'drinking' (for transparency)
  top_concerns     JSONB,                    -- [{determinand, value, unit, limit, pct_of_limit}]
  all_readings     JSONB,                    -- full contaminant table data
  environmental_context JSONB,               -- nearby EA readings summary
  filter_recommendations JSONB,              -- [{filter_id, match_reason, priority}]
  summary_text     TEXT,                      -- pre-generated first paragraph (for GEO)
  nearby_postcodes TEXT[],                   -- array of adjacent districts for internal links
  last_data_update TIMESTAMPTZ,              -- when underlying data last changed
  last_page_build  TIMESTAMPTZ,              -- when the page was last regenerated
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
```

**`filters`** — Water filter products for affiliate recommendations
```sql
CREATE TABLE filters (
  id              TEXT PRIMARY KEY,          -- 'brita-maxtra-pro', 'osmio-zero', etc.
  brand           TEXT NOT NULL,
  model           TEXT NOT NULL,
  category        TEXT NOT NULL,             -- 'jug', 'under_sink', 'whole_house', 'countertop'
  removes         TEXT[] NOT NULL,           -- {'pfas', 'lead', 'chlorine', 'nitrate', ...}
  certifications  TEXT[],                    -- {'nsf_53', 'nsf_401', 'wqa'}
  price_gbp       DECIMAL(8,2),
  affiliate_url   TEXT,                      -- affiliate link
  affiliate_program TEXT,                    -- 'amazon_uk', 'osmio_direct', etc.
  image_url       TEXT,
  rating          DECIMAL(2,1),             -- product rating (1-5)
  active          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_filters_category ON filters(category);
CREATE INDEX idx_filters_active ON filters(active);
```

**`subscribers`** — Email alert signups
```sql
CREATE TABLE subscribers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL,
  postcode_district TEXT REFERENCES postcode_districts(id),
  verified        BOOLEAN DEFAULT FALSE,
  verification_token TEXT,
  unsubscribed    BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_subscribers_email_postcode ON subscribers(email, postcode_district);
```

**`scrape_log`** — Audit trail for all data pipeline runs
```sql
CREATE TABLE scrape_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source          TEXT NOT NULL,             -- 'ea_api', 'thames_water', 'dwi_annual', etc.
  status          TEXT NOT NULL,             -- 'success', 'partial', 'failed'
  records_fetched INTEGER,
  records_updated INTEGER,
  error_message   TEXT,
  duration_ms     INTEGER,
  started_at      TIMESTAMPTZ NOT NULL,
  completed_at    TIMESTAMPTZ
);
```

### PostGIS Queries (Key Patterns)

Find nearest EA sampling points to a postcode:
```sql
SELECT id, label, type,
       ST_Distance(geom, (SELECT geom FROM postcode_districts WHERE id = 'SW1A')) AS distance_m
FROM (SELECT DISTINCT ON (sampling_point_id) * FROM environmental_readings ORDER BY sampling_point_id, sample_date DESC) latest
WHERE ST_DWithin(
  geom,
  (SELECT geom FROM postcode_districts WHERE id = 'SW1A'),
  5000  -- 5km radius
)
ORDER BY distance_m
LIMIT 10;
```

---

## 6D. Scoring Methodology — The Safety Score Algorithm

The safety score (0-10) is the headline metric on every postcode page. It needs to be defensible, transparent, and documented on the methodology page for E-E-A-T.

### Inputs

Two data layers contribute to the score with different weights:

```
DRINKING WATER DATA (DWI + company scrapers):  80% weight
ENVIRONMENTAL CONTEXT (EA API):                20% weight
```

Drinking water data gets 80% because it measures what's actually in the tap. Environmental data is context, not direct measurement of tap water quality.

### Drinking Water Score (0-10)

For each regulated parameter with a UK legal limit:

```
parameter_score = 10 × (1 - (measured_value / uk_limit))
```

Clamped to 0-10 range. If measured_value = 0 → score = 10. If measured_value = uk_limit → score = 0. If measured_value > uk_limit → score = 0 (exceedance).

For parameters with a WHO guideline but no UK limit (e.g., PFAS):

```
parameter_score = 10 × (1 - (measured_value / who_guideline))
```

Same clamping.

For parameters with neither limit (informational only, like pH within normal range):
These don't contribute to the score but are displayed for transparency.

### Weighting by Health Significance

Not all contaminants are equally important. Weighting tiers:

```
Tier 1 (weight 3.0): Lead, PFAS (sum), E.coli, coliform bacteria, arsenic
  → Direct health risk, acute or chronic
Tier 2 (weight 2.0): Nitrate, nitrite, pesticides (total), trihalomethanes, copper
  → Significant health concern at elevated levels
Tier 3 (weight 1.0): Turbidity, chlorine residual, pH, hardness, iron, manganese
  → Aesthetic or indirect health relevance
```

### Composite Drinking Water Score

```
drinking_score = Σ(parameter_score × weight) / Σ(weight)
```

Only parameters with measured data contribute. If a postcode only has 5 tested parameters, the score is based on those 5 (with a "data completeness" note on the page).

### Environmental Context Score (0-10)

Based on nearest EA sampling points (within 5km radius):

```
For each PFAS compound detected:
  pfas_penalty = measured_value / who_guideline_for_pfas (0.1 µg/L)
  capped at 1.0

env_score = 10 - (sum_pfas_penalties × 5) - (other_exceedances × 1)
```

Clamped to 0-10. This is deliberately harsh on PFAS because it's the differentiating data point.

### Final Safety Score

```
safety_score = (drinking_score × 0.8) + (env_score × 0.2)
```

Rounded to one decimal place.

### Grade Mapping

```
9.0 - 10.0  →  "Excellent"  (green)
7.0 - 8.9   →  "Good"       (green)
5.0 - 6.9   →  "Fair"       (amber)
3.0 - 4.9   →  "Poor"       (red)
0.0 - 2.9   →  "Very Poor"  (red, bold)
```

### Transparency

Every postcode page links to `/about/methodology/` which explains this formula in plain English. The page also shows:
- Which parameters contributed to the score
- The weight of each parameter
- The raw values and limits used
- When the data was last updated
- A note if environmental data (20% weight) had missing or limited data

This transparency is an E-E-A-T requirement and a differentiation point. TapWaterData.com doesn't explain how their scores work.

---

## 7. The 24/7 AI Agent Moat — This Is the Entire Play

This isn't a nice-to-have automation layer. The AI agent running 24/7 IS the competitive advantage. Without it, this is just another affiliate site that someone else can copy in a weekend. With it, you're building a content machine that no solo operator or small team can match.

### Why This Changes Everything

A traditional programmatic SEO site gets built once, then slowly decays. Google rewards freshness. Competitors catch up. Affiliate links break. Data goes stale. The site owner updates when they remember to, which is never often enough.

With Claude running 24/7 (via Claude Code scheduled tasks or the upcoming persistent agent capabilities), the site is alive. It responds to data changes within hours, not months. It publishes new content daily. It detects and fixes problems before they cost traffic.

**The math:** A human can realistically maintain ~50 pages per week. An AI agent can maintain thousands of pages per day when the time comes to scale. During the cautious rollout (50 → 200 → 500 → 2,000 pages), the agent's capacity means every page stays fresh daily — something no solo operator can match even at 50 pages.

### Daily Operations (Automated)

**Data Pipeline Refresh (runs at 2am daily):**
```
1. Query EA Water Quality API for new measurements (last 24 hours)
2. Match new sampling data to postcode districts via supply zone mapping
3. For each affected postcode page:
   a. Update contaminant readings
   b. Recalculate safety score
   c. Regenerate the summary paragraph with new numbers
   d. Update "last tested" timestamp
   e. If PFAS reading changed → trigger PFAS alert banner logic
   f. If any contaminant newly exceeds guideline → flag for editorial review
4. Rebuild affected static pages via ISR revalidation
5. Log changes to changelog (transparency + debugging)
```

**Content Freshness Sweep (runs at 6am daily):**
```
1. Identify all pages with "last updated" older than 14 days
2. For each stale page:
   a. Check if new EA data exists (may have been missed)
   b. If no new data: add seasonal context update ("Winter 2026: water quality
      in {AREA} typically shows elevated turbidity due to increased rainfall")
   c. Refresh meta description with current year
   d. Regenerate internal links based on latest traffic data
3. Result: No page on the site is ever older than 14 days
```

**GEO Citation Maintenance (runs at 10am daily):**
```
1. Check Google Search Console for new AI-overview appearances
2. For pages being cited by AI:
   a. Preserve the first 200 words (these are what's being cited)
   b. Add/update supporting data beneath
3. For high-traffic pages NOT being cited:
   a. Restructure first 200 words to directly answer the search query
   b. Add specific numbers, dates, and source attributions in opening paragraph
   c. Ensure sentences are citation-friendly (clear, factual, quotable)
4. Track citation rate over time → optimize what works
```

### Weekly Operations (Automated)

**New Content Generation (every Monday):**
```
1. Pull trending water quality queries from GSC + Google Trends API
2. Identify gaps: queries driving impressions but no dedicated page exists
3. Generate 5-10 new editorial articles:
   - "PFAS in {CITY} water: What the latest data shows"
   - "Best water filter for {CONTAMINANT}: {YEAR} guide"
   - "Water quality comparison: {SUPPLIER_A} vs {SUPPLIER_B}"
4. Each article: 800-1,500 words, unique data, internal links to postcode pages
5. Auto-publish with proper schema markup
```

**Competitor Surveillance (every Wednesday):**
```
1. Google search for new sites ranking for "water quality [postcode]" type queries
2. Check for new domain registrations matching water quality + UK keywords
3. Monitor WaterGraph.co.uk for expansion beyond New Forest
4. If new competitor detected → alert for strategic review
5. Check if TapWaterData.com has launched a UK section
```

**Affiliate Performance Review (every Friday):**
```
1. Pull click-through and conversion data per affiliate program
2. Identify underperforming product recommendations
3. Swap low-converting products for alternatives
4. Check for broken affiliate links (programs close, URLs change)
5. Update product pricing displayed on pages
6. If a new water filter launches with a UK affiliate program → evaluate and integrate
```

### Monthly Operations (Automated)

**Full Data Rebuild:**
- Re-scrape all 20+ water company postcode lookup tools
- Cross-reference with latest DWI quarterly data
- Identify any new supply zone changes (water companies periodically reorganize zones)
- Regenerate all live postcode pages with freshest possible data

**Page Expansion (Index-Health-Gated):**
- Only triggered if current index coverage ratio is above 70%
- Analyse Google Search Console for high-impression postcode sectors (more granular than districts)
- Generate new sector-level pages for districts with >500 monthly impressions
- Example: If "E1 water quality" gets traffic, create E1 1, E1 2, E1 3, etc.
- Target: 100-200 new pages per month (not 500) — quality-gated, not volume-gated
- If index coverage drops below 70% after expansion → auto-pause new page generation

**SEO Health Audit:**
- Check all pages for indexing issues (GSC coverage report)
- Identify and fix cannibalisation (multiple pages competing for same query)
- Update internal linking based on latest traffic patterns
- Regenerate XML sitemap with priority scores based on traffic

### Reactive Operations (Event-Triggered)

**Water Incident Response:**
When a water company issues a boil notice, contamination warning, or incident report:
```
1. Detect event (monitoring water company RSS feeds + Google Alerts)
2. Within 1 hour:
   a. Identify affected postcodes
   b. Update those pages with incident banner
   c. Generate incident-specific editorial article
   d. Update filter recommendations for affected area
3. This is the nuclear advantage: human journalists take 24-48 hours to
   write a story. We publish data-backed, localized content in under an hour.
```

**PFAS Consultation Response:**
When the UK government publishes PFAS consultation updates:
```
1. Parse the publication (PDF or web)
2. Generate a comprehensive analysis article within 2-3 hours
3. Update all affected postcode pages with new regulatory context
4. Create shareable data visualization ("UK PFAS Map: Updated Post-Consultation")
5. Draft press pitch to journalists with localized data angles
```

**Seasonal Content:**
- Summer: "Water quality during hosepipe bans", "Holiday area water safety"
- Winter: "Does cold weather affect water quality?", "Lead pipes and winter"
- Spring: "Agricultural runoff and nitrate levels: spring warning"
- Automatically generate and schedule seasonal content 4 weeks before each season

### The Flywheel Effect

This is why the AI agent creates a genuine moat:

```
More fresh data → Better rankings → More traffic
  ↑                                      ↓
  ├── AI agent updates daily ←←←←←←←←←←←←←←← More pages indexed
  ↑                                      ↓
More affiliate revenue ←←← More conversions
  ↓
Reinvest in more data sources → More unique content → Repeat
```

A human competitor would need to hire 2-3 full-time content people to match the output of one AI agent. That's £90-150K/year in salary vs. the cost of Claude running 24/7 (~$200/month at current pricing). The economics are not even close.

---

## 8. GEO (Generative Engine Optimization) — The Second Search Engine

This section matters because by 2026, an estimated 25-40% of informational queries are being answered by AI chatbots (ChatGPT, Google AI Overviews, Perplexity, Claude). If someone asks "is the tap water safe in Manchester", the AI should cite tapwater.uk.

### How AI Citation Works

AI models cite sources based on:
1. **Freshness** — sources updated in the last 30-60 days are strongly preferred
2. **Specificity** — sources that directly answer the query with numbers beat generic pages
3. **Authority signals** — government data sources, methodology pages, clear attribution
4. **Structure** — clean HTML, proper headings, factual first paragraphs
5. **Rotation** — 40-60% of cited sources change month to month (freshness again)

### Our GEO Strategy

**Page-level optimization:**
Every postcode page's first 200 words are structured for AI citation:

```
"Tap water in [POSTCODE] ([AREA]) is supplied by [SUPPLIER]. Based on
Environment Agency data last updated [DATE], [X] parameters were tested.
[Y] contaminants were detected, with [Z] exceeding WHO guidelines.
The overall water quality score for [POSTCODE] is [SCORE]/10. Notable
findings include PFAS at [LEVEL] µg/L (the UK currently has no legal
limit for PFAS in drinking water) and lead at [LEVEL] mg/L (below the
UK limit of 0.01 mg/L)."
```

This paragraph is:
- Directly answerable (AI can quote it verbatim)
- Full of specific numbers (AI loves citable data)
- Includes the source ("Environment Agency data")
- Includes the date (freshness signal)
- Factual, not promotional

**Site-level optimization:**
- `/about/methodology/` — detailed explanation of data sources, scoring algorithm, update frequency. AI models use this to assess trustworthiness.
- `/about/data-sources/` — links to every government API and data source we use. Provenance matters.
- Clean HTML structure with semantic headings (AI parsers work better with well-structured pages)
- No popups, no interstitials, no aggressive ads that degrade the page for AI crawlers

**Monitoring GEO performance:**
- Track which queries trigger AI overviews that cite our pages (GSC + manual monitoring)
- A/B test different first-paragraph structures to optimize citation rate
- Monitor Perplexity, ChatGPT, and Google AI Overview citations separately (they have different citation patterns)
- AI agent regenerates the citation-optimized paragraphs monthly based on what's working

### Why GEO + SEO Together = Defensible

Traditional SEO is a known game — competitors can copy your page structure. But GEO adds a time dimension that's much harder to copy:

- Our pages are updated daily with fresh data → AI models prefer us
- A competitor who builds a static site gets cited once, then rotated out
- Our freshness signal is maintained automatically by the AI agent
- Result: We get cited in BOTH Google search results AND AI chatbot answers

---

## 9. EU Expansion Roadmap

The UK is the starting point. The playbook scales to:

| Phase | Market | Data Source | Language | Timeline |
|-------|--------|------------|----------|----------|
| 1 | UK (England + Wales) | EA API + DWI | English | Months 1-6 |
| 2 | Scotland + N. Ireland | Scottish Water + NI Water | English | Months 4-8 |
| 3 | Ireland | EPA Ireland (open data) | English | Months 6-10 |
| 4 | Netherlands | RIVM + water companies | Dutch/English | Months 8-14 |
| 5 | Germany | UBA + Wassertipps model | German | Months 12-18 |
| 6 | France | ARS / Ministère de la Santé | French | Months 14-20 |

**Why this order:**
- UK → Scotland → Ireland: Same language, similar data structures
- Netherlands: Biggest PFAS story in Europe, high English proficiency
- Germany: Largest EU market but wassertipps.de exists (differentiate on PFAS focus)
- France: Large market, new PFAS monitoring data being published

Each expansion reuses the same tech stack and page template architecture, with localized data pipelines and translated content.

---

## 10. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Google algorithm update penalizes programmatic pages | Medium | High | Ensure every page has unique, useful data — not thin content. Add editorial depth. |
| Water company blocks scraping | Medium | Medium | Primary data comes from government API (can't block). Company data is supplementary. |
| Affiliate programs change terms | Medium | Medium | Diversify across 4-5 programs. Amazon as baseline (never disappears). |
| Competitor launches similar site | Medium | Medium | Quality advantage: unique data layering (drinking + environmental + PFAS). AI agent keeps content fresh daily. First-mover on UK PFAS narrative. |
| EA API changes or goes offline | Low | High | Cache all data in own database. Build resilience with multiple data sources. |
| PFAS concern fades from public attention | Low | Medium | Site covers ALL water quality, not just PFAS. PFAS is the hook, not the whole product. |

---

## 11. Success Metrics (Adjusted for Cautious Rollout)

These projections reflect the new reality: gradual page rollout, Google's anti-programmatic stance, and the quality-over-quantity approach. Three scenarios presented.

### Month 1 — Validation Phase
- 50 high-quality postcode pages live + 5 editorial articles + tool pages
- Sitemap submitted to GSC
- Reddit soft launch done
- **Go/no-go metric:** Are pages getting crawled within 7 days? First indexing signals.
- First affiliate programs approved (Amazon Associates UK minimum)
- Revenue: £0 (expected — this is validation, not monetization)

### Month 3 — Proof of Concept
- 200 postcode pages live (if indexing validated in month 1-2)
- 15-20 editorial articles published
- **Index coverage ratio above 70%** (critical health signal — if below, stop and fix)
- Traffic sources: Reddit referral + early organic + ChemTracker TikTok cross-promo

| Scenario | Pages Indexed | Monthly Visitors | Affiliate Sales | Revenue |
|----------|--------------|-----------------|-----------------|---------|
| Best     | 180+         | 3,000           | 25              | £150    |
| Base     | 140+         | 1,500           | 10              | £60     |
| Worst    | <100         | 500             | 2               | £12     |

If worst case: pivot to editorial-first model. Fewer data pages, more in-depth guides.

### Month 6 — Growth Phase
- 500-800 postcode pages live (scaled gradually, guided by indexing health)
- 30+ editorial articles
- Interactive tools live (comparison widget, filter finder)
- First backlinks from local press / environmental sites
- Email list: 200-500 subscribers

| Scenario | Pages Indexed | Monthly Visitors | Affiliate Sales | Revenue |
|----------|--------------|-----------------|-----------------|---------|
| Best     | 700+         | 12,000          | 180             | £1,200  |
| Base     | 450+         | 5,000           | 60              | £400    |
| Worst    | 250+         | 1,500           | 10              | £70     |

### Month 12 — Scale Phase
- 1,000-2,000 postcode pages (only if index coverage stays healthy)
- 50+ editorial articles, some ranking page 1 for long-tail queries
- Display ads activated if >50K sessions/month (best case only)
- Scotland/Ireland expansion started (if UK metrics justify it)
- Email list: 2,000-5,000 subscribers

| Scenario | Pages Indexed | Monthly Visitors | Affiliate Sales | Revenue |
|----------|--------------|-----------------|-----------------|---------|
| Best     | 1,500+       | 45,000          | 900             | £7,000  |
| Base     | 800+         | 15,000          | 250             | £2,000  |
| Worst    | 400+         | 4,000           | 50              | £400    |

Best case includes display ad revenue (~£500-1,000/month on top of affiliate).

### Month 24 — Mature Phase

| Scenario | Monthly Visitors | Monthly Revenue | What It Looks Like |
|----------|-----------------|-----------------|-------------------|
| Best     | 120,000+        | £25,000-36,000  | Full EU expansion, multiple revenue streams, semi-passive |
| Base     | 30,000+         | £5,000-8,000    | UK established, Ireland added, steady lifestyle income |
| Worst    | 8,000+          | £1,000-2,000    | Editorial-heavy site, modest but profitable, covers costs |

**Key insight:** Even the worst case is profitable (costs are ~£50/month). The question isn't "will this lose money" — it's "how big does it get." The floor is low but the ceiling is high.

### Kill Criteria (When to Walk Away)
- Month 3: If <50% of submitted pages are indexed → Google doesn't like the site. Major pivot or kill.
- Month 6: If <1,000 monthly organic visitors despite 500+ pages → Content isn't ranking. Reassess.
- Month 12: If <£500/month revenue → The niche doesn't convert. Consider selling the domain + data asset.

---

## 12. Immediate Next Steps (Updated)

1. ✅ **Register domain:** `tapwater.uk` (DONE)
2. **Register defensive domains:** `tapwaterdata.co.uk` + `tapwaterdata.uk`
3. **Validate data pipeline:** Build scrapers for Thames Water + Severn Trent postcode lookups, pull DWI data, query EA API for environmental context — confirm all three layers combine cleanly for 10 London postcodes
4. **Build 50-page MVP:** London, Manchester, Birmingham postcodes with full frontend design system
5. **Deploy on Vercel** and submit sitemap to GSC
6. **Share on Reddit** (r/unitedkingdom, r/CasualUK) for initial traffic + validation
7. **Apply to affiliate programs:** Amazon Associates UK, Osmio Water, ZeroWater Europe
8. **If validation passes (week 4):** Expand to 200 pages, then scale gradually (quality-gated, see Section 6 build phases)
9. **Begin link building:** Local press outreach with area-specific data
10. **Cross-promote on skylooksback TikTok** once site is live

**Estimated time to MVP:** 2-3 weeks with focused effort.
**Estimated cost to launch:** ~£50 (domains + first month hosting).
**Estimated time to first revenue:** Month 2-3 (affiliate sales from Reddit/social traffic).
**Estimated time to meaningful revenue (£1K+/month):** Month 6-8.

---

## 13. Google's War on Programmatic SEO — And How We Survive It

This is the existential risk. Let's not sugarcoat it.

### What Google Has Actually Done (2024-2026)

The March 2024 core update introduced "scaled content abuse" as a formal spam policy. The June 2025 update went further — it didn't just demote pages, it **deindexed** them entirely. Traffic drops of 40-70% hit affiliate sites and programmatic content operations. **71% of affiliate sites experienced negative impacts.** Finance affiliates aggregating comparison data without proprietary tools saw the steepest drops.

The March 2026 core update (rolling out RIGHT NOW) doubled down: sites generating thousands of near-identical pages through AI or template automation without genuine added value saw ranking losses of 60-90%.

**This is exactly what we're planning to build.** So we need to be brutally honest about how to do it without getting killed.

### What Survived and Why

Not all programmatic SEO died. The survivors share specific characteristics:

**Wise.com** — 10+ million currency conversion pages, 100+ million monthly visits. Why it survived: Each page has real-time exchange rates, interactive calculators, historical charts, bank comparisons, and actual transaction capabilities. The page IS a tool, not just text.

**Travel comparison sites** — Aggregated data from 15+ APIs (hotels, flights, weather, events), refreshed every 6 hours, 2 million pages, 8 million monthly visits within 18 months. Why it survived: live data that changes constantly, genuine decision-making utility.

**Canva** — 100M+ monthly organic visits from template-specific landing pages. Why it survived: Each page offers a functional tool (the template editor), not just content.

**The pattern:** Pages that survive contain **unique, non-replicated data per page** AND provide a **functional tool or decision engine** that AI chatbots cannot replicate.

### Our Survival Strategy: 7 Rules

**Rule 1: Quality Over Quantity — Launch Small, Grow Earned**

The original plan said "launch with 3,000 pages." That's wrong. A smaller site with high quality outperforms a huge one with thin pages — this is now explicitly stated in Google's guidelines.

New approach:
- Launch with **50 high-quality postcode district pages** (London zones + top 10 UK cities)
- Each page must be genuinely rich before we generate the next batch
- Expand to 200 (month 2), then 500, then 1,000, then 2,000 — only after confirming indexing and ranking signals at each stage
- Never publish a page that's just "template + different postcode number"

**Rule 2: Every Page Must Have Genuinely Unique Data**

This is our structural advantage. Unlike "best restaurants in [city]" where the template IS the content, water quality data is inherently location-specific:
- Different EA API sampling points → different contaminant readings
- Different water suppliers → different compliance histories
- Different geological areas → different hardness, nitrate, mineral profiles
- Different pipe infrastructure ages → different lead risk profiles

A page for E1 (Whitechapel, Thames Water, 0.08 µg/L PFAS, Victorian pipes) IS genuinely different from SW1A (Westminster, Thames Water, 0.02 µg/L PFAS, renovated infrastructure). That's real, unique, useful data — not template swapping.

**Rule 3: Build a Tool, Not Just Pages**

The Wise model. Every page should include interactive elements that make it a **decision engine**, not just an article:
- Interactive contaminant comparison tool ("Compare your water to UK average")
- Filter recommendation engine ("Based on YOUR contaminants, here's what removes them")
- Historical trend chart ("Your area's water quality over the last 5 years")
- Postcode comparison tool ("Compare water quality: your postcode vs. where you're moving")

These functional elements are what Google cannot replicate in an AI Overview. A chatbot can summarize text; it cannot provide an interactive calculator with live data.

**Rule 4: Establish E-E-A-T as an Indexing Prerequisite**

Google's December 2025 update made E-E-A-T signals not just ranking factors but **indexing prerequisites**. Pages without clear expertise signals may not be indexed at all.

What we need:
- **About page** with clear editorial policy and data methodology
- **Data sources page** linking directly to the EA API, DWI, and water company sources
- **Methodology page** explaining how safety scores are calculated (transparent algorithm)
- **Named editorial presence** — either a real person (you or a hired expert) or a clear organizational identity ("TapWater.uk is an independent water quality research project")
- **Citations on every page** — "Source: Environment Agency Water Quality Archive, sample ID [X], dated [DATE]"
- **Update log** — visible "last verified" dates proving the data is actively maintained

**Rule 5: Gradual Indexing — Don't Submit Everything at Once**

Submitting 3,000 pages in one sitemap on day 1 is a red flag. Google's crawlers will see a brand-new domain with thousands of pages and suspect scaled content abuse.

Rollout strategy:
- Week 1: Submit 50 pages (top cities) + homepage + about/methodology pages
- Week 2-3: Monitor Google Search Console — are they being indexed? Crawled?
- Week 4: If indexing looks healthy, submit next 100 pages
- Month 2: If no quality flags, submit next 200
- Month 3+: Scale by 200-500 pages per month as domain authority builds
- If at any point indexing stalls or pages are flagged → STOP, audit, fix quality issues before adding more

**Rule 6: Editorial Content as the Quality Signal**

Google evaluates site quality holistically. Having 200 data-driven postcode pages surrounded by zero editorial content looks like a scraper site. Having those same pages supported by 20-30 in-depth editorial guides looks like an authoritative resource.

Must-have editorial content from day 1 (not month 3):
- "PFAS in UK Drinking Water: A Complete Guide" (2,000+ words, original research)
- "How We Calculate Water Quality Scores" (transparency article)
- "Understanding Your Water Company's Compliance Report" (educational)
- "The UK's Lead Pipe Problem: Which Areas Are Most Affected?" (data journalism)
- "Water Hardness Map: Why It Matters and What to Do About It" (practical guide)

These editorial pages serve three purposes: they build topical authority, they attract backlinks, and they signal to Google that this is an editorial operation, not a content farm.

**Rule 7: Monitor and Respond to Quality Signals**

Google Search Console will tell us if we're in trouble before it becomes catastrophic:
- **Coverage report:** Watch for "Crawled — currently not indexed" increasing (Google is choosing not to index your pages)
- **Manual actions:** Check weekly for any spam penalties
- **Core Web Vitals:** Programmatic pages must be fast (< 2.5s LCP)
- **Index coverage ratio:** If you submit 500 pages and only 200 are indexed, Google thinks 60% of your content isn't worth indexing. Stop adding pages and improve the existing ones.

If index coverage drops below 70%, that's a red flag. Pause expansion, audit page quality, add more unique data/editorial depth to underperforming pages, then resume.

### The Honest Risk Assessment (Updated)

Given what Google has done in 2024-2026, the original plan's revenue projections need a reality check:

**Best case (Google treats us like Wise/Canva — a data tool, not a content farm):**
Revenue projections hold. Unique government data + interactive tools + editorial depth = legitimate programmatic SEO.

**Base case (Some pages get indexed, some don't — typical 60-70% indexing rate):**
Revenue drops ~30-40% from projections. We compensate with stronger editorial content and more link building.

**Worst case (Google flags us as scaled content, low indexing rate):**
We fall back to editorial-first strategy: 50-100 rich postcode pages + 50+ editorial guides. Lower traffic but still viable via display ads + affiliate. Think £2-3K/month instead of £7K.

The fallback is important: even in the worst case, the data pipeline and editorial content have value. We're not betting everything on Google being friendly to programmatic pages.

---

## 14. Link Building Strategy (Specific, Not Vague)

Links are what make programmatic SEO actually rank. Without links, 3,000 pages sit in Google's index doing nothing.

**Tier 1: PR-driven links (Months 1-3)**
- PFAS consultation response: When the UK government publishes consultation results, we publish a data-driven analysis ("We analysed water quality data for all 2,979 UK postcode districts — here's where PFAS levels are highest"). Pitch to The Guardian, BBC, Sky News environment desks.
- Newsjacking: Every time a water company has an incident (boil notices, contamination events), we publish a rapid-response data page. Local newspapers will link to local data.
- Data journalism angle: "The UK's PFAS map" — create an interactive visualization that journalists can embed or reference.

**Tier 2: Resource link building (Ongoing)**
- Submit to government resource pages and council websites (many link to water quality resources)
- Reach out to environmental charities (Surfers Against Sewage, Friends of the Earth) — they publish water quality content and need data sources
- University environmental science departments often maintain resource lists

**Tier 3: Community and niche (Ongoing)**
- Mumsnet, Netmums — parents searching "is my water safe for baby formula" is a massive query cluster
- Home improvement forums (lead pipe replacement discussions)
- Aquarium/fishkeeping forums (they care deeply about water parameters)
- Local Facebook groups (share area-specific water data)

**Tier 4: ChemTracker cross-promotion**
- The ChemTracker TikTok audience (conspiracy-adjacent, environmentally concerned) is a PERFECT audience for "what's in your water" content
- skylooksback TikTok → "Did you know your tap water might contain forever chemicals? Check your postcode" → tapwater.uk
- This gives you day-1 traffic before Google indexes anything

---

## 15. Legal & Compliance

**GDPR:**
- Cookie consent banner required (Plausible/Umami are cookieless, so minimal issue)
- Privacy policy page
- No personal data collection beyond email (if newsletter launched)

**Affiliate Disclosure (UK ASA + CMA requirements):**
- Every page with affiliate links MUST have a visible disclosure: "This page contains affiliate links. We may earn a commission if you purchase through our links, at no extra cost to you."
- UK CMA is stricter than US FTC — disclosure must be "clear and prominent", not hidden in footer
- Each affiliate link should be marked (e.g., "Check Price on Amazon*" with asterisk explained)

**Health/Safety Disclaimer:**
- Critical: "The information on this site is for educational purposes only and should not be considered medical advice. If you have concerns about your drinking water, contact your water supplier or the Drinking Water Inspectorate."
- We are NOT telling people their water is dangerous. We are presenting government data with context.
- Avoid sensationalist language ("TOXIC!", "DEADLY!") — let the data speak

**Data Accuracy:**
- Always cite sources (EA API, DWI reports) with timestamps
- "Last updated" on every page
- Methodology page explaining how scores are calculated
- Disclaimer: "Data is sourced from the Environment Agency and may not reflect current conditions at the point of use"

---

## 16. Distribution Beyond SEO (First 90 Days)

SEO takes 3-6 months to kick in. You need traffic before then to validate the model.

**Week 1-2: Soft launch**
- Share on Reddit (r/unitedkingdom, r/CasualUK, r/environment) — "I built a free tool to check your tap water quality by postcode"
- Reddit loves free tools. If the data is genuinely useful, this can drive 5-10K visitors in a day.

**Week 2-4: ChemTracker TikTok cross-promotion**
- skylooksback posts: "Your tap water might have forever chemicals. I checked." → shows the site
- This audience WILL share it. Water quality concern overlaps perfectly with the ChemTracker demographic.

**Month 1-2: Mumsnet / parenting forums**
- Post in relevant threads about baby formula water safety, lead in water, etc.
- Genuine value — parents are searching for this information

**Month 2-3: Local press**
- Email local newspaper journalists with their area's water quality data
- "Hi, I'm sharing some data that might interest your readers — [TOWN] tap water contains [X] levels of PFAS, which has no legal limit in the UK"
- Local press LOVES localized data stories

**Month 3+: PFAS news cycle**
- As the UK PFAS consultation progresses, pitch national media
- Position tapwater.uk as THE data source for UK water quality

---

## 17. Email List & Retention Strategy

A postcode-based water quality site has a natural retention hook that TapWaterData.com doesn't seem to exploit:

**"Get alerts when your water quality changes"**
- Email capture on every postcode page: "Enter your email to get notified when new water quality data is published for {POSTCODE}"
- Monthly email digest per postcode area with any changes
- Breaking alerts when water companies report incidents

**Why this matters for revenue:**
- Email subscribers convert at 3-5x the rate of organic visitors
- You can promote filter deals, seasonal offers, new products directly
- The list itself becomes an asset (5,000 engaged UK subscribers interested in water quality = valuable)

**Growth target:** 500 subscribers by month 3, 5,000 by month 12

---

## 18. Conversion Optimization Playbook

Getting traffic is step 1. Converting that traffic into affiliate revenue is where the money actually happens.

**The conversion funnel:**
1. Visitor searches "water quality [postcode]" → lands on postcode page
2. Sees their water data + any concerning contaminants
3. Scrolls to "How to Improve Your Water" section
4. Sees filter recommendation matched to their specific contaminants
5. Clicks affiliate link → buys filter

**Key conversion elements:**
- **Fear/concern trigger:** The PFAS alert banner (where applicable) creates urgency without being sensationalist. Just presenting the data is enough.
- **Trust indicators:** "Based on Environment Agency data", methodology link, last-updated date
- **Product-contaminant matching:** Don't show generic "best water filter" — show "this filter removes PFAS and lead, which were detected in your area." Specificity converts.
- **Comparison table:** Best Overall / Best Budget / Best Whole-House — three options covers all buyer types
- **Social proof:** "X people in {AREA} checked their water this month" (once you have traffic data)

**What to A/B test (month 4+):**
- CTA button text ("Check Price" vs "View Filter" vs "See Latest Price")
- Number of product recommendations (2 vs 3 vs 5)
- Position of affiliate section (after contaminant table vs end of page)
- Safety score presentation (number vs color-coded bar vs letter grade)

---

## 19. Validation Plan (Before Full Build)

Don't build thousands of pages and hope. Validate in stages.

**Week 1: Data pipeline proof-of-concept**
- Build scraper for 2-3 water company postcode lookups (Thames Water, Severn Trent, United Utilities)
- Pull DWI compliance data for those companies
- Query EA API for environmental data near 10 London postcodes
- Confirm: Can we combine all three layers into a coherent page dataset?
- If the mapping doesn't work cleanly, the whole plan needs adjustment

**Week 2: 50-page MVP**
- Generate 50 postcode pages (mix of London, Manchester, Birmingham)
- Deploy on Vercel with full frontend design system
- Submit sitemap to Google Search Console
- Share on Reddit for initial traffic

**Week 3-4: Validation metrics**
- Are pages getting indexed? (Check Google Search Console)
- Is Reddit traffic converting? (Do people actually click affiliate links?)
- What's the bounce rate? (Are the pages genuinely useful?)
- What are people searching for on-site? (What pages do they visit after landing?)

**Decision point (end of week 4):**
- If indexing + engagement metrics look good → expand to 200 pages (month 2)
- If data pipeline has gaps → fix before scaling
- If nobody cares → pivot before investing more time

---

## 20. Time Investment Reality Check

This isn't a "set it and forget it" passive income play on day 1. Here's the real time commitment:

| Phase | Duration | Hours/Week | What You're Doing |
|-------|----------|-----------|-------------------|
| Build MVP | Weeks 1-3 | 15-20 hrs/wk | Data pipeline, page templates, deployment |
| Content expansion | Weeks 4-8 | 10-15 hrs/wk | More pages, editorial content, link building |
| Growth mode | Months 3-6 | 5-10 hrs/wk | PR outreach, content, optimization |
| Maintenance mode | Months 6+ | 2-5 hrs/wk | AI agent handles daily updates, you manage strategy |

**Total to profitability:** ~200-300 hours over 6 months.
**After month 6:** The AI agent automation reduces your involvement to strategic decisions and affiliate program management. This is where it becomes genuinely semi-passive.

---

## 21. Exit & Scale Scenarios

**Scenario A: Lifestyle Business (£5-10K/month)**
- Run it alongside ChemTracker
- AI agent maintains the site
- Steady affiliate + ad revenue
- Time investment: 5 hrs/week

**Scenario B: Growth Play (£30-50K/month)**
- Expand to EU markets (Netherlands, Germany, France)
- Build out premium features (real-time alerts, API access for B2B)
- Potentially hire a part-time content person
- Time investment: 15-20 hrs/week

**Scenario C: Exit (£500K-1M+ sale)**
- Affiliate sites with 100K+ monthly visitors sell at 30-40x monthly revenue
- At £20K/month revenue = £600K-800K sale price
- Typical buyers: media companies, comparison site networks, water filter brands
- Timeline to exit-ready: 18-24 months

---

*This plan was built from live competitive research, Ahrefs keyword data, domain availability checks, and analysis of the UK government's open data APIs. The data pipeline combines drinking water compliance data (DWI + water company scrapers) with environmental water monitoring (EA Water Quality API) to create a unique, multi-source dataset. The PFAS regulatory timing is real and verified — the EU Drinking Water Directive took effect January 12, 2026, and the UK government published its PFAS plan on February 3, 2026.*
