# Outreach Infrastructure — Design Spec

**Date:** 2026-04-08
**Status:** Approved

---

## Overview

Press/media page and link-building infrastructure for TapWater.uk. Every element is designed to generate backlinks — embeddable assets, downloadable data, cite-ready stories, and attribution-baked media kit. Journalists are one audience; bloggers, councils, and comparison sites matter equally.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Primary goal | Link-building first, journalist-friendly second | DR ~0, backlinks are the bottleneck. Every asset needs attribution baked in. |
| Data stories | Static set of 5 | Rankings data already exists. Repackage for press with headlines + CSV downloads. YAGNI on dynamic generation. |
| Media kit | Package existing assets | Logo, fonts, colours already in codebase. Extract and bundle, no new design needed. |
| Brand guidelines | On-page, not PDF | Easier to maintain, always up-to-date, one less file to keep in sync. |

---

## Routes

### New Routes

| Route | Type | Purpose |
|-------|------|---------|
| `/press` | Page (server component) | Press/media hub — data stories, media kit, embed instructions, press contact |
| `/api/press/data/[slug]` | Route handler | CSV download for each data story |

### No Modified Routes

No existing pages change. The press page is self-contained.

---

## Press Page (`/press`)

`revalidate = 86400` (daily, same as rankings)

### Section 1: Hero

- Headline: "Data for journalists, bloggers, and researchers"
- Subtext: "Free water quality data covering every UK postcode. Download, embed, or cite — just link back."
- Press contact: email address displayed prominently (use the same contact email as `/contact` page)
- "About TapWater.uk" boilerplate paragraph — 3-4 sentences, copy-pasteable for articles

### Section 2: Data Stories

5 story cards in a grid. Each card contains:

- **Headline** — attention-grabbing, journalist-ready (e.g. "The 10 UK Postcodes With the Highest Lead Levels")
- **Key stat** — pulled live from data (e.g. "SE17 has lead at 3.2x the UK legal limit")
- **Top 3 preview** — first 3 entries from the ranking, teasing the full dataset
- **"Download CSV" button** — links to `/api/press/data/[slug]`
- **"Cite this" expandable** — click to reveal copy-paste attribution text:
  ```
  Source: TapWater.uk (https://www.tapwater.uk/rankings/worst-lead)
  Data: Environment Agency Water Quality Archive, analysed by TapWater.uk
  ```
- **"View full data" link** — links to the corresponding `/rankings/[slug]` page

#### The 5 Stories

| Slug | Headline | Data Source |
|------|----------|-------------|
| `worst-lead` | The 10 UK Postcodes With the Highest Lead Levels | Rankings: worst by lead reading value |
| `worst-nitrate` | The 10 UK Postcodes With the Highest Nitrate Levels | Rankings: worst by nitrate reading value |
| `most-pfas` | The UK Cities With the Most PFAS Detections | PFAS national summary: cities by detection count |
| `hardest-water` | The 10 Hardest Water Areas in the UK | Rankings: highest hardness reading |
| `best-worst-overall` | The Best and Worst Tap Water in the UK | Rankings: top 10 highest + lowest safety scores |

### Section 3: Media Kit

- **Logos** — download links for SVG and PNG versions (dark and light variants)
  - `/public/press/tapwater-logo-dark.svg`
  - `/public/press/tapwater-logo-light.svg`
  - `/public/press/tapwater-logo-dark.png`
  - `/public/press/tapwater-logo-light.png`
- **Brand colours** — visual swatches with hex codes:
  - Primary: ink colour from CSS vars
  - Safe: `#16a34a`
  - Warning: `#d97706`
  - Danger: `#dc2626`
  - Accent: from CSS vars
- **Typography** — font names and usage:
  - DM Sans — body text
  - Instrument Serif — display headings
  - Space Mono — data/numbers
- **Boilerplate** — "About TapWater.uk" paragraph, copy-pasteable

### Section 4: Embed & Cite

- **Widget embed** — reference to the existing embeddable widget at `/widget`, with the embed code snippet and a note that it includes "Data from TapWater.uk" attribution
- **Citation format** — recommended citation for academic/blog use:
  ```
  TapWater.uk. "UK Water Quality Data." https://www.tapwater.uk.
  Based on Environment Agency Water Quality Archive data.
  ```
- **"Source: TapWater.uk" badge** — a small HTML/image badge that links back. Provide the embed code:
  ```html
  <a href="https://www.tapwater.uk" target="_blank" rel="noopener">
    <img src="https://www.tapwater.uk/press/badge.svg" alt="Data from TapWater.uk" height="24">
  </a>
  ```
- Badge asset: `/public/press/badge.svg` — simple "Data from TapWater.uk" text badge

---

## CSV API (`/api/press/data/[slug]`)

Route handler that generates downloadable CSV files from live data.

**Supported slugs:** `worst-lead`, `worst-nitrate`, `most-pfas`, `hardest-water`, `best-worst-overall`

**Response:**
- `Content-Type: text/csv; charset=utf-8`
- `Content-Disposition: attachment; filename="tapwater-[slug]-2026.csv"`
- `Cache-Control: public, max-age=86400, s-maxage=86400`

**CSV format:**
```csv
Rank,Postcode,Area,City,Value,Unit,UK Limit,Safety Score
1,SE17,Walworth,London,31.2,µg/L,10,3.1
2,...
```

Each story slug maps to a query function:
- `worst-lead` / `worst-nitrate` / `hardest-water` → query `postcode_data` sorted by specific reading value, limit 10
- `most-pfas` → query `pfas_detections` aggregated by city, sorted by detection count
- `best-worst-overall` → query `postcode_data` sorted by safety_score (top 10 best + top 10 worst)

Footer row in each CSV:
```csv
,,,,,,
Source,TapWater.uk,https://www.tapwater.uk,,,,
Data,Environment Agency Water Quality Archive,,,,,
```

---

## Static Assets

### Logo Files

Extract from the existing `Logo` component SVG in `src/components/logo.tsx`:
- `tapwater-logo-dark.svg` — dark text version for light backgrounds
- `tapwater-logo-light.svg` — light text version for dark backgrounds
- PNG exports at 1024px width for both variants

### Badge

`/public/press/badge.svg` — small attribution badge:
- ~120x24px
- Text: "Data from TapWater.uk"
- Links back to homepage
- Minimal, clean design that works on any background

---

## SEO

- Title: `Press & Media | TapWater.uk`
- Description: "Download UK water quality data, logos, and media assets. Free data stories for journalists and bloggers."
- Schema.org: `WebPage` with `about` property referencing the Organization
- No robots restrictions — we want this indexed

---

## Dependencies

**No new packages.** Everything uses existing infrastructure:
- Supabase queries (same as rankings pages)
- Static file serving from `/public/press/`
- Server components with ISR

---

## Phase Plan

### This session
- `/press` page with all 4 sections
- `/api/press/data/[slug]` CSV endpoint for 5 stories
- Logo file exports (SVG + PNG)
- Attribution badge SVG
- Add "Press" link to footer (not header — press page is for outreach, not primary nav)

### Future
- Automated press release generation when major data changes detected
- Email notification to press contacts when new data stories are published
- Embargoed data section with password protection for exclusive stories
