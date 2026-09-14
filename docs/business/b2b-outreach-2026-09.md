# B2B outreach kit (September 2026)

Everything Claude drafts, Remy sends. Send from remy@tapwater.uk, plain text, no attachments. One email, one follow-up after five working days, then stop.

## Who to target first (Phase 1: three free pilots)

Pick prospects whose product already shows an address and a list of facts about it. They add a line; we do the work.

| Segment | Examples to find on LinkedIn or their site | Why they say yes |
|---|---|---|
| Letting and estate agent software | Reapit, Alto (Zoopla), Street.co.uk, Rex, Dezrez, Agent OS | One field on every listing page, thousands of listings, zero effort |
| Home-buyer report and survey providers | Property Inspect, Home Buyer Reports UK, local RICS surveyors with a template | A "water" section makes their report look more complete than the next firm's |
| Conveyancing search providers | InfoTrack, Groundsure, Landmark, SearchFlow | They already sell environmental searches; water quality is the obvious missing layer |
| Boiler cover and appliance brands | HomeServe, British Gas HomeCare, Quooker, Harvey Water Softeners | Scale risk by address is a pricing and upsell input |
| Filter and softener retailers | Osmio, Aquacure, Kinetico dealers, KindWater | Qualify the lead before the survey |

Start with the first two rows. Ten emails each, two weeks.

## Email 1: property software and portals

Subject: water hardness on every listing (free pilot)

Hi {first name},

Tenants and buyers ask two water questions about every property: is it hard, and is it safe to drink. Your listing pages answer neither, and the water company sites make people type a postcode into a separate tool.

TapWater.uk holds the published test results for {districts} UK postcode districts. We can give you one API call per address that returns hardness, a quality score, anything over the legal limit, PFAS, and live supply incidents, with a link the tenant can check. Example for a Bedfordshire postcode: https://www.tapwater.uk/postcode/LU5

Pilot is free for 90 days, no card, a thousand lookups a month. If it earns its place on the page we talk about a plan; if not, you switch it off.

Would a fifteen-minute call next week make sense, or shall I just send a key?

Remy
TapWater.uk
https://www.tapwater.uk/for-business

## Email 1: home-buyer report and survey providers

Subject: a water section for your home-buyer reports

Hi {first name},

Most home-buyer reports say nothing about the water at the property, and buyers moving from a soft-water area to a hard one find out from their kettle.

TapWater.uk has the water company test results for {districts} postcode districts. One API call gives you hardness, a quality score, any reading over the legal limit, PFAS near the property, and the supplier, each with its sample date and source. It drops into a report template as a half-page section, and every figure links to a public page the buyer can check.

Free 90-day pilot, no card. Happy to mock up the section in your template first so you can see it before anything is wired up.

Worth a look?

Remy
TapWater.uk
https://www.tapwater.uk/for-business

## Follow-up (five working days later)

Subject: re: {original subject}

Hi {first name}, one line in case this got buried. The pilot is free, the key takes a day, and the sample report is here: https://www.tapwater.uk/for-business. If water data is not on the roadmap, a "no" is useful too.

Remy

## Widget outreach: letting agents and mortgage brokers (links, not revenue)

For local agents and brokers with a blog or area guides. The ask is a link, the offer is free content.

Subject: free water quality widget for your {town} area pages

Hi {first name},

If you have area guides for {town} on your site, there is a free widget that shows the water quality score and hardness for any postcode a visitor types in. It is a copy-paste snippet, updates itself, and links to the full report.

Instructions: https://www.tapwater.uk/widget. Nothing to sign up for. Water is one of the questions people moving to {town} ask most, and it is a nice thing to answer on the page instead of sending them to Google.

Remy
TapWater.uk

## Handling the reply

- "Send a key": run `npx tsx scripts/create-api-key.ts "<Company>" <email> pilot 1000` and reply with the key and the two-line curl from the script output.
- "How much after the pilot": Starter £99/month for 5,000 lookups, Growth £249 for 50,000. Enterprise is a conversation. Do not discount in the first reply.
- "Is it accurate": every figure is on a public page; point them at three postcodes they know.
- "Coverage in Scotland": scored reports yes, hardness partial. Say so plainly.
