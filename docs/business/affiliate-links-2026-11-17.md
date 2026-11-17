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

## Programmes on Awin we have not joined

Awin lists 21,593 programmes we have not joined, 3,431 of them UK. The ones that sell what the site already recommends:

| Programme | Awin id | Why |
|---|---|---|
| Our Taap UK | 122454 | The block is built and switched off until we are accepted. £60 per 24-month plan per the competitor analysis |
| Helloklean | 92037 | UK shower filter brand; the shower guide has no direct-paying pick |
| Jolie Skin Co | 96543 | Our top shower pick, now a 3% Amazon link. Registered as a US programme; check it pays on UK orders |
| Fahren Hot Taps | 34865 | Boiling water taps; the boiling tap guide has no direct partner |
| Pure Clear Filters | 86411 | Filter bottles and jugs |
| Tefal, Morphy Richards UK | 82985, 115194 | Kettles in the hard-water kettle guide, now 3% Amazon links |
| Robert Dyas, Plumbworld, Wickes | 1528, 17287, 1563 | Sell BRITA, softener salt and plumbing parts; a fallback when Amazon is out of stock |

Not on Awin at all: ZeroWater, BRITA UK, TAPP Water, BWT. ZeroWater UK was on Webgains in September.

Commission rates for programmes we have not joined are not available through the API. Joining has to be done on Awin's site, on account 2996923, and each application is Remy's decision.

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
