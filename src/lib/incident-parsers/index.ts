import type { RawIncident } from "@/lib/incidents-types";
import { logSourceCheck, getConsecutiveFailures } from "@/lib/incidents";
import { parseWaterCompanyFeeds } from "./water-companies";
import { parseEAIncidents } from "./environment-agency";
import { parseSevernTrentIncidents } from "./severn-trent";
import { parseScottishWaterIncidents } from "./scottish-water";

// Any incident affecting more than this many postcode districts is likely
// a data error or a national bulletin — skip it to avoid polluting the DB
const MAX_BLAST_RADIUS = 200;

export async function pollAllSources(): Promise<{
  incidents: RawIncident[];
  errors: string[];
}> {
  const allIncidents: RawIncident[] = [];
  const errors: string[] = [];

  const [waterResult, eaResult, stResult, swResult] = await Promise.allSettled([
    parseWaterCompanyFeeds(),
    parseEAIncidents(),
    parseSevernTrentIncidents(),
    parseScottishWaterIncidents(),
  ]);

  // ── Water companies ──
  if (waterResult.status === "fulfilled") {
    for (const check of waterResult.value.checks) {
      await logSourceCheck(check).catch(() => {});

      if (check.error) {
        const failures = await getConsecutiveFailures(
          check.source,
          check.source_name,
        ).catch(() => 0);
        if (failures >= 3) {
          errors.push(
            `[${check.source_name}] ${failures} consecutive failures — last: ${check.error}`,
          );
        }
      }
    }
    allIncidents.push(...waterResult.value.incidents);
  } else {
    const msg = `Water company parser crashed: ${String(waterResult.reason)}`;
    errors.push(msg);
    console.error(msg);
  }

  // ── Environment Agency ──
  if (eaResult.status === "fulfilled") {
    for (const check of eaResult.value.checks) {
      await logSourceCheck(check).catch(() => {});

      if (check.error) {
        const failures = await getConsecutiveFailures(
          check.source,
          check.source_name,
        ).catch(() => 0);
        if (failures >= 3) {
          errors.push(
            `[${check.source_name}] ${failures} consecutive failures — last: ${check.error}`,
          );
        }
      }
    }
    allIncidents.push(...eaResult.value.incidents);
  } else {
    const msg = `EA parser crashed: ${String(eaResult.reason)}`;
    errors.push(msg);
    console.error(msg);
  }

  // ── Severn Trent (HTML scraper) ──
  if (stResult.status === "fulfilled") {
    for (const check of stResult.value.checks) {
      await logSourceCheck(check).catch(() => {});

      if (check.error) {
        const failures = await getConsecutiveFailures(
          check.source,
          check.source_name,
        ).catch(() => 0);
        if (failures >= 3) {
          errors.push(
            `[${check.source_name}] ${failures} consecutive failures — last: ${check.error}`,
          );
        }
      }
    }
    allIncidents.push(...stResult.value.incidents);
  } else {
    const msg = `Severn Trent parser crashed: ${String(stResult.reason)}`;
    errors.push(msg);
    console.error(msg);
  }

  // ── Scottish Water ──
  if (swResult.status === "fulfilled") {
    for (const check of swResult.value.checks) {
      await logSourceCheck(check).catch(() => {});

      if (check.error) {
        const failures = await getConsecutiveFailures(
          check.source,
          check.source_name,
        ).catch(() => 0);
        if (failures >= 3) {
          errors.push(
            `[${check.source_name}] ${failures} consecutive failures — last: ${check.error}`,
          );
        }
      }
    }
    allIncidents.push(...swResult.value.incidents);
  } else {
    const msg = `Scottish Water parser crashed: ${String(swResult.reason)}`;
    errors.push(msg);
    console.error(msg);
  }

  // Filter out incidents with an implausibly large postcode blast radius
  const filtered = allIncidents.filter((incident) => {
    if (incident.affected_postcodes.length > MAX_BLAST_RADIUS) {
      console.warn(
        `Skipping incident with ${incident.affected_postcodes.length} postcodes (exceeds MAX_BLAST_RADIUS=${MAX_BLAST_RADIUS})`,
      );
      return false;
    }
    return true;
  });

  return { incidents: filtered, errors };
}
