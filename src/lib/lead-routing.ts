/**
 * Who gets a softener lead. Pure, so every rule is unit-tested; the database and
 * email side lives in lead-delivery.ts.
 */

import { BACKLOG_MAX_AGE_DAYS, DUPLICATE_WINDOW_HOURS, MAX_INSTALLERS_PER_LEAD } from "./partner-offer";

export interface RoutablePartner {
  id: string;
  status: string;
  /** Postcode areas the installer picked at signup: "RG", "SL". */
  coverage_areas: string[] | null;
  /** Older, finer-grained list: districts ("RG41") or areas ("RG"). */
  coverage_postcodes: string[] | null;
  /** When the installer was approved; earlier partners are served first. */
  approved_at: string | null;
  created_at: string | null;
}

const DISTRICT_RE = /^[A-Z]{1,2}[0-9][0-9A-Z]?$/;
const AREA_RE = /^[A-Z]{1,2}$/;

/** "RG41" → "RG", "N1" → "N". Empty string for anything that is not a district. */
export function postcodeAreaOf(district: string): string {
  const d = district.trim().toUpperCase();
  if (!DISTRICT_RE.test(d)) return "";
  return d.replace(/[0-9].*$/, "");
}

/**
 * Turn whatever an installer typed or ticked into a clean list of postcode areas.
 * Districts are reduced to their area: "rg41, SL" → ["RG", "SL"].
 */
export function normaliseAreas(input: unknown): string[] {
  const raw = Array.isArray(input) ? input : typeof input === "string" ? input.split(/[\s,;]+/) : [];
  const out = new Set<string>();
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const v = item.trim().toUpperCase();
    if (AREA_RE.test(v)) out.add(v);
    else if (DISTRICT_RE.test(v)) out.add(postcodeAreaOf(v));
  }
  return [...out].sort();
}

export function partnerCovers(partner: Pick<RoutablePartner, "coverage_areas" | "coverage_postcodes">, district: string): boolean {
  const d = district.trim().toUpperCase();
  const area = postcodeAreaOf(d);
  if (!area) return false;
  if ((partner.coverage_areas ?? []).some((a) => a.toUpperCase() === area)) return true;
  // An exact district or its area. Never a prefix match: "N" must not catch "NW3".
  return (partner.coverage_postcodes ?? []).some((p) => {
    const v = p.trim().toUpperCase();
    return v === d || v === area;
  });
}

/**
 * The installers a lead is offered to: active, covering the district, longest
 * standing first, and never more than the cap, because a homeowner who ticked
 * "local installers" did not ask for six phone calls.
 */
export function pickPartners<P extends RoutablePartner>(
  partners: P[],
  district: string,
  alreadyOffered: ReadonlySet<string> = new Set(),
  max = MAX_INSTALLERS_PER_LEAD,
): P[] {
  const room = Math.max(0, max - alreadyOffered.size);
  if (room === 0) return [];
  const since = (p: P) => p.approved_at ?? p.created_at ?? "";
  return partners
    .filter((p) => p.status === "active" && !alreadyOffered.has(p.id) && partnerCovers(p, district))
    .sort((a, b) => since(a).localeCompare(since(b)) || a.id.localeCompare(b.id))
    .slice(0, room);
}

/** The same person asking again for the same district shortly after is one request, not two. */
export function isDuplicateLead(
  incoming: { email: string; district: string; at: Date },
  existing: { email: string; postcode_district: string; created_at: string }[],
  windowHours = DUPLICATE_WINDOW_HOURS,
): boolean {
  const email = incoming.email.trim().toLowerCase();
  const district = incoming.district.trim().toUpperCase();
  const cutoff = incoming.at.getTime() - windowHours * 3_600_000;
  return existing.some(
    (l) =>
      l.email.trim().toLowerCase() === email &&
      l.postcode_district.trim().toUpperCase() === district &&
      new Date(l.created_at).getTime() >= cutoff,
  );
}

/**
 * Whether a waiting lead may still be handed to an installer: the homeowner agreed
 * to sharing, and asked recently enough that a call is still welcome.
 */
export function isDeliverableBacklog(
  lead: { consent_to_installer_sharing: boolean | null; created_at: string },
  now: Date,
  maxAgeDays = BACKLOG_MAX_AGE_DAYS,
): boolean {
  if (lead.consent_to_installer_sharing !== true) return false;
  return now.getTime() - new Date(lead.created_at).getTime() <= maxAgeDays * 86_400_000;
}
