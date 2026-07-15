## Fable Review Agent 2/5 — Analytics & Affiliate Attribution

**VERDICT: PASS** (no blockers; several IMPORTANT attribution-quality gaps worth fixing before/after merge)

The revenue-critical path is sound: the Amazon Associates `tag` is preserved (`buildAffiliateUrl` uses the `URL` API and only `.set()`s utm params — `affiliate.ts:21-31`, locked by test `affiliate.test.ts:11`), clicks fire exactly once via a single `onClick` on a `target="_blank"` anchor (no navigation race, no double-count — `affiliate-link.tsx:30-46`), `destination_host` matches between impression and click, and `new URL()` won't throw on any of the 20 current product URLs (all absolute). No lost or duplicated *revenue* attribution.

### BLOCKERS
None.

### IMPORTANT

1. **`water_score_band` is dead on every revenue event — the segmentation this system exists for is broken.** The postcode page computes the band (`page.tsx:137`) but passes it *only* to `WaterReportTracker` (`page.tsx:244`). `FilterRecommendations` never receives it, so:
   - the impression hardcodes `water_score_band: "unknown"` (`filter-cards.tsx:222`), and
   - every postcode `affiliate_click` defaults to `"unknown"` (hero `AffiliateLink` at `filter-cards.tsx:113-131` passes no `waterScoreBand` → `affiliate.ts:45`).

   You can segment `water_report_viewed` by band but not the clicks/impressions those views drive, except by a fuzzy GA4 session join. **Minimal fix:** thread `waterScoreBand` through `FilterRecommendations` → `HeroRecommendation`/`AlternativeCard`/impression payload.

2. **Impression payload is hand-built in JSX, bypassing `createAffiliatePayload`** (`filter-cards.tsx:218-229`). Two consequences: (a) drift risk — the click path and impression path now derive the same 10-field shape independently; (b) it skips `outwardPostcode()` sanitization (`affiliate.ts:33-35`). Today `postcodeDistrict` is already an outward code (`data.district`), so no live leak, but the click path defends and the impression path doesn't. **Minimal fix:** `payload={createAffiliatePayload({ ...heroContext, destinationUrl: hero.affiliateUrl, waterScoreBand })}` — one call fixes #1, #2, and the sanitization asymmetry.

3. **`utm_campaign` taxonomy is inconsistent.** Postcode uses a *purpose* value `"postcode-result"` (`filter-cards.tsx:129,188`) while `ProductCard` sets `campaign={pageType}` — a *page-type* value like `"best-water-filters-guide"`/`"filter-category"` (`product-card.tsx:94`). So `utm_campaign` mixes two axes and, for product cards, `page_type === campaign` (redundant). Campaign reports will be hard to read. **Fix:** give product-card a dedicated `campaign` prop with a consistent naming scheme rather than reusing `pageType`.

4. **Renamed event breaks existing GA4 config** — `postcode_search` → `postcode_search_submitted`, param `district` → `postcode_area` (`analytics.ts:18-19`). The single caller (`postcode-search.tsx:39`, passing the sanitized outward district — privacy OK) still works, but any GA4 *conversion* or dashboard keyed on the old event/param name silently stops counting. Heads-up: confirm the GA4 conversion list before this ships.

5. **`recommendation_impression` fires on mount, not on view.** `ScrollReveal` (`page.tsx:395`) only animates opacity — children mount immediately (`scroll-reveal.tsx` renders `{children}` unconditionally), so the impression fires on page load even when the block is far below the fold. Counts are inflated and impression→click rate is understated. (Confirmed *not* a duplicate: `filter-cards.tsx` is a server component, so the `RecommendationTracker` element identity is stable across ScrollReveal re-renders → `useEffect([payload])` runs once in prod.) **Fix if viewability matters:** fire the impression from an `IntersectionObserver` inside `RecommendationTracker`, or reuse ScrollReveal's `visible` signal.

### POLISH
- **Robustness regression:** `new URL()` in `buildAffiliateUrl` (`affiliate.ts:25`), `createAffiliatePayload` (`affiliate.ts:50`), and the inline impression (`filter-cards.tsx:228`) throws on a malformed/empty `affiliateUrl`, crashing SSR of the postcode page. The old `appendUtm` string-concat never threw. No live risk (all URLs valid), but a bad future catalogue entry is now a hard crash — consider a try/catch or validation.
- **Test gap:** nothing locks impression↔click payload consistency (`campaign`/`placement`/`product_slug`) now that the impression is hand-rolled — exactly the drift risk in #2. The pure-function coverage (`affiliate.test.ts`, `analytics.test.ts`, all 8 passing) is otherwise solid. Also worth a test that `trackEvent` no-ops when `window.gtag` is absent.
- **Field misnamed:** `postcode_area` carries the *district* (`"AL1"`), not the area (`"AL"`). Consistent everywhere and harmless, just mislabeled for anyone reading GA4.
