import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, MapPin, Building2, ExternalLink } from "lucide-react";
import { WaterDropScore } from "@/components/water-drop-score";
import { ScrollReveal } from "@/components/scroll-reveal";
import { StatCards } from "@/components/stat-cards";
import { PfasBanner } from "@/components/pfas-banner";
import { ContaminantTable } from "@/components/contaminant-table";
import { EmailCapture } from "@/components/email-capture";
import { StickyScore, ScoreSentinel } from "@/components/sticky-score";
import { getPostcodeData, getAllPostcodeDistricts } from "@/lib/data";
import { getScoreColor } from "@/lib/types";
import { PostcodeDatasetSchema, BreadcrumbSchema } from "@/components/json-ld";

interface Props {
  params: Promise<{ district: string }>;
}

export function generateStaticParams() {
  return getAllPostcodeDistricts().map((district) => ({ district }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { district } = await params;
  const data = getPostcodeData(district);
  if (!data) return { title: "Not Found" };

  const description = `Check tap water quality in ${data.district}. ${data.contaminantsTested} contaminants tested. PFAS levels, lead, nitrate & more. Free 2026 report for ${data.areaName}.`;

  return {
    title: `${data.district} Water Quality: Is It Safe? | ${data.areaName} 2026`,
    description,
    openGraph: {
      title: `${data.district} Water Quality: Is It Safe?`,
      description,
      url: `https://tapwater.uk/postcode/${data.district}/`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${data.district} Water Quality: Is It Safe?`,
      description,
    },
    other: {
      "geo.position": `${data.latitude};${data.longitude}`,
      "geo.placename": `${data.areaName}, ${data.region}`,
      "geo.region": "GB",
      "ICBM": `${data.latitude}, ${data.longitude}`,
    },
  };
}

const GRADIENT_CLASS = {
  safe: "bg-score-safe",
  warning: "bg-score-warning",
  danger: "bg-score-danger",
} as const;

function getTrendNote(historicalScores: { year: number; score: number }[]): string {
  if (historicalScores.length < 2) return "";
  const oldest = historicalScores[0].score;
  const newest = historicalScores[historicalScores.length - 1].score;
  const delta = newest - oldest;
  if (delta > 0.5) return "Water quality has improved over the past 6 years.";
  if (delta < -0.5) return "Water quality has declined — worth monitoring.";
  return "Water quality has remained stable.";
}

function getScoreBadgeColor(score: number): string {
  const color = getScoreColor(score);
  if (color === "safe") return "text-[var(--color-safe)]";
  if (color === "warning") return "text-[var(--color-warning)]";
  return "text-[var(--color-danger)]";
}

export default async function PostcodePage({ params }: Props) {
  const { district } = await params;
  const data = getPostcodeData(district);
  if (!data) notFound();

  const hasData = data.safetyScore >= 0;
  const scoreColor = hasData ? getScoreColor(data.safetyScore) : "safe";
  const gradientClass = GRADIENT_CLASS[scoreColor];

  // Pre-fetch nearby postcode data for the enriched nearby section
  const nearbyData = data.nearbyPostcodes.map((pc) => ({
    code: pc,
    data: getPostcodeData(pc),
  }));

  return (
    <div className={gradientClass}>
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8 py-8 lg:py-12">
        <PostcodeDatasetSchema
          district={data.district}
          areaName={data.areaName}
          city={data.city}
          region={data.region}
          latitude={data.latitude}
          longitude={data.longitude}
          supplier={data.supplier}
          score={data.safetyScore}
          lastUpdated={data.lastUpdated}
          contaminantsTested={data.contaminantsTested}
          readings={data.readings}
        />
        <BreadcrumbSchema
          items={[
            { name: "Home", url: "https://tapwater.uk" },
            { name: data.region, url: `https://tapwater.uk/postcode/${data.district}/` },
            { name: data.areaName, url: `https://tapwater.uk/postcode/${data.district}/` },
            { name: data.district, url: `https://tapwater.uk/postcode/${data.district}/` },
          ]}
        />
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-faint">
          <Link href="/" className="hover:text-accent transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-ink font-medium">{data.district}</span>
        </nav>

        {/* Header */}
        <header className="mt-6">
          <p className="text-xs uppercase tracking-[0.15em] text-accent font-semibold flex items-center gap-1.5 animate-fade-up delay-1">
            <MapPin className="w-3 h-3" />
            {data.city}, {data.region}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-ink tracking-tight mt-2 animate-fade-up delay-2">
            Your water in {data.district}
          </h1>
          <p className="text-muted mt-1 animate-fade-up delay-3">
            {data.areaName === data.city ? data.city : `${data.areaName}, ${data.city}`}
          </p>
        </header>

        {hasData ? (
          <>
            {/* Sticky mobile score bar — appears once score ring scrolls out of view */}
            <StickyScore
              district={data.district}
              areaName={data.areaName}
              score={data.safetyScore}
            />

            {/* Score */}
            <div className="flex justify-center py-8 lg:py-14 animate-fade-in delay-3">
              <div className="block sm:hidden">
                <WaterDropScore score={data.safetyScore} size={150} tested={data.contaminantsTested} flagged={data.contaminantsFlagged} />
              </div>
              <div className="hidden sm:block">
                <WaterDropScore score={data.safetyScore} size={200} tested={data.contaminantsTested} flagged={data.contaminantsFlagged} />
              </div>
            </div>

            {/* Sentinel: triggers sticky bar once scrolled past */}
            <ScoreSentinel />

            {/* Stat Cards */}
            <StatCards
              contaminantsTested={data.contaminantsTested}
              contaminantsFlagged={data.contaminantsFlagged}
              supplier={data.supplier}
              supplierId={data.supplierId}
              lastUpdated={data.lastUpdated}
            />

            {/* PFAS Banner */}
            {data.pfasDetected && (
              <div className="mt-6">
                <PfasBanner
                  detected={data.pfasDetected}
                  level={data.pfasLevel}
                  postcode={data.district}
                />
              </div>
            )}

            {/* Summary — GEO-optimised for AI citation */}
            <div className="mt-10 max-w-3xl">
              <p className="text-base text-body leading-relaxed">
                Based on government water tests, your water in{" "}
                {data.district} ({data.areaName}) is supplied by{" "}
                <Link href={`/supplier/${data.supplierId}/`} className="font-medium text-ink hover:text-accent transition-colors">
                  {data.supplier}
                </Link>
                . Based on the latest data (last sampled {data.lastSampleDate}),{" "}
                <span className="font-data">{data.contaminantsTested}</span> things
                were tested with{" "}
                <span className="font-data">{data.contaminantsFlagged}</span> exceeding
                recommended levels.{" "}
                The overall water quality score for {data.district} is{" "}
                <span className="font-data font-bold">{data.safetyScore}/10</span>
                {data.pfasDetected && data.pfasLevel != null && (
                  <>
                    . PFAS (forever chemicals) were detected at{" "}
                    <span className="font-data">{data.pfasLevel}</span> µg/L in
                    nearby environmental monitoring — the UK currently has no
                    legal limit for PFAS in drinking water
                  </>
                )}
                .
              </p>
            </div>

            {/* Data provenance — transparency about where this comes from */}
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5 bg-wash border border-rule rounded-full px-3 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-safe" />
                Environment Agency data
              </span>
              <span>Last sampled: <span className="font-data text-ink">{data.lastSampleDate}</span></span>
              <span>·</span>
              <span>Environmental water (rivers, groundwater) — not treated tap water</span>
              <Link href="/about/data-sources" className="text-accent hover:underline">
                How we score
              </Link>
            </div>

            <hr className="border-rule mt-10" />

            {/* Contaminant Data */}
            <ScrollReveal delay={0}>
              <section id="what-we-found" className="bg-surface -mx-5 px-5 py-8 mt-0 scroll-mt-20">
                <h2 className="font-display text-2xl text-ink italic">
                  What we found
                </h2>
                <p className="text-sm text-muted mt-1 mb-5">
                  Here&apos;s what government tests found in water near you.
                </p>
                <ContaminantTable readings={data.readings} />
              </section>
            </ScrollReveal>

            <hr className="border-rule" />

            {/* Trend Chart — simple bar visualisation */}
            <ScrollReveal delay={100}>
              <section className="mt-8">
                <h2 className="font-display text-2xl text-ink italic">
                  How it&apos;s changed
                </h2>
                <p className="text-sm text-muted mt-1">
                  {data.district}{" "}quality score, 2020&ndash;2026
                </p>
                <div className="card-elevated mt-4 p-6 flex flex-col items-center justify-center" style={{ minHeight: 240 }}>
                  {(() => {
                    const maxScore = Math.max(...data.historicalScores.map((h) => h.score), 1);
                    const maxBarHeight = 140;
                    return (
                      <div className="flex items-end gap-2">
                        {data.historicalScores.map((h) => {
                          const height = Math.max(28, (h.score / maxScore) * maxBarHeight);
                          const colorBase =
                            h.score >= 7
                              ? "var(--color-safe)"
                              : h.score >= 5
                                ? "var(--color-warning)"
                                : "var(--color-danger)";
                          return (
                            <div key={h.year} className="flex flex-col items-center gap-1.5">
                              <span className="font-data text-[11px] font-medium text-faint">{h.score}</span>
                              <div
                                className="w-8 sm:w-10 rounded-md"
                                style={{
                                  height,
                                  background: `linear-gradient(to top, color-mix(in srgb, ${colorBase} 80%, transparent), ${colorBase})`,
                                }}
                              />
                              <span className="text-[11px] text-faint font-data">{h.year}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                  {(() => {
                    const note = getTrendNote(data.historicalScores);
                    return note ? (
                      <p className="text-sm text-muted italic mt-4">{note}</p>
                    ) : null;
                  })()}
                </div>
              </section>
            </ScrollReveal>

            <hr className="border-rule mt-10" />

            {/* Email Capture — lighter ask, comes before filter recommendations */}
            <ScrollReveal delay={0}>
              <div className="mt-8">
                <EmailCapture postcode={data.district} />
              </div>
            </ScrollReveal>

            <hr className="border-rule mt-10" />

            {/* Filter Recommendations — coming soon */}
            <ScrollReveal delay={100}>
              <section className="mt-8">
                <h2 className="font-display text-2xl text-ink italic">
                  Filters for your area
                </h2>
                <div className="mt-4 card p-6 border-dashed">
                  <p className="text-sm text-body">
                    We&apos;re reviewing water filters matched to the contaminants found in <span className="font-medium text-ink">{data.district}</span>. Personalised recommendations are coming soon.
                  </p>
                  <p className="text-xs text-muted mt-2">
                    Sign up above to be notified when filter picks are ready for your area.
                  </p>
                </div>
              </section>
            </ScrollReveal>
          </>
        ) : (
          /* Insufficient data state */
          <div className="mt-10 card-elevated rounded-2xl p-8 max-w-2xl">
            <p className="font-display text-2xl text-ink italic">Not enough data yet</p>
            <p className="text-base text-body leading-relaxed mt-3">
              We don&apos;t have enough test results for this area yet to calculate a score. This doesn&apos;t mean your water is unsafe.
            </p>
          </div>
        )}

        <hr className="border-rule mt-10" />

        {/* Nearby Areas — enriched with score previews */}
        <ScrollReveal delay={0}>
          <section className="mt-8">
            <h2 className="font-display text-2xl text-ink italic">
              Compare nearby
            </h2>
            <div className="flex overflow-x-auto gap-2 pb-2 -mx-5 px-5 snap-x snap-mandatory scrollbar-hide sm:flex-wrap sm:overflow-visible sm:mx-0 sm:px-0 mt-4">
              {nearbyData.map(({ code, data: pcData }) =>
                pcData ? (
                  <Link
                    key={code}
                    href={`/postcode/${code}/`}
                    className="card py-2 px-3 inline-flex items-center gap-2 snap-start shrink-0"
                  >
                    <MapPin className="w-3 h-3 text-faint shrink-0" />
                    <span className="text-sm text-ink font-medium">{code}</span>
                    <span className="text-xs text-muted">{pcData.areaName}</span>
                    {pcData.safetyScore >= 0 ? (
                      <span className={`font-data text-xs font-bold ${getScoreBadgeColor(pcData.safetyScore)}`}>
                        {pcData.safetyScore}
                      </span>
                    ) : (
                      <span className="font-data text-xs text-faint bg-rule px-1.5 py-0.5 rounded">
                        N/A
                      </span>
                    )}
                  </Link>
                ) : (
                  <Link key={code} href={`/postcode/${code}/`} className="pill snap-start shrink-0">
                    <MapPin className="w-3 h-3 text-faint mr-1.5" />
                    {code}
                  </Link>
                )
              )}
            </div>
          </section>
        </ScrollReveal>

        {/* Supplier Card — always shown */}
        <div className="mt-10">
          <Link
            href={`/supplier/${data.supplierId}/`}
            className="card p-4 flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-faint" />
              </div>
              <div>
                <p className="text-sm text-muted">Your water supplier</p>
                <p className="font-semibold text-ink group-hover:text-accent transition-colors">
                  {data.supplier}
                </p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-faint group-hover:text-accent transition-colors" />
          </Link>
        </div>

        {/* Methodology Footer */}
        <footer id="methodology-footer" className="mt-10 pb-4 text-sm text-faint leading-relaxed scroll-mt-20">
          {hasData ? <>Based on {data.contaminantsTested} government tests. </> : null}
          See our{" "}
          <Link href="/about/methodology" className="underline underline-offset-2 hover:text-muted transition-colors">
            methodology
          </Link>{" "}
          for how scores are calculated. Source:{" "}
          <Link href="/about/data-sources" className="underline underline-offset-2 hover:text-muted transition-colors">
            Environment Agency Water Quality Archive
          </Link>
          . Environmental water data — not treated tap water.{" "}
          <Link href="/about/data-sources" className="underline underline-offset-2 hover:text-muted transition-colors">
            Learn more
          </Link>
          .
        </footer>
      </div>
    </div>
  );
}
