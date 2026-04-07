# Next Session Brief — TapWater.uk

**Date:** 2026-04-08
**Status:** Ready for next session

---

## What was completed (April 7-8 session)

### SEO & Content (9 commits)
- Fixed homepage map (N+1 query, 2.7min → 1.3s)
- Meta titles ≤60 chars, descriptions ≤155 chars across 27 files
- Fixed 120 orphan postcode pages via city/region linking
- Added 12 new contaminant pages (8→20 total)
- Created "Best Water Softener UK" guide
- Added contaminant cross-links in postcode data tables
- GEO summary paragraphs on all city/region pages
- Expanded llms.txt with key facts for AI citation

### Revenue Architecture (11 commits)
- Tiered affiliate model: Amazon <£100, direct >£100 with UTM tracking
- Brand-aware CTAs ("Check price on Amazon" vs "Buy from Waterdrop")
- Water softener category + Waterdrop WHR01 (availableInUk: false, single boolean flip to activate)
- Installer partner signup page (/partners) + API + Supabase table
- Auto-forwarding leads to matched installers by postcode

### PFAS City Pages (8 commits)
- pfas_detections Supabase table + data access layer
- Weekly PFAS cron (EA API, 50+ compounds, 29 cities, 3yr history)
- Interactive Mapbox GL JS maps with color-coded markers
- Pure SVG trend chart + CSS compound bar chart
- National tracker (/pfas) + 29 city pages (/pfas/[city])

### 2026 Site Quality (8 commits)
- Sticky header with backdrop blur + active nav highlighting
- Scroll-to-top button on long pages
- Dark mode contrast fixes (bg-white → semantic colors)
- CSP for Mapbox tiles/workers
- OG images for city + PFAS pages
- Schema validation (reviewCount, distribution, FAQ truncation)
- Accessibility (skip link, ARIA labels, WCAG AA contrast)
- Mobile UX (scrollZoom disabled, 44px touch targets)

### Traffic Growth Features (5 commits)
- City page titles rewritten for search intent ("Is London Tap Water Safe?")
- Embeddable water quality widget (API + JS + info page) — hardened with XSS escaping, dark mode, CORS, loading states
- 6 data-driven rankings pages (worst lead/nitrate/PFAS, hardest/best/worst water)
- 48 city-vs-city comparison pages
- Annual UK Water Quality Report 2026

### Data Freshness (1 commit)
- Fixed 280 stale postcodes by adding 2023 local government reorganisation names to supplier map

---

## What to build next session

### Priority 1: News/Alerts Section
**Why:** When water incidents happen (sewage discharges, boil notices, PFAS discoveries), thousands search frantically. Currently zero mechanism to capture this traffic.

**Design needed:**
- `/news` hub + `/news/[slug]` for individual articles
- Markdown-based content in `/data/news/` directory (no CMS)
- Each article: `.md` file with frontmatter (title, date, cities affected, type)
- Dynamic route renders markdown to HTML
- RSS feed at `/news/rss.xml` for Google News inclusion
- Consider: automated monitoring of water company RSS feeds / Twitter for incident detection
- Consider: AI-assisted article drafting from incident data

**Technical decisions to make:**
- Markdown parsing library (next-mdx-remote? remark/rehype? gray-matter for frontmatter?)
- RSS generation (custom route or library?)
- Google News sitemap format requirements
- Content workflow: how does a new article get published? (git commit? admin UI?)

### Priority 2: Outreach Infrastructure
**Why:** DR ~0 with no backlinks. Need infrastructure to support press outreach.

**Build:**
- Press/media page (`/press`) with downloadable data assets, press contact, embargoed data
- Data story templates: auto-generate "Top 10 worst postcodes for X" articles from live data
- Social sharing optimization: ensure all pages have compelling OG images + descriptions
- Media kit: TapWater.uk logo pack, brand guidelines, boilerplate about text

### Priority 3: Remaining Technical Debt
- Scottish Water data source investigation (442 postcodes stuck on EA-only)
- Verify PFAS cron runs successfully on first Sunday execution
- Run Lighthouse audit and address any remaining CWV issues
- Verify all schema validates against Google Rich Results Test
- Check Google Search Console for indexing issues once pages are crawled

### Priority 4: Content That Drives Organic Traffic
- Brand comparison guides ("Brita vs ZeroWater UK", "Waterdrop vs Frizzlife")
- Health-related water guides ("water quality and pregnancy", "water and eczema")
- "Moving house? Check your new area's water" content
- Seasonal content templates (winter pipe advice, summer drought impact)

---

## Key metrics to check at session start
- Google Search Console: how many pages indexed? Any errors?
- Vercel Analytics: traffic levels, top pages
- Ahrefs: domain rating, any backlinks acquired?
- Supabase: softener_leads count, installer_partners signups
- PFAS cron: did Sunday's run complete successfully?

---

## Architecture notes for context
- Next.js 16, React 19, Tailwind CSS v4
- Supabase (Postgres) for data storage
- Vercel for hosting with ISR (revalidate = 86400 on most pages)
- EA API + Stream Water Data Portal for water quality data
- Resend for transactional email
- Mapbox GL JS on PFAS pages (dynamic import)
- Amazon Associates + Waterdrop Impact + Echo Water Impact for affiliates
- Widget embed system at /widget with /api/widget/[district]
