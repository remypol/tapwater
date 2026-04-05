# TapWater.uk Affiliate Growth Strategy

**Date:** 2026-04-05
**Goal:** Build a thriving affiliate business within 2 months
**Approach:** Conversion-first — maximise revenue per visitor through expanded products, buying guides, category pages, and personalised email sequences

---

## 1. Product Catalogue Expansion

### Current State
7 products (3 jugs, 3 under-sink, 1 countertop). Amazon Associates only (`tapwater21-21`).

### Target State
25-30 products across 6 categories. Multi-network affiliate strategy prioritising Impact.com brands.

### Categories

| Category | Ticket Range | Commission Source | Commission Rate |
|----------|-------------|-------------------|-----------------|
| Jug Filters | £15-50 | Amazon Associates | 3% |
| Countertop / Tap Filters | £30-100 | Amazon / Direct | 3-8% |
| Under-Sink Filters | £50-150 | Amazon / Direct | 3-8% |
| Reverse Osmosis Systems | £200-500 | Impact.com (Waterdrop 8%, Echo Water 20%) | 8-20% |
| Whole-House Systems | £500-1,500 | Direct partnerships | 10-15% |
| Shower Filters | £15-40 | Amazon Associates | 3% |
| Testing Kits | £15-80 | Amazon Associates | 3% |

### Affiliate Network Priority
1. **Impact.com brands first** (Waterdrop 8%, Echo Water 20%) — hero recommendation slots
2. **Amazon Associates** — broad catalogue, consumer trust, lower commission
3. **Direct brand partnerships** (Frizzlife, BWT, Doulton) — pursue as traffic grows

### Product Data Model

Each product needs:
- `id`, `brand`, `model`, `slug`
- `category` (jug | countertop | under-sink | reverse-osmosis | whole-house | shower | testing-kit)
- `removes[]` — contaminants this product removes (for recommendation matching)
- `certifications[]` — NSF/ANSI, WRAS, etc.
- `price_gbp`, `price_tier` (budget | mid | premium)
- `affiliate_url`, `affiliate_program` (amazon | impact | direct)
- `affiliate_tag` — tracking parameter
- `image_url`
- `rating` (out of 5)
- `pros[]`, `cons[]` — for guide reviews
- `best_for` — one-liner ("Best for PFAS removal", "Best budget option")
- `flow_rate`, `filter_life`, `annual_cost` — for comparison tables

### Recommendation Engine Upgrade

Current logic: match filters to flagged contaminants, recommend up to 3.

New logic:
- **Hard water detected** → recommend shower filter + whole-house softener alongside drinking filter
- **PFAS detected** → push RO system (only RO removes PFAS), explain why jugs won't work
- **Lead flagged** → recommend testing kit first ("confirm it's your pipes"), then under-sink filter
- **Nothing flagged** → soft sell for taste improvement, recommend budget jug
- **Every recommendation** shows a budget pick and a premium pick
- **Impact.com products** get priority in hero slots (higher commission, no conflict of editorial independence — they genuinely are the better products for RO/under-sink)

---

## 2. Buying Guides

### Current State
One guide: "Best Water Filters UK" — covers everything in one page, can't rank for specific queries.

### Target State
6 buying guides, each targeting a specific high-intent keyword cluster.

### Guide List (priority order)

| # | Title | Target Keywords | Products Featured | Revenue Potential |
|---|-------|----------------|-------------------|-------------------|
| 1 | Best Reverse Osmosis System UK | "best ro system uk", "reverse osmosis filter uk" | Waterdrop G3P600, Frizzlife PD600, Echo Water | High (£300-500, 8-20%) |
| 2 | Best Shower Filter for Hard Water UK | "shower filter uk", "hard water shower filter" | Jolie, AquaBliss, Philips, Waterdrop | Medium (impulse, high volume) |
| 3 | Best Whole House Water Filter UK | "whole house filter uk", "mains water filter" | BWT, Waterdrop WHF, Aquasana | Very high (£500-1500) |
| 4 | Best Water Testing Kit UK | "water test kit uk", "test my tap water" | SimplexHealth, Tap Score, SJ Wave | Low ticket, strategic (trust → upsell) |
| 5 | Best Water Filter for PFAS Removal | "pfas water filter", "forever chemicals filter" | RO systems only | High (fear-driven, urgent) |
| 6 | Best Water Filter Jug UK 2026 | "best filter jug", "brita vs zerowater" | Brita, ZeroWater, Aqua Optima, PUR | Low ticket, high volume |

### Guide Template

Each guide follows this structure:

1. **Hook** — "We analysed 2,800 UK postcodes. Here's what actually removes [X]." Unique editorial voice backed by data nobody else has.
2. **Quick picks** — top 3 at a glance with hero product cards and CTA buttons
3. **What to look for** — educational section (certifications, flow rate, maintenance costs, what actually matters)
4. **Detailed reviews** — each product with pros/cons, who it's best for, contaminants removed, annual running cost
5. **Comparison table** — side-by-side specs for quick scanning
6. **Verdict** — clear recommendation tied back to water data ("If your postcode shows PFAS, this is the one.")
7. **FAQ** — schema-marked questions targeting "People Also Ask" boxes

### Competitive Advantage
Every guide links to the postcode tool. "Not sure if you need an RO system? Check your postcode — if PFAS is flagged, you do." No other affiliate site has local water quality data. This is the content moat.

### SEO
- Each guide gets ArticleSchema + FAQSchema + ProductSchema
- Breadcrumbs: Home > Guides > [Guide Title]
- Internal links to relevant contaminant pages, category pages, and postcode search
- Updated annually (title includes year for freshness signal)

---

## 3. Category Pages & Site Architecture

### Current State
No `/filters` section. Filter recommendations only appear inline on postcode pages.

### URL Structure

```
/filters                          → Hub: "Find the Right Water Filter"
/filters/jug                      → Jug filters
/filters/under-sink               → Under-sink systems
/filters/reverse-osmosis          → Reverse osmosis systems
/filters/whole-house              → Whole-house filters
/filters/shower                   → Shower filters
/filters/testing-kits             → Water testing kits
```

Individual product pages (`/filters/[product-slug]`) are deferred to phase 2, only if traffic justifies them.

### Hub Page (`/filters`)

- Postcode search at the top: "What's in your water?" — enter postcode, get personalised category recommendations
- Without postcode: browse all 6 categories with description, product count, price range, "best for" tag
- Popular products carousel
- Trust signals: "Based on 1.6 million water quality readings"

### Category Pages (`/filters/[category]`)

- Curated product grid (4-8 products per category)
- Comparison table: specs, price, contaminants removed, certifications, annual cost
- "Best for your area" callout when user arrives from a postcode page (contaminant context via query params)
- Link to full buying guide for that category
- Structured data: Product schema + FAQ schema
- Breadcrumbs: Home > Filters > [Category]

### Internal Linking Web

Every page type feeds into every other:

```
Postcode page ("SW1A water quality")
  → "We recommend an RO system for your area" → /filters/reverse-osmosis
  → "PFAS detected" → /contaminant/pfas → /guides/best-water-filter-for-pfas

Buying Guide ("Best RO System UK")
  → "Check if you need one" → postcode search
  → Product links → affiliate URLs
  → "What is PFAS?" → /contaminant/pfas

Category page ("/filters/reverse-osmosis")
  → "Read our full guide" → /guides/best-reverse-osmosis-system-uk
  → "Check your water first" → postcode search
  → Product cards → affiliate links

Contaminant page ("/contaminant/pfas")
  → "How to remove PFAS" → /guides/best-water-filter-for-pfas
  → "Is PFAS in your water?" → postcode search
```

Every page is both a landing page and a funnel. Google can enter from any point, and every path leads to a product recommendation.

### Sitemap Updates
- Add `/filters` hub + 6 category pages (priority 0.8, monthly revalidation)
- Add 6 guide pages (priority 0.8, monthly revalidation)
- Total new indexable pages: 13

---

## 4. Email Sequences

### Current State
Email capture on postcode pages via Resend with verification flow. After verification: nothing.

### Drip Sequence

Triggered when a user subscribes from a postcode page. We know their postcode and water data.

| Day | Subject | Purpose | Content |
|-----|---------|---------|---------|
| 0 | Your Water Report for [Postcode] | Deliver value, build trust | Safety score, flagged contaminants, comparison to national average |
| 3 | What [Top Concern] Means For You | Educate on their specific issue | Plain English explainer. PFAS → what are forever chemicals. Hard water → impact on skin/appliances/pipes |
| 7 | What You Can Do About It | The sell | Matched product recommendations from recommendation engine. Hero product + budget alternative. Affiliate links |
| 14 | Want to Know Exactly What's in Your Pipes? | Alternative angle | Testing kit recommendation for people who didn't buy a filter on day 7 |
| 30 | Water Quality Update for [Postcode] | Retention | New readings or status. Keeps engagement. Soft product reminder in footer |

### Design Principles
- **Personalised from day one** — "Your water in SE15 has elevated lead levels", not "Welcome to our newsletter"
- **Education before selling** — days 0 and 3 build trust. Day 7 is the first product push
- **Matched products** — same recommendation engine as the site, now in email
- **Low volume** — 5 emails over a month. Genuine value in each
- **GDPR compliant** — unsubscribe on every email, verification flow already in place

### Technical Implementation
- Resend already integrated — build sequence logic as a lightweight state machine
- Store subscriber's postcode + water data snapshot at signup time
- Cron job or Resend batch API for scheduled sends
- Track: open rate, click-through to affiliate links, unsubscribe rate

---

## 5. Revenue Projections

### Break-Even Analysis

Current costs: ~£50/month (Supabase, Vercel, domain, Resend)

| Scenario | Monthly Visitors | Affiliate CTR | Conversion | AOV | Blended Commission | Monthly Revenue |
|----------|-----------------|---------------|------------|-----|--------------------|----|
| **Month 1-2** | 1,000 | 2% | 5% | £100 | 6% | £6 |
| **Month 3-4** | 5,000 | 3% | 5% | £150 | 8% | £90 |
| **Month 6** | 10,000 | 3% | 5% | £200 | 8% | £240 |
| **Month 12** | 25,000 | 4% | 5% | £200 | 10% | £1,000 |

Break-even (~£50/month) is realistic at 3,000-5,000 monthly visitors with the expanded product catalogue.

### Key Levers
- **AOV** — pushing higher-ticket products (RO systems, whole-house) is the biggest lever
- **Commission rate** — Impact.com brands (8-20%) vs Amazon (3%) is a 3-6x multiplier
- **CTR** — personalised recommendations based on actual water data should outperform generic "best filter" lists

---

## 6. Implementation Priority

| Priority | Workstream | Dependencies |
|----------|-----------|-------------|
| **P0** | Expand product catalogue + data model | None — foundational |
| **P0** | Upgrade recommendation engine | Product catalogue |
| **P1** | Build `/filters` hub + 6 category pages | Product catalogue |
| **P1** | Write 6 buying guides | Product catalogue |
| **P2** | Internal linking audit + implementation | Category pages + guides |
| **P2** | Schema markup (Product, FAQ, HowTo) | Category pages + guides |
| **P3** | Email drip sequences | Recommendation engine |
| **P3** | Affiliate link tracking + analytics | All of the above |

---

## 7. Migration: Existing "Best Water Filters UK" Guide

The current `/guides/best-water-filters-uk` page is a catch-all. It should be reworked into a hub/overview that links out to the 6 specific buying guides. This avoids keyword cannibalisation and gives each guide a clear ranking target. The URL stays live (no redirect needed) but the content shifts from "here are all the filters" to "here's how to choose the right type, then read our detailed guide for that category."

---

## 8. What This Does NOT Cover

- Social media / viral marketing (separate project, ChemTracker)
- Paid advertising (not needed at this stage)
- Individual product review pages (phase 2, only if traffic justifies)
- Direct brand outreach for custom partnerships (phase 2, after proving traffic)
- Ad revenue / display ads (not aligned with premium positioning)
