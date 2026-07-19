# Fable Agent 1 — Compact Final Review

**Scope:** `git diff HEAD` for the 5 named files + the two components they now render (`affiliate-link.tsx`, `conversion-tracker.tsx`) as required to judge CTA/disclosure and friction. Read-only, no edits.

## VERDICT: **FIX** (shippable with fixes — nothing hard-blocks the build, but 4 IMPORTANT items should land before this is a clean sales loop)

Overall the direction is strong: single hero pick + honest limitations, differentiated two-pick guide starter, earlier placement while intent is fresh, and centralized affiliate tracking with `rel="sponsored nofollow"`. The issues below are honesty-consistency, one crash surface, and analytics fidelity — not architecture.

---

## BLOCKERS
None that break the build or overtly deceive. (Promoting the disclosure item below to a blocker **if** verification shows no visible disclosure exists — see IMPORTANT #1.)

---

## IMPORTANT

**1. Affiliate disclosure — verify a user-visible one sits near the new CTAs**
`affiliate-link.tsx:41` correctly emits `rel="noopener noreferrer sponsored nofollow"` (good machine signal), but `rel` is **not** a user-facing disclosure. This diff adds monetized CTAs to a guide page (`best-water-filters-uk/page.tsx` new "Two honest places to start" section) and the postcode page. Within the inspected scope I could not confirm a visible "we may earn commission" line near these cards. For a UK site this is an ASA/CAP concern. **Action:** confirm a conspicuous disclosure renders above/beside these cards; if absent, this is a launch blocker.

**2. PFAS honesty inconsistency — detected PFAS can render under a "taste & convenience / within recommended levels" frame**
`postcode/[district]/page.tsx:133-135` injects `"PFAS (total)"` into recommendation signals when `pfasDetected` is true but PFAS isn't in `flaggedNames`. But `contaminantsFlagged` (passed to the UI) does **not** include that injected signal. Reachable state: `pfasDetected === true`, no other flagged contaminants → `contaminantsFlagged === 0`, yet a PFAS-matched filter is surfaced. Result:
- Header shows `"Optional filter for taste & convenience"` (`filter-cards.tsx:235`)
- Message returns `"…within recommended levels. A filter is optional…"` (`recommendation.ts:14-16`)
- …while the "What it removes" checklist shows PFAS.

This **understates a genuinely detected contaminant** — the one place the copy could mis-inform (downward). **Action:** when PFAS is injected, reflect it in the header/message (e.g., treat injected PFAS as a flagged concern for messaging, or add a "PFAS detected below flag threshold" note). Also `recommendation.ts:26` says a concern "was flagged" — imprecise for detected-not-flagged PFAS.

**3. `water_score_band` hardcoded `"unknown"` defeats the conversion analytics this diff exists for**
`filter-cards.tsx:222` always logs `water_score_band: "unknown"` on the recommendation impression, even though the page computes the real band at `postcode/[district]/page.tsx:137` and passes it only to `WaterReportTracker`. `FilterRecommendations` (`filter-cards.tsx:206-210`) has no `waterScoreBand` prop, so it can't populate it. **Action:** add a `waterScoreBand` prop and thread it through; otherwise band-segmented conversion analysis is dead on arrival.

**4. New SSR crash surface: `new URL(hero.affiliateUrl)`**
`filter-cards.tsx:228` calls `new URL(hero.affiliateUrl).hostname` at render. `FilterRecommendations` is server-rendered (no `'use client'`), so a single catalog entry with an empty/relative `affiliateUrl` throws a `TypeError` and 500s that programmatic page — a new failure mode this diff introduces. Low likelihood (affiliate URLs are normally absolute) but high blast radius across auto-generated pages. **Action:** guard it (try/catch or validate absolute URL, fall back to `""`).

---

## POLISH

- `postcode/[district]/page.tsx` ~419: leftover blank line where the old FilterRecommendations block was removed.
- `best-water-filters-uk/page.tsx` topPicks map: `product && (...)` guard is redundant after `.filter((pick) => pick.product != null)`; kept only to satisfy narrowing — fine, but note the double guard.
- `filter-cards.tsx:215` recomputes `matchedContaminants.join("+").toLowerCase()` — duplicates the `recommendationReason` logic inside `HeroRecommendation`; consider deriving once.
- `recommendation.ts:29-33` `getTransparentLimitations` only surfaces cons matching `^(does not|doesn't|won't|only removes|cannot|not certified)`. Honest cons phrased differently silently produce zero "Important limitations." Coupling the honesty feature to copy phrasing is fragile — worth a data-side lint or broader match.
- Placement: recommendation now renders **before** the contaminant data table (`postcode` page). Good for conversion; mild trust tradeoff (recommend-before-showing-the-problem). Acceptable since the score ring precedes it — noting only.

---

**Net:** conversion UX and product fit are a clear improvement; honesty features (limitations, hedged copy, "check your postcode first") are good. Land IMPORTANT #1–#4 and this is a clean ship.
