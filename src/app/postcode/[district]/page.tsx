import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, MapPin, Building2, ExternalLink, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
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

function getWhatThisMeans(score: number, district: string): {
  text: string;
  borderColor: string;
  textColor: string;
  Icon: React.ElementType;
} {
  if (score >= 9) {
    return {
      text: `Water quality in ${district} is excellent. All tested parameters are well within regulatory limits.`,
      borderColor: "border-l-[var(--color-safe)]",
      textColor: "text-[var(--color-safe)]",
      Icon: ShieldCheck,
    };
  }
  if (score >= 7) {
    return {
      text: `Water quality in ${district} is good. Most parameters are within limits, though some are worth monitoring.`,
      borderColor: "border-l-[var(--color-safe)]",
      textColor: "text-[var(--color-safe)]",
      Icon: ShieldCheck,
    };
  }
  if (score >= 5) {
    return {
      text: `Water quality in ${district} is fair. Several parameters are elevated and may warrant attention.`,
      borderColor: "border-l-[var(--color-warning)]",
      textColor: "text-[var(--color-warning)]",
      Icon: ShieldAlert,
    };
  }
  if (score >= 3) {
    return {
      text: `Water quality in ${district} is poor. Multiple contaminants exceed recommended guidelines.`,
      borderColor: "border-l-[var(--color-danger)]",
      textColor: "text-[var(--color-danger)]",
      Icon: ShieldX,
    };
  }
  return {
    text: `Water quality in ${district} is very poor. Significant contamination has been detected in environmental monitoring.`,
    borderColor: "border-l-[var(--color-danger)]",
    textColor: "text-[var(--color-danger)]",
    Icon: ShieldX,
  };
}

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

            {/* What this means — contextual callout */}
            {(() => {
              const { text, borderColor, textColor, Icon } = getWhatThisMeans(data.safetyScore, data.district);
              return (
                <div className={`card p-5 mt-5 max-w-3xl border-l-3 ${borderColor} flex items-start gap-3`}>
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${textColor}`} />
                  <p className="text-sm text-body leading-relaxed">{text}</p>
                </div>
              );
            })()}

            <hr className="border-rule mt-10" />

            {/* Contaminant Data */}
            <section className="bg-surface -mx-5 px-5 py-8 mt-0">
              <h2 className="font-display text-2xl text-ink italic">
                What&apos;s in your water
              </h2>
              <p className="text-sm text-muted mt-1 mb-5">
                All readings from the latest monitoring data for your supply zone.
              </p>
              <ContaminantTable readings={data.readings} />
            </section>

            <hr className="border-rule" />

            {/* Trend Chart — simple bar visualisation */}
            <section className="mt-8">
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
                {(() => {
                  const note = getTrendNote(data.historicalScores);
                  return note ? (
                    <p className="text-sm text-muted italic mt-2">{note}</p>
                  ) : null;
                })()}
              </div>
            </section>

            <hr className="border-rule mt-10" />

            {/* Email Capture — lighter ask, comes before filter recommendations */}
            <div className="mt-8">
              <EmailCapture postcode={data.district} />
            </div>

            <hr className="border-rule mt-10" />

            {/* Filter Recommendations */}
            <div className="mt-8">
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

        <hr className="border-rule mt-10" />

        {/* Nearby Areas — enriched with score previews */}
        <section className="mt-8">
          <h2 className="font-display text-2xl text-ink italic">
            Nearby areas
          </h2>
          <div className="flex flex-wrap gap-2 mt-4">
            {nearbyData.map(({ code, data: pcData }) =>
              pcData ? (
                <Link
                  key={code}
                  href={`/postcode/${code}/`}
                  className="card py-2 px-3 inline-flex items-center gap-2"
                >
                  <MapPin className="w-3 h-3 text-faint shrink-0" />
                  <span className="text-sm text-ink font-medium">{code}</span>
                  <span className="text-xs text-muted">{pcData.areaName}</span>
                  <span className={`font-data text-xs font-bold ${getScoreBadgeColor(pcData.safetyScore)}`}>
                    {pcData.safetyScore}
                  </span>
                </Link>
              ) : (
                <Link key={code} href={`/postcode/${code}/`} className="pill">
                  <MapPin className="w-3 h-3 text-faint mr-1.5" />
                  {code}
                </Link>
              )
            )}
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
