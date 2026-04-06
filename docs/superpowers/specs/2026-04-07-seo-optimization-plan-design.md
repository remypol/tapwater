# TapWater.uk SEO Optimization Plan

**Date:** 2026-04-07
**Status:** Approved design, pending implementation

## Context

SEO audit of tapwater.uk identified performance issues (LCP 4.6s), technical SEO gaps (missing OG tags, thin FAQ schema), major keyword gaps (not ranking for "water hardness check", "is tap water safe", water problem queries), and content opportunities (rankings page, troubleshooting hub). Competitor analysis revealed WaterGrade (5,493 city pages), MyTapWater (direct competitor ranking #1 for key queries), and filter brands (BRITA, Harvey, Kinetico) dominating informational queries tapwater.uk should own.

All changes must comply with Google's helpful content guidelines. Programmatic pages must pass the test: "would a user who lands on this page feel satisfied, or would they bounce and search again?"

## Phase 1: Performance — LCP 4.6s → <2.5s

Google uses Core Web Vitals as a ranking signal. Fix performance before adding new pages.

### 1A. Eliminate redirect penalty (~770ms)

`tapwater.uk` → 307 → `www.tapwater.uk` costs 770ms. The redirect itself is correct (www is the canonical domain). Verify in Vercel dashboard that `www.tapwater.uk` is set as primary domain with `tapwater.uk` as redirect. Audit all internal links, sitemap, and canonical URLs to ensure none reference the bare domain. `metadataBase` and `BASE_URL` already point to `www.tapwater.uk` — this is a verification task, not a code change.

### 1B. Defer Google Tag Manager (~65KB)

Change GTM script strategy from `afterInteractive` to `lazyOnload` in `src/app/layout.tsx`. This delays analytics loading until after the page is fully interactive. Trade-off: may miss very early bounces in analytics — acceptable for an SEO site where users spend 30s+ reading data.

### 1C. Reduce CSS bundle

Audit Tailwind config for unused utilities. Verify content-based purging is working correctly. The flagged render-blocking CSS chunk adds ~150ms. Reducing bundle size is simpler and more maintainable than critical CSS inlining.

### 1D. Reduce main-thread work (33.6s total)

The biggest LCP factor. Strategy:
- **Dynamic imports** for below-fold heavy components: Recharts charts, Mapbox maps, data tables. Use `next/dynamic` with `ssr: false`.
- **Verify Sentry tree-shaking** — config already excludes tracing/replay but verify bundle impact.
- **Image priority** — ensure all above-fold images use the `priority` prop on Next.js `Image` component.

**Target:** LCP < 2.5s, Lighthouse performance > 90.

## Phase 2: Technical SEO Hardening

Low effort, high leverage. Maximize existing pages before adding new ones.

### 2A. Add OG/Twitter cards to 9 missing pages

Add `openGraph` and `twitter` metadata to:
- `/filters/` and `/filters/[category]/` (SEO-relevant)
- `/about/`, `/about/methodology/`, `/about/data-sources/` (E-E-A-T relevant)
- `/contact/`, `/privacy/`, `/disclaimer/`, `/affiliate-disclosure/` (low priority but easy)

### 2B. Expand FAQ schema from 3 → 6+ questions

More FAQ schema = more chances to win "People Also Ask" boxes. All answers dynamically generated from real data so each page's FAQs are unique.

**Postcode pages** — add questions:
- Is the tap water safe to drink in [area]?
- Does [area] have hard or soft water?
- What contaminants are in [area] tap water?
- Who supplies water to [postcode]?
- Should I use a water filter in [area]?
- Are there PFAS in [area] water?

**City pages** — add questions:
- Is [city] tap water safe to drink?
- What is the water quality in [city]?
- Is [city] water hard or soft?
- Which areas of [city] have the best water?
- Who supplies water in [city]?
- Does [city] have PFAS in the water?

**Region pages** — add questions:
- What is the water quality like in [region]?
- Which [region] city has the best tap water?
- Is [region] water hard or soft?
- How many water suppliers operate in [region]?

### 2C. Add Article + Person schema to guide pages

Google quality raters look for author expertise. Add to all guide pages:
- `Article` schema with headline, datePublished, dateModified, publisher
- `Person` schema for author (reuse from about page): name, URL, jobTitle, sameAs

### 2D. Product schema on filter pages

Add `Product` schema to filter recommendation pages only if genuine product data exists (price, rating, brand from affiliate data). Do not fabricate structured data.

## Phase 3: New Informational Content Pages

Manually crafted, long-form guides targeting the biggest keyword gaps. Written for normal people, not scientists.

### 3A. "Is UK Tap Water Safe to Drink?" guide

**URL:** `/guides/is-uk-tap-water-safe/`
**Target keywords:** "is tap water safe to drink uk", "is uk tap water safe", "can you drink tap water in england"
**Current rank:** Not ranking. BRITA ranks #1.

Content structure (~2,500 words):
1. TL;DR answer — Yes, among the safest globally. But "safe" ≠ "perfect".
2. How UK water is regulated — DWI, water companies, legal limits vs WHO guidelines
3. What's actually in your water — chlorine, fluoride, lead, nitrates, PFAS (link to contaminant pages)
4. Regional differences — link to city/region pages with real data examples
5. Tap vs bottled water — environmental and quality comparison
6. Bathroom vs kitchen tap — common question, FAQ win
7. When to be concerned — lead pipes, private supplies, immunocompromised
8. What you can do — check your postcode (CTA), filter recommendations

Article + Person schema. FAQ schema with 6+ questions.

### 3B. Water Hardness Checker

**URL:** `/hardness/`
**Target keywords:** "water hardness check", "is my water hard or soft", "hard water areas uk", "water hardness by postcode"
**Current rank:** Not ranking. Harvey/Kinetico/Aquacure dominate.

This is a tool page, not just a guide:
1. Postcode search — enter postcode, get hardness classification + exact PPM/mg/L value
2. UK hardness map — Mapbox, colour-coded by hardness zones
3. What the numbers mean — soft/moderate/hard/very hard scale with plain language
4. Effects of hard water — limescale, appliance damage, skin/hair, taste
5. What causes hard water — geology explained simply
6. Solutions — water softeners vs filters, links to /filters/

Key differentiator: shows hardness alongside safety score and contaminant data, not in isolation.

### 3C. Water Problems Troubleshooting Hub

**URL:** `/guides/water-problems/` (hub) + sub-pages per symptom
**Target keywords:** "why does my water taste of chlorine", "cloudy tap water", "brown water from tap", "water tastes metallic"
**Current rank:** Not ranking. Water companies own these queries.

Hub page with symptom-based navigation:
- **Taste issues:** chlorine, metallic, TCP/chemical, salty, earthy
- **Appearance issues:** cloudy/milky, brown/rusty, blue/green, white particles
- **Smell issues:** chlorine, rotten eggs, musty/earthy, chemical
- **Pressure issues:** low pressure, intermittent supply, air in pipes

Each sub-page: cause, is it dangerous, what to do, when to contact your supplier. Cross-link to contaminant pages and postcode checker.

### 3D. Lead Pipes Guide

**URL:** `/guides/lead-pipes-uk/`
**Target keywords:** "lead pipes uk", "how to check for lead pipes", "lead in tap water"

Content:
1. How to identify lead pipes (visual guide — colour, scratch test, magnet test)
2. Health risks — especially children, pregnant women
3. Whose responsibility — you vs water company
4. How to reduce lead exposure — running the tap, filters
5. Replacement grants and schemes
6. CTA: "See if lead has been detected in your area"

### 3E. PFAS / Forever Chemicals Deep Dive

**URL:** `/guides/pfas-forever-chemicals/` (may already exist — enrich if so)
**Target keywords:** "PFAS in UK water", "forever chemicals tap water", "PFAS water filter"
**Timely:** UK government launched PFAS Plan Feb 2026, consultation on statutory limits underway.

Content:
1. What PFAS are and why they matter (plain language)
2. UK regulatory status — current voluntary limits, 2026 consultation, expected changes
3. Where PFAS come from — industrial sites, firefighting foam, packaging
4. PFAS in UK water — data from tapwater.uk (link to postcodes with detections)
5. How to reduce exposure — which filters remove PFAS (RO, activated carbon)
6. CTA: check your postcode

## Phase 4: City Page Enrichment

Make 51 existing city pages pass Google's "helpful content" bar. Currently they show aggregate stats and a postcode table — good foundation but not enough unique value.

### 4A. National average comparison

Show city score vs national average visually. "Manchester scores 6.8/10 — slightly below the UK average of 7.2/10." Compute national average from all scored postcodes.

### 4B. Best & worst areas callout

Highlight top 3 and bottom 3 postcodes within the city with scores and links. Creates internal links and gives actionable local insight.

### 4C. Hardness classification

Show average water hardness for the city with classification badge (soft/moderate/hard/very hard). Data exists in postcode readings — needs aggregation. Link to /hardness/ page.

### 4D. City-specific FAQ schema (6 questions)

Dynamically generated, data-unique answers:
- Is [city] tap water safe to drink? → uses actual score + grade
- What is the water quality in [city]? → score + flagged count + context
- Is [city] water hard or soft? → hardness value + classification
- Which areas of [city] have the best water? → top 3 postcodes
- Who supplies water in [city]? → supplier name + link
- Are there PFAS in [city] water? → PFAS count + context

### 4E. Contextual guide links

Based on data, dynamically link to relevant guides:
- PFAS detected → PFAS guide
- Lead flagged → lead pipes guide
- Hard water → hardness page + softener info
- Any contaminants flagged → filter recommendations
- Always → "Is UK tap water safe?" guide

### 4F. Expanded supplier section

Expand primary supplier card to include: postcodes served count, link to supplier page, which other cities they serve. Creates city ↔ supplier ↔ city cross-links.

## Phase 5: Best/Worst Rankings Page

**URL:** `/rankings/`
**Target keywords:** "best tap water in uk", "worst tap water uk", "uk water quality rankings", "best water company uk"

High search intent, highly linkable/shareable. Natural backlink magnet.

### Page sections:

1. **Overall city rankings table** — all 51 cities ranked by safety score. Sortable columns: score, hardness, flagged contaminants, PFAS detections. Each row links to city page.
2. **Top 10 / Bottom 10 highlight cards** — "The UK's best tap water is in [city] (8.9/10)". Shareable, quotable.
3. **Rankings by contaminant** — tabs for: highest lead, most PFAS, highest nitrates, hardest water. Different lenses on the same data.
4. **Water company leaderboard** — suppliers ranked by average score across all postcodes they serve. Links to supplier pages.
5. **Regional comparison** — 11 regions ranked. Visual bar chart. Links to region pages.

Auto-updates with ISR (daily). "Last updated" date prominently displayed. Methodology link.

## Phase 6: Internal Linking Overhaul

Build hub-and-spoke topology to distribute link equity. Most effective after all new pages exist.

### 6A. Link architecture

```
Rankings → Cities, Regions, Suppliers
Cities → Postcodes, Region, Supplier, Rankings, Guides (conditional)
Postcodes → City, Region, Supplier, Contaminants, Guides (conditional), Hardness, Filters
Guides → Postcode examples, Cities, Filters, Hardness
Contaminants → Postcodes where detected, Guide, Filters
Homepage → Rankings, Hardness, Top Guides, Featured Cities
```

### 6B. Shared RelatedContent component

Build a `<RelatedContent />` component that takes the current page's data context (contaminants flagged, city, region, supplier, hardness) and automatically renders relevant cross-links. Every page gets contextual internal links without manual curation. New pages automatically get linked when they share data characteristics.

### 6C. Specific link additions by page type

| From | Add links to |
|------|-------------|
| Postcode pages | Parent city, region, supplier, relevant contaminant pages, relevant guides (conditional on data), /hardness/, /filters/ |
| City pages | Parent region, supplier page, /rankings/, relevant guides (conditional) |
| Guide pages | Relevant postcode examples, city pages, /filters/, /hardness/ |
| Contaminant pages | Postcodes where detected, relevant guide, filter recommendation |
| Rankings page | Every city, region, supplier, methodology |
| Homepage | /rankings/, /hardness/, top guides, featured cities |

## Out of Scope

- Expanding beyond 51 cities (current coverage is good; enrichment > expansion)
- Paid search / Google Ads
- Social media content strategy
- Email marketing changes
- Mobile app
- API for third-party consumption
