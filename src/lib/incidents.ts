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
