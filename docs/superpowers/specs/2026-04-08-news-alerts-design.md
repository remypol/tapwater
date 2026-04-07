# News & Alerts System — Design Spec

**Date:** 2026-04-08
**Status:** Approved

---

## Overview

Fully automated incident detection, article generation, and publishing system for TapWater.uk. Monitors UK water company feeds, Environment Agency API, DWI enforcement notices, and news sources. Detects incidents, generates articles via Claude LLM, publishes to `/news/[slug]`, and shows alert banners on affected postcode/city pages. No human review in the publishing loop — reliability and accuracy are enforced by architecture.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Editorial model | Fully automated (C+) | Capture traffic spikes from water incidents in real-time without manual bottleneck |
| Incident sources | All four (water companies, EA, DWI, news), phased | A+B at launch, C+D follow |
| Location integration | Cross-pollinate (B) | Alert banners on affected postcode/city pages, linking to full article |
| Article layout | Editorial + Sidebar (C) | Serif headline with narrative left, structured metadata sidebar right. Reads like journalism, surfaces data at a glance |
| Alert banner | Alert Card (B) | Full-width card with warning icon, headline, action text, link. Unmissable but not panic-inducing |
| Incident state | Supabase + on-demand revalidation (C) | Incidents table in Supabase, `revalidateTag('incidents')` on status change for instant banner appear/disappear |
| LLM for status checks | No — deterministic only | Resolution decisions must never depend on LLM output. Safety-critical. |
| LLM for enrichment | Yes — at article generation time | Web search context for richer articles. Additive only, no safety risk. |

---

## Data Model

### `incidents` table

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid | Primary key (gen_random_uuid) |
| `slug` | text (unique) | URL-safe identifier, e.g. `thames-water-boil-notice-se5-2026-04-08` |
| `source_hash` | text (unique) | Hash of `(source + type + affected_postcodes + date)` for deduplication |
| `title` | text | AI-generated headline (≤80 chars) |
| `type` | text | One of: `boil_notice`, `supply_interruption`, `pollution`, `enforcement`, `pfas_discovery`, `general` |
| `severity` | text | One of: `critical`, `warning`, `info` |
| `status` | text | One of: `active`, `resolved` |
| `source` | text | One of: `water_company`, `environment_agency`, `dwi`, `news` |
| `source_url` | text | Original source link for attribution |
| `supplier_id` | text | FK to water company if applicable |
| `affected_postcodes` | text[] | Array of postcode districts, e.g. `['SE5','SE15','SE24']` |
| `affected_cities` | text[] | Array of city slugs, e.g. `['london']` |
| `households_affected` | int | Estimated count (nullable) |
| `summary` | text | 1-2 sentence plain-language summary (≤200 chars) |
| `action_required` | text | What residents should do |
| `article_markdown` | text | Full AI-generated article body (200-800 words) |
| `detected_at` | timestamptz | When our cron first found it |
| `resolved_at` | timestamptz | When marked resolved (null if active) |
| `last_checked` | timestamptz | Last cron verification — powers "Updated X ago" |
| `source_data` | jsonb | Raw data from the source for auditing |
| `created_at` | timestamptz | Row creation (default now()) |

### `source_checks` table

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid | Primary key |
| `source` | text | Which source was polled |
| `source_name` | text | Specific feed name (e.g. "Thames Water RSS") |
| `status_code` | int | HTTP response code |
| `items_found` | int | Number of incidents parsed |
| `error` | text | Error message if failed (nullable) |
| `checked_at` | timestamptz | When this check happened |

### `incident_logs` table

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid | Primary key |
| `incident_id` | uuid | FK to incidents |
| `action` | text | `detected`, `updated`, `resolved`, `enriched`, `stale_alert` |
| `details` | jsonb | Context for the action |
| `created_at` | timestamptz | When this log was created |

---

## Pipeline Architecture

Four-stage pipeline. Each stage independently recoverable.

### Stage 1: Source Monitoring

**Endpoint:** `/api/cron/incidents`
**Schedule:** Every 15 minutes
**Vercel cron config in `vercel.json`**

Each source has its own parser function, isolated in try/catch. One source failing does not block others.

**Phase 1 parsers (launch):**

1. **Water company status pages** — RSS/scrape feeds from: Thames Water, United Utilities, Severn Trent, Yorkshire Water, Anglian Water, Southern Water, South West Water, Welsh Water, Northumbrian Water, Scottish Water. Each supplier gets its own parser since formats differ.
2. **Environment Agency** — incident API returns structured JSON. Cleanest source. Filter to water quality relevant incidents.

**Phase 2 parsers (later):**

3. **DWI** — enforcement notices. Weekly check sufficient. Published irregularly.
4. **News/media** — Google News RSS filtered to water quality keywords. Higher noise, more filtering needed.

**Deduplication:** Hash of `(source + type + sorted affected_postcodes + date)` stored as `source_hash`. Upsert on this hash. Idempotent — duplicate cron runs produce identical results.

**Source health:** Every poll logged to `source_checks`. If a source fails 3+ consecutive checks, alert email sent via Resend.

### Stage 2: Postcode Matching

When a new incident is detected, map it to affected postcode districts.

**Matching strategies by source:**

| Source type | Strategy |
|-------------|----------|
| Water company notices | Usually specify postcodes directly. Parse and validate each against `postcode_data` table. |
| EA pollution incidents | Grid references/coordinates. Use PostGIS `ST_DWithin` to find postcode districts within affected radius. |
| DWI enforcement | Names water company + supply zone. Map via `supplier_id` → postcode lookup. |
| News/media | Extract location names from text, map to city slugs via cities list. |

**Safeguards:**

- **Max blast radius:** If matching returns >200 postcodes, hold for manual review (email alert). Prevents parsing errors from blanketing the site.
- **Min match:** If 0 postcodes match, article publishes at `/news/[slug]` but no banners appear. No banner is better than a wrong banner.
- **Validation:** Every matched postcode must exist in `postcode_data`. No invented postcodes.

### Stage 3: Article Generation (AI)

**Triggered by:** Stage 1 detecting a new incident (not on a cron schedule — called inline after insert).

**Claude API call:**
- Model: Claude Sonnet (fast, cost-effective for structured reporting)
- Temperature: 0 (no creativity, factual reporting only)
- System prompt: strict house style — plain language, no jargon, factual, source-attributed
- Input: structured incident data + our water quality data for affected postcodes
- Output: JSON schema with `title`, `summary`, `action_required`, `article_markdown`
- Web search tool enabled: for enrichment context (historical incidents, NHS guidance, water company background)

**Output validation:**
- Must parse as expected JSON schema
- Title ≤80 chars, summary ≤200 chars, article 200-800 words
- Profanity/content blocklist scan
- Source attribution present
- If validation fails → fall back to template article generated from structured fields only (less polished, factually correct)

**Fallback template structure:**
```
# [Type]: [Location]

[Source] has reported a [type] affecting [postcodes].

## What to do
[action_required from source data]

## Affected areas
[list of postcodes with links]

## Source
[source_url]

*This article was generated from official incident data.*
```

### Stage 4: Publish & Revalidate

Atomic operation:
1. Insert/update incident row in Supabase (single transaction)
2. Call `revalidateTag('incidents')` — flushes all postcode/city pages that query active incidents
3. Call `revalidateTag('news')` — flushes `/news` hub page
4. If revalidation fails, retry 3x with exponential backoff. Log failure but don't roll back.

Every state transition logged to `incident_logs`.

### Resolution Flow

Every cron run re-checks all active incidents:

1. Fetch source URL/feed again
2. Source reachable AND incident still listed → update `last_checked`
3. Source reachable AND incident gone → set `status: resolved`, `resolved_at: now()`, revalidate affected pages
4. Source unreachable → do nothing, keep current state, log the check failure

**Critical rule:** Never resolve on absence if the source is erroring. Only resolve when source is reachable AND incident is no longer listed.

### Stale Incident Handling

- **48 hours** with no source update on an active incident → email alert to admin via Resend
- Optionally auto-publish a "still ongoing, no new information" follow-up update to the article
- **7 days** with no source update → auto-resolve with note: "Resolved: no further reports from source"

---

## Routes & Pages

### New Routes

| Route | Type | Purpose |
|-------|------|---------|
| `/news` | Page (server component) | News hub — latest articles, filterable by type/region/status |
| `/news/[slug]` | Dynamic page | Individual article — editorial + sidebar layout |
| `/news/rss.xml` | Route handler | RSS 2.0 feed with Google News extensions |
| `/news/sitemap.xml` | Route handler | Google News sitemap (articles <48h old) |
| `/api/cron/incidents` | API route (cron) | Source polling, detection, resolution |
| `/api/cron/incidents/health` | API route | Health check endpoint for uptime monitoring |

### Modified Routes (Banner Injection)

| Route | Change |
|-------|--------|
| `/postcode/[district]` | Query active incidents where `affected_postcodes @> ARRAY[district]`. Show alert card above content if any match. Add `cacheTag('incidents')` alongside existing `revalidate = 86400` so on-demand revalidation works. |
| `/city/[slug]` | Query active incidents where `affected_cities @> ARRAY[slug]`. Same alert card and cache tag. |

### News Hub (`/news`)

- Card grid of articles: type badge, title, affected areas, date, status pill (ACTIVE red / RESOLVED grey)
- Active incidents pinned to top
- Filter by: incident type, region, status
- Pagination: 20 per page
- `revalidateTag('news')` on any incident change

### Article Page (`/news/[slug]`)

**Layout: Editorial + Sidebar (Layout C)**

Left column (narrative):
- Incident type badge (color-coded by severity) + date + source
- Serif headline (Instrument Serif)
- Household count + affected areas summary
- Article body rendered from markdown
- Source attribution with link

Right sidebar (structured data):
- Affected areas — list of postcode district links
- Source — water company/EA link
- Status — Active/Resolved with timestamp
- "Last updated X ago" — computed from `last_checked`

Mobile: sidebar collapses below article body.

### Alert Banner (on postcode/city pages)

**Layout: Alert Card (Layout B)**

- Full-width card with dark red background (`#1a0505`, border `#5c1616`)
- Warning icon (!) in red square
- Bold headline: "Active [Type]" with LIVE badge
- 1-line action text from `action_required`
- "Full details →" link to `/news/[slug]`
- "Updated X ago" from `last_checked`
- Only shown when `status = 'active'`
- Disappears instantly on resolution (via revalidateTag)

---

## Google News & SEO

### Google News Requirements

- `/news/sitemap.xml` — news sitemap with `<news:publication>`, `<news:publication_date>`, `<news:title>`. Only articles <48h old per Google spec.
- `/news/rss.xml` — RSS 2.0 with Google News extensions and `<georss:point>` for geographic targeting.
- Auto-discovery tag in root layout: `<link rel="alternate" type="application/rss+xml" href="/news/rss.xml" title="TapWater.uk Water Incident News">`

### Article SEO

- Title format: `[Incident Type]: [Location] — [Brief Detail] | TapWater.uk` (≤60 chars before suffix)
- Meta description: `summary` field (≤155 chars, enforced at generation)
- Schema.org `NewsArticle` JSON-LD with `datePublished`, `dateModified`
- `<meta name="robots" content="max-image-preview:large">` for Google Discover
- Canonical URL
- OG image: template-based with incident type + location text overlay

---

## Dependencies

**New packages needed:**
- `@anthropic-ai/sdk` — Claude API for article generation
- `marked` — markdown-to-HTML rendering for article bodies (lightweight, no frontmatter parsing needed since articles are stored in DB not files)

**Existing infrastructure used:**
- Supabase (incidents table, PostGIS for geo-matching)
- Vercel cron (15-min schedule)
- Resend (admin alert emails)
- Vercel on-demand revalidation (`revalidateTag`)
- Existing city/postcode data for matching and enrichment

---

## Phase Plan

### Phase 1 (This session)
- Database tables (incidents, source_checks, incident_logs)
- Cron endpoint with water company + EA parsers
- Postcode matching logic
- AI article generation with validation + fallback template
- Publish + revalidate pipeline
- `/news` hub page
- `/news/[slug]` article page (editorial + sidebar layout)
- Alert banner component on postcode/city pages
- RSS feed at `/news/rss.xml`
- Google News sitemap at `/news/sitemap.xml`
- Source health monitoring + admin email alerts
- Stale incident handling (48h email, 7d auto-resolve)
- Add "News" link to site header navigation

### Phase 2 (Future session)
- DWI enforcement parser
- News/media parser (Google News RSS)
- OG image auto-generation for articles
- Email alerts to subscribers when their postcode is affected
- Historical incident analytics (incidents per supplier, response times)
