import type { RawIncident, IncidentType, IncidentSeverity } from "@/lib/incidents-types";
import { generateSourceHash } from "@/lib/incidents";
import { extractPostcodeDistricts, mapPostcodesToCities } from "./postcode-matcher";

export interface WaterCompanyFeed {
  supplierId: string;
  name: string;
  feedUrl: string;
}

export interface SourceCheckResult {
  source: string;
  source_name: string;
  status_code: number | null;
  items_found: number;
  error: string | null;
}

export const WATER_COMPANY_FEEDS: WaterCompanyFeed[] = [
  {
    supplierId: "thames-water",
    name: "Thames Water",
    feedUrl: "https://www.thameswater.co.uk/api/incidents/live",
  },
  {
    supplierId: "united-utilities",
    name: "United Utilities",
    feedUrl: "https://www.unitedutilities.com/api/service-updates",
  },
  {
    supplierId: "severn-trent",
    name: "Severn Trent",
    feedUrl: "https://www.stwater.co.uk/api/incidents",
  },
  {
    supplierId: "yorkshire-water",
    name: "Yorkshire Water",
    feedUrl: "https://www.yorkshirewater.com/api/service-updates",
  },
  {
    supplierId: "anglian-water",
    name: "Anglian Water",
    feedUrl: "https://www.anglianwater.co.uk/api/incidents",
  },
  {
    supplierId: "southern-water",
    name: "Southern Water",
    feedUrl: "https://www.southernwater.co.uk/api/incidents",
  },
  {
    supplierId: "south-west-water",
    name: "South West Water",
    feedUrl: "https://www.southwestwater.co.uk/api/incidents",
  },
  {
    supplierId: "welsh-water",
    name: "Welsh Water",
    feedUrl: "https://www.dwrcymru.com/api/incidents",
  },
  {
    supplierId: "northumbrian-water",
    name: "Northumbrian Water",
    feedUrl: "https://www.nwl.co.uk/api/incidents",
  },
  {
    supplierId: "scottish-water",
    name: "Scottish Water",
    feedUrl: "https://www.scottishwater.co.uk/api/incidents",
  },
];

function classifyIncident(title: string, description: string): {
  type: IncidentType;
  severity: IncidentSeverity;
} {
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

interface FeedItem {
  title?: string;
  description?: string;
  link?: string;
  content?: string;
  [key: string]: unknown;
}

function parseFeedItems(body: string, feedUrl: string): FeedItem[] {
  // Try JSON first
  try {
    const json = JSON.parse(body) as unknown;
    if (Array.isArray(json)) return json as FeedItem[];
    const obj = json as Record<string, unknown>;
    for (const key of ["incidents", "items", "updates", "results", "data"]) {
      if (Array.isArray(obj[key])) return obj[key] as FeedItem[];
    }
    return [obj as FeedItem];
  } catch {
    // Fall through to RSS/XML parsing
  }

  // Simple RSS/XML regex parser — no external lib
  const items: FeedItem[] = [];
  const itemPattern = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  const tagPattern = /<(\w+)[^>]*>([\s\S]*?)<\/\1>/gi;

  let itemMatch: RegExpExecArray | null;
  while ((itemMatch = itemPattern.exec(body)) !== null) {
    const itemContent = itemMatch[1];
    const item: FeedItem = {};
    let tagMatch: RegExpExecArray | null;
    const tagRe = new RegExp(tagPattern.source, "gi");
    while ((tagMatch = tagRe.exec(itemContent)) !== null) {
      const tagName = tagMatch[1].toLowerCase();
      const tagValue = tagMatch[2]
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
        .trim();
      item[tagName] = tagValue;
    }
    if (item.title || item.description) items.push(item);
  }

  return items;
}

function itemToRawIncident(
  item: FeedItem,
  feed: WaterCompanyFeed,
  today: string,
): RawIncident | null {
  const title = String(item.title ?? item.heading ?? "");
  const description = String(
    item.description ?? item.content ?? item.body ?? item.detail ?? "",
  );
  const combined = `${title} ${description}`;

  if (!title && !description) return null;

  const postcodes = extractPostcodeDistricts(combined);
  const cities = mapPostcodesToCities(postcodes);
  const { type, severity } = classifyIncident(title, description);
  const sourceHash = generateSourceHash(
    "water_company",
    type,
    postcodes,
    today,
  );

  const actionKeywords =
    /boil|do not (use|drink)|avoid/.test(combined.toLowerCase())
      ? combined
          .split(/[.!?]/)
          .find((s) => /boil|do not|avoid/i.test(s))
          ?.trim() ?? null
      : null;

  return {
    source_hash: sourceHash,
    type,
    severity,
    source: "water_company",
    source_url:
      String(item.link ?? item.url ?? item.href ?? feed.feedUrl),
    supplier_id: feed.supplierId,
    affected_postcodes: postcodes,
    affected_cities: cities,
    households_affected: null,
    action_required: actionKeywords,
    raw_description: combined.trim(),
    source_data: item as Record<string, unknown>,
  };
}

export async function parseWaterCompanyFeeds(): Promise<{
  incidents: RawIncident[];
  checks: SourceCheckResult[];
}> {
  const incidents: RawIncident[] = [];
  const checks: SourceCheckResult[] = [];
  const today = new Date().toISOString().split("T")[0];

  for (const feed of WATER_COMPANY_FEEDS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
      const res = await fetch(feed.feedUrl, {
        signal: controller.signal,
        headers: { Accept: "application/json, application/rss+xml, text/xml, */*" },
      });

      clearTimeout(timeout);
      const body = await res.text();
      const items = parseFeedItems(body, feed.feedUrl);
      const parsed: RawIncident[] = [];

      for (const item of items) {
        const raw = itemToRawIncident(item, feed, today);
        if (raw) parsed.push(raw);
      }

      incidents.push(...parsed);
      checks.push({
        source: "water_company",
        source_name: feed.name,
        status_code: res.status,
        items_found: parsed.length,
        error: null,
      });
    } catch (err) {
      clearTimeout(timeout);
      const msg = err instanceof Error ? err.message : String(err);
      checks.push({
        source: "water_company",
        source_name: feed.name,
        status_code: null,
        items_found: 0,
        error: msg,
      });
    }
  }

  return { incidents, checks };
}

export async function isIncidentStillActive(
  feedUrl: string,
  sourceData: Record<string, unknown>,
): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(feedUrl, {
      signal: controller.signal,
      headers: { Accept: "application/json, application/rss+xml, text/xml, */*" },
    });
    clearTimeout(timeout);

    if (!res.ok) return false;

    const body = await res.text();
    const id = String(sourceData.id ?? sourceData.incidentId ?? "");
    if (!id) return false;

    return body.includes(id);
  } catch {
    clearTimeout(timeout);
    // On network error, assume still active to avoid false resolution
    return true;
  }
}
