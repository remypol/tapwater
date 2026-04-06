# Scottish Water Data Sources — Research Findings

**Date:** 2026-04-06
**Goal:** Identify data sources for Scotland's 442 postcodes

## Sources Investigated

### 1. DWQR (dwqr.scot)

**What exists:**
- Annual Report PDFs (latest: "Drinking Water Quality in Scotland 2024", published Sept 2025)
- A "Check Your Local Water Quality" tool on their site (links to Scottish Water's postcode checker)
- Private Water Supply Sources dataset on Spatial Hub Scotland (spatial data, not drinking water quality)

**Data format:** PDF reports only. No CSV, Excel, or API downloads found.

**Coverage:** National aggregate + supply zone level. The annual report contains zone-level compliance data similar to Thames Water's PDFs.

**Verdict:** The annual report PDFs are the most promising source. They contain zone-level water quality results that could be parsed with pdfplumber (same approach as Thames Water). However, the PDF structure needs investigation — it may differ from Thames Water's format.

### 2. data.gov.scot

**What exists:** SSL certificate error prevented direct access. Web search revealed no drinking water quality datasets published on this portal. The portal focuses on government statistics, not water quality sample data.

**Verdict:** Dead end for tap water data.

### 3. Scottish Water Website

**What exists:**
- **Postcode checker** at `scottishwater.co.uk/your-home/your-water/water-quality/water-quality` — enter a postcode to get your supply zone and water quality results. However, the site returns 403 to automated requests (anti-bot protection).
- **Open Data portal** at `scottishwater.co.uk/Help-and-Resources/Open-Data` — has an API for **overflow data** (CSO spills), but NOT for water quality data. Also 403 to automated access.
- **Water Hardness PDF** — zone-to-parameter data published as PDF (e.g., `WaterHardnessData2021.pdf` with columns: Supply Zone, Calcium, Magnesium, Hardness). This confirms Scottish Water uses supply zones as their geographic unit.
- **Key Publications** page — water quality reports available for download, but behind 403 anti-bot wall.

**Verdict:** The postcode checker is the richest source but is protected against scraping. The published PDFs contain zone-level data similar to Thames Water. A Playwright-based scraper could potentially access the postcode checker, or the PDFs could be parsed.

### 4. SEPA (Scottish Environment Protection Agency)

**What exists:**
- **Open Data Hub** at `opendata-scottishepa.hub.arcgis.com` — ArcGIS-based portal (same technology as Stream Water Data Portal!)
- Environmental water quality monitoring data (rivers, lochs, coastal) — NOT drinking water
- Water Framework Directive classification data

**Verdict:** SEPA covers environmental water (rivers, lochs) not drinking water. Could supplement EA-equivalent readings for Scotland but doesn't solve the tap water gap. Worth noting: since it's ArcGIS, the same `queryStreamService` infrastructure could potentially query it.

## Summary Table

| Source | Data Type | Format | Coverage Level | Scrapeable | Priority |
|--------|-----------|--------|---------------|------------|----------|
| DWQR Annual Report PDF | Tap water compliance | PDF | Zone | Yes (pdfplumber) | **HIGH** |
| Scottish Water Postcode Checker | Tap water quality | Web (403) | Postcode→Zone | Playwright needed | MEDIUM |
| Scottish Water Hardness PDF | Hardness only | PDF | Zone | Yes | LOW |
| SEPA Open Data Hub | Environmental water | ArcGIS | Water body | Yes | LOW (not tap water) |
| data.gov.scot | None relevant | — | — | — | NONE |

## Recommendation

### Best approach: DWQR Annual Report PDF parsing

**Why:** Same approach as Thames Water (already proven). The DWQR publishes annual zone-level water quality data in PDF format. We already have the pdfplumber infrastructure from `scripts/fetch-thames-water.py`.

**Steps:**
1. Download the DWQR Public Supplies Annual Report PDF (3MB, 67 pages)
2. Parse zone-level compliance tables using pdfplumber
3. Map Scottish Water supply zones to Scottish postcode districts
4. Import to `drinking_water_readings` with source `scottish_water_zone`

**Zone-to-postcode mapping challenge:** Scottish Water uses ~280 supply zones. We'd need a mapping from zone names to postcode districts. Options:
- Scottish Water's postcode checker could be used (with Playwright) to build a zone→postcode lookup table once
- Or use postcode geocoding + zone boundary data if available

**Effort estimate:** 2-3 days
- Day 1: Download and parse DWQR PDF, understand table structure
- Day 2: Build zone-to-postcode mapping (Playwright scrape of postcode checker for all Scottish postcodes)
- Day 3: Import script + pipeline integration (follow Thames Water pattern)

### Stretch goal: Scottish Water postcode checker scraper

A Playwright scraper hitting the postcode checker would give the freshest, most granular data. But it's heavier infrastructure (needs a browser runtime) and is more fragile to site changes. Better as a Phase 2 after the PDF approach is proven.
