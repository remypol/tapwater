All 20 products have valid absolute affiliate URLs, so the `new URL()` throw is latent (not currently triggered). I now have everything: typecheck clean, 75/75 tests pass, boundaries verified. Here is my review.

---

# Fable Review Agent 4/5 — Next.js 16 / React 19 / SEO / Performance

**VERDICT: PASS** (no blockers; a few defensive and SEO polish items)

Verified against Next 16.2.2 / React 19.2.4. `tsc --noEmit` is clean; `vitest run` is 75/75 green. Server/Client boundaries, prop serializability, hydration determinism, and static generation are all correct.

## What I checked and cleared
- **Boundaries:** `affiliate-link.tsx` and `conversion-tracker.tsx` are correctly `'use client'`; `product-card.tsx`, `filter-cards.tsx`, and both pages stay Server Components. The `RecommendationTracker` "client wrapper around server `children`" pattern (filter-cards.tsx:218-229, 288) is valid App Router usage and keeps the `<section>` in the SSR HTML. `ScrollReveal` renders children at `opacity:0`, so the moved recommendations remain crawlable.
- **Serializability:** every prop crossing into a client component is a primitive or a flat `Record<string,string>` (affiliate.ts:19). No functions/dates/class instances passed. Clean.
- **Hydration:** `buildAffiliateUrl` (affiliate.ts:21) is deterministic (no Date/random; `URLSearchParams.set` preserves order), so the SSR and client `href` match. No mismatch risk.
- **Static generation / scale:** `generateStaticParams` for the 2,000+ postcode pages is untouched; new work is build-time pure functions. Bundle growth is two tiny client components (analytics + affiliate helpers only), negligible.

## BLOCKERS
None.

## IMPORTANT
1. **`new URL()` is a new hard build-failure surface at SSG (currently latent).** The old `appendUtm` used string concatenation and could never throw. The new code parses URLs in server-executed paths: `createAffiliatePayload` → `new URL(context.destinationUrl).hostname` (affiliate.ts:50) and, most exposed, the impression payload built during static render at filter-cards.tsx:228 (`destination_host: new URL(hero.affiliateUrl).hostname`). A single recommended product with a missing/relative `affiliateUrl` would throw during `next build` and fail static export for every page recommending it. I confirmed all 20 current products have absolute `https://` URLs, so it does not fire today, but product data is automation-fed and changes often. Minimal fix: wrap host extraction in a helper that returns `"unknown"` on parse failure (e.g. `try { return new URL(u).hostname } catch { return "unknown" }`) and reuse it in both call sites.

2. **Impression payload sends `water_score_band: "unknown"` even though the page knows the real band** (filter-cards.tsx:222). The page computes `waterScoreBand` (page.tsx:137) and passes it to `WaterReportTracker`, but `FilterRecommendations` is never given it, so the `recommendation_impression` event permanently reports "unknown" while the paired `affiliate_click` reports a real value. This is analytics-quality (agent 2's lane) but it is a defect in the new code. Minimal fix: thread `waterScoreBand` from page.tsx:395 into `FilterRecommendations` and into the payload.

## POLISH
3. **SEO: a location-keyworded H2 was dropped on the programmatic pages.** The zero-flag heading went from `Filters for ${postcodeDistrict}` to the static `"Optional filter for taste & convenience"` (filter-cards.tsx:235), removing the district keyword from that H2 across 2,000+ pages. Minor signal loss; consider keeping the area token (e.g. `Optional filter for ${postcodeDistrict}`).
4. **`RecommendationTracker` `useEffect([payload])` depends on a freshly-built object** (conversion-tracker.tsx:14-16, payload literal at filter-cards.tsx:218). Harmless under SSG (single mount), but if this ever renders under a client-re-rendering parent it will double-fire impressions. Depend on a primitive key, or add a `useRef` fire-once guard. Also note the impression fires on mount regardless of viewport, despite the surrounding `ScrollReveal` already tracking visibility.
5. **Guide uses `getProductBySlug`, which ignores `availableInUk`** (guide page.tsx:204-214; products.ts:786). Both hardcoded picks are available now, but if one later flips to `availableInUk:false` the guide still renders it with a live affiliate link, and if a slug is ever renamed the `.filter(Boolean)` leaves the `<section aria-labelledby="quick-picks-heading">` heading with an empty body (thin section + dangling label). Consider an availability guard / empty-check.
6. **Leftover double blank line** at postcode `page.tsx:421-422` where the recommendations block was relocated. Cosmetic. Also note the reorder now places the affiliate hero above the contaminant data table; acceptable for product-review SEO, just flagging the monetization-ordering shift for agent 1.

Net: mergeable from the Next/React/SEO angle. Address item 1 (defensive URL guard) and item 2 (band threading) before this compounds across the programmatic page set.
