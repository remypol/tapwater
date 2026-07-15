# Audit 5/5: Mobile, Accessibility & Release QA (staged diff)

**VERDICT: FIX** (one release-proof blocker; a11y/mobile work in the diff is largely an improvement)

## BLOCKERS

1. **No release proof attached.** The lint toolchain changed (`"lint": "eslint ."` replacing `next lint`, plus a new error-level `no-unused-vars` rule) and five pages had unused code hand-deleted (`accentBgClass`, `totalSamplesLabel`, `scoreBorderClass`, imports). Nothing in the diff proves the tree still compiles, lints, or builds, and a stale reference to any deleted symbol would be a build break.
   **Fix:** run `npm run lint`, `npm test`, `npm run build` and attach outputs to the release report. Also confirm the flat ESLint config has `ignores` covering `.next/` (and generated output), since `eslint .` no longer inherits `next lint`'s built-in ignores and will now traverse `scripts/` too.

## IMPORTANT

2. **Impression can silently never fire on small screens.** `RecommendationTracker` observes the entire recommendations section (hero card + alternatives + footer) with `threshold: 0.25` (`src/components/conversion-tracker.tsx:37`). If the section is taller than ~4x the viewport (small phone, or 200% zoom per WCAG 1.4.4), the intersection ratio can never reach 0.25 and no `recommendation_impression` is sent.
   **Fix:** change `{ threshold: 0.25 }` to `{ threshold: 0.1 }`, or move the tracker to wrap only the hero card.

3. **Impression coverage is asymmetric.** `affiliate_click` now fires from guide quick-picks, `ProductCard`, and `FilterCards`, but `recommendation_impression` only exists on the postcode placement, so CTR is uncomputable for the new guide placement.
   **Fix:** wrap the guide `#quick-picks` section (or each card) in `RecommendationTracker` with a matching payload, or annotate dashboards that impressions exist only for `postcode-summary`.

4. **Disclosure/limitations legibility unverified.** The new affiliate disclosure is `text-xs text-faint` and limitations are `text-sm text-muted` on card/wash backgrounds. If `text-faint` is below 4.5:1 that fails WCAG 1.4.3, and the ASA expects the commission disclosure to be clear and conspicuous, not the faintest text on the page.
   **Fix (if contrast check fails):** bump disclosure to `text-sm text-muted` and limitations to `text-body`.

5. **No visible new-tab affordance on primary CTAs.** Screen-reader messaging is handled well (aria-label suffix or `sr-only` span in `AffiliateLink`), but the hero "See today's price" and `ProductCard` CTAs use `ArrowRight`, which visually implies same-tab navigation. Low priority.
   **Fix:** swap `ArrowRight` for `ExternalLink` on new-tab CTAs. Also note the `ariaLabel` prop replaces visible text; today's only caller is icon-only (safe), but future callers must include the visible label in it (WCAG 2.5.3).

6. **`FilterCards` hardcodes `pathname="/filters"` / `pageType="filter-list"`** while the component is used on guide pages, so those analytics fields will lie.
   **Fix:** accept `pathname`/`pageType` props with defaults, as `ProductCard` already does.

## Checked and passing

- **Keyboard/focus:** all CTAs are real `<a href>` elements (Enter works, natively focusable), alternatives use native `<details>/<summary>`, the tracker `<div>` wrapper doesn't alter focus order, lucide icons are aria-hidden by default, and `onClick` tracking doesn't preventDefault.
- **Touch targets:** deliberately improved. Icon-only alternative link `p-2` to `p-3.5` gives exactly 44x44px; `ProductCard` CTA `py-2` to `py-3` and `FilterCards` `p-3` both reach ~44px height.
- **Responsive layout:** quick-picks stack with `space-y-4`; hero CTA row (shorter label "See today's price") still fits 320px; both new anchors (`#quick-picks`, `#filter-recommendation`) have `scroll-mt-24` so anchored jumps clear a sticky header.
- **Bottom-nav collision:** no new fixed or bottom-anchored elements introduced; `StickyScore` is untouched. One manual check for the release report: on a ≤375px device, confirm `StickyScore` doesn't cover the recommendation section now that it sits directly after the summary (its activation point), and that its height stays within the 96px `scroll-mt-24` offset.
- **Messaging honesty:** the new `getRecommendationMessage` copy (optional when nothing is flagged, explicit coverage gaps, no "makes your water safe" claims) plus the limitations block is a genuine trust improvement and is unit-tested.
