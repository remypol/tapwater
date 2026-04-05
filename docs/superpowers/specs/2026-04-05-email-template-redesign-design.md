# Email Template Redesign — Data Dashboard Style

**Date:** 2026-04-05
**Goal:** Replace the current functional-but-generic email templates with visually impressive, data-forward emails that feel like opening an app — dark theme, visual scores, stat pills, colour-coded contaminant headers, and editorial authority.

---

## 1. Visual Design System

### Theme
- **Dark background:** `#0f172a` (slate-900) for email body, `#1e293b` (slate-800) for cards
- **Card borders:** `#334155` (slate-700)
- **Accent:** `#0891b2` (teal-600) for CTAs and links
- **White content blocks:** `#ffffff` for body text sections — ensures readability
- **Typography:** System font stack for body, Georgia for headings and score numbers

### Reusable Components (inline-styled HTML)

1. **Logo header** — centred water drop icon (teal gradient circle with SVG drop) + "TAPWATER.UK" in uppercase tracked text. Briefing number on emails 2-5.
2. **Score centrepiece** — large number (48-52px Georgia bold), grade label below in status colour, 3-segment bar (red/amber/green with active segment highlighted), location subtitle
3. **Stat pills** — 3-column flex row: "Tested" (white), "Flagged" (amber-tinted border), "PFAS" (red-tinted border)
4. **Contaminant rows** — coloured dot + name + status label, separated by subtle borders
5. **Topic header** — gradient background block (colour per topic: red for lead, green for recommendations, purple for testing, teal for updates), uppercase label + large title
6. **Product card** — bordered card with "Our pick for [postcode]" banner, product name/price/rating, contaminant removal pills, CTA button
7. **Budget alternative** — compact single-row card with name, price, and link
8. **CTA button** — teal gradient, full-width, rounded, white text, arrow
9. **Next teaser** — centred small text: "Next: [description] · Day N"
10. **Footer** — slate-800 background, signup reason, unsubscribe link in teal
11. **Disclosure box** — slate-800 rounded box with small grey text and disclosure link
12. **Quick fact** — slate-800 card with large stat number + explanatory text

### Email HTML Constraints
- All styles inline (no `<style>` blocks — email clients strip them)
- Table-based layout for Outlook compatibility
- `<table width="100%">` wrapper with `#0f172a` background
- Inner `<table width="600">` for content with rounded corners via background
- All images optional (graceful degradation)
- Tested against: Gmail, Apple Mail, Outlook 365, Yahoo Mail

---

## 2. Subject Lines

Each subject line is personalised with postcode and uses a specific psychological trigger.

| Day | Subject | Trigger |
|-----|---------|---------|
| 0 | `[postcode] scored [score] — [N] contaminants flagged in your water` | Data + urgency |
| 3 | `[Contaminant] was found in [postcode]'s water. Here's when it matters.` | Specificity |
| 7 | `The [N] filters that fix what's in [postcode]'s water` | Solution |
| 14 | `Is it your pipes or the water supply? One test tells you.` | Curiosity |
| 30 | `Your water quality may have changed — updated report for [postcode]` | FOMO |

**Fallback subjects** (when no contaminants flagged):
- Day 0: `[postcode] scored [score] — your water quality report`
- Day 3: `Good news about your water in [postcode] — and what to watch`
- Day 7: `The best water filters for [postcode] — even when your water's clean`

---

## 3. Email Content Per Step

### Day 0: The Report
**Sent:** Immediately after signup verification
**Layout:**
1. Logo header
2. Score centrepiece (score, grade, bar, location)
3. Stat pills (tested / flagged / PFAS yes/no)
4. "What we found" contaminant rows (if flagged)
5. White content block — 2 short paragraphs: reassurance + tease day 3
6. CTA: "View full report for [postcode]"
7. Next teaser: "Next: What [contaminant] in your water actually means · Day 3"
8. Footer

**Body copy tone:** Factual, not alarmist. "Your water is drinkable, but two readings caught our attention. Neither is cause for panic — but both are worth understanding."

### Day 3: The Explainer
**Sent:** 3 days after day 0
**Layout:**
1. Logo header with "Briefing #2"
2. Topic header — gradient in contaminant severity colour (red for lead, amber for PFAS), contaminant name large, "Found above UK limit in [postcode]" subtitle
3. White content block — three sections with Georgia serif subheads:
   - "Where it comes from" — plain English source explanation
   - "When it matters" — who's most at risk, UK limit vs WHO guideline
   - "What you can do" — actionable steps, tease day 7 recommendations
4. Quick fact card (e.g., "40% of UK homes still have lead piping")
5. CTA: "Learn more about [contaminant] in water"
6. Next teaser: "Next: Filters that actually remove [contaminant] · Day 7"
7. Footer

**Content generation:** The contaminant explainer content should be derived from the existing contaminant page data (`CONTAMINANTS` in `src/app/contaminant/[slug]/page.tsx`). Use `description`, `healthEffects`, `sources`, and `removalMethods` fields. This avoids duplicating content and keeps email copy in sync with the site.

**Fallback (no contaminants):** Replace topic header with teal "Good news" header. Content: "We didn't flag anything concerning. Here's what we tested for and why that's reassuring." Still tease day 7: "We'll share our favourite filters for everyday water improvement."

### Day 7: The Recommendation (Money Email)
**Sent:** 4 days after day 3
**Layout:**
1. Logo header with "Briefing #3"
2. Topic header — green gradient, "Matched to [postcode]", "Your filter recommendations"
3. Hero product card — bordered with teal "Our pick for [postcode]" banner:
   - Product name, category, certification
   - Price + rating
   - 1-sentence pitch
   - Contaminant removal pills (green rounded badges)
   - CTA button: "Check price on [brand]"
4. Budget alternative — compact row card
5. Disclosure box
6. CTA: "See all filter options"
7. Next teaser: "Next: Test your own tap — is it your pipes or the supply? · Day 14"
8. Footer

**Product selection logic:**
- Use `recommendFilters(topConcerns, 2)` — hero pick + one alternative
- Impact.com products get hero slot when available (Waterdrop 8%, Echo Water 20%)
- CTA text says "Check price on [brand]" for Impact.com, "View on Amazon" for Amazon
- Budget alternative is always a different category from hero (e.g., if hero is RO, budget is jug)

### Day 14: The Testing Angle
**Sent:** 7 days after day 7
**Layout:**
1. Logo header with "Briefing #4"
2. Topic header — purple gradient, "Your pipes vs the supply", "Test your own tap"
3. White content block — explains why home testing matters (company data ≠ your tap), 2 paragraphs
4. Two product cards stacked:
   - Premium: Tap Score Essential (lab test, £80) — for PFAS/lead confirmation
   - Budget: SJ WAVE 16-in-1 (strip test, £15) — for quick check
5. Next teaser: "Final update: Your latest water quality numbers · Day 30"
6. Footer

### Day 30: The Check-in
**Sent:** 16 days after day 14
**Layout:**
1. Logo header with "Monthly Update"
2. Score centrepiece (refreshed score, "No change" or "Changed" indicator)
3. White content block — 3 short paragraphs: data refreshed, we'll keep monitoring, share with someone
4. CTA: "View latest report for [postcode]"
5. Soft product reminder box: "Still haven't filtered your water?" + link to recommendations
6. Footer

---

## 4. Technical Implementation

### What changes
- **Replace:** `src/lib/email-sequences.ts` — complete rewrite of `buildEmailHtml` and all `buildDayN` functions
- **Replace:** Subject line logic in `getSubject`
- **Keep:** `getNextEmail`, `shouldSendEmail`, timing logic, types — all unchanged
- **Keep:** Test structure — update assertions to match new content

### Template architecture
- `emailShell(innerHtml, sub)` — outer table structure (background, width-600 container, footer)
- `logoHeader(briefingNumber?)` — logo + optional "Briefing #N"
- `scoreCentrepiece(score, grade, location)` — the big number block
- `statPills(tested, flagged, pfasDetected)` — 3-column stat row
- `contaminantRows(concerns)` — status-coloured rows
- `topicHeader(title, subtitle, gradient)` — coloured header block
- `heroProductCard(product, postcode)` — full product recommendation
- `budgetProductCard(product)` — compact alternative
- `ctaButton(href, label)` — teal gradient button
- `nextTeaser(text)` — "Coming next" line
- `disclosureBox()` — affiliate disclosure
- `quickFact(stat, text)` — stat + explanation card
- `contentBlock(html)` — white rounded container for prose

Each helper returns a string of inline-styled HTML. The `buildDayN` functions compose these helpers.

### Contaminant content for Day 3
Import or reference the contaminant data from the site. Create a lookup:
```typescript
const CONTAMINANT_EXPLAINERS: Record<string, { source: string; risk: string; fix: string; stat?: string }> = {
  Lead: { source: "Almost always from pipes in your building...", risk: "...", fix: "...", stat: "40% of UK homes..." },
  "PFAS (total)": { source: "Industrial manufacturing...", risk: "...", fix: "...", stat: "..." },
  // ... for each contaminant that could be flagged
};
```

This keeps the email content self-contained rather than importing from page components (which may not be importable in a non-page context).

---

## 5. What This Does NOT Cover

- Transactional emails (verification, unsubscribe confirmation) — keep as-is
- New sequence steps — same 5-step sequence (0/3/7/14/30)
- Timing logic changes — same delays
- Database schema changes — none needed
- A/B testing infrastructure — future enhancement
