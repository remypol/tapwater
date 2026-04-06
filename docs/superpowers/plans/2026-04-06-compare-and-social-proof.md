# Compare Page Enhancement & Social Proof Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enhance the compare page with a postcode-vs-postcode comparison tool, and add social proof/trust signals to the about page.

**Architecture:** Add a client-side comparison UI where users can enter 2 postcodes and see results side-by-side. Add trust metrics, methodology badges, and data source logos to the about page.

---

### Task 1: Side-by-side postcode comparison

**Files:**
- Create: `src/app/compare/[district1]/vs/[district2]/page.tsx` — dynamic comparison page
- Modify: `src/app/compare/page.tsx` — add comparison search UI at top

The comparison page shows two postcodes side-by-side: scores, contaminants, supplier, hardness. Shareable URL like `/compare/SW1A/vs/M1`.

Key elements:
- Two-column layout (stacked on mobile)
- Score comparison with visual difference indicator
- Contaminant-by-contaminant comparison table
- "Which is better?" verdict
- FAQ schema ("Is SW1A or M1 water better?")
- Metadata: "SW1A vs M1 Water Quality Comparison"

### Task 2: Comparison search on compare page

Add a dual-postcode input at the top of `/compare` that navigates to the comparison URL.

### Task 3: Social proof on about page

**Files:**
- Modify: `src/app/about/page.tsx`

Add:
- Trust metrics bar (same format as homepage: areas covered, tests, etc.)
- Data source badges: "Data from Environment Agency", "Drinking Water Inspectorate", "Open Government Licence"
- Methodology highlights: "100+ contaminants tested", "Daily updates", "22 water companies tracked"
- "Our data is cited by" section (placeholder for future press mentions)
