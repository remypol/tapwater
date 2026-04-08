import type { RawIncident } from "@/lib/incidents-types";
import { generateSourceHash } from "@/lib/incidents";
import { extractPostcodeDistricts, mapPostcodesToCities } from "./postcode-matcher";
import type { SourceCheckResult } from "./water-companies";

// Scottish Water does not publish a documented public JSON API for overflow
// or incident data. These candidate URLs are based on common patterns used
// by UK water companies. If none succeed, the parser returns gracefully with
// a check entry recording the failure. Update the URL here when a working
// endpoint is confirmed.
const CANDIDATE_URLS = [
  "https://www.scottishwater.co.uk/api/incidents",
  "https://www.scottishwater.co.uk/api/service-updates",
  "https://www.scottishwater.co.uk/api/overflow-events",
];

const SUPPLIER_ID = "scottish-water";
const SOURCE_NAME = "Scottish Water";

interface OverflowEvent {
  id?: string | number;
  title?: string;
  description?: string;
  message?: string;
  detail?: string;
  postcode?: string;
  location?: string;
  type?: string;
  status?: string;
  link?: string;
  url?: string;
  [key: string]: unknown;
}

function parseResponseBody(body: string): OverflowEvent[] {
  try {
    const json = JSON.parse(body) as unknown;
    if (Array.isArray(json)) return json as OverflowEvent[];
    const obj = json as Record<string, unknown>;
    for (const key of ["events", "incidents", "items", "updates", "results", "data"]) {
      if (Array.isArray(obj[key])) return obj[key] as OverflowEvent[];
    }
    // Single object response
    return [obj as OverflowEvent];
  } catch {
    return [];
  }
}

export async function parseScottishWaterIncidents(): Promise<{
  incidents: RawIncident[];
  checks: SourceCheckResult[];
}> {
  const today = new Date().toISOString().split("T")[0];

  // Try each candidate URL in order — use the first that responds with 2xx
  for (const url of CANDIDATE_URLS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: "application/json, */*;q=0.8",
          "User-Agent": "TapWater.uk/1.0 water-quality-monitor",
        },
      });
      clearTimeout(timeout);

      if (!res.ok) {
        // Non-2xx: skip to next candidate
        continue;
      }

      const body = await res.text();
      const events = parseResponseBody(body);
      const incidents: RawIncident[] = [];

      for (const event of events) {
        const title = String(event.title ?? event.message ?? "");
        const description = String(
          event.description ?? event.detail ?? event.message ?? "",
        );
        const combined = `${title} ${description}`.trim();

        if (!combined) continue;

        // Include postcode from dedicated field if present
        const locationText = [
          combined,
          String(event.postcode ?? ""),
          String(event.location ?? ""),
        ].join(" ");

        const postcodes = extractPostcodeDistricts(locationText);
        const cities = mapPostcodesToCities(postcodes);

        // Overflow events default to "pollution"; refine if text indicates otherwise
        let type: RawIncident["type"] = "pollution";
        const lower = combined.toLowerCase();
        if (/boil/.test(lower)) type = "boil_notice";
        else if (/pfas|forever chemical/.test(lower)) type = "pfas_discovery";
        else if (/supply interrupt|no water|low pressure|outage/.test(lower))
          type = "supply_interruption";
        else if (/enforcement|prosecution|penalty|fine/.test(lower))
          type = "enforcement";

        const severity: RawIncident["severity"] =
          type === "boil_notice" ? "critical" : "warning";

        const sourceHash = generateSourceHash("water_company", type, postcodes, today);

        const actionRequired =
          /boil|do not (use|drink)|avoid/.test(lower)
            ? combined
                .split(/[.!?]/)
                .find((s) => /boil|do not|avoid/i.test(s))
                ?.trim() ?? null
            : null;

        const sourceUrl = String(event.link ?? event.url ?? url);

        incidents.push({
          source_hash: sourceHash,
          type,
          severity,
          source: "water_company",
          source_url: sourceUrl,
          supplier_id: SUPPLIER_ID,
          affected_postcodes: postcodes,
          affected_cities: cities,
          households_affected: null,
          action_required: actionRequired,
          raw_description: combined,
          source_data: event as Record<string, unknown>,
        });
      }

      return {
        incidents,
        checks: [
          {
            source: "water_company",
            source_name: SOURCE_NAME,
            status_code: res.status,
            items_found: incidents.length,
            error: null,
          },
        ],
      };
    } catch (err) {
      clearTimeout(timeout);
      // Network/timeout error on this candidate — try the next one
    }
  }

  // All candidate URLs failed or returned non-2xx
  return {
    incidents: [],
    checks: [
      {
        source: "water_company",
        source_name: SOURCE_NAME,
        status_code: null,
        items_found: 0,
        error:
          "No working API endpoint found. All candidate URLs failed or returned non-2xx. Update CANDIDATE_URLS when the correct endpoint is confirmed.",
      },
    ],
  };
}
