# Bark call prep (September 2026)

Bark UK runs on Awin (advertiser 58889). Our publisher account is CCC Impact BV, **3091503**. Earlier emails from Nadaa were addressed to "Hugo". Say at the start that 3091503 is the account that applied, so the approval lands there.

## What we bring (numbers as of 26 Sept 2026, all real)

- **Site:** tapwater.uk. Independent UK tap water data by postcode: hardness, contaminants and PFAS for 2,800+ postcode districts.
- **Traffic:** about 3,000 Google search clicks a month, all organic. No paid search and no brand bidding. About 1,200 of those land on hard-water pages (hardness checker, hardness map, postcode, city and region pages).
- **Softener quote requests from our own form:** 1 in May, 2 in June, 1 in July, 4 in August and **11 in September**. September rose after we put the form on more pages. 18 requests in total, all with a phone number and consent to be contacted by installers.
- **Lead quality:** the average hardness where these people live is **286 mg/L** (very hard). Most are in London, the Home Counties and the East (SG, TW, E, HA, KT, SL, RG, EN, LU, N, SW, W, TN), with single leads in YO, PE and WA.
- **Realistic volume:** 10 to 20 a month now, and 40 to 60 by spring 2027 as the hardness pages rank. This matches what we told Nadaa. Do not promise more; they will see the real numbers in Awin.

## What we need to learn (ask all of these)

1. **Payout for our category.** How much for "water softener / water treatment system install"? Their public terms say "up to £25 per Bark that gets a response from one or more professionals", with up to £80 in the best categories. Where does water treatment sit?
2. **When a lead counts.** Is it paid when the request is posted, when the phone is verified, or only when a pro responds? If only on response: how many softener installers respond in London and the South East? If nobody responds, we earn nothing.
3. **Coverage.** Are there enough active softener installers in the postcodes above? Also in the Midlands, Yorkshire and East Anglia, where we are adding hardness pages?
4. **Integration (the big one).** Our own form converts well. Can we **post our form's leads to Bark** (lead API, partner form or pre-filled URL) instead of sending people to Bark's multi-step form? If not: can the deep link carry the **postcode and category**, so the visitor skips the first steps?
5. **Email.** Can we send a Bark link by email to people who asked us for quotes, both the 18 waiting now and future ones in their confirmation email? Many Awin programmes restrict email traffic. We need a written yes.
6. **Tracking per page.** Do they report Awin clickref / sub-IDs, so we can see which pages produce paid leads?
7. **Validation and timing.** What gets a lead rejected (duplicate, out of area, fake number)? How long until a lead is approved in Awin? Their public terms say payment around the 10th and 20th after verification.
8. **Volume tiers.** Does the payout go up at 25 or 50 leads a month? What would they need from us to get there?
9. **Exclusivity.** We will not agree to it. We may add a direct installer partner later. Confirm that is fine.
10. **Pro sign-ups.** Bark also pays for new professionals joining. We could link installers to that from our business page. Ask what it pays.

## What they will probably ask

- Traffic source: organic search only. No paid, no brand bidding, no incentives, no cashback.
- Where the link appears: the softener quote block on hard-water postcode, city, region and supplier pages, the hardness checker and map, and 7 softener guides (cost, installation, Harvey vs Kinetico, salt, and others). It is labelled as a partner link with a commission disclosure.
- Volume: see above.

## Decision after the call (Remy + Claude)

The current code **replaces our own form with a Bark button** as soon as `NEXT_PUBLIC_SOFTENER_PARTNER_URL` is set. Given how the form performs, that is probably the wrong default. Options, best first:

1. **Bark accepts posted leads.** Keep our form and post each lead to Bark. Best conversion and we keep the data. Needs their API and consent text naming Bark.
2. **No API, but email is allowed.** Keep our form. The success screen and confirmation email hand the visitor to Bark with a pre-filled deep link. The 18 waiting leads get the same email (`npm run leads:recover -- --send`).
3. **Link only, no email.** Test Bark's button against our form on half the hard-water pages for two weeks, then keep whichever pays more per visitor.

Claude needs from Remy after the call: the payout per lead, yes or no on email, yes or no on a lead API, and the Awin deep link from the Link Builder (destination `https://www.bark.com/en/gb/water-treatment-system-install/`).
