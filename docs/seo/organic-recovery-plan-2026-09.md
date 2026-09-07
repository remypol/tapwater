# Organic recovery plan — September 2026

## What happened (evidence)

| Signal | July peak | Now (Aug 7 – Sep 6) |
|---|---|---|
| GSC clicks / week | ~990 (w/c 6 Jul) | ~600 |
| Avg position | 9.7 | 13.8 |
| Keywords in top 3 (Ahrefs) | 39 (w/c 27 Jul) | 21 |
| Homepage position | 12–13 | 28–29 |
| /compare position | 3.4–5 | 13.5 |

Timeline:
- **19–28 Jul**: ~90 spam domains (`*.shop` "rank / SEO / backlink" PBN sellers) start linking, 2 links each,
  66 dofollow links with anchors like "Buy Backlinks Online Cheap … PBN Network". Homepage position falls from 12 to 17 that week.
- **Jul 15–30**: first-sales-loop redesign (377 files), product rails on informational pages, Skimlinks added (23 Jul) then removed (30 Jul).
- **18–21 Aug: Google spam update** (confirmed). Homepage 20 → 29, /compare 9 → 12 that week. At that moment the site carried
  338 thin AI-written news articles (235 with "details are limited" filler), ~750 postcode pages scored on river samples only,
  and a link profile that is ~95% SEO spam (only 5 referring domains with any organic traffic).
- Seasonality also matters: "water … in my area" and Water UK hosepipe-ban queries spike in a hot July.

Conclusion: not one cause. A spam update hit a site whose visible signals (scaled thin pages + toxic link profile + DR 9) looked like
scaled-content abuse, on top of a July seasonal peak that was never going to hold.

## Already shipped (7 Sep)
- Thin news articles noindexed unless fresh + substantive; sitemap 338 → 7; daily re-minting bug fixed.
- ea-only postcode pages (~27% of districts) noindexed and out of the sitemap.
- Article schema now carries image + publisher logo (2,430 pages had a rich-result validation error).
- Disavow file: `docs/seo/disavow-2026-09-07.txt` (255 domains). **Upload in Search Console → Disavow links.**

## Plan

### 1. Clean the signals (weeks 1–2)
- Upload the disavow file. Re-export from Ahrefs monthly and append.
- Cut the 45 over-long titles / 23 over-long descriptions (Ahrefs audit).
- Consolidate the GEO "citation" boilerplate: one sentence per page type, unique numbers, no repeated template prose.
- Keep product rails below the unique data on informational pages (home, compare, city). Never above the answer.

### 2. Earn real links (ongoing, the only lever that moves DR 9 → 25+)
- Three data stories from `/press` re-cut for journalists: "hardest water postcodes", "worst water 2026", "PFAS detections by city".
  Pitch to regional titles (Manchester Evening News, Yorkshire Post, Kent Online…) with a city-specific number each.
- Embed widget outreach to letting agents / mortgage brokers / parenting sites: "check the water at your new address".
- Product brands we review (Osmio, Waterdrop, Jolie) link to reviewers: ask.
- Reddit / Mumsnet / MoneySavingExpert forum answers with the postcode checker (no spam, real answers).

### 3. Win the pages that already have impressions (weeks 2–6)
- Shower filter: 10k impressions/month, position 14. Add tested-against-hardness angle per product, refresh yearly.
- Jug guide: 3.3k impressions, position 22. Add "for hard water" section, running-cost table.
- Testing kit guide: 2.6k impressions, position 18.
- Whole-house: rewritten 7 Sep; watch position weekly.
- Homepage: lost "water quality in my area" (pos 7 → 11 → gone). Add a short, unique "what the checker shows" block above the fold
  with three real numbers that update from the data, and make the H1 answer that query.
- /compare: position 4 → 13. Restore the editorial best/worst narrative above the fold; the rail I added stays at the bottom.

### 4. Programmatic layer (months 2–3)
- Postcode pages only index when they carry drinking-water tests (done) **and** a unique paragraph per district.
- City pages: unique hardness + supplier + incident data already there; add the "what people in {city} buy" from the click log.

### 5. Measure
- Weekly: GSC clicks/position for home, compare, hardness, shower, jug, whole-house, softener hub.
- Ahrefs referring domains: real vs spam.
- Recovery target: back to ~900 clicks/week by mid-November, 1,500/week by February with the softener cluster ranking.
