import type { RawIncident, IncidentSeverity } from "@/lib/incidents-types";
import { generateSourceHash } from "@/lib/incidents";
import { extractPostcodeDistricts, mapPostcodesToCities } from "./postcode-matcher";
import type { SourceCheckResult } from "./water-companies";

const EA_FLOODS_API =
  "https://environment.data.gov.uk/flood-monitoring/id/floods";

// Keywords that indicate water-quality relevance — we only want incidents
// that could affect drinking water, not general riverine flooding
const WATER_QUALITY_KEYWORDS =
  /sewage|sewerage|contamina|drinking water|water supply|pollution|boil|pfas|overflow|discharge/i;

interface EAFlood {
  "@id": string;
  description?: string;
  message?: string;
  severity?: number;
  severityLevel?: number;
  floodAreaID?: string;
  floodArea?: { county?: string; description?: string };
  timeRaised?: string;
  timeSeverityChanged?: string;
  timeMessageChanged?: string;
}

interface EAApiResponse {
  items: EAFlood[];
}

function eaSeverityToLevel(severity: number | undefined): IncidentSeverity {
  if (!severity) return "info";
  if (severity === 1) return "critical";
  if (severity <= 3) return "warning";
  return "info";
}

function floodToRawIncident(flood: EAFlood, today: string): RawIncident | null {
  const text = [
    flood.description ?? "",
    flood.message ?? "",
    flood.floodArea?.description ?? "",
    flood.floodArea?.county ?? "",
  ]
    .join(" ")
    .trim();

  if (!WATER_QUALITY_KEYWORDS.test(text)) return null;

  const postcodes = extractPostcodeDistricts(text);
  const cities = mapPostcodesToCities(postcodes);
  const severity = eaSeverityToLevel(flood.severity ?? flood.severityLevel);

  // Determine type based on text content
  let type: RawIncident["type"] = "pollution";
  if (/boil/i.test(text)) type = "boil_notice";
  else if (/pfas/i.test(text)) type = "pfas_discovery";
  else if (/drinking water|water supply/i.test(text))
    type = "supply_interruption";

  const sourceHash = generateSourceHash(
    "environment_agency",
    type,
    postcodes,
    today,
  );

  const actionRequired = /boil/i.test(text)
    ? text
        .split(/[.!?]/)
        .find((s) => /boil/i.test(s))
        ?.trim() ?? null
    : null;

  return {
    source_hash: sourceHash,
    type,
    severity,
    source: "environment_agency",
    source_url: flood["@id"] ?? EA_FLOODS_API,
    supplier_id: null,
    affected_postcodes: postcodes,
    affected_cities: cities,
    households_affected: null,
    action_required: actionRequired,
    raw_description: text,
    source_data: flood as unknown as Record<string, unknown>,
  };
}

export async function parseEAIncidents(): Promise<{
  incidents: RawIncident[];
  checks: SourceCheckResult[];
}> {
  const today = new Date().toISOString().split("T")[0];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(EA_FLOODS_API, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return {
        incidents: [],
        checks: [
          {
            source: "environment_agency",
            source_name: "Environment Agency Flood Monitoring",
            status_code: res.status,
            items_found: 0,
            error: `HTTP ${res.status}`,
          },
        ],
      };
    }

    const json = (await res.json()) as EAApiResponse;
    const floods: EAFlood[] = Array.isArray(json.items) ? json.items : [];
    const incidents: RawIncident[] = [];

    for (const flood of floods) {
      const raw = floodToRawIncident(flood, today);
      if (raw) incidents.push(raw);
    }

    return {
      incidents,
      checks: [
        {
          source: "environment_agency",
          source_name: "Environment Agency Flood Monitoring",
          status_code: res.status,
          items_found: incidents.length,
          error: null,
        },
      ],
    };
  } catch (err) {
    clearTimeout(timeout);
    const msg = err instanceof Error ? err.message : String(err);
    return {
      incidents: [],
      checks: [
        {
          source: "environment_agency",
          source_name: "Environment Agency Flood Monitoring",
          status_code: null,
          items_found: 0,
          error: msg,
        },
      ],
    };
  }
}

export async function isEAIncidentStillActive(
  floodAreaID: string,
): Promise<boolean> {
  if (!floodAreaID) return false;

  const url = `${EA_FLOODS_API}?floodAreaID=${encodeURIComponent(floodAreaID)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeout);

    if (!res.ok) return false;
    const json = (await res.json()) as EAApiResponse;
    return Array.isArray(json.items) && json.items.length > 0;
  } catch {
    clearTimeout(timeout);
    // Network error — assume still active to avoid false resolution
    return true;
  }
}
