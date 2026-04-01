import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, MapPin, Building2, ExternalLink } from "lucide-react";
import { SafetyScore } from "@/components/safety-score";
import { StatCards } from "@/components/stat-cards";
import { PfasBanner } from "@/components/pfas-banner";
import { ContaminantTable } from "@/components/contaminant-table";
import { FilterCards } from "@/components/filter-cards";
import { EmailCapture } from "@/components/email-capture";
import { getPostcodeData, getAllPostcodeDistricts } from "@/lib/data";
import { MOCK_FILTERS } from "@/lib/mock-data";
import { getScoreColor } from "@/lib/types";

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

  return {
    title: `${data.district} Water Quality: Is It Safe? | ${data.areaName} 2026`,
    description: `Check tap water quality in ${data.district}. ${data.contaminantsTested} contaminants tested. PFAS levels, lead, nitrate & more. Free 2026 report for ${data.areaName}.`,
  };
}

const GRADIENT_CLASS = {
  safe: "bg-score-safe",
  warning: "bg-score-warning",
  danger: "bg-score-danger",
} as const;

export default async function PostcodePage({ params }: Props) {
  const { district } = await params;
  const data = getPostcodeData(district);
  if (!data) notFound();

  const hasData = data.safetyScore >= 0;
  const scoreColor = hasData ? getScoreColor(data.safetyScore) : "safe";
  const gradientClass = GRADIENT_CLASS[scoreColor];

  return (
    <div className={gradientClass}>
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8 py-8 lg:py-12">
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
            Tap Water Quality in {data.district}
          </h1>
          <p className="text-muted mt-1 animate-fade-up delay-3">
            {data.areaName} &mdash; 2026 Report
          </p>
        </header>

        {hasData ? (
          <>
            {/* Score */}
            <div className="flex justify-center py-10 lg:py-14 animate-fade-in delay-3">
              <SafetyScore score={data.safetyScore} size={200} parameterCount={data.contaminantsTested} />
            </div>

            {/* Stat Cards */}
            <StatCards
              contaminantsTested={data.contaminantsTested}
              contaminantsFlagged={data.contaminantsFlagged}
              supplier={data.supplier}
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

            {/* Summary — the GEO-optimised opening paragraph */}
            <div className="mt-10 max-w-3xl">
              <p className="text-base text-body leading-relaxed">
                Your water in {data.district} is supplied by{" "}
                <Link href={`/supplier/${data.supplierId}/`} className="font-medium text-ink hover:text-accent transition-colors">
                  {data.supplier}
                </Link>
                . Based on the latest data (sampled {data.lastSampleDate}),{" "}
                <span className="font-data">{data.contaminantsTested}</span> contaminants
                were tested with{" "}
                <span className="font-data">{data.contaminantsFlagged}</span> exceeding
                recommended levels. The overall water quality score for {data.district} is{" "}
                <span className="font-data font-bold">{data.safetyScore}/10</span>.
              </p>
            </div>

            {/* Contaminant Data */}
            <section className="mt-12">
              <h2 className="font-display text-2xl text-ink italic">
                What&apos;s in your water
              </h2>
              <p className="text-sm text-muted mt-1 mb-5">
                All readings from the latest monitoring data for your supply zone.
              </p>
              <ContaminantTable readings={data.readings} />
            </section>

            {/* Trend Chart — simple bar visualisation */}
            <section className="mt-12">
              <h2 className="font-display text-2xl text-ink italic">
                Water quality trend
              </h2>
              <p className="text-sm text-muted mt-1">
                {data.district} quality score, 2020&ndash;2026
              </p>
              <div className="card-elevated mt-4 p-8 flex flex-col items-center justify-center" style={{ minHeight: 240 }}>
                <div className="flex items-end gap-2">
                  {data.historicalScores.map((h) => {
                    const height = Math.max(24, (h.score / 10) * 140);
                    const color =
                      h.score >= 7
                        ? "bg-[var(--color-safe)]"
                        : h.score >= 5
                          ? "bg-[var(--color-warning)]"
                          : "bg-[var(--color-danger)]";
                    return (
                      <div key={h.year} className="flex flex-col items-center gap-1.5">
                        <span className="font-data text-[10px] text-faint">{h.score}</span>
                        <div
                          className={`w-7 sm:w-9 rounded-t-sm ${color} opacity-80`}
                          style={{ height }}
                        />
                        <span className="text-[10px] text-faint font-data">{h.year}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-faint mt-5">
                  Full interactive chart in development
                </p>
              </div>
            </section>

            {/* Comparison Tool Placeholder */}
            <section className="mt-12">
              <h2 className="font-display text-2xl text-ink italic">
                Compare water quality
              </h2>
              <p className="text-sm text-muted mt-1">
                Moving house? See how your water compares.
              </p>
              <div className="card mt-4 p-8 flex items-center justify-center" style={{ minHeight: 100 }}>
                <p className="text-sm text-faint">Postcode comparison tool in development</p>
              </div>
            </section>

            {/* Filter Recommendations */}
            <div className="mt-12">
              <FilterCards filters={MOCK_FILTERS} postcode={data.district} />
            </div>
          </>
        ) : (
          /* Insufficient data state */
          <div className="mt-10 card-elevated rounded-2xl p-8 max-w-2xl">
            <p className="font-display text-2xl text-ink italic">Insufficient monitoring data</p>
            <p className="text-base text-body leading-relaxed mt-3">
              We don&apos;t have enough Environment Agency data for this area to calculate a score. This doesn&apos;t mean your water is unsafe.
            </p>
          </div>
        )}

        {/* Email Capture — always shown */}
        <div className="mt-12">
          <EmailCapture postcode={data.district} />
        </div>

        {/* Nearby Areas — always shown */}
        <section className="mt-12">
          <h2 className="font-display text-2xl text-ink italic">
            Nearby areas
          </h2>
          <div className="flex flex-wrap gap-2 mt-4">
            {data.nearbyPostcodes.map((pc) => (
              <Link key={pc} href={`/postcode/${pc}/`} className="pill">
                <MapPin className="w-3 h-3 text-faint mr-1.5" />
                {pc}
              </Link>
            ))}
          </div>
        </section>

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
        <footer className="mt-10 pb-4 text-sm text-faint leading-relaxed">
          {hasData ? <>Based on {data.contaminantsTested} regulated parameters. </> : null}
          See our{" "}
          <Link href="/about/methodology" className="underline underline-offset-2 hover:text-muted transition-colors">
            methodology
          </Link>{" "}
          for how scores are calculated. Data sources:{" "}
          <Link href="/about/data-sources" className="underline underline-offset-2 hover:text-muted transition-colors">
            Environment Agency Water Quality Archive
          </Link>
          ,{" "}
          <Link href="/about/data-sources" className="underline underline-offset-2 hover:text-muted transition-colors">
            Drinking Water Inspectorate
          </Link>
          .
        </footer>
      </div>
    </div>
  );
}
