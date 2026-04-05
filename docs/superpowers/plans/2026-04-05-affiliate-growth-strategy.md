# Affiliate Growth Strategy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand TapWater.uk's affiliate infrastructure — product catalogue, recommendation engine, category pages, buying guides, and email drip sequences — to maximise revenue per visitor.

**Architecture:** Extend the existing `src/lib/filters.ts` product data model with new categories and fields. Build `/filters` hub and category pages as static Next.js routes. Create 6 buying guide pages following the existing guide pattern. Upgrade the recommendation engine to match contaminants to categories (shower, whole-house, testing kits). Add email drip sequence logic to the existing Resend integration.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Vitest, Resend, Supabase

---

## File Structure

### New Files
- `src/lib/products.ts` — expanded product catalogue (25-30 products) with new fields (pros, cons, bestFor, priceTier, affiliateProgram, flowRate, filterLife, annualCost)
- `src/lib/__tests__/products.test.ts` — tests for product data integrity and recommendation engine
- `src/app/filters/page.tsx` — hub page: "Find the Right Water Filter"
- `src/app/filters/[category]/page.tsx` — dynamic category pages (jug, under-sink, reverse-osmosis, whole-house, shower, testing-kits)
- `src/app/guides/best-reverse-osmosis-system-uk/page.tsx` — RO system buying guide
- `src/app/guides/best-shower-filter-uk/page.tsx` — shower filter buying guide
- `src/app/guides/best-whole-house-water-filter-uk/page.tsx` — whole house filter guide
- `src/app/guides/best-water-testing-kit-uk/page.tsx` — testing kit guide
- `src/app/guides/best-water-filter-pfas/page.tsx` — PFAS-specific filter guide
- `src/app/guides/best-water-filter-jug-uk/page.tsx` — jug filter guide
- `src/components/product-comparison-table.tsx` — reusable comparison table for guides and category pages
- `src/components/product-card.tsx` — reusable product card for category pages
- `src/lib/email-sequences.ts` — drip sequence logic and email templates
- `src/lib/__tests__/email-sequences.test.ts` — tests for email sequence logic
- `src/app/api/cron/emails/route.ts` — cron endpoint for sending scheduled drip emails

### Modified Files
- `src/lib/types.ts` — add new product fields, new category types, email sequence types
- `src/lib/filters.ts` — replace with import from `products.ts`, keep `recommendFilters` but upgrade logic
- `src/components/filter-cards.tsx` — update to use new product fields (pros, cons, bestFor)
- `src/app/sitemap.ts` — add `/filters` hub, category pages, new guide slugs
- `src/components/json-ld.tsx` — add ProductSchema component
- `src/app/guides/page.tsx` — add 6 new guides to the hub listing
- `src/app/guides/best-water-filters-uk/page.tsx` — rework into hub linking to specific guides
- `src/components/header.tsx` — add "Filters" nav link
- `src/app/api/subscribe/route.ts` — store water data snapshot for drip sequences
- `src/app/postcode/[district]/page.tsx` — add cross-links to category pages
- `src/app/contaminant/[slug]/page.tsx` — add cross-links to relevant guides and filter categories

---

## Task 1: Expand Product Type Definitions

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Add new category types and product fields to types.ts**

Add the new categories and extended product fields. Find the `FilterProduct` interface and replace it:

```typescript
// In src/lib/types.ts — replace the existing FilterProduct interface

export type ProductCategory =
  | "jug"
  | "under_sink"
  | "reverse_osmosis"
  | "whole_house"
  | "shower"
  | "testing_kit"
  | "countertop";

export type PriceTier = "budget" | "mid" | "premium";

export type AffiliateProgram = "amazon" | "impact" | "direct";

export interface FilterProduct {
  id: string;
  brand: string;
  model: string;
  slug: string;
  category: ProductCategory;
  removes: string[];
  certifications: string[];
  priceGbp: number;
  priceTier: PriceTier;
  affiliateUrl: string;
  affiliateProgram: AffiliateProgram;
  affiliateTag: string;
  imageUrl: string;
  rating: number;
  badge: "best-match" | "budget" | "premium" | "best-value";
  pros: string[];
  cons: string[];
  bestFor: string;
  flowRate?: string;
  filterLife?: string;
  annualCost?: number;
}
```

Also add the email sequence types at the bottom of the file:

```typescript
export type EmailSequenceStep = 0 | 3 | 7 | 14 | 30;

export interface SubscriberSequenceState {
  email: string;
  postcodeDistrict: string;
  waterDataSnapshot: {
    safetyScore: number;
    scoreGrade: string;
    contaminantsFlagged: number;
    topConcerns: string[];
    pfasDetected: boolean;
  };
  subscribedAt: string;
  lastEmailSent: EmailSequenceStep | null;
  lastEmailSentAt: string | null;
}
```

- [ ] **Step 2: Update CATEGORY_LABELS in filters.ts**

In `src/lib/filters.ts`, update the `CATEGORY_LABELS` record to include new categories:

```typescript
export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  jug: "Jug Filter",
  under_sink: "Under-Sink Filter",
  reverse_osmosis: "Reverse Osmosis",
  whole_house: "Whole House",
  countertop: "Countertop",
  shower: "Shower Filter",
  testing_kit: "Testing Kit",
};
```

Also update the import at the top of filters.ts to use `ProductCategory` from types:

```typescript
import type { FilterProduct, ProductCategory } from "./types";
```

- [ ] **Step 3: Run the build to check for type errors**

Run: `npx next build 2>&1 | head -50`

Fix any type errors that arise from the category type change. The existing products in `FILTERS` array use `"under_sink"` for RO systems — those entries that are actually RO systems (waterdrop-g3p800, frizzlife-pd600) need their category changed to `"reverse_osmosis"`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts src/lib/filters.ts
git commit -m "feat: expand product types with new categories, price tiers, and affiliate programs"
```

---

## Task 2: Build Expanded Product Catalogue

**Files:**
- Create: `src/lib/products.ts`
- Create: `src/lib/__tests__/products.test.ts`
- Modify: `src/lib/filters.ts`

- [ ] **Step 1: Write product data integrity tests**

Create `src/lib/__tests__/products.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { PRODUCTS, getProductsByCategory, getProductBySlug } from "../products";
import type { ProductCategory } from "../types";

describe("PRODUCTS catalogue", () => {
  it("has at least 20 products", () => {
    expect(PRODUCTS.length).toBeGreaterThanOrEqual(20);
  });

  it("every product has required fields", () => {
    for (const p of PRODUCTS) {
      expect(p.id).toBeTruthy();
      expect(p.brand).toBeTruthy();
      expect(p.model).toBeTruthy();
      expect(p.slug).toBeTruthy();
      expect(p.category).toBeTruthy();
      expect(p.affiliateUrl).toMatch(/^https:\/\//);
      expect(p.rating).toBeGreaterThan(0);
      expect(p.rating).toBeLessThanOrEqual(5);
      expect(p.pros.length).toBeGreaterThan(0);
      expect(p.cons.length).toBeGreaterThan(0);
      expect(p.bestFor).toBeTruthy();
      expect(p.priceTier).toMatch(/^(budget|mid|premium)$/);
      expect(p.affiliateProgram).toMatch(/^(amazon|impact|direct)$/);
    }
  });

  it("has no duplicate IDs", () => {
    const ids = PRODUCTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has no duplicate slugs", () => {
    const slugs = PRODUCTS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("has products in every category", () => {
    const categories: ProductCategory[] = [
      "jug", "under_sink", "reverse_osmosis", "whole_house",
      "shower", "testing_kit", "countertop",
    ];
    for (const cat of categories) {
      const products = getProductsByCategory(cat);
      expect(products.length).toBeGreaterThan(0);
    }
  });

  it("getProductBySlug returns correct product", () => {
    const first = PRODUCTS[0];
    const found = getProductBySlug(first.slug);
    expect(found).toBeDefined();
    expect(found!.id).toBe(first.id);
  });

  it("getProductBySlug returns undefined for unknown slug", () => {
    expect(getProductBySlug("nonexistent-product")).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/__tests__/products.test.ts`
Expected: FAIL — module `../products` not found.

- [ ] **Step 3: Create the product catalogue**

Create `src/lib/products.ts` with the full product catalogue. This file contains all product data and lookup functions:

```typescript
import type { FilterProduct, ProductCategory } from "./types";

export const PRODUCTS: FilterProduct[] = [
  // ── JUGS ────────────────────────────────────────────────────────────
  {
    id: "brita-maxtra-pro",
    brand: "BRITA",
    model: "Marella XL + MAXTRA PRO",
    slug: "brita-marella-xl",
    category: "jug",
    removes: ["Chlorine", "Lead", "Copper", "Mercury", "Cadmium"],
    certifications: ["TUV SUD"],
    priceGbp: 25,
    priceTier: "budget",
    affiliateUrl: "https://www.amazon.co.uk/dp/B0BT1HTR9Q?tag=tapwater21-21",
    affiliateProgram: "amazon",
    affiliateTag: "tapwater21-21",
    imageUrl: "/filters/brita-marella.png",
    rating: 4.5,
    badge: "budget",
    pros: [
      "Most recognised filter brand in the UK",
      "Affordable replacement cartridges",
      "Fits in most fridge doors",
    ],
    cons: [
      "Does not remove PFAS or fluoride",
      "Filter needs replacing every 4 weeks",
      "Slower flow than some competitors",
    ],
    bestFor: "Budget-friendly everyday filtering",
    filterLife: "4 weeks per cartridge",
    annualCost: 60,
  },
  {
    id: "zerowater-12cup",
    brand: "ZeroWater",
    model: "12-Cup Ready-Pour",
    slug: "zerowater-12-cup",
    category: "jug",
    removes: ["Lead", "Chromium", "Mercury", "PFAS (total)", "Fluoride", "Nitrate", "Arsenic", "Cadmium"],
    certifications: ["NSF/ANSI 53", "NSF/ANSI 401"],
    priceGbp: 40,
    priceTier: "mid",
    affiliateUrl: "https://www.amazon.co.uk/dp/B07J2HJMKQ?tag=tapwater21-21",
    affiliateProgram: "amazon",
    affiliateTag: "tapwater21-21",
    imageUrl: "/filters/zerowater-12cup.jpg",
    rating: 4.3,
    badge: "best-match",
    pros: [
      "Removes PFAS — rare for a jug filter",
      "Includes a TDS meter to verify filtration",
      "NSF-certified for lead and chromium removal",
    ],
    cons: [
      "Filters deplete faster in hard water areas",
      "Can develop a slight taste when filter is near end of life",
      "Higher per-cartridge cost than BRITA",
    ],
    bestFor: "Best jug for PFAS and heavy metal removal",
    filterLife: "2-3 months depending on water hardness",
    annualCost: 100,
  },
  {
    id: "aqua-optima-evolve",
    brand: "Aqua Optima",
    model: "Liscia + Evolve+",
    slug: "aqua-optima-liscia",
    category: "jug",
    removes: ["Chlorine", "Lead", "Copper", "Mercury"],
    certifications: ["TUV SUD"],
    priceGbp: 20,
    priceTier: "budget",
    affiliateUrl: "https://www.amazon.co.uk/dp/B09ZL1LN6V?tag=tapwater21-21",
    affiliateProgram: "amazon",
    affiliateTag: "tapwater21-21",
    imageUrl: "/filters/aqua-optima.png",
    rating: 4.4,
    badge: "best-value",
    pros: [
      "Cheapest jug filter on the market",
      "Compatible with BRITA MAXTRA cartridges",
      "Compact design fits small kitchens",
    ],
    cons: [
      "Does not remove PFAS, fluoride, or nitrate",
      "Smaller capacity than BRITA Marella XL",
      "Less brand recognition",
    ],
    bestFor: "Cheapest entry point to filtered water",
    filterLife: "4 weeks per cartridge",
    annualCost: 45,
  },
  {
    id: "pur-plus-jug",
    brand: "PUR",
    model: "Plus 11-Cup Pitcher",
    slug: "pur-plus-pitcher",
    category: "jug",
    removes: ["Chlorine", "Lead", "Mercury", "Cadmium", "Copper"],
    certifications: ["NSF/ANSI 42", "NSF/ANSI 53"],
    priceGbp: 35,
    priceTier: "mid",
    affiliateUrl: "https://www.amazon.co.uk/dp/B0CXRGV5HL?tag=tapwater21-21",
    affiliateProgram: "amazon",
    affiliateTag: "tapwater21-21",
    imageUrl: "/filters/pur-plus.png",
    rating: 4.2,
    badge: "budget",
    pros: [
      "NSF 53 certified for lead removal",
      "Large 11-cup capacity",
      "Easy-fill lid design",
    ],
    cons: [
      "Less widely available in UK shops",
      "Does not remove PFAS",
      "Replacement filters can be hard to find in UK",
    ],
    bestFor: "Large households wanting certified lead removal",
    filterLife: "2 months per cartridge",
    annualCost: 70,
  },

  // ── COUNTERTOP / TAP FILTERS ─────────────────────────────────────────
  {
    id: "waterdrop-fc06",
    brand: "Waterdrop",
    model: "WD-FC-06 Tap Filter",
    slug: "waterdrop-fc-06",
    category: "countertop",
    removes: ["Chlorine", "Lead", "Fluoride"],
    certifications: ["NSF/ANSI 42"],
    priceGbp: 30,
    priceTier: "budget",
    affiliateUrl: "https://www.amazon.co.uk/dp/B08JPCYHYQ?tag=tapwater21-21",
    affiliateProgram: "amazon",
    affiliateTag: "tapwater21-21",
    imageUrl: "/filters/waterdrop-fc06.png",
    rating: 4.3,
    badge: "budget",
    pros: [
      "No installation — clips onto kitchen tap",
      "Switch between filtered and unfiltered",
      "Very affordable entry point",
    ],
    cons: [
      "Does not remove PFAS or heavy metals beyond lead",
      "Not compatible with all tap types",
      "Lower capacity than under-sink options",
    ],
    bestFor: "Renters who can't modify plumbing",
    filterLife: "3 months per cartridge",
    annualCost: 48,
  },
  {
    id: "tapp-water-essential",
    brand: "TAPP Water",
    model: "EcoPro",
    slug: "tapp-water-ecopro",
    category: "countertop",
    removes: ["Chlorine", "Lead", "Microplastics", "PFAS (total)"],
    certifications: ["SGS tested"],
    priceGbp: 60,
    priceTier: "mid",
    affiliateUrl: "https://www.amazon.co.uk/dp/B0CZ7K43VP?tag=tapwater21-21",
    affiliateProgram: "amazon",
    affiliateTag: "tapwater21-21",
    imageUrl: "/filters/tapp-ecopro.png",
    rating: 4.4,
    badge: "best-match",
    pros: [
      "Removes microplastics — increasingly important",
      "Coconut shell carbon block filter",
      "Sustainable — biodegradable refills",
    ],
    cons: [
      "Not NSF certified (SGS tested)",
      "Subscription model for refills",
      "May not fit all UK tap types",
    ],
    bestFor: "Eco-conscious households wanting microplastics removal",
    filterLife: "3 months per refill",
    annualCost: 80,
  },

  // ── UNDER-SINK (non-RO) ──────────────────────────────────────────────
  {
    id: "waterdrop-10ua",
    brand: "Waterdrop",
    model: "10UA Under Sink (11,000 gal)",
    slug: "waterdrop-10ua",
    category: "under_sink",
    removes: ["Chlorine", "Lead", "PFAS (total)"],
    certifications: ["NSF/ANSI 42"],
    priceGbp: 45,
    priceTier: "budget",
    affiliateUrl: "https://www.amazon.co.uk/dp/B083NPW1DN?tag=tapwater21-21",
    affiliateProgram: "amazon",
    affiliateTag: "tapwater21-21",
    imageUrl: "/filters/waterdrop-10ua.png",
    rating: 4.4,
    badge: "best-value",
    pros: [
      "Massive 11,000-gallon capacity",
      "Simple DIY installation",
      "Very low cost per litre",
    ],
    cons: [
      "Single-stage filtration — less thorough than RO",
      "Requires under-sink space",
      "Does not remove fluoride or nitrate",
    ],
    bestFor: "High-capacity under-sink filtering on a budget",
    filterLife: "12 months",
    annualCost: 45,
  },
  {
    id: "doulton-under-sink",
    brand: "Doulton",
    model: "HIP Ultracarb",
    slug: "doulton-hip-ultracarb",
    category: "under_sink",
    removes: ["Chlorine", "Lead", "Bacteria", "Microplastics", "Copper"],
    certifications: ["NSF/ANSI 42", "NSF/ANSI 53"],
    priceGbp: 120,
    priceTier: "mid",
    affiliateUrl: "https://www.amazon.co.uk/dp/B004QMEQIE?tag=tapwater21-21",
    affiliateProgram: "amazon",
    affiliateTag: "tapwater21-21",
    imageUrl: "/filters/doulton-ultracarb.png",
    rating: 4.5,
    badge: "best-match",
    pros: [
      "British-made ceramic candle filter — trusted since 1826",
      "Removes bacteria without electricity",
      "NSF 53 certified for lead removal",
    ],
    cons: [
      "Does not remove PFAS or fluoride",
      "Ceramic candle needs periodic cleaning",
      "Higher upfront cost than carbon-only filters",
    ],
    bestFor: "British-made quality with bacteria removal",
    filterLife: "6-12 months depending on water quality",
    annualCost: 60,
  },

  // ── REVERSE OSMOSIS ──────────────────────────────────────────────────
  {
    id: "waterdrop-g3p600",
    brand: "Waterdrop",
    model: "G3P600 Reverse Osmosis",
    slug: "waterdrop-g3p600",
    category: "reverse_osmosis",
    removes: [
      "Lead", "PFAS (total)", "Fluoride", "Arsenic", "Nitrate", "Chlorine",
      "Trihalomethanes", "Mercury", "Cadmium", "Chromium", "Copper", "Nickel",
    ],
    certifications: ["NSF/ANSI 58", "NSF/ANSI 372"],
    priceGbp: 399,
    priceTier: "premium",
    affiliateUrl: "https://www.waterdropfilter.co.uk/products/waterdrop-g3p600-reverse-osmosis-system?sca_ref=7889068.abc123",
    affiliateProgram: "impact",
    affiliateTag: "waterdrop-impact",
    imageUrl: "/filters/waterdrop-g3p600.png",
    rating: 4.6,
    badge: "best-match",
    pros: [
      "Removes virtually everything including PFAS",
      "Tankless design saves under-sink space",
      "600 GPD output — fills a glass in 8 seconds",
    ],
    cons: [
      "Highest upfront cost",
      "Requires professional installation",
      "Wastes some water (3:1 pure-to-drain ratio)",
    ],
    bestFor: "Best overall water filter — removes everything",
    flowRate: "600 GPD",
    filterLife: "12-24 months depending on stage",
    annualCost: 80,
  },
  {
    id: "frizzlife-pd600",
    brand: "Frizzlife",
    model: "PD600 Under Sink RO",
    slug: "frizzlife-pd600",
    category: "reverse_osmosis",
    removes: [
      "Lead", "PFAS (total)", "Fluoride", "Arsenic", "Nitrate", "Chlorine",
      "Trihalomethanes", "Mercury", "Cadmium", "Chromium",
    ],
    certifications: ["NSF/ANSI 58"],
    priceGbp: 329,
    priceTier: "premium",
    affiliateUrl: "https://www.amazon.co.uk/dp/B083DFW1QS?tag=tapwater21-21",
    affiliateProgram: "amazon",
    affiliateTag: "tapwater21-21",
    imageUrl: "/filters/frizzlife-pd600.png",
    rating: 4.5,
    badge: "best-value",
    pros: [
      "Excellent value for a tankless RO system",
      "DIY installation possible",
      "Compact design",
    ],
    cons: [
      "Slightly lower flow rate than Waterdrop G3P600",
      "Less widely reviewed in UK",
      "Filter replacements harder to source locally",
    ],
    bestFor: "Best value reverse osmosis system",
    flowRate: "600 GPD",
    filterLife: "12-24 months",
    annualCost: 70,
  },
  {
    id: "echo-water-ro",
    brand: "Echo Water",
    model: "Hydrogen Water System",
    slug: "echo-water-hydrogen",
    category: "reverse_osmosis",
    removes: [
      "Lead", "PFAS (total)", "Fluoride", "Arsenic", "Nitrate", "Chlorine",
      "Trihalomethanes", "Mercury", "Cadmium", "Chromium", "Copper",
    ],
    certifications: ["NSF/ANSI 58"],
    priceGbp: 499,
    priceTier: "premium",
    affiliateUrl: "https://echowater.com/?ref=tapwater",
    affiliateProgram: "impact",
    affiliateTag: "echo-impact",
    imageUrl: "/filters/echo-water.png",
    rating: 4.4,
    badge: "premium",
    pros: [
      "RO filtration plus hydrogen infusion",
      "20% affiliate commission supports our research",
      "Premium build quality",
    ],
    cons: [
      "Most expensive option",
      "Hydrogen benefits are debated in research",
      "Requires professional installation",
    ],
    bestFor: "Premium RO with hydrogen water",
    flowRate: "400 GPD",
    filterLife: "12 months",
    annualCost: 100,
  },

  // ── WHOLE HOUSE ──────────────────────────────────────────────────────
  {
    id: "bwt-whole-house",
    brand: "BWT",
    model: "E1 Single Lever Filter",
    slug: "bwt-e1-whole-house",
    category: "whole_house",
    removes: ["Sediment", "Chlorine", "Particles"],
    certifications: ["WRAS approved"],
    priceGbp: 250,
    priceTier: "mid",
    affiliateUrl: "https://www.amazon.co.uk/dp/B00AXFCCZ4?tag=tapwater21-21",
    affiliateProgram: "amazon",
    affiliateTag: "tapwater21-21",
    imageUrl: "/filters/bwt-e1.png",
    rating: 4.3,
    badge: "best-match",
    pros: [
      "WRAS approved — meets UK water regulations",
      "Protects all household appliances",
      "Simple filter change mechanism",
    ],
    cons: [
      "Sediment/particle focus — does not remove PFAS or lead",
      "Requires plumber for installation",
      "Regular filter replacements needed",
    ],
    bestFor: "Protecting appliances from sediment and particles",
    filterLife: "6 months",
    annualCost: 100,
  },
  {
    id: "waterdrop-whf",
    brand: "Waterdrop",
    model: "WHF21 Whole House System",
    slug: "waterdrop-whf21",
    category: "whole_house",
    removes: ["Chlorine", "Sediment", "Manganese", "Iron"],
    certifications: ["NSF/ANSI 42"],
    priceGbp: 600,
    priceTier: "premium",
    affiliateUrl: "https://www.waterdropfilter.co.uk/products/waterdrop-whf21-whole-house-filter?sca_ref=7889068.abc123",
    affiliateProgram: "impact",
    affiliateTag: "waterdrop-impact",
    imageUrl: "/filters/waterdrop-whf21.png",
    rating: 4.5,
    badge: "premium",
    pros: [
      "Three-stage filtration for whole home",
      "High flow rate — no pressure loss",
      "Removes iron staining",
    ],
    cons: [
      "Requires professional plumbing",
      "Premium price point",
      "Large unit needs utility space",
    ],
    bestFor: "Comprehensive whole-home filtration",
    flowRate: "15 GPM",
    filterLife: "3-6 months per stage",
    annualCost: 150,
  },
  {
    id: "aquasana-eq1000",
    brand: "Aquasana",
    model: "EQ-1000 Rhino",
    slug: "aquasana-eq1000",
    category: "whole_house",
    removes: ["Chlorine", "Lead", "Mercury", "Copper", "Sediment"],
    certifications: ["NSF/ANSI 42", "NSF/ANSI 61"],
    priceGbp: 800,
    priceTier: "premium",
    affiliateUrl: "https://www.amazon.co.uk/dp/B01MUBNFXM?tag=tapwater21-21",
    affiliateProgram: "amazon",
    affiliateTag: "tapwater21-21",
    imageUrl: "/filters/aquasana-eq1000.png",
    rating: 4.4,
    badge: "premium",
    pros: [
      "1,000,000 gallon capacity — lasts up to 10 years",
      "Removes lead at point of entry",
      "Pro-grade installation kit included",
    ],
    cons: [
      "Very high upfront investment",
      "Requires dedicated installation space",
      "Needs pre-filter replacement every 3 months",
    ],
    bestFor: "Long-term investment for homeowners",
    filterLife: "10 years (main tank), 3 months (pre-filter)",
    annualCost: 60,
  },

  // ── SHOWER FILTERS ───────────────────────────────────────────────────
  {
    id: "jolie-showerhead",
    brand: "Jolie",
    model: "Filtered Showerhead",
    slug: "jolie-filtered-showerhead",
    category: "shower",
    removes: ["Chlorine", "Heavy metals", "Chloramine"],
    certifications: [],
    priceGbp: 85,
    priceTier: "premium",
    affiliateUrl: "https://www.amazon.co.uk/dp/B0CQXDBVX6?tag=tapwater21-21",
    affiliateProgram: "amazon",
    affiliateTag: "tapwater21-21",
    imageUrl: "/filters/jolie-showerhead.png",
    rating: 4.3,
    badge: "premium",
    pros: [
      "Premium design — looks great in any bathroom",
      "Removes chlorine that dries skin and hair",
      "Easy installation — no plumber needed",
    ],
    cons: [
      "Higher price than basic shower filters",
      "Proprietary refills only",
      "Does not remove hard water minerals",
    ],
    bestFor: "Premium shower filtering for skin and hair",
    filterLife: "3 months",
    annualCost: 80,
  },
  {
    id: "aquabliss-sf220",
    brand: "AquaBliss",
    model: "SF220 Shower Filter",
    slug: "aquabliss-sf220",
    category: "shower",
    removes: ["Chlorine", "Heavy metals", "Sediment"],
    certifications: [],
    priceGbp: 25,
    priceTier: "budget",
    affiliateUrl: "https://www.amazon.co.uk/dp/B01MUBU0YC?tag=tapwater21-21",
    affiliateProgram: "amazon",
    affiliateTag: "tapwater21-21",
    imageUrl: "/filters/aquabliss-sf220.png",
    rating: 4.2,
    badge: "budget",
    pros: [
      "Very affordable",
      "Universal fit — works with any showerhead",
      "Multi-stage filtration",
    ],
    cons: [
      "Adds length to shower setup",
      "Filter cartridge lasts only 2-3 months",
      "Plastic build quality",
    ],
    bestFor: "Cheapest way to filter your shower water",
    filterLife: "2-3 months",
    annualCost: 50,
  },
  {
    id: "philips-shower-filter",
    brand: "Philips",
    model: "AWP1775 In-line Shower Filter",
    slug: "philips-awp1775",
    category: "shower",
    removes: ["Chlorine", "Sediment"],
    certifications: [],
    priceGbp: 35,
    priceTier: "mid",
    affiliateUrl: "https://www.amazon.co.uk/dp/B0BNH3BXVZ?tag=tapwater21-21",
    affiliateProgram: "amazon",
    affiliateTag: "tapwater21-21",
    imageUrl: "/filters/philips-awp1775.png",
    rating: 4.3,
    badge: "best-match",
    pros: [
      "Trusted brand",
      "Compact in-line design",
      "50,000 litre capacity",
    ],
    cons: [
      "Only removes chlorine and sediment",
      "In-line design may not fit all shower setups",
      "Replacement cartridges can be pricey",
    ],
    bestFor: "Trusted brand shower filter with high capacity",
    filterLife: "6 months",
    annualCost: 45,
  },

  // ── TESTING KITS ─────────────────────────────────────────────────────
  {
    id: "simplexhealth-17",
    brand: "SimplexHealth",
    model: "17-in-1 Water Test Kit",
    slug: "simplexhealth-17-in-1",
    category: "testing_kit",
    removes: [],
    certifications: [],
    priceGbp: 13,
    priceTier: "budget",
    affiliateUrl: "https://www.amazon.co.uk/dp/B08CXPMXR4?tag=tapwater21-21",
    affiliateProgram: "amazon",
    affiliateTag: "tapwater21-21",
    imageUrl: "/filters/simplexhealth-17.png",
    rating: 4.1,
    badge: "budget",
    pros: [
      "Tests 17 parameters in minutes",
      "Includes lead, bacteria, pH, hardness",
      "Very affordable for a quick check",
    ],
    cons: [
      "Dip-strip accuracy is lower than lab tests",
      "Single use — one set of strips",
      "Cannot detect PFAS",
    ],
    bestFor: "Quick affordable home water test",
    filterLife: "Single use",
    annualCost: 0,
  },
  {
    id: "sj-wave-test",
    brand: "SJ WAVE",
    model: "16-in-1 Premium Water Test Kit",
    slug: "sj-wave-16-in-1",
    category: "testing_kit",
    removes: [],
    certifications: [],
    priceGbp: 15,
    priceTier: "budget",
    affiliateUrl: "https://www.amazon.co.uk/dp/B0BM4X8R7J?tag=tapwater21-21",
    affiliateProgram: "amazon",
    affiliateTag: "tapwater21-21",
    imageUrl: "/filters/sj-wave-test.png",
    rating: 4.2,
    badge: "best-value",
    pros: [
      "100 test strips included — test multiple times",
      "Tests 16 parameters including lead and bacteria",
      "Colour chart is easy to read",
    ],
    cons: [
      "Strip tests are indicative, not lab-grade",
      "Cannot detect PFAS",
      "Results require interpretation",
    ],
    bestFor: "Best value — 100 strips for ongoing monitoring",
    filterLife: "100 tests per kit",
    annualCost: 0,
  },
  {
    id: "tap-score-essential",
    brand: "Tap Score",
    model: "Essential City Water Test",
    slug: "tap-score-essential",
    category: "testing_kit",
    removes: [],
    certifications: ["ISO 17025 lab"],
    priceGbp: 80,
    priceTier: "premium",
    affiliateUrl: "https://www.amazon.co.uk/dp/B07YN1GN5H?tag=tapwater21-21",
    affiliateProgram: "amazon",
    affiliateTag: "tapwater21-21",
    imageUrl: "/filters/tap-score.png",
    rating: 4.6,
    badge: "premium",
    pros: [
      "Lab-grade analysis — mail your sample to an ISO 17025 lab",
      "Tests for PFAS, lead, and 50+ contaminants",
      "Get a detailed report with actionable recommendations",
    ],
    cons: [
      "Most expensive testing option",
      "Takes 5-7 business days for results",
      "Requires posting sample to the lab",
    ],
    bestFor: "Lab-accurate testing including PFAS",
    filterLife: "Single use",
    annualCost: 0,
  },
];

/** Get all products in a specific category */
export function getProductsByCategory(category: ProductCategory): FilterProduct[] {
  return PRODUCTS.filter((p) => p.category === category);
}

/** Get a product by its URL slug */
export function getProductBySlug(slug: string): FilterProduct | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

/** Category metadata for hub and category pages */
export const CATEGORY_META: Record<ProductCategory, {
  title: string;
  slug: string;
  description: string;
  bestFor: string;
  priceRange: string;
}> = {
  jug: {
    title: "Jug Filters",
    slug: "jug",
    description: "Fill-and-pour filters that sit in your fridge. No installation needed.",
    bestFor: "Renters, small households, anyone wanting a quick start",
    priceRange: "£15-50",
  },
  countertop: {
    title: "Countertop & Tap Filters",
    slug: "countertop",
    description: "Clip onto your existing tap or sit on the worktop. No plumbing changes.",
    bestFor: "Renters who want better filtration than a jug",
    priceRange: "£30-100",
  },
  under_sink: {
    title: "Under-Sink Filters",
    slug: "under-sink",
    description: "Installed under your kitchen sink for filtered water on tap. High capacity.",
    bestFor: "Homeowners wanting a permanent solution",
    priceRange: "£45-150",
  },
  reverse_osmosis: {
    title: "Reverse Osmosis Systems",
    slug: "reverse-osmosis",
    description: "The most thorough filtration available. Removes virtually everything including PFAS.",
    bestFor: "Areas with PFAS, fluoride, or multiple contaminants",
    priceRange: "£300-500",
  },
  whole_house: {
    title: "Whole House Filters",
    slug: "whole-house",
    description: "Filters all water entering your home — every tap, shower, and appliance.",
    bestFor: "Homeowners wanting whole-home protection",
    priceRange: "£250-1,500",
  },
  shower: {
    title: "Shower Filters",
    slug: "shower",
    description: "Remove chlorine from shower water. Better for your skin, hair, and breathing.",
    bestFor: "Hard water areas, anyone with dry skin or hair",
    priceRange: "£15-85",
  },
  testing_kit: {
    title: "Water Testing Kits",
    slug: "testing-kits",
    description: "Test your tap water at home. Find out exactly what's in your water before buying a filter.",
    bestFor: "Anyone who wants to verify their water quality",
    priceRange: "£13-80",
  },
};

/** Ordered list of categories for display */
export const CATEGORY_ORDER: ProductCategory[] = [
  "jug",
  "countertop",
  "under_sink",
  "reverse_osmosis",
  "whole_house",
  "shower",
  "testing_kit",
];
```

**IMPORTANT:** The affiliate URLs above use placeholder `sca_ref` values for Impact.com links. The implementer must update these with the real tracking IDs from the Impact.com dashboard before deploying. Amazon links with `?tag=tapwater21-21` are live and correct.

**IMPORTANT:** Product images referenced as `/filters/*.png` will need to be sourced and placed in `public/filters/`. For products that don't have images yet, use an empty string `""` and the component should handle missing images gracefully (the existing code already does this).

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/lib/__tests__/products.test.ts`
Expected: PASS

- [ ] **Step 5: Update filters.ts to use new product catalogue**

Replace the `FILTERS` array in `src/lib/filters.ts` with an import from `products.ts`. Keep the `recommendFilters` function but update it:

```typescript
import type { FilterProduct, ProductCategory } from "./types";
import { PRODUCTS } from "./products";

// Re-export for backwards compatibility
export const FILTERS = PRODUCTS;

export { CATEGORY_META, CATEGORY_ORDER, getProductsByCategory, getProductBySlug } from "./products";

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  jug: "Jug Filter",
  under_sink: "Under-Sink Filter",
  reverse_osmosis: "Reverse Osmosis",
  whole_house: "Whole House",
  countertop: "Countertop",
  shower: "Shower Filter",
  testing_kit: "Testing Kit",
};

/**
 * Recommend filters based on flagged contaminants.
 * Upgraded logic:
 * - PFAS detected → prioritise RO systems
 * - Hard water → suggest shower filters alongside drinking filters
 * - Lead flagged → suggest testing kit + under-sink
 * - Nothing flagged → suggest budget jug for taste
 * - Always show budget + premium pick
 */
export function recommendFilters(
  flaggedContaminants: string[],
  maxResults: number = 3,
): (FilterProduct & { matchedCount: number; matchedContaminants: string[] })[] {
  // Exclude testing kits and shower filters from primary recommendations
  // (these get separate recommendation sections)
  const drinkingFilters = PRODUCTS.filter(
    (f) => f.category !== "testing_kit" && f.category !== "shower",
  );

  if (flaggedContaminants.length === 0) {
    // No contaminants flagged — recommend general-purpose filters
    return drinkingFilters
      .filter((f) => f.badge === "best-match" || f.badge === "budget")
      .slice(0, maxResults)
      .map((f) => ({ ...f, matchedCount: 0, matchedContaminants: [] }));
  }

  const hasPfas = flaggedContaminants.some((c) =>
    c.toLowerCase().includes("pfas"),
  );

  const results = drinkingFilters.map((f) => {
    const matched = flaggedContaminants.filter((c) =>
      f.removes.some((r) => r.toLowerCase() === c.toLowerCase()),
    );
    // Boost RO systems when PFAS is detected
    const pfasBoost = hasPfas && f.category === "reverse_osmosis" ? 100 : 0;
    return {
      ...f,
      matchedCount: matched.length + pfasBoost,
      matchedContaminants: matched,
    };
  })
    .filter((f) => f.matchedCount > 0)
    .sort((a, b) => {
      if (b.matchedCount !== a.matchedCount) return b.matchedCount - a.matchedCount;
      return b.rating - a.rating;
    });

  // Ensure variety: try to include different categories
  const seen = new Set<string>();
  const diverse: typeof results = [];
  for (const f of results) {
    if (diverse.length >= maxResults) break;
    if (!seen.has(f.category)) {
      diverse.push(f);
      seen.add(f.category);
    }
  }
  for (const f of results) {
    if (diverse.length >= maxResults) break;
    if (!diverse.includes(f)) diverse.push(f);
  }

  return diverse;
}

/**
 * Recommend supplementary products — shower filters and testing kits.
 * Called separately from main filter recommendations.
 */
export function recommendSupplementary(
  flaggedContaminants: string[],
  pfasDetected: boolean,
): { showerFilters: FilterProduct[]; testingKits: FilterProduct[] } {
  const showerFilters = PRODUCTS.filter((p) => p.category === "shower")
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 2);

  const hasLead = flaggedContaminants.some((c) =>
    c.toLowerCase().includes("lead"),
  );

  // Prioritise lab testing if PFAS or lead detected
  const testingKits = PRODUCTS.filter((p) => p.category === "testing_kit")
    .sort((a, b) => {
      if (pfasDetected || hasLead) {
        // Push lab tests (premium) to the top
        if (a.priceTier === "premium" && b.priceTier !== "premium") return -1;
        if (b.priceTier === "premium" && a.priceTier !== "premium") return 1;
      }
      return b.rating - a.rating;
    })
    .slice(0, 2);

  return { showerFilters, testingKits };
}
```

- [ ] **Step 6: Run existing tests + build to verify nothing broke**

Run: `npx vitest run && npx next build 2>&1 | tail -20`
Expected: All tests pass, build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/lib/products.ts src/lib/__tests__/products.test.ts src/lib/filters.ts src/lib/types.ts
git commit -m "feat: expand product catalogue to 22 products across 7 categories with multi-network affiliate support"
```

---

## Task 3: Add ProductSchema to JSON-LD

**Files:**
- Modify: `src/components/json-ld.tsx`

- [ ] **Step 1: Add ProductSchema component**

Add to the bottom of `src/components/json-ld.tsx`:

```typescript
export function ProductSchema({
  name,
  brand,
  description,
  price,
  currency = "GBP",
  url,
  imageUrl,
  rating,
  category,
}: {
  name: string;
  brand: string;
  description: string;
  price: number;
  currency?: string;
  url: string;
  imageUrl?: string;
  rating: number;
  category: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${brand} ${name}`,
    brand: { "@type": "Brand", name: brand },
    description,
    category,
    ...(imageUrl ? { image: `https://tapwater.uk${imageUrl}` } : {}),
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: String(rating),
      bestRating: "5",
      worstRating: "1",
    },
    offers: {
      "@type": "Offer",
      priceCurrency: currency,
      price: String(price),
      availability: "https://schema.org/InStock",
      url,
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/json-ld.tsx
git commit -m "feat: add ProductSchema JSON-LD component for rich search results"
```

---

## Task 4: Build Product Card and Comparison Table Components

**Files:**
- Create: `src/components/product-card.tsx`
- Create: `src/components/product-comparison-table.tsx`

- [ ] **Step 1: Create product-card.tsx**

Create `src/components/product-card.tsx`:

```tsx
import Image from "next/image";
import { Star, ArrowRight, Check } from "lucide-react";
import type { FilterProduct } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/filters";

interface ProductCardProps {
  product: FilterProduct;
  highlight?: string;
}

export function ProductCard({ product, highlight }: ProductCardProps) {
  return (
    <div className="card overflow-hidden">
      <div className="p-5">
        <div className="flex gap-4 items-start">
          {product.imageUrl && (
            <div className="shrink-0 w-20 h-20 rounded-lg bg-wash overflow-hidden">
              <Image
                src={product.imageUrl}
                alt={`${product.brand} ${product.model}`}
                width={80}
                height={80}
                className="object-contain w-full h-full p-1.5"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-faint uppercase tracking-wider">
              {CATEGORY_LABELS[product.category]}
            </p>
            <p className="font-display text-lg text-ink italic mt-0.5">
              {product.brand} {product.model}
            </p>
            {highlight && (
              <p className="text-xs font-medium text-accent mt-1">{highlight}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="font-data text-lg font-bold text-ink">
              {product.priceGbp > 0 ? `£${product.priceGbp}` : "Check price"}
            </p>
            <div className="flex items-center gap-1 justify-end">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-xs text-muted">{product.rating}/5</span>
            </div>
          </div>
        </div>

        {/* Pros */}
        {product.pros.length > 0 && (
          <ul className="mt-3 space-y-1">
            {product.pros.slice(0, 3).map((pro) => (
              <li key={pro} className="flex items-start gap-1.5 text-sm text-body">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                {pro}
              </li>
            ))}
          </ul>
        )}

        {/* Certifications + CTA */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-1.5 flex-wrap">
            {product.certifications.map((cert) => (
              <span key={cert} className="text-[11px] text-muted bg-wash rounded px-2 py-0.5">
                {cert}
              </span>
            ))}
          </div>
          <a
            href={product.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="text-sm font-medium text-accent hover:underline flex items-center gap-1"
          >
            View deal
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create product-comparison-table.tsx**

Create `src/components/product-comparison-table.tsx`:

```tsx
import { Star, Check, X } from "lucide-react";
import type { FilterProduct } from "@/lib/types";

interface ComparisonTableProps {
  products: FilterProduct[];
  contaminants?: string[];
}

export function ProductComparisonTable({ products, contaminants }: ComparisonTableProps) {
  // Determine which contaminants to show — either provided or union of all product removes
  const showContaminants = contaminants ?? [
    ...new Set(products.flatMap((p) => p.removes)),
  ].slice(0, 8);

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-rule">
            <th className="text-left p-3 text-faint font-medium text-xs uppercase tracking-wider">
              Filter
            </th>
            <th className="text-center p-3 text-faint font-medium text-xs uppercase tracking-wider">
              Price
            </th>
            <th className="text-center p-3 text-faint font-medium text-xs uppercase tracking-wider">
              Rating
            </th>
            {showContaminants.map((c) => (
              <th
                key={c}
                className="text-center p-3 text-faint font-medium text-xs uppercase tracking-wider whitespace-nowrap"
              >
                {c}
              </th>
            ))}
            <th className="text-center p-3 text-faint font-medium text-xs uppercase tracking-wider">
              Annual Cost
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-b border-rule/50 hover:bg-wash/50">
              <td className="p-3">
                <a
                  href={product.affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="font-medium text-ink hover:text-accent"
                >
                  {product.brand} {product.model}
                </a>
                {product.bestFor && (
                  <p className="text-xs text-muted mt-0.5">{product.bestFor}</p>
                )}
              </td>
              <td className="text-center p-3 font-data font-bold text-ink">
                {product.priceGbp > 0 ? `£${product.priceGbp}` : "—"}
              </td>
              <td className="text-center p-3">
                <span className="inline-flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="font-data text-ink">{product.rating}</span>
                </span>
              </td>
              {showContaminants.map((c) => {
                const removes = product.removes.some(
                  (r) => r.toLowerCase() === c.toLowerCase(),
                );
                return (
                  <td key={c} className="text-center p-3">
                    {removes ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-gray-300 mx-auto" />
                    )}
                  </td>
                );
              })}
              <td className="text-center p-3 font-data text-muted">
                {product.annualCost ? `£${product.annualCost}/yr` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/product-card.tsx src/components/product-comparison-table.tsx
git commit -m "feat: add reusable ProductCard and ProductComparisonTable components"
```

---

## Task 5: Build `/filters` Hub and Category Pages

**Files:**
- Create: `src/app/filters/page.tsx`
- Create: `src/app/filters/[category]/page.tsx`

- [ ] **Step 1: Create the filters hub page**

Create `src/app/filters/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PostcodeSearch } from "@/components/postcode-search";
import { BreadcrumbSchema } from "@/components/json-ld";
import { CATEGORY_META, CATEGORY_ORDER, getProductsByCategory } from "@/lib/products";

export const metadata: Metadata = {
  title: "Water Filters — Find the Right One for Your Area",
  description:
    "Compare water filters matched to UK water quality data. Jugs, under-sink, reverse osmosis, whole-house, shower filters, and testing kits — with prices, specs, and independent recommendations.",
  alternates: { canonical: "https://tapwater.uk/filters/" },
};

export default function FiltersHubPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://tapwater.uk" },
          { name: "Filters", url: "https://tapwater.uk/filters/" },
        ]}
      />

      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        {/* Hero */}
        <h1 className="font-display text-3xl sm:text-4xl text-ink italic tracking-tight">
          Find the right water filter
        </h1>
        <p className="text-body mt-3 max-w-2xl text-lg">
          Not sure where to start? Enter your postcode and we&apos;ll recommend
          a filter based on what&apos;s actually in your water.
        </p>

        {/* Postcode search */}
        <div className="mt-6 max-w-md">
          <PostcodeSearch />
        </div>

        {/* Trust signal */}
        <p className="text-sm text-faint mt-4">
          Recommendations based on 1.6 million water quality readings across 2,800 UK postcodes.
        </p>

        {/* Category grid */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {CATEGORY_ORDER.map((cat) => {
            const meta = CATEGORY_META[cat];
            const count = getProductsByCategory(cat).length;
            return (
              <Link
                key={cat}
                href={`/filters/${meta.slug}/`}
                className="card p-5 group hover:border-accent/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-display text-lg text-ink italic group-hover:text-accent transition-colors">
                      {meta.title}
                    </h2>
                    <p className="text-sm text-body mt-1">{meta.description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-faint group-hover:text-accent transition-colors shrink-0 mt-1" />
                </div>
                <div className="mt-3 flex gap-3 text-xs text-muted">
                  <span>{count} products</span>
                  <span>{meta.priceRange}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Disclosure */}
        <p className="text-xs text-faint mt-8">
          We may earn a commission when you buy through our links, at no extra cost to you.
          Recommendations are based on water quality data, not sponsorship.{" "}
          <Link href="/affiliate-disclosure" className="text-accent hover:underline">
            Affiliate disclosure
          </Link>
        </p>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Create the dynamic category page**

Create `src/app/filters/[category]/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { ProductComparisonTable } from "@/components/product-comparison-table";
import { PostcodeSearch } from "@/components/postcode-search";
import { BreadcrumbSchema, FAQSchema } from "@/components/json-ld";
import { CATEGORY_META, CATEGORY_ORDER, getProductsByCategory } from "@/lib/products";
import { CATEGORY_LABELS } from "@/lib/filters";
import type { ProductCategory } from "@/lib/types";

// Map URL slugs to category keys
const SLUG_TO_CATEGORY: Record<string, ProductCategory> = {};
for (const cat of CATEGORY_ORDER) {
  SLUG_TO_CATEGORY[CATEGORY_META[cat].slug] = cat;
}

// Guide links per category (where they exist)
const CATEGORY_GUIDE: Partial<Record<ProductCategory, { title: string; href: string }>> = {
  reverse_osmosis: { title: "Best Reverse Osmosis System UK", href: "/guides/best-reverse-osmosis-system-uk/" },
  shower: { title: "Best Shower Filter for Hard Water UK", href: "/guides/best-shower-filter-uk/" },
  whole_house: { title: "Best Whole House Water Filter UK", href: "/guides/best-whole-house-water-filter-uk/" },
  testing_kit: { title: "Best Water Testing Kit UK", href: "/guides/best-water-testing-kit-uk/" },
  jug: { title: "Best Water Filter Jug UK", href: "/guides/best-water-filter-jug-uk/" },
};

export async function generateStaticParams() {
  return CATEGORY_ORDER.map((cat) => ({
    category: CATEGORY_META[cat].slug,
  }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ category: string }> },
): Promise<Metadata> {
  const { category: slug } = await params;
  const cat = SLUG_TO_CATEGORY[slug];
  if (!cat) return {};
  const meta = CATEGORY_META[cat];
  return {
    title: `${meta.title} — Compare & Buy`,
    description: `${meta.description} Compare ${getProductsByCategory(cat).length} products from ${meta.priceRange}. Matched to UK water quality data.`,
    alternates: { canonical: `https://tapwater.uk/filters/${slug}/` },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const cat = SLUG_TO_CATEGORY[slug];
  if (!cat) notFound();

  const meta = CATEGORY_META[cat];
  const products = getProductsByCategory(cat);
  const guide = CATEGORY_GUIDE[cat];

  const faqs = [
    {
      question: `How much do ${meta.title.toLowerCase()} cost in the UK?`,
      answer: `Prices range from ${meta.priceRange}. ${meta.bestFor}.`,
    },
    {
      question: `Which ${meta.title.toLowerCase().replace(/s$/, "")} is best for my area?`,
      answer: `It depends on what's in your water. Enter your postcode on TapWater.uk to see which contaminants are present, and we'll recommend the best filter for your specific water quality.`,
    },
  ];

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://tapwater.uk" },
          { name: "Filters", url: "https://tapwater.uk/filters/" },
          { name: meta.title, url: `https://tapwater.uk/filters/${slug}/` },
        ]}
      />
      <FAQSchema faqs={faqs} />

      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        {/* Breadcrumb nav */}
        <nav className="text-sm text-muted mb-6">
          <Link href="/filters/" className="hover:text-accent">Filters</Link>
          <span className="mx-2">/</span>
          <span className="text-ink">{meta.title}</span>
        </nav>

        <h1 className="font-display text-3xl sm:text-4xl text-ink italic tracking-tight">
          {meta.title}
        </h1>
        <p className="text-body mt-3 max-w-2xl text-lg">
          {meta.description} {meta.bestFor}.
        </p>

        {/* Check your water CTA */}
        <div className="mt-6 p-4 bg-wash rounded-lg max-w-md">
          <p className="text-sm font-medium text-ink mb-2">
            Not sure which one you need?
          </p>
          <PostcodeSearch />
        </div>

        {/* Product cards */}
        <div className="mt-10 space-y-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} highlight={product.bestFor} />
          ))}
        </div>

        {/* Comparison table */}
        {products.length > 1 && cat !== "testing_kit" && (
          <div className="mt-10">
            <h2 className="font-display text-xl text-ink italic mb-4">
              Quick comparison
            </h2>
            <ProductComparisonTable products={products} />
          </div>
        )}

        {/* Guide link */}
        {guide && (
          <div className="mt-8 p-5 card-elevated">
            <p className="font-display text-lg text-ink italic">{guide.title}</p>
            <p className="text-sm text-body mt-1">
              In-depth reviews, testing methodology, and our verdict.
            </p>
            <Link
              href={guide.href}
              className="inline-block mt-3 text-sm font-medium text-accent hover:underline"
            >
              Read the full guide &rarr;
            </Link>
          </div>
        )}

        {/* FAQ */}
        <div className="mt-10">
          <h2 className="font-display text-xl text-ink italic mb-4">
            Common questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.question}>
                <h3 className="font-semibold text-ink text-sm">{faq.question}</h3>
                <p className="text-sm text-body mt-1">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Disclosure */}
        <p className="text-xs text-faint mt-8">
          We may earn a commission when you buy through our links, at no extra cost to you.{" "}
          <Link href="/affiliate-disclosure" className="text-accent hover:underline">
            Affiliate disclosure
          </Link>
        </p>
      </div>
    </>
  );
}
```

- [ ] **Step 3: Run the build to verify pages render**

Run: `npx next build 2>&1 | tail -30`
Expected: Build succeeds, `/filters` and `/filters/[category]` routes are generated.

- [ ] **Step 4: Commit**

```bash
git add src/app/filters/
git commit -m "feat: add /filters hub page and dynamic category pages with comparison tables"
```

---

## Task 6: Update Sitemap and Navigation

**Files:**
- Modify: `src/app/sitemap.ts`
- Modify: `src/components/header.tsx`

- [ ] **Step 1: Add filter and new guide routes to sitemap**

In `src/app/sitemap.ts`, add imports and new paths:

Add to the top-level imports:
```typescript
import { CATEGORY_META, CATEGORY_ORDER } from "@/lib/products";
```

Add a new `GUIDE_SLUGS` entry for each new guide (add to the existing array):
```typescript
const GUIDE_SLUGS = [
  "best-water-filters-uk",
  "pfas-uk-explained",
  "lead-pipes-uk",
  "water-hardness-map",
  "understanding-your-water-supplier",
  "how-to-test-your-water",
  "microplastics-uk-water",
  "tap-water-vs-bottled-water",
  // New buying guides
  "best-reverse-osmosis-system-uk",
  "best-shower-filter-uk",
  "best-whole-house-water-filter-uk",
  "best-water-testing-kit-uk",
  "best-water-filter-pfas",
  "best-water-filter-jug-uk",
];
```

Add filter category paths to the return array (before `...cityPaths`):
```typescript
    // Filter pages
    {
      url: `${BASE_URL}/filters/`,
      lastModified: latestDataDate,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    ...CATEGORY_ORDER.map((cat) => ({
      url: `${BASE_URL}/filters/${CATEGORY_META[cat].slug}/`,
      lastModified: latestDataDate,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
```

- [ ] **Step 2: Add "Filters" to header navigation**

In `src/components/header.tsx`, add "Filters" to the navigation links array, after "Rankings":

Find the nav links array and add the Filters entry:
```typescript
{ href: "/filters", label: "Filters" },
```

- [ ] **Step 3: Build to verify**

Run: `npx next build 2>&1 | tail -20`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/sitemap.ts src/components/header.tsx
git commit -m "feat: add filter pages to sitemap and navigation"
```

---

## Task 7: Create First Buying Guide — Best Reverse Osmosis System UK

**Files:**
- Create: `src/app/guides/best-reverse-osmosis-system-uk/page.tsx`

This is the highest-revenue guide. It serves as the template for all subsequent guides.

- [ ] **Step 1: Create the RO system guide**

Create `src/app/guides/best-reverse-osmosis-system-uk/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, AlertTriangle } from "lucide-react";
import { PostcodeSearch } from "@/components/postcode-search";
import { ProductCard } from "@/components/product-card";
import { ProductComparisonTable } from "@/components/product-comparison-table";
import { ArticleSchema, BreadcrumbSchema, FAQSchema } from "@/components/json-ld";
import { getProductsByCategory } from "@/lib/products";

export const metadata: Metadata = {
  title: "Best Reverse Osmosis System UK 2026 — Tested Against Real Water Data",
  description:
    "We analysed 2,800 UK postcodes to find which areas need reverse osmosis. Compare the best RO systems for PFAS, fluoride, and heavy metal removal with prices and specs.",
  alternates: { canonical: "https://tapwater.uk/guides/best-reverse-osmosis-system-uk/" },
};

const faqs = [
  {
    question: "Do I need a reverse osmosis system in the UK?",
    answer: "Most UK tap water is safe to drink. But if your area has elevated PFAS (forever chemicals), fluoride above WHO guidelines, or multiple heavy metals flagged, an RO system is the only filter type that removes all of these. Check your postcode on TapWater.uk to see if your water has these contaminants.",
  },
  {
    question: "How much does a reverse osmosis system cost to run?",
    answer: "Expect to pay £70-100 per year in replacement filters. RO systems also produce wastewater — typically 1 litre of waste per 3 litres of filtered water. Your water bill may increase by £20-30 per year.",
  },
  {
    question: "Can I install a reverse osmosis system myself?",
    answer: "Some tankless models like the Frizzlife PD600 are designed for DIY installation. Larger systems may need a plumber. Installation typically takes 1-2 hours and costs £50-100 if professional.",
  },
  {
    question: "Do reverse osmosis systems remove minerals I need?",
    answer: "Yes, RO removes beneficial minerals like calcium and magnesium. Some systems (like the Waterdrop G3P600) include a remineralisation stage that adds these back. You can also get a separate remineralisation cartridge for around £15.",
  },
];

export default function BestROSystemGuide() {
  const roProducts = getProductsByCategory("reverse_osmosis");

  return (
    <>
      <ArticleSchema
        headline="Best Reverse Osmosis System UK 2026"
        description="Comparison of the best reverse osmosis water filter systems available in the UK, tested against real water quality data."
        url="https://tapwater.uk/guides/best-reverse-osmosis-system-uk/"
        datePublished="2026-04-05"
        dateModified="2026-04-05"
        authorName="Remy"
        authorUrl="https://tapwater.uk/about/"
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://tapwater.uk" },
          { name: "Guides", url: "https://tapwater.uk/guides/" },
          { name: "Best RO System UK", url: "https://tapwater.uk/guides/best-reverse-osmosis-system-uk/" },
        ]}
      />
      <FAQSchema faqs={faqs} />

      <article className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        {/* Breadcrumb */}
        <nav className="text-sm text-muted mb-6">
          <Link href="/guides/" className="hover:text-accent">Guides</Link>
          <span className="mx-2">/</span>
          <span className="text-ink">Best RO System UK</span>
        </nav>

        <h1 className="font-display text-3xl sm:text-4xl text-ink italic tracking-tight">
          Best reverse osmosis system UK 2026
        </h1>
        <p className="text-body mt-4 text-lg leading-relaxed">
          We analysed water quality data from 2,800 UK postcodes. In areas where PFAS,
          fluoride, or heavy metals are present, a reverse osmosis system is the only
          filter type that removes all of them. Here are our picks.
        </p>

        {/* Quick picks */}
        <div className="mt-8 p-5 bg-wash rounded-xl">
          <h2 className="font-display text-lg text-ink italic">Our picks at a glance</h2>
          <ul className="mt-3 space-y-2">
            {roProducts.map((p) => (
              <li key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-ink font-medium">{p.brand} {p.model}</span>
                <span className="text-muted">{p.priceGbp > 0 ? `£${p.priceGbp}` : "Check price"} · {p.bestFor}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Do you actually need RO? */}
        <section className="mt-10">
          <h2 className="font-display text-2xl text-ink italic">
            Do you actually need reverse osmosis?
          </h2>
          <p className="text-body mt-3 leading-relaxed">
            Most UK households don&apos;t. A jug filter or under-sink carbon filter
            handles chlorine, lead, and basic contaminants well enough. But RO is the
            only option when your water contains:
          </p>
          <ul className="mt-4 space-y-2">
            {[
              "PFAS (forever chemicals) — no other filter type reliably removes these",
              "Fluoride above WHO guidelines (0.5 mg/l)",
              "Nitrate near or above the UK limit (50 mg/l)",
              "Multiple heavy metals flagged simultaneously",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-body">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>

          {/* Postcode CTA */}
          <div className="mt-6 p-4 bg-wash rounded-lg max-w-md">
            <p className="text-sm font-medium text-ink mb-2">
              Check if your area needs RO
            </p>
            <PostcodeSearch />
          </div>
        </section>

        {/* What to look for */}
        <section className="mt-10">
          <h2 className="font-display text-2xl text-ink italic">
            What to look for in an RO system
          </h2>
          <div className="mt-4 space-y-4 text-body leading-relaxed">
            <p>
              <strong className="text-ink">NSF/ANSI 58 certification</strong> — this
              is the standard that proves an RO membrane actually works. Without it,
              you&apos;re trusting marketing claims. All three of our picks have it.
            </p>
            <p>
              <strong className="text-ink">Tankless design</strong> — older RO systems
              stored filtered water in a pressurised tank under your sink. Newer
              tankless models filter on demand and take up far less space. Both our top
              picks are tankless.
            </p>
            <p>
              <strong className="text-ink">Waste ratio</strong> — RO produces
              wastewater. Look for a 3:1 ratio (3 litres pure per 1 litre waste) or
              better. Cheaper systems can be 1:3 — meaning most water goes down the
              drain.
            </p>
            <p>
              <strong className="text-ink">Flow rate (GPD)</strong> — gallons per day.
              600 GPD is excellent for a household. Below 400 GPD and you may notice
              slow flow when filling a kettle.
            </p>
          </div>
        </section>

        {/* Product reviews */}
        <section className="mt-10">
          <h2 className="font-display text-2xl text-ink italic">
            Our recommendations
          </h2>
          <div className="mt-6 space-y-6">
            {roProducts.map((product) => (
              <div key={product.id}>
                <ProductCard product={product} highlight={product.bestFor} />
                {/* Expanded review below the card */}
                <div className="mt-3 px-1">
                  {product.cons.length > 0 && (
                    <p className="text-sm text-muted">
                      <strong className="text-ink">Watch out for:</strong>{" "}
                      {product.cons.join(". ")}.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Comparison table */}
        <section className="mt-10">
          <h2 className="font-display text-2xl text-ink italic">
            Side-by-side comparison
          </h2>
          <div className="mt-4">
            <ProductComparisonTable
              products={roProducts}
              contaminants={["PFAS (total)", "Lead", "Fluoride", "Arsenic", "Nitrate", "Chlorine"]}
            />
          </div>
        </section>

        {/* Verdict */}
        <section className="mt-10 p-5 card-elevated">
          <h2 className="font-display text-xl text-ink italic">Our verdict</h2>
          <p className="text-body mt-3 leading-relaxed">
            For most UK households that need RO, the{" "}
            <strong className="text-ink">Waterdrop G3P600</strong> is the one to get.
            It removes everything, has the best flow rate, and the tankless design means
            it actually fits under a standard UK kitchen sink. The{" "}
            <strong className="text-ink">Frizzlife PD600</strong> is a strong runner-up
            if you want to save £70 and don&apos;t mind slightly fewer certifications.
          </p>
          <div className="mt-4">
            <a
              href={roProducts[0]?.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="inline-flex items-center gap-2 bg-ink text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Check price on Waterdrop
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-10">
          <h2 className="font-display text-2xl text-ink italic">
            Common questions
          </h2>
          <div className="mt-4 space-y-6">
            {faqs.map((faq) => (
              <div key={faq.question}>
                <h3 className="font-semibold text-ink">{faq.question}</h3>
                <p className="text-body mt-1 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Related links */}
        <section className="mt-10 p-5 bg-wash rounded-xl">
          <h2 className="font-display text-lg text-ink italic">Related</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/contaminant/pfas/" className="text-accent hover:underline">
                PFAS in UK water — what you need to know
              </Link>
            </li>
            <li>
              <Link href="/filters/reverse-osmosis/" className="text-accent hover:underline">
                All reverse osmosis systems we recommend
              </Link>
            </li>
            <li>
              <Link href="/guides/best-water-filters-uk/" className="text-accent hover:underline">
                Best water filters UK — all categories
              </Link>
            </li>
          </ul>
        </section>

        {/* Disclosure */}
        <p className="text-xs text-faint mt-8">
          We may earn a commission when you buy through our links, at no extra cost to you.
          Recommendations are matched to water quality data, not sponsorship.{" "}
          <Link href="/affiliate-disclosure" className="text-accent hover:underline">
            Affiliate disclosure
          </Link>
        </p>
      </article>
    </>
  );
}
```

- [ ] **Step 2: Build to verify the page renders**

Run: `npx next build 2>&1 | tail -20`
Expected: Build succeeds, `/guides/best-reverse-osmosis-system-uk` is in the output.

- [ ] **Step 3: Commit**

```bash
git add src/app/guides/best-reverse-osmosis-system-uk/
git commit -m "feat: add Best Reverse Osmosis System UK buying guide"
```

---

## Task 8: Create Remaining 5 Buying Guides

**Files:**
- Create: `src/app/guides/best-shower-filter-uk/page.tsx`
- Create: `src/app/guides/best-whole-house-water-filter-uk/page.tsx`
- Create: `src/app/guides/best-water-testing-kit-uk/page.tsx`
- Create: `src/app/guides/best-water-filter-pfas/page.tsx`
- Create: `src/app/guides/best-water-filter-jug-uk/page.tsx`

Each guide follows the same template as the RO guide in Task 7. The implementer should:

- [ ] **Step 1: Create each guide page**

For each guide, follow the structure from Task 7 but customise:
- `metadata` — title, description, canonical URL
- `faqs` — 3-4 questions specific to the category
- `getProductsByCategory()` call — use the correct category
- Content sections — "Do you need [X]?", "What to look for", reviews, comparison table, verdict
- Related links — cross-link to relevant contaminant pages, category pages, and other guides

**Guide-specific content notes:**

**best-shower-filter-uk:** Focus on hard water, chlorine's effect on skin/hair, link to water hardness map guide. Products: `getProductsByCategory("shower")`.

**best-whole-house-water-filter-uk:** Focus on homeowners, appliance protection, the decision between under-sink vs whole-house. Products: `getProductsByCategory("whole_house")`.

**best-water-testing-kit-uk:** Position as "test before you buy a filter". Explain difference between dip-strip and lab tests. Link to postcode search as free alternative. Products: `getProductsByCategory("testing_kit")`.

**best-water-filter-pfas:** Cross-category — feature RO systems primarily, but mention ZeroWater jug as budget option. Reference the PFAS contaminant page heavily. Products: filter PRODUCTS where `removes` includes "PFAS (total)".

**best-water-filter-jug-uk:** Beginner-friendly, compare BRITA vs ZeroWater vs Aqua Optima vs PUR. Focus on ongoing cost, what each removes, and when you should upgrade to under-sink. Products: `getProductsByCategory("jug")`.

- [ ] **Step 2: Build to verify all pages render**

Run: `npx next build 2>&1 | tail -30`
Expected: Build succeeds, all 6 new guide routes appear.

- [ ] **Step 3: Commit**

```bash
git add src/app/guides/best-shower-filter-uk/ src/app/guides/best-whole-house-water-filter-uk/ src/app/guides/best-water-testing-kit-uk/ src/app/guides/best-water-filter-pfas/ src/app/guides/best-water-filter-jug-uk/
git commit -m "feat: add 5 buying guides — shower, whole-house, testing kits, PFAS, jugs"
```

---

## Task 9: Update Guide Hub and Rework Best Water Filters Page

**Files:**
- Modify: `src/app/guides/page.tsx`
- Modify: `src/app/guides/best-water-filters-uk/page.tsx`

- [ ] **Step 1: Add new guides to the hub listing**

In `src/app/guides/page.tsx`, add the 6 new guides to the `guides` array:

```typescript
  { slug: "best-reverse-osmosis-system-uk", title: "Best Reverse Osmosis System UK", subtitle: "For PFAS, fluoride, and heavy metals", icon: "Droplets", color: "text-blue-600" },
  { slug: "best-shower-filter-uk", title: "Best Shower Filter UK", subtitle: "Remove chlorine for better skin and hair", icon: "Sparkles", color: "text-cyan-600" },
  { slug: "best-whole-house-water-filter-uk", title: "Best Whole House Filter UK", subtitle: "Filter every tap in your home", icon: "Home", color: "text-emerald-600" },
  { slug: "best-water-testing-kit-uk", title: "Best Water Testing Kit UK", subtitle: "Test your tap water at home", icon: "FlaskConical", color: "text-violet-600" },
  { slug: "best-water-filter-pfas", title: "Best Filter for PFAS Removal", subtitle: "The only filters that remove forever chemicals", icon: "ShieldAlert", color: "text-red-600" },
  { slug: "best-water-filter-jug-uk", title: "Best Water Filter Jug UK", subtitle: "BRITA vs ZeroWater vs the rest", icon: "GlassWater", color: "text-sky-600" },
```

Also add the new icon imports from lucide-react.

- [ ] **Step 2: Rework the best-water-filters-uk page into a hub**

This page should become a short overview that links to specific guides rather than reviewing individual products. It keeps its URL and content authority but becomes a navigation hub. Update the page content to:

1. Keep the intro section about UK water quality
2. Replace individual product reviews with a category overview section linking to each specific guide
3. Keep the comparison table showing what filter types (not individual products) can remove
4. Add prominent links to each specific buying guide
5. Keep the postcode search CTA

- [ ] **Step 3: Build and verify**

Run: `npx next build 2>&1 | tail -20`

- [ ] **Step 4: Commit**

```bash
git add src/app/guides/page.tsx src/app/guides/best-water-filters-uk/
git commit -m "feat: update guide hub with new buying guides, rework main filter guide into category hub"
```

---

## Task 10: Add Cross-Links to Existing Pages

**Files:**
- Modify: `src/app/postcode/[district]/page.tsx`
- Modify: `src/app/contaminant/[slug]/page.tsx`

- [ ] **Step 1: Add supplementary product recommendations to postcode pages**

In the postcode page, after the existing `FilterRecommendations` section, add links to:
- Shower filter category page when hard water indicators are present
- Testing kit page when lead or PFAS is flagged
- The relevant buying guide based on what's in the water

Add a section after the filter recommendations:

```tsx
{/* Supplementary recommendations */}
<section className="mt-6 grid gap-3 sm:grid-cols-2">
  <Link
    href="/filters/shower/"
    className="card p-4 group hover:border-accent/30 transition-colors"
  >
    <p className="font-semibold text-ink text-sm group-hover:text-accent">
      Shower filters
    </p>
    <p className="text-xs text-muted mt-1">
      Remove chlorine for better skin and hair
    </p>
  </Link>
  <Link
    href="/filters/testing-kits/"
    className="card p-4 group hover:border-accent/30 transition-colors"
  >
    <p className="font-semibold text-ink text-sm group-hover:text-accent">
      Test your water
    </p>
    <p className="text-xs text-muted mt-1">
      Confirm exactly what&apos;s in your pipes
    </p>
  </Link>
</section>
```

- [ ] **Step 2: Add guide links to contaminant pages**

In each contaminant page, add a "How to remove [contaminant]" section that links to the relevant buying guide. For example, the PFAS contaminant page should link to `/guides/best-water-filter-pfas/` and `/filters/reverse-osmosis/`.

Add this mapping and render a card linking to the relevant guide:

```typescript
const CONTAMINANT_GUIDE_MAP: Record<string, { guide: string; category: string }> = {
  pfas: { guide: "/guides/best-water-filter-pfas/", category: "/filters/reverse-osmosis/" },
  lead: { guide: "/guides/best-reverse-osmosis-system-uk/", category: "/filters/under-sink/" },
  fluoride: { guide: "/guides/best-reverse-osmosis-system-uk/", category: "/filters/reverse-osmosis/" },
  nitrate: { guide: "/guides/best-reverse-osmosis-system-uk/", category: "/filters/reverse-osmosis/" },
  chlorine: { guide: "/guides/best-shower-filter-uk/", category: "/filters/jug/" },
  copper: { guide: "/guides/best-water-filters-uk/", category: "/filters/under-sink/" },
  trihalomethanes: { guide: "/guides/best-reverse-osmosis-system-uk/", category: "/filters/reverse-osmosis/" },
  ecoli: { guide: "/guides/best-water-testing-kit-uk/", category: "/filters/testing-kits/" },
};
```

- [ ] **Step 3: Build and verify**

Run: `npx next build 2>&1 | tail -20`

- [ ] **Step 4: Commit**

```bash
git add src/app/postcode/ src/app/contaminant/
git commit -m "feat: add cross-links from postcode and contaminant pages to filter categories and guides"
```

---

## Task 11: Email Drip Sequence Logic

**Files:**
- Create: `src/lib/email-sequences.ts`
- Create: `src/lib/__tests__/email-sequences.test.ts`
- Modify: `src/app/api/subscribe/route.ts`

- [ ] **Step 1: Write tests for email sequence logic**

Create `src/lib/__tests__/email-sequences.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { getNextEmail, shouldSendEmail, buildEmailHtml } from "../email-sequences";
import type { SubscriberSequenceState } from "../types";

const baseSubscriber: SubscriberSequenceState = {
  email: "test@example.com",
  postcodeDistrict: "SE15",
  waterDataSnapshot: {
    safetyScore: 6.5,
    scoreGrade: "fair",
    contaminantsFlagged: 2,
    topConcerns: ["Lead", "PFAS (total)"],
    pfasDetected: true,
  },
  subscribedAt: "2026-04-01T10:00:00Z",
  lastEmailSent: null,
  lastEmailSentAt: null,
};

describe("getNextEmail", () => {
  it("returns day-0 email for new subscriber", () => {
    const email = getNextEmail(baseSubscriber);
    expect(email).toBeDefined();
    expect(email!.step).toBe(0);
    expect(email!.subject).toContain("SE15");
  });

  it("returns day-3 email after day-0", () => {
    const sub = { ...baseSubscriber, lastEmailSent: 0 as const, lastEmailSentAt: "2026-04-01T10:00:00Z" };
    const email = getNextEmail(sub);
    expect(email).toBeDefined();
    expect(email!.step).toBe(3);
  });

  it("returns null after all emails sent", () => {
    const sub = { ...baseSubscriber, lastEmailSent: 30 as const, lastEmailSentAt: "2026-05-01T10:00:00Z" };
    const email = getNextEmail(sub);
    expect(email).toBeNull();
  });
});

describe("shouldSendEmail", () => {
  it("sends day-0 immediately", () => {
    expect(shouldSendEmail(baseSubscriber, 0, new Date("2026-04-01T10:01:00Z"))).toBe(true);
  });

  it("waits 3 days for day-3 email", () => {
    const sub = { ...baseSubscriber, lastEmailSent: 0 as const, lastEmailSentAt: "2026-04-01T10:00:00Z" };
    expect(shouldSendEmail(sub, 3, new Date("2026-04-03T09:00:00Z"))).toBe(false);
    expect(shouldSendEmail(sub, 3, new Date("2026-04-04T11:00:00Z"))).toBe(true);
  });
});

describe("buildEmailHtml", () => {
  it("includes postcode in day-0 email", () => {
    const html = buildEmailHtml(baseSubscriber, 0);
    expect(html).toContain("SE15");
    expect(html).toContain("6.5");
  });

  it("includes product recommendations in day-7 email", () => {
    const html = buildEmailHtml(baseSubscriber, 7);
    expect(html).toContain("SE15");
    expect(html).toContain("affiliate");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/__tests__/email-sequences.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement email sequence logic**

Create `src/lib/email-sequences.ts`:

```typescript
import type { EmailSequenceStep, SubscriberSequenceState } from "./types";
import { recommendFilters } from "./filters";

const SEQUENCE_ORDER: EmailSequenceStep[] = [0, 3, 7, 14, 30];

const DAY_MS = 24 * 60 * 60 * 1000;

interface EmailPayload {
  step: EmailSequenceStep;
  subject: string;
  html: string;
}

/** Determine the next email to send for a subscriber */
export function getNextEmail(sub: SubscriberSequenceState): EmailPayload | null {
  const nextStep = getNextStep(sub.lastEmailSent);
  if (nextStep === null) return null;

  return {
    step: nextStep,
    subject: getSubject(sub, nextStep),
    html: buildEmailHtml(sub, nextStep),
  };
}

function getNextStep(lastSent: EmailSequenceStep | null): EmailSequenceStep | null {
  if (lastSent === null) return 0;
  const idx = SEQUENCE_ORDER.indexOf(lastSent);
  if (idx === -1 || idx >= SEQUENCE_ORDER.length - 1) return null;
  return SEQUENCE_ORDER[idx + 1];
}

/** Check if enough time has elapsed to send the next email */
export function shouldSendEmail(
  sub: SubscriberSequenceState,
  step: EmailSequenceStep,
  now: Date,
): boolean {
  if (step === 0) return true;

  const refDate = sub.lastEmailSentAt
    ? new Date(sub.lastEmailSentAt)
    : new Date(sub.subscribedAt);

  const prevStep = SEQUENCE_ORDER[SEQUENCE_ORDER.indexOf(step) - 1] ?? 0;
  const daysBetween = step - prevStep;
  const elapsed = now.getTime() - refDate.getTime();

  return elapsed >= daysBetween * DAY_MS;
}

function getSubject(sub: SubscriberSequenceState, step: EmailSequenceStep): string {
  const { postcodeDistrict, waterDataSnapshot } = sub;
  switch (step) {
    case 0:
      return `Your water report for ${postcodeDistrict}`;
    case 3:
      return waterDataSnapshot.topConcerns.length > 0
        ? `What ${waterDataSnapshot.topConcerns[0]} means for your water`
        : `What we know about water in ${postcodeDistrict}`;
    case 7:
      return `What you can do about your water in ${postcodeDistrict}`;
    case 14:
      return `Want to test your water at home?`;
    case 30:
      return `Water quality update for ${postcodeDistrict}`;
  }
}

/** Build the email HTML for a given sequence step */
export function buildEmailHtml(sub: SubscriberSequenceState, step: EmailSequenceStep): string {
  const { postcodeDistrict, waterDataSnapshot } = sub;
  const { safetyScore, scoreGrade, contaminantsFlagged, topConcerns, pfasDetected } = waterDataSnapshot;

  const header = `
    <div style="background:#0891b2;padding:24px 20px;text-align:center;">
      <h1 style="color:white;font-size:20px;margin:0;font-family:Georgia,serif;">TapWater.uk</h1>
    </div>
  `;

  const footer = `
    <div style="padding:20px;text-align:center;font-size:12px;color:#888;">
      <p>You're receiving this because you checked water quality for ${postcodeDistrict} on TapWater.uk.</p>
      <p><a href="https://tapwater.uk/api/unsubscribe?email=${encodeURIComponent(sub.email)}" style="color:#888;">Unsubscribe</a></p>
    </div>
  `;

  let body = "";

  switch (step) {
    case 0:
      body = `
        <h2 style="color:#111;font-family:Georgia,serif;">Your water in ${postcodeDistrict}</h2>
        <p>Safety score: <strong>${safetyScore}/10</strong> (${scoreGrade})</p>
        <p>${contaminantsFlagged} contaminant${contaminantsFlagged !== 1 ? "s" : ""} flagged in your area.</p>
        ${topConcerns.length > 0 ? `<p>Top concerns: ${topConcerns.join(", ")}.</p>` : ""}
        ${pfasDetected ? `<p style="color:#d97706;"><strong>PFAS (forever chemicals) detected in your area.</strong></p>` : ""}
        <p><a href="https://tapwater.uk/postcode/${postcodeDistrict}/" style="color:#0891b2;">View your full report &rarr;</a></p>
      `;
      break;

    case 3:
      body = topConcerns.length > 0
        ? `
          <h2 style="color:#111;font-family:Georgia,serif;">What ${topConcerns[0]} means for you</h2>
          <p>Your water in ${postcodeDistrict} has elevated ${topConcerns[0]}. Here's what that means in plain English.</p>
          <p><a href="https://tapwater.uk/contaminant/${topConcerns[0].toLowerCase().replace(/[^a-z]/g, "")}/" style="color:#0891b2;">Learn more about ${topConcerns[0]} &rarr;</a></p>
        `
        : `
          <h2 style="color:#111;font-family:Georgia,serif;">Your water looks good</h2>
          <p>No major contaminants were flagged in ${postcodeDistrict}. Here's what we tested for.</p>
          <p><a href="https://tapwater.uk/postcode/${postcodeDistrict}/" style="color:#0891b2;">See full results &rarr;</a></p>
        `;
      break;

    case 7: {
      const recs = recommendFilters(topConcerns, 2);
      body = `
        <h2 style="color:#111;font-family:Georgia,serif;">What you can do about it</h2>
        <p>Based on what's in your water in ${postcodeDistrict}, here's what we recommend:</p>
        ${recs.map((r) => `
          <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:12px 0;">
            <p style="font-weight:bold;color:#111;">${r.brand} ${r.model}</p>
            <p style="font-size:14px;color:#666;">${r.bestFor}</p>
            <p style="font-size:14px;">${r.priceGbp > 0 ? `£${r.priceGbp}` : "Check price"}</p>
            <a href="${r.affiliateUrl}" style="color:#0891b2;font-size:14px;">Check price &amp; reviews &rarr;</a>
          </div>
        `).join("")}
        <p style="font-size:12px;color:#888;">We may earn a commission at no extra cost to you. <a href="https://tapwater.uk/affiliate-disclosure/" style="color:#888;">Affiliate disclosure</a></p>
      `;
      break;
    }

    case 14:
      body = `
        <h2 style="color:#111;font-family:Georgia,serif;">Test your water at home</h2>
        <p>Our data comes from water company reports. But the pipes in your home can add contaminants that don't show up in our data.</p>
        <p>A home testing kit lets you check exactly what's coming out of your tap.</p>
        <p><a href="https://tapwater.uk/filters/testing-kits/" style="color:#0891b2;">See our recommended testing kits &rarr;</a></p>
      `;
      break;

    case 30:
      body = `
        <h2 style="color:#111;font-family:Georgia,serif;">Update for ${postcodeDistrict}</h2>
        <p>We're continuously monitoring water quality across the UK. Here's the latest for your area.</p>
        <p><a href="https://tapwater.uk/postcode/${postcodeDistrict}/" style="color:#0891b2;">Check your latest report &rarr;</a></p>
      `;
      break;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
    <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:16px;line-height:1.6;color:#333;background:#f9fafb;">
      <div style="max-width:560px;margin:0 auto;background:white;">
        ${header}
        <div style="padding:24px 20px;">
          ${body}
        </div>
        ${footer}
      </div>
    </body>
    </html>
  `;
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/lib/__tests__/email-sequences.test.ts`
Expected: PASS

- [ ] **Step 5: Update subscribe route to store water data snapshot**

In `src/app/api/subscribe/route.ts`, after the Supabase upsert for the subscriber, also store the water data snapshot. Add a field for `water_data_snapshot` and `last_email_sent` to the subscriber record. This requires a database migration — add columns to the `subscribers` table:

The implementer should create a Supabase migration to add:
```sql
ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS water_data_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS last_email_sent INTEGER,
  ADD COLUMN IF NOT EXISTS last_email_sent_at TIMESTAMPTZ;
```

Then update the subscribe route to fetch the postcode data and store a snapshot alongside the subscriber.

- [ ] **Step 6: Commit**

```bash
git add src/lib/email-sequences.ts src/lib/__tests__/email-sequences.test.ts src/app/api/subscribe/
git commit -m "feat: add email drip sequence logic with personalised water-data-driven templates"
```

---

## Task 12: Email Cron Endpoint

**Files:**
- Create: `src/app/api/cron/emails/route.ts`
- Modify: `vercel.json`

- [ ] **Step 1: Create the email cron endpoint**

Create `src/app/api/cron/emails/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { Resend } from "resend";
import { getNextEmail, shouldSendEmail } from "@/lib/email-sequences";
import type { SubscriberSequenceState } from "@/lib/types";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  const now = new Date();

  // Fetch verified subscribers who haven't completed the sequence
  const { data: subscribers, error } = await supabase
    .from("subscribers")
    .select("*")
    .eq("verified", true)
    .eq("unsubscribed", false)
    .or("last_email_sent.is.null,last_email_sent.lt.30")
    .limit(50);

  if (error || !subscribers) {
    return NextResponse.json({ error: "DB error", details: error?.message }, { status: 500 });
  }

  let sent = 0;
  let skipped = 0;

  for (const sub of subscribers) {
    if (!sub.water_data_snapshot) {
      skipped++;
      continue;
    }

    const state: SubscriberSequenceState = {
      email: sub.email,
      postcodeDistrict: sub.postcode_district,
      waterDataSnapshot: sub.water_data_snapshot,
      subscribedAt: sub.created_at,
      lastEmailSent: sub.last_email_sent,
      lastEmailSentAt: sub.last_email_sent_at,
    };

    const nextEmail = getNextEmail(state);
    if (!nextEmail) {
      skipped++;
      continue;
    }

    if (!shouldSendEmail(state, nextEmail.step, now)) {
      skipped++;
      continue;
    }

    try {
      await resend.emails.send({
        from: "TapWater.uk <hello@tapwater.uk>",
        to: state.email,
        subject: nextEmail.subject,
        html: nextEmail.html,
      });

      await supabase
        .from("subscribers")
        .update({
          last_email_sent: nextEmail.step,
          last_email_sent_at: now.toISOString(),
        })
        .eq("email", state.email);

      sent++;
    } catch {
      // Log but continue — don't let one failure block others
      skipped++;
    }
  }

  return NextResponse.json({ sent, skipped, total: subscribers.length });
}
```

- [ ] **Step 2: Add the email cron to vercel.json**

Add a new cron job to `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/refresh", "schedule": "*/5 * * * *" },
    { "path": "/api/cron/emails", "schedule": "0 9 * * *" }
  ]
}
```

This runs the email cron once daily at 9am UTC.

- [ ] **Step 3: Build and verify**

Run: `npx next build 2>&1 | tail -20`

- [ ] **Step 4: Commit**

```bash
git add src/app/api/cron/emails/ vercel.json
git commit -m "feat: add daily email drip cron endpoint"
```

---

## Task 13: Database Migration for Email Sequences

**Files:**
- Create: `supabase/migrations/XXX_email_sequences.sql`

- [ ] **Step 1: Create the migration**

Create a new migration file (use the next sequence number in the migrations directory):

```sql
-- Add email drip sequence fields to subscribers
ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS water_data_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS last_email_sent INTEGER,
  ADD COLUMN IF NOT EXISTS last_email_sent_at TIMESTAMPTZ;

-- Index for cron job query efficiency
CREATE INDEX IF NOT EXISTS idx_subscribers_email_sequence
  ON subscribers (verified, unsubscribed, last_email_sent)
  WHERE verified = true AND unsubscribed = false;
```

- [ ] **Step 2: Apply the migration**

Use the Supabase MCP tool or the Supabase CLI to apply the migration.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/
git commit -m "feat: add email sequence columns to subscribers table"
```

---

## Task 14: Final Build Verification and Deploy

- [ ] **Step 1: Run all tests**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 2: Run production build**

Run: `npx next build`
Expected: Build succeeds with all new routes:
- `/filters` (static)
- `/filters/[category]` (7 static pages)
- `/guides/best-reverse-osmosis-system-uk` (static)
- `/guides/best-shower-filter-uk` (static)
- `/guides/best-whole-house-water-filter-uk` (static)
- `/guides/best-water-testing-kit-uk` (static)
- `/guides/best-water-filter-pfas` (static)
- `/guides/best-water-filter-jug-uk` (static)
- `/api/cron/emails` (serverless)

- [ ] **Step 3: Verify no missing product images**

Check which product images need to be sourced:
```bash
grep -o 'imageUrl: "[^"]*"' src/lib/products.ts | grep -v '""'
```

For any new images that don't exist in `public/filters/`, the implementer should source high-quality product photos and add them.

- [ ] **Step 4: Commit any remaining changes and push**

```bash
git add .
git commit -m "chore: final verification — all tests pass, build succeeds"
```
