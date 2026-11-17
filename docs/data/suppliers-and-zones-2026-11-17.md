# Suppliers, Thames zones and unscored districts: 17 November 2026

What started as "match Thames districts to their real supply zones" turned up five separate faults in the data. All are fixed and live. This is the record of what was wrong, what changed, and how to repeat each step.

## 1. The supplier was wrong for one district in five

The supplier came from a hand-written list of council areas (`SUPPLIER_MAP` in `src/lib/suppliers.ts`). Compared with Ofwat's own map it named the wrong company for **476 of 2,260 districts** in England and Wales. The largest groups:

| Site said | Really | Districts | Examples |
|---|---|---|---|
| Thames Water | Affinity Water | 94 | St Albans, Watford, Woking, Luton, Harrow, Uxbridge |
| Southern Water | South East Water | 75 | Eastbourne, Haywards Heath, Tunbridge Wells |
| Severn Trent | South Staffs Water | 45 | West Bromwich, Walsall, Lichfield |
| Thames Water | SES Water | 27 | Sutton, Redhill, Reigate, Leatherhead |
| Anglian Water | Essex & Suffolk Water | 25 | Lowestoft, Great Yarmouth |
| Thames Water | Wessex Water | 18 | Chippenham, Trowbridge, Salisbury |
| Thames Water | Essex & Suffolk Water | 17 | Romford, Ilford, Dagenham |
| Southern Water | Portsmouth Water | 17 | Gosport, Fareham, Chichester |
| Wessex Water | South West Water (Bournemouth) | 17 | Bournemouth, Christchurch |

SES Water, South Staffs Water and Hafren Dyfrdwy were never assigned to any district, so their published results were never loaded.

**Now:** `scripts/build-district-suppliers.py` places the population-weighted centre of each of the 35,672 census small areas (ONS, 2021) on Ofwat's map of water supply areas (Open Government Licence, on the Stream portal), and gives each district to the company with most of its postcodes. Output: `src/data/district-suppliers.json`, read through `getSupplierFor()` and `getDistrictSuppliers()`. The council list is only the fallback for Scotland and Northern Ireland.

- Checked against Thames Water's own postcode lookup: 408 of 417 districts agree, and the other nine are split close to half and half.
- 205 districts (8%) have a second company with 5% or more of the postcodes. Their pages say so: "supplied by Thames Water (about 54% of postcodes; SES Water supplies the rest)".
- Border districts mostly in Scotland (DG16, TD5, TD9, TD12) are left to Scottish Water.

To rebuild (new Ofwat map, new postcodes): the header of the script has the two commands. It needs `pip install shapely`.

## 2. Thames Water: the right zones for each district

Thames publishes one report per supply zone. The old import handed zone reports to districts in rotation, and its list held 165 districts Thames does not supply.

**Now:**

1. `scripts/map-thames-zones.ts` asks Thames's lookup which zone six real postcodes per district are in (one request every four seconds; a faster run got us blocked). Results: `data/thames-district-zones.json`, 465 districts asked.
2. `scripts/fetch-thames-zone-reports.py` holds 256 zone reports (107 were missing; two inset zones, INS01 and INS07, do not exist as reports).
3. `scripts/build-thames-zone-map.ts` writes `src/data/thames-zone-map.json`: 276 districts Thames mainly supplies, with their zones and weights.
4. `scripts/import-thames-water.ts` gives each district the average of its zones, weighted by how many of the sampled postcodes fell in each (`src/lib/thames-blend.ts`). 264 districts with a page were written.

Effect on hardness: 47 districts moved by more than 50 mg/L. Epsom (KT18, KT19) was shown as soft water at 75 to 88 mg/L and is 313 to 318. Sunbury (TW16) was 346 and is 254.

**Short postcodes.** Thames's lookup returns nothing for five-character postcodes (E1 5HR, N1 9GU, W2 1HB). The 24 districts E1 to E9, N1, N4 to N9 and W2 to W9 take the zones of their three nearest neighbours north of the river (no supply zone crosses the Thames), are marked `approx`, say so on their page and are left out of rankings. Thames's website can answer these, but it sits behind a robot check, which we do not work around.

**The monthly job** (`/api/cron/thames-water`) had never completed once. It now downloads one report, compares the year with what we hold, and writes to `scrape_log`; the weekly health report repeats a "new year published" message. The import itself is the yearly routine in the header of `scripts/import-thames-water.ts`.

## 3. One bad sample must not stand for a zone

Zone reports give the lowest, mean and highest sample of the year.

- **Bacteria.** Thames gives no mean for bacteria counts, and the highest sample was used. Scottish Water gives a mean such as 0.01 (one positive sample in 156). Either way the district showed "coliform bacteria detected, fails the standard". That marked **122 of 264 Thames districts** and would have marked 99 Scottish ones. The figure is now the typical sample: the lowest value, unless at least half the samples failed.
- **A lone outlier.** Zone SLE25 had nine lead samples in 2025: one at 562 µg/l, the mean 63.6. Three districts (SE3, SE10, SE13) showed lead at up to six times the limit. Where exactly one sample pushes the mean over a limit, the mean of the other samples is used, which the report's own figures give exactly (1.3 µg/l).

Thames districts flagged went from 127 to 2 (nitrate near the limit in DA9 and DA10, which is real). The rule is `zoneFigure()` in `src/lib/thames-blend.ts`, tested, and shared with the Scottish import.

Worth building later: show "1 of 9 lead samples in your zone was over the limit" on the page. The reports hold the counts; the page model has nowhere to put them yet.

## 4. Misread units

SES Water's dataset had never been loaded. Its unit column says `�g/L Pb` where it means µg/L (a micro sign saved in the wrong encoding). The scorer did not recognise it and took the value as mg/L: iron at 6 µg/l became 6 mg/L, thirty times the limit, and the first eleven SES districts loaded scored about 2 out of 10. Caught the same hour, before those pages were rebuilt.

- The micro sign is repaired on the way in (`normalizeStreamRecord`).
- The scorer now **leaves out** a reading whose unit it cannot convert for a substance with a limit in mg/L. It used to assume mg/L.
- SES's row called plain "Nitrite" is the combined nitrate/nitrite index (it averages 0.567 = 27.5/50 + 0.05/3). It is skipped; "Nitrite - consumers taps" is the real one.
- `scripts/audit-stream-units.ts` scores every company's average result per substance. An average over a legal limit means a misread unit. All 15 datasets pass. **Run it whenever a company is added or changes dataset.**
- Portsmouth Water had renamed its dataset; the old name returned nothing, so no Portsmouth district had results. Fixed, including its "30-Dec-24" dates.
- When a company's own dataset returned nothing for a district, the code went looking for a "newer dataset" among **every** company's datasets on the portal and stored whatever came back under the first company's name. The search is now limited to the company's own dataset names (`discover` in `src/lib/stream-sources.ts`).
- Portsmouth and South Staffs publish back to 2016 (31,000 rows for one district). Only the last three years are kept (`keepMonths`); only the latest sample of each substance is scored anyway.

## 5. Scotland and Northern Ireland had results but no scores

The refresh job (every five minutes, all districts in about four days) fell back on imported readings only for Thames. For Scottish Water and NI Water, which also have no live source, it rewrote each page as "no tap-water results". The table held 21,764 readings for 430 Scottish districts and 70,047 samples for all 80 Northern Irish ones. **522 district pages had no score.**

**Now:** `getImportedReadings()` in `src/lib/db-writer.ts` covers all three companies, and the refresh job uses it. Scottish districts were re-imported from the stored reports with the bacteria rule (`npx tsx scripts/import-scottish-water.ts --stored`), Northern Irish ones rebuilt with `npx tsx scripts/rebuild-page-data.ts ni-water`.

One more of the same kind: 29 South East Water and Wessex Water districts (Wokingham, Bracknell, Maidenhead, Chippenham, Salisbury) kept showing the Thames figures they had been given by mistake after the readings behind them were removed, because neither company publishes samples to replace them. `scripts/refresh-districts.ts` now clears a page whose tap results have nothing stored behind them.

## 6. Hardness

- 261 corrected districts got a hardness reading from their real company's own checker (`scripts/ingest-company-hardness.ts`): Affinity 94, South East Water 81, Essex & Suffolk 45, Wessex 22, Anglian 13, Northumbrian 3, United Utilities 3. Woking reads 271 mg/L (the site said 139), Maidenhead 334, Wokingham 302.
- Southern Water publishes hardness as calcium, not as calcium carbonate, so its 90 districts had no measured hardness. The conversion is exact (× 100.09/40.08) and is now done on every refresh (`src/lib/derived-hardness.ts`): Brighton 276, Worthing 279 to 300, Southampton about 300, Hastings 81.
- Bristol Water has a postcode checker its robots.txt allows; an adapter was added and all 47 of its districts have a reading (Bristol about 205 to 290, Frome 334).
- SES Water has one too (`POST /api/waterqualitysearch/search`, the same system South West Water uses), also allowed. It rate-limits after about seven requests at one a second, so the run uses one request every twenty seconds. Two faults in the ingest script came out of this and are fixed: a district without a reading skipped the pause before the next request, and the script carried on after a company answered "too many requests". It now waits before every request and stops at the first such answer. SES softens its water at the works: its "parts per million" are of calcium (74 beside 13 Clark degrees), which is about 185 mg/L as CaCO3. Sutton and Redhill had been shown at about 256 from their neighbours' figures; the real figure is lower, and the pages now carry it.
- SES Water: 27 of 28 districts stored. Sutton 205, Redhill and Reigate 185, Dorking 195, Oxted and Lingfield 130.
- Districts with a measured hardness: 1,773 before, **2,043** after. Over the 200 ppm line in the building regulations guidance: 759 before, **976** after.

Still without a measured figure:

| Company | Districts | Why |
|---|---|---|
| Severn Trent | 275 (195 with no figure at all: B, CV, DE, DY, LE, ST, TF, WR, WV) | Its checker calls `/bin/waterquality/info.json`, and its robots.txt disallows `/bin`. Its open dataset has no hardness, calcium or magnesium. **Do not automate it.** This is the largest gap: Coventry, Leicester and Derby are hard-water towns |
| Welsh Water | 191 (184 with no figure) | No hardness in its samples. Its "In your area" search runs on a third-party map service (digdat), not looked into. Mostly soft water, so low value for softener requests |
| South Staffs Water | 45 (none) | No hardness in its samples. Its robots.txt disallows nothing, but no postcode checker was found on its water hardness or water quality pages in a short look. Hard water (Walsall, West Bromwich) |
| South West Water | 73 of 131 (TQ, TR, and the Bournemouth districts) | Its checker allows about twenty calls an hour. Not run: `npx tsx scripts/ingest-company-hardness.ts south-west-water --skip-existing --delay 190000` takes about four hours and is worth doing on a quiet day. The Bournemouth districts are not in its checker (Bournemouth Water has its own site). Soft water apart from east Devon |
| Portsmouth Water | 23 (area estimate) | Its website refused us outright with a Cloudflare block page (17 Nov 2026, from a Dutch connection). Not pursued. Very hard water |
| Cambridge Water | 11 (area estimate) | Shares South Staffs Water's site; no postcode checker found in a short look. Very hard water |
| Hafren Dyfrdwy | 13 | Not looked at. Soft |

## 7. Company pages

- The "99.96% compliance" style figure on each company page had **no source**. The Drinking Water Inspectorate publishes no percentage per company. The pages now show its Compliance Risk Index for 2025 (lower is better; middle company 2.9), read from the data behind the chart in *Drinking Water 2025* and checked against the printed 2024 table. Scottish Water shows 99.88% of tap samples meeting the standards in 2025 (DWQR), NI Water 99.87% in 2024 (DWI for Northern Ireland). All read from the regulators' own reports on 17 November.
- "Customers" was the sewerage population for several companies. It is now people supplied with drinking water (Inspectorate's company data, 2024): Thames 10.1m not 15m, Southern 2.7m not 4.7m, Wessex 1.4m not 2.8m. Scottish Water and NI Water show no figure; none was found in a source that could be opened.
- Each company lists every district it mainly supplies (South East Water had one, and it was Southern's).
- SES Water, Hafren Dyfrdwy and NI Water have pages. NI Water's 80 district pages linked to a 404.
- The national figure is 99.97% for England in 2025, not 99.96%.
- A line in the press material said compliance tests are taken at treatment works and not at taps. That was untrue (most samples are taken at taps) and is gone.
- 2,498 district rows carried an invented supply zone name, "<council> Central", shown on the page as "in the Woking Central zone". Removed; only real zone names from Thames and Scottish reports remain.

## 8. What this did to the pages Google sees

- **Gained:** 430 Scottish and 80 Northern Irish districts now have tap-water results, so they leave "noindex" and join the sitemap. So do the SES Water, South Staffs, Hafren Dyfrdwy and Portsmouth districts.
- **Would have been lost:** about 30 districts that carried Thames figures by mistake and belong to South East Water or Wessex Water, which publish no samples: Wokingham (RG40, RG41), Bracknell (RG12, RG42), Maidenhead (SL6), Camberley, Chippenham, Salisbury. Several are in our best softener-lead area. The rule was "no tap results, no index".
- **Rule now** (`isIndexableDistrict` in `src/lib/data.ts`, used by the page and the sitemap): a page is indexed when it has tap results, or when it has the water company's own hardness reading for the district. A page resting on river samples and an estimated hardness stays out (Bristol, for example).
- Pages without tap results say so in their summary: the score comes from rivers and groundwater nearby, the hardness figure is the company's own.
- Counted after the changes: 2,731 of 2,782 district pages are indexable (about 1,940 before), and there are 448 hard-water town pages (336 before), because more districts now have a measured hardness reading.
- The company table ranks a company only on districts with its own tap results. South East Water, Wessex Water and Bristol Water are listed without a score, with the reason.

## Scripts, in the order they are used

```
python3 scripts/build-district-suppliers.py <work folder>   who supplies each district
npx tsx scripts/map-thames-zones.ts                         which Thames zones a district is in
python3 scripts/fetch-thames-zone-reports.py [--refresh]     the zone reports
npx tsx scripts/build-thames-zone-map.ts                    districts → zones and weights
npx tsx scripts/import-thames-water.ts [--dry-run]          into the database
npx tsx scripts/import-scottish-water.ts [--stored]         Scottish zone reports
npx tsx scripts/rebuild-page-data.ts <supplier> [--dry-run] page figures from stored readings
npx tsx scripts/refresh-districts.ts <districts | --changed> real supplier's results for named districts
npx tsx scripts/derive-hardness.ts southern-water           hardness as CaCO3 from stored samples
npx tsx scripts/audit-stream-units.ts                       every company's units, before trusting a new dataset
```

## Weekly health report

`getHealthReport()` read two tables without paging and so counted the first thousand of 2,782 districts. It now reads all of them (2,555 with tap results, 227 on the river layer alone on 17 November), judges each company's freshness on its districts with tap results, and no longer lists South East Water, Wessex Water and Bristol Water every week for having no sample dates. What it reports truthfully and will keep reporting until the companies publish: eight companies' newest samples are from December 2024 (United Utilities, Anglian, Welsh Water, NI Water, South Staffs, Cambridge, SES, Portsmouth). `scripts/check-stream-sources.ts` confirms nothing newer is on the portal.

## Not done

- Central London (EC1 to EC4, WC1, WC2, W1) has no district pages at all: about 90 districts.
- Districts span supply zones and suppliers; a district page shows one set of figures. A postcode-level answer would need the full postcode on the page.
- Scottish zones were matched from one postcode per district. The Thames method (six postcodes, weighted) would be better there too.
