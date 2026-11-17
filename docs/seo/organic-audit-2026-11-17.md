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

## In progress

The ten page changes from the analysis, the technical crawl, and whatever the crawl turns up. See the end of this file once complete.

## What the technical crawl showed (388 pages fetched, 600 internal links checked)

| Finding | Scale | Action |
|---|---|---|
| City, contaminant and supplier pages sent a loading placeholder as the main content; the real text arrived hidden and was swapped in by script | 88 pages | The three `loading.tsx` files are removed, so the full page is in the first response |
| Unknown supplier addresses returned 200 (a "soft 404"), and /rankings links to /supplier/unknown | 1 template | Expected to become a real 404 now the placeholder is gone; the /rankings link is being fixed |
| City comparison pages involving Glasgow or Edinburgh had nothing to compare (79 words) | 4 pages | Marked noindex and taken out of the sitemap until Scottish scores exist |
| Sitemap listed filter comparisons in both orders although the reverse points its canonical at the other | 4 URLs | Sitemap lists the canonical order only |
| /news had no canonical | 1 page | Added |
| Hardness area and town pages had no share image | 429 pages | Being added |
| Ranking sub-page titles were as short as "Hardest Water (2026)" | 6 pages | Now use the full descriptive title |
| Hubs link heavily to pages hidden from search (233 of 351 checked postcode links; old news) | /postcode, the map guide, /news | Not changed; see "Left for a decision" |
| Very large pages: /postcode and the map guide about 1 MB of HTML, home and /news about 0.5 MB | 4 pages | Not changed yet |
| Nine guide titles over 65 characters | 9 pages | Left alone where the page ranks well (under-sink guide) |

Checked and fine: every sampled sitemap URL returns 200 with no redirect; all 600 internal links return 200; exactly one h1 per page; structured data present and valid on every page; robots.txt blocks nothing in the sitemap; no image lacks alt text.
