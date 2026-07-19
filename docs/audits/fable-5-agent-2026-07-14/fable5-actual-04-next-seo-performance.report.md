# Audit 4/5: Next.js 16, React 19, SEO and performance

**VERDICT: PASS** (nothing build-breaking found in the diff itself; verify items 1 and 3 below before merge since they cannot be confirmed from the diff alone)

## BLOCKERS

None found.

## IMPORTANT

1. **`lint` script changed to `eslint .`: confirm the flat config ignores build output.** The change itself is required (`next lint` is removed in Next 16), but ESLint 9 only ignores `node_modules/` and `.git/` by default, not `.next/`. If `eslint.config.mjs` has no ignores entry, `npm run lint` after a local build will lint generated files and fail. Minimal fix if absent:
   ```js
   { ignores: [".next", "out", "coverage"] },
   ```
   Also note `no-unused-vars` is now an `error` repo-wide, and `eslint .` covers `scripts/` and everything else this diff did not clean. Run lint once in CI before merging.

2. **Recommendation block moved above the contaminant data on all ~3k postcode pages.** These pages were patched for indexing exclusion one commit ago (be02e29). Putting a near-identical affiliate module before each page's unique data raises boilerplate-first / top-heavy signals exactly where indexing is already fragile. Minimal mitigation that keeps the conversion intent: render it early only when `contaminantsFlagged > 0` (the "optional filter" variant stays in the old position below the data), and watch Search Console coverage for this template for 2-3 weeks after deploy.

3. **References the diff cannot prove exist; each is a build error or a 3k-page 404 if wrong:**
   - `FilterProduct.availableInUk` (guide page) and `FilterProduct.cons` (recommendation.ts). A missing field is a TS build failure.
   - Catalogue slugs `brita-marella-xl` and `zerowater-12-cup`. The guide silently renders nothing if they are absent (acceptable fallback, but confirm that is intended).
   - The `/affiliate-disclosure` route, now linked from every postcode hero card. With `typedRoutes` enabled a bad route fails the build; without it, it ships as a site-wide 404 that wastes crawl budget and undermines the disclosure.

## Checked and clean

- **Server/client boundaries:** `affiliate-link.tsx` and `conversion-tracker.tsx` are correctly small `'use client'` leaves; everything crossing the boundary (strings, `Record<string,string>` payloads, ReactNode children) is serializable. `product-card.tsx`, the guide page, and the postcode page stay server-rendered.
- **Hydration:** `buildAffiliateUrl` uses the WHATWG `URL` API, which is deterministic across Node and browser, so the SSG'd `href` matches the client render. `WaterReportTracker` renders null. No `Date` or randomness in client render paths. No mismatch risk found.
- **Static generation at 3k pages:** no `cookies()`, `headers()`, or `searchParams` introduced; `revalidate = 86400` retained; added per-page work is trivial string formatting. Trackers fire client-side, so daily-ISR-cached HTML still emits per-visit events (correct design), and baked utm params are placement-scoped rather than visitor-scoped, so caching stays safe.
- **Bundle size:** new client code is roughly 2-3 KB min+gzip (two tiny components plus `affiliate.ts` and the analytics additions), no new dependencies, and the heavy card markup stays server-rendered.
- **Metadata/SEO:** compare-page canonical remains parameter-independent (correct dedup for reversed vs-URLs); affiliate anchors keep `rel="sponsored nofollow noopener noreferrer"` with utm baked at build time; guide quick-picks are server-rendered and crawlable.

## Minor

- `report/[year]`'s `generateMetadata()` returns the same hardcoded "(2026)" title for every year param. Pre-existing behavior (the old signature ignored params too), but this diff freezes it; derive the title from the `year` param if multiple years will be published.
- `RecommendationTracker`'s effect depends on the `payload` object. Fine while the parent is server-rendered (stable prop identity); if `FilterRecommendations` is or becomes a client component, the observer re-subscribes every render (`sentRef` already prevents duplicate events, so no data damage).
- Impression `threshold: 0.25` is a fraction of the observed section's own height; on small viewports with a tall hero card the ratio can never reach 0.25 and impressions undercount. `threshold: 0.1`, or observing only the hero card, is safer.
- Cosmetic: removed declarations leave double blank lines in `rankings/[slug]/page.tsx`, `rankings/page.tsx`, and `report/[year]/page.tsx`.
