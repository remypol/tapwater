# Thames Water results are not matched to the right districts

**Fixed on 17 November 2026.** Districts now take the zones Thames's own checker names for them, the 189 districts Thames does not mainly supply were given their real supplier's results, and four more faults found on the way were fixed too. The record is `docs/data/suppliers-and-zones-2026-11-17.md`. What follows is the problem as it was first written up.

Found 17 November 2026 while chasing readings that looked too soft (Epsom 75 to 138 mg/L, Woking 138 to 204). It is not a unit error. Not fixed yet; what was done instead is at the bottom.

## What is wrong

Thames Water publishes test results by supply zone (150 zones, parsed in `data/thames-water/all-zones.json`). To put them on postcode pages, `scripts/import-thames-water.ts` and the monthly job `src/app/api/cron/thames-water/route.ts` do this:

1. `src/lib/thames-zones.ts` holds a hand-written list of districts per region (North London East, Reading and Thames Valley, Guildford and Surrey, and so on).
2. Within each region, zones are handed to districts **in rotation** ("round-robin zone assignment", in the code's own words), largest zone first.

So a district's readings, score and hardness are some zone's from the same region, not necessarily its own. Two consequences:

- **Differences between neighbouring districts are not real.** RG40 at 295 mg/L and RG41 at 235 are two zones that happened to land there.
- **The list includes places Thames Water does not supply.** Thames's own postcode lookup, asked with real postcodes, returned no zone for any of eight postcodes in RG40 (Wokingham) or GU21 (Woking), and placed all eight SW10 postcodes in zone NLW54, a north-west London zone, while our list files SW10 under south-west London.

Scale: 442 districts carry Thames-zone readings (866 hardness rows under sources `thames_water_zone` and `stream_portal`). These are London and the Thames Valley, which is where 20 of the last 21 softener requests came from.

## What is probably still roughly right

Zones within one Thames region are similar in hardness (the Reading region runs about 230 to 300 mg/L), so "hard or very hard" is true for most of these districts. The district-level number, the district-to-district comparison, the pass or fail on individual substances, and the named supplier are the unreliable parts.

## The fix

Thames's lookup answers the question directly: `GET .../water-quality-api/PostCode/{postcode without space}` returns `{"mapCode":"R31","year":2025}` or 404 if Thames does not supply that postcode.

`scripts/map-thames-zones.ts` (new) samples real postcodes per district, asks Thames for each and writes `data/thames-district-zones.json` with every zone named and how often. Then:

1. Change the import and the monthly job to use that file: each district gets its most common zone; a district where Thames names no zone gets no Thames data.
2. For districts Thames does not supply, find the real supplier (Affinity, South East Water, SES Water) and import from them. Adapters exist for Affinity and South East Water hardness; none for SES.
3. Rebuild scores for the affected districts and re-check the town pages.

**Why it is not done:** my first run asked too fast (four at once, 120 ms apart) and Thames's firewall began answering 403 to this machine. The partial results were unreliable and I deleted them. The script now uses one worker, four seconds between calls, and stops on the first 403. The full list takes about three hours. Run it from a normal connection after a day:

```bash
npx tsx scripts/map-thames-zones.ts
```

It resumes where it stopped.

## What was done in the meantime

- Town pages and area pages no longer present Thames-zone figures as a reading for that district. For those towns the page gives one typical figure, does not compare districts, and does not name the supplier.
- The monthly Thames job still uses rotation. It will re-write the same kind of data on the 1st of each month until step 1 is done; it does no new harm, but it does not fix anything either.
- Postcode pages for these 442 districts are unchanged and still show the rotated zone's results as that district's. That is the part most worth fixing.
