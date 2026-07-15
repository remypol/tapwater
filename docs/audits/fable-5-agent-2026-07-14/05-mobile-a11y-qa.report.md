Read-only inspection complete. All six named surfaces examined (globals.css is unchanged; the collision picture required the bottom-nav + layout, checked minimally). Findings below.

---

# Final Review — Tapwater sales-loop diff

**VERDICT: PASS** (no hard blockers; 2 IMPORTANT items I'd clear before you call it shipped)

Scope: `affiliate-link.tsx`, `conversion-tracker.tsx`, `filter-cards.tsx`, `product-card.tsx`, `postcode/[district]/page.tsx`, `globals.css`. Read-only, no edits, no broad crawl.

Quick confirmations on the axes you flagged:
- **Keyboard / focus:** PASS. `AffiliateLink` renders a real `<a href>` (affiliate-link.tsx:38), so it is natively focusable and Enter dispatches a click, which fires `handleClick` → the affiliate event. No `<div onClick>` traps introduced.
- **Semantics:** PASS. `RecommendationTracker` returns `children` directly and `WaterReportTracker` returns `null` (conversion-tracker.tsx:18,32), so neither adds wrapper DOM; the `<section>`/`<h2>` structure is intact.
- **Sticky / bottom-nav collision:** PASS, and the diff adds no new fixed/sticky element. `MobileBottomNav` is a floating pill `fixed bottom-3 … z-50 sm:hidden`, and `main` carries `pb-24 sm:pb-0` (layout.tsx:110) so inline content, including the affiliate CTAs, clears it. `StickyScore` is `fixed top-0 … z-40` (opposite end). No overlap.
- **Mobile:** consistent with your 390/390 proof; the price+CTA row is `flex` with `flex-1` button + `shrink-0` price, no overflow risk.

## BLOCKERS
None.

## IMPORTANT
1. **Unguarded `new URL()` in the SSR render path — page-level crash surface.** `filter-cards.tsx:228` (`destination_host: new URL(hero.affiliateUrl).hostname`). `FilterRecommendations` is a **server component** (no `'use client'`), so a single recommendable product with an empty/relative/malformed `affiliateUrl` throws `TypeError` during render and 500s the whole postcode page. Current curated data is probably clean, but with the live data pipeline (Scottish Water import in recent commits) this is a latent landmine. Guard it (try/catch or a `safeHostname()` helper with a fallback), or add a QA assertion that every recommendable product has an absolute URL.
2. **`water_score_band` hard-coded to `"unknown"` on the recommendation impression.** `filter-cards.tsx:222`. The page already computes the real band (`waterScoreBand`, page.tsx:135) and threads it into `WaterReportTracker`, but not into `FilterRecommendations`, so every recommendation impression logs `unknown`. You lose the ability to segment recommendation impressions by water quality, which is exactly the signal this loop is built to read. Thread the band prop through.
3. **New-tab clarity for assistive tech.** `affiliate-link.tsx:40` opens `target="_blank"` with no "opens in new tab" cue in the accessible name. The hero CTA "See today's price" (filter-cards.tsx:132) and the ProductCard CTAs have no external-link icon or text either. (The icon-only alternative link at filter-cards.tsx:186 at least has the `ExternalLink` glyph + `ariaLabel`.) Add a visually-hidden "(opens in new tab)" or an `aria-label` suffix, at minimum on the text CTAs. Not a hard blocker, but it is the one accessibility gap in the changed set.

## POLISH
- **`useEffect([payload])` depends on object identity.** `conversion-tracker.tsx:16`. Safe *today* because `payload` originates in a server component (stable reference across client re-renders of `ScrollReveal`), so it fires once. It becomes a double-fire the moment `FilterRecommendations` is converted to a client component or the payload is built in client state. Depend on primitive fields (or memoize) to make it robust. `WaterReportTracker` (line 30) already uses primitive deps, good.
- **Icon-only alternative link tap target ~32px.** `filter-cards.tsx:189` (`p-2` around a 16px icon = 32×32). Below the ~44px comfortable mobile target. Pre-existing (unchanged by this diff), noting for the touch-target axis.
- **ProductCard CTA ~40px tall** (`py-2 px-3`, product-card.tsx). Just under 44px; fine but tightenable.
- **In-file gap in migration:** the standalone `FilterCards` (same file, `filter-cards.tsx:319`) still uses a raw `<a target="_blank" rel="…">`, not `AffiliateLink`, so guide-page CTA clicks bypass the new dataLayer tracking and UTM builder. Out of the postcode path, but worth knowing the migration is not total.
- **Leftover blank line** where the old `FilterRecommendations` block was removed (page.tsx, just above the `hardnessValue` block, ~line 419). Cosmetic.

## Missing release QA
Your proof covers `affiliateClick → dataLayer`, 390/390, 75/75, tsc. Not yet proven:
- `recommendationImpression` and `waterReportViewed` actually reaching `dataLayer` (both are new `useEffect` paths; only the click was verified).
- No SSR crash from `new URL()` across the **full** recommendable-product dataset (see IMPORTANT #1).
- Screen-reader pass for the new-tab announcement (IMPORTANT #3).

Net: the UX/a11y/keyboard/collision surface is clean and shippable. I would clear IMPORTANT #1 (guard the URL parse) and #2 (thread the band) before declaring the loop done, since both are cheap and one is a latent 500.
