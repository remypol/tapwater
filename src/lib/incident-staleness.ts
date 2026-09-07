/**
 * Pure logic for deciding when an active incident is still active.
 *
 * Why this exists: the cron used to ask "is it still active?" and get a
 * boolean, with every failure mode (network error, unfetchable URL, no id to
 * look for) collapsing to `true`. It then stamped last_checked on every
 * "true", so an incident whose source could never be checked looked freshly
 * confirmed every 15 minutes and the 7-day auto-resolve never fired. Severn
 * Trent incidents carry source_url "#incident-tab-panel-0" and no id, which
 * is exactly that case: 303 of them sat active for months.
 *
 * The fix is to separate three outcomes. Only a positive confirmation
 * ("active") may refresh last_checked, so last_checked means "last seen at
 * source" and the stale rule can do its job.
 */

/**
 * - active: the source still lists this incident.
 * - gone: the source was reachable and no longer lists it.
 * - unknown: we could not tell (unreachable, error, nothing to match on).
 */
export type SourceCheckOutcome = "active" | "gone" | "unknown";

/** Only absolute http(s) URLs can be fetched; fragments and paths cannot. */
export function isCheckableSourceUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/** The identifier a feed-based source check looks for in the feed body. */
export function getSourceIncidentId(
  sourceData: Record<string, unknown> | null | undefined,
): string {
  return String(sourceData?.id ?? sourceData?.incidentId ?? "");
}

/**
 * Interpret a fetched feed body. Without an id there is nothing to match, so
 * the answer is unknown rather than "gone": we must never resolve an incident
 * on the strength of a check we could not actually perform.
 */
export function outcomeFromFeedBody(body: string, id: string): SourceCheckOutcome {
  if (!id) return "unknown";
  return body.includes(id) ? "active" : "gone";
}

export interface StaleCandidate {
  id: string;
  last_checked: string;
}

/**
 * True when the incident has not been seen at its source for at least
 * `hours`. Relies on last_checked meaning "last confirmed", which the cron
 * now guarantees by only stamping it on an "active" outcome.
 */
export function isStale(
  incident: StaleCandidate,
  hours: number,
  now: Date = new Date(),
): boolean {
  const seen = new Date(incident.last_checked).getTime();
  if (Number.isNaN(seen)) return true;
  return now.getTime() - seen >= hours * 60 * 60 * 1000;
}

/**
 * Split active incidents into those to auto-resolve and those that only
 * merit an admin alert. An incident old enough to resolve is never also
 * alerted on.
 */
export function partitionStale<T extends StaleCandidate>(
  incidents: T[],
  opts: { alertHours: number; autoResolveHours: number },
  now: Date = new Date(),
): { toResolve: T[]; toAlert: T[] } {
  const toResolve: T[] = [];
  const toAlert: T[] = [];
  for (const incident of incidents) {
    if (isStale(incident, opts.autoResolveHours, now)) {
      toResolve.push(incident);
    } else if (isStale(incident, opts.alertHours, now)) {
      toAlert.push(incident);
    }
  }
  return { toResolve, toAlert };
}
