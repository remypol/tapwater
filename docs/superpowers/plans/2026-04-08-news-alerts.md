# News & Alerts System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully automated incident detection, AI article generation, and publishing pipeline that monitors UK water sources, generates news articles, shows alert banners on affected pages, and produces RSS/sitemap feeds for Google News.

**Architecture:** Supabase `incidents` table stores all incident state. A 15-minute Vercel cron polls water company feeds + EA API, detects new/resolved incidents, generates articles via Claude API, and triggers on-demand revalidation via `revalidatePath`. Alert banners render on postcode/city pages by querying active incidents. `/news` hub and `/news/[slug]` article pages serve the content. RSS + News sitemap for Google News.

**Tech Stack:** Next.js 16, React 19, Supabase (Postgres), Anthropic Claude API (`@anthropic-ai/sdk`), `marked` (markdown→HTML), Resend (admin alerts), Vercel crons, `revalidatePath` for on-demand ISR.

**Spec:** `docs/superpowers/specs/2026-04-08-news-alerts-design.md`

---

## File Structure

### New files

| File | Responsibility |
|------|---------------|
| `src/lib/incidents-types.ts` | TypeScript interfaces for incidents, source checks, logs |
| `src/lib/incidents.ts` | Data access layer — queries + mutations for incidents table |
| `src/lib/incident-parsers/water-companies.ts` | Parsers for water company RSS/status feeds |
| `src/lib/incident-parsers/environment-agency.ts` | Parser for EA incident API |
| `src/lib/incident-parsers/postcode-matcher.ts` | Maps incidents to affected postcode districts |
| `src/lib/incident-parsers/index.ts` | Orchestrates all parsers, returns normalized incidents |
| `src/lib/incident-article.ts` | AI article generation via Claude + validation + fallback |
| `src/app/api/cron/incidents/route.ts` | Main cron: poll sources, detect, generate, publish, resolve |
| `src/app/news/page.tsx` | News hub — article grid with filters |
| `src/app/news/[slug]/page.tsx` | Individual article — editorial + sidebar layout |
| `src/app/news/rss.xml/route.ts` | RSS 2.0 feed with Google News extensions |
| `src/app/news/sitemap.xml/route.ts` | Google News sitemap (<48h articles) |
| `src/components/incident-alert.tsx` | Alert banner component for postcode/city pages |
| `src/lib/__tests__/incidents.test.ts` | Unit tests for incident types, validation, matching |
| `src/lib/__tests__/incident-article.test.ts` | Unit tests for article generation validation |
| `supabase/migrations/20260408_incidents.sql` | Database migration for incidents tables |

### Modified files

| File | Change |
|------|--------|
| `src/app/postcode/[district]/page.tsx` | Import IncidentAlert, query active incidents, render banner above content |
| `src/app/city/[slug]/page.tsx` | Same — import IncidentAlert, query + render |
| `src/components/header.tsx` | Add "News" to navLinks array |
| `src/components/json-ld.tsx` | Add NewsArticleSchema component |
| `src/app/layout.tsx` | Add RSS auto-discovery `<link>` tag |
| `src/app/sitemap.ts` | Add `/news` and news article paths |
| `vercel.json` | Add incidents cron schedule |
| `package.json` | Add `@anthropic-ai/sdk` and `marked` dependencies |

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install new packages**

Run:
```bash
npm install @anthropic-ai/sdk marked
npm install -D @types/marked
```

- [ ] **Step 2: Verify installation**

Run: `npm ls @anthropic-ai/sdk marked`
Expected: both packages listed without errors

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @anthropic-ai/sdk and marked dependencies"
```

---

## Task 2: Database Migration

**Files:**
- Create: `supabase/migrations/20260408_incidents.sql`

- [ ] **Step 1: Create migration file**

```sql
-- Incidents table: stores all detected water incidents and their articles
create table if not exists incidents (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  source_hash text unique not null,
  title text not null,
  type text not null check (type in ('boil_notice', 'supply_interruption', 'pollution', 'enforcement', 'pfas_discovery', 'general')),
  severity text not null default 'info' check (severity in ('critical', 'warning', 'info')),
  status text not null default 'active' check (status in ('active', 'resolved')),
  source text not null check (source in ('water_company', 'environment_agency', 'dwi', 'news')),
  source_url text,
  supplier_id text,
  affected_postcodes text[] not null default '{}',
  affected_cities text[] not null default '{}',
  households_affected int,
  summary text not null,
  action_required text,
  article_markdown text not null,
  detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  last_checked timestamptz not null default now(),
  source_data jsonb,
  created_at timestamptz not null default now()
);

-- Index for querying active incidents by postcode (used on every postcode page render)
create index if not exists idx_incidents_active_postcodes
  on incidents using gin (affected_postcodes)
  where status = 'active';

-- Index for querying active incidents by city (used on every city page render)
create index if not exists idx_incidents_active_cities
  on incidents using gin (affected_cities)
  where status = 'active';

-- Index for slug lookups (article pages)
create index if not exists idx_incidents_slug on incidents (slug);

-- Index for news hub listing (ordered by date)
create index if not exists idx_incidents_detected_at on incidents (detected_at desc);

-- Source checks: logs every poll of every source for health monitoring
create table if not exists source_checks (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_name text not null,
  status_code int,
  items_found int not null default 0,
  error text,
  checked_at timestamptz not null default now()
);

-- Index for consecutive failure detection
create index if not exists idx_source_checks_recent
  on source_checks (source, source_name, checked_at desc);

-- Incident logs: audit trail for every state transition
create table if not exists incident_logs (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references incidents(id) on delete cascade,
  action text not null check (action in ('detected', 'updated', 'resolved', 'enriched', 'stale_alert')),
  details jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_incident_logs_incident
  on incident_logs (incident_id, created_at desc);
```

- [ ] **Step 2: Apply migration**

Run the migration against the Supabase project using the MCP tool `mcp__23ab2a12-58f0-4a78-930d-d124e8089d4d__apply_migration` with the SQL above and name `20260408_incidents`.

- [ ] **Step 3: Verify tables exist**

Use `mcp__23ab2a12-58f0-4a78-930d-d124e8089d4d__list_tables` to confirm `incidents`, `source_checks`, and `incident_logs` appear.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260408_incidents.sql
git commit -m "feat: add incidents, source_checks, incident_logs tables"
```

---

## Task 3: TypeScript Types

**Files:**
- Create: `src/lib/incidents-types.ts`

- [ ] **Step 1: Write the types file**

```typescript
export type IncidentType =
  | "boil_notice"
  | "supply_interruption"
  | "pollution"
  | "enforcement"
  | "pfas_discovery"
  | "general";

export type IncidentSeverity = "critical" | "warning" | "info";

export type IncidentStatus = "active" | "resolved";

export type IncidentSource =
  | "water_company"
  | "environment_agency"
  | "dwi"
  | "news";

export interface Incident {
  id: string;
  slug: string;
  source_hash: string;
  title: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  source: IncidentSource;
  source_url: string | null;
  supplier_id: string | null;
  affected_postcodes: string[];
  affected_cities: string[];
  households_affected: number | null;
  summary: string;
  action_required: string | null;
  article_markdown: string;
  detected_at: string;
  resolved_at: string | null;
  last_checked: string;
  source_data: Record<string, unknown> | null;
  created_at: string;
}

/** Raw incident detected by a parser before article generation */
export interface RawIncident {
  source_hash: string;
  type: IncidentType;
  severity: IncidentSeverity;
  source: IncidentSource;
  source_url: string;
  supplier_id: string | null;
  affected_postcodes: string[];
  affected_cities: string[];
  households_affected: number | null;
  action_required: string | null;
  source_data: Record<string, unknown>;
  /** Short description from the source for AI context */
  raw_description: string;
}

/** Generated article content after AI processing */
export interface GeneratedArticle {
  title: string;
  slug: string;
  summary: string;
  article_markdown: string;
}

export interface SourceCheck {
  source: string;
  source_name: string;
  status_code: number | null;
  items_found: number;
  error: string | null;
}

export type IncidentLogAction =
  | "detected"
  | "updated"
  | "resolved"
  | "enriched"
  | "stale_alert";

export const INCIDENT_TYPE_LABELS: Record<IncidentType, string> = {
  boil_notice: "Boil Notice",
  supply_interruption: "Supply Interruption",
  pollution: "Pollution Incident",
  enforcement: "Enforcement Action",
  pfas_discovery: "PFAS Discovery",
  general: "Water Incident",
};

export const SEVERITY_CONFIG: Record<
  IncidentSeverity,
  { label: string; color: string; bgClass: string; textClass: string }
> = {
  critical: {
    label: "Critical",
    color: "#dc2626",
    bgClass: "bg-red-600",
    textClass: "text-red-600",
  },
  warning: {
    label: "Warning",
    color: "#d97706",
    bgClass: "bg-amber-600",
    textClass: "text-amber-600",
  },
  info: {
    label: "Info",
    color: "#2563eb",
    bgClass: "bg-blue-600",
    textClass: "text-blue-600",
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/incidents-types.ts
git commit -m "feat: add incident TypeScript types and constants"
```

---

## Task 4: Data Access Layer

**Files:**
- Create: `src/lib/incidents.ts`
- Test: `src/lib/__tests__/incidents.test.ts`

- [ ] **Step 1: Write failing tests for helper functions**

```typescript
// src/lib/__tests__/incidents.test.ts
import { describe, it, expect } from "vitest";
import { generateSlug, generateSourceHash } from "@/lib/incidents";

describe("generateSlug", () => {
  it("creates a URL-safe slug from incident data", () => {
    const slug = generateSlug("boil_notice", ["SE5", "SE15"], new Date("2026-04-08"));
    expect(slug).toBe("boil-notice-se5-se15-2026-04-08");
  });

  it("limits postcode count in slug to 3", () => {
    const slug = generateSlug("pollution", ["SW1", "SW2", "SW3", "SW4", "SW5"], new Date("2026-04-08"));
    expect(slug).toBe("pollution-sw1-sw2-sw3-2026-04-08");
  });

  it("handles empty postcodes", () => {
    const slug = generateSlug("general", [], new Date("2026-04-08"));
    expect(slug).toBe("general-2026-04-08");
  });
});

describe("generateSourceHash", () => {
  it("produces consistent hashes for same input", () => {
    const a = generateSourceHash("water_company", "boil_notice", ["SE5", "SE15"], "2026-04-08");
    const b = generateSourceHash("water_company", "boil_notice", ["SE15", "SE5"], "2026-04-08");
    expect(a).toBe(b); // sorted postcodes
  });

  it("produces different hashes for different input", () => {
    const a = generateSourceHash("water_company", "boil_notice", ["SE5"], "2026-04-08");
    const b = generateSourceHash("water_company", "pollution", ["SE5"], "2026-04-08");
    expect(a).not.toBe(b);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/__tests__/incidents.test.ts`
Expected: FAIL — `generateSlug` and `generateSourceHash` not found

- [ ] **Step 3: Write the data access layer**

```typescript
// src/lib/incidents.ts
import { getSupabase } from "@/lib/supabase";
import type {
  Incident,
  RawIncident,
  GeneratedArticle,
  SourceCheck,
  IncidentLogAction,
  IncidentType,
  IncidentSource,
} from "@/lib/incidents-types";

// ── Helpers ──

export function generateSlug(
  type: IncidentType,
  postcodes: string[],
  date: Date,
): string {
  const datePart = date.toISOString().split("T")[0];
  const postcodePart = postcodes
    .slice(0, 3)
    .map((p) => p.toLowerCase())
    .join("-");
  const typePart = type.replace(/_/g, "-");
  return postcodePart
    ? `${typePart}-${postcodePart}-${datePart}`
    : `${typePart}-${datePart}`;
}

export function generateSourceHash(
  source: IncidentSource,
  type: IncidentType,
  postcodes: string[],
  dateStr: string,
): string {
  const sorted = [...postcodes].sort().join(",");
  const raw = `${source}|${type}|${sorted}|${dateStr}`;
  // Simple hash — good enough for dedup, no crypto needed
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const chr = raw.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return `${source}-${Math.abs(hash).toString(36)}`;
}

// ── Queries ──

export async function getActiveIncidentsForPostcode(
  district: string,
): Promise<Incident[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("incidents")
    .select("*")
    .eq("status", "active")
    .contains("affected_postcodes", [district.toUpperCase()]);

  if (error) {
    console.error("Failed to fetch incidents for postcode:", error);
    return [];
  }
  return (data ?? []) as Incident[];
}

export async function getActiveIncidentsForCity(
  citySlug: string,
): Promise<Incident[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("incidents")
    .select("*")
    .eq("status", "active")
    .contains("affected_cities", [citySlug]);

  if (error) {
    console.error("Failed to fetch incidents for city:", error);
    return [];
  }
  return (data ?? []) as Incident[];
}

export async function getIncidentBySlug(
  slug: string,
): Promise<Incident | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("incidents")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return data as Incident;
}

export async function getAllIncidents(
  limit = 20,
  offset = 0,
  status?: "active" | "resolved",
): Promise<{ incidents: Incident[]; total: number }> {
  const supabase = getSupabase();
  let query = supabase
    .from("incidents")
    .select("*", { count: "exact" })
    .order("detected_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Failed to fetch incidents:", error);
    return { incidents: [], total: 0 };
  }
  return { incidents: (data ?? []) as Incident[], total: count ?? 0 };
}

export async function getAllIncidentSlugs(): Promise<string[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("incidents")
    .select("slug")
    .order("detected_at", { ascending: false });

  if (error) return [];
  return (data ?? []).map((row: { slug: string }) => row.slug);
}

// ── Mutations ──

export async function upsertIncident(
  raw: RawIncident,
  article: GeneratedArticle,
): Promise<Incident | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("incidents")
    .upsert(
      {
        slug: article.slug,
        source_hash: raw.source_hash,
        title: article.title,
        type: raw.type,
        severity: raw.severity,
        status: "active",
        source: raw.source,
        source_url: raw.source_url,
        supplier_id: raw.supplier_id,
        affected_postcodes: raw.affected_postcodes,
        affected_cities: raw.affected_cities,
        households_affected: raw.households_affected,
        summary: article.summary,
        action_required: raw.action_required,
        article_markdown: article.article_markdown,
        detected_at: new Date().toISOString(),
        last_checked: new Date().toISOString(),
        source_data: raw.source_data,
      },
      { onConflict: "source_hash" },
    )
    .select()
    .single();

  if (error) {
    console.error("Failed to upsert incident:", error);
    return null;
  }
  return data as Incident;
}

export async function resolveIncident(id: string): Promise<boolean> {
  const supabase = getSupabase();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("incidents")
    .update({ status: "resolved", resolved_at: now, last_checked: now })
    .eq("id", id);

  if (error) {
    console.error("Failed to resolve incident:", error);
    return false;
  }
  return true;
}

export async function updateLastChecked(id: string): Promise<void> {
  const supabase = getSupabase();
  await supabase
    .from("incidents")
    .update({ last_checked: new Date().toISOString() })
    .eq("id", id);
}

export async function getStaleActiveIncidents(
  hoursThreshold: number,
): Promise<Incident[]> {
  const supabase = getSupabase();
  const cutoff = new Date(
    Date.now() - hoursThreshold * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await supabase
    .from("incidents")
    .select("*")
    .eq("status", "active")
    .lt("last_checked", cutoff);

  if (error) return [];
  return (data ?? []) as Incident[];
}

// ── Source checks ──

export async function logSourceCheck(check: SourceCheck): Promise<void> {
  const supabase = getSupabase();
  await supabase.from("source_checks").insert({
    source: check.source,
    source_name: check.source_name,
    status_code: check.status_code,
    items_found: check.items_found,
    error: check.error,
  });
}

export async function getConsecutiveFailures(
  source: string,
  sourceName: string,
): Promise<number> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("source_checks")
    .select("error")
    .eq("source", source)
    .eq("source_name", sourceName)
    .order("checked_at", { ascending: false })
    .limit(5);

  if (!data) return 0;
  let count = 0;
  for (const row of data) {
    if (row.error) count++;
    else break;
  }
  return count;
}

// ── Incident logs ──

export async function logIncidentAction(
  incidentId: string,
  action: IncidentLogAction,
  details?: Record<string, unknown>,
): Promise<void> {
  const supabase = getSupabase();
  await supabase.from("incident_logs").insert({
    incident_id: incidentId,
    action,
    details: details ?? null,
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/incidents.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/incidents.ts src/lib/__tests__/incidents.test.ts
git commit -m "feat: add incidents data access layer with slug/hash helpers"
```

---

## Task 5: Postcode Matcher

**Files:**
- Create: `src/lib/incident-parsers/postcode-matcher.ts`
- Test: `src/lib/__tests__/incidents.test.ts` (append)

- [ ] **Step 1: Write failing tests**

Add to `src/lib/__tests__/incidents.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { extractPostcodeDistricts, mapPostcodesToCities } from "@/lib/incident-parsers/postcode-matcher";

describe("extractPostcodeDistricts", () => {
  it("extracts postcode districts from text", () => {
    const result = extractPostcodeDistricts("Affected areas: SE5, SE15 3AB, and SW1A 1AA");
    expect(result).toContain("SE5");
    expect(result).toContain("SE15");
    expect(result).toContain("SW1A");
  });

  it("returns empty array for text with no postcodes", () => {
    const result = extractPostcodeDistricts("No postcodes mentioned here");
    expect(result).toEqual([]);
  });

  it("deduplicates districts", () => {
    const result = extractPostcodeDistricts("SE5 1AB and SE5 2CD are affected");
    expect(result).toEqual(["SE5"]);
  });
});

describe("mapPostcodesToCities", () => {
  it("maps postcode districts to city slugs", () => {
    // SE5 is in London
    const result = mapPostcodesToCities(["SE5", "SE15"]);
    expect(result).toContain("london");
  });

  it("returns empty for unknown postcodes", () => {
    const result = mapPostcodesToCities(["ZZ99"]);
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/__tests__/incidents.test.ts`
Expected: FAIL — modules not found

- [ ] **Step 3: Write the postcode matcher**

```typescript
// src/lib/incident-parsers/postcode-matcher.ts
import { CITIES } from "@/lib/cities";

/**
 * Extract UK postcode districts from free text.
 * Matches patterns like "SE5", "SW1A", "SE15 3AB", etc.
 * Returns deduplicated uppercase district codes.
 */
export function extractPostcodeDistricts(text: string): string[] {
  // UK postcode district pattern: 1-2 letters + 1-2 digits + optional letter
  const postcodeRegex = /\b([A-Z]{1,2}\d{1,2}[A-Z]?)\s*\d?[A-Z]{0,2}\b/gi;
  const matches = text.matchAll(postcodeRegex);
  const districts = new Set<string>();

  for (const match of matches) {
    // Extract just the district part (before the space)
    const district = match[1].toUpperCase();
    districts.add(district);
  }

  return [...districts];
}

/**
 * Map postcode districts to city slugs using the CITIES config.
 * Each city has an admin_district list that maps to postcode areas.
 */
export function mapPostcodesToCities(postcodes: string[]): string[] {
  const citySet = new Set<string>();
  const upperPostcodes = postcodes.map((p) => p.toUpperCase());

  for (const city of CITIES) {
    // Check if any of the city's admin districts match the postcode prefix
    // City admin_districts are council names, not postcodes — we need a different approach
    // Use the city name and region to do a rough mapping via the postcode area prefix
    for (const postcode of upperPostcodes) {
      // Check against city's associated postcode data if available
      // For now, we map via known postcode area → city associations
      const cityPostcodeMatch = CITY_POSTCODE_MAP[city.slug];
      if (cityPostcodeMatch?.some((prefix) => postcode.startsWith(prefix))) {
        citySet.add(city.slug);
      }
    }
  }

  return [...citySet];
}

/**
 * Major city → postcode area prefix mapping.
 * Covers the 51 cities in our CITIES config.
 */
const CITY_POSTCODE_MAP: Record<string, string[]> = {
  london: ["E", "EC", "N", "NW", "SE", "SW", "W", "WC"],
  manchester: ["M"],
  birmingham: ["B"],
  leeds: ["LS"],
  glasgow: ["G"],
  edinburgh: ["EH"],
  bristol: ["BS"],
  liverpool: ["L"],
  sheffield: ["S"],
  newcastle: ["NE"],
  nottingham: ["NG"],
  cardiff: ["CF"],
  brighton: ["BN"],
  oxford: ["OX"],
  cambridge: ["CB"],
  bath: ["BA"],
  york: ["YO"],
  exeter: ["EX"],
  swansea: ["SA"],
  portsmouth: ["PO"],
  leicester: ["LE"],
  coventry: ["CV"],
  derby: ["DE"],
  "stoke-on-trent": ["ST"],
  wolverhampton: ["WV"],
  plymouth: ["PL"],
  southampton: ["SO"],
  sunderland: ["SR"],
  aberdeen: ["AB"],
  dundee: ["DD"],
  norwich: ["NR"],
  reading: ["RG"],
  ipswich: ["IP"],
  peterborough: ["PE"],
  chester: ["CH"],
  worcester: ["WR"],
  gloucester: ["GL"],
  lincoln: ["LN"],
  canterbury: ["CT"],
  carlisle: ["CA"],
  inverness: ["IV"],
  hull: ["HU"],
  middlesbrough: ["TS"],
  blackpool: ["FY"],
  preston: ["PR"],
  bolton: ["BL"],
  wigan: ["WN"],
  warrington: ["WA"],
  bradford: ["BD"],
  huddersfield: ["HD"],
  wakefield: ["WF"],
};

/**
 * Validate postcodes against known districts. Returns only those that
 * exist in our data. Requires async Supabase query — call sparingly.
 */
export async function validatePostcodes(
  postcodes: string[],
): Promise<string[]> {
  // Dynamic import to avoid circular deps at module level
  const { getAllPostcodeDistricts } = await import("@/lib/data");
  const known = new Set(await getAllPostcodeDistricts());
  return postcodes.filter((p) => known.has(p.toUpperCase()));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/incidents.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/incident-parsers/postcode-matcher.ts src/lib/__tests__/incidents.test.ts
git commit -m "feat: add postcode matcher for incident location mapping"
```

---

## Task 6: Source Parsers

**Files:**
- Create: `src/lib/incident-parsers/water-companies.ts`
- Create: `src/lib/incident-parsers/environment-agency.ts`
- Create: `src/lib/incident-parsers/index.ts`

- [ ] **Step 1: Write the water company parser**

```typescript
// src/lib/incident-parsers/water-companies.ts
import type { RawIncident, IncidentType, IncidentSeverity } from "@/lib/incidents-types";
import { extractPostcodeDistricts, mapPostcodesToCities } from "./postcode-matcher";

interface WaterCompanyFeed {
  supplierId: string;
  name: string;
  feedUrl: string;
}

/** Water companies with known incident/status feeds */
const FEEDS: WaterCompanyFeed[] = [
  { supplierId: "thames-water", name: "Thames Water", feedUrl: "https://www.thameswater.co.uk/api/incidents" },
  { supplierId: "united-utilities", name: "United Utilities", feedUrl: "https://www.unitedutilities.com/api/incidents" },
  { supplierId: "severn-trent", name: "Severn Trent", feedUrl: "https://www.stwater.co.uk/api/incidents" },
  { supplierId: "yorkshire-water", name: "Yorkshire Water", feedUrl: "https://www.yorkshirewater.com/api/incidents" },
  { supplierId: "anglian-water", name: "Anglian Water", feedUrl: "https://www.anglianwater.co.uk/api/incidents" },
  { supplierId: "southern-water", name: "Southern Water", feedUrl: "https://www.southernwater.co.uk/api/incidents" },
  { supplierId: "south-west-water", name: "South West Water", feedUrl: "https://www.southwestwater.co.uk/api/incidents" },
  { supplierId: "welsh-water", name: "Welsh Water", feedUrl: "https://www.dwrcymru.com/api/incidents" },
  { supplierId: "northumbrian-water", name: "Northumbrian Water", feedUrl: "https://www.nwl.co.uk/api/incidents" },
  { supplierId: "scottish-water", name: "Scottish Water", feedUrl: "https://www.scottishwater.co.uk/api/incidents" },
];

function classifyIncident(title: string, description: string): { type: IncidentType; severity: IncidentSeverity } {
  const text = `${title} ${description}`.toLowerCase();

  if (text.includes("boil") && (text.includes("notice") || text.includes("advisory"))) {
    return { type: "boil_notice", severity: "critical" };
  }
  if (text.includes("do not use") || text.includes("do not drink")) {
    return { type: "boil_notice", severity: "critical" };
  }
  if (text.includes("pollution") || text.includes("contamination") || text.includes("sewage")) {
    return { type: "pollution", severity: "warning" };
  }
  if (text.includes("pfas") || text.includes("forever chemical")) {
    return { type: "pfas_discovery", severity: "warning" };
  }
  if (text.includes("no water") || text.includes("supply interrupt") || text.includes("low pressure")) {
    return { type: "supply_interruption", severity: "info" };
  }
  return { type: "general", severity: "info" };
}

function extractActionRequired(title: string, description: string): string | null {
  const text = `${title} ${description}`.toLowerCase();

  if (text.includes("boil")) {
    return "Boil all tap water before drinking, cooking, or brushing teeth until further notice.";
  }
  if (text.includes("do not use") || text.includes("do not drink")) {
    return "Do not use tap water for drinking or cooking until further notice.";
  }
  if (text.includes("no water") || text.includes("supply interrupt")) {
    return "Water supply may be interrupted. Consider storing water for essential use.";
  }
  return null;
}

export interface SourceCheckResult {
  source: string;
  sourceName: string;
  statusCode: number | null;
  itemsFound: number;
  error: string | null;
}

export async function parseWaterCompanyFeeds(): Promise<{
  incidents: RawIncident[];
  checks: SourceCheckResult[];
}> {
  const allIncidents: RawIncident[] = [];
  const checks: SourceCheckResult[] = [];

  for (const feed of FEEDS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(feed.feedUrl, {
        signal: controller.signal,
        headers: { "User-Agent": "TapWater.uk Incident Monitor/1.0" },
      });
      clearTimeout(timeout);

      if (!response.ok) {
        checks.push({
          source: "water_company",
          sourceName: feed.name,
          statusCode: response.status,
          itemsFound: 0,
          error: `HTTP ${response.status}`,
        });
        continue;
      }

      // Try to parse as JSON — most water company APIs return JSON
      // Fall back to XML/RSS parsing if needed
      const contentType = response.headers.get("content-type") ?? "";
      let items: Array<{ title: string; description: string; link: string; postcodes?: string[] }> = [];

      if (contentType.includes("json")) {
        const json = await response.json();
        // Normalize — different companies structure differently
        items = normalizeJsonFeed(json, feed.supplierId);
      } else {
        // Parse as RSS/XML
        const text = await response.text();
        items = parseRssFeed(text);
      }

      checks.push({
        source: "water_company",
        sourceName: feed.name,
        statusCode: response.status,
        itemsFound: items.length,
        error: null,
      });

      for (const item of items) {
        const fullText = `${item.title} ${item.description}`;
        const postcodes = item.postcodes ?? extractPostcodeDistricts(fullText);
        const cities = mapPostcodesToCities(postcodes);
        const { type, severity } = classifyIncident(item.title, item.description);
        const dateStr = new Date().toISOString().split("T")[0];

        allIncidents.push({
          source_hash: `wc-${feed.supplierId}-${type}-${postcodes.sort().join(",")}-${dateStr}`,
          type,
          severity,
          source: "water_company",
          source_url: item.link || feed.feedUrl,
          supplier_id: feed.supplierId,
          affected_postcodes: postcodes,
          affected_cities: cities,
          households_affected: null,
          action_required: extractActionRequired(item.title, item.description),
          source_data: { feed: feed.name, item },
          raw_description: `${item.title}. ${item.description}`,
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      checks.push({
        source: "water_company",
        sourceName: feed.name,
        statusCode: null,
        itemsFound: 0,
        error: errorMsg,
      });
    }
  }

  return { incidents: allIncidents, checks };
}

/** Normalize JSON response — adapter per company. Extensible. */
function normalizeJsonFeed(
  json: unknown,
  _supplierId: string,
): Array<{ title: string; description: string; link: string; postcodes?: string[] }> {
  // Generic handler: look for common shapes
  if (Array.isArray(json)) {
    return json
      .filter((item) => item && typeof item === "object")
      .map((item) => ({
        title: item.title ?? item.name ?? item.headline ?? "",
        description: item.description ?? item.summary ?? item.body ?? "",
        link: item.link ?? item.url ?? "",
        postcodes: Array.isArray(item.postcodes) ? item.postcodes : undefined,
      }))
      .filter((item) => item.title || item.description);
  }

  // Wrapped in a data/items/results key
  const obj = json as Record<string, unknown>;
  const items = obj.data ?? obj.items ?? obj.results ?? obj.incidents;
  if (Array.isArray(items)) {
    return normalizeJsonFeed(items, _supplierId);
  }

  return [];
}

/** Parse RSS/XML feed into items. Simple regex-based — no XML lib needed. */
function parseRssFeed(
  xml: string,
): Array<{ title: string; description: string; link: string }> {
  const items: Array<{ title: string; description: string; link: string }> = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1];
    const title = content.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i)?.[1] ?? "";
    const description = content.match(/<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/is)?.[1] ?? "";
    const link = content.match(/<link>(.*?)<\/link>/i)?.[1] ?? "";

    if (title || description) {
      items.push({ title: title.trim(), description: description.trim(), link: link.trim() });
    }
  }

  return items;
}

/** Check if a water company feed is still reporting a specific incident */
export async function isIncidentStillActive(
  feedUrl: string,
  sourceData: Record<string, unknown>,
): Promise<{ reachable: boolean; stillActive: boolean }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(feedUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "TapWater.uk Incident Monitor/1.0" },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return { reachable: false, stillActive: true };
    }

    const contentType = response.headers.get("content-type") ?? "";
    let feedText = "";

    if (contentType.includes("json")) {
      feedText = JSON.stringify(await response.json());
    } else {
      feedText = await response.text();
    }

    // Check if the original incident title/description still appears in the feed
    const item = sourceData.item as Record<string, string> | undefined;
    if (item?.title) {
      return { reachable: true, stillActive: feedText.includes(item.title) };
    }

    return { reachable: true, stillActive: false };
  } catch {
    return { reachable: false, stillActive: true };
  }
}
```

- [ ] **Step 2: Write the EA parser**

```typescript
// src/lib/incident-parsers/environment-agency.ts
import type { RawIncident } from "@/lib/incidents-types";
import { extractPostcodeDistricts, mapPostcodesToCities } from "./postcode-matcher";
import type { SourceCheckResult } from "./water-companies";

const EA_INCIDENTS_URL = "https://environment.data.gov.uk/flood-monitoring/id/floods";

interface EAFloodItem {
  floodAreaID: string;
  description: string;
  eaAreaName: string;
  county: string;
  severity: string;           // "Severe Flood Warning" | "Flood Warning" | "Flood Alert" | "Warning no longer in force"
  severityLevel: number;      // 1 (severe) to 4 (no longer in force)
  message: string;
  timeMessageChanged: string;
  timeRaised: string;
  timeSeverityChanged: string;
}

export async function parseEAIncidents(): Promise<{
  incidents: RawIncident[];
  checks: SourceCheckResult[];
}> {
  const checks: SourceCheckResult[] = [];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(EA_INCIDENTS_URL, {
      signal: controller.signal,
      headers: { "User-Agent": "TapWater.uk Incident Monitor/1.0" },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      checks.push({
        source: "environment_agency",
        sourceName: "EA Flood Monitoring",
        statusCode: response.status,
        itemsFound: 0,
        error: `HTTP ${response.status}`,
      });
      return { incidents: [], checks };
    }

    const json = await response.json();
    const items: EAFloodItem[] = json.items ?? [];

    // Filter to water-quality-relevant incidents only
    // Severity 1-2 are active warnings, 3 is alerts, 4 is resolved
    const activeItems = items.filter(
      (item) => item.severityLevel <= 3 && isWaterQualityRelevant(item),
    );

    checks.push({
      source: "environment_agency",
      sourceName: "EA Flood Monitoring",
      statusCode: response.status,
      itemsFound: activeItems.length,
      error: null,
    });

    const incidents: RawIncident[] = activeItems.map((item) => {
      const postcodes = extractEAPostcodes(item);
      const cities = mapPostcodesToCities(postcodes);
      const dateStr = new Date(item.timeRaised || item.timeMessageChanged).toISOString().split("T")[0];

      return {
        source_hash: `ea-${item.floodAreaID}-${dateStr}`,
        type: "pollution" as const,
        severity: item.severityLevel <= 1 ? "critical" as const : "warning" as const,
        source: "environment_agency" as const,
        source_url: `https://check-for-flooding.service.gov.uk/target-area/${item.floodAreaID}`,
        supplier_id: null,
        affected_postcodes: postcodes,
        affected_cities: cities,
        households_affected: null,
        action_required: item.severityLevel <= 1
          ? "Severe flood warning in effect. Avoid contact with flood water — it may contain sewage and chemicals."
          : "Flood warning in effect. Be aware that flood water may affect local water quality.",
        source_data: item as unknown as Record<string, unknown>,
        raw_description: `${item.description}. ${item.message}`,
      };
    });

    return { incidents, checks };
  } catch (err) {
    checks.push({
      source: "environment_agency",
      sourceName: "EA Flood Monitoring",
      statusCode: null,
      itemsFound: 0,
      error: err instanceof Error ? err.message : "Unknown error",
    });
    return { incidents: [], checks };
  }
}

function isWaterQualityRelevant(item: EAFloodItem): boolean {
  const text = `${item.description} ${item.message}`.toLowerCase();
  return (
    text.includes("water quality") ||
    text.includes("sewage") ||
    text.includes("contamination") ||
    text.includes("drinking water") ||
    text.includes("pollution") ||
    text.includes("boil")
  );
}

function extractEAPostcodes(item: EAFloodItem): string[] {
  // EA items have location text but not postcodes directly.
  // Extract from description/message.
  const text = `${item.description} ${item.message} ${item.county} ${item.eaAreaName}`;
  return extractPostcodeDistricts(text);
}

/** Check if an EA incident is still active */
export async function isEAIncidentStillActive(
  floodAreaID: string,
): Promise<{ reachable: boolean; stillActive: boolean }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(
      `https://environment.data.gov.uk/flood-monitoring/id/floods?floodAreaID=${floodAreaID}`,
      { signal: controller.signal },
    );
    clearTimeout(timeout);

    if (!response.ok) {
      return { reachable: false, stillActive: true };
    }

    const json = await response.json();
    const items = json.items ?? [];

    // If the flood area still has active items with severityLevel <= 3, it's active
    const active = items.some(
      (item: EAFloodItem) => item.severityLevel <= 3,
    );

    return { reachable: true, stillActive: active };
  } catch {
    return { reachable: false, stillActive: true };
  }
}
```

- [ ] **Step 3: Write the parser orchestrator**

```typescript
// src/lib/incident-parsers/index.ts
import type { RawIncident } from "@/lib/incidents-types";
import { parseWaterCompanyFeeds } from "./water-companies";
import { parseEAIncidents } from "./environment-agency";
import { logSourceCheck, getConsecutiveFailures } from "@/lib/incidents";
import type { SourceCheckResult } from "./water-companies";

const MAX_BLAST_RADIUS = 200;

export interface ParseResult {
  incidents: RawIncident[];
  errors: string[];
}

export async function pollAllSources(): Promise<ParseResult> {
  const allIncidents: RawIncident[] = [];
  const errors: string[] = [];

  // Run all source parsers in parallel — each is isolated
  const [waterCompanyResult, eaResult] = await Promise.allSettled([
    parseWaterCompanyFeeds(),
    parseEAIncidents(),
  ]);

  // Process water company results
  if (waterCompanyResult.status === "fulfilled") {
    const { incidents, checks } = waterCompanyResult.value;
    allIncidents.push(...incidents);
    await logAllChecks(checks);

    // Alert on consecutive failures
    for (const check of checks) {
      if (check.error) {
        const failures = await getConsecutiveFailures(check.source, check.sourceName);
        if (failures >= 3) {
          errors.push(`${check.sourceName} has failed ${failures} consecutive checks`);
        }
      }
    }
  } else {
    errors.push(`Water company parser crashed: ${waterCompanyResult.reason}`);
  }

  // Process EA results
  if (eaResult.status === "fulfilled") {
    const { incidents, checks } = eaResult.value;
    allIncidents.push(...incidents);
    await logAllChecks(checks);
  } else {
    errors.push(`EA parser crashed: ${eaResult.reason}`);
  }

  // Filter out incidents that exceed max blast radius
  const safeIncidents = allIncidents.filter((incident) => {
    if (incident.affected_postcodes.length > MAX_BLAST_RADIUS) {
      errors.push(
        `Incident from ${incident.source} affects ${incident.affected_postcodes.length} postcodes (>${MAX_BLAST_RADIUS}). Held for review.`,
      );
      return false;
    }
    return true;
  });

  return { incidents: safeIncidents, errors };
}

async function logAllChecks(checks: SourceCheckResult[]): Promise<void> {
  for (const check of checks) {
    await logSourceCheck({
      source: check.source,
      source_name: check.sourceName,
      status_code: check.statusCode,
      items_found: check.itemsFound,
      error: check.error,
    });
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/incident-parsers/
git commit -m "feat: add water company and EA incident source parsers"
```

---

## Task 7: AI Article Generator

**Files:**
- Create: `src/lib/incident-article.ts`
- Test: `src/lib/__tests__/incident-article.test.ts`

- [ ] **Step 1: Write failing tests for validation**

```typescript
// src/lib/__tests__/incident-article.test.ts
import { describe, it, expect } from "vitest";
import { validateArticle, generateFallbackArticle } from "@/lib/incident-article";

describe("validateArticle", () => {
  it("accepts valid article", () => {
    const result = validateArticle({
      title: "Boil Notice: South London",
      summary: "Thames Water has issued a boil notice for SE5 and SE15.",
      article_markdown: "Thames Water has issued a precautionary boil notice. ".repeat(10),
    });
    expect(result.valid).toBe(true);
  });

  it("rejects title over 80 chars", () => {
    const result = validateArticle({
      title: "A".repeat(81),
      summary: "Short summary",
      article_markdown: "Content. ".repeat(30),
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("title");
  });

  it("rejects summary over 200 chars", () => {
    const result = validateArticle({
      title: "Valid Title",
      summary: "A".repeat(201),
      article_markdown: "Content. ".repeat(30),
    });
    expect(result.valid).toBe(false);
  });

  it("rejects article under 200 words", () => {
    const result = validateArticle({
      title: "Valid Title",
      summary: "Valid summary",
      article_markdown: "Too short.",
    });
    expect(result.valid).toBe(false);
  });
});

describe("generateFallbackArticle", () => {
  it("generates structured article from raw data", () => {
    const result = generateFallbackArticle({
      type: "boil_notice",
      source: "water_company",
      source_url: "https://example.com",
      affected_postcodes: ["SE5", "SE15"],
      affected_cities: ["london"],
      action_required: "Boil all water before drinking.",
      raw_description: "Thames Water has issued a boil notice.",
      supplier_id: "thames-water",
      source_hash: "test",
      severity: "critical",
      households_affected: 45000,
      source_data: {},
    });
    expect(result.title.length).toBeLessThanOrEqual(80);
    expect(result.summary.length).toBeLessThanOrEqual(200);
    expect(result.article_markdown).toContain("SE5");
    expect(result.article_markdown).toContain("Boil all water");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/__tests__/incident-article.test.ts`
Expected: FAIL

- [ ] **Step 3: Write the article generator**

```typescript
// src/lib/incident-article.ts
import Anthropic from "@anthropic-ai/sdk";
import type { RawIncident, GeneratedArticle } from "@/lib/incidents-types";
import { INCIDENT_TYPE_LABELS } from "@/lib/incidents-types";
import { generateSlug } from "@/lib/incidents";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const SYSTEM_PROMPT = `You are a water quality reporter for TapWater.uk, a trusted independent UK water data site.

Write factual, plain-language articles about water incidents. Your audience is normal people, not scientists.

Rules:
- Write in British English
- No jargon — say "forever chemicals" not "PFAS compounds"
- No speculation or editorialising — only report what the source data says
- Always attribute the source
- Include practical advice (what to do)
- No emojis, no exclamation marks
- Keep tone calm and informative, not alarmist

Output ONLY valid JSON with these fields:
{
  "title": "string — under 80 characters, newspaper-style headline",
  "summary": "string — under 200 characters, one-sentence plain summary",
  "article_markdown": "string — 200-800 words, markdown formatted article body"
}`;

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

const BLOCKLIST = [
  "fuck", "shit", "damn", "crap", "bastard", "ass",
];

export function validateArticle(article: {
  title: string;
  summary: string;
  article_markdown: string;
}): ValidationResult {
  if (article.title.length > 80) {
    return { valid: false, reason: `title too long: ${article.title.length} chars (max 80)` };
  }
  if (article.summary.length > 200) {
    return { valid: false, reason: `summary too long: ${article.summary.length} chars (max 200)` };
  }

  const wordCount = article.article_markdown.split(/\s+/).length;
  if (wordCount < 200) {
    return { valid: false, reason: `article too short: ${wordCount} words (min 200)` };
  }
  if (wordCount > 800) {
    return { valid: false, reason: `article too long: ${wordCount} words (max 800)` };
  }

  const lowerAll = `${article.title} ${article.summary} ${article.article_markdown}`.toLowerCase();
  for (const word of BLOCKLIST) {
    if (lowerAll.includes(word)) {
      return { valid: false, reason: `content contains blocked word: ${word}` };
    }
  }

  return { valid: true };
}

export function generateFallbackArticle(raw: RawIncident): GeneratedArticle {
  const typeLabel = INCIDENT_TYPE_LABELS[raw.type];
  const postcodeList = raw.affected_postcodes.slice(0, 10).join(", ");
  const date = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const title =
    `${typeLabel}: ${postcodeList || "UK Area"}`.slice(0, 80);

  const summary =
    `${raw.raw_description}`.slice(0, 200);

  const postcodeLinks = raw.affected_postcodes
    .slice(0, 20)
    .map((p) => `- [${p}](/postcode/${p})`)
    .join("\n");

  const article_markdown = `${raw.raw_description}

## What to do

${raw.action_required ?? "Follow advice from your water company and local authorities."}

## Affected areas

${postcodeLinks || "Specific postcodes not yet confirmed."}

${raw.households_affected ? `Approximately ${raw.households_affected.toLocaleString()} households may be affected.` : ""}

## Source

[${raw.source === "water_company" ? "Water company notice" : "Environment Agency"}](${raw.source_url}) — reported ${date}.

*This article was automatically generated from official incident data. For the latest information, check your water company's website.*`;

  return {
    title,
    slug: generateSlug(raw.type, raw.affected_postcodes, new Date()),
    summary,
    article_markdown,
  };
}

export async function generateArticle(
  raw: RawIncident,
): Promise<GeneratedArticle> {
  // If no API key, use fallback immediately
  if (!ANTHROPIC_API_KEY) {
    console.warn("No ANTHROPIC_API_KEY — using fallback article template");
    return generateFallbackArticle(raw);
  }

  try {
    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    const userPrompt = `Write a news article about this water incident:

Type: ${INCIDENT_TYPE_LABELS[raw.type]}
Severity: ${raw.severity}
Source: ${raw.source === "water_company" ? raw.supplier_id : "Environment Agency"}
Source URL: ${raw.source_url}
Affected postcodes: ${raw.affected_postcodes.join(", ") || "Not specified"}
Affected cities: ${raw.affected_cities.join(", ") || "Not specified"}
Households affected: ${raw.households_affected ?? "Unknown"}
Action required: ${raw.action_required ?? "None specified"}

Source description:
${raw.raw_description}

Raw source data:
${JSON.stringify(raw.source_data, null, 2).slice(0, 2000)}`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("AI response not valid JSON, using fallback");
      return generateFallbackArticle(raw);
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.title || !parsed.summary || !parsed.article_markdown) {
      console.error("AI response missing required fields, using fallback");
      return generateFallbackArticle(raw);
    }

    const validation = validateArticle(parsed);
    if (!validation.valid) {
      console.error(`AI article failed validation: ${validation.reason}, using fallback`);
      return generateFallbackArticle(raw);
    }

    return {
      title: parsed.title,
      slug: generateSlug(raw.type, raw.affected_postcodes, new Date()),
      summary: parsed.summary,
      article_markdown: parsed.article_markdown,
    };
  } catch (err) {
    console.error("AI article generation failed:", err);
    return generateFallbackArticle(raw);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/incident-article.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/incident-article.ts src/lib/__tests__/incident-article.test.ts
git commit -m "feat: add AI article generator with validation and fallback"
```

---

## Task 8: Cron Endpoint

**Files:**
- Create: `src/app/api/cron/incidents/route.ts`
- Modify: `vercel.json`

- [ ] **Step 1: Write the cron route**

```typescript
// src/app/api/cron/incidents/route.ts
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { pollAllSources } from "@/lib/incident-parsers";
import { generateArticle } from "@/lib/incident-article";
import {
  upsertIncident,
  resolveIncident,
  updateLastChecked,
  getStaleActiveIncidents,
  logIncidentAction,
  getAllIncidents,
  getIncidentBySlug,
} from "@/lib/incidents";
import { generateSourceHash } from "@/lib/incidents";
import { isIncidentStillActive } from "@/lib/incident-parsers/water-companies";
import { isEAIncidentStillActive } from "@/lib/incident-parsers/environment-agency";
import { getSupabase } from "@/lib/supabase";

export const maxDuration = 300;

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "remy@tapwater.uk";
const STALE_HOURS = 48;
const AUTO_RESOLVE_HOURS = 168; // 7 days

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || cronSecret.length < 24) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const log: string[] = [];
  const revalidatedPaths = new Set<string>();

  try {
    // ── Stage 1: Poll all sources ──
    log.push("Polling sources...");
    const { incidents: rawIncidents, errors: parseErrors } = await pollAllSources();
    log.push(`Found ${rawIncidents.length} raw incidents from sources`);
    if (parseErrors.length > 0) {
      log.push(`Parse errors: ${parseErrors.join("; ")}`);
    }

    // ── Stage 2: Process new incidents ──
    let newCount = 0;
    for (const raw of rawIncidents) {
      // Check if this incident already exists (dedup via source_hash)
      const supabase = getSupabase();
      const { data: existing } = await supabase
        .from("incidents")
        .select("id, status")
        .eq("source_hash", raw.source_hash)
        .single();

      if (existing) {
        // Already known — just update last_checked
        await updateLastChecked(existing.id);
        continue;
      }

      // New incident — generate article
      log.push(`New incident: ${raw.type} from ${raw.source}`);
      const article = await generateArticle(raw);

      const incident = await upsertIncident(raw, article);
      if (incident) {
        await logIncidentAction(incident.id, "detected", {
          source: raw.source,
          postcodes: raw.affected_postcodes,
        });
        newCount++;

        // Revalidate affected pages
        for (const postcode of raw.affected_postcodes.slice(0, 50)) {
          const path = `/postcode/${postcode}`;
          if (!revalidatedPaths.has(path)) {
            revalidatePath(path);
            revalidatedPaths.add(path);
          }
        }
        for (const city of raw.affected_cities) {
          const path = `/city/${city}`;
          if (!revalidatedPaths.has(path)) {
            revalidatePath(path);
            revalidatedPaths.add(path);
          }
        }
        revalidatePath("/news");
      }
    }
    log.push(`${newCount} new incidents created`);

    // ── Stage 3: Check active incidents for resolution ──
    const { incidents: activeIncidents } = await getAllIncidents(100, 0, "active");
    let resolvedCount = 0;

    for (const incident of activeIncidents) {
      let checkResult: { reachable: boolean; stillActive: boolean };

      if (incident.source === "environment_agency") {
        const floodAreaID = (incident.source_data as Record<string, string>)?.floodAreaID;
        if (floodAreaID) {
          checkResult = await isEAIncidentStillActive(floodAreaID);
        } else {
          checkResult = { reachable: false, stillActive: true };
        }
      } else {
        // Water company — re-check the feed URL
        const feedUrl = incident.source_url ?? "";
        checkResult = await isIncidentStillActive(feedUrl, incident.source_data ?? {});
      }

      if (checkResult.reachable && !checkResult.stillActive) {
        // Source is reachable and incident is gone → resolve
        await resolveIncident(incident.id);
        await logIncidentAction(incident.id, "resolved", { reason: "source_cleared" });
        resolvedCount++;

        // Revalidate affected pages to remove banners
        for (const postcode of incident.affected_postcodes.slice(0, 50)) {
          revalidatePath(`/postcode/${postcode}`);
        }
        for (const city of incident.affected_cities) {
          revalidatePath(`/city/${city}`);
        }
        revalidatePath("/news");
        revalidatePath(`/news/${incident.slug}`);
      } else if (checkResult.reachable) {
        // Still active — update last_checked
        await updateLastChecked(incident.id);
      }
      // If not reachable, do nothing (keep current state)
    }
    log.push(`${resolvedCount} incidents resolved`);

    // ── Stage 4: Handle stale incidents ──
    const staleIncidents = await getStaleActiveIncidents(STALE_HOURS);
    if (staleIncidents.length > 0) {
      log.push(`${staleIncidents.length} stale incidents (>${STALE_HOURS}h)`);

      const resend = new Resend(process.env.RESEND_API_KEY);
      for (const incident of staleIncidents) {
        // Check if we already sent a stale alert for this incident
        const supabase = getSupabase();
        const { data: existingAlert } = await supabase
          .from("incident_logs")
          .select("id")
          .eq("incident_id", incident.id)
          .eq("action", "stale_alert")
          .limit(1);

        if (!existingAlert || existingAlert.length === 0) {
          // Send admin email
          await resend.emails.send({
            from: "TapWater.uk <alerts@tapwater.uk>",
            to: [ADMIN_EMAIL],
            subject: `Stale incident: ${incident.title}`,
            text: `Incident "${incident.title}" has been active for ${STALE_HOURS}+ hours with no source updates.\n\nSlug: ${incident.slug}\nSource: ${incident.source_url}\nAffected: ${incident.affected_postcodes.join(", ")}\n\nCheck manually: https://www.tapwater.uk/news/${incident.slug}`,
          });
          await logIncidentAction(incident.id, "stale_alert", {
            hours: STALE_HOURS,
          });
          log.push(`Stale alert sent for: ${incident.title}`);
        }
      }

      // Auto-resolve incidents older than 7 days
      const autoResolve = await getStaleActiveIncidents(AUTO_RESOLVE_HOURS);
      for (const incident of autoResolve) {
        await resolveIncident(incident.id);
        await logIncidentAction(incident.id, "resolved", {
          reason: "auto_resolved_stale",
          hours: AUTO_RESOLVE_HOURS,
        });
        log.push(`Auto-resolved stale incident: ${incident.slug}`);

        for (const postcode of incident.affected_postcodes.slice(0, 50)) {
          revalidatePath(`/postcode/${postcode}`);
        }
        for (const city of incident.affected_cities) {
          revalidatePath(`/city/${city}`);
        }
        revalidatePath("/news");
      }
    }

    // ── Send alert email for consecutive source failures ──
    if (parseErrors.length > 0) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "TapWater.uk <alerts@tapwater.uk>",
          to: [ADMIN_EMAIL],
          subject: "Incident source monitoring errors",
          text: `The following errors occurred during incident polling:\n\n${parseErrors.join("\n")}`,
        });
      } catch (emailErr) {
        log.push(`Failed to send error alert email: ${emailErr}`);
      }
    }

    return NextResponse.json({
      success: true,
      newIncidents: newCount,
      resolvedIncidents: resolvedCount,
      staleIncidents: staleIncidents?.length ?? 0,
      revalidatedPaths: revalidatedPaths.size,
      errors: parseErrors,
      log,
    });
  } catch (err) {
    console.error("Incident cron failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error", log },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Add cron to vercel.json**

Add to the `crons` array in `vercel.json`:

```json
{
  "path": "/api/cron/incidents",
  "schedule": "*/15 * * * *"
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/cron/incidents/route.ts vercel.json
git commit -m "feat: add incidents cron — polls sources, generates articles, resolves stale"
```

---

## Task 9: Alert Banner Component

**Files:**
- Create: `src/components/incident-alert.tsx`

- [ ] **Step 1: Write the alert banner component**

```tsx
// src/components/incident-alert.tsx
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import type { Incident } from "@/lib/incidents-types";
import { INCIDENT_TYPE_LABELS, SEVERITY_CONFIG } from "@/lib/incidents-types";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function IncidentAlert({ incident }: { incident: Incident }) {
  const config = SEVERITY_CONFIG[incident.severity];

  return (
    <div
      className="rounded-lg border p-4 mb-6"
      style={{
        backgroundColor: "color-mix(in srgb, var(--color-surface) 85%, #dc2626)",
        borderColor: "color-mix(in srgb, var(--color-rule) 60%, #dc2626)",
      }}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div
          className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: config.color }}
        >
          <AlertTriangle className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold" style={{ color: config.color }}>
              Active {INCIDENT_TYPE_LABELS[incident.type]}
            </span>
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded text-white"
              style={{ backgroundColor: config.color }}
            >
              Live
            </span>
          </div>
          <p className="text-sm text-body mt-1 line-clamp-2">
            {incident.action_required ?? incident.summary}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <Link
              href={`/news/${incident.slug}`}
              className="text-xs font-semibold text-accent hover:underline"
            >
              Full details &rarr;
            </Link>
            <span className="text-xs text-faint">
              Updated {timeAgo(incident.last_checked)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function IncidentAlerts({ incidents }: { incidents: Incident[] }) {
  if (incidents.length === 0) return null;
  return (
    <>
      {incidents.map((incident) => (
        <IncidentAlert key={incident.id} incident={incident} />
      ))}
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/incident-alert.tsx
git commit -m "feat: add incident alert banner component"
```

---

## Task 10: NewsArticle JSON-LD Schema

**Files:**
- Modify: `src/components/json-ld.tsx`

- [ ] **Step 1: Add NewsArticleSchema component**

Add to the bottom of `src/components/json-ld.tsx`:

```typescript
export function NewsArticleSchema({
  headline,
  description,
  url,
  datePublished,
  dateModified,
}: {
  headline: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline,
    description,
    url,
    datePublished,
    dateModified,
    author: {
      "@type": "Organization",
      name: "TapWater.uk",
      url: "https://www.tapwater.uk",
    },
    publisher: {
      "@type": "Organization",
      name: "TapWater.uk",
      url: "https://www.tapwater.uk",
      logo: {
        "@type": "ImageObject",
        url: "https://www.tapwater.uk/icon.png",
        width: 512,
        height: 512,
      },
    },
    mainEntityOfPage: url,
    isAccessibleForFree: true,
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/json-ld.tsx
git commit -m "feat: add NewsArticle JSON-LD schema component"
```

---

## Task 11: News Hub Page

**Files:**
- Create: `src/app/news/page.tsx`

- [ ] **Step 1: Write the news hub page**

```tsx
// src/app/news/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BreadcrumbSchema } from "@/components/json-ld";
import { getAllIncidents } from "@/lib/incidents";
import { INCIDENT_TYPE_LABELS, SEVERITY_CONFIG } from "@/lib/incidents-types";

export const revalidate = 300; // 5 min — news changes frequently

export const metadata: Metadata = {
  title: "UK Water Incident News",
  description:
    "Live water quality incidents, boil notices, and pollution alerts across the UK. Automated monitoring of water company feeds and Environment Agency data.",
  openGraph: {
    title: "UK Water Incident News | TapWater.uk",
    description: "Live water quality incidents and alerts across the UK.",
    url: "https://www.tapwater.uk/news",
    type: "website",
  },
  other: {
    "robots": "max-image-preview:large",
  },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default async function NewsPage() {
  const { incidents } = await getAllIncidents(50);

  const active = incidents.filter((i) => i.status === "active");
  const resolved = incidents.filter((i) => i.status === "resolved");

  return (
    <div className="bg-hero min-h-screen">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8 py-8 lg:py-14">
        <BreadcrumbSchema
          items={[
            { name: "Home", url: "https://www.tapwater.uk" },
            { name: "News", url: "https://www.tapwater.uk/news" },
          ]}
        />

        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-sm text-faint"
        >
          <Link href="/" className="hover:text-accent transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-ink font-medium">News</span>
        </nav>

        <header className="mt-6 mb-10">
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-ink tracking-tight">
            Water Incident News
          </h1>
          <p className="text-muted mt-2 max-w-2xl">
            Live monitoring of water quality incidents across the UK. Boil
            notices, pollution alerts, supply interruptions, and enforcement
            actions.
          </p>
        </header>

        {/* Active incidents — pinned */}
        {active.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xs uppercase tracking-[0.15em] text-[var(--color-danger)] font-semibold mb-4">
              Active incidents ({active.length})
            </h2>
            <div className="grid gap-4">
              {active.map((incident) => {
                const config = SEVERITY_CONFIG[incident.severity];
                return (
                  <Link
                    key={incident.id}
                    href={`/news/${incident.slug}`}
                    className="card p-5 hover:shadow-md transition-shadow border-l-4"
                    style={{ borderLeftColor: config.color }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded text-white"
                            style={{ backgroundColor: config.color }}
                          >
                            {INCIDENT_TYPE_LABELS[incident.type]}
                          </span>
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded text-white bg-[var(--color-danger)]"
                          >
                            Active
                          </span>
                        </div>
                        <h3 className="font-display text-lg text-ink">
                          {incident.title}
                        </h3>
                        <p className="text-sm text-muted mt-1 line-clamp-2">
                          {incident.summary}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-faint">
                          <span>{incident.affected_postcodes.slice(0, 5).join(", ")}{incident.affected_postcodes.length > 5 ? ` +${incident.affected_postcodes.length - 5} more` : ""}</span>
                          <span>&middot;</span>
                          <span>Updated {timeAgo(incident.last_checked)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* All incidents */}
        <section>
          <h2 className="text-xs uppercase tracking-[0.15em] text-faint font-semibold mb-4">
            {active.length > 0 ? "Past incidents" : "Recent incidents"}
            {resolved.length > 0 && ` (${resolved.length})`}
          </h2>

          {incidents.length === 0 && (
            <div className="card p-8 text-center">
              <p className="text-muted">
                No water incidents reported. We monitor water company feeds and
                Environment Agency data every 15 minutes.
              </p>
            </div>
          )}

          <div className="grid gap-3">
            {resolved.map((incident) => (
              <Link
                key={incident.id}
                href={`/news/${incident.slug}`}
                className="card p-4 hover:shadow-md transition-shadow opacity-80"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--color-wash)] text-faint">
                        {INCIDENT_TYPE_LABELS[incident.type]}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--color-wash)] text-faint">
                        Resolved
                      </span>
                    </div>
                    <h3 className="font-medium text-ink">
                      {incident.title}
                    </h3>
                    <p className="text-sm text-muted mt-0.5 line-clamp-1">
                      {incident.summary}
                    </p>
                  </div>
                  <span className="text-xs text-faint shrink-0">
                    {new Date(incident.detected_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/news/page.tsx
git commit -m "feat: add /news hub page with active/resolved incident listing"
```

---

## Task 12: Article Page

**Files:**
- Create: `src/app/news/[slug]/page.tsx`

- [ ] **Step 1: Write the article page**

```tsx
// src/app/news/[slug]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { marked } from "marked";
import { BreadcrumbSchema, NewsArticleSchema } from "@/components/json-ld";
import { getIncidentBySlug, getAllIncidentSlugs } from "@/lib/incidents";
import { INCIDENT_TYPE_LABELS, SEVERITY_CONFIG } from "@/lib/incidents-types";

export const revalidate = 300; // 5 min

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllIncidentSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const incident = await getIncidentBySlug(slug);
  if (!incident) return { title: "Not Found" };

  return {
    title: incident.title,
    description: incident.summary,
    openGraph: {
      title: `${incident.title} | TapWater.uk`,
      description: incident.summary,
      url: `https://www.tapwater.uk/news/${slug}`,
      type: "article",
      publishedTime: incident.detected_at,
      modifiedTime: incident.last_checked,
    },
    other: {
      "robots": "max-image-preview:large",
    },
  };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default async function NewsArticlePage({ params }: Props) {
  const { slug } = await params;
  const incident = await getIncidentBySlug(slug);
  if (!incident) return notFound();

  const config = SEVERITY_CONFIG[incident.severity];
  const articleHtml = await marked.parse(incident.article_markdown);
  const isActive = incident.status === "active";

  const detectedDate = new Date(incident.detected_at).toLocaleDateString(
    "en-GB",
    { day: "numeric", month: "long", year: "numeric" },
  );

  return (
    <div className="bg-hero min-h-screen">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8 py-8 lg:py-14">
        <BreadcrumbSchema
          items={[
            { name: "Home", url: "https://www.tapwater.uk" },
            { name: "News", url: "https://www.tapwater.uk/news" },
            { name: incident.title, url: `https://www.tapwater.uk/news/${slug}` },
          ]}
        />
        <NewsArticleSchema
          headline={incident.title}
          description={incident.summary}
          url={`https://www.tapwater.uk/news/${slug}`}
          datePublished={incident.detected_at}
          dateModified={incident.last_checked}
        />

        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-sm text-faint"
        >
          <Link href="/" className="hover:text-accent transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/news" className="hover:text-accent transition-colors">
            News
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-ink font-medium line-clamp-1">
            {incident.title}
          </span>
        </nav>

        {/* Header */}
        <header className="mt-6 mb-8">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded text-white"
              style={{ backgroundColor: config.color }}
            >
              {INCIDENT_TYPE_LABELS[incident.type]}
            </span>
            <span className="text-sm text-faint">
              {detectedDate}
            </span>
            {incident.supplier_id && (
              <>
                <span className="text-faint">&middot;</span>
                <Link
                  href={`/supplier/${incident.supplier_id}`}
                  className="text-sm text-accent hover:underline"
                >
                  {incident.supplier_id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </Link>
              </>
            )}
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-ink tracking-tight">
            {incident.title}
          </h1>
          {incident.households_affected && (
            <p className="text-muted mt-2">
              ~{incident.households_affected.toLocaleString()} households in{" "}
              {incident.affected_postcodes.slice(0, 5).join(", ")}
              {incident.affected_postcodes.length > 5
                ? ` and ${incident.affected_postcodes.length - 5} more areas`
                : ""}
            </p>
          )}
        </header>

        {/* Two-column layout: article + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-8 lg:gap-12">
          {/* Article body */}
          <article
            className="prose prose-neutral dark:prose-invert max-w-none
              prose-headings:font-display prose-headings:text-ink prose-headings:tracking-tight
              prose-p:text-body prose-p:leading-relaxed
              prose-a:text-accent prose-a:no-underline hover:prose-a:underline
              prose-strong:text-ink"
            dangerouslySetInnerHTML={{ __html: articleHtml }}
          />

          {/* Sidebar */}
          <aside className="lg:border-l lg:border-[var(--color-rule)] lg:pl-6 space-y-6">
            {/* Affected areas */}
            {incident.affected_postcodes.length > 0 && (
              <div>
                <h3 className="text-[10px] text-faint uppercase tracking-[0.15em] font-semibold mb-2">
                  Affected areas
                </h3>
                <div className="flex flex-col gap-1">
                  {incident.affected_postcodes.slice(0, 15).map((p) => (
                    <Link
                      key={p}
                      href={`/postcode/${p}`}
                      className="text-sm text-accent hover:underline"
                    >
                      {p} &rarr;
                    </Link>
                  ))}
                  {incident.affected_postcodes.length > 15 && (
                    <span className="text-xs text-faint">
                      +{incident.affected_postcodes.length - 15} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Source */}
            {incident.source_url && (
              <div>
                <h3 className="text-[10px] text-faint uppercase tracking-[0.15em] font-semibold mb-2">
                  Source
                </h3>
                <a
                  href={incident.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent hover:underline"
                >
                  {incident.source === "water_company"
                    ? "Water company notice"
                    : "Environment Agency"}{" "}
                  &rarr;
                </a>
              </div>
            )}

            {/* Status */}
            <div>
              <h3 className="text-[10px] text-faint uppercase tracking-[0.15em] font-semibold mb-2">
                Status
              </h3>
              {isActive ? (
                <div className="text-sm font-semibold" style={{ color: config.color }}>
                  Active &middot; Updated {timeAgo(incident.last_checked)}
                </div>
              ) : (
                <div className="text-sm text-faint">
                  Resolved{" "}
                  {incident.resolved_at &&
                    new Date(incident.resolved_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Source attribution footer */}
        <footer className="mt-10 pb-4 text-sm text-faint leading-relaxed border-t border-[var(--color-rule)] pt-6">
          This article was automatically generated from official incident data
          by TapWater.uk. For the latest information, check your{" "}
          <Link
            href="/supplier"
            className="underline underline-offset-2 hover:text-muted transition-colors"
          >
            water company&apos;s website
          </Link>
          .
        </footer>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/news/[slug]/page.tsx
git commit -m "feat: add /news/[slug] article page with editorial + sidebar layout"
```

---

## Task 13: RSS Feed & News Sitemap

**Files:**
- Create: `src/app/news/rss.xml/route.ts`
- Create: `src/app/news/sitemap.xml/route.ts`

- [ ] **Step 1: Write the RSS feed route**

```typescript
// src/app/news/rss.xml/route.ts
import { getAllIncidents } from "@/lib/incidents";

export const revalidate = 300;

export async function GET() {
  const { incidents } = await getAllIncidents(50);

  const items = incidents
    .map((incident) => {
      const pubDate = new Date(incident.detected_at).toUTCString();
      const link = `https://www.tapwater.uk/news/${incident.slug}`;
      const description = escapeXml(incident.summary);
      const title = escapeXml(incident.title);

      return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${description}</description>
      <pubDate>${pubDate}</pubDate>
      <category>${incident.type.replace(/_/g, " ")}</category>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:georss="http://www.georss.org/georss">
  <channel>
    <title>TapWater.uk — Water Incident News</title>
    <link>https://www.tapwater.uk/news</link>
    <description>Live water quality incidents, boil notices, and pollution alerts across the UK.</description>
    <language>en-gb</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://www.tapwater.uk/news/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
```

- [ ] **Step 2: Write the News sitemap route**

```typescript
// src/app/news/sitemap.xml/route.ts
import { getAllIncidents } from "@/lib/incidents";

export const revalidate = 300;

export async function GET() {
  const { incidents } = await getAllIncidents(100);

  // Google News sitemap: only include articles from last 48 hours
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  const recent = incidents.filter(
    (i) => new Date(i.detected_at).getTime() > cutoff,
  );

  const urls = recent
    .map((incident) => {
      const loc = `https://www.tapwater.uk/news/${incident.slug}`;
      const pubDate = new Date(incident.detected_at).toISOString();

      return `  <url>
    <loc>${loc}</loc>
    <news:news>
      <news:publication>
        <news:name>TapWater.uk</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${escapeXml(incident.title)}</news:title>
    </news:news>
    <lastmod>${new Date(incident.last_checked).toISOString()}</lastmod>
  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/news/rss.xml/route.ts src/app/news/sitemap.xml/route.ts
git commit -m "feat: add RSS feed and Google News sitemap for /news"
```

---

## Task 14: Inject Banners on Postcode & City Pages

**Files:**
- Modify: `src/app/postcode/[district]/page.tsx`
- Modify: `src/app/city/[slug]/page.tsx`

- [ ] **Step 1: Add alert banner to postcode page**

At the top of `src/app/postcode/[district]/page.tsx`, add the imports:

```typescript
import { IncidentAlerts } from "@/components/incident-alert";
import { getActiveIncidentsForPostcode } from "@/lib/incidents";
```

Inside the `PostcodePage` component, after `const data = await getPostcodeData(district);` and before the `if (!data)` check, add:

```typescript
const activeIncidents = await getActiveIncidentsForPostcode(district);
```

Then, right after the opening `<div className="bg-hero min-h-screen">` → `<div className="mx-auto max-w-6xl ...">` container, before the breadcrumb nav, add:

```tsx
<IncidentAlerts incidents={activeIncidents} />
```

- [ ] **Step 2: Add alert banner to city page**

At the top of `src/app/city/[slug]/page.tsx`, add:

```typescript
import { IncidentAlerts } from "@/components/incident-alert";
import { getActiveIncidentsForCity } from "@/lib/incidents";
```

Inside the default export function, after the city data is loaded, add:

```typescript
const activeIncidents = await getActiveIncidentsForCity(slug);
```

After the opening container div, before the breadcrumb, add:

```tsx
<IncidentAlerts incidents={activeIncidents} />
```

- [ ] **Step 3: Commit**

```bash
git add src/app/postcode/[district]/page.tsx src/app/city/[slug]/page.tsx
git commit -m "feat: inject incident alert banners on postcode and city pages"
```

---

## Task 15: Header, Layout, Sitemap Updates

**Files:**
- Modify: `src/components/header.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/sitemap.ts`

- [ ] **Step 1: Add News link to header**

In `src/components/header.tsx`, add to the `navLinks` array (after "Rankings"):

```typescript
{ label: "News", href: "/news" },
```

- [ ] **Step 2: Add RSS auto-discovery to root layout**

In `src/app/layout.tsx`, inside the `<html>` tag (before `<body>`), add:

```tsx
<head>
  <link
    rel="alternate"
    type="application/rss+xml"
    href="/news/rss.xml"
    title="TapWater.uk Water Incident News"
  />
</head>
```

- [ ] **Step 3: Add news routes to main sitemap**

In `src/app/sitemap.ts`, add the import:

```typescript
import { getAllIncidentSlugs } from "@/lib/incidents";
```

Inside the `sitemap()` function, after the existing routes and before the final `return`, add:

```typescript
const incidentSlugs = await getAllIncidentSlugs();
const newsPaths = incidentSlugs.map((slug) => ({
  url: `${BASE_URL}/news/${slug}`,
  lastModified: new Date(),
  changeFrequency: "daily" as const,
  priority: 0.7,
}));
```

Add to the returned array:

```typescript
{
  url: `${BASE_URL}/news`,
  lastModified: new Date(),
  changeFrequency: "hourly" as const,
  priority: 0.9,
},
...newsPaths,
```

- [ ] **Step 4: Commit**

```bash
git add src/components/header.tsx src/app/layout.tsx src/app/sitemap.ts
git commit -m "feat: add News to header, RSS discovery link, news sitemap entries"
```

---

## Task 16: Environment Variable Setup & Build Verification

- [ ] **Step 1: Verify required env vars are documented**

The system needs `ANTHROPIC_API_KEY` set in Vercel environment variables. The article generator gracefully falls back if missing, but for production it should be set.

Check with: `vercel env ls` or use the Vercel MCP tool to verify.

Required env vars for the incidents system:
- `ANTHROPIC_API_KEY` — Claude API key for article generation
- `CRON_SECRET` — already exists, used by other crons
- `RESEND_API_KEY` — already exists, used by email system
- `ADMIN_EMAIL` — optional, defaults to `remy@tapwater.uk`

- [ ] **Step 2: Run tests**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: Build succeeds. News pages will show empty state (no incidents yet) — that's correct.

- [ ] **Step 4: Commit any fixes**

If tests or build revealed issues, fix and commit.

---

## Task 17: Deploy & Verify

- [ ] **Step 1: Push to main and deploy**

```bash
git push origin main
```

- [ ] **Step 2: Verify deployment**

Check that:
- `/news` loads and shows empty state
- `/news/rss.xml` returns valid RSS XML
- `/news/sitemap.xml` returns valid sitemap XML
- Header shows "News" link
- RSS `<link>` tag is in page source

- [ ] **Step 3: Test cron manually**

Trigger the cron endpoint manually to verify it runs without errors:
```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://www.tapwater.uk/api/cron/incidents
```

Expected: JSON response with `success: true`, `newIncidents: 0` (or more if any water companies currently have active incidents).
