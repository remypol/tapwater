# TapWater.uk — UX/UI Redesign Spec

**Date:** 2 April 2026
**Status:** Approved by user, ready for implementation
**Direction:** Editorial authority (Instrument Serif, precise data) + water-native visual craft (fluid gradients, drop-based scoring, teal palette, organic interactions)
**Audience:** Normal UK residents — parents, renters, homebuyers — not scientists

---

## 1. Visual Identity & Colour System

### Palette Shift: "Slate office" → "Clean water"

| Token | Current | New | Notes |
|---|---|---|---|
| `--color-wash` | `#f9fafb` (grey) | `#f0f9ff` (sky-50) | Subtle water tint on page background |
| `--color-surface` | `#ffffff` | `#ffffff` | White cards on blue-tinted bg |
| `--color-accent` | `#1d4ed8` (blue-700) | `#0891b2` (cyan-600) | Water teal replaces corporate blue |
| `--color-accent-hover` | `#1e40af` | `#0e7490` (cyan-700) | Matching teal |
| `--color-accent-light` | `#dbeafe` | `#ecfeff` (cyan-50) | Light teal wash |

### Atmospheric Backgrounds

Replace hard-edged radial-gradient backgrounds with layered fluid gradient blobs at low opacity — organic, water-like shapes. Applied to:
- Hero section background
- Score area on postcode pages (tinted by score: teal/amber/coral)

### Design System Token Enforcement

Fix ALL pages currently using hardcoded Tailwind colours:
- About page: all `text-slate-*` → `text-[var(--color-*)]`
- Methodology page: same treatment + responsive tables
- Contaminant pages: same treatment
- Supplier pages: already mostly done, needs final pass

---

## 2. Water Drop Score

**Replaces:** The SVG ring score display on postcode pages.

### Anatomy

- SVG teardrop/droplet shape, ~200px tall
- Interior "water level" fills from bottom proportional to score (0 = empty, 10 = full)
- Fill gradient: teal-to-cyan (safe), teal-to-amber (warning), teal-to-red (danger)
- Animated wave at water surface — perpetual, subtle 2-3px amplitude sine wave using two offset CSS-animated ellipses
- Score number centred inside (font-data, large). White when covered by water, dark when above water line
- On load: water level animates upward from 0 over ~1.2s, ease-out cubic

### Text Below

Primary: human sentence (NOT "Excellent"):
- ≥ 7: "Your water is safe"
- 5-6.9: "Your water is mostly fine"
- 3-4.9: "Your water has some issues"
- < 3: "Your water needs attention"

Secondary: context sentence:
- "We checked X things and found nothing to worry about"
- "We found X things worth knowing about"
- "We found X things above recommended safe levels"
- "Several substances were found above safe levels"

Tertiary: grade badge (Excellent/Good/Fair/Poor) — small, secondary, teal-tinted.

### Reduced Motion

Wave stops. Water level appears at final position instantly. Score number appears without animation.

---

## 3. UK Map — SVG Choropleth

**Replaces:** Leaflet dark map with circle markers.

### Structure

- Custom SVG with ~10-12 UK region `<path>` elements (London, South East, South West, East, East Midlands, West Midlands, Yorkshire, North West, North East, Wales, Scotland)
- Each region filled based on average water quality score of postcodes within it
- Colour scale: smooth teal → amber → coral (not hard traffic-light steps)
- ~15KB total (vs ~200KB Leaflet bundle)

### Interactions

- **Hover (desktop):** Region brightens, cursor pointer, tooltip: "South East — Average: 8.2/10 — 45 areas checked"
- **Click/tap:** Smooth-scrolls to a filtered postcode grid below the map showing that region's postcodes
- **Default state (no region selected):** Below map shows "Areas to watch" + "Cleanest water" (current content)
- **Region selected:** Replaces with that region's postcodes + "← Back to overview"

### Mobile

- SVG scales to full width, regions tappable
- Below map: horizontal scrollable region pills as alternative nav
- Tapping a region opens a **bottom sheet** (slides up, 60% viewport height) showing that region's postcodes. Swipe down to dismiss.

### Dependencies Removed

- `leaflet` — removed
- `react-leaflet` — removed
- `leaflet.markercluster` — removed
- `@types/leaflet` — removed

---

## 4. Language Overhaul

### Principle

Plain English everywhere. Precise numbers kept in data context. The surrounding words explain what the numbers mean.

### Full Label Mapping

**Homepage:**
- "UK Water Quality Data" → "Check your tap water"
- "Independent reports for every UK postcode..." → "Find out what's really in your water. Free reports based on government tests."
- "Areas of concern" → "Areas to watch"
- "Highest rated areas" → "Cleanest water"
- "Most checked areas" → "Popular searches"
- "Water suppliers" → "Water companies"

**Postcode page:**
- "Tap Water Quality in SW1A" → "Your water in SW1A"
- "Westminster — 2026 Report" → "Westminster, London"
- "Parameters Tested" → "Tests run"
- "Flagged" → "All clear" (0) / "X to watch" (>0)
- "Water Supplier" → "Your water company"
- "Last Updated" → "Last checked"
- "What's in your water" → "What we found"
- "All readings from the latest monitoring data..." → "Here's what government tests found in water near you."
- Column "Your Level" → "Found"
- Column "UK Limit" → "Safe level"
- Column "WHO Guideline" → "WHO safe level"
- Status "OK"/"Watch"/"Exceeds" → "Safe"/"Watch"/"Over limit"
- "Source: EA Water Quality Archive" → "Source: Environment Agency"
- "Based on X regulated parameters" → "Based on X government tests"
- "Water quality trend" → "How it's changed"
- "Nearby areas" → "Compare nearby"
- "Recommended for SW1A" → "Filters for your area"
- "Selected based on contaminants detected..." → "Picked to match what we found in your water"
- "Stay informed about SW1A" → "Get alerts for your area"

**PFAS banner:**
- "PFAS DETECTED IN ENVIRONMENTAL MONITORING" → "Forever chemicals found near you"
- Scientific explanation → "PFAS — known as 'forever chemicals' — were found at **X µg/L** in water tests near SW1A. The UK doesn't have a legal limit for these yet."
- "Learn about PFAS →" → "What are forever chemicals? →"
- "Filters that remove PFAS →" → "How to remove them →"

---

## 5. Component Polish — Water-Native Interactions

### Card Hover

- Lift 2px (`translateY(-2px)`) with teal-tinted shadow (`0 8px 24px rgba(8, 145, 178, 0.08)`)
- Transition: 0.25s ease-out (fluid, not snappy)
- Mobile: active press state `scale(0.98)` instead of hover

### Buttons — Ripple

- Click triggers CSS teal ripple effect
- Applied to search "Check" button and "Check Price" affiliate CTAs

### Search Input — Wave Border

- On focus: thin teal line along bottom border with subtle oscillating wave animation
- Placeholder fades out smoothly on focus (opacity transition)

### Progress Bars — Wave Edge

- Leading edge of filled progress bar has tiny 2px undulating wave matching the water drop aesthetic

### Page Scroll Animations

- Content sections on postcode page fade in on scroll (Intersection Observer)
- Each section: `opacity 0→1` + `translateY(12px)→0` over 0.5s
- Staggered — creates sense of flowing through report

### Stat Card Icon Bounce

- Icons do a spring animation on viewport entry: `scale(0)→scale(1.1)→scale(1)` over 0.3s

### Trend Chart Bars

- Each bar fills upward from 0 on scroll, staggered 80ms left to right
- Current year bar has subtle pulsing teal glow

### Email Capture Success

- Form elements dissolve (fade out + scale down)
- Success message rises in from below (fade up)

---

## 6. Page Restructuring

### Homepage Flow

1. Hero: "Check your tap water" + search (teal gradient atmosphere)
2. Trust stats: "2,979 areas" / "25,000+ tests" / "14 PFAS alerts" / "Updated daily"
3. UK SVG choropleth map with region click → postcode grid
4. "Areas to watch" + "Cleanest water"
5. "Popular searches"
6. "Water companies" (compact list)

### Postcode Page Flow

1. Breadcrumb: Home → SW1A
2. Header: "Your water in SW1A" + "Westminster, London" (no year subtitle)
3. **Water drop score** — animated fill + "Your water is safe" + context sentence
4. Stat cards — human labels
5. PFAS banner (if detected) — human language
6. "What we found" — human intro + contaminant data
7. "How it's changed" — animated trend bars
8. "Get alerts for your area" — email capture
9. "Filters for your area" — affiliate section
10. "Compare nearby" — horizontal scroll with scores
11. Supplier card + methodology footer

**Removed:** "What this means" callout (redundant — the water drop + sentence already communicates this)

### Other Pages

- About, Methodology, Contaminant: design token fix + font-display headings + responsive tables on mobile + language softening
- Guides: already good, minor label updates only

---

## 7. Mobile-Specific Patterns

### Sticky Score Header (refined)

- Mini water drop icon (16px, filled to level) + "SW1A" + "Safe ✓" (teal) or "2 issues" (amber)
- Tap scrolls back to water drop

### Swipeable Contaminant Cards

- Horizontal scroll container, ~280px wide cards, snap points
- Dot indicator or progress bar below showing position

### Map Bottom Sheet

- Tapping a region opens a bottom sheet (slides up, 60% viewport height)
- Shows that region's postcodes with scores
- Swipe down to dismiss

### Touch Feedback

- Every tappable element: 100ms active state, scale(0.97), subtle tint

### Mobile Navigation (refined)

- Frosted glass panel: `backdrop-blur-lg bg-surface/90`
- Larger tap targets (py-3)
- Teal left-border on active page
- Postcode search input at bottom of nav panel

### Mobile Search

- On focus: header scrolls away naturally, search becomes full focus
- On submit: brief shimmer loading state before navigation

---

## 8. Technical Changes

### Dependencies to Add
- None major (SVG map is hand-crafted, all animations are CSS)

### Dependencies to Remove
- `leaflet`
- `react-leaflet`
- `leaflet.markercluster`
- `@types/leaflet`
- `@types/leaflet.markercluster`

### Files to Create
- `src/components/water-drop-score.tsx` — water drop SVG score component
- `src/components/uk-map.tsx` — SVG choropleth map
- `src/components/region-sheet.tsx` — mobile bottom sheet for map regions
- `src/components/scroll-reveal.tsx` — intersection observer wrapper for scroll animations
- `src/data/uk-regions.json` — region SVG paths + metadata

### Files to Significantly Rewrite
- `src/app/globals.css` — colour tokens, new animations, wave CSS
- `src/app/page.tsx` — homepage restructuring + language
- `src/app/postcode/[district]/page.tsx` — water drop, language, flow restructure
- `src/components/safety-score.tsx` → replaced by `water-drop-score.tsx`
- `src/components/water-quality-map.tsx` → replaced by `uk-map.tsx`
- `src/components/stat-cards.tsx` — relabelled
- `src/components/pfas-banner.tsx` — humanised language
- `src/components/contaminant-table.tsx` — column labels + mobile swipe
- `src/components/filter-cards.tsx` — relabelled + animations
- `src/components/email-capture.tsx` — relabelled + success animation
- `src/components/postcode-search.tsx` — wave focus effect
- `src/components/sticky-score.tsx` — mini drop icon + human label
- `src/components/header.tsx` — accent colour update
- `src/components/footer.tsx` — accent colour update
- `src/components/mobile-nav.tsx` — frosted glass + search input
- `src/app/about/page.tsx` — design tokens + headings
- `src/app/about/methodology/page.tsx` — tokens + responsive tables
- `src/app/contaminant/[slug]/page.tsx` — tokens + responsive + language

### Files to Delete
- `src/components/water-quality-map.tsx` (replaced by uk-map.tsx)
- `src/components/lazy-map.tsx` (no longer needed)
- `src/components/safety-score.tsx` (replaced by water-drop-score.tsx)
