# 2026 Site Quality Audit — Design Spec

**Date:** 2026-04-07
**Status:** Draft
**Goal:** Bring tapwater.uk to absolute top 2026 standards — sticky header, dark mode fixes, OG images for all pages, schema validation, performance, accessibility, and UX polish.

---

## 1. Sticky Header with Scroll Behavior

**Problem:** Header is static. Users lose navigation on long pages.

**Change:** Make the header sticky with scroll-aware styling.

- `position: sticky; top: 0; z-index: 50` (already has z-50)
- Default state: current styling (solid background, subtle shadow)
- Scrolled state (scroll > 0): add `backdrop-blur-lg`, slightly transparent background `bg-surface/90`, stronger bottom border `border-b border-rule`
- Height stays constant (no shrink — keeps it simple)
- Requires scroll detection: add a minimal `"use client"` wrapper or use CSS `@supports (animation-timeline: scroll())` for pure-CSS scroll detection if browsers support it. Fallback: just make it permanently sticky with blur — no scroll detection needed.

**Implementation approach:** The simplest 2026-ready approach is just `sticky top-0` with `backdrop-blur-sm` always on. No JS scroll listener needed.

---

## 2. Active Nav Link Highlighting

**Problem:** No visual indicator of which page the user is on.

**Change:** In `header.tsx` and `mobile-nav.tsx`, compare the current pathname against each nav link href. Apply `text-ink font-semibold` to the active link and `text-muted` to inactive links.

Use `usePathname()` from `next/navigation`. This requires the header to be a client component (or just the nav links portion).

---

## 3. Dark Mode Contrast Fixes

**Problem:** Several elements have poor contrast in dark mode. Specifically:
- Contaminant "How to Remove" section: card backgrounds use `bg-white` which doesn't adapt → method names (`text-ink`) become invisible against white cards on dark backgrounds
- Any `bg-white` hardcoded in components instead of using `bg-[var(--color-surface)]`
- Warning/info boxes using light backgrounds that don't invert

**Fix:**
- Audit all components for hardcoded `bg-white` — replace with `bg-[var(--color-surface)]` or the `card` class (which already handles dark mode)
- In `src/app/contaminant/[slug]/page.tsx`, the removal method cards use `bg-white` — change to semantic color
- Check all `bg-amber-50`, `bg-green-50`, etc. callout boxes — ensure they have dark mode equivalents via the existing `--color-warning-light`, `--color-safe-light` vars
- Check `text-ink` on light-colored backgrounds — ensure sufficient contrast in both modes

---

## 4. CSP Update for Mapbox

**Problem:** Mapbox GL JS needs additional CSP sources beyond `api.mapbox.com`.

**Fix in `next.config.ts`:**
- `connect-src`: add `https://*.tiles.mapbox.com https://events.mapbox.com`
- `worker-src`: add `blob:` (Mapbox uses web workers for tile rendering)
- `style-src`: already has `'unsafe-inline'` which covers Mapbox's inline styles

---

## 5. OG Images for All Page Types

**Problem:** 852 pages missing OG images. Only homepage and postcode pages have them.

**New OG image generators:**

### 5.1 City pages: `src/app/city/[slug]/opengraph-image.tsx`
- Dark background, city name large, average score, postcode count
- Same edge runtime + 1200x630 pattern as postcode OG image

### 5.2 PFAS tracker: `src/app/pfas/opengraph-image.tsx`
- Dark background, "PFAS in UK Water" headline, key stat (cities affected, sampling points)
- PFAS purple accent (#a855f7) instead of cyan

### 5.3 PFAS city pages: `src/app/pfas/[city]/opengraph-image.tsx`
- City name + "PFAS Detection Data", compounds found, highest level

### 5.4 Shared fallback for guides/contaminants/filters
- Create `src/app/opengraph-image-fallback.tsx` — a reusable static OG image
- Or: set a default `opengraph-image.png` in `public/` as a static fallback
- Configure in root layout metadata as default OG image (already exists — verify it covers all pages)

---

## 6. Schema Validation Fixes

**Problem:** Ahrefs found 10,628 pages with structured data validation errors.

**Audit each schema in `src/components/json-ld.tsx`:**

### 6.1 ProductSchema
- Add `reviewCount` to AggregateRating (required by Google)
- Ensure `availability` URL is correct schema.org value

### 6.2 FAQSchema
- Ensure answers are not truncated (the `.slice(0, 300)` on contaminant page FAQ answers may be cutting off mid-sentence)
- Ensure no raw HTML in answer text

### 6.3 PostcodeDatasetSchema
- Add `distribution` property with download URL or access URL
- Validate `temporalCoverage` format

### 6.4 BreadcrumbSchema
- Already correctly omits URL on last item — verify

### 6.5 ArticleSchema
- Ensure `datePublished` and `dateModified` are valid ISO 8601
- Ensure `author` has valid URL

### Validation approach:
After fixing, test 3-4 representative pages against Google Rich Results Test to confirm validation passes.

---

## 7. Accessibility Pass

### 7.1 Skip-to-content link
Add `<a href="#main-content" className="sr-only focus:not-sr-only ...">Skip to main content</a>` as the first element inside `<body>`. Add `id="main-content"` to the `<main>` tag.

### 7.2 Focus ring visibility
Ensure all interactive elements have visible focus rings. Check that Tailwind's default `focus-visible:ring` is applied. If custom styles override focus rings, restore them.

### 7.3 Color contrast
- Check `text-muted` (#6b7280) on `bg-wash` (#f0f9ff) — may fail WCAG AA 4.5:1 for small text
- Check `text-faint` (#9ca3af) — likely fails AA for body text (only acceptable for decorative/non-essential text)
- Adjust if needed — bump `text-muted` to `#4b5563` (gray-600) for body text contexts

### 7.4 ARIA labels
- Hamburger menu button: ensure `aria-label="Open menu"` / `aria-label="Close menu"` toggles
- Score badge: add `aria-label="Water quality score: X out of 10"`
- Map: add `role="img"` with `aria-label` describing the map content
- Icon-only buttons (close, navigation controls): verify all have labels

### 7.5 Image alt text
- Product images in ProductCard: already uses `alt={brand model}` — verify
- OG images: not applicable (meta tags, not rendered)

---

## 8. Performance Optimizations

### 8.1 Slow postcode pages (19 pages with TTFB >2.5s)
The homepage map fix (N+1 batch query) should have resolved the worst performance issues. Verify these pages are now faster. If still slow:
- Check if ISR is caching properly (revalidate = 86400)
- Add response-level caching headers

### 8.2 Font optimization
Already loading 3 fonts with `display: swap` and Latin subset. Verify no unused font weights are loaded (Space Mono loads 400 + 700 — is 700 used? If only for `.font-data` which uses `font-weight: bold`, then yes).

### 8.3 Dynamic imports
The existing SEO plan (2026-04-07-seo-optimization-plan.md) covers dynamic imports for Recharts/Mapbox. We've already dynamically imported PfasMap. Verify no other heavy components are loaded synchronously on pages that don't need them.

---

## 9. Minor UX Polish

### 9.1 Scroll-to-top button
On postcode pages and PFAS pages (long content), show a "back to top" button when scrolled >500px. Small circle button, fixed bottom-right, smooth scroll to top. `"use client"` component with scroll listener.

### 9.2 Breadcrumbs on remaining pages
Ensure every page has a visible breadcrumb nav. Check: `/rankings`, `/hardness`, `/compare`, `/filters`, `/filters/[category]`, `/guides/[slug]`. Most already have them — verify completeness.

---

## 10. File Changes Summary

### Modified:
- `src/components/header.tsx` — sticky positioning + backdrop blur
- `src/components/header.tsx` or new wrapper — active nav link highlighting via usePathname
- `src/app/contaminant/[slug]/page.tsx` — fix bg-white → semantic color
- `next.config.ts` — CSP updates for Mapbox tiles/workers
- `src/components/json-ld.tsx` — schema validation fixes (ProductSchema reviewCount, FAQ truncation)
- `src/app/layout.tsx` — skip-to-content link, main id
- Any components with hardcoded `bg-white`

### Created:
- `src/app/city/[slug]/opengraph-image.tsx`
- `src/app/pfas/opengraph-image.tsx`
- `src/app/pfas/[city]/opengraph-image.tsx`
- `src/components/scroll-to-top.tsx` (if not already exists — check)

---

## 11. What This Does NOT Include

- Full WCAG 2.2 Level AA audit (that's a multi-day effort)
- Lighthouse CI integration (premature without CI/CD)
- Core Web Vitals monitoring dashboard
- Dark mode design overhaul (only fixing broken contrast)
- PWA / service worker / offline support
