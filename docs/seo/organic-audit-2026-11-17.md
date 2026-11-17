# Organic audit, 17 November 2026

Running record of what was found and what was done. Search Console figures are for 18 October to 14 November 2026 (28 days) unless marked 90 days.

## What Search Console showed

- **53 of the 61 pages that rank in the top 10 with 500+ impressions get under half the clicks that position normally earns.** 24 are city pages, 12 are hardness area pages, 9 are guides.
- **City pages:** London 5,467 impressions at position 9.0 for 21 clicks; Manchester 3,945 at 5.7 for 22; Edinburgh 3,414 at 8.5 for 7; Glasgow 1,050 at 8.6 for 0. Titles ask the question ("Is {City} Tap Water Safe?") without answering it. Edinburgh's description says "What we know so far".
- **Hardness area pages:** /hardness/m 1,309 impressions at 7.3 for 5 clicks; /hardness/l 822 for 1. People search "does Manchester have hard water"; the title leads with "Water Hardness in Manchester (M Postcodes)".
- **The hardness hub is losing to its own children:** /hardness fell from 98 to 43 clicks while area pages rose from 115 to 249. "Water hardness by postcode" slipped from position 9.3 to 14.7.
- **"How to test water quality"** (1,734 impressions, 90 days) shows the homepage at position 1 with no clicks; the real guide sat at 86.8.
- **"How long does tap water last in a bottle"** and similar: 12,515 impressions (90 days) at position 9.1, landing on the bottled-water guide, which has no section on it.
- **Category pages compete with guides:** /filters/* had 6,082 impressions at position 60 for 2 clicks, splitting signals with /guides/best-* on "water test kits", "reverse osmosis systems", "boiling water taps".
- **/compare and /rankings** both rank about 5.4 for "best tap water in the uk".
- **"Frizzlife alternatives":** 984 impressions at 5.1, no clicks; the page is titled "Waterdrop vs Frizzlife".
- **"Home water softener":** 835 impressions at 12.0, no clicks.
- **Indexing:** the main pages are all indexed with our canonical. /hardness/wokingham is "unknown to Google" (expected: published today). /partners is "crawled, currently not indexed", last crawled 29 April.
- **Themes with no page of our own (90 days):** who supplies water in {town} (8,288 impressions), water testing service or lab near me (6,812), chlorine questions (2,148), "is {supplier} water hard or soft" (2,117), tap water in hotels (1,440).

## Done on 17 November

| Change | Status |
|---|---|
| Postcode pages link to their town and area hardness pages (none did) | Live |
| /hardness lists all 336 hard-water towns | Live |
| Wrong-case addresses (/postcode/rg1, /hardness/RG, /city/London) redirect instead of 404 | Live |
| Bare domain tapwater.uk redirects permanently (308) to www; it was temporary (307) | Live |
| Hardness area pages declare a canonical address | Live |
| No-data postcode pages show the district's hardness reading where we hold one (515 districts) | Live |

## Done later on 17 November (all live)

**Data faults found on the way**

| Fault | Scale | Fix |
|---|---|---|
| The combined nitrate/nitrite index (limit 1.0) was scored as nitrite (limit 0.5), so a normal 0.55 showed as "Nitrite is over the limit" | Thames 330 districts, Anglian 138, Yorkshire 50, Southern 21, Affinity 19, Severn Trent 12, Cambridge 9, Portsmouth 5 had index rows over 0.5 | Scoring fixed with a test; page data rebuilt for Thames (420 districts), Anglian (195), Yorkshire (191), Severn Trent (328), Affinity (28), Portsmouth (6) and 7 Southern districts |
| One bacteria detection in a year (for example 1 of 144 samples) headlined as "Coliform Bacteria is over the limit" | 36 of 150 Thames zones, so roughly a quarter of London districts | Headline now reads "{substance} found in a sample" and explains the company must investigate and retest |
| Thames results assigned to districts in rotation | 442 districts | NOT fixed; see `docs/business/thames-data-problem-2026-11-17.md` |

**Click-through changes (Search Console evidence above)**

| Page type | Change |
|---|---|
| City pages (50) | Title answers the question: "Can You Drink Tap Water in Manchester? Yes: 9.4/10 (2026)". "Yes" only where no district has a reading over its limit; London reads "8.7/10, 58 Areas Tested". Cities without scores say "What We Know". New "In hotels, rentals and student halls" section and FAQ |
| Region pages (11) | Same answer-first pattern |
| Hardness area pages (93) | "Is Manchester Water Hard or Soft? Soft, 29 mg/L (M)"; full-sentence description; FAQ uses the searched wording |
| /hardness and the map guide | Link to each other with "water hardness by postcode" and "UK water hardness map" |
| /rankings | Retitled "Which UK City Has the Best Tap Water? Rankings (2026)" so it stops competing with /compare |
| Testing guide | Title and a heading target "how to test water quality"; linked from the homepage |
| Bottled-water guide | New section and FAQ: "How long does tap water last in a bottle?" (24 hours in the fridge, per the Drinking Water Inspectorate) |
| Smart water guide | Title answers the question |
| Filter comparisons | "{Brand} alternatives in the UK" sections; title carries "Alternatives" |
| Softener guide | New section for "home water softener" |
| Category pages | Test kits and reverse osmosis point their canonical at the buying guide. Under-sink, whole-house and shower are left as listings because the under-sink guide ranks well as things are |

**Crawl fixes**: listed in the crawl table above; all live. Verified on production: city, contaminant and supplier pages now carry 700 to 2,700 words in the first response; an unknown supplier address returns 404.

## Left open, with my decision on each

| Item | Decision |
|---|---|
| Thames district matching | Blocked by Thames's firewall after a too-fast run. Re-run `scripts/map-thames-zones.ts` slowly, then switch the import. Highest-value data fix remaining |
| 515 districts with a hardness reading but no test results are hidden from Google | Keep hidden. The page is about 150 words; indexing 515 thin pages three months after a spam update is not worth the risk. Revisit once Scottish and Northern Irish test results are imported |
| Hubs link to many hidden pages (/postcode, map guide, /news) | Leave. They help visitors; the fix is importing data, not removing links |
| Very large pages (/postcode and the map guide at about 1 MB) | Leave for now; response times are 0.4 to 0.6 seconds. Worth trimming if Core Web Vitals show a problem |
| Southern Water: 28 districts would score lower if rebuilt | Not rebuilt. Cause not established; known unit problems in that extract |
| "Who supplies water in {town}" (8,288 impressions, no page) | Do after the supplier data is trustworthy, not before |
| Hosepipe-ban and storm-overflow pages | Build before April; seasonal |
| Links from other sites (domain rating 9) | The biggest remaining lever and not a code change: the press pitches in `docs/seo/press-pitches-2026-09.md` have not been sent |
| /rankings body text still says "51 major UK cities" | Minor; fix with the next edit to that page |

## How to tell whether it worked

Compare with `docs/numbers/baseline-2026-11-17.md` on 1 and 15 December. For this round specifically: click-through on /city pages (1.0% at position 6.7) and /hardness area pages (1.0% at 5.6); clicks to /hardness (43 in 28 days); position of /guides/how-to-test-your-water for "how to test water quality" (87); first impressions on /hardness/{town} pages.
