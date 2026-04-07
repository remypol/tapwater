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
import { isIncidentStillActive } from "@/lib/incident-parsers/water-companies";
import { isEAIncidentStillActive } from "@/lib/incident-parsers/environment-agency";
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

  for (const incident of active) {
    try {
      let stillActive: boolean;

      if (incident.source === "environment_agency") {
        const floodAreaID = String(
          incident.source_data?.floodAreaID ?? "",
        );
        stillActive = await isEAIncidentStillActive(floodAreaID);
      } else {
        // For water company incidents the function returns false when the
        // source is unreachable *and* no ID is present, and true on network
        // errors — so it already implements the "don't resolve on error" rule.
        stillActive = await isIncidentStillActive(
          incident.source_url ?? "",
          incident.source_data ?? {},
        );
      }

      if (!stillActive) {
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

  // ── 4. Stale incident handling ────────────────────────────────────────────

  log.push("Checking for stale incidents...");

  const staleForAlert = await getStaleActiveIncidents(STALE_HOURS);
  const staleForAutoResolve = await getStaleActiveIncidents(AUTO_RESOLVE_HOURS);

  // Auto-resolve anything older than 7 days
  for (const incident of staleForAutoResolve) {
    try {
      const ok = await resolveIncident(incident.id);
      if (ok) {
        await logIncidentAction(incident.id, "resolved", {
          reason: "auto_resolve_7d",
        });
        resolvedIncidents++;
        log.push(`[${incident.slug}] Auto-resolved after 7 days with no update`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Auto-resolve error for ${incident.slug}: ${msg}`);
    }
  }

  // Send stale alert for 48h+ incidents (excluding those already auto-resolved)
  const autoResolvedIds = new Set(staleForAutoResolve.map((i) => i.id));
  const needsAlert = staleForAlert.filter((i) => !autoResolvedIds.has(i.id));

  for (const incident of needsAlert) {
    try {
      // Check if we already sent a stale_alert for this incident
      const { data: existingLogs } = await supabase
        .from("incident_logs")
        .select("action")
        .eq("incident_id", incident.id)
        .eq("action", "stale_alert")
        .limit(1);

      if (existingLogs && hasStaleAlert(existingLogs)) {
        continue; // Already alerted
      }

      if (process.env.RESEND_API_KEY) {
        await sendAdminEmail(
          resend,
          `[TapWater] Stale incident: ${incident.title}`,
          `<p>The incident <strong>${incident.title}</strong> (slug: <code>${incident.slug}</code>) has been active for over ${STALE_HOURS} hours with no update.</p><p>Source: ${incident.source_url ?? "unknown"}</p><p>Detected: ${incident.detected_at}</p>`,
        );
      }

      await logIncidentAction(incident.id, "stale_alert");
      staleIncidents++;
      log.push(`[${incident.slug}] Stale alert sent`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Stale alert error for ${incident.slug}: ${msg}`);
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
