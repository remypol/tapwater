# Hardness checker outreach, 26 November 2026

Remy's go-ahead: "Ja, benader ze" (26 Nov), in answer to "Mag ik bedrijven benaderen om onze postcodedata te licentiëren?"

## Why this round is different

The 17 November round offered "data from £199 a month" to six companies and got no reply. The one pilot key (LPRS) was never used. Companies do not buy data; they buy something that sells their product. This round offers a finished thing they can see working: the hardness checker at https://www.tapwater.uk/for-business/checker.

- **Free:** paste two lines of HTML. A "Hardness data: TapWater.uk" line sits under the result, which also earns us a link.
- **Checker, £99 a month:** no TapWater line, plus a monthly report of checks by postcode area. First month free.
- **API, from £199:** for quote tools and CRMs.

Pay-off: 100 Checker customers is £9,900 a month. The free version spreads links to tapwater.uk, which helps search traffic.

## Email: product brands and shops

From hello@tapwater.uk. Plain HTML, no attachments, one follow-up after five working days, then stop.

Subject: A hardness checker for {COMPANY}'s product pages

> Hello,
>
> {OPENING LINE}
>
> I run TapWater.uk, which publishes the water company's hardness reading for over 2,100 UK postcode districts. We have just turned it into a postcode box for product pages. Your customer types their postcode and sees how hard their water is, and when it is hard your product appears, in your words.
>
> You can try it here, set up for a shower filter shop and a boiler installer: https://www.tapwater.uk/for-business/checker
>
> It is two lines of HTML. It is free with a small "Hardness data: TapWater.uk" line, or £99 a month without it, with a monthly report of how many people checked and from where. The first month is free.
>
> If you send me the page you would put it on, I will set it up with your wording and colours, so you can see it before deciding.
>
> Remy
> TapWater.uk
>
> If this is not relevant, reply "no thanks" and I will not write again.

## Handling replies

- **"Set it up":** write their snippet with their wording. For the paid plan, run `npx tsx scripts/create-api-key.ts "<Company>" <email> checker 100000` and put the key in `data-tapwater-key`.
- **The monthly report:** count the `api_usage` rows with path `/api/checker` for their key, by postcode area and by over or under the threshold.
- **"Is it accurate?":** point them at three postcodes they know. Every figure links to a public page.
- **Expected objection:** our figures are per district, not per address. Hardness follows the supply zone, which is larger than a district almost everywhere, and the checker says when a district has no reading of its own.
- **The key is visible in their page source.** It only removes the attribution line, so copying it gains nobody anything worth stopping.

## Sent, 26 November 2026

From "Remy at TapWater.uk" <hello@tapwater.uk>. Every address was checked by hand in the browser on the company's own page. All 15 were accepted by Resend.

| # | Company | Segment | Address (where printed) | Opening line in short |
|---|---|---|---|---|
| 1 | Phox | Filter jugs | service@phoxwater.com (phoxwater.com/pages/support) | Which pack fits their water: Clean or Softener |
| 2 | Scalewatcher | Electronic descalers | sales@scalewatcher.co.uk (homepage) | "Check the map" is a static image |
| 3 | Osmio Water | Softeners, filters | info@osmiowater.co.uk (trade enquiries page) | Hardness page sends people to the water company |
| 4 | BWT UK | Softeners, jugs | enquiries@bwt-uk.co.uk (bwtshop.co.uk/contact) | Hardness page only offers a test kit |
| 5 | Doulton | Ceramic filters | filtersales@doulton.com (FAQ page) | FAQ recommends limescale cartridges where hardness is high |
| 6 | Water2 | Shower heads | hello@water2.com (homepage footer) | "In much of the UK, that means hard water" |
| 7 | PureShowers | Shower filters | info@pureshowers.com (contact page) | "Stop scale and hard water" |
| 8 | Combimate | Scale reducers | sales@combimate.co.uk (homepage) | Sold for hard water areas, no way to check |
| 9 | WarmZilla | Boiler installs | ask@warmzilla.co.uk (contact page) | Limescale guide sends readers to aquacure.co.uk |
| 10 | Heatable | Boiler installs | hello@heatable.co.uk ("Email partnerships", contact page) | Explains scale reducers but not who needs one |
| 11 | Boiler Central | Boiler installs | hello@boilercentral.com (homepage) | Reducer "strongly recommended" in hard water areas |
| 12 | Hometree | Boiler cover and installs | partnerships@hometree.co.uk (commercial partnerships page) | Recommends a scale inhibitor in hard water areas |
| 13 | Sentinel | Follow-up to 17 Nov | customer.services@sentinelprotects.com | |
| 14 | Fernox | Follow-up to 17 Nov | sales@fernox.com | |
| 15 | UK Water Filters | Follow-up to 17 Nov | mail@uk-water-filters.co.uk | |

Not emailed:
- BOXT: customer service address only.
- iHeat: the address appears only in hidden page code.
- BRITA UK: the German parent's address only.
- Bosch Home: contact form only.
- Hello Klean: already runs its own postcode checker, and is our Awin partner. Better approached through Awin about the API.
- Water2Buy: site down. ZeroWater UK: now Culligan. Calmag: Monarch.

**Follow-up:** one short note on 3 December to the twelve new companies that have not answered, then stop. Sentinel, Fernox and UK Water Filters have now had their one follow-up; do not write to them again.
