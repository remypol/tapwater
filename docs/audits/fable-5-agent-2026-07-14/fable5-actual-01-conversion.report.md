**VERDICT: FIX** — the tracking plumbing and message rewrite are solid net improvements (outward-postcode-only analytics, honest no-match branch, limitations surfacing), but three copy/data mismatches can show users contradictory or false claims.

## BLOCKERS

**1. Header contradicts the message when the hero matches nothing** (`src/components/filter-cards.tsx`)
When `contaminantsFlagged > 0` but `hero.matchedContaminants` is empty, the header says "Best fit for your water" while the card body says "does not directly match the concerns flagged". Gate the header on the hero's match state, not the flag count:
```tsx
{hero.matchedContaminants.length > 0
  ? "Best fit for your water"
  : contaminantsFlagged > 0
    ? `Filter options for ${postcodeDistrict}`
    : `Optional filter for ${postcodeDistrict}`}
```

**2. Partial coverage is silent** (`src/lib/recommendation.ts`)
If 3 contaminants are flagged and the product matches 2, the message names only the matched ones and never discloses the gap. The function already receives `contaminantsFlagged`; append:
```ts
const unmatched = contaminantsFlagged - matchedContaminants.length;
const gap = unmatched > 0
  ? ` It does not cover ${unmatched} other flagged concern${unmatched === 1 ? "" : "s"} in this report.`
  : "";
```
(If readings can repeat a contaminant name, pass unmatched names rather than relying on the count.)

**3. "certification and limitations are shown below" can be a false promise** (`src/lib/recommendation.ts`)
`getTransparentLimitations` returns `[]` for any product whose cons don't start with the regex verbs, so the limitations block doesn't render, and the diff never renders certification details at all. Minimal fix, reword to what is guaranteed on the card:
```ts
return `... This product lists reduction for ${concerns}. Check the removal list below and its certification before relying on it for health concerns.`;
```
No test changes needed (tests only assert `toContain` on other substrings).

## IMPORTANT

- **Guide quick-picks can render a broken promise** (`best-water-filters-uk/page.tsx`): the heading hard-codes "Two honest places to start" but the list is filtered on `availableInUk`, so 0 or 1 cards is possible. Gate the whole section on `topPicks.length > 0` and make the heading count-agnostic ("Honest places to start").
- **No affiliate disclosure near guide/catalog CTAs**: the postcode hero got the disclosure line, but `ProductCard` and `FilterCards` CTAs (guide quick-picks, `/filters` grid) have none, and `rel="sponsored"` is not consumer-facing disclosure under UK CMA/ASA guidance. Unless those pages already show a page-level disclosure (not verifiable from the diff), add the same one-line `<p>` next to those CTAs.
- **Verify `/affiliate-disclosure` exists**: the hero now links to it from a trust-critical sentence; a 404 there is worse than no link.
- **Verify the ZeroWater PFAS claim**: the quick-pick highlight asserts "Stronger pick for PFAS and heavy-metal concerns". Confirm the catalogue entry for `zerowater-12-cup` actually lists PFAS reduction, otherwise the card's own limitations block will contradict the highlight.
- **Zero-flag copy overclaims generically**: "this pick can improve taste and reduce common chlorine or metals" is emitted for any hero product with no product data. Soften to "can improve taste; check what it removes below" or pass the product's `removes` list in.
- **`getTransparentLimitations` regex is fragile**: it misses curly apostrophes ("Doesn't") and caps at 2 items, which can hide a third health-relevant limitation. Normalize `item.replace(/\u2019/g, "'")` before testing, and consider dropping the slice.
- **Analytics label accuracy** (lane-2 overlap, noting since it affects reason honesty): `FilterCards` hard-codes `pathname="/filters"` and `pageType="filter-list"` even though the component is used on guide pages; and `waterScoreBand` thresholds (>=7 good, >=4 attention) should be confirmed against `getScoreColor` bands so the logged band matches what the user actually saw. `postcodeSearch` now fires two events; make sure only one is counted as the conversion in GA4.

Good calls worth keeping: outward-postcode-only payloads, the honest "does not directly match" branch with a "test your water first" nudge, disclosure above the CTA rather than below, and moving from "certified to remove" to "lists reduction for" where certification isn't verified per product.
