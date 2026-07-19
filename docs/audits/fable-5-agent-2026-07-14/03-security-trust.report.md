I have everything I need. Confirmed: the guide's disclosure (lines 324-339) sits directly above its new affiliate cards, but the postcode page has no equivalent. Here is my review.

---

# Fable Review Agent 3 — Security, Privacy, Trust & Affiliate/Compliance

**VERDICT: FIX** (no hard security regression; two trust/compliance issues plus one robustness landmine should be resolved before the sales loop ships)

Scope reviewed: full uncommitted diff vs HEAD (`affiliate.ts`, `affiliate-link.tsx`, `conversion-tracker.tsx`, `recommendation.ts`, `analytics.ts`, `filter-cards.tsx`, `product-card.tsx`, postcode page, best-water-filters-uk guide) plus the catalogue and disclosure surfaces they touch.

## BLOCKERS
None in the strict sense. No XSS, no open redirect, no secret exposure, no broken `rel`. Read the note on the postcode disclosure gap below: if this branch is what takes the affiliate sales loop live in the UK, treat that item as launch-blocking.

## IMPORTANT

**1. Postcode page carries prominent affiliate CTAs with no visible disclosure (CMA/ASA exposure).**
Evidence: `src/app/postcode/[district]/page.tsx:392-401` now renders `FilterRecommendations` *higher* on the page ("while intent is fresh"), and `src/components/filter-cards.tsx:106-121` changed the CTA to a commercial "See today's price". The page has no on-page affiliate disclosure (grep for commission/affiliate/disclosure returns nothing). Every sibling monetized page does: `best-water-filters-uk/page.tsx:324-339`, `filters/page.tsx:79`, `filters/[category]/page.tsx:298-307`, the PFAS and testing-kit guides. This is a pre-existing gap (the recommendations block existed before), but the diff amplifies it: more prominent placement, harder commercial CTA, added impression tracking. UK CMA guidance requires clear, prominent disclosure adjacent to affiliate links.
Minimal safe fix: add one disclosure line inside the `FilterRecommendations` section (it already imports `Link`), e.g. a small note linking `/affiliate-disclosure`, matching the guide's line 324 pattern.

**2. PFAS signal-injection forces the most expensive product exactly when PFAS was *not* flagged in the tap water.**
Evidence: `src/app/postcode/[district]/page.tsx:133-136` (new) appends `"PFAS (total)"` to the recommendation signals whenever `data.pfasDetected` is true and no *flagged* reading mentions PFAS. In `src/lib/filters.ts:39-47`, any signal containing "pfas" sets `hasPfas` and grants reverse-osmosis systems a `+100` boost, pushing a ~£349 RO unit to the hero slot. `data.pfasDetected` is also true for `pfasSource === "environmental"` (PFAS in nearby rivers, not the tap), and this branch fires *precisely* when PFAS is environmental-only or below-threshold. When tap water has zero flagged contaminants, `getRecommendationMessage` (`src/lib/recommendation.ts:14-16`) tells the user "your water is within recommended levels, a filter is optional", and the section heading (`filter-cards.tsx:227-231`) reads "Optional filter for taste & convenience", yet the hero shown is a PFAS-selected RO system. Pairing "your water is fine / optional / for taste" copy with an expensive RO upsell chosen off environmental river data is a misleading-recommendation risk.
Minimal safe fix: gate the injection on `data.pfasSource === "drinking"`, or when environmental-only, keep the RO out of the hero and state the precautionary/environmental basis explicitly in the message.

## POLISH

- **`new URL()` is now an unguarded SSG landmine.** `src/lib/affiliate.ts:22` (`buildAffiliateUrl`) and `:50` (`createAffiliatePayload`), plus the server-side `destination_host: new URL(hero.affiliateUrl).hostname` in `filter-cards.tsx:224`, all throw on a malformed or relative URL. Every *live* caller passes a valid absolute catalogue URL (verified `products.ts`), so it is not currently reachable, but `MOCK_FILTERS` carry `affiliateUrl: "#"` (`mock-data.ts:126,146,166`) and `new URL("#")` throws, which would 500 a statically-generated page. The old `appendUtm` string-concat was throw-proof. Wrap in a try/catch that falls back to the raw href so a bad catalogue entry can never break a build.
- **Impression events drop the water-score band.** `filter-cards.tsx` hardcodes `water_score_band: "unknown"` in the `RecommendationTracker` payload even though the postcode page computes the real band (`page.tsx:137`) and never passes it down. Analytics-accuracy nit (Agent 2's lane), noted for completeness.
- **"Practical match" overclaim.** `recommendation.ts:18-19` returns "This option is a practical match for the concerns flagged" when `matchedContaminants` is empty, i.e. the product addresses none of the flagged contaminants. Low risk since it appends "check its certifications and limitations", but the wording implies a fit that does not exist.

## Positives (no change needed)
- `rel="noopener noreferrer sponsored nofollow"` and `target="_blank"` preserved on every affiliate link (`affiliate-link.tsx:40-41`): anti-tabnabbing plus FTC-machine-readable sponsorship intact across the refactor.
- Postcode privacy is handled well: `outwardPostcode()` (`affiliate.ts:33-35,43`) truncates to the outward code before anything reaches analytics, and `data.district` is already the outward district. No full postcode (PII) leaves the client. Covered by `affiliate.test.ts:31-56`.
- Trust-positive copy shift: old "certified to remove X" became "this product lists reduction for X; certification and limitations are shown below" (`recommendation.ts:26`), and `getTransparentLimitations` now surfaces "does not remove…" cons in the hero (`filter-cards.tsx:105-114`). Locked by `recommendation.test.ts`.
- No secret exposure: the only credential-like value is the public Amazon associate tag `tapwater21-21`, which belongs in the affiliate URL. No keys, no server env reaching the client.
- No XSS: all new copy renders as React-escaped text nodes; no `dangerouslySetInnerHTML`, and the `district` route param never flows into an `href`.

**New regressions vs pre-existing catalogue risk:** Items 2 and the `new URL()` landmine are new in this diff. Item 1 (missing postcode disclosure) is pre-existing but materially amplified by this diff's placement and CTA changes.
