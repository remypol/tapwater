import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";

import { getSupabase } from "@/lib/supabase";
import { pollAllSources } from "@/lib/incident-parsers/index";
import { generateArticle } from "@/lib/incident-article";
import {
  upsertIncident,
  resolveIncident,
  updateLastChecked,
  getStaleActiveIncidents,
  logIncidentAction,
} from "@/lib/incidents";
import { checkIncidentAtSource } from "@/lib/incident-parsers/water-companies";
import { checkEAIncidentAtSource } from "@/lib/incident-parsers/environment-agency";
import { partitionStale, type SourceCheckOutcome } from "@/lib/incident-staleness";
import type { Incident } from "@/lib/incidents-types";

// ── Config ──────────────────────────────────────────────────────────────────

export const maxDuration = 300;

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "remy@tapwater.uk";
const STALE_HOURS = 48;
const AUTO_RESOLVE_HOURS = 168; // 7 days
const MAX_REVALIDATE_POSTCODES = 50;

// ── Helpers ──────────────────────────────────────────────────────────────────

function hasStaleAlert(logs: { action: string }[]): boolean {
  return logs.some((l) => l.action === "stale_alert");
}

async function sendAdminEmail(
  resend: Resend,
  subject: string,
  html: string,
): Promise<void> {
  try {
    await resend.emails.send({
      from: "TapWater Alerts <alerts@tapwater.uk>",
      to: ADMIN_EMAIL,
      subject,
      html,
    });
  } catch (err) {
    console.error("[incidents-cron] Failed to send admin email:", err);
  }
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  // Auth
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || cronSecret.length < 24) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  const resend = new Resend(process.env.RESEND_API_KEY);
  const log: string[] = [];
  const errors: string[] = [];
  const revalidatedPaths = new Set<string>();
  let newIncidents = 0;
  let resolvedIncidents = 0;
  let staleIncidents = 0;

  // ── 1. Poll all sources ───────────────────────────────────────────────────

  log.push("Polling sources...");
  const { incidents: rawIncidents, errors: parseErrors } =
    await pollAllSources();
  log.push(
    `Polled ${rawIncidents.length} raw incident(s); ${parseErrors.length} parse error(s)`,
  );

  if (parseErrors.length > 0) {
    errors.push(...parseErrors);
    if (process.env.RESEND_API_KEY) {
      await sendAdminEmail(
        resend,
        `[TapWater] Source parse errors (${parseErrors.length})`,
        `<p>The following errors occurred when polling incident sources:</p><ul>${parseErrors.map((e) => `<li>${e}</li>`).join("")}</ul>`,
      );
    }
  }

  // ── 2. Deduplicate + publish new incidents ────────────────────────────────

  for (const raw of rawIncidents) {
    try {
      const { data: existing } = await supabase
        .from("incidents")
        .select("id, status")
        .eq("source_hash", raw.source_hash)
        .single();

      if (existing) {
        // Already known — just touch last_checked
        await updateLastChecked(existing.id);
        log.push(`[${raw.source_hash}] Already known — last_checked updated`);
        continue;
      }

      // New incident — generate article and publish
      log.push(`[${raw.source_hash}] New incident — generating article...`);
      const article = await generateArticle(raw);

      const incident = await upsertIncident(raw, article);
      if (!incident) {
        errors.push(
          `Failed to upsert incident with hash ${raw.source_hash}`,
        );
        continue;
      }

      await logIncidentAction(incident.id, "detected");
      newIncidents++;
      log.push(`[${raw.source_hash}] Published as ${incident.slug}`);

      // Revalidate affected pages
      revalidatedPaths.add("/news");
      const postcodesToRevalidate = incident.affected_postcodes.slice(
        0,
        MAX_REVALIDATE_POSTCODES,
      );
      for (const postcode of postcodesToRevalidate) {
        const path = `/postcode/${postcode.toLowerCase()}`;
        revalidatedPaths.add(path);
        revalidatePath(path);
      }
      for (const city of incident.affected_cities) {
        const path = `/city/${city}`;
        revalidatedPaths.add(path);
        revalidatePath(path);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Error processing raw incident ${raw.source_hash}: ${msg}`);
      console.error("[incidents-cron] Error processing raw incident:", err);
    }
  }

  // Revalidate /news once if we published anything
  if (newIncidents > 0) {
    revalidatePath("/news");
  }

  // ── 3. Check active incidents for resolution ──────────────────────────────

  log.push("Checking active incidents for resolution...");

  const { data: activeIncidents } = await supabase
    .from("incidents")
    .select("*")
    .eq("status", "active");

  const active = (activeIncidents ?? []) as Incident[];
  log.push(`${active.length} active incident(s) to re-check`);

  let unverifiable = 0;

  for (const incident of active) {
    try {
      let outcome: SourceCheckOutcome;

      if (incident.source === "environment_agency") {
        const floodAreaID = String(
          incident.source_data?.floodAreaID ?? "",
        );
        outcome = await checkEAIncidentAtSource(floodAreaID);
      } else {
        outcome = await checkIncidentAtSource(
          incident.source_url ?? "",
          incident.source_data ?? {},
        );
      }

      // "unknown" must not touch last_checked. Stamping it on every failed
      // or impossible check is what kept 300+ Severn Trent incidents
      // "fresh" for months and defeated the 7-day auto-resolve below.
      if (outcome === "unknown") {
        unverifiable++;
        continue;
      }

      if (outcome === "gone") {
        const ok = await resolveIncident(incident.id);
        if (ok) {
          await logIncidentAction(incident.id, "resolved", {
            reason: "source_check_clear",
          });
          resolvedIncidents++;
          log.push(`[${incident.slug}] Resolved — no longer in source`);

          // Revalidate affected pages
          revalidatedPaths.add("/news");
          const postcodesToRevalidate = incident.affected_postcodes.slice(
            0,
            MAX_REVALIDATE_POSTCODES,
          );
          for (const postcode of postcodesToRevalidate) {
            const path = `/postcode/${postcode.toLowerCase()}`;
            revalidatedPaths.add(path);
            revalidatePath(path);
          }
          for (const city of incident.affected_cities) {
            const path = `/city/${city}`;
            revalidatedPaths.add(path);
            revalidatePath(path);
          }
          revalidatePath(`/news/${incident.slug}`);
          revalidatedPaths.add(`/news/${incident.slug}`);
        }
      } else {
        await updateLastChecked(incident.id);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(
        `[incidents-cron] Error re-checking incident ${incident.slug}:`,
        err,
      );
      errors.push(`Re-check error for ${incident.slug}: ${msg}`);
    }
  }

  if (unverifiable > 0) {
    log.push(
      `${unverifiable} active incident(s) could not be verified at source; left for the ${AUTO_RESOLVE_HOURS / 24}-day stale rule`,
    );
  }

  // ── 4. Stale incident handling ────────────────────────────────────────────

  log.push("Checking for stale incidents...");

  // One query for everything unseen for 48h+, then a pure split into
  // "resolve" (7d+) and "alert" (48h-7d) so the two can never overlap.
  const { toResolve: staleForAutoResolve, toAlert: needsAlert } = partitionStale(
    await getStaleActiveIncidents(STALE_HOURS),
    { alertHours: STALE_HOURS, autoResolveHours: AUTO_RESOLVE_HOURS },
  );

  // Auto-resolve anything not seen at its source for 7 days
  for (const incident of staleForAutoResolve) {
    try {
      const ok = await resolveIncident(incident.id);
      if (ok) {
        await logIncidentAction(incident.id, "resolved", {
          reason: "auto_resolve_7d",
        });
        resolvedIncidents++;
        log.push(`[${incident.slug}] Auto-resolved after 7 days with no update`);
        revalidatePath(`/news/${incident.slug}`);
        revalidatedPaths.add(`/news/${incident.slug}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Auto-resolve error for ${incident.slug}: ${msg}`);
    }
  }
  if (staleForAutoResolve.length > 0) {
    revalidatePath("/news");
    revalidatedPaths.add("/news");
  }

  // Send ONE digest for 48h+ incidents not yet old enough to resolve. Now
  // that unverifiable checks no longer refresh last_checked, a whole
  // supplier's backlog can cross the 48h line in the same run; one email
  // per incident would be hundreds of emails at once.
  const unalerted: Incident[] = [];
  for (const incident of needsAlert) {
    try {
      const { data: existingLogs } = await supabase
        .from("incident_logs")
        .select("action")
        .eq("incident_id", incident.id)
        .eq("action", "stale_alert")
        .limit(1);

      if (!(existingLogs && hasStaleAlert(existingLogs))) {
        unalerted.push(incident);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Stale alert lookup error for ${incident.slug}: ${msg}`);
    }
  }

  if (unalerted.length > 0) {
    if (process.env.RESEND_API_KEY) {
      const rows = unalerted
        .map(
          (i) =>
            `<li><strong>${i.title}</strong> (<code>${i.slug}</code>) — detected ${i.detected_at}, source ${i.source_url ?? "unknown"}</li>`,
        )
        .join("");
      await sendAdminEmail(
        resend,
        `[TapWater] ${unalerted.length} stale incident(s) with no update for ${STALE_HOURS}h+`,
        `<p>These incidents have not been seen at their source for over ${STALE_HOURS} hours. They will auto-resolve at ${AUTO_RESOLVE_HOURS / 24} days if still unseen.</p><ul>${rows}</ul>`,
      );
    }
    for (const incident of unalerted) {
      try {
        await logIncidentAction(incident.id, "stale_alert");
        staleIncidents++;
        log.push(`[${incident.slug}] Included in stale digest`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Stale alert log error for ${incident.slug}: ${msg}`);
      }
    }
  }

  // ── Response ──────────────────────────────────────────────────────────────

  const result = {
    success: errors.length === 0,
    newIncidents,
    resolvedIncidents,
    staleIncidents,
    revalidatedPaths: Array.from(revalidatedPaths),
    errors,
    log,
  };

  console.log(
    `[incidents-cron] Done — new: ${newIncidents}, resolved: ${resolvedIncidents}, stale: ${staleIncidents}, errors: ${errors.length}`,
  );

  return NextResponse.json(result);
}
