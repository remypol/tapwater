# Press pitches — September 2026

Purpose: earn real links (DR 9 → 25+). Three data stories, each pitched with a local number.
Data: `/api/press/data/<slug>` CSVs (live, regenerated daily). Always attach the CSV and link the ranking page.
Caveat to include in every pitch: figures are the latest published test results per postcode district
(water company data via Stream + Environment Agency); a single high reading is not proof of ongoing contamination,
and lead almost always comes from a property's own pipes, not the mains.

## Story 1 — "Britain's hardest water: the postcodes where kettles fur up fastest"
Data: `hardest-water` CSV. Top 7 today: HU16 (373 mg/L), HU5 (367), HU10 (366), HU3 (365), HU4 (360), HU6 (357), DA7 Bexley (355).
Angle: Hull and East Yorkshire top the table; "very hard" starts at 250. Cost angle: limescale on heating elements, boiler efficiency,
what a softener costs vs saves (link /guides/water-softener-cost-uk). Local hook per title: "X of the 10 hardest-water postcodes in Britain are in Hull".
Targets: Hull Daily Mail / Hull Live, Yorkshire Post, Kent Online (Bexley/DA7), BBC Look North (regional), Ideal Home, Good Housekeeping (consumer).
Pages to link: /rankings/hardest-water, /hardness, /guides/water-hardness-map.

## Story 2 — "Lead at 6× the legal limit: the London postcodes with the highest lead readings"
Data: `worst-lead` CSV. DA5 Bexley and SE10 Greenwich 0.0636 mg/L vs 0.010 limit (6.4×); SO17/SO18 Southampton 2.45×; KT9, SW18, SW1V just over.
Angle: lead is a pipes problem in pre-1970 homes; water companies replace their side free; how to check your postcode and what a filter certified to NSF/ANSI 53 does.
Caveat prominently: these are the highest single published readings, not averages; households should test rather than panic.
Targets: Evening Standard, MyLondon, Southern Daily Echo (Southampton), News Shopper (Bexley/Greenwich), Which?, The Guardian environment desk.
Pages to link: /rankings/worst-lead, /contaminant/lead, /guides/lead-pipes-uk.

## Story 3 — "The best tap water in Britain is in Wrexham and Northumberland"
Data: `best-worst-overall` CSV. Best: LL14 Wrexham 9.8, NE41/NE47/NE48 Northumberland 9.8, TN26 Ashford 9.8, TS9 North Yorkshire 9.8, B40 Solihull 9.7.
Angle: positive local pride story; pairs with the worst list for contrast. Method: score = tests vs legal limits, drinking-water data weighted 80%.
Targets: Wrexham Leader, Northumberland Gazette, Chronicle Live, Kent Online (Ashford), Birmingham Mail (Solihull), Metro "best/worst" lists.
Pages to link: /compare, /rankings/best-water, /about/methodology.

## Story 4 — "Forever chemicals found at 12,000 monitoring points: the cities with the most PFAS in their rivers" (READY, 14 Sept)
Data: `most-pfas` CSV, now live: 12,101 Environment Agency detections at 530 river and groundwater sites in 43 of 50 cities.
Top by detections: London (2,108 detections, 26 compounds), Oxford (948), Warrington (774), Reading (704), Ipswich (487), Lincoln (411), Nottingham (379).
Highest single reading: Warrington 0.25 µg/L, two and a half times the 0.1 µg/L guideline the Drinking Water Inspectorate uses for one PFAS compound in tap water.
Angle: these are environmental samples, not tap water, and say so in the first paragraph. The story is "what is in the rivers that supply us, and why nobody publishes tap-water PFAS by area": link our EIR refusal from the DWI (/pfas/data-request). Local hook: "{city}'s rivers show {N} PFAS detections, {compounds} different compounds".
Targets: Warrington Guardian, Oxford Mail, Reading Chronicle, Ipswich Star, Lincolnshire Live, Nottingham Post, MyLondon; nationals: Guardian environment, i news, ENDS Report, New Scientist (data desk).
Pages to link: /pfas, /pfas/{city}, /pfas/data-request, /guides/pfas-uk-explained.

## Asset for every pitch (new 14 Sept): the hardness map
/guides/water-hardness-map now carries a real map: 983 postcode districts as dots coloured by measured hardness over a coastline, plus the ten hardest and softest postcode areas. Offer it as an embeddable graphic (screenshot with credit, or the /widget). Journalists take a map when they will not take a table.
Hardest areas by median: Hull 302, Salisbury 302, Enfield 302, Hemel Hempstead 299, Reading 295. Softest: Belfast 42, Halifax 44, Huddersfield 50, Harrogate 61, Bradford 73.

## Email template (regional desk)
Subject: {City} has {N} of the UK's {10} hardest-water postcodes — new analysis of official test data

Hi {name},
We analysed the latest published tap-water test results for every UK postcode district (water company data plus Environment Agency monitoring)
and {city} stands out: {one-sentence local number}. Full ranking, method and the CSV are here: {link}.
Happy to pull the numbers for any postcode you want to check, or to give a quote on what residents can do about it.
{Your name}, TapWater.uk Research (CCC Impact BV) — press@tapwater.uk

## Follow-through
- One pitch batch per story, 8–12 journalists each, Tuesday–Thursday mornings.
- Offer the embed widget (/press → "Embed & cite") to every outlet that replies.
- Log every placement in Ahrefs; re-check referring domains monthly and append spam to the disavow file.
