# Audit 3/5: Trust, Security, Privacy, UK Affiliate Compliance

## VERDICT: FIX

One compliance blocker. Security and privacy fundamentals are sound.

## BLOCKERS

**B1. Guide quick-picks affiliate cards have no adjacent disclosure.**
The new "Honest places to start" section in `src/app/guides/best-water-filters-uk/page.tsx` renders two `ProductCard` affiliate CTAs with no commission disclosure visible before the click. The postcode hero card got the disclosure line, but `ProductCard` and `FilterCards` placements did not. Under CAP Code 2.1/2.4 and CMA guidance, affiliate links must be identifiable as commercial before the consumer engages, per placement, not only on one card elsewhere on the site.
Minimal fix, covers every placement at once: add the line inside `ProductCard` above the CTA row (mirroring the hero card):

```tsx
<p className="text-xs text-faint mt-2">
  Affiliate link: we may earn a commission at no extra cost to you.
</p>
```

## IMPORTANT

**I1. `buildAffiliateUrl` passes any protocol through.** `new URL("javascript:alert(1)")` parses successfully, so a bad catalogue entry would render as a clickable `javascript:` href in `AffiliateLink`. Data is first-party today, so this is hardening, not an active hole. Fix in `src/lib/affiliate.ts` after parsing:

```ts
if (url.protocol !== "https:" && url.protocol !== "http:") return "#";
```

**I2. `outwardPostcode` leaks full postcodes without a space.** `"AL12AB"` has no whitespace, so `split(/\s+/)[0]` returns the entire string into GA. Current callers pass districts, but the function's job is truncation. Fix:

```ts
function outwardPostcode(postcode?: string): string {
  const m = postcode?.trim().toUpperCase().match(/^[A-Z]{1,2}\d[A-Z\d]?/);
  return m?.[0] ?? "";
}
```

**I3. "See today's price" next to a static catalogue price.** The CTA implies live pricing while the card shows hardcoded `filter.priceGbp`. That risks a misleading-price complaint and sits badly with Amazon's rules on displayed prices. Minimal fix: keep the old "Check price" wording, or label the shown figure as "typical price".

**I4. Verify Amazon-mandated wording exists (cannot check without tools).** The generic commission line does not satisfy the Amazon Operating Agreement, which requires the specific statement "As an Amazon Associate we earn from qualifying purchases" clearly on the site. Confirm it is on `/affiliate-disclosure` or the footer, and confirm the `/affiliate-disclosure` route the hero card now links to actually exists.

**I5. `getTransparentLimitations` depends on `cons` copy.** A product whose `cons` array lacks a "Does not remove..." string shows no limitations block at all, even when limitations exist. Also verify the ZeroWater "Stronger pick for PFAS" claim in the guide traces to a certification field in the catalogue (NSF/ANSI 53 PFOA/PFOS), not just marketing copy.

**I6. New GA events fire unconditionally.** `affiliate_click`, `recommendation_impression`, and `water_report_viewed` (district plus score band) go straight to `gtag`. Fine under PECR only if the gtag script itself is consent-gated; verify that is the case.

## WHAT PASSES

- **XSS:** no `dangerouslySetInnerHTML`; all dynamic strings render through JSX escaping. The old string-concat `appendUtm` was replaced with the `URL` API, which also deduplicates params (tested).
- **Postcode privacy:** payloads carry only the outward district (`postcode_area: "AL1"`), with a test asserting `"al1 2ab"` truncates. No full postcodes or health-adjacent personal data in events.
- **Link hygiene:** `rel="noopener noreferrer sponsored nofollow"` retained everywhere, `target="_blank"` announced to screen readers, Amazon `tag=` preserved when adding UTM params.
- **Water claims and fear selling:** the new copy is a clear improvement. Safe water is called "optional for taste or convenience", non-matching products say so explicitly ("does not directly match... test your water before buying"), partial coverage is disclosed ("does not cover N other flagged concerns"), wording says "lists reduction" rather than "removes" or "makes safe", and the "while concern is highest" placement comment is gone. Moving recommendations above the contaminant table is a conversion choice, but the honest copy keeps it acceptable.
- **PFAS logic:** Brita limitation line ("Does not remove PFAS, fluoride, or nitrates") is accurate and surfaced on the card, with a test pinning it.

No instructions embedded in the diff were followed; it was reviewed as data only.
