import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronRight,
  MapPin,
  ExternalLink,
  Clock,
  CheckCircle,
  Activity,
  Megaphone,
  Droplets,
} from "lucide-react";
import { BreadcrumbSchema, NewsArticleSchema } from "@/components/json-ld";
import { ScrollToTop } from "@/components/scroll-to-top";
import { PostcodeSearch } from "@/components/postcode-search";
import { getAllIncidentSlugs, getIncidentBySlug } from "@/lib/incidents";
import { getSupplierBySlug } from "@/lib/data";
import { getSupplierIncidentPage } from "@/lib/supplier-incident-pages";
import { INCIDENT_TYPE_LABELS, SEVERITY_CONFIG } from "@/lib/incidents-types";
import { isIncidentIndexable } from "@/lib/incident-indexing";
import { marked } from "marked";
import { notFound } from "next/navigation";
import { OG_IMAGE } from "@/lib/og";

export const revalidate = 300;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllIncidentSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const incident = await getIncidentBySlug(slug);
  if (!incident) return {};

  const title = incident.title;
  const description = incident.summary;
  const url = `https://www.tapwater.uk/news/${slug}`;

  // Stale or thin articles stay live for anyone who lands on them, but are
  // kept out of the index so they cannot dilute the rest of the site. The
  // canonical stays on the page itself in both cases.
  const indexable = isIncidentIndexable(incident);

  return {
    title,
    description,
    robots: indexable ? "max-image-preview:large" : "noindex, follow",
    openGraph: {
      images: OG_IMAGE,
      title,
      description,
      url,
      type: "article",
      publishedTime: incident.detected_at,
      modifiedTime: incident.last_checked,
    },
    twitter: {
      images: OG_IMAGE,
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: url,
      types: {
        "application/rss+xml": "https://www.tapwater.uk/news/rss.xml",
      },
    },
  };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function NewsArticlePage({ params }: Props) {
  const { slug } = await params;
  const incident = await getIncidentBySlug(slug);

  if (!incident) notFound();

  const config = SEVERITY_CONFIG[incident.severity];
  const url = `https://www.tapwater.uk/news/${slug}`;
  const articleHtml = await marked.parse(incident.article_markdown);

  // The supplier's own live page beats our snapshot for "is it fixed yet?".
  // Verified live-incident URLs first, then the supplier's homepage.
  const supplier = incident.supplier_id
    ? await getSupplierBySlug(incident.supplier_id)
    : null;
  const liveIncidentPage = getSupplierIncidentPage(incident.supplier_id);
  const supplierLink = liveIncidentPage ?? supplier?.website ?? null;
  const supplierName = supplier?.name ?? "your water company";
  const isActive = incident.status === "active";

  return (
    <div className="bg-hero min-h-screen">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8 py-8 lg:py-14">
        <BreadcrumbSchema
          items={[
            { name: "Home", url: "https://www.tapwater.uk" },
            { name: "News", url: "https://www.tapwater.uk/news" },
            { name: incident.title, url },
          ]}
        />
        <NewsArticleSchema
          headline={incident.title}
          description={incident.summary}
          url={url}
          datePublished={incident.detected_at}
          dateModified={incident.last_checked}
        />

        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-sm text-faint"
        >
          <Link href="/" className="hover:text-accent transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/news" className="hover:text-accent transition-colors">
            News
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-ink font-medium truncate max-w-[200px] sm:max-w-xs">
            {incident.title}
          </span>
        </nav>

        {/* Layout: editorial + sidebar */}
        <div className="mt-8 lg:grid lg:grid-cols-[1fr_300px] lg:gap-12">
          {/* ── Main editorial column ── */}
          <article>
            {/* Type badge + date */}
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <span
                className="text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded text-white"
                style={{ backgroundColor: config.color }}
              >
                {config.label}
              </span>
              <span className="pill text-xs">
                {INCIDENT_TYPE_LABELS[incident.type]}
              </span>
              {incident.status === "active" ? (
                <span
                  className="text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border"
                  style={{ color: config.color, borderColor: config.color }}
                >
                  Active
                </span>
              ) : (
                <span className="text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border text-[var(--color-faint)] border-[var(--color-rule)]">
                  Resolved
                </span>
              )}
              <time
                dateTime={incident.detected_at}
                className="text-xs text-faint ml-1"
              >
                {formatDate(incident.detected_at)}
              </time>
            </div>

            {/* Source link */}
            {incident.source_url && (
              <a
                href={incident.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-faint hover:text-accent transition-colors mb-4"
              >
                <ExternalLink className="w-3 h-3" />
                Official source
              </a>
            )}

            {/* Headline */}
            <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] text-ink tracking-tight leading-tight mt-2">
              {incident.title}
            </h1>

            {/* Households affected */}
            {incident.households_affected && (
              <p className="text-sm text-muted mt-3">
                Approximately{" "}
                <strong className="text-ink font-semibold">
                  {incident.households_affected.toLocaleString()} households
                </strong>{" "}
                affected
              </p>
            )}

            {/* What you can do now — the useful part for someone with no water */}
            <section
              aria-labelledby="what-you-can-do"
              className="mt-8 rounded-xl border border-[var(--color-rule)] bg-[var(--color-wash)]"
            >
              <div className="px-5 pt-5 pb-3 sm:px-6">
                <h2
                  id="what-you-can-do"
                  className="font-display italic text-2xl text-ink tracking-tight"
                >
                  What you can do now
                </h2>
              </div>

              <ul className="divide-y divide-[var(--color-rule)]">
                {supplierLink && (
                  <li className="flex gap-3 px-5 py-4 sm:px-6">
                    <Activity className="w-4 h-4 mt-0.5 shrink-0 text-accent" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-body leading-relaxed">
                        {liveIncidentPage
                          ? `${supplierName} lists every current problem in its area and updates it as crews report back. It is the fastest way to find out whether this one is fixed.`
                          : `${supplierName} publishes its own updates. Check there before relying on this page.`}
                      </p>
                      <a
                        href={supplierLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
                      >
                        {liveIncidentPage
                          ? `Open ${supplierName}'s live incident page`
                          : `Open ${supplierName}'s website`}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </li>
                )}

                {incident.action_required && (
                  <li className="flex gap-3 px-5 py-4 sm:px-6">
                    <Megaphone
                      className="w-4 h-4 mt-0.5 shrink-0"
                      style={{ color: config.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-body leading-relaxed">
                        The supplier's advice, as published:
                      </p>
                      <p className="mt-1 text-sm font-semibold text-ink leading-relaxed">
                        {incident.action_required}
                      </p>
                    </div>
                  </li>
                )}

                <li className="flex gap-3 px-5 py-4 sm:px-6">
                  <Droplets className="w-4 h-4 mt-0.5 shrink-0 text-accent" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-body leading-relaxed">
                      {isActive
                        ? "Once the water is back, it can run cloudy or taste of chlorine for a day. See what your tap water is normally like and whether your area has a history of problems."
                        : "See what your tap water is normally like and whether your area has a history of problems."}
                    </p>
                    {incident.affected_postcodes.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {incident.affected_postcodes.slice(0, 8).map((postcode) => (
                          <Link
                            key={postcode}
                            href={`/postcode/${postcode}`}
                            className="pill flex items-center gap-1 text-xs"
                          >
                            <MapPin className="w-2.5 h-2.5" />
                            {postcode}
                          </Link>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 max-w-sm">
                      <PostcodeSearch size="sm" />
                    </div>
                  </div>
                </li>
              </ul>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-[var(--color-rule)] px-5 py-3 sm:px-6 text-xs text-faint">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {isActive
                    ? "Last checked against the source"
                    : "Marked resolved"}
                </span>
                <time
                  dateTime={
                    isActive ? incident.last_checked : incident.resolved_at ?? incident.last_checked
                  }
                  className="font-mono text-ink"
                >
                  {formatDate(
                    isActive ? incident.last_checked : incident.resolved_at ?? incident.last_checked,
                  )}
                </time>
              </div>
            </section>

            <hr className="border-rule my-8" />

            {/* Article body */}
            <div
              className="prose prose-neutral dark:prose-invert max-w-none
                prose-headings:font-display prose-headings:tracking-tight prose-headings:text-ink
                prose-h2:text-2xl prose-h2:italic prose-h2:mt-8 prose-h2:mb-3
                prose-h3:text-xl prose-h3:italic prose-h3:mt-6 prose-h3:mb-2
                prose-p:text-body prose-p:leading-relaxed prose-p:text-base
                prose-a:text-accent prose-a:no-underline hover:prose-a:underline
                prose-strong:text-ink prose-strong:font-semibold
                prose-ul:text-body prose-li:text-base prose-li:leading-relaxed
                prose-blockquote:border-l-4 prose-blockquote:border-[var(--color-rule-strong)]
                prose-blockquote:text-muted prose-blockquote:not-italic"
              dangerouslySetInnerHTML={{ __html: articleHtml }}
            />

            {/* Auto-generated notice */}
            <p className="mt-8 text-xs text-faint italic border-t border-[var(--color-rule)] pt-4">
              This article was automatically generated from official incident
              data and last checked against the source{" "}
              <time dateTime={incident.last_checked} className="font-mono not-italic">
                {formatDate(incident.last_checked)}
              </time>
              .
            </p>
          </article>

          {/* ── Sidebar ── */}
          <aside className="mt-10 lg:mt-0 space-y-5">
            {/* Status card */}
            <div className="card p-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-faint mb-3">
                Status
              </h2>
              {incident.status === "active" ? (
                <div className="flex items-start gap-2">
                  <Clock
                    className="w-4 h-4 mt-0.5 shrink-0"
                    style={{ color: config.color }}
                  />
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: config.color }}
                    >
                      Active
                    </p>
                    <p className="text-xs text-faint mt-0.5">
                      Detected {timeAgo(incident.detected_at)}
                    </p>
                    <p className="text-xs text-faint">
                      Checked {timeAgo(incident.last_checked)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-[var(--color-safe)]" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-safe)]">
                      Resolved
                    </p>
                    {incident.resolved_at && (
                      <p className="text-xs text-faint mt-0.5">
                        {timeAgo(incident.resolved_at)}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Affected areas */}
            {incident.affected_postcodes.length > 0 && (
              <div className="card p-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-faint mb-3">
                  Affected areas
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {incident.affected_postcodes.map((postcode) => (
                    <Link
                      key={postcode}
                      href={`/postcode/${postcode}`}
                      className="pill flex items-center gap-1 text-xs"
                    >
                      <MapPin className="w-2.5 h-2.5" />
                      {postcode}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Cities */}
            {incident.affected_cities.length > 0 && (
              <div className="card p-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-faint mb-3">
                  Affected cities
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {incident.affected_cities.map((city) => (
                    <span key={city} className="pill text-xs">
                      {city}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Source */}
            {incident.source_url && (
              <div className="card p-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-faint mb-3">
                  Official source
                </h2>
                <a
                  href={incident.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  View original notice
                </a>
              </div>
            )}

            {/* Back to news */}
            <Link
              href="/news"
              className="block text-sm text-faint hover:text-accent transition-colors"
            >
              &larr; All incidents
            </Link>
          </aside>
        </div>
      </div>
      <ScrollToTop />
    </div>
  );
}
