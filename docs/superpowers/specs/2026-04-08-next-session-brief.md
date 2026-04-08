# Next Session Brief — TapWater.uk

**Date:** 2026-04-08
**Status:** Ready for next session

---

## What was completed (April 8 session)

### Priority 1: News & Alerts System (17 commits)
- Fully automated incident detection, AI article generation, publishing pipeline
- Supabase tables: `incidents`, `source_checks`, `incident_logs`
- Cron at `/api/cron/incidents` polling every 15 minutes
- Water company + EA source parsers (note: water company feeds use placeholder URLs — see "What needs fixing" below)
- AI article generation via Claude API with validation + fallback template
- `/news` hub page + `/news/[slug]` article page (editorial + sidebar layout)
- Alert banner component on postcode/city pages (auto-appears/disappears)
- RSS feed at `/news/rss.xml` + Google News sitemap at `/news/sitemap.xml`
- On-demand revalidation via `revalidatePath` when incidents change
- Stale incident handling: 48h admin email alert, 7d auto-resolve
- `ANTHROPIC_API_KEY` set in Vercel env vars

### Priority 2: Outreach Infrastructure (6 commits)
- `/press` page with 5 editorial data stories (live stats + CSV downloads)
- `/api/press/data/[slug]` CSV download endpoint for 5 story types
- Logo SVGs (dark/light), attribution badge SVG
- Media kit section: colours, typography, boilerplate
- Embed & cite section: widget code, badge code, citation text
- Press link in footer

### Priority 4: Content Pages (7 commits)
- 4 brand comparison pages at `/compare/filter/[brand1]/vs/[brand2]` (Brita vs ZeroWater, Brita vs Waterdrop, ZeroWater vs Waterdrop, Waterdrop vs Frizzlife) — data-driven template, 8 URLs
- Config at `src/lib/brand-comparisons.ts`
- 3 health/lifestyle guides: `/guides/water-quality-pregnancy`, `/guides/water-and-eczema`, `/guides/moving-house-water-check`
- All added to sitemap

### UX Improvements (4 commits)
- Mobile bottom nav: floating pill bar replacing hamburger menu
  - 5 items: Home, News, Search (CTA), Rankings, More
  - "More" opens bottom sheet with remaining nav + postcode search
  - Auto-hides on scroll down, shows on scroll up (iOS Safari pattern)
  - Components: `src/components/mobile-bottom-nav.tsx`, `src/components/bottom-sheet.tsx`
- Font size readability pass across 21 files (9px→11px, 10px/11px→12px, 12px→14px on body content)
- PFAS stat now clickable (links to /pfas tracker)
- Supplier score labels clarified on compare page
- Author attribution changed from "Remy" to "CCC Impact BV" / "TapWater.uk Research" across 24 files

---

## What needs fixing next session

### CRITICAL: Incident Feed URLs Are Broken

The water company incident parsers in `src/lib/incident-parsers/water-companies.ts` use **placeholder/fabricated API URLs** that don't exist. All 10 water company feeds return 403 or 404. The cron runs every 15 min and logs 462 failed checks.

**No UK water company has a public incident API.** Here's what actually exists:

| Company | Real Incident Page | Feasibility |
|---------|-------------------|-------------|
| **Severn Trent** | `stwater.co.uk/in-my-area/incidents/` | **EASY — server-rendered HTML cards, structured, scrapable** |
| **Scottish Water** | Overflow API at `api.scottishwater.co.uk/overflow-event-monitoring/v1` | **EASY — real JSON API, updates hourly** |
| Thames Water | `thameswater.co.uk/network-latest` | Medium — SPA, needs API reverse-engineering |
| United Utilities | `unitedutilities.com/emergencies/up-my-street/` | Medium — Google Maps + FindApi |
| Yorkshire Water | `yorkshirewater.com/your-water/view-report-problems/` | Medium — custom JS map modules |
| Southern Water | `southernwater.co.uk/works-or-issues-in-my-area/` | Medium — Vue.js SPA |
| South West Water | `southwestwater.co.uk/.../service-updates` | Medium — Nuxt.js SPA |
| Anglian Water | `anglianwater.co.uk/your-local-area/report-an-issue` + digdat | Hard — iframe + 3rd party platform |
| Welsh Water | `dwrcymru.com/en/help-advice/in-your-area` + digdat | Hard — digdat platform |
| Northumbrian Water | `nwl.co.uk/check` | Medium — FindApi + Azure |

**Recommended fix:**
1. Replace `parseWaterCompanyFeeds()` in `src/lib/incident-parsers/water-companies.ts` with real parsers for Severn Trent (HTML scrape) and Scottish Water (JSON API)
2. Disable the 8 broken placeholder feeds to stop wasting cron cycles
3. EA Flood Monitoring already works (returns 200, just no incidents currently)
4. Phase 2: reverse-engineer Thames Water and Southern Water SPA APIs

### Thames Water Data Gap (1,198 postcodes stuck on ea-only)

Thames Water does NOT publish to the Stream Water Data Portal (`data.streamwater.co.uk`). This means all Thames Water postcodes (SL, TW, W, SW, SE, etc.) have only EA environmental monitoring data — some dating back to year 2000.

**Root cause:** `src/lib/stream-sources.ts` has no entry for `"thames-water"`. Thames Water, Scottish Water, and Wessex Water are the three holdouts.

**The Stream portal has been checked thoroughly** — the org `XxS6FebPX29TRGDJ` has zero Thames Water services. This is confirmed in the original spec at `docs/superpowers/specs/2026-04-02-stream-tap-water-integration-design.md`.

**Potential alternatives to investigate:**
- Thames Water's own Open Data portal at `data.thameswater.co.uk` (has EDM data, may have drinking water quality)
- DWI annual returns data (published per company, not real-time)
- Direct Thames Water contact requesting data access

### PFAS Cron Not Yet Executed

The PFAS cron (`/api/cron/pfas`, schedule `0 3 * * 0` = Sundays 3am) has zero rows in `pfas_detections`. It should fire next Sunday April 12. Verify after that date.

### Priority 3 Technical Debt (deferred)
- Scottish Water data source (442 postcodes, separate from the 1,198 Thames Water ea-only issue)
- Lighthouse audit
- Google Search Console check (once pages are indexed)
- Verify all schema validates against Google Rich Results Test

---

## Architecture notes for context

- **Next.js 16.2.2**, React 19, Tailwind CSS v4
- **Supabase** (Postgres) — project ID: `zxmqmzzwausjradfyttc`
- **Vercel** for hosting with ISR (`revalidate = 86400` on most pages, `300` on news pages)
- **Vercel crons:** refresh (5min), emails (9am daily), pfas (Sunday 3am), incidents (15min)
- **Resend** for transactional email
- **Anthropic Claude API** for incident article generation (`ANTHROPIC_API_KEY` in Vercel env)
- **Mapbox GL JS** on PFAS pages
- **Affiliate programs:** Amazon Associates, Waterdrop Impact, Echo Water Impact
- **Widget** embed system at `/widget` with `/api/widget/[district]`

### Key file locations
- Data access: `src/lib/data.ts`, `src/lib/incidents.ts`, `src/lib/pfas-data.ts`, `src/lib/press-data.ts`
- Incident parsers: `src/lib/incident-parsers/` (water-companies.ts, environment-agency.ts, postcode-matcher.ts, index.ts)
- Article generation: `src/lib/incident-article.ts`
- Stream data sources: `src/lib/stream-sources.ts` (Thames Water MISSING)
- Brand comparisons: `src/lib/brand-comparisons.ts`
- Types: `src/lib/types.ts`, `src/lib/incidents-types.ts`
- Mobile nav: `src/components/mobile-bottom-nav.tsx`, `src/components/bottom-sheet.tsx`

### Database tables
- `page_data` — postcode-level water quality (2,782 rows: 1,584 stream, 1,198 ea-only)
- `postcode_districts` — geographic/supplier mapping
- `pfas_detections` — EA PFAS monitoring (currently 0 rows, awaiting first cron run)
- `incidents` — auto-detected water incidents (0 rows, feeds need fixing)
- `source_checks` — cron polling log (462 rows, all failed checks)
- `incident_logs` — incident state transition audit trail
- `subscribers` — email newsletter
- `pipeline_runs` — data refresh pipeline status
- `drinking_water_readings` — raw Stream tap water test results

### Design system
- Fonts: DM Sans (body), Instrument Serif (display/headings), Space Mono (data/numbers)
- Colours: `--color-safe` #16a34a, `--color-warning` #d97706, `--color-danger` #dc2626, `--color-accent` #0891b2
- Company: CCC Impact BV, branded as "TapWater.uk Research" for authorship
- Contact: press@tapwater.uk, hello@tapwater.uk, data@tapwater.uk
- Tone: plain language, no jargon, no emojis as icons, audience is normal people
