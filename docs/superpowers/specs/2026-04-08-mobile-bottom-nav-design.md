# Mobile Bottom Navigation — Design Spec

**Date:** 2026-04-08
**Status:** Approved

---

## Overview

Replace the hamburger menu on mobile with a floating pill-shaped bottom navigation bar. PWA-like feel with postcode search as the hero action. Desktop navigation unchanged.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Nav style | Floating pill bar (C) | Most premium, modern, app-like. Detached from edges. Distinctive. |
| Items | Home, News, Search, Rankings, More | Core user journeys: navigate, discover incidents, search postcodes, browse data |
| "More" action | Bottom sheet (~60% height) | Natural companion to bottom nav. Slides up from thumb position. |
| Search action | Focus existing search input or navigate to homepage | Avoids duplicate search UI. Leverages existing PostcodeSearch component. |

---

## Breakpoint

- **Mobile (`< 640px` / below Tailwind `sm`):** bottom pill bar shown, hamburger hidden
- **Desktop (`>= 640px`):** current header nav unchanged, bottom bar hidden

---

## Floating Pill Bar

### Visual Design

- Position: fixed, 12px from left/right/bottom edges
- Background: `#111827` (matches footer tone)
- Border: 1px solid `#1f2937`
- Border radius: 20px (fully rounded pill)
- Box shadow: `0 8px 32px rgba(0,0,0,0.5)` for floating effect
- Safe area: `padding-bottom: env(safe-area-inset-bottom)` for notched phones
- Z-index: 50 (same level as header)

### Items

| Position | Icon | Label | Action |
|----------|------|-------|--------|
| 1 | Home (lucide) | Home | Navigate to `/` |
| 2 | Zap (lucide) | News | Navigate to `/news` |
| 3 | Search (lucide) | Search | Special — see below |
| 4 | BarChart3 (lucide) | Rankings | Navigate to `/compare` |
| 5 | MoreVertical (lucide) | More | Open bottom sheet |

### Search Button (Centre)

- Distinct from other items: accent background (`--color-accent` / `#0891b2`), white icon + text
- Padding: `8px 16px`, border-radius: 14px (pill within pill)
- Icon + label side by side (not stacked) to differentiate from other items

### Active State

- Active tab: icon and label colour changes to accent (`--color-accent`)
- Inactive: `#6b7280` (gray-500)
- Determined by matching `usePathname()` to item href
- Search button always shows accent style (it's the CTA, not a nav item)

### Search Behaviour

1. Check if a `PostcodeSearch` input exists on the current page (query for `input[name="postcode"]` or similar)
2. If found: scroll to it and focus it
3. If not found: navigate to `/` (homepage has the search hero)

---

## Bottom Sheet ("More" Menu)

### Trigger

Tap "More" in the bottom bar.

### Visual Design

- Overlay: `rgba(0,0,0,0.5)`, covers full screen behind sheet
- Sheet: slides up from bottom, rounded top corners (16px radius)
- Background: `var(--color-surface)` (respects dark mode)
- Max height: ~60vh
- Drag handle: 32px wide, 4px tall, centered, `bg-gray-600` rounded bar at top
- Padding: 20px horizontal

### Content

Remaining nav items not in the bottom bar, each as a row with icon + label:

| Icon | Label | Href |
|------|-------|------|
| Filter (lucide) | Filters | `/filters` |
| FlaskConical (lucide) | Contaminants | `/contaminant` |
| Building2 (lucide) | Suppliers | `/supplier` |
| BookOpen (lucide) | Guides | `/guides` |
| Info (lucide) | About | `/about` |

Each row: 48px height (touch target), icon left, label right, full-width tap area. Active page highlighted with accent colour.

Below the links: `PostcodeSearch` component (size="sm") with a subtle top border.

### Dismissal

- Tap overlay (outside sheet)
- Swipe down gesture on the sheet
- Tap any nav item (navigates and closes)
- Press Escape key

### Animation

- Sheet slides up from below viewport: `transform: translateY(100%)` → `translateY(0)`
- Duration: 200ms ease-out
- Overlay fades in: 150ms

---

## Header Changes (Mobile Only)

- Remove the hamburger button (`MobileNav` component hidden on mobile)
- Header becomes: logo only on mobile (left-aligned)
- Desktop: completely unchanged (NavLinks + no MobileNav was already desktop-only)
- The `MobileNav` component import can stay but gets `hidden` class on mobile since the bottom bar replaces it

---

## Layout Changes

- `<main>` needs bottom padding on mobile to prevent content being hidden behind the pill bar
- Add `pb-24 sm:pb-0` (96px padding on mobile, none on desktop) to the main element in layout.tsx
- The `MobileBottomNav` component renders as a direct child of `<body>` in layout.tsx, after `<Footer />`

---

## Files

### New Files

| File | Purpose |
|------|---------|
| `src/components/mobile-bottom-nav.tsx` | Client component: the floating pill bar + search logic |
| `src/components/bottom-sheet.tsx` | Client component: reusable bottom sheet with overlay, drag, dismiss |

### Modified Files

| File | Change |
|------|--------|
| `src/app/layout.tsx` | Add `MobileBottomNav` before `</body>`, add `pb-24 sm:pb-0` to `<main>` |
| `src/components/header.tsx` | Hide hamburger/MobileNav on mobile (bottom bar replaces it) |

---

## Accessibility

- Bottom bar: `role="navigation"`, `aria-label="Main navigation"`
- Active item: `aria-current="page"`
- Bottom sheet: `role="dialog"`, `aria-modal="true"`, focus trap when open
- All items: minimum 44px touch targets
- Escape key closes bottom sheet
- Reduced motion: skip slide/fade animations for `prefers-reduced-motion`

---

## Dependencies

No new packages. Uses existing:
- Lucide React icons
- `usePathname()` from `next/navigation`
- `PostcodeSearch` component
- Tailwind responsive utilities (`sm:hidden`, `hidden sm:flex`)
