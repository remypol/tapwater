import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Building2,
  AlertTriangle,
  Droplets,
  BarChart3,
  FlaskConical,
  ShieldCheck,
  BookOpen,
  Database,
  Search,
} from "lucide-react";
import { BreadcrumbSchema, ArticleSchema, FAQSchema } from "@/components/json-ld";
import { ScrollReveal } from "@/components/scroll-reveal";
import { PostcodeSearch } from "@/components/postcode-search";
import { getAllPostcodeDistricts, getPostcodeData, getHardness } from "@/lib/data";
import { getScoreColor } from "@/lib/types";
import { CITIES } from "@/lib/cities";
import type { PostcodeData } from "@/lib/types";

export const revalidate = 86400;

// ── Static params ──

export function generateStaticParams() {
  return [{ year: "2026" }];
}

// ── Score colour helpers ──

function scoreTextClass(score: number): string {
  const c = getScoreColor(score);
  if (c === "safe") return "text-[var(--color-safe)]";
  if (c === "warning") return "text-[var(--color-warning)]";
  return "text-[var(--color-danger)]";
}

function scoreBgClass(score: number): string {
  const c = getScoreColor(score);
  if (c === "safe") return "bg-[var(--color-safe-light)] text-[var(--color-safe)]";
  if (c === "warning") return "bg-[var(--color-warning-light)] text-[var(--color-warning)]";
  return "bg-[var(--color-danger-light)] text-[var(--color-danger)]";
}

// ── Types ──

interface CityRanking {
  slug: string;
  name: string;
  region: string;
  avgScore: number;
  postcodeCount: number;
}

interface SupplierRanking {
  id: string;
  name: string;
  avgScore: number;
  postcodeCount: number;
}

interface ContaminantCount {
  name: string;
  count: number;
  percentage: number;
}

// ── Metadata ──

export function generateMetadata({ params }: { params: Promise<{ year: string }> }): Metadata {
  return {
    title: "UK Water Quality Report (2026)",
    description:
      "Comprehensive annual report on UK drinking water quality. Data from 2,800+ postcodes, 100+ contaminants. Independent analysis by TapWater.uk.",
    openGraph: {
      title: "UK Water Quality Report 2026",
      description:
        "Comprehensive annual report on UK drinking water quality. Data from 2,800+ postcodes, 100+ contaminants.",
      url: "https://www.tapwater.uk/report/2026",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: "UK Water Quality Report 2026",
      description:
        "Comprehensive annual report on UK drinking water quality across 2,800+ postcodes.",
    },
  };
}

// ── Data aggregation ──

async function buildReportData() {
  const districts = await getAllPostcodeDistricts();

  // Load all postcode data
  const allData = (
    await Promise.all(districts.map((d) => getPostcodeData(d)))
  ).filter(Boolean) as NonNullable<Awaited<ReturnType<typeof getPostcodeData>>>[];
  const scored = allData.filter((p) => p.safetyScore >= 0);

  const totalPostcodes = scored.length;

  // ── National average ──
  const nationalAvg =
    scored.reduce((sum, p) => sum + p.safetyScore, 0) / scored.length;

  // ── Latest date ──
  const latestDate = scored
    .map((p) => p.lastUpdated)
    .filter(Boolean)
    .sort()
    .reverse()[0] ?? new Date().toISOString().split("T")[0];

  // ── Contaminants tested (max across all postcodes) ──
  const maxContaminantsTested = Math.max(...scored.map((p) => p.contaminantsTested));

  // ── Total samples ──
  const totalSamples = scored.reduce((sum, p) => sum + p.sampleCount, 0);

  // ── PFAS summary ──
  const pfasPostcodes = scored.filter((p) => p.pfasDetected);
  const pfasCount = pfasPostcodes.length;
  const pfasPercentage = ((pfasCount / totalPostcodes) * 100).toFixed(1);

  // ── Best/worst postcodes (top/bottom 5) ──
  const sortedByScore = [...scored].sort((a, b) => b.safetyScore - a.safetyScore);
  const bestPostcodes = sortedByScore.slice(0, 5);
  const worstPostcodes = sortedByScore.slice(-5).reverse();

  // ── City rankings ──
  const cityRankings: CityRanking[] = [];
  for (const city of CITIES) {
    const lowerMatches = city.matches.map((m) => m.toLowerCase());
    const cityPostcodes = scored.filter((p) =>
      lowerMatches.includes(p.city.toLowerCase())
    );
    if (cityPostcodes.length === 0) continue;

    const avgScore =
      cityPostcodes.reduce((s, p) => s + p.safetyScore, 0) / cityPostcodes.length;

    cityRankings.push({
      slug: city.slug,
      name: city.name,
      region: city.region,
      avgScore,
      postcodeCount: cityPostcodes.length,
    });
  }
  cityRankings.sort((a, b) => b.avgScore - a.avgScore);

  const top5Cities = cityRankings.slice(0, 5);
  const bottom5Cities = cityRankings.slice(-5).reverse();

  // ── Supplier rankings ──
  const supplierMap = new Map<string, { name: string; scores: number[]; postcodes: number }>();
  for (const p of scored) {
    const existing = supplierMap.get(p.supplierId);
    if (existing) {
      existing.scores.push(p.safetyScore);
      existing.postcodes++;
    } else {
      supplierMap.set(p.supplierId, {
        name: p.supplier,
        scores: [p.safetyScore],
        postcodes: 1,
      });
    }
  }

  const supplierRankings: SupplierRanking[] = Array.from(supplierMap.entries())
    .map(([id, { name, scores, postcodes }]) => ({
      id,
      name,
      avgScore: scores.reduce((s, v) => s + v, 0) / scores.length,
      postcodeCount: postcodes,
    }))
    .filter((s) => s.postcodeCount >= 2)
    .sort((a, b) => b.avgScore - a.avgScore);

  // ── Most common contaminants ──
  const contaminantCounts = new Map<string, number>();
  for (const p of scored) {
    const flagged = p.readings.filter(
      (r) => r.status === "warning" || r.status === "fail"
    );
    const seen = new Set<string>();
    for (const r of flagged) {
      if (!seen.has(r.name)) {
        seen.add(r.name);
        contaminantCounts.set(r.name, (contaminantCounts.get(r.name) ?? 0) + 1);
      }
    }
  }

  const topContaminants: ContaminantCount[] = Array.from(contaminantCounts.entries())
    .map(([name, count]) => ({
      name,
      count,
      percentage: parseFloat(((count / totalPostcodes) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // ── Hard water stats ──
  let hardWaterCount = 0;
  let hardnessChecked = 0;
  for (const p of scored) {
    const h = await getHardness(p.district);
    if (h) {
      hardnessChecked++;
      if (h.value > 200) hardWaterCount++;
    }
  }
  const hardWaterPercentage =
    hardnessChecked > 0
      ? parseFloat(((hardWaterCount / hardnessChecked) * 100).toFixed(1))
      : 0;

  return {
    totalPostcodes,
    nationalAvg,
    latestDate,
    maxContaminantsTested,
    totalSamples,
    pfasCount,
    pfasPercentage,
    bestPostcodes,
    worstPostcodes,
    top5Cities,
    bottom5Cities,
    cityRankings,
    supplierRankings,
    topContaminants,
    hardWaterCount,
    hardnessChecked,
    hardWaterPercentage,
  };
}

// ── Page ──

export default async function ReportPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;
  const data = await buildReportData();

  const formattedDate = new Date(data.latestDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const totalSamplesLabel =
    data.totalSamples > 1000
      ? `${Math.round(data.totalSamples / 1000).toLocaleString()}k+`
      : data.totalSamples > 0
        ? data.totalSamples.toLocaleString()
        : "25,000+";

  const faqs = [
    {
      question: "Is UK tap water safe to drink in 2026?",
      answer: `Yes. All UK tap water meets legal safety standards set by the Drinking Water Inspectorate. TapWater.uk's analysis of ${data.totalPostcodes.toLocaleString()} postcode districts shows a national average score of ${data.nationalAvg.toFixed(1)}/10. Lower scores do not mean water is unsafe — they reflect contaminant levels relative to stricter WHO advisory guidelines.`,
    },
    {
      question: "Which UK city has the best water quality?",
      answer: data.top5Cities[0]
        ? `${data.top5Cities[0].name} ranks as the UK city with the best water quality in ${year}, with an average safety score of ${data.top5Cities[0].avgScore.toFixed(1)}/10 across ${data.top5Cities[0].postcodeCount} postcode districts tested.`
        : "Rankings are computed from Environment Agency water quality monitoring data.",
    },
    {
      question: "How many UK postcodes have PFAS in their water?",
      answer: `TapWater.uk detected PFAS (forever chemicals) in ${data.pfasCount} postcode districts, representing ${data.pfasPercentage}% of all areas monitored. The UK currently has no legal limit for PFAS in drinking water.`,
    },
    {
      question: "How is UK water quality measured?",
      answer: `TapWater.uk analyses data from the Environment Agency Water Quality Archive, the Drinking Water Inspectorate, and water company testing via the Stream Water Data Portal. Each postcode district receives a safety score from 0–10 based on levels of ${data.maxContaminantsTested}+ contaminants measured against UK legal limits and WHO guidelines.`,
    },
  ];

  return (
    <div className="bg-hero min-h-screen">
      <div className="mx-auto max-w-5xl px-5 sm:px-6 lg:px-8 py-8 lg:py-14">
        <BreadcrumbSchema
          items={[
            { name: "Home", url: "https://www.tapwater.uk" },
            { name: "Report", url: "https://www.tapwater.uk/report/2026" },
            { name: year, url: `https://www.tapwater.uk/report/${year}` },
          ]}
        />
        <ArticleSchema
          headline={`UK Water Quality Report ${year}`}
          description="Comprehensive annual report on UK drinking water quality. Data from 2,800+ postcodes, 100+ contaminants. Independent analysis by TapWater.uk."
          url={`https://www.tapwater.uk/report/${year}`}
          datePublished="2026-01-15"
          dateModified={data.latestDate}
          authorName="TapWater.uk Research"
          authorUrl="https://www.tapwater.uk/about"
        />
        <FAQSchema faqs={faqs} />

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-faint">
          <Link href="/" className="hover:text-accent transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-ink font-medium">Report</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-ink font-medium">{year}</span>
        </nav>

        {/* ── Hero ── */}
        <header className="mt-6 mb-10">
          <p className="text-xs uppercase tracking-[0.15em] text-accent font-semibold animate-fade-up delay-1">
            Annual Report
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-ink tracking-tight mt-2 animate-fade-up delay-2">
            UK Water Quality{" "}
            <span className="italic">Report {year}</span>
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-sm text-muted animate-fade-up delay-3">
            <span>By <strong className="text-ink">TapWater.uk Research</strong></span>
            <span className="text-faint">|</span>
            <span>Last updated: <strong className="text-ink">{formattedDate}</strong></span>
            <span className="text-faint">|</span>
            <span>Independent research by TapWater.uk</span>
          </div>

          {/* GEO summary callout */}
          <div className="card mt-8 p-6 border-l-4 border-l-[var(--color-accent)] animate-fade-up delay-4">
            <p className="text-base text-body leading-relaxed">
              According to TapWater.uk&apos;s analysis of{" "}
              <strong className="text-ink">{data.totalPostcodes.toLocaleString()}</strong> UK
              postcode districts, the national average water quality score is{" "}
              <strong className="text-ink">{data.nationalAvg.toFixed(1)}/10</strong> in {year}.
              All UK tap water meets legal safety standards — scores reflect levels relative to
              WHO guidelines.
            </p>
          </div>
        </header>

        {/* ── Executive summary stat cards ── */}
        <ScrollReveal delay={0}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
            <div className="card p-5 text-center">
              <p className={`font-data text-3xl font-bold ${scoreTextClass(data.nationalAvg)}`}>
                {data.nationalAvg.toFixed(1)}
                <span className="text-sm text-faint font-normal">/10</span>
              </p>
              <p className="text-xs text-faint uppercase tracking-wider mt-2">National average</p>
            </div>
            <div className="card p-5 text-center">
              <p className="font-data text-3xl font-bold text-ink">
                {data.totalPostcodes.toLocaleString()}
              </p>
              <p className="text-xs text-faint uppercase tracking-wider mt-2">Postcodes analysed</p>
            </div>
            <div className="card p-5 text-center">
              <p className="font-data text-3xl font-bold text-ink">
                {data.maxContaminantsTested}+
              </p>
              <p className="text-xs text-faint uppercase tracking-wider mt-2">Contaminants monitored</p>
            </div>
            <div className="card p-5 text-center">
              <p className="font-data text-3xl font-bold text-[var(--color-pfas,var(--color-warning))]">
                {data.pfasCount}
              </p>
              <p className="text-xs text-faint uppercase tracking-wider mt-2">PFAS detections</p>
            </div>
          </div>
        </ScrollReveal>

        <hr className="border-rule" />

        {/* ── Best & Worst Cities ── */}
        <ScrollReveal delay={0}>
          <section className="mt-10">
            <h2 className="font-display text-3xl text-ink italic mb-2">
              Best &amp; worst cities
            </h2>
            <p className="text-sm text-muted mb-8">
              The UK cities with the highest and lowest average water quality scores, based on
              postcode-level testing data.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Best 5 */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-[var(--color-safe-light)] flex items-center justify-center shrink-0">
                    <TrendingUp className="w-3.5 h-3.5 text-[var(--color-safe)]" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-safe)]">
                    Top 5 — Best water quality
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {data.top5Cities.map((city, i) => (
                    <Link
                      key={city.slug}
                      href={`/city/${city.slug}/`}
                      className="group flex items-center gap-4 card px-5 py-4"
                    >
                      <span className="font-data text-sm font-bold text-faint w-5 shrink-0 tabular-nums">
                        {i === 0 ? (
                          <span className="text-[var(--color-safe)] text-base">#1</span>
                        ) : (
                          `#${i + 1}`
                        )}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium text-ink group-hover:text-accent transition-colors text-sm">
                            {city.name}
                          </span>
                          <span className={`font-data text-base font-bold shrink-0 ${scoreTextClass(city.avgScore)}`}>
                            {city.avgScore.toFixed(1)}
                            <span className="text-xs text-faint font-normal">/10</span>
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-[var(--color-rule)] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[var(--color-safe)]"
                            style={{ width: `${(city.avgScore / 10) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-faint mt-1.5">
                          {city.region} · {city.postcodeCount} areas tested
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-faint group-hover:text-accent transition-colors shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Worst 5 */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-[var(--color-warning-light)] flex items-center justify-center shrink-0">
                    <TrendingDown className="w-3.5 h-3.5 text-[var(--color-warning)]" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-warning)]">
                    Bottom 5 — Areas to watch
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {data.bottom5Cities.map((city, i) => {
                    const barColor =
                      getScoreColor(city.avgScore) === "danger"
                        ? "bg-[var(--color-danger)]"
                        : "bg-[var(--color-warning)]";
                    return (
                      <Link
                        key={city.slug}
                        href={`/city/${city.slug}/`}
                        className="group flex items-center gap-4 card px-5 py-4"
                      >
                        <span className="font-data text-sm font-bold text-faint w-6 shrink-0 tabular-nums">
                          #{data.cityRankings.length - 4 + i}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-medium text-ink group-hover:text-accent transition-colors text-sm">
                              {city.name}
                            </span>
                            <span className={`font-data text-base font-bold shrink-0 ${scoreTextClass(city.avgScore)}`}>
                              {city.avgScore.toFixed(1)}
                              <span className="text-xs text-faint font-normal">/10</span>
                            </span>
                          </div>
                          <div className="mt-2 h-1.5 rounded-full bg-[var(--color-rule)] overflow-hidden">
                            <div
                              className={`h-full rounded-full ${barColor}`}
                              style={{ width: `${(city.avgScore / 10) * 100}%` }}
                            />
                          </div>
                          <p className="text-xs text-faint mt-1.5">
                            {city.region} · {city.postcodeCount} areas tested
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-faint group-hover:text-accent transition-colors shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            <p className="mt-4 text-center">
              <Link
                href="/rankings/"
                className="text-sm text-accent hover:underline underline-offset-2 inline-flex items-center gap-1"
              >
                See all {data.cityRankings.length} city rankings
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </p>
          </section>
        </ScrollReveal>

        <hr className="border-rule mt-12" />

        {/* ── Most Common Contaminants ── */}
        <ScrollReveal delay={0}>
          <section className="mt-10">
            <h2 className="font-display text-3xl text-ink italic mb-2">
              Most common contaminants
            </h2>
            <p className="text-sm text-muted mb-6">
              The 10 most frequently flagged contaminants across all UK postcode districts monitored.
              A contaminant is &quot;flagged&quot; when levels exceed WHO guidelines, even if within UK legal limits.
            </p>

            <div className="card overflow-hidden">
              <div className="hidden sm:grid sm:grid-cols-[40px_1fr_100px_100px] gap-3 px-5 py-3 bg-[var(--color-wash)] border-b border-[var(--color-rule)] text-xs text-faint uppercase tracking-wider font-semibold">
                <span>#</span>
                <span>Contaminant</span>
                <span className="text-right">Postcodes</span>
                <span className="text-right">% of total</span>
              </div>

              {data.topContaminants.map((c, i) => (
                <div
                  key={c.name}
                  className="grid grid-cols-[32px_1fr_auto] sm:grid-cols-[40px_1fr_100px_100px] gap-x-3 gap-y-0.5 items-center px-5 py-3.5 border-b border-[var(--color-rule)] last:border-b-0"
                >
                  <span className="font-data text-sm text-faint tabular-nums">{i + 1}</span>
                  <div className="min-w-0">
                    <span className="font-medium text-sm text-ink">{c.name}</span>
                  </div>
                  <span className="font-data text-sm text-right text-muted tabular-nums">
                    {c.count.toLocaleString()}
                  </span>
                  <span className="font-data text-sm text-right text-muted hidden sm:block tabular-nums">
                    {c.percentage}%
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-3 text-xs text-faint">
              Flagged means the measured value exceeds the WHO guideline or UK regulatory limit for that parameter.
              A postcode is counted once per contaminant regardless of how many samples were taken.
            </p>
          </section>
        </ScrollReveal>

        <hr className="border-rule mt-12" />

        {/* ── PFAS ── */}
        <ScrollReveal delay={0}>
          <section className="mt-10">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-6 h-6 text-[var(--color-pfas,var(--color-warning))]" />
              <h2 className="font-display text-3xl text-ink italic">
                PFAS: the emerging threat
              </h2>
            </div>

            <div className="max-w-3xl">
              <p className="text-base text-body leading-relaxed mt-4">
                PFAS (&quot;forever chemicals&quot;) were detected in{" "}
                <strong className="text-ink">{data.pfasCount} postcode districts</strong>,
                representing{" "}
                <strong className="text-ink">{data.pfasPercentage}%</strong> of all areas
                monitored. These synthetic compounds persist indefinitely in the environment and
                accumulate in the human body. The UK currently has{" "}
                <strong className="text-ink">no legal limit</strong> for PFAS in drinking water,
                though the Drinking Water Inspectorate is actively reviewing the evidence.
              </p>
              <p className="text-base text-body leading-relaxed mt-3">
                PFAS detections are concentrated in industrial areas and near military bases where
                firefighting foams have been used. Reverse osmosis and activated carbon filters
                can reduce PFAS levels by 90% or more.
              </p>
              <div className="flex flex-wrap gap-3 mt-5">
                <Link
                  href="/pfas/"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline underline-offset-2"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  PFAS live tracker
                </Link>
                <Link
                  href="/guides/best-water-filter-pfas/"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline underline-offset-2"
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  Best filters for PFAS
                </Link>
              </div>
            </div>
          </section>
        </ScrollReveal>

        <hr className="border-rule mt-12" />

        {/* ── Supplier Performance ── */}
        <ScrollReveal delay={0}>
          <section className="mt-10">
            <h2 className="font-display text-3xl text-ink italic mb-2">
              Water supplier performance
            </h2>
            <p className="text-sm text-muted mb-6">
              {data.supplierRankings.length} UK water companies ranked by average safety score across
              all postcodes in their service area.
            </p>

            <div className="card overflow-hidden">
              <div className="hidden sm:grid sm:grid-cols-[40px_1fr_100px_120px] gap-4 px-5 py-3 bg-[var(--color-wash)] border-b border-[var(--color-rule)] text-xs text-faint uppercase tracking-wider font-semibold">
                <span>#</span>
                <span>Company</span>
                <span className="text-right">Avg score</span>
                <span className="text-right">Areas served</span>
              </div>

              {data.supplierRankings.map((supplier, i) => (
                <Link
                  key={supplier.id}
                  href={`/supplier/${supplier.id}/`}
                  className="grid grid-cols-[32px_1fr_auto] sm:grid-cols-[40px_1fr_100px_120px] gap-x-4 gap-y-0.5 items-center px-5 py-4 border-b border-[var(--color-rule)] last:border-b-0 hover:bg-[var(--color-wash)] transition-colors group"
                >
                  <span className="font-data text-sm text-faint tabular-nums">
                    {i <= 2 ? (
                      <span
                        className={
                          i === 0
                            ? "text-amber-500 font-bold"
                            : i === 1
                              ? "text-slate-400 font-bold"
                              : "text-amber-700 font-bold"
                        }
                      >
                        {i + 1}
                      </span>
                    ) : (
                      i + 1
                    )}
                  </span>

                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[var(--color-wash)] flex items-center justify-center shrink-0 border border-[var(--color-rule)]">
                      <Building2 className="w-3.5 h-3.5 text-faint group-hover:text-accent transition-colors" />
                    </div>
                    <span className="font-medium text-sm text-ink group-hover:text-accent transition-colors truncate">
                      {supplier.name}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1 font-data text-sm font-bold px-2.5 py-0.5 rounded-full ${scoreBgClass(supplier.avgScore)}`}>
                      {supplier.avgScore.toFixed(1)}
                    </span>
                  </div>

                  <span className="font-data text-sm text-right text-muted hidden sm:block tabular-nums">
                    {supplier.postcodeCount.toLocaleString()}
                  </span>
                </Link>
              ))}
            </div>

            <p className="mt-3 text-xs text-faint">
              Only companies serving 2 or more postcode districts are shown. Score is the unweighted
              average across all postcodes in the supplier&apos;s coverage area.
            </p>
          </section>
        </ScrollReveal>

        <hr className="border-rule mt-12" />

        {/* ── Hard Water ── */}
        <ScrollReveal delay={0}>
          <section className="mt-10">
            <div className="flex items-center gap-3 mb-2">
              <Droplets className="w-6 h-6 text-[var(--color-accent)]" />
              <h2 className="font-display text-3xl text-ink italic">
                Hard water map
              </h2>
            </div>

            <div className="max-w-3xl">
              <p className="text-base text-body leading-relaxed mt-4">
                {data.hardWaterPercentage > 0 ? (
                  <>
                    <strong className="text-ink">{data.hardWaterPercentage}%</strong> of UK
                    postcode districts with hardness data have water above 200 mg/L CaCO3 — classified
                    as &quot;hard&quot; or &quot;very hard.&quot; That&apos;s{" "}
                    <strong className="text-ink">{data.hardWaterCount.toLocaleString()}</strong> out
                    of {data.hardnessChecked.toLocaleString()} areas tested.
                  </>
                ) : (
                  <>
                    Hard water affects large areas of southern and eastern England. Water above
                    200 mg/L CaCO3 causes limescale buildup in pipes, kettles, and appliances.
                  </>
                )}
              </p>
              <p className="text-base text-body leading-relaxed mt-3">
                Hard water is not a health risk, but it increases energy bills, shortens appliance
                lifespans, and causes limescale buildup. A water softener can save an estimated
                £200+/year in a hard water area.
              </p>
              <div className="flex flex-wrap gap-3 mt-5">
                <Link
                  href="/hardness/"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline underline-offset-2"
                >
                  <Droplets className="w-3.5 h-3.5" />
                  Interactive hardness map
                </Link>
                <Link
                  href="/guides/best-water-softener-uk/"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline underline-offset-2"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Best water softeners
                </Link>
              </div>
            </div>
          </section>
        </ScrollReveal>

        <hr className="border-rule mt-12" />

        {/* ── Methodology ── */}
        <ScrollReveal delay={0}>
          <section className="mt-10">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-6 h-6 text-[var(--color-accent)]" />
              <h2 className="font-display text-3xl text-ink italic">
                Methodology
              </h2>
            </div>

            <div className="max-w-3xl">
              <p className="text-base text-body leading-relaxed mt-4">
                Each UK postcode district receives a safety score from 0 to 10 based on measured
                contaminant levels against two benchmarks: UK legal limits (set by the Drinking
                Water Inspectorate) and WHO advisory guidelines. Scores are computed daily from
                the latest available monitoring data.
              </p>
              <p className="text-base text-body leading-relaxed mt-3">
                City, supplier, and regional scores are unweighted averages across all postcode
                districts with valid data in the most recent 3 years. PFAS detections are flagged
                separately because the UK has no legal limit for PFAS in drinking water. A lower
                score does not mean water is unsafe — all UK tap water meets regulatory standards.
              </p>
              <p className="mt-4">
                <Link
                  href="/about/methodology/"
                  className="text-sm text-accent hover:underline underline-offset-2 inline-flex items-center gap-1"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Full methodology
                </Link>
              </p>
            </div>
          </section>
        </ScrollReveal>

        <hr className="border-rule mt-12" />

        {/* ── Data Sources ── */}
        <ScrollReveal delay={0}>
          <section className="mt-10">
            <div className="flex items-center gap-3 mb-2">
              <Database className="w-6 h-6 text-[var(--color-accent)]" />
              <h2 className="font-display text-3xl text-ink italic">
                Data sources
              </h2>
            </div>

            <div className="max-w-3xl">
              <ul className="mt-4 space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] mt-2 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-ink">Environment Agency Water Quality Archive</p>
                    <p className="text-sm text-muted">
                      Environmental monitoring data for rivers, groundwater, and abstraction points
                      across England. Open Government Licence v3.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] mt-2 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-ink">Drinking Water Inspectorate (DWI)</p>
                    <p className="text-sm text-muted">
                      Regulatory compliance data for all public water supplies in England and Wales.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] mt-2 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-ink">Stream Water Data Portal</p>
                    <p className="text-sm text-muted">
                      Real-time drinking water test results from UK water companies, including treatment
                      works output and distribution network sampling.
                    </p>
                  </div>
                </li>
              </ul>
              <p className="mt-5">
                <Link
                  href="/about/data-sources/"
                  className="text-sm text-accent hover:underline underline-offset-2 inline-flex items-center gap-1"
                >
                  <Database className="w-3.5 h-3.5" />
                  Full data source documentation
                </Link>
              </p>
            </div>
          </section>
        </ScrollReveal>

        <hr className="border-rule mt-12" />

        {/* ── PostcodeSearch CTA ── */}
        <ScrollReveal delay={0}>
          <section className="mt-10 mb-10">
            <div className="card p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-[var(--color-accent-light,var(--color-wash))] flex items-center justify-center">
                  <Search className="w-6 h-6 text-accent" />
                </div>
              </div>
              <h2 className="font-display text-2xl text-ink italic mb-2">
                Check your water quality
              </h2>
              <p className="text-sm text-muted mb-6 max-w-lg mx-auto">
                Enter your postcode to see a detailed water quality report for your area, including
                contaminant levels, PFAS status, and supplier information.
              </p>
              <div className="max-w-md mx-auto">
                <PostcodeSearch size="lg" />
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* ── Related links ── */}
        <ScrollReveal delay={0}>
          <section className="mb-8">
            <h2 className="font-display text-2xl text-ink italic mb-4">
              Related resources
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link href="/rankings/" className="card p-4 group">
                <p className="font-medium text-sm text-ink group-hover:text-accent transition-colors">
                  City Rankings
                </p>
                <p className="text-xs text-faint mt-1">
                  All {data.cityRankings.length} UK cities ranked by water quality
                </p>
              </Link>
              <Link href="/pfas/" className="card p-4 group">
                <p className="font-medium text-sm text-ink group-hover:text-accent transition-colors">
                  PFAS Tracker
                </p>
                <p className="text-xs text-faint mt-1">
                  Live map of PFAS detections across the UK
                </p>
              </Link>
              <Link href="/guides/best-water-filters-uk/" className="card p-4 group">
                <p className="font-medium text-sm text-ink group-hover:text-accent transition-colors">
                  Water Filter Guide
                </p>
                <p className="text-xs text-faint mt-1">
                  Find the right filter for your water quality
                </p>
              </Link>
            </div>
          </section>
        </ScrollReveal>

        {/* Footer */}
        <footer className="mt-4 pb-6 text-sm text-faint leading-relaxed border-t border-[var(--color-rule)] pt-6">
          Data from the Environment Agency Water Quality Archive, Drinking Water Inspectorate, and
          water company testing via the Stream Water Data Portal. Report last updated{" "}
          {formattedDate}. See our{" "}
          <Link
            href="/about/methodology/"
            className="underline underline-offset-2 hover:text-muted transition-colors"
          >
            methodology
          </Link>{" "}
          for how scores are calculated.
        </footer>
      </div>
    </div>
  );
}
