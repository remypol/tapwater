# UX/UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform tapwater.uk from a patched prototype into a water-native, plain-English product that normal UK residents trust and share.

**Architecture:** 7 parallel work streams — colour system, water drop score, SVG map, language overhaul, component polish, page restructuring, mobile patterns. Each task is self-contained and produces a commit. The colour system goes first because everything else depends on the new tokens.

**Tech Stack:** Next.js 16, Tailwind v4, CSS animations, SVG, lucide-react. Leaflet removed entirely.

**Spec:** `docs/superpowers/specs/2026-04-02-ux-redesign-design.md`

---

## Task 1: Colour System — Teal Palette + Fluid Backgrounds

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Update colour tokens**

In `globals.css`, replace these values inside `@theme inline`:

```css
--color-accent: #0891b2;       /* was #1d4ed8 */
--color-accent-hover: #0e7490; /* was #1e40af */
--color-accent-light: #ecfeff; /* was #dbeafe */
```

And in `:root`:
```css
--color-wash: #f0f9ff;   /* was #f9fafb — subtle water tint */
--color-accent: #0891b2;
--color-accent-hover: #0e7490;
--color-accent-light: #ecfeff;
```

- [ ] **Step 2: Replace atmospheric backgrounds**

Replace the existing `.bg-hero` class with fluid organic blobs:

```css
.bg-hero {
  background:
    radial-gradient(ellipse 80% 50% at 20% 0%, rgba(8, 145, 178, 0.07) 0%, transparent 70%),
    radial-gradient(ellipse 60% 40% at 80% 20%, rgba(14, 116, 144, 0.04) 0%, transparent 60%),
    radial-gradient(ellipse 50% 60% at 50% 80%, rgba(8, 145, 178, 0.03) 0%, transparent 50%),
    var(--color-wash);
}
```

Replace the score backgrounds with teal-tinted versions:
```css
.bg-score-safe {
  background:
    radial-gradient(ellipse 70% 50% at 50% 0%, rgba(8, 145, 178, 0.06) 0%, transparent 60%),
    radial-gradient(ellipse 40% 30% at 30% 40%, rgba(22, 163, 74, 0.04) 0%, transparent 50%),
    var(--color-wash);
}

.bg-score-warning {
  background:
    radial-gradient(ellipse 70% 50% at 50% 0%, rgba(217, 119, 6, 0.05) 0%, transparent 60%),
    radial-gradient(ellipse 40% 30% at 70% 40%, rgba(8, 145, 178, 0.03) 0%, transparent 50%),
    var(--color-wash);
}

.bg-score-danger {
  background:
    radial-gradient(ellipse 70% 50% at 50% 0%, rgba(220, 38, 38, 0.05) 0%, transparent 60%),
    radial-gradient(ellipse 40% 30% at 30% 40%, rgba(8, 145, 178, 0.03) 0%, transparent 50%),
    var(--color-wash);
}
```

- [ ] **Step 3: Update card hover to teal-tinted**

Replace the existing `.card:hover` rule:
```css
.card:hover {
  border-color: var(--color-rule-strong);
  box-shadow: 0 2px 16px rgba(8, 145, 178, 0.06);
  transform: translateY(-1px);
}
```

Add transition to base `.card`:
```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-rule);
  border-radius: 12px;
  transition: border-color 0.25s ease-out, box-shadow 0.25s ease-out, transform 0.25s ease-out;
}
```

Add active state for mobile:
```css
.card:active {
  transform: scale(0.98);
}
```

- [ ] **Step 4: Add new animation keyframes**

Add these new keyframes to globals.css:

```css
/* Water wave for drop score */
@keyframes wave {
  0%, 100% { transform: translateX(0) translateY(0); }
  50% { transform: translateX(-15px) translateY(2px); }
}

@keyframes wave2 {
  0%, 100% { transform: translateX(0) translateY(0); }
  50% { transform: translateX(10px) translateY(-2px); }
}

/* Icon spring bounce */
@keyframes icon-spring {
  0% { transform: scale(0); }
  60% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

.animate-icon-spring {
  animation: icon-spring 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

/* Water fill for drop */
@keyframes water-rise {
  from { transform: translateY(100%); }
  to { transform: translateY(var(--water-offset)); }
}

.animate-water-rise {
  animation: water-rise 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  transform: translateY(100%);
}

/* Scroll reveal */
@keyframes reveal {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Pulse glow for current year bar */
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(8, 145, 178, 0); }
  50% { box-shadow: 0 0 8px 2px rgba(8, 145, 178, 0.3); }
}
```

- [ ] **Step 5: Build and verify colour change renders**

Run: `npm run build`
Expected: Clean build with no errors. The accent colour in the browser should now show teal instead of blue.

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css
git commit -m "style: teal palette + fluid backgrounds + water-native animations"
```

---

## Task 2: Water Drop Score Component

**Files:**
- Create: `src/components/water-drop-score.tsx`

- [ ] **Step 1: Create the water drop SVG component**

Create `src/components/water-drop-score.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  score: number;
  size?: number;
  tested?: number;
  flagged?: number;
}

const FILL_COLORS = {
  safe: { from: "#0891b2", to: "#06b6d4" },
  warning: { from: "#d97706", to: "#f59e0b" },
  danger: { from: "#dc2626", to: "#f87171" },
} as const;

function getScoreLevel(score: number): "safe" | "warning" | "danger" {
  if (score >= 7) return "safe";
  if (score >= 5) return "warning";
  return "danger";
}

function getHumanLabel(score: number): { primary: string; secondary: string } {
  if (score >= 7) return { primary: "Your water is safe", secondary: "nothing to worry about" };
  if (score >= 5) return { primary: "Your water is mostly fine", secondary: "a few things worth knowing about" };
  if (score >= 3) return { primary: "Your water has some issues", secondary: "some things above recommended safe levels" };
  return { primary: "Your water needs attention", secondary: "several substances above safe levels" };
}

function getGradeLabel(score: number): string {
  if (score >= 9) return "Excellent";
  if (score >= 7) return "Good";
  if (score >= 5) return "Fair";
  if (score >= 3) return "Poor";
  return "Very Poor";
}

export function WaterDropScore({ score, size = 200, tested = 0, flagged = 0 }: Props) {
  const [displayScore, setDisplayScore] = useState(0);
  const [mounted, setMounted] = useState(false);
  const rafRef = useRef<number | null>(null);

  const level = getScoreLevel(score);
  const colors = FILL_COLORS[level];
  const { primary, secondary } = getHumanLabel(score);
  const grade = getGradeLabel(score);
  // Water fills from bottom: 0/10 = 0% filled, 10/10 = 100%
  const fillPercent = (score / 10) * 100;
  const waterOffset = 100 - fillPercent; // CSS translateY percentage

  useEffect(() => {
    setMounted(true);
    const duration = 1200;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(parseFloat((eased * score).toFixed(1)));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayScore(score);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [score]);

  const dropId = `drop-${size}`;
  const gradientId = `water-gradient-${size}`;
  const waveId = `wave-clip-${size}`;

  // Drop path — teardrop shape
  const w = size;
  const h = size * 1.3;
  const dropPath = `M${w / 2} 0 C${w * 0.15} ${h * 0.35} 0 ${h * 0.55} 0 ${h * 0.7} C0 ${h * 0.88} ${w * 0.22} ${h} ${w / 2} ${h} C${w * 0.78} ${h} ${w} ${h * 0.88} ${w} ${h * 0.7} C${w} ${h * 0.55} ${w * 0.85} ${h * 0.35} ${w / 2} 0 Z`;

  return (
    <div
      className="flex flex-col items-center gap-4"
      role="img"
      aria-label={`Water quality score: ${score} out of 10. ${primary}.`}
    >
      <div className="relative" style={{ width: w, height: h }}>
        <svg
          viewBox={`0 0 ${w} ${h}`}
          width={w}
          height={h}
          aria-hidden="true"
        >
          <defs>
            <clipPath id={dropId}>
              <path d={dropPath} />
            </clipPath>
            <linearGradient id={gradientId} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor={colors.from} />
              <stop offset="100%" stopColor={colors.to} />
            </linearGradient>
          </defs>

          {/* Drop outline */}
          <path
            d={dropPath}
            fill="none"
            stroke="var(--color-rule)"
            strokeWidth="1.5"
          />

          {/* Clipped water fill group */}
          <g clipPath={`url(#${dropId})`}>
            {/* Water fill rectangle — animated upward */}
            <rect
              x="0"
              y="0"
              width={w}
              height={h}
              fill={`url(#${gradientId})`}
              opacity="0.85"
              className={mounted ? "animate-water-rise" : ""}
              style={{ "--water-offset": `${waterOffset}%` } as React.CSSProperties}
            />

            {/* Wave surface — two ellipses with offset animations */}
            <ellipse
              cx={w / 2}
              cy="0"
              rx={w * 0.7}
              ry="4"
              fill="var(--color-wash)"
              opacity="0.4"
              className={mounted ? "" : "hidden"}
              style={{
                animation: "wave 3s ease-in-out infinite",
                transformOrigin: "center",
                transform: `translateY(${h * (waterOffset / 100)}px)`,
              }}
            />
            <ellipse
              cx={w / 2}
              cy="0"
              rx={w * 0.5}
              ry="3"
              fill="var(--color-wash)"
              opacity="0.25"
              className={mounted ? "" : "hidden"}
              style={{
                animation: "wave2 2.5s ease-in-out infinite",
                transformOrigin: "center",
                transform: `translateY(${h * (waterOffset / 100)}px)`,
              }}
            />
          </g>
        </svg>

        {/* Score number centred inside the drop */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ paddingTop: h * 0.25 }}
          aria-hidden="true"
        >
          <span
            className="font-data font-bold leading-none"
            style={{
              fontSize: size * 0.22,
              color: fillPercent > 55 ? "#ffffff" : "var(--color-ink)",
            }}
          >
            {displayScore.toFixed(1)}
          </span>
          <span
            className="leading-none mt-1"
            style={{
              fontSize: size * 0.08,
              color: fillPercent > 55 ? "rgba(255,255,255,0.6)" : "var(--color-faint)",
            }}
          >
            /10
          </span>
        </div>
      </div>

      {/* Human-readable text below */}
      <div className="text-center animate-fade-up delay-6">
        <p
          className="text-lg font-semibold"
          style={{ color: colors.from }}
        >
          {primary}
        </p>
        <p className="text-sm text-muted mt-1">
          {tested > 0
            ? `We checked ${tested} things and found ${flagged > 0 ? `${flagged} ${secondary}` : secondary}`
            : primary}
        </p>
      </div>

      {/* Small grade badge */}
      <span
        className="text-xs font-medium px-2.5 py-0.5 rounded-full animate-fade-in delay-7"
        style={{
          backgroundColor: `${colors.from}15`,
          color: colors.from,
        }}
      >
        {grade}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Build and verify**

Run: `npm run build`
Expected: Clean build. The component is not wired into any page yet.

- [ ] **Step 3: Commit**

```bash
git add src/components/water-drop-score.tsx
git commit -m "feat: water drop score component with animated fill + wave"
```

---

## Task 3: UK SVG Choropleth Map

**Files:**
- Create: `src/data/uk-regions.ts`
- Create: `src/components/uk-map.tsx`
- Create: `src/components/region-sheet.tsx`

- [ ] **Step 1: Create region data with SVG paths**

Create `src/data/uk-regions.ts` with simplified UK region boundaries as SVG path data. Each region has an ID, name, and path string for a 600x800 viewBox. Also export a mapping of postcode prefixes to regions.

The region paths should be simplified outlines — not pixel-perfect cartography, but recognisable shapes. Include: Scotland, North East, North West, Yorkshire, East Midlands, West Midlands, East of England, London, South East, South West, Wales.

Also include a `POSTCODE_TO_REGION` map:
```ts
export const POSTCODE_TO_REGION: Record<string, string> = {
  // London
  SW: "london", SE: "london", E: "london", N: "london",
  NW: "london", W: "london", EC: "london", WC: "london",
  // North West
  M: "north-west", L: "north-west",
  // Yorkshire
  LS: "yorkshire", S: "yorkshire", YO: "yorkshire",
  // West Midlands
  B: "west-midlands", CV: "west-midlands",
  // East Midlands
  NG: "east-midlands", DE: "east-midlands", LE: "east-midlands",
  // South West
  BS: "south-west", BA: "south-west", EX: "south-west", PL: "south-west",
  // South East
  BN: "south-east", SO: "south-east", PO: "south-east", RG: "south-east", OX: "south-east",
  // East
  CB: "east", NR: "east",
  // North East
  NE: "north-east",
  // Wales
  CF: "wales", SA: "wales",
  // Scotland
  EH: "scotland", G: "scotland", AB: "scotland",
};
```

- [ ] **Step 2: Create the UK map component**

Create `src/components/uk-map.tsx` as a Client Component. It receives postcode data, computes average scores per region, and renders an interactive SVG with tooltips. On click/tap, it calls an `onRegionSelect` callback. Include hover effects (brightness), cursor pointer, smooth colour transitions.

The colour for each region is computed from teal (#0891b2) for score 10 through amber (#d97706) at 5 to coral (#ef4444) at 0, using HSL interpolation.

- [ ] **Step 3: Create the mobile bottom sheet**

Create `src/components/region-sheet.tsx` as a Client Component. It renders a fixed bottom sheet that slides up on mobile when a region is selected. Shows that region's postcodes as a scrollable list with score badges. Has a drag handle at top and clicking outside or swiping down dismisses it.

- [ ] **Step 4: Build and verify**

Run: `npm run build`
Expected: Clean build.

- [ ] **Step 5: Commit**

```bash
git add src/data/uk-regions.ts src/components/uk-map.tsx src/components/region-sheet.tsx
git commit -m "feat: SVG choropleth UK map with region interactions + bottom sheet"
```

---

## Task 4: Scroll Reveal Component

**Files:**
- Create: `src/components/scroll-reveal.tsx`

- [ ] **Step 1: Create the scroll reveal wrapper**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function ScrollReveal({ children, className = "", delay = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: `opacity 0.5s ease-out ${delay}ms, transform 0.5s ease-out ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/scroll-reveal.tsx
git commit -m "feat: scroll reveal component with intersection observer"
```

---

## Task 5: Language Overhaul — All Components

**Files:**
- Modify: `src/components/stat-cards.tsx`
- Modify: `src/components/pfas-banner.tsx`
- Modify: `src/components/contaminant-table.tsx`
- Modify: `src/components/filter-cards.tsx`
- Modify: `src/components/email-capture.tsx`
- Modify: `src/components/postcode-search.tsx`

- [ ] **Step 1: Rewrite stat-cards labels**

In `src/components/stat-cards.tsx`, change all labels:
- "Parameters Tested" → "Tests run"
- "Flagged" → "All clear" (when 0) or "X to watch" (when > 0)
- "Water Supplier" → "Your water company"
- "Last Updated" → "Last checked"

- [ ] **Step 2: Rewrite PFAS banner language**

In `src/components/pfas-banner.tsx`:
- Heading: "PFAS DETECTED IN ENVIRONMENTAL MONITORING" → "Forever chemicals found near you"
- Body: rewrite to plain English per spec
- Links: "Learn about PFAS →" → "What are forever chemicals? →", "Filters that remove PFAS →" → "How to remove them →"

- [ ] **Step 3: Rewrite contaminant table labels**

In `src/components/contaminant-table.tsx`:
- Column headers: "CONTAMINANT" → "SUBSTANCE", "YOUR LEVEL" → "FOUND", "UK LIMIT" → "SAFE LEVEL", "WHO GUIDELINE" → "WHO SAFE LEVEL", "STATUS" stays
- Status text: "OK" → "Safe", "Watch" stays, "Exceeds" → "Over limit"
- Source: "Source: EA Water Quality Archive" → "Source: Environment Agency"
- Mobile: "Your level" → "Found", "UK limit" → "Safe level", "WHO" stays
- "% of limit" → "% of safe level"

- [ ] **Step 4: Rewrite filter cards language**

In `src/components/filter-cards.tsx`:
- Heading: "Recommended for {postcode}" → "Filters for your area"
- Subtitle: "Selected based on contaminants detected in your area" → "Picked to match what we found in your water"

- [ ] **Step 5: Rewrite email capture language**

In `src/components/email-capture.tsx`:
- Heading: "Stay informed about {postcode}" → "Get alerts for your area"
- Body: "Get notified when water quality data changes in your area or when incidents affect your supply." → "We'll let you know if anything changes with the water in your area."
- Footer: "Monthly digest + breaking alerts. No spam, unsubscribe anytime." → "Monthly updates + breaking alerts. No spam ever."

- [ ] **Step 6: Rewrite search helper text**

In `src/components/postcode-search.tsx`:
- Helper text: "Enter a full postcode or district code — e.g. SW1A 1AA, M1, B1" → "Try your postcode — e.g. SW1A, M1, B1"

- [ ] **Step 7: Build and verify**

Run: `npm run build`
Expected: Clean build with all language changes.

- [ ] **Step 8: Commit**

```bash
git add src/components/stat-cards.tsx src/components/pfas-banner.tsx src/components/contaminant-table.tsx src/components/filter-cards.tsx src/components/email-capture.tsx src/components/postcode-search.tsx
git commit -m "content: plain English language overhaul across all components"
```

---

## Task 6: Page Restructuring — Homepage

**Files:**
- Modify: `src/app/page.tsx`
- Delete: `src/components/lazy-map.tsx`

- [ ] **Step 1: Rewrite homepage**

Rewrite `src/app/page.tsx` with the new flow per spec:
1. Hero with "Check your tap water" (teal atmosphere)
2. Trust stats with human labels: "2,979 areas" / "25,000+ tests" / "14 PFAS alerts" / "Updated daily"
3. UK SVG choropleth map (import UkMap from `@/components/uk-map`, import region data)
4. "Areas to watch" + "Cleanest water" sections (relabelled from current)
5. "Popular searches" (relabelled)
6. "Water companies" (relabelled)

Remove the Leaflet map import and the LazyMap component.

- [ ] **Step 2: Delete lazy-map**

Delete `src/components/lazy-map.tsx`.

- [ ] **Step 3: Build and verify**

Run: `npm run build`
Expected: Clean build. Homepage renders with SVG map.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: homepage restructured with SVG map + human language"
```

---

## Task 7: Page Restructuring — Postcode Page

**Files:**
- Modify: `src/app/postcode/[district]/page.tsx`
- Delete: `src/components/safety-score.tsx`

- [ ] **Step 1: Rewrite postcode page**

Replace the SafetyScore ring import with WaterDropScore. Apply all language changes per spec. New flow:
1. Breadcrumb: Home → SW1A
2. "Your water in SW1A" + "Westminster, London" (no year)
3. WaterDropScore with animated fill
4. Stat cards (human labels already applied in Task 5)
5. PFAS banner (human language already applied in Task 5)
6. "What we found" section heading + human intro
7. ContaminantTable
8. "How it's changed" trend chart with scroll-triggered bar animations
9. Email capture (moved up)
10. Filter cards
11. "Compare nearby" horizontal scroll
12. Supplier card + methodology footer

Remove the "What this means" callout section.
Wrap major sections in ScrollReveal for scroll-triggered entrance animations.

- [ ] **Step 2: Delete old safety-score**

Delete `src/components/safety-score.tsx`.

- [ ] **Step 3: Build and verify**

Run: `npm run build`
Expected: Clean build. Postcode pages render with water drop.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: postcode page with water drop score + restructured flow"
```

---

## Task 8: Design Token Fix — About, Methodology, Contaminant Pages

**Files:**
- Modify: `src/app/about/page.tsx`
- Modify: `src/app/about/methodology/page.tsx`
- Modify: `src/app/contaminant/[slug]/page.tsx`

- [ ] **Step 1: Fix about page**

Replace all hardcoded colours with design tokens:
- `text-slate-900` → `text-[var(--color-ink)]`
- `text-slate-600` → `text-[var(--color-body)]`
- `text-slate-400` → `text-[var(--color-muted)]`
- `text-blue-600` → `text-[var(--color-accent)]`
- `hover:text-blue-800` → `hover:text-[var(--color-accent-hover)]`

Add `font-display italic` to the H1.

- [ ] **Step 2: Fix methodology page**

Same token replacement plus:
- `bg-slate-50` → `bg-[var(--color-wash)]`
- `divide-slate-100` → `divide-[var(--color-rule)]`
- Add responsive table rendering for mobile (convert to card layout below md breakpoint)
- Add `font-display italic` to the H1

- [ ] **Step 3: Fix contaminant pages**

Same token replacement plus:
- `bg-blue-50` → `bg-[var(--color-accent-light)]`
- `text-blue-700` → `text-[var(--color-accent)]`
- Add responsive table rendering for mobile
- Add `font-display italic` to the H1
- Soften language where facing users

- [ ] **Step 4: Build and verify**

Run: `npm run build`
Expected: Clean build.

- [ ] **Step 5: Commit**

```bash
git add src/app/about/page.tsx src/app/about/methodology/page.tsx src/app/contaminant/\[slug\]/page.tsx
git commit -m "fix: design token enforcement + font-display on about/methodology/contaminant"
```

---

## Task 9: Mobile Patterns — Sticky Header, Nav, Swipeable Cards

**Files:**
- Modify: `src/components/sticky-score.tsx`
- Modify: `src/components/mobile-nav.tsx`
- Modify: `src/components/contaminant-table.tsx`

- [ ] **Step 1: Refine sticky score header**

In `src/components/sticky-score.tsx`:
- Replace text-only display with mini water drop icon (inline SVG, 16px, filled to score level) + "SW1A" + "Safe ✓" (teal) or "X issues" (amber)
- Add tap handler that smooth-scrolls back to the water drop

- [ ] **Step 2: Refine mobile nav**

In `src/components/mobile-nav.tsx`:
- Add frosted glass effect: `backdrop-blur-lg bg-[var(--color-surface)]/90`
- Increase tap targets: `py-3`
- Add teal left-border on active page link
- Add PostcodeSearch (size="sm") at the bottom of the nav panel

- [ ] **Step 3: Add swipeable contaminant cards on mobile**

In `src/components/contaminant-table.tsx`:
- Change mobile card layout from vertical stack to horizontal scroll with snap points
- Each card ~280px wide, `snap-start shrink-0`
- Add a scroll position indicator (small dots) below the container

- [ ] **Step 4: Build and verify**

Run: `npm run build`
Expected: Clean build.

- [ ] **Step 5: Commit**

```bash
git add src/components/sticky-score.tsx src/components/mobile-nav.tsx src/components/contaminant-table.tsx
git commit -m "feat: mobile patterns — refined sticky header, frosted nav, swipeable cards"
```

---

## Task 10: Component Polish — Interactions & Animations

**Files:**
- Modify: `src/components/postcode-search.tsx`
- Modify: `src/components/filter-cards.tsx`
- Modify: `src/components/email-capture.tsx`
- Modify: `src/components/header.tsx`
- Modify: `src/components/footer.tsx`

- [ ] **Step 1: Add wave focus effect to search**

In `src/components/postcode-search.tsx`:
- On focus: bottom border becomes a teal animated wave line
- Placeholder fades smoothly on focus (opacity transition)

- [ ] **Step 2: Add entrance animation to filter cards**

In `src/components/filter-cards.tsx`:
- Wrap each card in ScrollReveal with staggered delays (0, 100, 200ms)

- [ ] **Step 3: Add success animation to email capture**

In `src/components/email-capture.tsx`:
- On success: form fades out + scales down, then success message fades up
- Use CSS transitions with state-driven classes

- [ ] **Step 4: Update header/footer accent colour**

In `src/components/header.tsx` and `src/components/footer.tsx`:
- Verify accent colour references use `var(--color-accent)` (the CSS variable will automatically pick up the new teal)

- [ ] **Step 5: Build and verify**

Run: `npm run build`
Expected: Clean build.

- [ ] **Step 6: Commit**

```bash
git add src/components/postcode-search.tsx src/components/filter-cards.tsx src/components/email-capture.tsx src/components/header.tsx src/components/footer.tsx
git commit -m "polish: wave search focus, filter animations, email success transition"
```

---

## Task 11: Remove Leaflet Dependencies

**Files:**
- Delete: `src/components/water-quality-map.tsx`
- Modify: `package.json`

- [ ] **Step 1: Delete old map component**

Delete `src/components/water-quality-map.tsx`.

- [ ] **Step 2: Uninstall Leaflet packages**

```bash
npm uninstall leaflet react-leaflet leaflet.markercluster @types/leaflet @types/leaflet.markercluster
```

- [ ] **Step 3: Build and verify no broken imports**

Run: `npm run build`
Expected: Clean build with no references to leaflet.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove Leaflet dependencies — replaced by SVG choropleth"
```

---

## Task 12: Final Build + Deploy

- [ ] **Step 1: Full build**

```bash
npm run build
```

Expected: Clean build, 258+ pages generated.

- [ ] **Step 2: Visual verification**

Check in browser:
- Homepage: teal atmosphere, SVG map, human labels
- Postcode page: water drop score, wave animation, plain English
- Mobile: sticky header with mini drop, swipeable cards, frosted nav
- About/Methodology: consistent design tokens, font-display headings

- [ ] **Step 3: Commit and deploy**

```bash
git add -A
git commit -m "release: water-native UX redesign — drop score, SVG map, plain English"
git push
vercel --prod
```
