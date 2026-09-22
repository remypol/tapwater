# Affiliate audit, 22 September 2026

What every product link on the site actually points at, whether a real programme sits behind it, and which programmes are worth joining.

## What the site links to today (38 products in `src/lib/products.ts`)

| Programme | Products | Where the money goes | Status |
|---|---|---|---|
| Amazon Associates, tag `tapwater2107-21` | 29 | Amazon UK | Real programme. 596 of 897 clicks in the last 60 days (66%). Pays ~3% on most of these categories. |
| Awin, advertiser 117649 Waterdrop UK, affiliate id **2996923** | 2 (G3 P600, 10UA) | awin1.com → waterdropfilter.co.uk | Real programme, 7%, 30-day cookie. 149 clicks (17%). **Affiliate id 2996923 is Hugo's Awin account**, not the new account Remy opened in his own name on 14 September. |
| Osmio in-house programme, account id 213 (`aw_affiliate=` token) | 7 | osmiowater.co.uk | Real programme (Osmio's own, not a network): 10%, 30-day cookie, £120 payout threshold, 90-day hold, PayPal. 138 clicks (15%). Whose account 213 is, and whether it has ever paid out, is not visible from the code. |
| Impact.com | 0 | – | No product links to Impact any more. The two "impact" clicks in the log are from old cached pages or email links. The April plan assumed Waterdrop (8%) and Echo Water (20%) on Impact; neither was ever wired in. Nothing to lose here. |
| Frizzlife via Awin (advertiser 117015) | 0 | – | **Approved on Awin but not used.** The Frizzlife PD600 links to Amazon at ~3% instead of Awin at 10–15%. |

No affiliate links exist outside the catalogue (checked every page and component).

## Problems to fix

1. **Wrong Awin account in the links.** Both Waterdrop links carry `awinaffid=2996923`. If the Waterdrop and Frizzlife approvals sit on Remy's new account, every Awin click is being credited to Hugo's account (or to nothing, if that account was closed). Fix: get the affiliate id from the account that holds the approvals, and regenerate the two Waterdrop deep links in Awin's link builder.
2. **Frizzlife approved but unused.** Swap the PD600's Amazon link for an Awin deep link to frizzlife.com (or frizzlife.co.uk if the programme has a UK storefront), and mark `affiliateProgram: "awin"`. Same click, three to five times the commission.
3. **Osmio account unverified.** Log in at osmiowater.co.uk/affiliate, confirm account 213 is ours and check the sales report. If there have been none across 138 clicks in 60 days, either tracking is broken or the links need the current token format.
4. **Jolie links to Amazon.** Jolie Skin Co runs an Awin programme (10% new / 5% existing, 30-day cookie) but it is a **US** programme; Jolie's UK shop is not on it. Keep Amazon UK for Jolie unless Awin shows a UK variant.
5. **Disclosure page** names only Amazon. It should name Awin (Waterdrop, Frizzlife), Osmio and, once live, Bark.

## Programmes worth joining (all found on Awin UK or with a UK payout)

| Programme | Network | Terms found | Why |
|---|---|---|---|
| **Doulton** (water filters) | Awin, advertiser 69790, UK | 30-day cookie; rate not public | Doulton HIP Ultracarb is our third most clicked product (61 clicks/60d) and links to Amazon at 3%. |
| **ZeroWater UK** (Culligan) | Webgains, not Awin | up to 20%, 30-day cookie | Our single most clicked product (167 clicks/60d) at Amazon's 3%. Needs a Webgains publisher account. |
| **Frizzlife** | Awin 117015 | 10%, ladder to 15% | Already approved. Just wire it in (see above). |
| **Bark** (softener installer leads) | Awin | per lead | Applied 14 Sept; Nadaa's questions answered 21 Sept; pending. |
| **Waterdrop** | Awin 117649 | 7% | Already approved; fix the affiliate id. |

Not found on any UK network: BWT UK, Harvey/Culligan, Kinetico, Aqua Optima, Phox, TAPP Water, AquaBliss, Philips. For those Amazon stays the route; for Harvey and Kinetico the route is Bark, then a direct installer deal.

## Order of work

1. Remy: confirm which Awin account (id) holds the Waterdrop and Frizzlife approvals; send the id and two fresh Waterdrop deep links plus one Frizzlife deep link.
2. Claude: update the three product links, set Frizzlife to `awin`, update the disclosure page, redeploy.
3. Remy: log into Osmio's affiliate dashboard; report sales since July. Apply to Doulton on Awin. Open a Webgains publisher account and apply to ZeroWater UK.
4. Claude: once Doulton and ZeroWater are approved, swap those two links and move them up the rails (they become fixed-bounty-class earners next to Osmio).

## Correction, 22 September evening

The Waterdrop, Frizzlife and Doulton approvals are on Remy's **new** Awin account, **CCC Impact BV, publisher id 3091503**, where all three show on the Joined tab. Until tonight every Awin link on the site carried **2996923**, which is not that account, and Waterdrop is not joined on Hugo's account either.

Why nobody noticed: Awin redirects any live publisher id to the merchant with a fresh `awc`, joined or not. The July check ("302 with sv_campaign_id=2996923") proved the id exists, not that it earns. Since 28 July about 153 Waterdrop clicks (G3P600 82, 10UA 71) went out on 2996923. If that account never joined Waterdrop, they earned nothing we can collect.

Fixed: Waterdrop 10UA, Waterdrop G3P600 and Frizzlife PD600 now use `awinaffid=3091503`. The guard test accepts only 3091503, so a link on any other publisher id fails the build. waterdropfilter.co.uk and frizzlife.co.uk both run Awin's Shopify tracking, and all three products are in stock (22 Sept).

Doulton (69790) is joined too, but doulton.com does not sell the HIP Ultracarb we recommend, only the HIS/HIP systems with Biotect Ultra and loose Ultracarb cartridges. That product stays on Amazon until we decide whether to recommend one of Doulton's own systems instead.
