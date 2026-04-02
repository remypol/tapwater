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
import { getPostcodeData, getScoredPostcodeDistricts } from "@/lib/data";
import { getScoreColor } from "@/lib/types";
import { recommendFilters } from "@/lib/filters";
import { FilterRecommendations } from "@/components/filter-cards";
import { PostcodeDatasetSchema, BreadcrumbSchema } from "@/components/json-ld";

export const revalidate = 86400; // Revalidate daily (matches pipeline cron)

interface Props {
  params: Promise<{ district: string }>;
}

export async function generateStaticParams() {
  // Only build pages for postcodes with a real score — avoids thin pages
  const districts = await getScoredPostcodeDistricts();
  return districts.map((district) => ({ district }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { district } = await params;
  const data = await getPostcodeData(district);
  if (!data) return { title: "Not Found" };

  const year = new Date().getFullYear();
  const description = `Check tap water quality in ${data.district}. ${data.contaminantsTested} contaminants tested. PFAS levels, lead, nitrate & more. Free ${year} report for ${data.areaName}.`;

  return {
    title: `${data.district} Water Quality: Is It Safe? | ${data.areaName} ${year}`,
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

function getScoreBadgeColor(score: number): string {
  const color = getScoreColor(score);
  if (color === "safe") return "text-[var(--color-safe)]";
  if (color === "warning") return "text-[var(--color-warning)]";
  return "text-[var(--color-danger)]";
}

export default async function PostcodePage({ params }: Props) {
  const { district } = await params;
  const data = await getPostcodeData(district);
  if (!data) notFound();

  const hasData = data.safetyScore >= 0;
  const scoreColor = hasData ? getScoreColor(data.safetyScore) : "safe";
  const gradientClass = GRADIENT_CLASS[scoreColor];

  // Pre-fetch nearby postcode data for the enriched nearby section
  const nearbyData = await Promise.all(
    data.nearbyPostcodes.map(async (pc) => ({
      code: pc,
      data: await getPostcodeData(pc),
    })),
  );

  // Check data freshness
  const lastSampleDate = new Date(data.lastSampleDate);
  const monthsOld = Math.floor((Date.now() - lastSampleDate.getTime()) / (30 * 24 * 60 * 60 * 1000));
  const isStale = monthsOld > 12;

  // Compute filter recommendations based on flagged contaminants
  const flaggedNames = data.readings
    .filter((r) => r.status !== "pass")
    .map((r) => r.name);
  const filterRecs = recommendFilters(flaggedNames, 3);

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
                {data.dataSource === "stream" || data.dataSource === "mixed" ? (
                  <>Based on drinking water tests</>
                ) : (
                  <>Based on environmental water monitoring</>
                )}, your water in{" "}
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
                    <span className="font-data">{data.pfasLevel}</span> µg/L
                    {data.pfasSource === "drinking"
                      ? " in local tap water tests"
                      : " in nearby environmental monitoring"} — the UK currently has no
                    legal limit for PFAS in drinking water
                  </>
                )}
                .
              </p>
            </div>

            {/* Data provenance — clean, two-row layout */}
            <div className="mt-6 space-y-2">
              <div className="flex items-center gap-3">
                {data.dataSource === "stream" || data.dataSource === "mixed" ? (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 text-xs font-medium text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Drinking water tests
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 text-xs font-medium text-amber-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Environmental monitoring
                  </span>
                )}
                <Link href="/about/data-sources" className="text-xs text-accent hover:underline">
                  How we score
                </Link>
              </div>
              <p className="text-xs text-muted">
                Last sampled <span className="text-ink font-medium">{data.lastSampleDate}</span>
                {data.sampleCount > 0 && <> · {data.sampleCount.toLocaleString()} samples</>}
                {data.dataSource === "ea-only" && <> · Tap water tests not yet available for {data.supplier}</>}
              </p>
              {isStale && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                  This data is {monthsOld > 24 ? `over ${Math.floor(monthsOld / 12)} years` : `${monthsOld} months`} old.
                  {data.dataSource === "ea-only"
                    ? ` The Environment Agency hasn't sampled near ${data.district} recently. Scores reflect the most recent available data.`
                    : " Newer data may be available soon."}
                </p>
              )}
            </div>

            <hr className="border-rule mt-10" />

            {/* Contaminant Data */}
            <ScrollReveal delay={0}>
              <section id="what-we-found" className="bg-surface -mx-5 px-5 py-8 mt-0 scroll-mt-20">
                <h2 className="text-xl font-semibold text-ink tracking-tight">
                  {data.dataSource === "stream" || data.dataSource === "mixed"
                    ? "What\u2019s in your tap water"
                    : "What we found"}
                </h2>
                <p className="text-sm text-muted mt-1 mb-5">
                  {data.dataSource === "stream" || data.dataSource === "mixed"
                    ? `Results from drinking water tests in ${data.areaName}.`
                    : "Here\u2019s what government tests found in water near you."}
                </p>
                <ContaminantTable readings={data.readings} />
              </section>
            </ScrollReveal>

            {/* Filter Recommendations — immediately after contaminant data, while concern is highest */}
            {filterRecs.length > 0 && (
              <ScrollReveal delay={100}>
                <FilterRecommendations
                  recommendations={filterRecs}
                  postcodeDistrict={data.district}
                  contaminantsFlagged={data.contaminantsFlagged}
                />
              </ScrollReveal>
            )}

            {/* Environmental Water Quality — EA data, clearly labelled */}
            {data.environmentalReadings.length > 0 && (
              <>
                <hr className="border-rule mt-10" />
                <ScrollReveal delay={100}>
                  <section className="mt-8">
                    <h2 className="font-display text-2xl text-ink italic">
                      Environmental water nearby
                    </h2>
                    <p className="text-sm text-muted mt-1 mb-5">
                      Rivers, groundwater and reservoirs near {data.district}. This is
                      environmental monitoring — not your tap water.
                    </p>
                    <ContaminantTable readings={data.environmentalReadings} />
                  </section>
                </ScrollReveal>
              </>
            )}

            <hr className="border-rule mt-10" />

            {/* Email Capture — after filters, lighter ask */}
            <ScrollReveal delay={0}>
              <div className="mt-8">
                <EmailCapture postcode={data.district} />
              </div>
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
          {hasData ? <>Based on {data.contaminantsTested} tests. </> : null}
          {data.dataSource === "stream" || data.dataSource === "mixed"
            ? "Drinking water quality data from your water company via the Stream Water Data Portal. "
            : "Environmental water monitoring data from the Environment Agency. "}
          See our{" "}
          <Link href="/about/methodology" className="underline underline-offset-2 hover:text-muted transition-colors">
            methodology
          </Link>{" "}
          for how scores are calculated.
        </footer>
      </div>
    </div>
  );
}
