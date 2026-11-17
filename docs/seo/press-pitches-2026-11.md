# Press pitches, re-checked 17 November 2026

Replaces `press-pitches-2026-09.md`. The four September stories were checked against today's data before anything is sent. One is safe. Three are not, and the reasons are below.

## Verdict on each September story

| Story | Verdict | Why |
|---|---|---|
| 4. PFAS in rivers near UK cities | **Send**, with corrected figures | Environment Agency data, untouched by the Thames problem. The September draft named the wrong "highest reading": it only looked at the ten cities with the most detections |
| 1. Britain's hardest water (Hull) | **Do not send yet** | The table has changed completely since September: Hull is no longer in the top ten, which is now West Suffolk (CB9, 499 mg/L) and County Durham (480). A competitor citing 2025 zone data gives the Peterlee zone 391 mg/L, not our 480, so the new top entries need checking against each company's own figures first |
| 2. Lead at 6 times the limit in London | **Do not send** | DA5 and SE10 share the top place with the identical reading, 0.0636 mg/L. That is one Thames zone's figure handed to two districts in rotation; we cannot say which district it belongs to. These districts are now removed from the public rankings |
| 3. Best tap water (Wrexham, Northumberland) | **Hold** | The top places changed after today's scoring fix (now Northumberland, Bradford, Cumberland). The claim is sound in kind, but London and the Thames Valley are excluded from district rankings for now, and "best in Britain" with that gap needs saying out loud. Revisit after the Thames re-matching |

## Story 4, ready: forever chemicals in the rivers and groundwater near UK cities

All figures from the Environment Agency Water Quality Archive, as stored on 17 November 2026.

- 12,844 PFAS detections at 534 river and groundwater sampling points, near 43 of the 50 largest UK cities, between January 2023 and October 2026. 44 different compounds.
- 32 readings were above 0.1 µg/L. The Drinking Water Inspectorate's guideline value for tap water is 0.1 µg/L for the sum of 48 named PFAS (checked on dwi.gov.uk, 17 November 2026), so a single compound above 0.1 is above it too. These are environmental samples, not tap water, so the comparison is context, not a breach.
- Readings above 0.1 µg/L were found near Liverpool, Sheffield, Derby, Blackburn, Warrington, Swindon, Huddersfield and Hull.

| City | Detections | Sites | Compounds | Highest reading |
|---|---|---|---|---|
| London | 2,150 | 23 | 26 | 0.099 µg/L (6:2 FtSAB, 6 Jan 2026) |
| Oxford | 1,054 | 25 | 20 | 0.069 µg/L (PFBS, 22 Sep 2023) |
| Warrington | 842 | 20 | 26 | 0.25 µg/L (PFBS, 18 Sep 2024) |
| Reading | 709 | 20 | 19 | 0.067 µg/L (6:2 FtSAB, 7 Jan 2026) |
| Ipswich | 509 | 12 | 23 | 0.046 µg/L (PFOA, 9 Jan 2024) |
| Lincoln | 483 | 22 | 19 | 0.087 µg/L (6:2 FtSAB, 1 Jul 2026) |
| Nottingham | 412 | 20 | 20 | 0.047 µg/L (6:2 FTSA, 16 Jul 2024) |
| Bournemouth | 400 | 7 | 17 | 0.016 µg/L (N-MeFOSA, 22 Oct 2024) |
| Norwich | 392 | 11 | 19 | 0.025 µg/L (PFOS, 18 Jul 2025) |
| York | 346 | 19 | 20 | 0.055 µg/L (6:2 FTSA, 3 Dec 2024) |
| Liverpool | 135 | 16 | 18 | 0.96 µg/L (PFBA, 5 Jun 2024) |
| Sheffield | 129 | 7 | 18 | 0.38 µg/L (PFOS, 19 Mar 2026) |
| Derby | 275 | 30 | 17 | 0.35 µg/L (6:2 FTSA, 28 Jul 2025) |
| Blackburn | 214 | 18 | 16 | 0.28 µg/L (PFOA, 5 Dec 2024) |
| Swindon | 237 | 17 | 21 | 0.25 µg/L (PFOS, 19 Jun 2023) |

"Near a city" means the sampling point falls within the area we assign to that city's page, not inside a boundary. Say "near", not "in".

### What must be in every version

1. First paragraph: these are river and groundwater samples, not tap water.
2. One reading is one sample on one day. It is not an average and not proof of ongoing contamination.
3. Tap-water PFAS results are not published by area. That is the real story: link `/pfas/data-request`.
4. The data download and the page: `https://www.tapwater.uk/api/press/data/most-pfas` and `https://www.tapwater.uk/pfas/{city}`. The download lists the ten cities with the most detections; Liverpool, Sheffield, Derby, Blackburn and Swindon are in the table above but not in that file, so quote them from here and offer the full file on request.

### Email, regional desk

Subject: {N} "forever chemical" detections in rivers and groundwater near {City}: Environment Agency data

> Hello,
>
> The Environment Agency has recorded {N} detections of PFAS, the so-called forever chemicals, at {S} river and groundwater sampling points near {City} since January 2023. {C} different compounds turned up. The highest single reading was {MAX} µg/L of {COMPOUND} on {DATE}.
>
> These are samples from rivers and groundwater, not from taps. The regulator's guideline for PFAS in tap water is 0.1 µg/L; {ABOVE: "that reading is above it" / "none of the readings near {City} is above it"}. One sample on one day is not proof of ongoing contamination.
>
> The reason this is worth a story: nobody publishes PFAS results for tap water by area. Water companies have had to monitor a wider range of PFAS since March 2025, but the results are not available by postcode, and our request for them under the Environmental Information Regulations was refused. The correspondence is here: https://www.tapwater.uk/pfas/data-request
>
> The figures for {City}, with every sampling point: https://www.tapwater.uk/pfas/{city-slug}
> The national table as a file: https://www.tapwater.uk/api/press/data/most-pfas
>
> I can pull the numbers for any other town in your patch, or send the full file with every reading.
>
> Remy
> TapWater.uk, press@tapwater.uk

### Email, national or specialist desk

Subject: 12,844 PFAS detections near UK cities, and no public data on what is in the tap

> Hello,
>
> We have put the Environment Agency's PFAS monitoring into one place. Since January 2023 it has recorded 12,844 detections of forever chemicals at 534 river and groundwater sampling points near 43 of the UK's 50 largest cities, covering 44 compounds. 32 readings were above 0.1 µg/L, the Drinking Water Inspectorate's guideline value for tap water. The highest was 0.96 µg/L of PFBA near Liverpool in June 2024.
>
> These are environmental samples, not tap water, and we say so on every page. The gap is the story: water companies have had to monitor a wider range of PFAS since March 2025, but tap-water results are not published by area, and our request for them under the Environmental Information Regulations was refused: https://www.tapwater.uk/pfas/data-request
>
> City by city: https://www.tapwater.uk/pfas
> The table as a file: https://www.tapwater.uk/api/press/data/most-pfas
>
> Happy to send every reading, with sampling point and date, or to check a specific place.
>
> Remy
> TapWater.uk, press@tapwater.uk

## Not done yet

- **No recipient list exists.** The September file names outlets, not people or addresses. Each outlet's published news-desk address has to be looked up; none has been guessed.
- **Regulatory claims checked against dwi.gov.uk on 17 November 2026:** no statutory PFAS standard in England and Wales; guideline 0.1 µg/L for the sum of 48 named PFAS; updated guidance in March 2025 requires monitoring for a wider range. Our request for area results was refused on cost grounds in July 2026 (ref EIR2026/16348).
- Nothing has been sent.
