# Revenue Architecture Redesign — Design Spec

**Date:** 2026-04-07
**Status:** Draft
**Goal:** Redesign tapwater.uk's monetization to maximize revenue per visitor through tiered affiliate routing, a water softener lead gen pipeline with installer partnerships, and Waterdrop softener-ready product architecture.

---

## 1. Tiered Affiliate Model

### Problem

All products currently route through their respective affiliate programs, but there's no systematic strategy. Some high-ticket products may still use Amazon (3% commission) when a direct program (10%) exists. There's no tracking to measure which pages and products convert.

### Design

#### 1.1 Affiliate Routing Rules

| Price tier | Channel | Why |
|---|---|---|
| Under £100 | Amazon Associates (tag: tapwater21-21) | Impulse-buy range. Amazon checkout trust drives higher conversion rate. 3-4% on £25-85 = £0.75-3.40 per sale. Volume play. |
| Over £100 | Direct affiliate (Waterdrop Impact, Echo Impact, brand direct) | Considered purchase. 30-day cookie captures research-then-buy behavior. 10% on £120-1500+ = £12-150+ per sale. Margin play. |

#### 1.2 Product Catalogue Audit

Review every product in `src/lib/products.ts` and ensure affiliate routing matches the tier rules:

**Already correct (no change needed):**
- BRITA Marella XL (£25) → Amazon
- ZeroWater 12-Cup (£40) → Amazon
- Aqua Optima Liscia (£20) → Amazon
- PUR Plus Pitcher (£35) → Amazon
- AquaBliss SF220 (£25) → Amazon
- Philips AWP1775 (£35) → Amazon
- SimplexHealth 17-in-1 (£13) → Amazon
- SJ WAVE 16-in-1 (£15) → Amazon
- Jolie Showerhead (£85) → Amazon
- Waterdrop G3P600 (£399) → Impact direct
- Echo Water (£499) → Impact direct

**Need to check/potentially switch:**
- Waterdrop FC-06 (£30) → Amazon (correct, under £100)
- TAPP Water EcoPro (£60) → Amazon (correct, under £100)
- Waterdrop 10UA (£45) → Amazon (correct, under £100)
- Doulton HIP Ultracarb (£120) → Amazon currently. Check if Doulton has a direct program. If not, Amazon is fine — no alternative.
- Frizzlife PD600 (£329) → Amazon currently. **Should switch to direct if Frizzlife has an affiliate program.** Check Impact/ShareASale.
- BWT E1 (£250) → Amazon currently. Check if BWT has a direct program.
- Waterdrop WHF3T (£330) → waterdropfilter.com direct (correct)
- Aquasana EQ-1000 (£1,159) → aquasanaeurope.com direct (correct)

#### 1.3 Affiliate Link Tracking

Add UTM parameters to all affiliate links to track which pages convert:

```
?utm_source=tapwater&utm_medium=affiliate&utm_campaign={page_type}&utm_content={product_slug}
```

Where `page_type` is: `postcode`, `guide`, `filter-category`, `contaminant`

This requires updating the `affiliateUrl` field for each product OR dynamically appending UTMs at render time (preferred — keeps product data clean).

#### 1.4 CTA Differentiation

For products linking to brand direct (non-Amazon), the CTA button should say "Buy from [Brand]" or "View on [Brand]". For Amazon products, "Check price on Amazon". This is subtle but signals legitimacy.

No visual differentiation needed between Amazon and direct — users don't care about our commission structure.

---

## 2. Lead Gen Monetization Pipeline

### Problem

The water softener lead form exists (`src/components/softener-lead-form.tsx`), submissions go to Supabase `softener_leads` table, and admin gets emailed. But the leads have no buyer — there's no installer network purchasing them. Revenue from this channel is currently £0.

### Design

#### 2.1 Installer Partner Page

Create a `/partners` page (or `/partners/installers`) targeted at water softener installation companies.

**Content:**
- Headline: "Get qualified water softener leads in your area"
- Value prop: "Homeowners in hard water postcodes who've checked their water quality and requested quotes. Verified contact details, postcode-matched to your coverage area."
- How it works: 1) Sign up with your coverage area, 2) Receive matched leads, 3) Pay per converted lead or monthly retainer
- Social proof: "Covering 2,800+ UK postcodes with hardness data for 60% of England"
- Partner signup form

**Not a public-facing page for consumers** — this is B2B. Don't link it from main navigation. It's for direct outreach to installers and for Google to index for queries like "buy water softener leads UK."

#### 2.2 Partner Signup Form

Fields:
- Company name (required)
- Contact name (required)
- Email (required)
- Phone (required)
- Website (optional)
- Coverage postcodes/regions (required — multi-select of UK regions, or free-text postcode prefixes)
- Monthly lead volume desired (optional — dropdown: 5-10, 10-25, 25-50, 50+)

Stored in new Supabase table `installer_partners`.

#### 2.3 Lead Matching & Forwarding

When a softener lead comes in:
1. Match the lead's postcode to registered installer coverage areas
2. Forward the lead details to matching installer(s) via email (using existing Resend integration)
3. Update `softener_leads.status` from 'new' to 'forwarded'
4. Record which installer(s) received it

**For MVP:** Keep it simple — email-based forwarding. No dashboard, no real-time notifications, no bidding system. Just match on postcode region → email the lead to the right installer(s).

#### 2.4 Pricing Model

Not built into the site — handled manually via email/agreements with installers for now. Options to discuss with partners:
- Per-lead: £20-50 per qualified lead
- Monthly retainer: £200-500/month for exclusive territory access
- Trial: First 10 leads free, then paid

No payment processing in the site. Invoice manually.

---

## 3. Waterdrop Softener-Ready Architecture

### Problem

Waterdrop's WHR01 water softener ($2,499-3,499) is currently US-only. When it launches in the UK/EU, the site should instantly be able to promote it at ~10% commission (£200-280 per sale). The architecture needs to support this without code changes.

### Design

#### 3.1 Product Category Extension

Add `water_softener` to the `ProductCategory` type in `src/lib/types.ts`.

#### 3.2 Product Entry (Inactive)

Add the Waterdrop WHR01 to `src/lib/products.ts` with a new field `availableInUk: boolean` set to `false`. Include all product data (specs, pros, cons, price estimate in GBP) so the page is ready to go.

When `availableInUk` flips to `true`:
- The product appears in the filter catalogue
- The product card renders on hard water postcode pages
- The softener guide page shows the product recommendation

#### 3.3 Hard Water Page Rendering Logic

On postcode pages where hardness ≥ 200 mg/L, the display logic is:

```
IF waterdrop_softener.availableInUk:
  Show: ProductCard (Waterdrop WHR01) — primary CTA
  Show: SoftenerLeadForm — secondary CTA ("Prefer professional installation? Get quotes")
ELSE:
  Show: SoftenerLeadForm — primary CTA (current behavior)
```

#### 3.4 Softener Category Page

Add a `/filters/water-softeners` category page to the filter section. When no UK products are available, the page shows educational content about water softeners + the lead gen form. When products become available, it renders product cards.

Add to `CATEGORY_META` and `CATEGORY_ORDER` in `src/lib/products.ts`.

#### 3.5 Softener Guide Update

Update the existing `/guides/best-water-softener-uk` page to conditionally show the Waterdrop WHR01 when `availableInUk` is true, with full product card, specs, and affiliate link.

---

## 4. File Structure

### New Files
- `src/app/partners/page.tsx` — installer partner landing page
- `src/app/api/partners/route.ts` — partner signup form handler
- `src/app/filters/water-softeners/page.tsx` — softener category page (via existing `[category]` dynamic route if we add to CATEGORY_META)

### Modified Files
- `src/lib/types.ts` — add `water_softener` to ProductCategory, add `availableInUk` to FilterProduct
- `src/lib/products.ts` — add Waterdrop WHR01 entry (inactive), add water_softener to CATEGORY_META and CATEGORY_ORDER
- `src/components/filter-cards.tsx` — respect `availableInUk` flag, don't render unavailable products
- `src/components/softener-lead-form.tsx` — minor: add "or" separator when product card is also shown
- `src/app/postcode/[district]/page.tsx` — render Waterdrop softener card above lead form when available
- `src/app/guides/best-water-softener-uk/page.tsx` — conditional product recommendation
- `src/app/sitemap.ts` — add water-softeners category, partners page
- `src/app/api/softener-leads/route.ts` — add installer matching and forwarding logic
- `src/components/product-card.tsx` — append UTM tracking params to affiliate URLs at render time
- `src/app/llms.txt/route.ts` — add softener category mention

### New Supabase Table
```sql
CREATE TABLE installer_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  website TEXT,
  coverage_regions TEXT[] NOT NULL,
  coverage_postcodes TEXT[],
  desired_volume TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. What This Does NOT Include

- Payment processing or billing (manual invoicing for now)
- Installer dashboard or portal (email-based forwarding only)
- Automated commission tracking (use Impact/Amazon dashboards)
- A/B testing framework (premature — need traffic first)
- Display ad integration (need 50K sessions/month first)

---

## 6. Success Metrics

- Lead form submissions per month (target: 50+ within 3 months of traffic)
- Leads forwarded to installers per month
- Affiliate clicks on high-ticket products (RO systems, whole house)
- Revenue per visitor (track via UTM → Impact/Amazon dashboards)
- Time to activate Waterdrop softener: should be a single boolean flip
