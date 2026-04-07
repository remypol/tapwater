# Revenue Architecture Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign monetization through tiered affiliate routing with UTM tracking, a water softener lead gen pipeline with installer matching, and a Waterdrop softener-ready product architecture.

**Architecture:** Three sequential changes: (1) extend types and product catalogue with softener category + availableInUk flag, (2) add UTM tracking to product cards + audit affiliate links, (3) build installer partner signup + lead forwarding, (4) wire softener product into postcode pages and guide. Each task produces a working, deployable commit.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Supabase, Resend, Vitest

**Spec:** `docs/superpowers/specs/2026-04-07-revenue-architecture-design.md`

---

### Task 1: Extend types with water_softener category and availableInUk flag

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/filters.ts`

- [ ] **Step 1: Add `water_softener` to ProductCategory type**

In `src/lib/types.ts`, add `"water_softener"` to the `ProductCategory` union:

```typescript
export type ProductCategory =
  | "jug"
  | "under_sink"
  | "reverse_osmosis"
  | "whole_house"
  | "shower"
  | "testing_kit"
  | "countertop"
  | "water_softener";
```

- [ ] **Step 2: Add `availableInUk` to FilterProduct interface**

In `src/lib/types.ts`, add the optional field to `FilterProduct`:

```typescript
export interface FilterProduct {
  // ... existing fields ...
  availableInUk?: boolean; // undefined or true = available. false = not yet available in UK market.
}
```

- [ ] **Step 3: Add water_softener to CATEGORY_LABELS**

In `src/lib/filters.ts`, add to the `CATEGORY_LABELS` record:

```typescript
export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  jug: "Jug Filter",
  under_sink: "Under-Sink Filter",
  reverse_osmosis: "Reverse Osmosis",
  whole_house: "Whole House",
  countertop: "Countertop",
  shower: "Shower Filter",
  testing_kit: "Testing Kit",
  water_softener: "Water Softener",
};
```

- [ ] **Step 4: Update recommendFilters to exclude water_softener**

In `src/lib/filters.ts`, update the `recommendFilters` function to exclude water softeners from standard filter recommendations (they're a separate product category):

```typescript
const drinkingFilters = PRODUCTS.filter(
  (f) => f.category !== "testing_kit" && f.category !== "shower" && f.category !== "water_softener",
);
```

- [ ] **Step 5: Verify build**

Run: `npm run build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/lib/types.ts src/lib/filters.ts
git commit -m "feat: add water_softener category and availableInUk flag to product types"
```

---

### Task 2: Add Waterdrop WHR01 softener to product catalogue (inactive)

**Files:**
- Modify: `src/lib/products.ts`

- [ ] **Step 1: Add water_softener to CATEGORY_META**

In `src/lib/products.ts`, add to the `CATEGORY_META` record:

```typescript
water_softener: {
  title: "Water Softeners",
  slug: "water-softeners",
  description:
    "Ion exchange water softeners remove calcium and magnesium from your supply, eliminating limescale and protecting appliances.",
  bestFor: "Homeowners in hard water areas (200+ mg/L) wanting to protect boilers, pipes, and appliances",
  priceRange: "£800–£3,000 installed",
},
```

- [ ] **Step 2: Add water_softener to CATEGORY_ORDER**

In `src/lib/products.ts`, add `"water_softener"` to the end of the `CATEGORY_ORDER` array:

```typescript
export const CATEGORY_ORDER: ProductCategory[] = [
  "jug",
  "countertop",
  "under_sink",
  "reverse_osmosis",
  "whole_house",
  "shower",
  "testing_kit",
  "water_softener",
];
```

- [ ] **Step 3: Add Waterdrop WHR01 product entry**

Add to the `PRODUCTS` array in `src/lib/products.ts`:

```typescript
// ─── WATER SOFTENERS ─────────────────────────────────────────────────
{
  id: "waterdrop-whr01",
  brand: "Waterdrop",
  model: "WHR01 Water Softener System",
  slug: "waterdrop-whr01",
  category: "water_softener",
  removes: ["Calcium", "Magnesium", "Limescale"],
  certifications: ["NSF components"],
  priceGbp: 2200,
  priceTier: "premium",
  affiliateUrl:
    "https://waterdropfiltereu.pxf.io/c/5514161/2060304/25810?u=https%3A%2F%2Fwww.waterdropfilter.com%2Fproducts%2Fwaterdrop-water-softener-system-for-home",
  affiliateProgram: "impact",
  affiliateTag: "waterdropfiltereu-impact",
  imageUrl: "/filters/waterdrop-whr01.png",
  rating: 4.5,
  badge: "premium",
  pros: [
    "Up-flow regeneration uses less salt and water than traditional softeners",
    "Pre-assembled core components for faster installation",
    "10-year resin tank warranty — longest in the category",
  ],
  cons: [
    "Premium price point — £2,000+ before installation",
    "Currently shipping from US — UK availability pending",
    "Requires professional installation with drain connection",
  ],
  bestFor: "Homeowners in very hard water areas wanting the most efficient salt-based softener",
  filterLife: "Resin lasts 10+ years with regular regeneration",
  annualCost: 60,
  availableInUk: false,
},
```

- [ ] **Step 4: Update product test threshold**

In `src/lib/__tests__/products.test.ts`, update the product count test:

```typescript
expect(PRODUCTS.length).toBeGreaterThanOrEqual(20);
```

- [ ] **Step 5: Run tests**

Run: `npm run test 2>&1 | tail -10`
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/products.ts src/lib/__tests__/products.test.ts
git commit -m "feat: add Waterdrop WHR01 softener to catalogue (availableInUk: false)"
```

---

### Task 3: Add UTM tracking to product card affiliate links

**Files:**
- Modify: `src/components/product-card.tsx`

- [ ] **Step 1: Build UTM URL helper**

Add a function at the top of `src/components/product-card.tsx`:

```typescript
function appendUtm(baseUrl: string, productSlug: string, pageType?: string): string {
  const sep = baseUrl.includes("?") ? "&" : "?";
  const campaign = pageType || "unknown";
  return `${baseUrl}${sep}utm_source=tapwater&utm_medium=affiliate&utm_campaign=${campaign}&utm_content=${productSlug}`;
}
```

- [ ] **Step 2: Add pageType prop and use UTM URL**

Update the interface and the affiliate link:

```typescript
interface ProductCardProps {
  product: FilterProduct;
  highlight?: string;
  pageType?: string; // "postcode" | "guide" | "filter-category" | "contaminant"
}

export function ProductCard({ product, highlight, pageType }: ProductCardProps) {
  const affiliateHref = appendUtm(product.affiliateUrl, product.slug, pageType);
  // ...
```

Update the `<a>` tag to use `affiliateHref` instead of `product.affiliateUrl`.

- [ ] **Step 3: Update CTA text based on affiliate program**

Replace the static "View deal" text:

```tsx
const ctaText = product.affiliateProgram === "amazon"
  ? "Check price on Amazon"
  : `Buy from ${product.brand}`;
```

Use `ctaText` in the `<a>` tag instead of "View deal".

- [ ] **Step 4: Verify build**

Run: `npm run build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/components/product-card.tsx
git commit -m "feat: add UTM tracking and brand-aware CTA text to product cards"
```

---

### Task 4: Filter unavailable products from display

**Files:**
- Modify: `src/components/filter-cards.tsx`
- Modify: `src/lib/products.ts` — `getProductsByCategory`

- [ ] **Step 1: Filter out unavailable products in getProductsByCategory**

In `src/lib/products.ts`, update `getProductsByCategory` to exclude products where `availableInUk` is explicitly `false`:

```typescript
export function getProductsByCategory(
  category: ProductCategory,
): FilterProduct[] {
  return PRODUCTS.filter((p) => p.category === category && p.availableInUk !== false);
}
```

- [ ] **Step 2: Add getUkAvailableProducts helper**

Add a new function below `getProductsByCategory`:

```typescript
/** Returns all products available in the UK market */
export function getUkAvailableProducts(): FilterProduct[] {
  return PRODUCTS.filter((p) => p.availableInUk !== false);
}

/** Returns a specific product only if UK-available */
export function getUkProduct(slug: string): FilterProduct | undefined {
  const product = PRODUCTS.find((p) => p.slug === slug);
  return product && product.availableInUk !== false ? product : undefined;
}

/** Returns a specific product regardless of availability (for admin/preview) */
export function getProductBySlugIncludingUnavailable(slug: string): FilterProduct | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}
```

- [ ] **Step 3: Verify build and tests**

Run: `npm run test && npm run build 2>&1 | tail -10`
Expected: All tests pass, build succeeds. The Waterdrop WHR01 should NOT appear on any filter category page since `availableInUk` is `false`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/products.ts src/components/filter-cards.tsx
git commit -m "feat: filter unavailable products from UK display, add availability helpers"
```

---

### Task 5: Create installer_partners Supabase table

**Files:**
- Create: `supabase/migrations/005_installer_partners.sql`

- [ ] **Step 1: Write the migration**

```sql
-- 005_installer_partners.sql
CREATE TABLE IF NOT EXISTS installer_partners (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name     TEXT NOT NULL,
  contact_name     TEXT NOT NULL,
  email            TEXT NOT NULL,
  phone            TEXT NOT NULL,
  website          TEXT,
  coverage_regions TEXT[] NOT NULL,
  coverage_postcodes TEXT[],
  desired_volume   TEXT,
  status           TEXT NOT NULL DEFAULT 'pending',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_installer_partners_status ON installer_partners (status);
CREATE INDEX IF NOT EXISTS idx_installer_partners_regions ON installer_partners USING GIN (coverage_regions);
```

- [ ] **Step 2: Apply migration**

Use the Supabase MCP `apply_migration` tool or run via the Supabase dashboard SQL editor.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/005_installer_partners.sql
git commit -m "feat: add installer_partners table for lead gen pipeline"
```

---

### Task 6: Create partner signup API route

**Files:**
- Create: `src/app/api/partners/route.ts`

- [ ] **Step 1: Create the API route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { Resend } from "resend";
import { subscribeLimiter, isMemoryRateLimited } from "@/lib/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const limited = subscribeLimiter
    ? !(await subscribeLimiter.limit(`partner:${ip}`)).success
    : isMemoryRateLimited(`partner:${ip}`, 3, 3_600_000);

  if (limited) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: {
    companyName?: string;
    contactName?: string;
    email?: string;
    phone?: string;
    website?: string;
    coverageRegions?: string[];
    coveragePostcodes?: string;
    desiredVolume?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const companyName = body.companyName?.trim();
  const contactName = body.contactName?.trim();
  const email = body.email?.trim().toLowerCase();
  const phone = body.phone?.replace(/[\s\-()]/g, "");
  const website = body.website?.trim() || null;
  const coverageRegions = body.coverageRegions ?? [];
  const coveragePostcodes = body.coveragePostcodes
    ?.split(",")
    .map((p) => p.trim().toUpperCase())
    .filter(Boolean) ?? null;
  const desiredVolume = body.desiredVolume || null;

  if (!companyName || companyName.length > 200) {
    return NextResponse.json({ error: "Company name is required" }, { status: 400 });
  }
  if (!contactName || contactName.length > 100) {
    return NextResponse.json({ error: "Contact name is required" }, { status: 400 });
  }
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }
  if (!phone) {
    return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
  }
  if (coverageRegions.length === 0) {
    return NextResponse.json({ error: "At least one coverage region is required" }, { status: 400 });
  }

  const supabase = getSupabase();

  const { error: dbError } = await supabase.from("installer_partners").insert({
    company_name: companyName,
    contact_name: contactName,
    email,
    phone,
    website,
    coverage_regions: coverageRegions,
    coverage_postcodes: coveragePostcodes,
    desired_volume: desiredVolume,
  });

  if (dbError) {
    console.error("[partners] DB error:", dbError);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }

  // Notify admin
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const resend = new Resend(resendKey);
      const adminEmail = process.env.ADMIN_EMAIL || "remy@tapwater.uk";
      await resend.emails.send({
        from: "TapWater.uk <alerts@tapwater.uk>",
        to: adminEmail,
        subject: `New installer partner: ${companyName}`,
        html: `
<h2>New Installer Partner Signup</h2>
<table style="border-collapse:collapse;">
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Company:</td><td>${companyName}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Contact:</td><td>${contactName}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Email:</td><td>${email}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Phone:</td><td>${phone}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Website:</td><td>${website || "—"}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Regions:</td><td>${coverageRegions.join(", ")}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Postcodes:</td><td>${coveragePostcodes?.join(", ") || "—"}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Volume:</td><td>${desiredVolume || "—"}</td></tr>
</table>`,
      });
    } catch (err) {
      console.error("[partners] Email error:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build 2>&1 | tail -5`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/partners/route.ts
git commit -m "feat: add installer partner signup API route"
```

---

### Task 7: Create /partners installer landing page

**Files:**
- Create: `src/app/partners/page.tsx`
- Modify: `src/app/sitemap.ts`

- [ ] **Step 1: Create the partners page**

Create `src/app/partners/page.tsx` — a B2B landing page for water softener installers. This is NOT linked from main navigation. It's for direct outreach and SEO indexing.

The page should include:
- Metadata: title "Partner With TapWater.uk", description about qualified water softener leads
- H1: "Get qualified water softener leads in your area"
- Value proposition section: what you get (verified homeowner details, hard water data, postcode-matched)
- How it works: 3 steps (sign up → receive leads → grow your business)
- Stats: "2,800+ UK postcodes", "60% of England is hard water", "Daily data updates"
- Partner signup form (client component) with fields: company name, contact name, email, phone, website (optional), coverage regions (checkboxes for UK regions), desired volume (dropdown), submit button
- Form submits to `/api/partners` via fetch POST

Follow the same styling patterns as the existing softener lead form — `card` classes, `font-display italic` headings, `text-ink`/`text-body`/`text-muted` colors.

The partner form component should be extracted as a `"use client"` component within the same file or a separate component file. Use the UK regions from `src/lib/regions.ts` for the coverage region checkboxes.

- [ ] **Step 2: Add /partners to sitemap**

In `src/app/sitemap.ts`, add:

```typescript
{
  url: `${BASE_URL}/partners`,
  lastModified: latestDataDate,
  changeFrequency: "monthly" as const,
  priority: 0.5,
},
```

- [ ] **Step 3: Verify build**

Run: `npm run build 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add src/app/partners/ src/app/sitemap.ts
git commit -m "feat: add /partners installer landing page with signup form"
```

---

### Task 8: Add lead forwarding to softener-leads API

**Files:**
- Modify: `src/app/api/softener-leads/route.ts`

- [ ] **Step 1: Add installer matching logic**

After the lead is saved to Supabase and the confirmation email is sent, add installer matching:

```typescript
// After the existing admin email send block, add installer forwarding:
try {
  const supabaseForMatch = getSupabase();

  // Find active installer partners whose coverage_regions overlap with the lead's region
  const { data: partners } = await supabaseForMatch
    .from("installer_partners")
    .select("id, company_name, contact_name, email, coverage_regions, coverage_postcodes")
    .eq("status", "active");

  if (partners && partners.length > 0 && resendKey) {
    // Match by postcode prefix or region
    const postcodePrefix = postcode.replace(/[0-9]/g, "");
    const matchedPartners = partners.filter((p) => {
      // Check if any coverage_postcodes match
      if (p.coverage_postcodes?.some((cp: string) => postcode.startsWith(cp) || postcodePrefix === cp)) {
        return true;
      }
      // Check if any coverage_regions match (broader match — requires mapping postcode to region)
      return false; // Region matching would need a postcode→region lookup; keep it simple with postcode matching for now
    });

    if (matchedPartners.length > 0) {
      const resend = new Resend(resendKey);
      for (const partner of matchedPartners.slice(0, 3)) {
        await resend.emails.send({
          from: "TapWater.uk Leads <alerts@tapwater.uk>",
          to: partner.email,
          subject: `New water softener lead in ${postcode}`,
          html: `
<h2>New Water Softener Lead</h2>
<p>A homeowner in your coverage area has requested water softener quotes.</p>
<table style="border-collapse:collapse;">
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Name:</td><td>${name}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Phone:</td><td>${phone}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Email:</td><td>${email}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Postcode:</td><td>${postcode}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Hardness:</td><td>${hardnessValue ? \`\${Math.round(hardnessValue)} mg/L (\${hardnessLabel})\` : "Unknown"}</td></tr>
</table>
<p style="margin-top:16px;color:#666;font-size:13px;">This lead was sent to up to 3 installers in the area. Please contact the homeowner within 24 hours.</p>
<p style="color:#999;font-size:12px;">TapWater.uk Lead Service</p>`,
        });
      }

      // Update lead status
      await supabaseForMatch
        .from("softener_leads")
        .update({
          status: "forwarded",
          forwarded_at: new Date().toISOString(),
        })
        .eq("postcode_district", postcode)
        .eq("email", email)
        .eq("status", "new")
        .order("created_at", { ascending: false })
        .limit(1);
    }
  }
} catch (err) {
  console.error("[softener-leads] Installer forwarding error:", err);
  // Don't fail the request — the lead is already saved
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build 2>&1 | tail -5`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/softener-leads/route.ts
git commit -m "feat: add installer matching and lead forwarding to softener-leads API"
```

---

### Task 9: Wire softener product card into hard water postcode pages

**Files:**
- Modify: `src/app/postcode/[district]/page.tsx`

- [ ] **Step 1: Read the current softener section in postcode pages**

Read the file to find where `SoftenerLeadForm` or `SoftenerLeadBanner` is rendered. Understand the current conditional rendering for hard water.

- [ ] **Step 2: Add conditional Waterdrop softener card**

Import the necessary functions and components:

```typescript
import { getProductBySlugIncludingUnavailable } from "@/lib/products";
```

Where the softener section is rendered (when hardness ≥ 200 mg/L), add the product card above the lead form:

```tsx
{/* Water softener section */}
{hardness && hardness.value >= 200 && (() => {
  const softenerProduct = getProductBySlugIncludingUnavailable("waterdrop-whr01");
  const isAvailable = softenerProduct && softenerProduct.availableInUk !== false;

  return (
    <>
      {isAvailable && softenerProduct && (
        <div className="mb-4">
          <ProductCard product={softenerProduct} pageType="postcode" highlight="Recommended for your hard water area" />
        </div>
      )}
      <SoftenerLeadForm
        postcode={data.district}
        hardnessValue={hardness.value}
        hardnessLabel={hardness.label}
        source="postcode_page"
      />
    </>
  );
})()}
```

- [ ] **Step 3: Verify build**

Run: `npm run build 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add src/app/postcode/
git commit -m "feat: conditionally show Waterdrop softener card on hard water postcode pages"
```

---

### Task 10: Update softener guide with conditional product recommendation

**Files:**
- Modify: `src/app/guides/best-water-softener-uk/page.tsx`

- [ ] **Step 1: Add product card to the guide page**

Import:

```typescript
import { getProductBySlugIncludingUnavailable } from "@/lib/products";
import { ProductCard } from "@/components/product-card";
```

After the "Get free quotes" section and before "UK areas with the hardest water", add a conditional product recommendation:

```tsx
{(() => {
  const softener = getProductBySlugIncludingUnavailable("waterdrop-whr01");
  if (!softener || softener.availableInUk === false) return null;

  return (
    <>
      <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">
        Our top pick: Waterdrop WHR01
      </h2>
      <ProductCard product={softener} pageType="guide" highlight="Now available in the UK" />
    </>
  );
})()}
```

- [ ] **Step 2: Verify build**

Run: `npm run build 2>&1 | tail -5`

- [ ] **Step 3: Commit**

```bash
git add src/app/guides/best-water-softener-uk/
git commit -m "feat: add conditional Waterdrop softener recommendation to softener guide"
```

---

### Task 11: Update sitemap and llms.txt

**Files:**
- Modify: `src/app/sitemap.ts`
- Modify: `src/app/llms.txt/route.ts`

- [ ] **Step 1: Ensure water-softeners filter page is in sitemap**

The `CATEGORY_ORDER` now includes `water_softener`, and the sitemap already maps over `CATEGORY_ORDER` using `CATEGORY_META[cat].slug`. Verify the slug `"water-softeners"` is correct and the page will be generated by the existing `src/app/filters/[category]/page.tsx` dynamic route.

- [ ] **Step 2: Update llms.txt**

Add to the "Water filter guides" section:

```
- [Water Softeners](https://www.tapwater.uk/filters/water-softeners): Water softener systems for hard water areas
```

Add to the "Key facts" section:

```
- Over 60% of England has hard water above 200 mg/L — a water softener can save £200+/year in energy and appliance costs
```

- [ ] **Step 3: Verify build**

Run: `npm run build 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add src/app/sitemap.ts src/app/llms.txt/route.ts
git commit -m "feat: add water softener category to sitemap and llms.txt"
```

---

### Task 12: Final verification

- [ ] **Step 1: Full build**

Run: `npm run build 2>&1 | tail -30`
Expected: Build succeeds. Check for new pages: `/filters/water-softeners`, `/partners`.

- [ ] **Step 2: Run all tests**

Run: `npm run test 2>&1`
Expected: All tests pass.

- [ ] **Step 3: Run lint**

Run: `npm run lint 2>&1`
Expected: No errors.

- [ ] **Step 4: Verify key pages**

Check that:
- `/filters/water-softeners` renders (with no product cards since WHR01 is `availableInUk: false`)
- `/partners` renders with signup form
- Postcode pages in hard water areas still show the lead form (no softener product card since unavailable)
- `/guides/best-water-softener-uk` does NOT show product card (since unavailable)
- Product cards on guide and filter pages show UTM parameters in affiliate links
- Product cards show "Check price on Amazon" for Amazon products and "Buy from [Brand]" for direct affiliates

- [ ] **Step 5: Commit any fixes and push**

```bash
git push origin main
```
