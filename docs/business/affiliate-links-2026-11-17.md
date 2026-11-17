# Affiliate links, checked against Awin's API: 17 November 2026

## What was wrong

We own two Awin publisher accounts. Awin's API, read with a token created on 17 November, says:

| Account | Name | Programmes joined |
|---|---|---|
| 2996923 | CCC Impact B.V. | Waterdropfilter UK (117649), FRIZZLIFE INC (117015), Doulton (69790) |
| 3091503 | CCC Impact BV | None |

On 22 September every Awin link on the site was moved from 2996923 to 3091503 (commit d5ef143), on a reading of the dashboard's Joined tab. That was the wrong way round. Awin redirects visitors for any live account id, so the links kept working, and Awin recorded nothing.

Awin's own report for Waterdrop, by period:

| Period | Account in the links | Clicks Awin recorded | Sales | Commission |
|---|---|---|---|---|
| 20 Jul to 19 Aug | 2996923 | 59 | 0 | £0 |
| 20 Aug to 21 Sep | 2996923 | 84 | 2 | £8.34 |
| 22 Sep to 21 Oct | 3091503 | 7 (on 2996923, from pages not yet refreshed) | 0 | £0 |
| 22 Oct to 17 Nov | 3091503 | 0 | 0 | £0 |

Our own click log counted 763 Awin clicks in the last 120 days, 171 of them in the last 14. The log counts every click, bots included, so it always runs above Awin's count; the point is that Awin's count went to zero.

What this cost is not knowable exactly. Awin lists Waterdrop's average earnings per click across all its publishers as £0.44. At that rate about 600 clicks would have been worth roughly £260; at our own earlier rate (£8.34 from 143 clicks) about £35.

## What was changed

- Every Awin link carries 2996923 again (commit d5a57af). Checked on the live site: the link lands on waterdropfilter.co.uk with our account id attached.
- `npx tsx scripts/awin.ts check` no longer trusts a number written in the code. It asks Awin which of our accounts has joined each programme, and compares our click log with Awin's click count for the last 14 days. It fails if a link carries an account that has not joined, or if we log 20 or more clicks and Awin records none.
- The test that guards the links now accepts only 2996923.

## Product links, weighted by clicks

All 38 product links were opened and compared with what we say about the product. Clicks are the last 90 days (2,068 in total).

| Product | Clicks | Problem | Fix |
|---|---|---|---|
| ZeroWater jug | 330 | Amazon listing unavailable | Now ZeroWater's main UK listing, B0073PZ6O0, the 10-cup 2.4 litre jug. Guides say 10-Cup |
| Doulton under sink | 171 | Amazon listing unavailable; Doulton no longer sells the HIP Ultracarb kit | Now Doulton's own shop through Awin at 5%: the HIS Push-fit with Biotect Ultra, £284.95, cartridge £29.45 every six months. Guide text rewritten from doulton.com |
| BRITA Marella XL | 86 | Link went to the 2.4 litre Marella, not the 3.5 litre XL | Now B0BSXFVB6M, the XL |
| AquaBliss SF220 | 30 | Listing redirected to the SF100 | Now B01G7AZB96, the SF220 |

Left as they are:

- **Waterdrop G3P600 (239 clicks):** on sale at £360.99; we show the list price, £550. The sale price will move again.
- **Jolie showerhead (76) and PUR Plus jug (7):** our prices (£85, £35) look too low. Amazon showed euro prices with import charges to a Dutch address, so the UK price could not be read.
- **Hydrosalt 25kg (3):** unavailable on Amazon.
- **BRITA:** Amazon's listing now says MAXTRA PRO reduces PFAS. Our guide says BRITA does not claim that. Needs checking against BRITA's own data sheet before the guide changes.
- Seven Amazon products could not be checked for stock from a Dutch address (TAPP EcoPro, BWT E1, the softener salts, Eddy descaler).

## Applications sent, 17 November 2026

Remy approved applying. All ten were submitted on account 2996923 with the website https://www.tapwater.uk as the promotion type and a short description of the site. Awin's API lists every one as pending:

| Programme | Awin id | Why |
|---|---|---|
| Our Taap UK | 122454 | Pays £60 per 24-month plan, £30 per 12-month plan, £10 per rolling plan, 3% on direct purchases; 30-day cookie. The block on postcode pages is built and switched off until we are accepted: set `NEXT_PUBLIC_OUR_TAAP_JOINED=1` in Vercel |
| Helloklean | 92037 | UK shower filter brand, registered as a US programme. The message asks them to confirm UK orders are tracked |
| Jolie Skin Co | 96543 | Our top shower pick, now a 3% Amazon link. Also US-registered; same question asked |
| Fahren Hot Taps | 34865 | Boiling water taps; the three boiling tap guides link to Quooker, Qettle and Fohen for nothing |
| Pure Clear Filters | 86411 | Filter bottles and jugs |
| Tefal | 82985 | Kettle already in the hard-water kettle guide on a 3% Amazon link |
| Morphy Richards UK | 115194 | Same |
| Robert Dyas | 1528 | Sells BRITA jugs, kettles and softener salt |
| Plumbworld | 17287 | Taps and shower fittings |
| Wickes | 1563 | Softeners, salt, taps |

None of the ten publishes programme-specific terms on its Terms tab, so Awin's standard publisher terms apply. Awin shows a notice that its publisher terms change on 24 November 2026 and that continuing to use the account accepts them.

Already pending before today, not sent by this session: Bark UK (58889) and ration1.de DE (23193). The second looks unrelated to this site.

Not on Awin at all: ZeroWater, BRITA UK, TAPP Water, BWT. ZeroWater UK was on Webgains in September.

When one is approved it shows under `npx tsx scripts/awin.ts programmes joined`. Build its links with `npx tsx scripts/awin.ts link <id> <url>` and run `check`.

## Every link with its traffic

`npx tsx scripts/link-report.ts` writes `docs/business/link-report-<date>.md`: every product link with its clicks, the pages they come from, the programme, the rate and the estimated commission per sale; every page with its search visits and shop clicks; and shop links written into pages that pay nothing. First run: `link-report-2026-11-17.md`.

What it showed, 90 days:

- 2,068 shop clicks: Amazon 1,063, Awin 711, Osmio 294. Awin recorded 96 of its 711 because of the account mix-up above.
- Postcode pages send 898 clicks from 2,319 search visits. The under-sink guide sends 214 from 411.
- Swapping a cheap product to a better programme is worth almost nothing: a jug or shower filter pays £1 to £2 a sale whoever pays it. Waterdrop's own jug (£15.59, 7%) and Doulton's shower filter (£24.95, 5%) were checked and left out for that reason.
- What matters is which products sit in the busy slots. The three-product rail on the home page, city pages and two guides (about 5,300 search visits a quarter) said "what readers click most" and showed a shower filter and a countertop unit. It now shows the three that are clicked most: ZeroWater jug, Waterdrop 10UA and Waterdrop G3P600, the last two on Awin at 7%.
- The lead pipes and microplastics guides (176 search visits) explained which filters work and named none. Each now names two.
- Osmio took 294 clicks a quarter and its dashboard showed no orders in September. Remy confirmed on 17 November that it still shows none; see the next section.
- Boiling tap guides link to Quooker, Qettle and Fohen 21 times for nothing; Fahren and Our Taap are the applications that would change that.
- Pages with search visits and no shop link at all: /rankings (451), tap water vs bottled (104), rainwater (106), smart water (82).

## Osmio's slots moved, 17 November 2026

Osmio's own programme promises £5 to £75 a sale and has never recorded one: 173 visits and no orders by September, still none on 17 November after 294 more clicks in our log. What changed:

- **New product:** Waterdrop K19-HG, a worktop reverse osmosis unit that plugs into a socket, on Awin at 7%. Read on waterdropfilter.co.uk: £239 on offer (£309 list, which is what we show), NSF/ANSI 58 and 372, 5 litre tank, hot water to 95°C, one filter a year at £89. It is not listed for PFAS there, and the guides say so. The plain K19-H is discontinued.
- **Reverse osmosis guide:** the K19-HG is the no-plumbing pick and comes first; the Osmio Zero stays as "also plugs in", after the Waterdrop G3P600 and the Frizzlife.
- **Main filter guide and the hardness pages:** the no-plumbing slot is the K19-HG.
- **Postcode pages:** a moderately hard district with nothing flagged used to show three Osmio units (117 clicks in 90 days). It now shows the general picks: ZeroWater jug, Waterdrop 10UA, BRITA.
- **Ranking:** Osmio products no longer get the lift a paying programme earns (`hasRecordedNoSales` in `src/lib/products.ts`). They stay listed and rank on rating alone. Remove that rule the day Osmio's dashboard shows an order.

The Osmio PRO-III whole house filter keeps its place in the whole house guide: nothing on a tracked programme replaces it.

## Using the tool

```
npx tsx scripts/awin.ts check              every Awin link against Awin's own records
npx tsx scripts/awin.ts report 30          clicks, sales and commission per advertiser
npx tsx scripts/awin.ts earnings 90        transactions against our click log
npx tsx scripts/awin.ts programmes joined  also pending, rejected, notjoined
npx tsx scripts/awin.ts link 69790 <url>   a tracking link from Awin's link builder
```

The token is `AWIN_API_TOKEN` in `.env.local`. `AWIN_PUBLISHER_ID=3091503` in front of a command reads the other account.

Doulton's site refuses repeated automated requests (HTTP 429). Read it in a browser, with `?country=GB` on the address to get UK prices.
