# SEO & GEO Growth Audit — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all critical technical SEO issues found by the Ahrefs site audit, expand content to cover 20+ contaminants and missing high-value guides, and optimize for GEO (Generative Engine Optimization) to become the AI-cited authority on UK water quality.

**Architecture:** Four phases executed in priority order. Phase 1 fixes broken things (404s, schema errors, orphan pages). Phase 2 expands content (contaminant pages, guides). Phase 3 strengthens internal linking. Phase 4 optimizes for AI citation. Each phase deploys independently.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Supabase, Vitest

**Related plans (already exist — do NOT duplicate):**
- `2026-04-07-seo-optimization-plan.md` — performance, FAQ schema expansion, city/rankings enrichment
- `2026-04-07-softener-lead-gen.md` — softener lead capture form and API
- `2026-04-05-affiliate-growth-strategy.md` — product catalogue, filter pages, buying guides

---

## Phase 1: Fix Critical Technical SEO Issues (Ahrefs Audit)

---

### Task 1: Fix 6 broken water-problems sub-pages (404s)

The Ahrefs audit found 6 URLs returning 404 that are linked from `/guides/water-problems`. The code at `src/app/guides/water-problems/[slug]/page.tsx` exists with `generateStaticParams` mapping over `WATER_PROBLEMS`. This is likely a build/deployment issue.

**Files:**
- Check: `src/app/guides/water-problems/[slug]/page.tsx`
- Check: `src/lib/water-problems.ts`

- [ ] **Step 1: Verify the pages build locally**

Run: `npm run build 2>&1 | grep -E "water-problems|404|error" | head -20`

Check if the 6 water-problems sub-pages appear in the build output. Also verify:

Run: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/guides/water-problems/cloudy-tap-water`

Expected: 200. If 404, investigate the routing.

- [ ] **Step 2: If build issue — trigger a full redeploy**

If pages build locally but are 404 in production, the issue is stale ISR cache. Force a redeploy:

Run: `vercel --prod`

- [ ] **Step 3: If routing issue — fix the route structure**

If pages don't build locally, check that `generateStaticParams` returns the correct slugs. The WATER_PROBLEMS slugs must match exactly: `water-tastes-of-chlorine`, `cloudy-tap-water`, `brown-water-from-tap`, `metallic-taste-water`, `water-smells-like-rotten-eggs`, `low-water-pressure`.

- [ ] **Step 4: Verify all 6 pages return 200 in production**

Run:
```bash
for slug in water-tastes-of-chlorine cloudy-tap-water brown-water-from-tap metallic-taste-water water-smells-like-rotten-eggs low-water-pressure; do
  echo "$slug: $(curl -s -o /dev/null -w '%{http_code}' https://www.tapwater.uk/guides/water-problems/$slug)"
done
```

Expected: All return `200`.

- [ ] **Step 5: Commit any fixes**

```bash
git add -A && git commit -m "fix: resolve water-problems sub-page 404s"
```

---

### Task 2: Fix meta descriptions exceeding 155 characters (50 pages)

The Ahrefs audit found 50 pages with meta descriptions >160 chars. The postcode pages already have length-capping logic. The issue is in static pages: `/about`, `/supplier`, `/filters/shower-filters`, guides, etc.

**Files:**
- Modify: `src/app/about/page.tsx`
- Modify: `src/app/supplier/page.tsx`
- Modify: `src/app/filters/[category]/page.tsx`
- Modify: guide pages with long descriptions

- [ ] **Step 1: Find all meta descriptions >155 chars**

Run:
```bash
grep -rn "description:" src/app/ --include="*.tsx" -A1 | grep -E "description.*\"[^\"]{156,}" | head -30
```

Also check `generateMetadata` functions that build descriptions dynamically.

- [ ] **Step 2: Truncate static descriptions to ≤155 chars**

For each page with a too-long description, shorten it. Keep the core message and keywords. Example pattern:

```tsx
// Before (173 chars):
description: "TapWater.uk provides independent water quality reports for every UK postcode based on real drinking water tests from water companies and Environment Agency data."

// After (148 chars):
description: "Independent water quality reports for every UK postcode. Real drinking water test data from UK water companies and the Environment Agency."
```

- [ ] **Step 3: Add description length guard to filter category pages**

In `src/app/filters/[category]/page.tsx`, cap the generated description:

```tsx
const rawDesc = `${meta.description} ${meta.bestFor}. Price range: ${meta.priceRange}.`;
const description = rawDesc.length > 155 ? rawDesc.slice(0, 152) + "..." : rawDesc;
```

- [ ] **Step 4: Verify no description exceeds 155 chars**

Run: `npm run build 2>&1 | tail -5` (ensure build passes)

- [ ] **Step 5: Commit**

```bash
git add src/app/
git commit -m "fix: truncate meta descriptions to ≤155 chars (50 pages)"
```

---

### Task 3: Fix title tags exceeding 60 characters (98 pages)

Most offenders are postcode pages. The existing `generateMetadata` in `src/app/postcode/[district]/page.tsx` already has length logic (`maxTitleLen = 44`), but it appends the template " | TapWater.uk" from layout.tsx. Guide pages have long titles like "Best Water Filters UK: Which Type Do You Actually Need? (2026)".

**Files:**
- Modify: `src/app/postcode/[district]/page.tsx` (if needed)
- Modify: guide page metadata functions
- Check: `src/app/layout.tsx` for title template

- [ ] **Step 1: Check the title template in layout.tsx**

```bash
grep -n "title" src/app/layout.tsx | head -10
```

Determine if there's a `title.template` adding " | TapWater.uk" (15 chars). If so, page titles must be ≤45 chars.

- [ ] **Step 2: Audit guide page titles**

```bash
grep -rn "title:" src/app/guides/ --include="*.tsx" | grep -v "openGraph\|twitter\|og:" | head -30
```

Shorten any title >45 chars (accounting for the template suffix).

- [ ] **Step 3: Shorten guide titles**

Example fixes:
```tsx
// Before: "Best Water Filters UK: Which Type Do You Actually Need? (2026)" (63 chars)
// After:  "Best Water Filters UK (2026)" (28 chars)

// Before: "PFAS in UK Drinking Water: Everything You Need to Know (2026)" (61 chars)
// After:  "PFAS in UK Drinking Water (2026)" (31 chars)
```

The detail goes in the description, not the title.

- [ ] **Step 4: Verify build**

Run: `npm run build 2>&1 | tail -5`

- [ ] **Step 5: Commit**

```bash
git add src/app/guides/
git commit -m "fix: shorten title tags to ≤60 chars across guide pages"
```

---

### Task 4: Add 557 indexable pages to sitemap

The Ahrefs audit found 557 crawlable pages not included in the sitemap. These are likely city sub-pages or postcode pages that exist via ISR but aren't returned by `getAllPostcodeDistricts()`.

**Files:**
- Modify: `src/app/sitemap.ts`
- Check: `src/lib/data.ts` — `getAllPostcodeDistricts()` function

- [ ] **Step 1: Identify which pages are missing**

The sitemap already includes all postcodes from `getAllPostcodeDistricts()`, all cities, regions, suppliers, contaminants, guides, and filters. The missing pages are likely:
1. Compare pages (`/compare/[district1]/vs/[district2]`)
2. Postcode pages that have data but aren't returned by the data query

Check what `getAllPostcodeDistricts` returns vs what Supabase has:

```bash
grep -n "getAllPostcodeDistricts" src/lib/data.ts
```

Read the function to understand if it filters out any postcodes.

- [ ] **Step 2: Ensure all postcodes with data are in the sitemap**

If `getAllPostcodeDistricts()` is filtering (e.g., only scored postcodes), change it to include ALL postcodes that have any data. The sitemap already handles this — check if the function itself is the bottleneck.

- [ ] **Step 3: Add compare pages to sitemap (if applicable)**

If compare pages (`/compare/[d1]/vs/[d2]`) are being crawled via internal links but not in the sitemap, decide: either add the most-linked ones to the sitemap, or add `noindex` to prevent crawl budget waste.

- [ ] **Step 4: Commit**

```bash
git add src/app/sitemap.ts src/lib/data.ts
git commit -m "fix: include all indexable pages in sitemap (557 missing)"
```

---

### Task 5: Fix orphan pages — add internal links to 120 postcode pages with zero incoming links

The Ahrefs audit found 120 indexable postcode pages with no internal links pointing to them. They're in the sitemap but have zero discoverability via crawling.

**Files:**
- Modify: `src/app/postcode/[district]/page.tsx` — ensure `nearbyPostcodes` links cover orphans
- Modify: `src/app/city/[slug]/page.tsx` — ensure ALL postcodes in a city are linked
- Modify: `src/app/supplier/[slug]/page.tsx` — ensure ALL postcodes for a supplier are linked
- Check: `src/lib/data.ts` — how `nearbyPostcodes` are computed

- [ ] **Step 1: Understand how nearbyPostcodes are determined**

```bash
grep -n "nearbyPostcodes\|nearby" src/lib/data.ts | head -20
```

If nearby postcodes are computed by geographic proximity, orphan postcodes in remote areas (e.g., TR9, LL77) may have no nearby pages linking to them.

- [ ] **Step 2: Ensure city pages link to ALL postcodes in their area**

In `src/app/city/[slug]/page.tsx`, verify that the page renders links to every postcode district within that city's boundaries, not just a subset. If it shows only top/bottom N, add an expandable "View all X areas" section.

- [ ] **Step 3: Ensure supplier pages link to ALL served postcodes**

In `src/app/supplier/[slug]/page.tsx`, verify that ALL postcodeAreas for a supplier are rendered as links, not just a preview.

- [ ] **Step 4: Add region pages as a safety net**

In `src/app/region/[slug]/page.tsx`, ensure every postcode in that region is linked. Region pages should be the catch-all that ensures no postcode is orphaned.

- [ ] **Step 5: Commit**

```bash
git add src/app/city/ src/app/supplier/ src/app/region/
git commit -m "fix: add internal links to 120 orphan postcode pages via city/supplier/region pages"
```

---

## Phase 2: Content Expansion

---

### Task 6: Add 12 new contaminant pages

Expand from 8 contaminants to 20. The site tests 100+ contaminants but only has pages for 8. Adding pages for the most commonly detected ones creates topical authority and new ranking opportunities.

**Files:**
- Modify: `src/app/contaminant/[slug]/page.tsx` — add entries to `CONTAMINANTS` record
- Modify: `src/app/sitemap.ts` — add slugs to `CONTAMINANT_SLUGS`
- Modify: `src/app/contaminant/page.tsx` — hub page will auto-populate

- [ ] **Step 1: Add 12 new contaminant entries to the CONTAMINANTS record**

Add these to the `CONTAMINANTS` object in `src/app/contaminant/[slug]/page.tsx`:

```typescript
arsenic: {
  name: "Arsenic",
  description: "Arsenic is a naturally occurring element found in rocks and soil that can dissolve into groundwater. In the UK, arsenic levels in drinking water are generally low, but some areas with certain geological conditions — particularly in Cornwall, Devon, and parts of the North East — may have naturally elevated levels. Long-term exposure even at low levels is a concern.",
  healthEffects: "Chronic exposure to arsenic in drinking water has been linked to increased risk of skin, bladder, and lung cancers. It can also cause skin lesions, cardiovascular disease, diabetes, and neurological effects. The WHO classifies arsenic as a Group 1 carcinogen. Children and pregnant women are particularly vulnerable.",
  sources: "Arsenic enters drinking water primarily through natural geological processes — dissolving from arsenic-rich rocks and minerals into groundwater. Industrial contamination from mining, smelting, and pesticide use (historically, arsenic-based pesticides were widely used) can also contribute. In the UK, the South West has the highest natural arsenic levels.",
  ukLimit: "0.01 mg/L",
  whoGuideline: "0.01 mg/L",
  euLimit: "0.01 mg/L",
  removal: ["Reverse osmosis", "Ion exchange", "Activated carbon"],
},
manganese: {
  name: "Manganese",
  description: "Manganese is a naturally occurring mineral found in rocks, soil, and water. While it's an essential nutrient in small amounts, elevated levels in drinking water can cause aesthetic problems (brown/black staining) and potential health concerns. Manganese is one of the most common causes of discoloured tap water in the UK.",
  healthEffects: "At levels above the UK limit, manganese can cause neurological effects, particularly in infants and young children. Long-term exposure to elevated manganese has been associated with cognitive and behavioural effects in children. In adults, very high exposure can cause manganism, a condition with symptoms similar to Parkinson's disease.",
  sources: "Manganese enters water naturally from geological sources. It is more common in groundwater than surface water. Disturbance of manganese deposits in water mains during maintenance work is a frequent cause of discoloured water. Areas served by groundwater sources in southern and eastern England tend to have higher manganese levels.",
  ukLimit: "0.05 mg/L",
  whoGuideline: "0.08 mg/L",
  euLimit: "0.05 mg/L",
  removal: ["Reverse osmosis", "Ion exchange", "Activated carbon"],
},
iron: {
  name: "Iron",
  description: "Iron is one of the most common elements on Earth and is present in most UK water supplies at low levels. While iron is an essential nutrient, elevated levels in drinking water cause aesthetic problems — rust-coloured staining of laundry, fixtures, and sinks, and an unpleasant metallic taste. Iron is the most frequent cause of brown or orange discolouration in UK tap water.",
  healthEffects: "Iron in drinking water at levels found in the UK is not considered a health risk. The UK limit of 0.2 mg/L is set for aesthetic reasons rather than health. Very high iron intake from all sources can cause gastrointestinal effects, but this would not occur from drinking water alone at levels near the UK limit.",
  sources: "Iron in UK tap water comes from two main sources: natural dissolution from iron-bearing rocks into groundwater, and corrosion of cast iron water mains. Mains flushing, burst pipes, or changes in water pressure can disturb iron deposits, causing temporary discolouration. Old iron mains are being replaced across the UK, but the process takes decades.",
  ukLimit: "0.2 mg/L",
  whoGuideline: "No health-based guideline",
  euLimit: "0.2 mg/L",
  removal: ["Activated carbon", "Reverse osmosis", "Ion exchange"],
},
mercury: {
  name: "Mercury",
  description: "Mercury is a toxic heavy metal that can contaminate drinking water through industrial pollution, mining waste, and natural geological sources. In the UK, mercury levels in drinking water are generally very low and well within safe limits. It is nonetheless monitored as part of routine water quality testing due to its extreme toxicity.",
  healthEffects: "Mercury is highly toxic to the nervous system, kidneys, and developing foetus. Even low-level chronic exposure can impair cognitive function, coordination, and vision. Methylmercury (the organic form found mainly in fish) is more toxic than inorganic mercury typically found in water, but both forms are harmful at elevated levels.",
  sources: "Mercury can enter water through industrial discharges, mining operations, coal-fired power plant emissions (which deposit mercury into waterways), and natural weathering of mercury-containing minerals. In the UK, historical industrial sites and contaminated land are the main risk areas.",
  ukLimit: "0.001 mg/L",
  whoGuideline: "0.006 mg/L",
  euLimit: "0.001 mg/L",
  removal: ["Reverse osmosis", "Distillation", "Activated carbon"],
},
pesticides: {
  name: "Pesticides",
  description: "Pesticides are chemicals used in agriculture, horticulture, and amenity maintenance to control weeds, insects, and fungi. Multiple pesticide compounds can be found in UK drinking water sources, particularly in agricultural areas of eastern and southern England. The UK regulates total pesticide levels in drinking water more strictly than most countries.",
  healthEffects: "The health effects of pesticides in drinking water depend on the specific compound, concentration, and duration of exposure. Some pesticides are suspected endocrine disruptors, while others have been linked to cancer risk at high doses. At the levels typically found in UK drinking water (well below the limit), the health risk is considered very low.",
  sources: "Pesticides reach drinking water sources through agricultural runoff, spray drift, and leaching through soil into groundwater. The most commonly detected pesticides in UK water include metaldehyde (slug pellets), clopyralid, and MCPA. Urban areas can also contribute through herbicide use on parks, railways, and gardens.",
  ukLimit: "0.1 µg/L (individual), 0.5 µg/L (total)",
  whoGuideline: "Varies by compound",
  euLimit: "0.1 µg/L (individual), 0.5 µg/L (total)",
  removal: ["Activated carbon", "Reverse osmosis", "Carbon block filters"],
},
microplastics: {
  name: "Microplastics",
  description: "Microplastics are tiny plastic particles smaller than 5mm found in water, food, and air. Research has confirmed their presence in UK tap water, bottled water, and source water. The UK does not currently regulate or routinely monitor microplastics in drinking water, making it one of the emerging contaminants of concern alongside PFAS.",
  healthEffects: "Research into the health effects of microplastics in drinking water is ongoing. Current evidence suggests that at the levels found in tap water, the health risk is likely low. However, concerns exist around the chemicals attached to microplastics (additives, absorbed pollutants) and the potential for chronic inflammatory effects from long-term ingestion.",
  sources: "Microplastics enter water from the breakdown of larger plastic waste, synthetic textile fibres released during washing, tyre wear particles from road runoff, and microbeads from personal care products. Wastewater treatment removes the majority but not all microplastics, and those that pass through enter rivers and reservoirs used for drinking water.",
  ukLimit: null,
  whoGuideline: "No guideline set",
  euLimit: "Monitoring required from 2026",
  removal: ["Reverse osmosis", "Carbon block filters", "Activated carbon"],
},
nitrite: {
  name: "Nitrite",
  description: "Nitrite is a reactive nitrogen compound closely related to nitrate. It forms when bacteria convert nitrate in water or in the body. Nitrite is more toxic than nitrate and can be present in drinking water where distribution systems allow biological activity, or where source water has been contaminated. It is commonly detected across many UK postcodes.",
  healthEffects: "Nitrite reacts with haemoglobin to form methaemoglobin, which cannot carry oxygen. This is most dangerous for infants under three months (blue baby syndrome). In adults, chronic exposure to elevated nitrite has been linked to increased cancer risk through the formation of N-nitroso compounds in the stomach.",
  sources: "Nitrite in drinking water comes from the bacterial reduction of nitrate (agricultural runoff), sewage contamination, and biological activity in distribution pipes. It can also form within the water distribution network itself, particularly in older systems with biofilm growth. Nitrite levels are generally lower than nitrate but more concerning per unit.",
  ukLimit: "0.5 mg/L",
  whoGuideline: "3 mg/L",
  euLimit: "0.5 mg/L",
  removal: ["Reverse osmosis", "Ion exchange", "Distillation"],
},
turbidity: {
  name: "Turbidity",
  description: "Turbidity measures the cloudiness of water caused by suspended particles — clay, silt, organic matter, algae, and microorganisms. While not a contaminant itself, turbidity is one of the most important indicators of water quality. High turbidity can indicate treatment failures and can harbour harmful bacteria and parasites.",
  healthEffects: "Turbidity itself is not directly harmful, but the particles causing it can shield bacteria and viruses from disinfection, reducing the effectiveness of chlorination. High turbidity events have been associated with outbreaks of gastrointestinal illness. Cryptosporidium, a parasite that causes severe diarrhoea, is particularly associated with turbidity events.",
  sources: "Turbidity in UK water sources comes from soil erosion, urban runoff, algal blooms in reservoirs, and disturbance of sediment in water mains. Heavy rainfall events can dramatically increase turbidity in surface water sources. Treatment works use coagulation, sedimentation, and filtration to reduce turbidity before distribution.",
  ukLimit: "4 NTU",
  whoGuideline: "1 NTU (ideal <0.5)",
  euLimit: "1 NTU at treatment works",
  removal: ["Carbon block filters", "Reverse osmosis", "Activated carbon"],
},
aluminium: {
  name: "Aluminium",
  description: "Aluminium is the most abundant metal in the Earth's crust and enters drinking water both naturally and as a result of water treatment. Aluminium sulphate is widely used as a coagulant in UK water treatment works to remove particles and colour from raw water. When treatment is operating correctly, residual aluminium in tap water is well within safe limits.",
  healthEffects: "The health effects of aluminium in drinking water remain debated. Some epidemiological studies have suggested a possible link between high aluminium exposure and Alzheimer's disease, though the evidence is inconclusive and contested. At the levels found in UK drinking water, most health authorities consider the risk minimal.",
  sources: "Aluminium in UK tap water comes from two sources: natural dissolution from aluminium-bearing rocks and soils (particularly in upland areas with acidic water), and the use of aluminium sulphate as a coagulant in water treatment. Treatment process failures can occasionally release higher-than-normal aluminium levels into supply.",
  ukLimit: "0.2 mg/L",
  whoGuideline: "0.2 mg/L",
  euLimit: "0.2 mg/L",
  removal: ["Reverse osmosis", "Distillation", "Ion exchange"],
},
coliform: {
  name: "Coliform Bacteria",
  description: "Coliform bacteria are a broad group of bacteria found naturally in the environment. Their presence in treated drinking water is used as an indicator of potential contamination — not because coliforms themselves are usually harmful, but because they suggest that treatment or distribution has been compromised and more dangerous organisms could be present.",
  healthEffects: "Most coliform bacteria are not harmful to healthy adults. However, their detection in treated water triggers mandatory investigation because it indicates a breakdown in water safety barriers. If faecal coliforms or E. coli are found alongside total coliforms, the risk of serious waterborne illness increases significantly.",
  sources: "Coliforms enter water from soil, vegetation, and animal or human waste. In treated drinking water, their presence usually indicates a failure in the treatment process, a breach in the distribution system (broken pipe, cross-connection), or contamination during storage. Coliform detections are the most common reason for water company enforcement action by the DWI.",
  ukLimit: "0 per 100ml",
  whoGuideline: "0 per 100ml",
  euLimit: "0 per 100ml",
  removal: ["UV disinfection", "Reverse osmosis", "Chlorination"],
},
cadmium: {
  name: "Cadmium",
  description: "Cadmium is a toxic heavy metal that can contaminate drinking water through industrial pollution, galvanised plumbing, and natural geological sources. In the UK, cadmium levels in drinking water are generally very low. However, cadmium is highly toxic even at low concentrations and accumulates in the body over time, particularly in the kidneys.",
  healthEffects: "Cadmium primarily damages the kidneys, causing renal tubular dysfunction after chronic exposure. It is classified as a Group 1 carcinogen by the IARC, with links to lung cancer from inhalation and possible links to kidney cancer. Cadmium also interferes with calcium metabolism, potentially contributing to osteoporosis and bone fractures.",
  sources: "Cadmium enters water from industrial discharges (battery manufacturing, pigments, plastics), corrosion of galvanised pipes and fittings, and natural weathering of cadmium-bearing rocks. Phosphate fertilisers used in agriculture can also contain cadmium, which may leach into groundwater. Older properties with galvanised plumbing are at higher risk.",
  ukLimit: "0.005 mg/L",
  whoGuideline: "0.003 mg/L",
  euLimit: "0.005 mg/L",
  removal: ["Reverse osmosis", "Distillation", "Ion exchange"],
},
chromium: {
  name: "Chromium",
  description: "Chromium exists in two main forms: trivalent chromium (Cr-III), which is an essential nutrient, and hexavalent chromium (Cr-VI), which is toxic and carcinogenic. UK drinking water regulations set a combined limit for total chromium. Hexavalent chromium can enter water through industrial contamination, while trivalent chromium is naturally present in many water sources.",
  healthEffects: "Hexavalent chromium (Cr-VI) is classified as a Group 1 carcinogen by the IARC when inhaled, and studies suggest oral exposure through drinking water may increase cancer risk. At levels near the UK limit, the primary concern is long-term kidney and liver effects. Trivalent chromium at normal dietary levels is not harmful and is actually required for glucose metabolism.",
  sources: "Chromium enters drinking water from industrial discharges (chrome plating, stainless steel manufacturing, leather tanning, textile dyeing), natural erosion of chromium-bearing rocks, and contamination from industrial waste sites. The UK's industrial heritage means some areas, particularly near historical manufacturing centres, may have elevated groundwater chromium.",
  ukLimit: "0.05 mg/L (total)",
  whoGuideline: "0.05 mg/L",
  euLimit: "0.025 mg/L (from 2036)",
  removal: ["Reverse osmosis", "Ion exchange", "Activated carbon"],
},
```

- [ ] **Step 2: Update CONTAMINANT_SLUGS in sitemap.ts**

In `src/app/sitemap.ts`, add the 12 new slugs:

```typescript
const CONTAMINANT_SLUGS = [
  "pfas", "lead", "nitrate", "copper", "chlorine", "fluoride", "trihalomethanes", "ecoli",
  // New:
  "arsenic", "manganese", "iron", "mercury", "pesticides", "microplastics",
  "nitrite", "turbidity", "aluminium", "coliform", "cadmium", "chromium",
];
```

- [ ] **Step 3: Add CONTAMINANT_GUIDE_MAP entries for new contaminants**

In the same file, add guide/filter cross-links for each new contaminant:

```typescript
arsenic: { guideTitle: "Best reverse osmosis system UK", guideHref: "/guides/best-reverse-osmosis-system-uk/", categoryTitle: "Reverse osmosis systems", categoryHref: "/filters/reverse-osmosis-systems" },
manganese: { guideTitle: "Best whole house water filter UK", guideHref: "/guides/best-whole-house-water-filter-uk/", categoryTitle: "Whole house filters", categoryHref: "/filters/whole-house-filters" },
iron: { guideTitle: "Best whole house water filter UK", guideHref: "/guides/best-whole-house-water-filter-uk/", categoryTitle: "Whole house filters", categoryHref: "/filters/whole-house-filters" },
mercury: { guideTitle: "Best reverse osmosis system UK", guideHref: "/guides/best-reverse-osmosis-system-uk/", categoryTitle: "Reverse osmosis systems", categoryHref: "/filters/reverse-osmosis-systems" },
pesticides: { guideTitle: "Best water filters UK", guideHref: "/guides/best-water-filters-uk/", categoryTitle: "Reverse osmosis systems", categoryHref: "/filters/reverse-osmosis-systems" },
microplastics: { guideTitle: "Best water filters UK", guideHref: "/guides/best-water-filters-uk/", categoryTitle: "Under-sink filters", categoryHref: "/filters/under-sink-filters" },
nitrite: { guideTitle: "Best reverse osmosis system UK", guideHref: "/guides/best-reverse-osmosis-system-uk/", categoryTitle: "Reverse osmosis systems", categoryHref: "/filters/reverse-osmosis-systems" },
turbidity: { guideTitle: "Best water testing kit UK", guideHref: "/guides/best-water-testing-kit-uk/", categoryTitle: "Water testing kits", categoryHref: "/filters/water-testing-kits" },
aluminium: { guideTitle: "Best reverse osmosis system UK", guideHref: "/guides/best-reverse-osmosis-system-uk/", categoryTitle: "Reverse osmosis systems", categoryHref: "/filters/reverse-osmosis-systems" },
coliform: { guideTitle: "Best water testing kit UK", guideHref: "/guides/best-water-testing-kit-uk/", categoryTitle: "Water testing kits", categoryHref: "/filters/water-testing-kits" },
cadmium: { guideTitle: "Best reverse osmosis system UK", guideHref: "/guides/best-reverse-osmosis-system-uk/", categoryTitle: "Reverse osmosis systems", categoryHref: "/filters/reverse-osmosis-systems" },
chromium: { guideTitle: "Best reverse osmosis system UK", guideHref: "/guides/best-reverse-osmosis-system-uk/", categoryTitle: "Reverse osmosis systems", categoryHref: "/filters/reverse-osmosis-systems" },
```

- [ ] **Step 4: Add REMOVAL_DESCRIPTIONS for any missing methods**

Check if all removal methods referenced in new contaminants have descriptions. `Ion exchange` and `Distillation` are already defined. All methods used above are already in `REMOVAL_DESCRIPTIONS`.

- [ ] **Step 5: Verify build**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds with 20 contaminant pages generated.

- [ ] **Step 6: Commit**

```bash
git add src/app/contaminant/ src/app/sitemap.ts
git commit -m "feat: add 12 new contaminant pages (arsenic, manganese, iron, mercury, pesticides, microplastics, nitrite, turbidity, aluminium, coliform, cadmium, chromium)"
```

---

### Task 7: Create "Best Water Softener UK" guide page

This directly supports the existing softener lead gen form. Hard water areas (260+ mg/L) already show the softener form on postcode pages, but there's no guide page to rank for "best water softener UK" — a high-intent commercial keyword.

**Files:**
- Create: `src/app/guides/best-water-softener-uk/page.tsx`
- Modify: `src/app/sitemap.ts` — add to GUIDE_SLUGS
- Modify: `src/app/guides/page.tsx` — add to guide listing

- [ ] **Step 1: Create the guide page**

Create `src/app/guides/best-water-softener-uk/page.tsx` following the same pattern as existing guides (e.g., `best-water-filter-jug-uk/page.tsx`). Content structure:

```tsx
import Link from "next/link";
import type { Metadata } from "next";
import { PostcodeSearch } from "@/components/postcode-search";
import { ArticleSchema, BreadcrumbSchema, FAQSchema } from "@/components/json-ld";

export const revalidate = 86400;

const BASE_URL = "https://www.tapwater.uk";

export const metadata: Metadata = {
  title: "Best Water Softener UK (2026)",
  description: "Compare the best water softeners for UK homes. Hard water solutions, installation costs, salt vs salt-free, and which areas need one most.",
  openGraph: {
    title: "Best Water Softener UK (2026)",
    description: "Compare the best water softeners for UK homes. Hard water solutions, installation costs, and which areas need one most.",
    url: `${BASE_URL}/guides/best-water-softener-uk`,
    type: "article",
  },
};

export default function BestWaterSoftenerUK() {
  const dateStr = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <BreadcrumbSchema
        items={[
          { name: "Home", url: BASE_URL },
          { name: "Guides", url: `${BASE_URL}/guides` },
          { name: "Best Water Softener UK", url: `${BASE_URL}/guides/best-water-softener-uk` },
        ]}
      />
      <ArticleSchema
        headline="Best Water Softener UK (2026)"
        description="Compare the best water softeners for UK homes."
        url={`${BASE_URL}/guides/best-water-softener-uk`}
        datePublished="2026-04-07"
        dateModified={dateStr}
        authorName="Remy"
        authorUrl={`${BASE_URL}/about`}
      />
      <FAQSchema
        faqs={[
          { question: "Do I need a water softener in the UK?", answer: "If your water hardness is above 200 mg/L (classified as 'hard' or 'very hard'), a water softener can prevent limescale buildup, extend appliance life, and reduce energy bills. Over 60% of England is in a hard water area." },
          { question: "How much does a water softener cost to install in the UK?", answer: "A typical water softener costs £400-£1,500 for the unit, plus £150-£300 for professional installation. Annual running costs are £50-£100 for salt and water. Most households recoup the cost within 2-4 years through energy savings and reduced appliance repairs." },
          { question: "What is the difference between salt-based and salt-free water softeners?", answer: "Salt-based softeners use ion exchange to remove calcium and magnesium, genuinely softening the water. Salt-free systems (water conditioners) do not remove minerals but change their structure to reduce scale formation. Salt-based systems are more effective but require ongoing salt purchases and a drain connection." },
          { question: "Is softened water safe to drink?", answer: "Softened water is safe for most adults. However, the softening process adds a small amount of sodium, so the DWI recommends keeping an unsoftened tap for drinking and cooking, especially for babies and people on low-sodium diets." },
        ]}
      />

      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <nav className="text-sm text-muted mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5 flex-wrap">
            <li><Link href="/" className="hover:text-accent transition-colors">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/guides" className="hover:text-accent transition-colors">Guides</Link></li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-ink" aria-current="page">Best Water Softener UK</li>
          </ol>
        </nav>

        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          Best Water Softener UK (2026)
        </h1>
        <div className="flex items-center gap-2 mt-3 mb-8 text-sm text-muted">
          <span>By <span className="text-ink font-medium">Remy</span></span>
          <span>·</span>
          <time dateTime={dateStr}>
            Updated {new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
          </time>
          <span>·</span>
          <span>Independent research</span>
        </div>

        {/* GEO summary paragraph */}
        <div className="card p-5 border-l-4 border-l-accent mb-8">
          <p className="text-base text-body leading-relaxed">
            <strong className="text-ink">Over 60% of England has hard water above 200 mg/L,</strong> causing
            limescale buildup that damages boilers, shortens appliance life, and increases energy bills by up to
            £200 per year. A water softener is the only way to genuinely remove calcium and magnesium from your
            supply. This guide covers how softeners work, what they cost, and how to get quotes from vetted UK
            installers.
          </p>
        </div>

        {/* Section: Do you need one? */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">
          Do you need a water softener?
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          Check your water hardness using your postcode. If your area scores above 200 mg/L, a water softener will make a noticeable difference. Above 300 mg/L, it&apos;s strongly recommended.
        </p>
        <PostcodeSearch size="sm" />

        {/* Section: How they work */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">
          How water softeners work
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          Ion exchange water softeners pass hard water through a resin bed that swaps calcium and magnesium
          ions for sodium ions. The resin periodically regenerates using a brine solution (salt dissolved in
          water), flushing the captured minerals to drain. This cycle repeats automatically, typically every
          few days depending on water usage and hardness level.
        </p>

        {/* Section: Salt vs salt-free */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">
          Salt-based vs salt-free: which is right for you?
        </h2>
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-rule">
                <th className="text-left py-2 pr-4 font-semibold text-body">Feature</th>
                <th className="text-left py-2 pr-4 font-semibold text-body">Salt-based softener</th>
                <th className="text-left py-2 font-semibold text-body">Salt-free conditioner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              <tr><td className="py-2 pr-4 text-body">Removes hardness minerals</td><td className="py-2 pr-4 text-safe font-medium">Yes</td><td className="py-2 text-warning font-medium">No (prevents scale only)</td></tr>
              <tr><td className="py-2 pr-4 text-body">Ongoing salt costs</td><td className="py-2 pr-4 text-body">£50-100/year</td><td className="py-2 text-safe font-medium">None</td></tr>
              <tr><td className="py-2 pr-4 text-body">Drain connection needed</td><td className="py-2 pr-4 text-body">Yes</td><td className="py-2 text-safe font-medium">No</td></tr>
              <tr><td className="py-2 pr-4 text-body">Scale prevention</td><td className="py-2 pr-4 text-safe font-medium">Excellent</td><td className="py-2 text-body">Moderate</td></tr>
              <tr><td className="py-2 pr-4 text-body">Soap lather improvement</td><td className="py-2 pr-4 text-safe font-medium">Yes</td><td className="py-2 text-warning font-medium">Minimal</td></tr>
              <tr><td className="py-2 pr-4 text-body">Typical cost (installed)</td><td className="py-2 pr-4 text-body">£800-£1,500</td><td className="py-2 text-body">£300-£600</td></tr>
            </tbody>
          </table>
        </div>

        {/* Section: What it costs */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">
          What does a water softener cost?
        </h2>
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <div className="card p-4 text-center">
            <p className="text-xs text-muted uppercase tracking-wider mb-1">Unit cost</p>
            <p className="text-2xl font-data font-bold text-ink">£400–£1,500</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-xs text-muted uppercase tracking-wider mb-1">Installation</p>
            <p className="text-2xl font-data font-bold text-ink">£150–£300</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-xs text-muted uppercase tracking-wider mb-1">Annual running</p>
            <p className="text-2xl font-data font-bold text-ink">£50–£100</p>
          </div>
        </div>
        <p className="text-base text-body leading-relaxed">
          Most households in very hard water areas (300+ mg/L) recoup the cost within 2-3 years through
          lower energy bills, fewer appliance repairs, and reduced spending on cleaning products.
        </p>

        {/* Section: Get quotes */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">
          Get free quotes from vetted UK installers
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          We work with a network of vetted water softener installers across the UK. Enter your details below
          for up to 3 free, no-obligation quotes within 24 hours.
        </p>
        <div className="card p-6 bg-[var(--color-surface-raised)]">
          <p className="text-sm text-muted mb-4">
            This is a free service. We may earn a referral fee from installers — this does not affect the
            price you pay. See our{" "}
            <Link href="/affiliate-disclosure" className="text-accent hover:underline">
              affiliate disclosure
            </Link>.
          </p>
          {/* Embed the existing SoftenerLeadForm component */}
          <p className="text-sm text-body italic">
            Enter your postcode above to check your water hardness, then use the form on your postcode report page to request quotes.
          </p>
        </div>

        {/* Section: Hardest water areas */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">
          UK areas with the hardest water
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          The hardest water in the UK is concentrated in London, the South East, and East of England — areas
          supplied primarily by Thames Water, Affinity Water, and Anglian Water. These regions consistently
          measure above 250 mg/L, with some areas exceeding 350 mg/L.
        </p>
        <p className="text-base text-body leading-relaxed">
          Use our{" "}
          <Link href="/hardness" className="text-accent hover:underline">water hardness checker</Link>{" "}
          to see exactly how hard your water is, or explore our{" "}
          <Link href="/rankings" className="text-accent hover:underline">UK water quality rankings</Link>{" "}
          to compare areas.
        </p>

        {/* Related links */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">Related guides</h2>
        <ul className="space-y-2 text-base text-body">
          <li className="flex gap-2">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-rule-strong shrink-0" aria-hidden="true" />
            <Link href="/guides/water-hardness-map/" className="text-accent hover:underline">
              UK Water Hardness Map — check hardness by postcode
            </Link>
          </li>
          <li className="flex gap-2">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-rule-strong shrink-0" aria-hidden="true" />
            <Link href="/guides/best-water-filters-uk/" className="text-accent hover:underline">
              Best Water Filters UK — all filter types compared
            </Link>
          </li>
          <li className="flex gap-2">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-rule-strong shrink-0" aria-hidden="true" />
            <Link href="/filters/whole-house-filters" className="text-accent hover:underline">
              Whole House Filters — protect every tap and appliance
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add to GUIDE_SLUGS in sitemap.ts**

```typescript
// Add to the GUIDE_SLUGS array:
"best-water-softener-uk",
```

- [ ] **Step 3: Add to guides hub page**

In `src/app/guides/page.tsx`, add the new guide to the listing with title "Best Water Softener UK" and description "Compare water softeners, costs, and which areas need one most".

- [ ] **Step 4: Verify build**

Run: `npm run build 2>&1 | tail -10`

- [ ] **Step 5: Commit**

```bash
git add src/app/guides/best-water-softener-uk/ src/app/sitemap.ts src/app/guides/page.tsx
git commit -m "feat: add 'Best Water Softener UK' guide page with lead gen integration"
```

---

## Phase 3: Internal Linking & GEO Optimization

---

### Task 8: Add contaminant cross-links on postcode pages

When a postcode page detects elevated contaminants, it should link to the relevant contaminant detail page. Currently postcode pages show contaminant data in a table but don't link to `/contaminant/[slug]`.

**Files:**
- Modify: `src/components/contaminant-table.tsx` — make contaminant names clickable

- [ ] **Step 1: Read the current contaminant-table component**

```bash
cat src/components/contaminant-table.tsx
```

Understand how contaminant names are rendered.

- [ ] **Step 2: Create a slug mapping for contaminant names**

Add a mapping function at the top of the component (or in a shared util):

```typescript
const CONTAMINANT_SLUG_MAP: Record<string, string> = {
  // Existing 8
  "PFAS": "pfas", "Lead": "lead", "Nitrate": "nitrate", "Copper": "copper",
  "Chlorine": "chlorine", "Fluoride": "fluoride", "Trihalomethanes": "trihalomethanes",
  "E. coli": "ecoli",
  // New 12
  "Arsenic": "arsenic", "Manganese": "manganese", "Iron": "iron", "Mercury": "mercury",
  "Microplastics": "microplastics", "Nitrite": "nitrite", "Turbidity": "turbidity",
  "Aluminium": "aluminium", "Coliform Bacteria": "coliform", "Cadmium": "cadmium",
  "Chromium": "chromium",
};
```

- [ ] **Step 3: Make contaminant names clickable in the table**

Wrap contaminant names that have a matching slug in a Link:

```tsx
import Link from "next/link";

// In the table row rendering:
const slug = CONTAMINANT_SLUG_MAP[reading.name];
const nameElement = slug ? (
  <Link href={`/contaminant/${slug}`} className="text-accent hover:underline">
    {reading.name}
  </Link>
) : (
  <span>{reading.name}</span>
);
```

- [ ] **Step 4: Verify build and visual check**

Run: `npm run build 2>&1 | tail -5`

- [ ] **Step 5: Commit**

```bash
git add src/components/contaminant-table.tsx
git commit -m "feat: link contaminant names in postcode tables to /contaminant/ pages"
```

---

### Task 9: Add GEO-optimized summary paragraphs to city and region pages

AI models need concise, quotable factual statements to cite. Add a branded summary paragraph at the top of every city and region page that AI can extract.

**Files:**
- Modify: `src/app/city/[slug]/page.tsx`
- Modify: `src/app/region/[slug]/page.tsx`

- [ ] **Step 1: Add GEO summary to city pages**

In `src/app/city/[slug]/page.tsx`, add a summary callout after the H1, before the main content:

```tsx
{/* GEO: AI-citable summary */}
<div className="card p-5 border-l-4 border-l-accent mb-8">
  <p className="text-base text-body leading-relaxed">
    <strong className="text-ink">
      According to TapWater.uk&apos;s analysis of {totalSamples} water quality tests,
      {city.name} scores {avgScore}/10 for drinking water quality in {year}.
    </strong>{" "}
    Water in {city.name} is supplied by {supplierName} and has been tested for{" "}
    {contaminantCount} contaminants. {topConcern
      ? `The most commonly flagged issue is ${topConcern}.`
      : "No significant contaminants were flagged."
    }
  </p>
</div>
```

- [ ] **Step 2: Add GEO summary to region pages**

Same pattern in `src/app/region/[slug]/page.tsx`:

```tsx
<div className="card p-5 border-l-4 border-l-accent mb-8">
  <p className="text-base text-body leading-relaxed">
    <strong className="text-ink">
      According to TapWater.uk&apos;s analysis, {region.name} scores {avgScore}/10
      for drinking water quality in {year}, based on data from {postcodeCount} postcode districts.
    </strong>{" "}
    {comparisonText}
  </p>
</div>
```

- [ ] **Step 3: Verify build**

Run: `npm run build 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add src/app/city/ src/app/region/
git commit -m "feat: add GEO-optimized summary paragraphs to city and region pages"
```

---

### Task 10: Expand llms.txt with new contaminant and guide pages

The existing llms.txt route at `src/app/llms.txt/route.ts` lists 8 contaminants and a subset of guides. Update it to include all 20 contaminants, the new softener guide, and better structured data for AI consumption.

**Files:**
- Modify: `src/app/llms.txt/route.ts`

- [ ] **Step 1: Add new contaminant links**

Add to the "Contaminant guides" section:

```
- [Arsenic](https://www.tapwater.uk/contaminant/arsenic): Arsenic levels in UK water
- [Manganese](https://www.tapwater.uk/contaminant/manganese): Brown water and manganese
- [Iron](https://www.tapwater.uk/contaminant/iron): Iron discolouration in tap water
- [Mercury](https://www.tapwater.uk/contaminant/mercury): Mercury monitoring in UK water
- [Pesticides](https://www.tapwater.uk/contaminant/pesticides): Pesticide residues in drinking water
- [Microplastics](https://www.tapwater.uk/contaminant/microplastics): Microplastic contamination
- [Nitrite](https://www.tapwater.uk/contaminant/nitrite): Nitrite levels and health risks
- [Turbidity](https://www.tapwater.uk/contaminant/turbidity): Water cloudiness monitoring
- [Aluminium](https://www.tapwater.uk/contaminant/aluminium): Aluminium in treated water
- [Coliform Bacteria](https://www.tapwater.uk/contaminant/coliform): Indicator bacteria monitoring
- [Cadmium](https://www.tapwater.uk/contaminant/cadmium): Heavy metal contamination
- [Chromium](https://www.tapwater.uk/contaminant/chromium): Chromium in water sources
```

- [ ] **Step 2: Add new guide links**

Add to the "Water filter guides" section:

```
- [Best Water Softener UK](https://www.tapwater.uk/guides/best-water-softener-uk): Water softener comparison and installer quotes
```

- [ ] **Step 3: Add key facts section for AI extraction**

Add a new section at the top of the llms.txt body, after the intro:

```
## Key facts (for citation)

- TapWater.uk scores UK postcode districts from 0-10 based on drinking water quality
- Data sources: Environment Agency Water Quality Archive, Drinking Water Inspectorate (DWI), water company testing via Stream Water Data Portal
- Coverage: {count}+ postcode districts, 1.85M+ water quality tests, 100+ contaminants
- The UK has no legal limit for PFAS in drinking water (as of April 2026)
- Average UK water quality score: 9.1/10
- London scores lowest of any UK region at 8.3/10
- Wales and North West England score highest at 9.5/10
- All UK tap water meets legal safety standards — scores reflect levels relative to WHO guidelines
```

- [ ] **Step 4: Commit**

```bash
git add src/app/llms.txt/route.ts
git commit -m "feat: expand llms.txt with 12 new contaminants, softener guide, and key facts for AI citation"
```

---

### Task 11: Add CONTAMINANT_SLUG_MAP to water-problems pages for cross-linking

The water-problems sub-pages already have a `CONTAMINANT_SLUG_MAP` but it's missing the new contaminants. Update it.

**Files:**
- Modify: `src/app/guides/water-problems/[slug]/page.tsx`

- [ ] **Step 1: Update the CONTAMINANT_SLUG_MAP**

Add the new contaminant slugs:

```typescript
const CONTAMINANT_SLUG_MAP: Record<string, string> = {
  Chlorine: "chlorine",
  Lead: "lead",
  Copper: "copper",
  Iron: "iron",
  Manganese: "manganese",
  Fluoride: "fluoride",
  Nitrate: "nitrate",
  // These are referenced by existing water problems:
};
```

`Iron` and `Manganese` are already referenced in `relatedContaminants` for "brown-water-from-tap" and "metallic-taste-water" but the current slug map was missing them. Adding them enables the cross-links.

- [ ] **Step 2: Commit**

```bash
git add src/app/guides/water-problems/
git commit -m "fix: add iron/manganese to water-problems contaminant slug map for cross-linking"
```

---

### Task 12: Final build verification and deploy

**Files:** None (verification only)

- [ ] **Step 1: Full build**

Run: `npm run build 2>&1 | tail -30`
Expected: Build succeeds. Check the page count output.

- [ ] **Step 2: Run tests**

Run: `npm run test 2>&1`
Expected: All tests pass.

- [ ] **Step 3: Run lint**

Run: `npm run lint 2>&1`
Expected: No errors.

- [ ] **Step 4: Deploy to preview**

Run: `vercel`
Verify all new pages are accessible on the preview URL.

- [ ] **Step 5: Deploy to production**

Run: `vercel --prod`

- [ ] **Step 6: Verify new pages in production**

Check a few URLs:
```bash
for path in contaminant/arsenic contaminant/manganese contaminant/microplastics guides/best-water-softener-uk; do
  echo "$path: $(curl -s -o /dev/null -w '%{http_code}' https://www.tapwater.uk/$path)"
done
```

Expected: All return `200`.

- [ ] **Step 7: Submit updated sitemap to Google Search Console**

Trigger a sitemap resubmission via GSC to ensure the new pages are discovered quickly.
