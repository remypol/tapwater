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
import { getPostcodeData, getAllPostcodeDistricts, getHardness } from "@/lib/data";
import { getScoreColor } from "@/lib/types";
import { recommendFilters } from "@/lib/filters";
import { FilterRecommendations } from "@/components/filter-cards";
import { SoftenerLeadBanner } from "@/components/softener-lead-banner";
import { SoftenerLeadForm } from "@/components/softener-lead-form";
import { getProductIncludingUnavailable } from "@/lib/products";
import { ProductCard } from "@/components/product-card";
import { RelatedGuides } from "@/components/related-guides";
import { ScrollToTop } from "@/components/scroll-to-top";
import { PostcodeDatasetSchema, BreadcrumbSchema, FAQSchema } from "@/components/json-ld";
import { CITIES } from "@/lib/cities";
import { IncidentAlerts } from "@/components/incident-alert";
import { getActiveIncidentsForPostcode } from "@/lib/incidents";

export const revalidate = 86400; // Revalidate daily (matches pipeline cron)

interface Props {
  params: Promise<{ district: string }>;
}

export async function generateStaticParams() {
  // Build pages for ALL postcodes with data so every linked page exists
  const districts = await getAllPostcodeDistricts();
  return districts.map((district) => ({ district }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { district } = await params;
  const data = await getPostcodeData(district);
  if (!data) return { title: "Not Found" };

  const year = new Date().getFullYear();

  // Keep title under 60 chars (template adds " | TapWater.uk" = 15 chars)
  const maxTitleLen = 44; // 60 - 16 for " | TapWater.uk"
  const baseTitle = `${data.district} Water Quality`;
  const remainingLen = maxTitleLen - baseTitle.length - 3; // 3 for " | "
  const shortArea = remainingLen >= 8
    ? (data.areaName.length > remainingLen
      ? data.areaName.substring(0, remainingLen).replace(/,?\s*$/, '')
      : data.areaName)
    : null;
  const pageTitle = shortArea ? `${baseTitle} | ${shortArea}` : baseTitle;

  // Keep description under 155 chars
  const descBase = `Check tap water quality in ${data.district}. ${data.contaminantsTested} contaminants tested. PFAS, lead, nitrate & more.`;
  const descSuffix = ` Free ${year} report for ${data.areaName}.`;
  const description = (descBase + descSuffix).length <= 155
    ? descBase + descSuffix
    : descBase;

  return {
    title: pageTitle,
    description,
    openGraph: {
      title: `${data.district} Water Quality: Is It Safe?`,
      description,
      url: `https://www.tapwater.uk/postcode/${data.district}`,
      type: "website",
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
  const activeIncidents = await getActiveIncidentsForPostcode(district);
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

  // Find city page for breadcrumb linking
  const cityMatch = CITIES.find((c) =>
    c.matches.some((m) => m.toLowerCase() === data.city.toLowerCase()) ||
    c.name.toLowerCase() === data.city.toLowerCase(),
  );
  const citySlug = cityMatch?.slug ?? data.city.toLowerCase().replace(/\s+/g, "-");

  // Water hardness — queried from raw drinking_water_readings (not in scored page_data)
  const hardnessData = await getHardness(data.district);
  const hardnessValue = hardnessData?.value ?? null;
  const hardnessLabel = hardnessData?.label ?? null;

  // Build FAQ schema for rich results
  const scoreLabel = data.safetyScore >= 7 ? "safe" : data.safetyScore >= 4 ? "mostly safe but has some issues" : "below average and may need attention";
  const faqs = hasData ? [
    {
      question: `Is ${data.district} tap water safe to drink?`,
      answer: `Based on the latest tests, ${data.district} (${data.areaName}) water scores ${data.safetyScore}/10, which is ${scoreLabel}. ${data.contaminantsFlagged} of ${data.contaminantsTested} tested contaminants exceeded recommended levels. Water is supplied by ${data.supplier}.`,
    },
    {
      question: `What contaminants are in ${data.district} water?`,
      answer: `We tested ${data.contaminantsTested} contaminants in ${data.district} water. ${data.contaminantsFlagged > 0 ? `${data.contaminantsFlagged} were flagged, including ${flaggedNames.slice(0, 3).join(", ")}.` : "None exceeded recommended safe levels."}${data.pfasDetected ? ` PFAS (forever chemicals) were also detected at ${data.pfasLevel} µg/L.` : ""}`,
    },
    {
      question: `Who supplies water in ${data.district}?`,
      answer: `${data.district} (${data.areaName}) is supplied by ${data.supplier}. You can view their full profile and compliance data on our supplier page.`,
    },
    ...(hardnessValue != null ? [{
      question: `Is ${data.district} water hard or soft?`,
      answer: `Water in ${data.district} (${data.areaName}) has a hardness of ${hardnessValue} mg/L CaCO3, which is classified as ${hardnessLabel}. ${hardnessValue >= 180 ? "Hard water can cause limescale buildup. A water softener or filter jug may help." : hardnessValue < 60 ? "Soft water is gentle on appliances and skin." : "This is a moderate hardness level."}`,
    }] : []),
    ...(hasData ? [{
      question: `Should I use a water filter in ${data.district}?`,
      answer: `${data.contaminantsFlagged > 0
        ? `With ${data.contaminantsFlagged} contaminant${data.contaminantsFlagged > 1 ? "s" : ""} above recommended levels in ${data.district}, a water filter could help. ${data.pfasDetected ? "A reverse osmosis or activated carbon filter is recommended for PFAS removal." : "A filter jug or under-sink filter can reduce most common contaminants."}`
        : `${data.district} water scored ${data.safetyScore}/10 with no contaminants above recommended levels. A filter is optional but can improve taste, especially if you notice a chlorine flavour.`
      } See our filter recommendations for your area.`,
    }] : []),
    ...(hasData ? [{
      question: `Are there PFAS forever chemicals in ${data.district} water?`,
      answer: data.pfasDetected
        ? `Yes, PFAS (per- and polyfluoroalkyl substances) have been detected in ${data.district} at ${data.pfasLevel} µg/L from ${data.pfasSource} monitoring. The UK currently has no legal limit for PFAS in drinking water. Reverse osmosis and activated carbon filters can reduce PFAS levels.`
        : `No PFAS (forever chemicals) have been detected in ${data.district} based on available monitoring data. PFAS are tested at environmental monitoring sites near your postcode.`,
    }] : []),
  ] : [];

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
            { name: "Home", url: "https://www.tapwater.uk" },
            ...(cityMatch
              ? [{ name: data.city, url: `https://www.tapwater.uk/city/${citySlug}` }]
              : [{ name: data.city, url: `https://www.tapwater.uk` }]),
            { name: data.district, url: `https://www.tapwater.uk/postcode/${data.district}` },
          ]}
        />
        {faqs.length > 0 && <FAQSchema faqs={faqs} />}
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-faint">
          <Link href="/" className="hover:text-accent transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          {cityMatch ? (
            <Link href={`/city/${citySlug}`} className="hover:text-accent transition-colors">{data.city}</Link>
          ) : (
            <span>{data.city}</span>
          )}
          <ChevronRight className="w-3 h-3" />
          <span className="text-ink font-medium">{data.district}</span>
        </nav>

        <IncidentAlerts incidents={activeIncidents} />

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

            {/* Water hardness — one of the most searched water questions */}
            {hardnessValue != null && (
              <div className="mt-6 card p-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-lg bg-accent-light flex items-center justify-center shrink-0">
                  <span className="text-accent text-sm font-bold">H</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">
                    Water hardness: {hardnessValue} mg/L ({hardnessLabel})
                  </p>
                  <p className="text-sm text-muted mt-0.5">
                    {hardnessValue >= 180
                      ? "Hard water — may cause limescale buildup in kettles and pipes"
                      : hardnessValue < 60
                        ? "Soft water — gentle on appliances and skin"
                        : "Moderate hardness — unlikely to cause issues"}
                  </p>
                </div>
              </div>
            )}

            {hardnessValue != null && hardnessValue >= 180 && (
              <SoftenerLeadBanner
                postcode={data.district}
                hardnessValue={hardnessValue}
                hardnessLabel={hardnessLabel!}
              />
            )}

            {/* Summary — structured for AI citation and GEO */}
            <div className="mt-10 max-w-3xl">
              <p className="text-base text-body leading-relaxed">
                Tap water in {data.district} ({data.areaName}, {data.city}) is supplied by{" "}
                {data.supplierId && data.supplierId !== "unknown" ? (
                  <Link href={`/supplier/${data.supplierId}`} className="font-medium text-ink hover:text-accent transition-colors">
                    {data.supplier}
                  </Link>
                ) : (
                  <span className="font-medium text-ink">{data.supplier}</span>
                )}{" "}
                and scored <span className="font-data font-bold">{data.safetyScore} out of 10</span> for
                safety based on {data.contaminantsTested} tested parameters.{" "}
                {data.contaminantsFlagged > 0 ? (
                  <>
                    {data.contaminantsFlagged} contaminant{data.contaminantsFlagged !== 1 ? "s" : ""} exceeded
                    recommended safe levels
                    {flaggedNames.length > 0 && (
                      <>: {flaggedNames.slice(0, 3).join(", ")}{flaggedNames.length > 3 ? ` and ${flaggedNames.length - 3} more` : ""}</>
                    )}
                    .
                  </>
                ) : (
                  <>No contaminants exceeded recommended safe levels.</>
                )}
                {data.pfasDetected && data.pfasLevel != null && (
                  <>
                    {" "}PFAS (forever chemicals) were detected at{" "}
                    <span className="font-data">{data.pfasLevel}</span> µg/L
                    {data.pfasSource === "drinking"
                      ? " in local drinking water tests"
                      : " in nearby environmental monitoring"}. The UK currently has no
                    legal limit for PFAS in drinking water.
                  </>
                )}
                {" "}Data is from{" "}
                {data.sampleCount > 0 ? `${data.sampleCount.toLocaleString()} samples collected up to ` : "samples last taken "}
                {data.lastSampleDate}, sourced from{" "}
                {data.dataSource === "stream" || data.dataSource === "mixed"
                  ? `${data.supplier} via the Stream Water Data Portal`
                  : "the Environment Agency Water Quality Archive"}.
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
                  <span className="inline-flex items-center gap-1.5 bg-[var(--color-warning-light)] border border-amber-200 rounded-full px-3 py-1 text-xs font-medium text-amber-700">
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
                <p className="text-sm text-amber-700 bg-[var(--color-warning-light)] border border-amber-200 rounded-lg px-3 py-2 mt-2">
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

            {hardnessValue != null && hardnessValue >= 180 && (
              <div className="mt-8">
                {/* Show Waterdrop softener if available in UK */}
                {(() => {
                  const softener = getProductIncludingUnavailable("waterdrop-whr01");
                  if (!softener || softener.availableInUk === false) return null;
                  return (
                    <div className="mb-4">
                      <ProductCard product={softener} pageType="postcode" highlight="Recommended for your hard water area" />
                    </div>
                  );
                })()}
                <SoftenerLeadForm
                  postcode={data.district}
                  hardnessValue={hardnessValue}
                  hardnessLabel={hardnessLabel!}
                  source="postcode_page"
                />
              </div>
            )}

            {/* Supplementary recommendations */}
            <section className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link
                href="/filters/shower-filters"
                className="card p-4 group hover:border-accent/30 transition-colors"
              >
                <p className="font-semibold text-ink text-sm group-hover:text-accent transition-colors">
                  Shower filters
                </p>
                <p className="text-sm text-muted mt-1">
                  Remove chlorine for better skin and hair
                </p>
              </Link>
              <Link
                href="/filters/water-testing-kits"
                className="card p-4 group hover:border-accent/30 transition-colors"
              >
                <p className="font-semibold text-ink text-sm group-hover:text-accent transition-colors">
                  Test your water
                </p>
                <p className="text-sm text-muted mt-1">
                  Confirm exactly what&apos;s in your pipes
                </p>
              </Link>
            </section>

            {/* Contextual guide links — relevant to flagged issues */}
            <RelatedGuides
              pfasDetected={data.pfasDetected}
              hasLeadFlagged={data.readings.some(r => /lead/i.test(r.name) && r.status !== "pass")}
              isHardWater={(hardnessValue ?? 0) >= 180}
              hasContaminantsFlagged={data.contaminantsFlagged > 0}
            />

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

            {/* Contextual internal links — contaminant pages + guides */}
            <section className="mt-10">
              <h2 className="font-display text-xl text-ink italic mb-3">
                Learn more
              </h2>
              <div className="flex flex-wrap gap-2">
                {data.pfasDetected && (
                  <Link href="/contaminant/pfas" className="pill">PFAS explained</Link>
                )}
                {flaggedNames.some((n) => /lead/i.test(n)) && (
                  <Link href="/contaminant/lead" className="pill">Lead in water</Link>
                )}
                {flaggedNames.some((n) => /nitrate|nitrite/i.test(n)) && (
                  <Link href="/contaminant/nitrate" className="pill">Nitrate levels</Link>
                )}
                {flaggedNames.some((n) => /chlorine/i.test(n)) && (
                  <Link href="/contaminant/chlorine" className="pill">Chlorine</Link>
                )}
                <Link href="/guides/how-to-test-your-water" className="pill">How to test your water</Link>
                <Link href="/guides/best-water-filters-uk" className="pill">Best water filters</Link>
                {cityMatch ? (
                  <Link href={`/city/${citySlug}`} className="pill">
                    Water in {data.city}
                  </Link>
                ) : (
                  <span className="pill">Water in {data.city}</span>
                )}
                <Link href="/compare" className="pill">UK water rankings</Link>
              </div>
            </section>

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
                    href={`/postcode/${code}`}
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
                  <Link key={code} href={`/postcode/${code}`} className="pill snap-start shrink-0">
                    <MapPin className="w-3 h-3 text-faint mr-1.5" />
                    {code}
                  </Link>
                )
              )}
            </div>
          </section>
        </ScrollReveal>

        {/* Supplier Card — only linked when supplier is known */}
        {data.supplierId && data.supplierId !== "unknown" ? (
          <div className="mt-10">
            <Link
              href={`/supplier/${data.supplierId}`}
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
        ) : (
          <div className="mt-10 card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-faint" />
            </div>
            <div>
              <p className="text-sm text-muted">Your water supplier</p>
              <p className="font-semibold text-ink">{data.supplier || "Unknown"}</p>
            </div>
          </div>
        )}

        {/* Methodology Footer — E-E-A-T signals */}
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
          <span className="block mt-2">
            Last updated: <time dateTime={data.lastUpdated}>{data.lastUpdated}</time>
            {" · "}Reviewed by{" "}
            <Link href="/about" className="underline underline-offset-2 hover:text-muted transition-colors">
              the TapWater.uk research team
            </Link>
          </span>
        </footer>
      </div>
      <ScrollToTop />
    </div>
  );
}
