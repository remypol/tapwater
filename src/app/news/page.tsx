import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, MapPin } from "lucide-react";
import { BreadcrumbSchema } from "@/components/json-ld";
import { ScrollReveal } from "@/components/scroll-reveal";
import { getAllIncidents } from "@/lib/incidents";
import type { Incident } from "@/lib/incidents-types";
import { INCIDENT_TYPE_LABELS, SEVERITY_CONFIG } from "@/lib/incidents-types";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "UK Water Incident News",
  description:
    "Live UK water incidents, boil notices, supply interruptions, and pollution alerts. Updated automatically from official sources.",
  openGraph: {
    title: "UK Water Incident News",
    description:
      "Live UK water incidents, boil notices, supply interruptions, and pollution alerts.",
    url: "https://www.tapwater.uk/news",
    type: "website",
  },
  alternates: {
    types: {
      "application/rss+xml": "https://www.tapwater.uk/news/rss.xml",
    },
  },
};

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
    month: "short",
    year: "numeric",
  });
}

function ActiveIncidentCard({ incident }: { incident: Incident }) {
  const config = SEVERITY_CONFIG[incident.severity];

  return (
    <Link
      href={`/news/${incident.slug}`}
      className="card block p-5 border-l-4 hover:no-underline group"
      style={{ borderLeftColor: config.color }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded text-white"
              style={{ backgroundColor: config.color }}
            >
              {config.label}
            </span>
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border"
              style={{ color: config.color, borderColor: config.color }}
            >
              Active
            </span>
            <span className="pill text-xs">
              {INCIDENT_TYPE_LABELS[incident.type]}
            </span>
          </div>

          <h2 className="font-semibold text-ink text-base leading-snug group-hover:text-accent transition-colors">
            {incident.title}
          </h2>

          <p className="text-sm text-body mt-1.5 line-clamp-2 leading-relaxed">
            {incident.summary}
          </p>

          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-3">
            {incident.affected_postcodes.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted">
                <MapPin className="w-3 h-3 shrink-0" />
                {incident.affected_postcodes.slice(0, 4).join(", ")}
                {incident.affected_postcodes.length > 4 && (
                  <span className="text-faint">
                    +{incident.affected_postcodes.length - 4} more
                  </span>
                )}
              </span>
            )}
            {incident.households_affected && (
              <span className="text-xs text-muted">
                ~{incident.households_affected.toLocaleString()} households
              </span>
            )}
            <span className="text-xs text-faint ml-auto">
              {timeAgo(incident.detected_at)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ResolvedIncidentCard({ incident }: { incident: Incident }) {
  return (
    <Link
      href={`/news/${incident.slug}`}
      className="card block p-4 opacity-75 hover:opacity-100 transition-opacity group hover:no-underline"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--color-faint)] text-[var(--color-surface)]">
              Resolved
            </span>
            <span className="pill text-xs">
              {INCIDENT_TYPE_LABELS[incident.type]}
            </span>
          </div>
          <h3 className="font-medium text-ink text-sm leading-snug group-hover:text-accent transition-colors">
            {incident.title}
          </h3>
          {incident.affected_postcodes.length > 0 && (
            <p className="flex items-center gap-1 text-xs text-faint mt-1">
              <MapPin className="w-3 h-3 shrink-0" />
              {incident.affected_postcodes.slice(0, 3).join(", ")}
            </p>
          )}
        </div>
        <span className="text-xs text-faint shrink-0">
          {incident.resolved_at
            ? formatDate(incident.resolved_at)
            : formatDate(incident.detected_at)}
        </span>
      </div>
    </Link>
  );
}

export default async function NewsPage() {
  const { incidents } = await getAllIncidents(50);

  const active = incidents.filter((i) => i.status === "active");
  const resolved = incidents.filter((i) => i.status === "resolved");

  return (
    <div className="bg-hero min-h-screen">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8 py-8 lg:py-14">
        <BreadcrumbSchema
          items={[
            { name: "Home", url: "https://www.tapwater.uk" },
            { name: "News", url: "https://www.tapwater.uk/news" },
          ]}
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
          <span className="text-ink font-medium">News</span>
        </nav>

        {/* Header */}
        <header className="mt-6 mb-10">
          <p className="text-xs uppercase tracking-[0.15em] text-accent font-semibold animate-fade-up delay-1">
            Water Alerts
          </p>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-ink tracking-tight mt-2 animate-fade-up delay-2">
            UK Water Incident News
          </h1>
          <p className="text-muted mt-2 max-w-2xl animate-fade-up delay-3">
            Live boil notices, supply interruptions, pollution alerts, and
            enforcement actions from official UK water sources.
          </p>
          <p className="text-xs text-faint mt-2 animate-fade-up delay-4">
            <Link href="/news/rss.xml" className="hover:text-accent transition-colors underline underline-offset-2">
              RSS feed
            </Link>{" "}
            &bull; Refreshed every 5 minutes
          </p>
        </header>

        {/* Active incidents */}
        <ScrollReveal delay={0}>
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl text-ink italic">
                Active incidents
              </h2>
              {active.length > 0 && (
                <span
                  className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded text-white"
                  style={{ backgroundColor: "#dc2626" }}
                >
                  {active.length} live
                </span>
              )}
            </div>

            {active.length > 0 ? (
              <div className="space-y-4">
                {active.map((incident) => (
                  <ActiveIncidentCard key={incident.id} incident={incident} />
                ))}
              </div>
            ) : (
              <div className="card p-8 text-center">
                <p className="text-muted text-sm">No water incidents reported</p>
                <p className="text-faint text-xs mt-1">
                  All areas currently clear
                </p>
              </div>
            )}
          </section>
        </ScrollReveal>

        {/* Resolved incidents */}
        {resolved.length > 0 && (
          <>
            <hr className="border-rule mt-10" />
            <ScrollReveal delay={0}>
              <section className="mt-8">
                <h2 className="font-display text-2xl text-ink italic mb-4">
                  Recently resolved
                </h2>
                <div className="space-y-3">
                  {resolved.map((incident) => (
                    <ResolvedIncidentCard
                      key={incident.id}
                      incident={incident}
                    />
                  ))}
                </div>
              </section>
            </ScrollReveal>
          </>
        )}

        {/* Footer */}
        <footer className="mt-10 pb-4 text-sm text-faint leading-relaxed border-t border-[var(--color-rule)] pt-6">
          Incidents sourced from water company announcements, the Environment
          Agency, and the Drinking Water Inspectorate. Data updated automatically
          every 5 minutes.
        </footer>
      </div>
    </div>
  );
}
