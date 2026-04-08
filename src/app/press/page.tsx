import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Download, ExternalLink, Mail, Copy } from "lucide-react";
import { BreadcrumbSchema } from "@/components/json-ld";
import { getAllStoryData } from "@/lib/press-data";
import type { PressStoryData } from "@/lib/press-data";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Press & Media",
  description:
    "Download UK water quality data, logos, and media assets. Free data stories with CSVs for journalists and bloggers. Just link back.",
  openGraph: {
    title: "Press & Media | TapWater.uk",
    description:
      "Download UK water quality data, logos, and media assets. Free data stories for journalists and bloggers.",
    url: "https://www.tapwater.uk/press",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Press & Media | TapWater.uk",
    description:
      "Download UK water quality data, logos, and media assets. Free data stories for journalists and bloggers.",
  },
};

// ── Colour accent per story ──

const STORY_ACCENTS: Record<string, { bar: string; stat: string; badge: string }> = {
  "worst-lead":       { bar: "bg-[var(--color-danger)]",  stat: "text-[var(--color-danger)]",  badge: "bg-[var(--color-danger-light)] text-[var(--color-danger)]" },
  "worst-nitrate":    { bar: "bg-[var(--color-warning)]", stat: "text-[var(--color-warning)]", badge: "bg-[var(--color-warning-light)] text-[var(--color-warning)]" },
  "most-pfas":        { bar: "bg-[#7c3aed]",              stat: "text-[#7c3aed]",              badge: "bg-[var(--color-pfas-light)] text-[#7c3aed]" },
  "hardest-water":    { bar: "bg-[var(--color-accent)]",  stat: "text-[var(--color-accent)]",  badge: "bg-[var(--color-accent-light)] text-[var(--color-accent)]" },
  "best-worst-overall": { bar: "bg-[var(--color-safe)]",  stat: "text-[var(--color-safe)]",    badge: "bg-[var(--color-safe-light)] text-[var(--color-safe)]" },
};

const STORY_LABELS: Record<string, string> = {
  "worst-lead":         "Lead",
  "worst-nitrate":      "Nitrate",
  "most-pfas":          "PFAS",
  "hardest-water":      "Hardness",
  "best-worst-overall": "Safety Score",
};

// ── Story card ──

function StoryCard({ story }: { story: PressStoryData }) {
  const accent = STORY_ACCENTS[story.slug] ?? STORY_ACCENTS["worst-lead"];
  const label = STORY_LABELS[story.slug] ?? "Data";
  const previewEntries = story.entries.slice(0, 5);

  return (
    <article className="card flex flex-col overflow-hidden">
      {/* Coloured top bar */}
      <div className={`h-[3px] w-full ${accent.bar}`} />

      <div className="flex flex-col flex-1 p-7 gap-6">
        {/* Topic pill + headline */}
        <div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider ${accent.badge}`}>
            {label}
          </span>
          <h3 className="font-display text-2xl text-ink mt-3 leading-snug">
            {story.headline}
          </h3>
        </div>

        {/* Lede — editorial hook */}
        <p className="text-body text-sm leading-relaxed">
          {story.lede}
        </p>

        {/* Key stat — within narrative */}
        <div className={`border-l-[3px] pl-4`} style={{ borderColor: `var(--color-rule)` }}>
          <p className={`font-data text-4xl font-bold ${accent.stat}`}>
            {story.keyStat}
          </p>
          <p className="text-xs text-muted mt-1 leading-tight">
            {story.keyStatLabel}
          </p>
        </div>

        {/* Context paragraph */}
        <p className="text-muted text-xs leading-relaxed border-t border-[var(--color-rule)] pt-5">
          {story.context}
        </p>

        {/* Top 5 preview */}
        <div className="space-y-0">
          <p className="text-[10px] uppercase tracking-[0.12em] text-faint font-semibold mb-2">
            Top {previewEntries.length}
          </p>
          {previewEntries.map((entry) => (
            <div
              key={entry.rank}
              className="flex items-baseline justify-between gap-3 py-2 border-b border-[var(--color-rule)] last:border-b-0"
            >
              <div className="flex items-baseline gap-2.5 min-w-0">
                <span className="font-data text-[11px] text-faint w-4 shrink-0 tabular-nums">
                  {entry.rank}.
                </span>
                <div className="min-w-0">
                  <span className="text-sm font-semibold text-ink">
                    {entry.label}
                  </span>
                  <span className="text-xs text-muted ml-1.5">
                    {entry.location.replace(/^(BEST|WORST) — /, "")}
                  </span>
                </div>
              </div>
              <span className={`font-data text-xs font-bold shrink-0 tabular-nums ${accent.stat}`}>
                {entry.value}
              </span>
            </div>
          ))}
          {story.entries.length > 5 && (
            <p className="text-xs text-faint pt-2">
              + {story.entries.length - 5} more in the full dataset
            </p>
          )}
        </div>

        {/* Methodology note */}
        <p className="text-[11px] text-faint leading-relaxed italic">
          {story.methodology}
        </p>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions row */}
        <div className="flex items-center gap-3 flex-wrap border-t border-[var(--color-rule)] pt-5">
          <a
            href={`/api/press/data/${story.slug}`}
            download
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--color-ink)] text-white text-xs font-semibold hover:bg-[var(--color-btn-hover)] transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download CSV
          </a>
          <Link
            href={story.rankingsLink}
            className="inline-flex items-center gap-1 text-xs text-accent font-medium hover:underline underline-offset-2"
          >
            View full rankings
            <ExternalLink className="w-3 h-3" />
          </Link>

          {/* Cite this — details/summary */}
          <details className="group ml-auto">
            <summary className="cursor-pointer list-none flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors select-none">
              <Copy className="w-3 h-3" />
              <span>Cite this</span>
              <ChevronRight className="w-3 h-3 transition-transform group-open:rotate-90" />
            </summary>
            <div className="absolute mt-2 max-w-sm p-3 rounded-lg bg-[var(--color-wash)] border border-[var(--color-rule)] z-10 shadow-lg">
              <p className="font-data text-[11px] text-muted leading-relaxed whitespace-pre-wrap">
                {story.citation}
              </p>
            </div>
          </details>
        </div>

        {/* Last updated */}
        <p className="text-[10px] text-faint">
          Data last refreshed: {story.lastUpdated}
        </p>
      </div>
    </article>
  );
}

// ── Colour swatch ──

function ColourSwatch({
  hex,
  name,
  usage,
}: {
  hex: string;
  name: string;
  usage: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <div
        className="w-10 h-10 rounded-xl shrink-0 shadow-sm border border-[var(--color-rule)]"
        style={{ background: hex }}
      />
      <div>
        <p className="text-sm font-semibold text-ink">{name}</p>
        <p className="font-data text-xs text-faint">{hex}</p>
        <p className="text-xs text-muted">{usage}</p>
      </div>
    </div>
  );
}

// ── Code block ──

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="font-data text-[12px] bg-[var(--color-ink)] text-[#a3dced] rounded-xl p-4 overflow-x-auto leading-relaxed border border-[var(--color-rule)] whitespace-pre-wrap break-all">
      {code}
    </pre>
  );
}

// ── Page ──

export default async function PressPage() {
  const stories = await getAllStoryData();
  const year = new Date().getFullYear();

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Press & Media | TapWater.uk",
    description:
      "Download UK water quality data, logos, and media assets. Free data stories for journalists and bloggers.",
    url: "https://www.tapwater.uk/press",
    about: {
      "@type": "Organization",
      name: "TapWater.uk",
      url: "https://www.tapwater.uk",
    },
  };

  const badgeEmbedCode = `<a href="https://www.tapwater.uk" target="_blank" rel="noopener">
  <img src="https://www.tapwater.uk/press/badge.svg" alt="Data from TapWater.uk" height="28">
</a>`;

  const widgetEmbedCode = `<script src="https://www.tapwater.uk/widget.js" async></script>`;

  const citationText = `TapWater.uk. "UK Water Quality Data." https://www.tapwater.uk.
Based on Environment Agency Water Quality Archive data. ${year}.`;

  return (
    <div className="bg-hero min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Press", url: "https://www.tapwater.uk/press" },
        ]}
      />

      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8 py-8 lg:py-14">

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-faint">
          <Link href="/" className="hover:text-accent transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-ink font-medium">Press</span>
        </nav>

        {/* ── Section 1: Hero ── */}
        <header className="mt-8 mb-14">
          <p className="text-xs uppercase tracking-[0.18em] text-accent font-semibold animate-fade-up delay-1">
            Media &amp; Press
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-ink tracking-tight mt-3 max-w-3xl animate-fade-up delay-2">
            Data for the public interest
          </h1>
          <p className="text-lg text-muted mt-4 max-w-2xl leading-relaxed animate-fade-up delay-3">
            Download UK water quality data, embed our tools, or cite our research.
            Just link back.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 sm:items-start animate-fade-up delay-4">
            {/* Press contact */}
            <div className="card p-5 sm:max-w-xs">
              <p className="text-xs text-muted uppercase tracking-wider mb-1">Press contact</p>
              <a
                href="mailto:press@tapwater.uk"
                className="inline-flex items-center gap-2 text-accent font-semibold hover:underline underline-offset-2 text-sm"
              >
                <Mail className="w-4 h-4" />
                press@tapwater.uk
              </a>
            </div>

            {/* About boilerplate */}
            <div className="card p-5 flex-1 sm:max-w-xl">
              <p className="text-xs text-muted uppercase tracking-wider mb-2">About TapWater.uk</p>
              <p className="text-sm text-body leading-relaxed">
                TapWater.uk provides independent water quality analysis for every UK
                postcode, based on Environment Agency and Drinking Water Inspectorate
                data. We test for PFAS, lead, nitrate, and 17 other contaminants.
                Our data is free to use — all we ask is attribution.
              </p>
            </div>
          </div>
        </header>

        <hr className="border-rule" />

        {/* ── Section 2: Data Stories ── */}
        <section className="mt-10">
          <div className="flex items-baseline justify-between gap-4 mb-2">
            <h2 className="font-display text-3xl text-ink italic">
              Data stories
            </h2>
            <span className="text-sm text-muted hidden sm:block">
              Live data · updated daily
            </span>
          </div>
          <p className="text-muted mb-8 max-w-2xl">
            Ready-made stories with downloadable CSV data and citation text.
            Each dataset is updated daily from government sources.
          </p>

          {stories.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {stories.map((story) => (
                <StoryCard key={story.slug} story={story} />
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <p className="text-muted">
                Data stories loading — check back shortly.
              </p>
            </div>
          )}
        </section>

        <hr className="border-rule mt-14" />

        {/* ── Section 3: Media Kit ── */}
        <section className="mt-10">
          <h2 className="font-display text-3xl text-ink italic mb-2">
            Media kit
          </h2>
          <p className="text-muted mb-8 max-w-2xl">
            Brand assets for articles, blog posts, and social media.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Logos */}
            <div className="lg:col-span-1">
              <h3 className="text-sm font-semibold text-ink uppercase tracking-wider mb-4">
                Logo files
              </h3>
              <div className="space-y-3">
                {/* Dark variant preview */}
                <div className="card overflow-hidden">
                  <div className="p-5 bg-[#0c0f17] flex items-center justify-center min-h-[80px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/press/tapwater-logo-dark.svg"
                      alt="TapWater.uk logo — dark variant"
                      height={40}
                    />
                  </div>
                  <div className="px-4 py-3 border-t border-[var(--color-rule)] flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium text-ink">Dark variant</p>
                      <p className="text-[11px] text-muted">For dark backgrounds</p>
                    </div>
                    <a
                      href="/press/tapwater-logo-dark.svg"
                      download
                      className="inline-flex items-center gap-1 text-xs text-accent font-medium hover:underline underline-offset-2"
                    >
                      <Download className="w-3 h-3" />
                      SVG
                    </a>
                  </div>
                </div>

                {/* Light variant preview */}
                <div className="card overflow-hidden">
                  <div className="p-5 bg-white flex items-center justify-center min-h-[80px] border-b border-[var(--color-rule)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/press/tapwater-logo-light.svg"
                      alt="TapWater.uk logo — light variant"
                      height={40}
                    />
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium text-ink">Light variant</p>
                      <p className="text-[11px] text-muted">For light backgrounds</p>
                    </div>
                    <a
                      href="/press/tapwater-logo-light.svg"
                      download
                      className="inline-flex items-center gap-1 text-xs text-accent font-medium hover:underline underline-offset-2"
                    >
                      <Download className="w-3 h-3" />
                      SVG
                    </a>
                  </div>
                </div>

                <p className="text-xs text-muted leading-relaxed px-1">
                  SVG format — open in any browser or design tool. Do not alter colours or proportions.
                </p>
              </div>
            </div>

            {/* Brand colours */}
            <div>
              <h3 className="text-sm font-semibold text-ink uppercase tracking-wider mb-4">
                Brand colours
              </h3>
              <div className="card p-5 space-y-5">
                <ColourSwatch hex="#0891b2" name="Accent" usage="Links, highlights, interactive" />
                <ColourSwatch hex="#16a34a" name="Safe" usage="Good water quality signal" />
                <ColourSwatch hex="#d97706" name="Warning" usage="Near-limit contaminant signal" />
                <ColourSwatch hex="#dc2626" name="Danger" usage="Over-limit contaminant signal" />
                <ColourSwatch hex="#7c3aed" name="PFAS" usage="Forever chemicals marker" />
                <ColourSwatch hex="#0c0f17" name="Ink" usage="Headings, body text" />
              </div>
            </div>

            {/* Typography */}
            <div>
              <h3 className="text-sm font-semibold text-ink uppercase tracking-wider mb-4">
                Typography
              </h3>
              <div className="card p-5 space-y-6">
                <div>
                  <p className="font-display text-2xl text-ink italic">
                    Instrument Serif
                  </p>
                  <p className="text-xs text-muted mt-1">Display headings — editorial gravitas</p>
                  <p className="text-xs text-faint font-data mt-0.5">font-display</p>
                </div>
                <div className="border-t border-[var(--color-rule)] pt-5">
                  <p className="text-base text-ink font-semibold">
                    DM Sans
                  </p>
                  <p className="text-xs text-muted mt-1">Body text, UI elements — clean and readable</p>
                  <p className="text-xs text-faint font-data mt-0.5">font-sans</p>
                </div>
                <div className="border-t border-[var(--color-rule)] pt-5">
                  <p className="font-data text-base text-ink">
                    Space Mono
                  </p>
                  <p className="text-xs text-muted mt-1">Data values, numbers — monospaced precision</p>
                  <p className="text-xs text-faint font-data mt-0.5">font-data</p>
                </div>
              </div>
            </div>

          </div>
        </section>

        <hr className="border-rule mt-14" />

        {/* ── Section 4: Embed & Cite ── */}
        <section className="mt-10 mb-12">
          <h2 className="font-display text-3xl text-ink italic mb-2">
            Embed &amp; cite
          </h2>
          <p className="text-muted mb-8 max-w-2xl">
            Add our widget to any page, or use the attribution badge and citation text.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Widget embed */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">
                Postcode widget
              </h3>
              <p className="text-sm text-body leading-relaxed">
                Add a live water quality lookup to any page. Visitors can search any UK postcode and see safety scores, lead, nitrate, and PFAS data.
                Attribution is built in — the widget footer always reads &ldquo;Data from TapWater.uk&rdquo;.
              </p>
              <CodeBlock code={widgetEmbedCode} />
              <Link
                href="/widget"
                className="inline-flex items-center gap-1.5 text-sm text-accent font-medium hover:underline underline-offset-2"
              >
                Preview the widget
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Badge + citation */}
            <div className="space-y-8">
              {/* Attribution badge */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">
                  Attribution badge
                </h3>
                <p className="text-sm text-body leading-relaxed">
                  Add this badge wherever you use our data. It links back to TapWater.uk automatically.
                </p>
                <div className="card p-4 flex items-center gap-4 flex-wrap">
                  <div className="p-3 rounded-lg bg-[var(--color-wash)] border border-[var(--color-rule)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/press/badge.svg"
                      alt="Data from TapWater.uk badge"
                      height={28}
                    />
                  </div>
                  <p className="text-xs text-muted">Preview of badge.svg</p>
                </div>
                <CodeBlock code={badgeEmbedCode} />
              </div>

              {/* Citation text */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">
                  Citation text
                </h3>
                <p className="text-sm text-body leading-relaxed">
                  Copy-paste this into your article, blog post, or academic citation.
                </p>
                <div className="card p-4 border-l-4 border-l-[var(--color-accent)]">
                  <p className="font-data text-xs text-body leading-relaxed whitespace-pre-wrap">
                    {citationText}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Footer note */}
        <footer className="pb-4 text-sm text-faint leading-relaxed border-t border-[var(--color-rule)] pt-6">
          Data sourced from the Environment Agency Water Quality Archive and the
          Drinking Water Inspectorate. TapWater.uk provides independent analysis
          and is not affiliated with any water company or government body. Press
          enquiries:{" "}
          <a
            href="mailto:press@tapwater.uk"
            className="underline underline-offset-2 hover:text-muted transition-colors"
          >
            press@tapwater.uk
          </a>
          .
        </footer>

      </div>
    </div>
  );
}
