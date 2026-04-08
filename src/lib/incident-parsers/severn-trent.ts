import type { RawIncident, IncidentType, IncidentSeverity } from "@/lib/incidents-types";
import { generateSourceHash } from "@/lib/incidents";
import { extractPostcodeDistricts, mapPostcodesToCities } from "./postcode-matcher";
import type { SourceCheckResult } from "./water-companies";

const INCIDENTS_URL = "https://www.stwater.co.uk/in-my-area/incidents/";
const SUPPLIER_ID = "severn-trent";
const SOURCE_NAME = "Severn Trent";

function classifyIncident(
  title: string,
  description: string,
): { type: IncidentType; severity: IncidentSeverity } {
  const text = `${title} ${description}`.toLowerCase();

  if (/boil/.test(text)) {
    return { type: "boil_notice", severity: "critical" };
  }
  if (/pfas|forever chemical/.test(text)) {
    return { type: "pfas_discovery", severity: "warning" };
  }
  if (/pollution|contamination|sewage|sewerage/.test(text)) {
    return { type: "pollution", severity: "warning" };
  }
  if (/supply interrupt|no water|low pressure|outage/.test(text)) {
    return { type: "supply_interruption", severity: "info" };
  }
  if (/enforcement|prosecution|penalty|fine/.test(text)) {
    return { type: "enforcement", severity: "warning" };
  }
  return { type: "general", severity: "info" };
}

interface ParsedCard {
  title: string;
  description: string;
  link: string;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function parseIncidentCards(html: string): ParsedCard[] {
  const cards: ParsedCard[] = [];

  // Match common card/article patterns used by water company sites
  // Severn Trent renders incident items as article or div elements with
  // class names containing "incident", "card", or "alert"
  const cardPatterns = [
    /<article[^>]*>([\s\S]*?)<\/article>/gi,
    /<div[^>]+class="[^"]*(?:incident|alert|card|notice)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<li[^>]+class="[^"]*(?:incident|alert|card|notice)[^"]*"[^>]*>([\s\S]*?)<\/li>/gi,
  ];

  for (const pattern of cardPatterns) {
    let match: RegExpExecArray | null;
    const re = new RegExp(pattern.source, pattern.flags);
    while ((match = re.exec(html)) !== null) {
      const block = match[1];

      // Extract title: look for heading tags first, then strong
      const titleMatch =
        /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i.exec(block) ??
        /<strong[^>]*>([\s\S]*?)<\/strong>/i.exec(block);
      const title = titleMatch ? stripTags(titleMatch[1]) : "";

      // Extract description: look for p tags
      const descMatch = /<p[^>]*>([\s\S]*?)<\/p>/i.exec(block);
      const description = descMatch ? stripTags(descMatch[1]) : "";

      // Extract link
      const linkMatch = /href="([^"]+)"/i.exec(block);
      let link = linkMatch ? linkMatch[1] : INCIDENTS_URL;
      if (link.startsWith("/")) {
        link = `https://www.stwater.co.uk${link}`;
      }

      if (title || description) {
        cards.push({ title, description, link });
      }
    }

    // If we found cards with the first matching pattern, stop
    if (cards.length > 0) break;
  }

  return cards;
}

export async function parseSevernTrentIncidents(): Promise<{
  incidents: RawIncident[];
  checks: SourceCheckResult[];
}> {
  const today = new Date().toISOString().split("T")[0];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(INCIDENTS_URL, {
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "User-Agent": "TapWater.uk/1.0 water-quality-monitor",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return {
        incidents: [],
        checks: [
          {
            source: "water_company",
            source_name: SOURCE_NAME,
            status_code: res.status,
            items_found: 0,
            error: `HTTP ${res.status}`,
          },
        ],
      };
    }

    const html = await res.text();
    const cards = parseIncidentCards(html);
    const incidents: RawIncident[] = [];

    for (const card of cards) {
      const combined = `${card.title} ${card.description}`;
      const postcodes = extractPostcodeDistricts(combined);
      const cities = mapPostcodesToCities(postcodes);
      const { type, severity } = classifyIncident(card.title, card.description);
      const sourceHash = generateSourceHash("water_company", type, postcodes, today);

      const actionRequired =
        /boil|do not (use|drink)|avoid/.test(combined.toLowerCase())
          ? combined
              .split(/[.!?]/)
              .find((s) => /boil|do not|avoid/i.test(s))
              ?.trim() ?? null
          : null;

      incidents.push({
        source_hash: sourceHash,
        type,
        severity,
        source: "water_company",
        source_url: card.link,
        supplier_id: SUPPLIER_ID,
        affected_postcodes: postcodes,
        affected_cities: cities,
        households_affected: null,
        action_required: actionRequired,
        raw_description: combined.trim(),
        source_data: card as unknown as Record<string, unknown>,
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
    const msg = err instanceof Error ? err.message : String(err);
    return {
      incidents: [],
      checks: [
        {
          source: "water_company",
          source_name: SOURCE_NAME,
          status_code: null,
          items_found: 0,
          error: msg,
        },
      ],
    };
  }
}
