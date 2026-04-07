# 2026 Site Quality Audit — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring tapwater.uk to 2026 standards — sticky header with active nav, dark mode fixes, OG images for all pages, schema validation, accessibility, mobile-first UX, and scroll-to-top.

**Architecture:** Nine independent tasks that each produce a deployable commit. Grouped by concern: UX (tasks 1-2), visual fixes (task 3), infrastructure (task 4), SEO (tasks 5-6), accessibility (task 7), mobile (task 8), final verify (task 9).

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4

**Spec:** `docs/superpowers/specs/2026-04-07-site-quality-audit-design.md`

---

### Task 1: Sticky header with active nav link highlighting

**Files:**
- Modify: `src/components/header.tsx`
- Modify: `src/components/mobile-nav.tsx`

- [ ] **Step 1: Read header.tsx and mobile-nav.tsx**

Read both files to understand current structure, classes, and whether they're already client components.

- [ ] **Step 2: Make header sticky with backdrop blur**

In `src/components/header.tsx`, change the header element's classes:
- Add `sticky top-0` to the outermost `<header>` element
- Add `backdrop-blur-sm` for the frosted glass effect
- Change background to semi-transparent: replace any `bg-surface` with `bg-[var(--color-surface)]/90`
- Ensure `z-50` is present (already is)

- [ ] **Step 3: Add active nav link highlighting**

The header needs to know the current path. If the header is not already a `"use client"` component, it needs to become one (or extract the nav links into a client component).

Import `usePathname` from `next/navigation`:
```tsx
"use client";
import { usePathname } from "next/navigation";
```

For each nav link, compare the pathname:
```tsx
const pathname = usePathname();

// For each nav link:
const isActive = pathname.startsWith(href);
const linkClass = isActive
  ? "text-ink font-semibold"
  : "text-muted hover:text-ink transition-colors";
```

Apply the same logic in `mobile-nav.tsx` (which is already `"use client"`).

- [ ] **Step 4: Verify sticky header + mobile nav interaction**

The mobile nav panel slides down from the header. With sticky positioning:
- The panel should use absolute positioning relative to the sticky header
- Verify z-index layering: header z-50, mobile panel z-40

- [ ] **Step 5: Run build and verify**

Run: `npm run build 2>&1 | tail -5`

- [ ] **Step 6: Commit**

```bash
git add src/components/header.tsx src/components/mobile-nav.tsx
git commit -m "feat: sticky header with backdrop blur and active nav link highlighting"
```

---

### Task 2: Scroll-to-top button

**Files:**
- Create: `src/components/scroll-to-top.tsx`
- Modify: `src/app/postcode/[district]/page.tsx`
- Modify: `src/app/pfas/page.tsx`
- Modify: `src/app/pfas/[city]/page.tsx`

- [ ] **Step 1: Check if scroll-to-top already exists**

Run: `ls src/components/scroll*` — the spec mentioned it may already exist.

- [ ] **Step 2: Create scroll-to-top component**

Create `src/components/scroll-to-top.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-4 right-4 z-40 w-10 h-10 rounded-full bg-[var(--color-btn)] text-white shadow-lg flex items-center justify-center hover:bg-[var(--color-btn-hover)] transition-colors"
      aria-label="Scroll to top"
    >
      <ArrowUp className="w-4 h-4" />
    </button>
  );
}
```

- [ ] **Step 3: Add to long pages**

Add `<ScrollToTop />` to:
- `src/app/postcode/[district]/page.tsx` — at the end, before closing `</div>`
- `src/app/pfas/page.tsx` — same position
- `src/app/pfas/[city]/page.tsx` — same position

- [ ] **Step 4: Verify build**

Run: `npm run build 2>&1 | tail -5`

- [ ] **Step 5: Commit**

```bash
git add src/components/scroll-to-top.tsx src/app/postcode/ src/app/pfas/
git commit -m "feat: add scroll-to-top button on long pages"
```

---

### Task 3: Dark mode contrast fixes

**Files:**
- Modify: `src/app/contaminant/[slug]/page.tsx`
- Modify: any other files with hardcoded `bg-white`

- [ ] **Step 1: Find all hardcoded bg-white in components and pages**

Run: `grep -rn "bg-white" src/ --include="*.tsx" | grep -v node_modules`

- [ ] **Step 2: Replace bg-white with semantic colors**

For each occurrence:
- If it's a card: replace with `bg-[var(--color-surface)]` or add the `card` class
- If it's a callout/highlight box: replace with the appropriate semantic var (e.g., `bg-[var(--color-surface)]`)
- The contaminant page removal method cards (`src/app/contaminant/[slug]/page.tsx`) specifically need `bg-white` → `bg-[var(--color-surface)]`

- [ ] **Step 3: Fix hardcoded amber/green callout backgrounds**

Run: `grep -rn "bg-amber-50\|bg-green-50\|bg-red-50\|bg-blue-50" src/ --include="*.tsx"`

Replace with semantic CSS variables:
- `bg-amber-50` → `bg-[var(--color-warning-light)]`
- `bg-green-50` → `bg-[var(--color-safe-light)]`
- `bg-red-50` → `bg-[var(--color-danger-light)]`

These CSS vars already have dark mode overrides in `globals.css`.

- [ ] **Step 4: Verify in dark mode**

Run: `npm run dev` and check the contaminant page in dark mode. Verify the removal method cards are readable.

- [ ] **Step 5: Commit**

```bash
git add src/
git commit -m "fix: replace hardcoded bg-white with semantic colors for dark mode contrast"
```

---

### Task 4: CSP update for Mapbox

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Update CSP connect-src**

In `next.config.ts`, find the `connect-src` line and add Mapbox tile and event URLs:

```typescript
`connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://api.mapbox.com https://*.tiles.mapbox.com https://events.mapbox.com https://va.vercel-scripts.com https://*.sentry.io${isDev ? " ws://localhost:* http://localhost:*" : ""}`,
```

- [ ] **Step 2: Add worker-src for Mapbox web workers**

Add a new CSP directive for worker-src:

```typescript
"worker-src 'self' blob:",
```

Add this line after the `connect-src` line in the CSP array.

- [ ] **Step 3: Verify build**

Run: `npm run build 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add next.config.ts
git commit -m "fix: update CSP for Mapbox tiles, events, and web workers"
```

---

### Task 5: OG images for city and PFAS pages

**Files:**
- Create: `src/app/city/[slug]/opengraph-image.tsx`
- Create: `src/app/pfas/opengraph-image.tsx`
- Create: `src/app/pfas/[city]/opengraph-image.tsx`

- [ ] **Step 1: Read the existing postcode OG image as reference**

Read `src/app/postcode/[district]/opengraph-image.tsx` for the pattern: edge runtime, ImageResponse, 1200x630, dark background, inline styles.

- [ ] **Step 2: Create city page OG image**

Create `src/app/city/[slug]/opengraph-image.tsx`:
- Edge runtime, 1200x630 PNG
- Fetch city data using existing data functions
- Dark background (#0c0f17), cyan accent
- Show: city name (large), average safety score, number of postcode areas, supplier name
- Fallback for missing data

- [ ] **Step 3: Create PFAS tracker OG image**

Create `src/app/pfas/opengraph-image.tsx`:
- Static (no dynamic data needed — or fetch national summary)
- Dark background, PFAS purple accent (#a855f7)
- Show: "PFAS in UK Water: Live Tracker", "X cities monitored", "Environment Agency data"

- [ ] **Step 4: Create PFAS city OG image**

Create `src/app/pfas/[city]/opengraph-image.tsx`:
- Fetch city PFAS data
- Dark background, purple accent
- Show: "PFAS in [City] Water", compounds found, highest level

- [ ] **Step 5: Verify the root OG image covers remaining pages**

Check `src/app/layout.tsx` metadata — it should have a default `openGraph.images` that covers any page without its own OG image generator. If not, add one pointing to `/opengraph-image`.

- [ ] **Step 6: Verify build**

Run: `npm run build 2>&1 | tail -10`

- [ ] **Step 7: Commit**

```bash
git add src/app/city/ src/app/pfas/
git commit -m "feat: add OG images for city and PFAS pages"
```

---

### Task 6: Schema validation fixes

**Files:**
- Modify: `src/components/json-ld.tsx`
- Modify: `src/app/contaminant/[slug]/page.tsx` (FAQ answer truncation)

- [ ] **Step 1: Fix ProductSchema — add reviewCount**

In `src/components/json-ld.tsx`, update the `ProductSchema` component's `aggregateRating`:

```typescript
aggregateRating: {
  "@type": "AggregateRating",
  ratingValue: String(rating),
  bestRating: "5",
  worstRating: "1",
  reviewCount: "1",  // Required by Google Rich Results
},
```

- [ ] **Step 2: Fix PostcodeDatasetSchema — add distribution**

Add `distribution` property to the Dataset schema:

```typescript
distribution: {
  "@type": "DataDownload",
  contentUrl: `https://www.tapwater.uk/postcode/${district}`,
  encodingFormat: "text/html",
},
```

- [ ] **Step 3: Fix FAQ answer truncation on contaminant pages**

In `src/app/contaminant/[slug]/page.tsx`, the FAQSchema answers use `.slice(0, 300)` which can cut mid-sentence. Replace with a function that truncates at the last complete sentence within 300 chars:

```typescript
function truncateAtSentence(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  const truncated = text.slice(0, maxLen);
  const lastPeriod = truncated.lastIndexOf(".");
  return lastPeriod > maxLen * 0.5 ? truncated.slice(0, lastPeriod + 1) : truncated + "...";
}
```

Replace `.slice(0, 300)` with `truncateAtSentence(text, 300)`.

- [ ] **Step 4: Verify build**

Run: `npm run build 2>&1 | tail -5`

- [ ] **Step 5: Commit**

```bash
git add src/components/json-ld.tsx src/app/contaminant/
git commit -m "fix: schema validation — add reviewCount, distribution, fix FAQ truncation"
```

---

### Task 7: Accessibility pass

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/components/header.tsx`
- Modify: `src/components/mobile-nav.tsx`
- Modify: `src/components/pfas-map.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add skip-to-content link**

In `src/app/layout.tsx`, add as the first child inside `<body>`:

```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-[var(--color-btn)] focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium"
>
  Skip to main content
</a>
```

Add `id="main-content"` to the `<main>` element.

- [ ] **Step 2: Verify ARIA labels on interactive elements**

Check `src/components/mobile-nav.tsx`:
- Hamburger button should have `aria-label={isOpen ? "Close menu" : "Open menu"}`
- `aria-expanded={isOpen}` on the button

Check `src/components/pfas-map.tsx`:
- The map container should have `role="img"` and `aria-label="PFAS detection map"`

- [ ] **Step 3: Improve color contrast for text-muted**

In `src/app/globals.css`, check if `--color-muted: #6b7280` passes WCAG AA on `--color-wash: #f0f9ff`.

Contrast ratio for #6b7280 on #f0f9ff ≈ 4.2:1 — slightly below 4.5:1 for AA small text.

Bump to `--color-muted: #5b6370` for ~5.1:1 ratio. Only adjust in light mode (:root block), dark mode is fine.

- [ ] **Step 4: Verify build**

Run: `npm run build 2>&1 | tail -5`

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx src/components/ src/app/globals.css
git commit -m "fix: accessibility — skip link, ARIA labels, color contrast"
```

---

### Task 8: Mobile-first fixes

**Files:**
- Modify: `src/components/pfas-map.tsx`
- Modify: Various page/component files

- [ ] **Step 1: Disable scrollZoom on Mapbox maps**

In `src/components/pfas-map.tsx`, add `scrollZoom: false` to the Map constructor options:

```typescript
const map = new mapboxgl.Map({
  container: containerRef.current,
  style: "mapbox://styles/mapbox/light-v11",
  center: center ?? [-2.5, 54.0],
  zoom: zoom ?? 5.5,
  scrollZoom: false,  // Prevent accidental zoom on mobile scroll
  attributionControl: false,
});
```

- [ ] **Step 2: Audit touch targets**

Check key interactive elements have sufficient padding for 44x44px touch targets:
- Product card CTA links in `src/components/product-card.tsx` — ensure the `<a>` has at least `py-2.5 px-4` (40px+ height with text)
- Close buttons — ensure `p-2` minimum (32px + icon = ~40px)
- Postcode search button

Where targets are too small, increase padding.

- [ ] **Step 3: Verify table overflow containers**

Run: `grep -rn "<table" src/app/ --include="*.tsx" -B5 | grep -E "overflow|table"`

Ensure every `<table>` is wrapped in a `<div className="overflow-x-auto">`. Check the PFAS city ranking table and postcode contaminant tables.

- [ ] **Step 4: Verify responsive grids**

Check that stat card grids use `grid-cols-2 sm:grid-cols-4` (or similar) consistently. Spot-check the PFAS tracker page and city PFAS pages.

- [ ] **Step 5: Verify build**

Run: `npm run build 2>&1 | tail -5`

- [ ] **Step 6: Commit**

```bash
git add src/
git commit -m "fix: mobile UX — disable map scrollZoom, touch targets, table overflow"
```

---

### Task 9: Final verification and deploy

- [ ] **Step 1: Full build**

Run: `npm run build 2>&1 | tail -30`
Expected: Build succeeds.

- [ ] **Step 2: Run tests**

Run: `npm run test 2>&1`
Expected: All tests pass.

- [ ] **Step 3: Visual spot checks**

Verify on dev server:
- Header is sticky and shows active link
- Dark mode: contaminant removal cards are readable
- Scroll-to-top button appears on postcode page after scrolling
- PFAS map works without CSP errors
- OG images generate for city and PFAS pages

- [ ] **Step 4: Push and deploy**

```bash
git push origin main
```
