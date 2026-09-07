/**
 * Indexability rule for automated incident articles.
 *
 * The news system mints an article for every incident it detects, and most of
 * them are thin: 200-300 words of boilerplate about an outage that ended weeks
 * ago. Letting Google index all of them dilutes the whole site. An article is
 * worth indexing only while it is fresh (someone searching "no water redditch"
 * this week can use it) and substantive (it actually says something).
 *
 * The rule is pure so it can be applied identically in generateMetadata, the
 * main sitemap, and the Google News sitemap, and unit-tested without a DB.
 */

import type { IncidentStatus } from "@/lib/incidents-types";

/** How long an active incident's article stays indexable after detection. */
export const ACTIVE_INDEX_WINDOW_DAYS = 14;
/** How long a resolved incident's article stays indexable after resolution. */
export const RESOLVED_INDEX_WINDOW_DAYS = 7;
/** Minimum body length for an article to count as substantive. */
export const MIN_INDEXABLE_WORDS = 250;
/** Google News sitemaps may only list articles published in the last 48 hours. */
export const NEWS_SITEMAP_WINDOW_HOURS = 48;

/**
 * Phrases the article generator falls back to when the source gave it nothing
 * to say. An article containing any of these is padding, not reporting.
 */
export const THIN_FILLER_PHRASES = [
  "further details are limited",
  "details are limited",
  "not yet been confirmed",
  "no further details",
] as const;

/** The subset of an Incident the rule needs; keeps sitemap queries narrow. */
export interface IndexableIncidentFields {
  status: IncidentStatus;
  detected_at: string;
  resolved_at: string | null;
  last_checked: string;
  article_markdown: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Count words in markdown, ignoring heading markers, list bullets and emphasis. */
export function countWords(markdown: string): number {
  const text = markdown
    .replace(/[#*_>`~-]+/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .trim();
  if (!text) return 0;
  return text.split(/\s+/).length;
}

/** True when the article leans on one of the generator's filler phrases. */
export function hasThinFiller(markdown: string): boolean {
  const lower = markdown.toLowerCase();
  return THIN_FILLER_PHRASES.some((phrase) => lower.includes(phrase));
}

/** Substance test shared by the active and resolved branches. */
export function isSubstantive(markdown: string): boolean {
  return countWords(markdown) >= MIN_INDEXABLE_WORDS && !hasThinFiller(markdown);
}

function withinDays(iso: string | null, days: number, now: Date): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  const age = now.getTime() - t;
  return age >= 0 && age <= days * DAY_MS;
}

/**
 * Active incidents are indexable for 14 days after detection; resolved ones for
 * 7 days after resolution. Both also require a substantive article body.
 */
export function isIncidentIndexable(
  incident: IndexableIncidentFields,
  now: Date = new Date(),
): boolean {
  if (!isSubstantive(incident.article_markdown)) return false;

  if (incident.status === "active") {
    return withinDays(incident.detected_at, ACTIVE_INDEX_WINDOW_DAYS, now);
  }
  return withinDays(incident.resolved_at, RESOLVED_INDEX_WINDOW_DAYS, now);
}

/**
 * Google News sitemap eligibility: indexable by the rule above AND published
 * within the last 48 hours, per Google's News sitemap specification.
 */
export function isNewsSitemapEligible(
  incident: IndexableIncidentFields,
  now: Date = new Date(),
): boolean {
  if (!isIncidentIndexable(incident, now)) return false;
  const published = new Date(incident.detected_at).getTime();
  return now.getTime() - published <= NEWS_SITEMAP_WINDOW_HOURS * 60 * 60 * 1000;
}

/**
 * Honest lastModified for sitemaps: the most recent of the timestamps the
 * incident actually carries, never "now".
 */
export function getIncidentLastModified(incident: IndexableIncidentFields): Date {
  const candidates = [incident.last_checked, incident.resolved_at, incident.detected_at]
    .filter((v): v is string => Boolean(v))
    .map((v) => new Date(v).getTime())
    .filter((t) => !Number.isNaN(t));
  return new Date(Math.max(...candidates));
}
