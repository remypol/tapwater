# SEO Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve tapwater.uk SEO across performance (LCP 4.6s → <2.5s), technical SEO (schema, OG), new content pages (5 guides/tools), city page enrichment, rankings page, and internal linking.

**Architecture:** Six phases executed sequentially. Phase 1 (performance) and 2 (technical SEO) are independent quick wins. Phase 3 (new content) creates pages that Phases 4-6 depend on for linking. Each phase can be deployed independently.

**Tech Stack:** Next.js (App Router), Tailwind CSS, Supabase, Recharts, Mapbox, TypeScript

**Spec:** `docs/superpowers/specs/2026-04-07-seo-optimization-plan-design.md`

---

## Task 1: Defer Google Tag Manager loading

**Files:**
- Modify: `src/app/layout.tsx:70-81`

- [ ] **Step 1: Change GTM script strategy**

In `src/app/layout.tsx`, change both Script tags from `afterInteractive` to `lazyOnload`:

```tsx
// lines 70-81 — change strategy on both Script tags
<Script
  src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
  strategy="lazyOnload"
/>
<Script id="gtag-init" strategy="lazyOnload">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_ID}');
  `}
</Script>
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "perf: defer GTM loading to lazyOnload to reduce TBT and LCP"
```

---

## Task 2: Dynamic import heavy below-fold components

**Files:**
- Modify: Pages that import Recharts or Mapbox components

- [ ] **Step 1: Find all Recharts/Mapbox imports**

Run: `grep -rn "from 'recharts\|from \"recharts\|from 'mapbox\|from \"mapbox\|from 'react-map" src/app/ src/components/`

Identify which components use these libraries and which pages import them.

- [ ] **Step 2: Wrap heavy components in dynamic imports**

For each component that uses Recharts or Mapbox, create a dynamic import wrapper. Example pattern:

```tsx
// In the page file that uses the component, replace:
import { WaterQualityChart } from "@/components/water-quality-chart";

// With:
import dynamic from "next/dynamic";
const WaterQualityChart = dynamic(
  () => import("@/components/water-quality-chart").then(mod => mod.WaterQualityChart),
  { ssr: false, loading: () => <div className="h-64 animate-pulse bg-muted/20 rounded-lg" /> }
);
```

Apply this pattern to every Recharts/Mapbox component import found in Step 1.

- [ ] **Step 3: Verify build passes**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "perf: dynamic import Recharts and Mapbox components to reduce main-thread work"
```

---

## Task 3: Add OG/Twitter cards to 9 missing pages

**Files:**
- Modify: `src/app/filters/page.tsx:8-13`
- Modify: `src/app/filters/[category]/page.tsx` (metadata export)
- Modify: `src/app/about/page.tsx:6-10`
- Modify: `src/app/about/methodology/page.tsx` (metadata export)
- Modify: `src/app/about/data-sources/page.tsx` (metadata export)
- Modify: `src/app/contact/page.tsx` (metadata export)
- Modify: `src/app/privacy/page.tsx` (metadata export)
- Modify: `src/app/disclaimer/page.tsx` (metadata export)
- Modify: `src/app/affiliate-disclosure/page.tsx` (metadata export)

- [ ] **Step 1: Add OG/Twitter to filters hub**

In `src/app/filters/page.tsx`, expand the metadata export:

```tsx
export const metadata: Metadata = {
  title: "Water Filters — Find the Right One for Your Area",
  description:
    "Compare water filters matched to UK water quality data. Jugs, under-sink, reverse osmosis, whole-house, shower filters, and testing kits — with prices, specs, and independent recommendations.",
  alternates: { canonical: "https://www.tapwater.uk/filters" },
  openGraph: {
    title: "Water Filters — Find the Right One for Your Area",
    description:
      "Compare water filters matched to UK water quality data. Jugs, under-sink, reverse osmosis, whole-house, and shower filters.",
    url: "https://www.tapwater.uk/filters",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Water Filters — Find the Right One for Your Area",
    description:
      "Compare water filters matched to UK water quality data. Independent recommendations with prices and specs.",
  },
};
```

- [ ] **Step 2: Add OG/Twitter to about page**

In `src/app/about/page.tsx`, expand the metadata export:

```tsx
export const metadata: Metadata = {
  title: 'About TapWater.uk',
  description:
    'TapWater.uk is an independent water quality research project aggregating UK government data to provide free, postcode-searchable water quality reports for England and Wales.',
  openGraph: {
    title: 'About TapWater.uk',
    description:
      'Independent water quality research project providing free, postcode-searchable water quality reports for England and Wales.',
    url: 'https://www.tapwater.uk/about',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'About TapWater.uk',
    description:
      'Independent water quality research providing free reports for every UK postcode.',
  },
};
```

- [ ] **Step 3: Add OG/Twitter to remaining 7 pages**

Apply the same pattern to: `about/methodology/page.tsx`, `about/data-sources/page.tsx`, `contact/page.tsx`, `privacy/page.tsx`, `disclaimer/page.tsx`, `affiliate-disclosure/page.tsx`, `filters/[category]/page.tsx`. Each page: read current metadata, add `openGraph` and `twitter` fields matching existing title/description.

- [ ] **Step 4: Verify build passes**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add src/app/filters/ src/app/about/ src/app/contact/ src/app/privacy/ src/app/disclaimer/ src/app/affiliate-disclosure/
git commit -m "seo: add OG and Twitter card metadata to 9 pages missing social previews"
```

---

## Task 4: Expand FAQ schema on postcode pages (3 → 6+ questions)

**Files:**
- Modify: `src/app/postcode/[district]/page.tsx:120-139`

- [ ] **Step 1: Expand the FAQ array**

In `src/app/postcode/[district]/page.tsx`, the current `faqs` array (line 122) has 3-4 questions. Add 3 more after the existing hardness question:

```tsx
const faqs = hasData ? [
  // ... keep existing 3 questions (safety, contaminants, supplier) ...
  // ... keep existing hardness question if hardnessValue != null ...
  ...(hasData ? [{
    question: `Should I use a water filter in ${data.district}?`,
    answer: `${data.contaminantsFlagged > 0
      ? `With ${data.contaminantsFlagged} contaminant${data.contaminantsFlagged > 1 ? "s" : ""} above recommended levels in ${data.district}, a water filter could help. ${data.pfasDetected ? "A reverse osmosis or activated carbon filter is recommended for PFAS removal." : "A filter jug or under-sink filter can reduce most common contaminants."}`
      : `${data.district} water scored ${data.safetyScore}/10 with no contaminants above recommended levels. A filter is optional but can improve taste, especially if you notice a chlorine flavour.`
    } See our filter recommendations for your area.`,
  }] : []),
  ...(data.pfasDetected ? [{
    question: `Are there PFAS forever chemicals in ${data.district} water?`,
    answer: `Yes, PFAS (per- and polyfluoroalkyl substances) have been detected in ${data.district} at ${data.pfasLevel} µg/L from ${data.pfasSource} monitoring. The UK currently has no legal limit for PFAS in drinking water. Reverse osmosis and activated carbon filters can reduce PFAS levels.`,
  }] : [{
    question: `Are there PFAS forever chemicals in ${data.district} water?`,
    answer: `No PFAS (forever chemicals) have been detected in ${data.district} based on available monitoring data. PFAS are tested at environmental monitoring sites near your postcode.`,
  }]),
] : [];
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/app/postcode/[district]/page.tsx
git commit -m "seo: expand postcode FAQ schema from 3-4 to 6+ questions for PAA coverage"
```

---

## Task 5: Expand FAQ schema on city pages (3 → 6 questions)

**Files:**
- Modify: `src/app/city/[slug]/page.tsx:152-186`

- [ ] **Step 1: Add hardness, best areas, and PFAS FAQ answers**

Before the FAQSchema component (line 180), compute the additional answer data:

```tsx
// Add after contaminantsAnswer (around line 165):

// Compute hardness for the city
const allCityReadings = scored.flatMap(p => [...p.readings, ...p.environmentalReadings]);
const hardnessReadings = allCityReadings.filter(r =>
  /hardness/i.test(r.name) || (/CaCO3/i.test(r.name) && !/alkalinity/i.test(r.name))
);
const avgHardness = hardnessReadings.length > 0
  ? hardnessReadings.reduce((s, r) => s + r.value, 0) / hardnessReadings.length
  : null;
const hardnessClass = avgHardness != null
  ? avgHardness < 60 ? "soft" : avgHardness < 120 ? "moderately soft" : avgHardness < 180 ? "moderately hard" : avgHardness < 250 ? "hard" : "very hard"
  : null;

const hardnessAnswer = avgHardness != null
  ? `Water in ${city.name} has an average hardness of ${Math.round(avgHardness)} mg/L CaCO₃, which is classified as ${hardnessClass}. ${avgHardness >= 180 ? "Hard water causes limescale buildup in kettles and appliances. A water softener or filter may help." : avgHardness < 60 ? "Soft water is gentle on appliances and skin." : "This is a moderate hardness level."}`
  : `Hardness data is not yet available for ${city.name}. Enter your postcode for detailed water quality data.`;

const bestAreas = [...scored].sort((a, b) => b.safetyScore - a.safetyScore).slice(0, 3);
const bestAreasAnswer = bestAreas.length > 0
  ? `The areas with the best water quality in ${city.name} are ${bestAreas.map(p => `${p.district} (${p.safetyScore.toFixed(1)}/10)`).join(", ")}.`
  : `Data is still being collected for ${city.name}.`;

const pfasAnswer = pfasCount > 0
  ? `PFAS (forever chemicals) have been detected in ${pfasCount} out of ${scored.length} areas tested in ${city.name}. The UK currently has no legal limit for PFAS in drinking water. Check your specific postcode for details.`
  : `No PFAS (forever chemicals) have been detected in any of the ${scored.length} areas tested in ${city.name}.`;
```

Then expand the FAQSchema call:

```tsx
<FAQSchema
  faqs={[
    { question: `Is ${city.name} tap water safe to drink?`, answer: safetyAnswer },
    { question: `What is the water quality in ${city.name}?`, answer: contaminantsAnswer },
    { question: `Is ${city.name} water hard or soft?`, answer: hardnessAnswer },
    { question: `Which areas of ${city.name} have the best water?`, answer: bestAreasAnswer },
    { question: `Who supplies water in ${city.name}?`, answer: supplierAnswer },
    { question: `Are there PFAS in ${city.name} water?`, answer: pfasAnswer },
  ]}
/>
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/app/city/[slug]/page.tsx
git commit -m "seo: expand city FAQ schema from 3 to 6 questions with hardness and PFAS data"
```

---

## Task 6: Expand FAQ schema on region pages (3-4 → 6 questions)

**Files:**
- Modify: `src/app/region/[slug]/page.tsx:126-143`

- [ ] **Step 1: Add hardness and worst area FAQ answers**

Before the `faqs` array (line 126), compute additional data:

```tsx
// Add before const faqs (around line 124):
const allRegionReadings = allPostcodes.flatMap(p => [...p.readings, ...p.environmentalReadings]);
const hardnessReadings = allRegionReadings.filter(r =>
  /hardness/i.test(r.name) || (/CaCO3/i.test(r.name) && !/alkalinity/i.test(r.name))
);
const avgHardness = hardnessReadings.length > 0
  ? hardnessReadings.reduce((s, r) => s + r.value, 0) / hardnessReadings.length
  : null;
const hardnessClass = avgHardness != null
  ? avgHardness < 60 ? "soft" : avgHardness < 120 ? "moderately soft" : avgHardness < 180 ? "moderately hard" : avgHardness < 250 ? "hard" : "very hard"
  : null;
```

Then expand the faqs array:

```tsx
const faqs = [
  {
    question: `Is tap water safe in ${region.name}?`,
    answer: `Based on our analysis of ${totalPostcodes} postcode districts in ${region.name}, the average water quality score is ${avgScore.toFixed(1)}/10, which is ${scoreLabel}. Water is supplied by ${suppliers.slice(0, 3).join(", ")}${suppliers.length > 3 ? ` and ${suppliers.length - 3} more` : ""}.`,
  },
  {
    question: `Which area has the best water in ${region.name}?`,
    answer: best.length > 0 ? `${best[0].district} (${best[0].areaName}) has the highest water quality score in ${region.name} at ${best[0].safetyScore.toFixed(1)}/10.` : `Data is still being collected for ${region.name}.`,
  },
  {
    question: `Which area has the worst water in ${region.name}?`,
    answer: worst.length > 0 ? `${worst[0].district} (${worst[0].areaName}) has the lowest water quality score in ${region.name} at ${worst[0].safetyScore.toFixed(1)}/10. Check the postcode page for details on specific contaminants.` : `Data is still being collected for ${region.name}.`,
  },
  ...(avgHardness != null ? [{
    question: `Is ${region.name} water hard or soft?`,
    answer: `Water in ${region.name} has an average hardness of ${Math.round(avgHardness)} mg/L CaCO₃, which is classified as ${hardnessClass}. Hardness varies by area — check your postcode for exact levels.`,
  }] : []),
  {
    question: `Who supplies water in ${region.name}?`,
    answer: `Water in ${region.name} is supplied by ${suppliers.join(", ")}.`,
  },
  ...(pfasCount > 0 ? [{
    question: `Is there PFAS in ${region.name} water?`,
    answer: `PFAS (forever chemicals) have been detected in ${pfasCount} out of ${totalPostcodes} postcode districts tested in ${region.name}. The UK currently has no legal limit for PFAS in drinking water.`,
  }] : []),
];
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/app/region/[slug]/page.tsx
git commit -m "seo: expand region FAQ schema to 6 questions with hardness and worst area data"
```

---

## Task 7: Add Article schema to guide pages missing it

**Files:**
- Check and modify all guide pages under `src/app/guides/*/page.tsx`

- [ ] **Step 1: Identify guides missing ArticleSchema**

Run: `grep -rL "ArticleSchema" src/app/guides/*/page.tsx`

This lists guide pages that do NOT import ArticleSchema.

- [ ] **Step 2: Add ArticleSchema to each missing page**

For each page missing it, add the import and component. Pattern:

```tsx
// Add to imports:
import { ArticleSchema } from "@/components/json-ld";

// Add inside the return, after FAQSchema:
<ArticleSchema
  headline="[page title]"
  description="[page description]"
  url="https://www.tapwater.uk/guides/[slug]/"
  datePublished="2025-06-01"
  dateModified={new Date().toISOString().split("T")[0]}
  authorName="Remy"
  authorUrl="https://www.tapwater.uk/about"
/>
```

Use each page's actual title and description. Set `datePublished` to when the guide was first created (check git log if needed), `dateModified` to current date.

- [ ] **Step 3: Verify build passes**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/app/guides/
git commit -m "seo: add Article schema with author attribution to all guide pages for E-E-A-T"
```

---

## Task 8: Create "Is UK Tap Water Safe?" guide page

**Files:**
- Create: `src/app/guides/is-uk-tap-water-safe/page.tsx`
- Modify: `src/app/sitemap.ts:11-26` (add to GUIDE_SLUGS)

- [ ] **Step 1: Add slug to GUIDE_SLUGS**

In `src/app/sitemap.ts`, add `"is-uk-tap-water-safe"` to the GUIDE_SLUGS array.

- [ ] **Step 2: Create the guide page**

Create `src/app/guides/is-uk-tap-water-safe/page.tsx`. This is a ~2,500 word manually-written guide. Use the same layout pattern as existing guides (e.g., `src/app/guides/lead-pipes-uk/page.tsx`):

- Metadata with full OG + Twitter cards
- FAQSchema with 6+ questions: "Is UK tap water safe?", "Can you drink bathroom tap water?", "Is bottled water safer than tap water?", "What chemicals are in UK tap water?", "Does UK tap water contain fluoride?", "Is London tap water safe?"
- ArticleSchema with author
- BreadcrumbSchema (Home → Guides → Is UK Tap Water Safe?)
- PostcodeSearch CTA component
- Content sections per the spec: TL;DR, regulation, what's in your water, regional differences, tap vs bottled, bathroom vs kitchen, when to be concerned, what you can do
- Internal links to: contaminant pages, city pages (London, Manchester, Birmingham as examples), /filters/, /hardness/ (will exist after Task 11), /guides/pfas-uk-explained/, /guides/lead-pipes-uk/

Written for normal people, not scientists. No jargon. Plain language.

- [ ] **Step 3: Verify build passes**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds with the new route

- [ ] **Step 4: Commit**

```bash
git add src/app/guides/is-uk-tap-water-safe/ src/app/sitemap.ts
git commit -m "feat: add comprehensive 'Is UK Tap Water Safe?' guide targeting top keyword gap"
```

---

## Task 9: Enrich existing PFAS guide with 2026 regulatory updates

**Files:**
- Modify: `src/app/guides/pfas-uk-explained/page.tsx`

- [ ] **Step 1: Read the full current PFAS guide**

Read `src/app/guides/pfas-uk-explained/page.tsx` in full to understand current content.

- [ ] **Step 2: Add 2026 regulatory content**

Add a new section covering:
- UK government PFAS Plan launched Feb 2026
- Consultation on statutory drinking water limits (currently only voluntary guidelines)
- Expected regulatory changes and timeline
- Link to postcode pages with PFAS detections
- Cross-link to /guides/best-water-filter-pfas/ and /filters/

Ensure the page has ArticleSchema if missing, and expand FAQ if under 6 questions.

- [ ] **Step 3: Verify build and commit**

```bash
npm run build 2>&1 | tail -20
git add src/app/guides/pfas-uk-explained/
git commit -m "feat: update PFAS guide with 2026 UK regulatory developments"
```

---

## Task 10: Create Water Problems Troubleshooting Hub

**Files:**
- Create: `src/app/guides/water-problems/page.tsx` (hub)
- Create: `src/app/guides/water-problems/[slug]/page.tsx` (sub-pages)
- Create: `src/lib/water-problems.ts` (data for symptom pages)
- Modify: `src/app/sitemap.ts` (add guide slugs)

- [ ] **Step 1: Create water problems data file**

Create `src/lib/water-problems.ts`:

```tsx
export interface WaterProblem {
  slug: string;
  title: string;
  category: "taste" | "appearance" | "smell" | "pressure";
  symptom: string;
  causes: string[];
  isDangerous: string;
  whatToDo: string[];
  whenToContact: string;
  relatedContaminants: string[];
}

export const WATER_PROBLEMS: WaterProblem[] = [
  {
    slug: "water-tastes-of-chlorine",
    title: "Why Does My Water Taste of Chlorine?",
    category: "taste",
    symptom: "Strong chlorine or swimming pool taste",
    causes: [
      "Water companies add chlorine to kill bacteria — it's a legal requirement.",
      "Chlorine levels are higher when the water has travelled further from the treatment works.",
      "Seasonal variations: more chlorine is added in warmer months when bacteria grow faster.",
    ],
    isDangerous: "No. Chlorine in UK tap water is well within safe limits (max 0.5 mg/L). The taste is noticeable at much lower concentrations than would cause harm.",
    whatToDo: [
      "Fill a jug and leave it in the fridge for 30 minutes — chlorine evaporates naturally.",
      "Use a filter jug with activated carbon, which removes chlorine taste and smell.",
      "Run the cold tap for 30 seconds before filling your glass.",
    ],
    whenToContact: "If the chlorine taste is suddenly much stronger than usual, or if the water has an unusual chemical taste that isn't chlorine.",
    relatedContaminants: ["Chlorine"],
  },
  {
    slug: "cloudy-tap-water",
    title: "Why Is My Tap Water Cloudy or Milky?",
    category: "appearance",
    symptom: "Water appears white, cloudy, or milky",
    causes: [
      "Air bubbles trapped in the water — the most common cause. Happens when cold water is pressurised in pipes.",
      "Recent plumbing work in your area can disturb sediment.",
      "In rare cases, very high mineral content (hard water areas).",
    ],
    isDangerous: "Almost always no. If caused by air bubbles, pour a glass and wait 30 seconds — it should clear from the bottom up. This is harmless.",
    whatToDo: [
      "Pour a glass and wait 30 seconds. If it clears from bottom to top, it's just air — completely harmless.",
      "If it doesn't clear, or has a colour tint, run the cold tap for 2 minutes.",
      "If the problem persists for more than 24 hours, contact your water supplier.",
    ],
    whenToContact: "If the cloudiness doesn't clear after 30 seconds, persists for more than a day, or has a yellow/brown tint.",
    relatedContaminants: [],
  },
  {
    slug: "brown-water-from-tap",
    title: "Why Is My Water Brown, Yellow, or Orange?",
    category: "appearance",
    symptom: "Water is discoloured brown, rusty, yellow, or orange",
    causes: [
      "Iron or manganese deposits disturbed in water mains — often after nearby maintenance work.",
      "Old iron pipes in your home corroding internally.",
      "Water main burst or change in water pressure disturbing sediment.",
    ],
    isDangerous: "Usually not dangerous to health, but don't drink discoloured water. Iron and manganese at these levels aren't toxic, but the water quality is compromised.",
    whatToDo: [
      "Don't use discoloured water for drinking or cooking.",
      "Run the cold kitchen tap slowly for 15-20 minutes. It should gradually clear.",
      "Don't use hot water — the hot water cylinder may have filled with discoloured water.",
      "Check with neighbours — if they have the same issue, it's likely a mains problem.",
    ],
    whenToContact: "Immediately if you haven't had recent plumbing work, or if it doesn't clear after 30 minutes of running the tap.",
    relatedContaminants: ["Iron", "Manganese"],
  },
  {
    slug: "metallic-taste-water",
    title: "Why Does My Water Taste Metallic?",
    category: "taste",
    symptom: "Water has a metallic, bitter, or tinny taste",
    causes: [
      "Copper or lead leaching from old household pipes, especially in pre-1970 homes.",
      "Low pH water dissolving metal from plumbing fittings.",
      "Galvanised iron pipes corroding (common in older properties).",
    ],
    isDangerous: "Potentially, if caused by lead. Copper gives a metallic taste at levels above 1 mg/L. Lead has no taste but often accompanies other metals. If your home was built before 1970, check for lead pipes.",
    whatToDo: [
      "Always run the cold tap for 30 seconds before drinking, especially first thing in the morning.",
      "Never use hot tap water for drinking or cooking — hot water dissolves more metal from pipes.",
      "Consider a water filter certified to remove heavy metals.",
      "If your home is pre-1970, check if you have lead pipes (they're dull grey and soft — a coin will scratch them).",
    ],
    whenToContact: "If the metallic taste is persistent, especially in a pre-1970 home. Ask your water company for a free lead test.",
    relatedContaminants: ["Lead", "Copper", "Iron"],
  },
  {
    slug: "water-smells-like-rotten-eggs",
    title: "Why Does My Water Smell Like Rotten Eggs?",
    category: "smell",
    symptom: "Water smells of sulphur, rotten eggs, or sewage",
    causes: [
      "Hydrogen sulphide from bacteria growing in your hot water cylinder (set below 60°C).",
      "Old or unused pipes where stagnant water allows bacteria to grow.",
      "Rarely, contamination from a nearby source.",
    ],
    isDangerous: "The smell is usually harmless but unpleasant. If it's only from the hot tap, it's almost certainly bacteria in your water heater. If from both taps, contact your supplier.",
    whatToDo: [
      "Check if it's only the hot tap — if so, your hot water cylinder temperature may be too low. Raise it to 60°C to kill bacteria.",
      "Run unused taps for 2-3 minutes to flush stagnant water.",
      "Clean your tap aerators (the mesh at the end of the spout) — bacteria can grow there.",
    ],
    whenToContact: "Immediately if the smell comes from the cold tap, or if multiple taps are affected.",
    relatedContaminants: [],
  },
  {
    slug: "low-water-pressure",
    title: "Why Is My Water Pressure Low?",
    category: "pressure",
    symptom: "Water comes out slowly or with poor pressure",
    causes: [
      "Partially closed stop valve — check your internal stopcock is fully open.",
      "Limescale buildup restricting flow in pipes (hard water areas).",
      "Burst or leaking pipe reducing pressure.",
      "Peak demand times (7-9am, 5-7pm) in areas with older infrastructure.",
      "Your water company may be doing maintenance nearby.",
    ],
    isDangerous: "Not a health risk, but can indicate plumbing issues that need attention.",
    whatToDo: [
      "Check your internal stop valve is fully open (usually under the kitchen sink).",
      "Check with neighbours — if they have low pressure too, it's a supply issue.",
      "Clean or replace tap aerators — limescale can restrict flow.",
      "In hard water areas, descale showerheads and taps regularly.",
    ],
    whenToContact: "If pressure drops suddenly, if neighbours have the same problem, or if you suspect a leak.",
    relatedContaminants: [],
  },
];

export const PROBLEM_CATEGORIES = [
  { id: "taste" as const, label: "Taste", description: "Chlorine, metallic, chemical, or unusual flavours" },
  { id: "appearance" as const, label: "Appearance", description: "Cloudy, brown, discoloured, or particles" },
  { id: "smell" as const, label: "Smell", description: "Chlorine, rotten eggs, musty, or chemical odours" },
  { id: "pressure" as const, label: "Pressure", description: "Low pressure, intermittent supply, or air in pipes" },
];
```

- [ ] **Step 2: Create the hub page**

Create `src/app/guides/water-problems/page.tsx` with:
- Metadata + OG/Twitter cards
- FAQSchema with top questions
- ArticleSchema + BreadcrumbSchema
- Grid of problem categories linking to sub-pages
- PostcodeSearch CTA
- Links to /filters/ and contaminant pages

- [ ] **Step 3: Create the dynamic sub-page**

Create `src/app/guides/water-problems/[slug]/page.tsx` with:
- `generateStaticParams()` from `WATER_PROBLEMS`
- Dynamic metadata from problem data
- FAQSchema with the problem's Q&A
- ArticleSchema + BreadcrumbSchema (Home → Guides → Water Problems → [Problem])
- Structured content: symptom, causes, is it dangerous, what to do, when to contact supplier
- Cross-links to relevant contaminant pages and postcode search
- Link to /filters/ if relevant

- [ ] **Step 4: Add to sitemap**

In `src/app/sitemap.ts`, add `"water-problems"` to GUIDE_SLUGS and add the sub-page paths:

```tsx
// Add individual problem pages to sitemap
...WATER_PROBLEMS.map((problem) => ({
  url: `${BASE_URL}/guides/water-problems/${problem.slug}/`,
  lastModified: latestDataDate,
  changeFrequency: "monthly" as const,
  priority: 0.7,
})),
```

- [ ] **Step 5: Verify build and commit**

```bash
npm run build 2>&1 | tail -20
git add src/app/guides/water-problems/ src/lib/water-problems.ts src/app/sitemap.ts
git commit -m "feat: add water problems troubleshooting hub with 6 symptom sub-pages"
```

---

## Task 11: Create Water Hardness Checker page

**Files:**
- Create: `src/app/hardness/page.tsx`
- Modify: `src/app/sitemap.ts` (add /hardness/)

- [ ] **Step 1: Create the hardness checker page**

Create `src/app/hardness/page.tsx`. This is a tool + informational hybrid page:

- Metadata targeting "water hardness check", "is my water hard or soft", "hard water areas uk"
- Full OG + Twitter cards
- FAQSchema with 6 questions about hardness
- ArticleSchema + BreadcrumbSchema
- PostcodeSearch component at the top — "Check your water hardness"
- Hardness scale explanation with visual (soft/moderate/hard/very hard with mg/L ranges)
- Content sections: what causes hard water, effects of hard water, how to deal with it
- Cross-links to: /guides/water-hardness-map/, /filters/, city pages with hardest/softest water
- Note: Does NOT need a Mapbox map — the existing /guides/water-hardness-map/ has that. This page is the conversion-focused landing page.

- [ ] **Step 2: Add to sitemap**

In `src/app/sitemap.ts`, add to the static pages array:

```tsx
{
  url: `${BASE_URL}/hardness/`,
  lastModified: latestDataDate,
  changeFrequency: "weekly",
  priority: 0.9,
},
```

- [ ] **Step 3: Verify build and commit**

```bash
npm run build 2>&1 | tail -20
git add src/app/hardness/ src/app/sitemap.ts
git commit -m "feat: add dedicated water hardness checker page targeting 'water hardness check' keyword"
```

---

## Task 12: City page enrichment — national average comparison + best/worst areas

**Files:**
- Modify: `src/app/city/[slug]/page.tsx`
- Modify: `src/lib/data.ts` (add getNationalAverageScore helper)

- [ ] **Step 1: Add national average helper to data.ts**

In `src/lib/data.ts`, add:

```tsx
export async function getNationalAverageScore(): Promise<number> {
  const districts = await getAllPostcodeDistricts();
  let total = 0;
  let count = 0;
  for (const d of districts) {
    const data = await getPostcodeData(d);
    if (data && data.safetyScore >= 0) {
      total += data.safetyScore;
      count++;
    }
  }
  return count > 0 ? total / count : 0;
}
```

- [ ] **Step 2: Add national average comparison to city page**

In `src/app/city/[slug]/page.tsx`, import and call `getNationalAverageScore()`. Add a visual comparison bar or badge showing "Manchester: 6.8/10 | UK Average: 7.2/10" in the stats section.

- [ ] **Step 3: Add best/worst areas callout**

After the aggregate stats section, add a callout showing top 3 and bottom 3 postcodes:

```tsx
const bestPostcodes = [...scored].sort((a, b) => b.safetyScore - a.safetyScore).slice(0, 3);
const worstPostcodes = [...scored].sort((a, b) => a.safetyScore - b.safetyScore).slice(0, 3);
```

Render as two side-by-side cards with links to each postcode page.

- [ ] **Step 4: Add hardness classification**

Using the `avgHardness` computed in Task 5, add a hardness badge/card showing the city's average hardness with classification and a link to `/hardness/`.

- [ ] **Step 5: Verify build and commit**

```bash
npm run build 2>&1 | tail -20
git add src/app/city/[slug]/page.tsx src/lib/data.ts
git commit -m "feat: enrich city pages with national comparison, best/worst areas, and hardness"
```

---

## Task 13: City page enrichment — contextual guide links

**Files:**
- Create: `src/components/related-guides.tsx`
- Modify: `src/app/city/[slug]/page.tsx`

- [ ] **Step 1: Create RelatedGuides component**

Create `src/components/related-guides.tsx`:

```tsx
import Link from "next/link";

interface RelatedGuidesProps {
  pfasDetected: boolean;
  hasLeadFlagged: boolean;
  isHardWater: boolean;
  hasContaminantsFlagged: boolean;
}

export function RelatedGuides({ pfasDetected, hasLeadFlagged, isHardWater, hasContaminantsFlagged }: RelatedGuidesProps) {
  const guides: { href: string; title: string; description: string }[] = [
    { href: "/guides/is-uk-tap-water-safe/", title: "Is UK Tap Water Safe?", description: "Everything you need to know about tap water safety" },
  ];

  if (pfasDetected) {
    guides.push({ href: "/guides/pfas-uk-explained/", title: "PFAS Forever Chemicals", description: "What PFAS are and how to reduce exposure" });
  }
  if (hasLeadFlagged) {
    guides.push({ href: "/guides/lead-pipes-uk/", title: "Lead Pipes in the UK", description: "How to check for lead pipes and reduce exposure" });
  }
  if (isHardWater) {
    guides.push({ href: "/hardness/", title: "Water Hardness Checker", description: "Check your water hardness and what it means" });
  }
  if (hasContaminantsFlagged) {
    guides.push({ href: "/filters/", title: "Water Filter Recommendations", description: "Find the right filter for your water quality" });
  }

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-ink mb-4">Related guides</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {guides.map((guide) => (
          <Link
            key={guide.href}
            href={guide.href}
            className="block p-4 rounded-lg border border-rule hover:border-accent transition-colors"
          >
            <p className="font-medium text-ink">{guide.title}</p>
            <p className="text-sm text-body mt-1">{guide.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Add RelatedGuides to city page**

In `src/app/city/[slug]/page.tsx`, import and render `<RelatedGuides />` before the postcode search CTA, passing the relevant flags computed from the city's data.

- [ ] **Step 3: Verify build and commit**

```bash
npm run build 2>&1 | tail -20
git add src/components/related-guides.tsx src/app/city/[slug]/page.tsx
git commit -m "feat: add contextual guide links to city pages based on water quality data"
```

---

## Task 14: Create Rankings page

**Files:**
- Create: `src/app/rankings/page.tsx`
- Modify: `src/app/sitemap.ts` (add /rankings/)

- [ ] **Step 1: Create the rankings page**

Create `src/app/rankings/page.tsx`. This is a data-driven editorial page:

- Metadata targeting "best tap water in uk", "worst tap water uk", "uk water quality rankings"
- Full OG + Twitter cards
- BreadcrumbSchema (Home → Rankings)
- FAQSchema with 4+ questions
- Imports: CITIES from `@/lib/cities`, REGIONS from `@/lib/regions`, data fetching functions
- Uses `revalidate = 86400` for daily ISR

Page sections (all use real aggregated data):

1. **Hero**: "UK Water Quality Rankings [year]" with "Last updated: [date]"
2. **Top 10 / Bottom 10 cards**: Highlight best and worst cities with scores, styled as shareable cards
3. **Full city rankings table**: All 51 cities, sortable columns (score, flagged contaminants, PFAS detections). Each city name links to its city page.
4. **Water company leaderboard**: Aggregate scores by supplier across all postcodes they serve. Link to supplier pages.
5. **Regional comparison**: 11 regions ranked by average score. Link to region pages.
6. **Methodology link**: Link to /about/methodology/

Use the `frontend-design` skill for the visual design of this page — it's a flagship content page that needs to look premium, not generic.

- [ ] **Step 2: Add to sitemap**

In `src/app/sitemap.ts`, add:

```tsx
{
  url: `${BASE_URL}/rankings/`,
  lastModified: latestDataDate,
  changeFrequency: "weekly",
  priority: 0.9,
},
```

- [ ] **Step 3: Verify build and commit**

```bash
npm run build 2>&1 | tail -20
git add src/app/rankings/ src/app/sitemap.ts
git commit -m "feat: add UK water quality rankings page — city, supplier, and regional leaderboards"
```

---

## Task 15: Internal linking — add RelatedGuides to postcode pages

**Files:**
- Modify: `src/app/postcode/[district]/page.tsx`

- [ ] **Step 1: Add RelatedGuides component to postcode pages**

Import `RelatedGuides` from `@/components/related-guides` and render it after the contaminant table / filter recommendations section:

```tsx
import { RelatedGuides } from "@/components/related-guides";

// In the render, after FilterRecommendations:
<RelatedGuides
  pfasDetected={data.pfasDetected}
  hasLeadFlagged={data.readings.some(r => /lead/i.test(r.name) && r.status !== "pass")}
  isHardWater={(hardnessValue ?? 0) >= 180}
  hasContaminantsFlagged={data.contaminantsFlagged > 0}
/>
```

- [ ] **Step 2: Add links to rankings page and parent city**

Ensure the postcode page links to `/rankings/` somewhere (e.g., in a "See how your area compares" section or within the RelatedGuides component). The parent city link should already exist in the breadcrumb.

- [ ] **Step 3: Verify build and commit**

```bash
npm run build 2>&1 | tail -20
git add src/app/postcode/[district]/page.tsx
git commit -m "feat: add contextual guide links and rankings reference to postcode pages"
```

---

## Task 16: Internal linking — homepage discovery section

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Read the current homepage**

Read `src/app/page.tsx` in full to understand the current layout.

- [ ] **Step 2: Add an "Explore" section below the search**

After the main postcode search section, add an explore section with links to:
- `/rankings/` — "UK Water Quality Rankings"
- `/hardness/` — "Water Hardness Checker"
- `/guides/is-uk-tap-water-safe/` — "Is UK Tap Water Safe?"
- `/guides/water-problems/` — "Water Problems?"
- Featured cities (top 6 from CITIES: London, Manchester, Birmingham, Leeds, Glasgow, Edinburgh)

Style as a grid of link cards. Use the `frontend-design` skill for the visual design.

- [ ] **Step 3: Verify build and commit**

```bash
npm run build 2>&1 | tail -20
git add src/app/page.tsx
git commit -m "feat: add explore section to homepage with links to rankings, hardness, guides, and cities"
```

---

## Task 17: Final verification and deploy

- [ ] **Step 1: Full build**

Run: `npm run build 2>&1 | tail -40`
Expected: Build succeeds with all new routes

- [ ] **Step 2: Check sitemap**

Run: `grep -c "url" src/app/sitemap.ts`
Verify the sitemap includes all new pages (rankings, hardness, water problems hub + sub-pages, is-uk-tap-water-safe guide).

- [ ] **Step 3: Lighthouse check**

Run Lighthouse on the homepage and a postcode page to verify LCP improvement from Tasks 1-2.

- [ ] **Step 4: Push and deploy**

```bash
git push origin main
```

Verify the Vercel deployment succeeds.
