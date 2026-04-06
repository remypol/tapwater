# Regional Landing Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create programmatic regional landing pages (`/region/[slug]`) that capture "water quality in [region]" search queries — high-volume head terms with zero pages targeting them currently.

**Architecture:** Define a `REGIONS` data structure mapping UK regions to their cities and postcode prefixes. Create a dynamic `[slug]` route that aggregates postcode data by region, shows a regional score, lists cities within the region, and cross-links to city/postcode pages. Add to sitemap and internal navigation.

**Tech Stack:** Next.js App Router (server component), existing Supabase data layer, existing components (PostcodeSearch, ContaminantTable, ScrollReveal).

---

### Task 1: Define region data structure

**Files:**
- Create: `src/lib/regions.ts`

- [ ] **Step 1: Create region data file**

```typescript
// src/lib/regions.ts

export interface RegionInfo {
  slug: string;
  name: string;
  description: string;
  cities: string[]; // city slugs from src/lib/cities.ts
}

export const REGIONS: RegionInfo[] = [
  {
    slug: "london",
    name: "London",
    description: "Water quality across Greater London, supplied primarily by Thames Water and Affinity Water.",
    cities: ["london"],
  },
  {
    slug: "south-east",
    name: "South East England",
    description: "Water quality in Kent, Sussex, Surrey, Hampshire and surrounding areas. Supplied by Southern Water, South East Water, and Portsmouth Water.",
    cities: ["brighton", "southampton", "portsmouth", "canterbury", "maidstone"],
  },
  {
    slug: "south-west",
    name: "South West England",
    description: "Water quality across Devon, Cornwall, Somerset, Dorset and Bristol. Supplied by South West Water, Wessex Water, and Bristol Water.",
    cities: ["bristol", "exeter", "plymouth", "bath"],
  },
  {
    slug: "east-of-england",
    name: "East of England",
    description: "Water quality in Norfolk, Suffolk, Essex, Cambridgeshire and surrounding areas. Supplied by Anglian Water.",
    cities: ["cambridge", "norwich", "ipswich", "peterborough"],
  },
  {
    slug: "west-midlands",
    name: "West Midlands",
    description: "Water quality across Birmingham, Coventry, Wolverhampton and surrounding areas. Supplied by Severn Trent.",
    cities: ["birmingham", "coventry", "wolverhampton", "stoke-on-trent"],
  },
  {
    slug: "east-midlands",
    name: "East Midlands",
    description: "Water quality across Nottingham, Leicester, Derby and surrounding areas. Supplied by Severn Trent.",
    cities: ["nottingham", "leicester", "derby"],
  },
  {
    slug: "yorkshire",
    name: "Yorkshire and the Humber",
    description: "Water quality across Leeds, Sheffield, Bradford, York and Hull. Supplied by Yorkshire Water.",
    cities: ["leeds", "sheffield", "bradford", "york", "hull"],
  },
  {
    slug: "north-west",
    name: "North West England",
    description: "Water quality across Manchester, Liverpool, and Lancashire. Supplied by United Utilities.",
    cities: ["manchester", "liverpool", "preston", "blackpool"],
  },
  {
    slug: "north-east",
    name: "North East England",
    description: "Water quality across Newcastle, Sunderland, Durham and Teesside. Supplied by Northumbrian Water.",
    cities: ["newcastle", "sunderland", "middlesbrough"],
  },
  {
    slug: "wales",
    name: "Wales",
    description: "Water quality across Cardiff, Swansea, Newport and rural Wales. Supplied by Dŵr Cymru Welsh Water.",
    cities: ["cardiff", "swansea", "newport"],
  },
  {
    slug: "scotland",
    name: "Scotland",
    description: "Water quality across Edinburgh, Glasgow, Aberdeen and the Highlands. Supplied by Scottish Water.",
    cities: ["edinburgh", "glasgow", "aberdeen", "dundee"],
  },
];

export function getRegionBySlug(slug: string): RegionInfo | undefined {
  return REGIONS.find((r) => r.slug === slug);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/regions.ts
git commit -m "feat: add region data structure for landing pages"
```

---

### Task 2: Create the region page route

**Files:**
- Create: `src/app/region/[slug]/page.tsx`

This page should:
1. Look up the region by slug
2. Aggregate postcode data for all cities in the region (average score, total postcodes, worst/best areas)
3. Display: region summary, score overview, city list with scores, postcode table, FAQ schema
4. Use existing components (PostcodeSearch, BreadcrumbSchema, FAQSchema)

- [ ] **Step 1: Create the page component**

The page should query `getPostcodesByCity()` for each city in the region, aggregate scores, and render a region overview. Include:
- Metadata with region-specific title/description
- BreadcrumbSchema (Home > Regions > Region Name)
- FAQSchema ("Is water safe in [region]?", "Who supplies water in [region]?", "What is the water hardness in [region]?")
- Region score (average of all postcodes)
- City cards linking to `/city/[slug]`
- Top 5 worst + best postcodes in the region
- PostcodeSearch CTA
- Supplier info for the region

- [ ] **Step 2: Add `generateStaticParams` for all regions**

```typescript
export async function generateStaticParams() {
  return REGIONS.map((r) => ({ slug: r.slug }));
}
```

- [ ] **Step 3: Commit**

---

### Task 3: Add region pages to sitemap

**Files:**
- Modify: `src/app/sitemap.ts`

- [ ] **Step 1: Import REGIONS and add region paths**

```typescript
import { REGIONS } from "@/lib/regions";

const regionPaths = REGIONS.map((r) => ({
  url: `${BASE_URL}/region/${r.slug}`,
  lastModified: latestDataDate,
  changeFrequency: "weekly" as const,
  priority: 0.85,
}));
```

Add `...regionPaths` to the sitemap return array.

- [ ] **Step 2: Commit**

---

### Task 4: Add region links to navigation and internal pages

**Files:**
- Modify: `src/app/page.tsx` (add region links section)
- Modify: `src/app/postcode/[district]/page.tsx` (add region link in breadcrumb)
- Modify: `src/components/footer.tsx` (add Regions link)

- [ ] **Step 1: Add region link to postcode breadcrumbs**

Update the breadcrumb to: Home > Region > City > District

- [ ] **Step 2: Add regions section to footer**

- [ ] **Step 3: Commit**

---

### Task 5: Add region pages to llms.txt

**Files:**
- Modify: `src/app/llms.txt/route.ts`

- [ ] **Step 1: Add regions section**

```
## Regional Water Quality
- [London](https://www.tapwater.uk/region/london): Water quality across Greater London
- [Yorkshire](https://www.tapwater.uk/region/yorkshire): Water quality in Leeds, Sheffield, Bradford, York
...
```

- [ ] **Step 2: Commit and push**
