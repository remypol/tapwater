## Fable 5 actual audit 2/5: analytics and affiliate attribution

**VERDICT: FIX** (one privacy blocker, several measurement-quality issues; core affiliate mechanics are sound)

### BLOCKERS

**B1. `outwardPostcode` leaks full postcodes when the input has no space.**
`"AL12AB".trim().toUpperCase().split(/\s+/)[0]` returns `"AL12AB"`, a household-level identifier, straight into GA. Unspaced postcodes are the most common user-input variant, and this function is the privacy guard behind the public `postcodeArea` prop on `AffiliateLink`/`ProductCard`. Today's call sites pass districts so exposure is latent, but the guard doesn't guard and the test suite blesses it (only the spaced case is tested). Exact fix in `src/lib/affiliate.ts`:

```ts
function outwardPostcode(postcode?: string): string {
  const clean = postcode?.trim().toUpperCase() ?? "";
  // Full postcode, spaced or not: the inward part is always digit + 2 letters
  const full = clean.match(/^([A-Z]{1,2}\d[A-Z\d]?)\s*\d[A-Z]{2}$/);
  return full?.[1] ?? clean.split(/\s+/)[0];
}
```

Add a test asserting `postcodeArea: "AL12AB"` produces `postcode_area: "AL1"`.

### IMPORTANT

**I1. Impression viewability is weak in both directions.** `RecommendationTracker` wraps the whole section, so the heading counts as "product seen" before the card is on screen; a tall section on mobile may never reach ratio 0.25 and never fire (lost impressions); and there is no dwell time, so drive-by scrolls count. Minimal fix: wrap only `<HeroRecommendation>`, and require ~1s of visibility at threshold 0.5:

```ts
const observer = new IntersectionObserver(([entry]) => {
  if (entry.isIntersecting) timer = window.setTimeout(send, 1000);
  else window.clearTimeout(timer);
}, { threshold: 0.5 });
```
(keep `sentRef`, disconnect after send, clear the timer in cleanup).

**I2. Intentional double event on search.** `postcodeSearch` now fires both `postcode_search_submitted` and legacy `postcode_search`. Fine as a migration, but any dashboard summing search events double-counts. Count conversions only on the new name and give the legacy event a dated removal.

**I3. UTM decoration on Amazon URLs: zero value, nonzero ToS risk.** You can't read Amazon's server-side UTMs, and Associates policy language about altering Special Links makes decoration a pure downside; the click event already carries campaign/slug. Early-return in `buildAffiliateUrl`:

```ts
if (/(^|\.)amazon\./.test(url.hostname)) return url.toString();
```
Use `ascsubtag` later if Amazon-side sub-attribution is ever needed. Note the first `affiliate.test.ts` case currently asserts UTMs on an Amazon URL and must be updated.

**I4. Clicks without matching impressions.** Placements `postcode-alternative`, `guide-quick-picks`, and `filter-grid` emit `affiliate_click` but never `recommendation_impression`, so per-placement CTR is only computable for `postcode-summary`. Add trackers (guide quick-picks is the one that matters) or document the gap in the reporting spec.

**I5. `recommendation_reason` taxonomy is inconsistent and unbounded.** Hero/alternatives use raw contaminant display names joined with `+` (multi-word names with spaces/brackets will land verbatim, unbounded cardinality); other surfaces use kebab literals. The join logic is also duplicated three times in `filter-cards.tsx`. Hoist one helper (e.g. in `recommendation.ts`): slugify each name (`toLowerCase().replace(/[^a-z0-9]+/g, "-")`), cap at 3, keep the existing fallbacks.

**I6. Payload hygiene.**
- `pathname` is caller-supplied with lying defaults (`"/filters"`); `AffiliateLink` is a client component, so use `usePathname()` and drop the prop.
- `FilterCards` accepts `postcode` but never forwards it; pass `postcodeArea={postcode}` so `postcode_area` isn't empty where it's known.
- Sentinel mismatch: `postcode_area: ""` vs `water_score_band: "unknown"`; omit empty keys or use `"unknown"` consistently.
- Middle-click opens are untracked; add `onAuxClick={handleClick}` on the anchor.

### Checked, OK
- Amazon `tag=` is preserved (`searchParams.set` only touches utm keys, covered by test); stale UTMs are replaced, not duplicated.
- All affiliate anchors, including converted legacy ones, carry `rel="noopener noreferrer sponsored nofollow"` and `target="_blank"` (new tab also means the click event isn't lost to unload).
- No duplicate events: `sentRef` survives effect re-runs (payload identity changes every render but the guard holds), and `FilterRecommendations` was moved on the postcode page, not rendered twice.
- Malformed URLs degrade safely (`"#"` passthrough, `destination_host: "unknown"`), covered by tests.
- One shared payload schema (`createAffiliatePayload`) for click and impression: 10 snake_case params, within GA4 limits; `water_report_viewed` sends district and band only.
