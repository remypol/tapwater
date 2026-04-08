# Content Pages — Design Spec

**Date:** 2026-04-08
**Status:** Approved

---

## Overview

High-value content pages targeting buyer-intent and informational keywords. Four brand comparison pages (data-driven template), three health/lifestyle guides (editorial pages). All designed to drive organic traffic and affiliate revenue.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Comparison architecture | Data-driven template at `/compare/filter/[brand1]/vs/[brand2]` | Same pattern as existing city comparisons. One component, 4+ pages. Easy to extend. |
| Health guides architecture | Static content in existing `/guides/[slug]` system | Unique editorial content per guide. No template needed. |
| Product data | Reuse existing `FilterProduct` from `src/lib/products.ts` | Products already have price, rating, pros, cons, certifications, affiliate URLs. |

---

## Brand Comparison Pages

### Route

`/compare/filter/[brand1]/vs/[brand2]`

Both directions work — `/compare/filter/brita/vs/zerowater` and `/compare/filter/zerowater/vs/brita` render identical content. Canonical URL points to the alphabetically-first brand order.

### Config

New file: `src/lib/brand-comparisons.ts`

```typescript
interface BrandComparison {
  brand1Slug: string;
  brand2Slug: string;
  brand1ProductId: string;  // maps to FilterProduct.id in products.ts
  brand2ProductId: string;
  keyDifference: string;    // one-sentence hook
  verdict: string;          // 2-3 sentence recommendation
  brand1BestFor: string;    // "Best for..." one-liner
  brand2BestFor: string;
  comparisonPoints: Array<{
    category: string;       // e.g. "Filtration", "Price", "Ease of Use"
    brand1: string;         // brand1's strength/weakness
    brand2: string;
    winner: "brand1" | "brand2" | "tie";
  }>;
  faqs: Array<{ question: string; answer: string }>;
}
```

### The 4 Comparisons

| brand1Slug | brand2Slug | brand1ProductId | brand2ProductId |
|------------|------------|-----------------|-----------------|
| brita | zerowater | brita-marella | zerowater-12-cup |
| brita | waterdrop | brita-marella | waterdrop-chubby-10-cup |
| zerowater | waterdrop | zerowater-12-cup | waterdrop-chubby-10-cup |
| waterdrop | frizzlife | waterdrop-d6-600 | frizzlife-pd600 |

Product IDs must match existing entries in `src/lib/products.ts`. Verify exact IDs during implementation by reading the products file.

### Page Structure

1. **Hero** — "[Brand1] vs [Brand2]: Which Water Filter Is Better?"
   - Subtitle with category context (e.g. "Comparing the two most popular water filter jugs in the UK")
   - Year badge for freshness

2. **Quick verdict** — coloured card with the winner and one-sentence reason

3. **Side-by-side specs table**
   - Price, rating, category, certifications
   - What each removes (from `FilterProduct.removes`)
   - Flow rate, filter life, annual cost (from product data)

4. **Key differences** — 4-5 comparison points with winner indicators

5. **Product cards** — both products using existing `ProductCard` component (with affiliate links)

6. **FAQ** — 3-4 comparison-specific questions with JSON-LD FAQSchema

7. **Postcode CTA** — "Not sure what's in your water? Check your postcode" with `PostcodeSearch` component

### SEO

- Title: `[Brand1] vs [Brand2] UK (2026) | TapWater.uk` (≤60 chars)
- Description: `[Brand1] vs [Brand2] compared. Price, filtration, certifications. Which UK water filter is better? Independent analysis.` (≤155 chars)
- Schema: FAQSchema JSON-LD
- Canonical: alphabetically-first brand order
- `revalidate = 86400`

### Static Generation

`generateStaticParams()` produces all valid pairs (both directions):
```
/compare/filter/brita/vs/zerowater
/compare/filter/zerowater/vs/brita
/compare/filter/brita/vs/waterdrop
/compare/filter/waterdrop/vs/brita
/compare/filter/zerowater/vs/waterdrop
/compare/filter/waterdrop/vs/zerowater
/compare/filter/waterdrop/vs/frizzlife
/compare/filter/frizzlife/vs/waterdrop
```

8 URLs total from 4 comparisons.

---

## Health & Lifestyle Guides

### Route

Existing `/guides/[slug]` — no new route needed. Add 3 new slugs to the guides system.

### Guide 1: `water-quality-pregnancy`

**Title:** Water Quality and Pregnancy: What You Need to Know

**Sections:**
- Why water quality matters during pregnancy (lead, nitrate, PFAS exposure risks)
- What the NHS and WHO recommend
- Contaminants to watch: lead (neurological), nitrate (blue baby syndrome), PFAS (developmental)
- How to check your water (postcode search CTA)
- Filter recommendations for pregnant women (reverse osmosis for lead/PFAS, link to `/filters/reverse-osmosis`)
- FAQ (4 questions)

**Internal links:** `/contaminant/lead`, `/contaminant/nitrate`, `/contaminant/pfas`, `/filters/reverse-osmosis`

### Guide 2: `water-and-eczema`

**Title:** Can Tap Water Make Eczema Worse?

**Sections:**
- The hard water and eczema connection (University of Sheffield research)
- Chlorine sensitivity and skin irritation
- How to check your water hardness (link to `/hardness`)
- Shower filter recommendations (link to `/filters/shower`)
- Whole-house solutions for severe cases (link to `/filters/whole-house`)
- FAQ (4 questions)

**Internal links:** `/hardness`, `/filters/shower`, `/filters/whole-house`, `/guides/water-hardness-map`

### Guide 3: `moving-house-water-check`

**Title:** Moving House? Check Your New Area's Water Quality

**Sections:**
- Why water quality varies by postcode (different suppliers, pipe age, source water)
- What to check: safety score, contaminants flagged, PFAS status, hardness
- How to use TapWater.uk to compare areas (postcode search CTA prominent)
- Common surprises when moving (hard water areas, old lead pipes in pre-1970 homes)
- What to do if your new area has poor water quality (filter options)
- FAQ (3 questions)

**Internal links:** `/postcode/[district]`, `/city/[slug]`, `/hardness`, `/guides/lead-pipes-uk`

### SEO (all 3 guides)

- Titles ≤60 chars (before template suffix)
- Descriptions ≤155 chars
- FAQSchema JSON-LD on each
- ArticleSchema JSON-LD
- `revalidate = 86400`

---

## Sitemap & Internal Linking Updates

### Sitemap (`src/app/sitemap.ts`)

Add:
- 8 brand comparison URLs (4 pairs x 2 directions)
- 3 new guide slugs to `GUIDE_SLUGS` array

### Compare Hub (`/compare`)

If a compare hub page exists, add a "Filter Comparisons" section listing the brand comparison pages.

### Cross-linking

- Comparison pages link to: relevant `/filters/[category]` page, both product detail pages if they exist
- Health guides link to: relevant contaminant pages, filter category pages, postcode search
- Existing filter category pages could link to relevant comparisons (future enhancement, not in this spec)

---

## Files

### New Files

| File | Purpose |
|------|---------|
| `src/lib/brand-comparisons.ts` | Comparison config data (4 entries) |
| `src/app/compare/filter/[brand1]/vs/[brand2]/page.tsx` | Brand comparison template page |
| Content additions to `src/app/guides/[slug]/page.tsx` | 3 new guide sections |

### Modified Files

| File | Change |
|------|--------|
| `src/app/guides/[slug]/page.tsx` | Add 3 new slug cases with content |
| `src/app/sitemap.ts` | Add comparison URLs + 3 guide slugs |
| `src/app/compare/page.tsx` | Add filter comparisons section (if hub exists) |

---

## Dependencies

No new packages. Uses existing:
- `ProductCard` component
- `PostcodeSearch` component
- `FilterProduct` type and product data
- `BreadcrumbSchema`, `FAQSchema`, `ArticleSchema` from json-ld
- `ScrollReveal` for animations
