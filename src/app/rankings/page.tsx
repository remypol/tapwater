import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, TrendingUp, TrendingDown, Building2, MapPin, Info } from "lucide-react";
import { BreadcrumbSchema, FAQSchema } from "@/components/json-ld";
import { ScrollReveal } from "@/components/scroll-reveal";
import { getAllPostcodeDistricts, getPostcodeData, getSuppliersList } from "@/lib/data";
import { getScoreColor } from "@/lib/types";
import { CITIES } from "@/lib/cities";
import { REGIONS } from "@/lib/regions";

export const revalidate = 86400;

// ── Types ──

interface CityRanking {
  rank: number;
  slug: string;
  name: string;
  region: string;
  avgScore: number;
  contaminantsFlagged: number;
  pfasCount: number;
  postcodeCount: number;
  primarySupplier: string;
  primarySupplierId: string;
}

interface SupplierRanking {
  rank: number;
  id: string;
  name: string;
  avgScore: number;
  postcodeCount: number;
}

interface RegionRanking {
  rank: number;
  slug: string;
  name: string;
  avgScore: number;
  postcodeCount: number;
  cityCount: number;
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

function scoreBorderClass(score: number): string {
  const c = getScoreColor(score);
  if (c === "safe") return "border-[var(--color-safe)]";
  if (c === "warning") return "border-[var(--color-warning)]";
  return "border-[var(--color-danger)]";
}

// ── Metadata ──

export function generateMetadata(): Metadata {
  const year = new Date().getFullYear();
  return {
    title: `UK Water Quality Rankings (${year})`,
    description: `Which UK city has the best tap water? See ${year} rankings for all 51 major cities, water companies, and regions. Based on official Environment Agency data.`,
    openGraph: {
      title: `UK Water Quality Rankings ${year}`,
      description: "Which UK city has the best tap water? Rankings for 51 cities, water companies, and regions.",
      url: "https://www.tapwater.uk/rankings",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `UK Water Quality Rankings ${year}`,
      description: "Which UK city has the best tap water? See the full rankings.",
    },
  };
}

// ── Data fetching ──

async function buildRankings() {
  const districts = await getAllPostcodeDistricts();

  // Load all postcode data in parallel batches
  const allData = (
    await Promise.all(districts.map((d) => getPostcodeData(d)))
  ).filter(Boolean) as Awaited<ReturnType<typeof getPostcodeData>>[];
  const scored = allData.filter((p) => p!.safetyScore >= 0) as NonNullable<typeof allData[0]>[];

  // Total postcode count for hero
  const totalPostcodes = scored.length;

  // Latest date for hero
  const latestDate = scored
    .map((p) => p.lastUpdated)
    .filter(Boolean)
    .sort()
    .reverse()[0] ?? new Date().toISOString().split("T")[0];

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
    const contaminantsFlagged = cityPostcodes.reduce(
      (s, p) => s + p.contaminantsFlagged,
      0
    );
    const pfasCount = cityPostcodes.filter((p) => p.pfasDetected).length;

    // Primary supplier
    const supplierCounts = new Map<string, { name: string; id: string; count: number }>();
    for (const p of cityPostcodes) {
      const existing = supplierCounts.get(p.supplierId);
      if (existing) existing.count++;
      else supplierCounts.set(p.supplierId, { name: p.supplier, id: p.supplierId, count: 1 });
    }
    const primary = Array.from(supplierCounts.values()).sort((a, b) => b.count - a.count)[0] ?? {
      name: "Unknown",
      id: "unknown",
    };

    cityRankings.push({
      rank: 0,
      slug: city.slug,
      name: city.name,
      region: city.region,
      avgScore,
      contaminantsFlagged,
      pfasCount,
      postcodeCount: cityPostcodes.length,
      primarySupplier: primary.name,
      primarySupplierId: primary.id,
    });
  }

  // Sort by score descending, assign ranks
  cityRankings.sort((a, b) => b.avgScore - a.avgScore);
  cityRankings.forEach((c, i) => (c.rank = i + 1));

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
      rank: 0,
      id,
      name,
      avgScore: scores.reduce((s, v) => s + v, 0) / scores.length,
      postcodeCount: postcodes,
    }))
    .filter((s) => s.postcodeCount >= 2) // filter out single-postcode anomalies
    .sort((a, b) => b.avgScore - a.avgScore);
  supplierRankings.forEach((s, i) => (s.rank = i + 1));

  // ── Regional rankings ──
  const regionRankings: RegionRanking[] = [];

  for (const region of REGIONS) {
    const regionPostcodes: typeof scored = [];
    const citySlugsInRegion = new Set(region.cities);
    let cityCount = 0;

    for (const city of CITIES) {
      if (!citySlugsInRegion.has(city.slug)) continue;
      const lowerMatches = city.matches.map((m) => m.toLowerCase());
      const cityPcs = scored.filter((p) => lowerMatches.includes(p.city.toLowerCase()));
      if (cityPcs.length > 0) {
        cityCount++;
        regionPostcodes.push(...cityPcs);
      }
    }

    if (regionPostcodes.length === 0) continue;

    // Dedupe by district
    const seen = new Set<string>();
    const unique = regionPostcodes.filter((p) => {
      if (seen.has(p.district)) return false;
      seen.add(p.district);
      return true;
    });

    const avgScore = unique.reduce((s, p) => s + p.safetyScore, 0) / unique.length;

    regionRankings.push({
      rank: 0,
      slug: region.slug,
      name: region.name,
      avgScore,
      postcodeCount: unique.length,
      cityCount,
    });
  }

  regionRankings.sort((a, b) => b.avgScore - a.avgScore);
  regionRankings.forEach((r, i) => (r.rank = i + 1));

  return {
    cityRankings,
    supplierRankings,
    regionRankings,
    totalPostcodes,
    latestDate,
  };
}

// ── Page ──

export default async function RankingsPage() {
  const year = new Date().getFullYear();
  const { cityRankings, supplierRankings, regionRankings, totalPostcodes, latestDate } =
    await buildRankings();

  const top5 = cityRankings.slice(0, 5);
  const bottom5 = cityRankings.slice(-5).reverse();

  const topCity = cityRankings[0];
  const lastCity = cityRankings[cityRankings.length - 1];
  const topSupplier = supplierRankings[0];

  const formattedDate = latestDate
    ? new Date(latestDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "2025";

  const faqs = [
    {
      question: "Which UK city has the best tap water?",
      answer: topCity
        ? `${topCity.name} has the best tap water quality of all 51 major UK cities, with an average safety score of ${topCity.avgScore.toFixed(1)}/10 across ${topCity.postcodeCount} postcode districts tested. Data is sourced from the Environment Agency.`
        : "Rankings are computed from Environment Agency water quality data across all major UK cities.",
    },
    {
      question: "Which UK city has the worst tap water?",
      answer: lastCity
        ? `${lastCity.name} has the lowest water quality score of the cities ranked, with an average safety score of ${lastCity.avgScore.toFixed(1)}/10 across ${lastCity.postcodeCount} postcode districts. All UK tap water meets legal safety standards — lower scores reflect elevated contaminant levels relative to WHO guidelines.`
        : "Rankings are based on Environment Agency monitoring data.",
    },
    {
      question: "Which water company has the best water?",
      answer: topSupplier
        ? `${topSupplier.name} ranks as the top-performing water supplier with an average safety score of ${topSupplier.avgScore.toFixed(1)}/10 across ${topSupplier.postcodeCount} postcode districts served. Rankings are based on Environment Agency and water company testing data.`
        : "Supplier rankings are based on average safety scores across all postcodes served.",
    },
    {
      question: "How are the water quality rankings calculated?",
      answer: `Rankings are based on Environment Agency water quality monitoring data. Each postcode district receives a safety score from 0–10 based on contaminant levels measured against UK legal limits and WHO guidelines. City and supplier scores are weighted averages across all postcode districts with data. Lower scores indicate more contaminants exceeding recommended thresholds — not that water is unsafe to drink.`,
    },
  ];

  return (
    <div className="bg-hero min-h-screen">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8 py-8 lg:py-14">
        <BreadcrumbSchema
          items={[
            { name: "Home", url: "https://www.tapwater.uk" },
            { name: "Rankings", url: "https://www.tapwater.uk/rankings" },
          ]}
        />
        <FAQSchema faqs={faqs} />

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-faint">
          <Link href="/" className="hover:text-accent transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-ink font-medium">Rankings</span>
        </nav>

        {/* ── Hero ── */}
        <header className="mt-6 mb-10">
          <p className="text-xs uppercase tracking-[0.15em] text-accent font-semibold animate-fade-up delay-1">
            {year} Report
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-ink tracking-tight mt-2 animate-fade-up delay-2">
            UK Water Quality{" "}
            <span className="italic">Rankings</span>
          </h1>
          <p className="text-muted mt-3 max-w-2xl text-lg animate-fade-up delay-3">
            Based on{" "}
            <span className="font-semibold text-ink">{totalPostcodes.toLocaleString()} postcode districts</span>{" "}
            tested. Last updated:{" "}
            <span className="font-medium text-ink">{formattedDate}</span>.
          </p>
          <p className="mt-2 animate-fade-up delay-4">
            <Link
              href="/about/methodology/"
              className="text-sm text-accent hover:underline underline-offset-2 inline-flex items-center gap-1"
            >
              <Info className="w-3.5 h-3.5" />
              How scores are calculated
            </Link>
          </p>

          {/* Key stat strip */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-up delay-4">
            <div className="card p-4 text-center">
              <p className="font-data text-2xl font-bold text-ink">{cityRankings.length}</p>
              <p className="text-xs text-faint uppercase tracking-wider mt-1">Cities ranked</p>
            </div>
            <div className="card p-4 text-center">
              <p className="font-data text-2xl font-bold text-ink">{supplierRankings.length}</p>
              <p className="text-xs text-faint uppercase tracking-wider mt-1">Water companies</p>
            </div>
            <div className="card p-4 text-center">
              <p className="font-data text-2xl font-bold text-ink">{regionRankings.length}</p>
              <p className="text-xs text-faint uppercase tracking-wider mt-1">Regions</p>
            </div>
            <div className="card p-4 text-center">
              <p className="font-data text-2xl font-bold text-ink">{totalPostcodes.toLocaleString()}</p>
              <p className="text-xs text-faint uppercase tracking-wider mt-1">Areas tested</p>
            </div>
          </div>
        </header>

        <hr className="border-rule" />

        {/* ── Top 5 / Bottom 5 ── */}
        <ScrollReveal delay={0}>
          <section className="mt-10">
            <h2 className="font-display text-3xl text-ink italic mb-2">
              Best &amp; worst cities
            </h2>
            <p className="text-sm text-muted mb-8">
              The cities with the highest and lowest average water quality scores in the UK.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Best 5 */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-[var(--color-safe-light)] flex items-center justify-center shrink-0">
                    <TrendingUp className="w-3.5 h-3.5 text-[var(--color-safe)]" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-safe)]">
                    Top 5 — Cleanest water
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {top5.map((city, i) => (
                    <Link
                      key={city.slug}
                      href={`/city/${city.slug}/`}
                      className="group flex items-center gap-4 card px-5 py-4"
                    >
                      {/* Rank */}
                      <span className="font-data text-sm font-bold text-faint w-5 shrink-0 tabular-nums">
                        {i === 0 ? (
                          <span className="text-[var(--color-safe)] text-base">#1</span>
                        ) : (
                          `#${i + 1}`
                        )}
                      </span>

                      {/* Score bar background */}
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
                        {/* Score bar */}
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
                  {bottom5.map((city, i) => {
                    const rank = cityRankings.length - 4 + i;
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
                          #{rank}
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
          </section>
        </ScrollReveal>

        <hr className="border-rule mt-12" />

        {/* ── Full city table ── */}
        <ScrollReveal delay={0}>
          <section className="mt-10">
            <h2 className="font-display text-3xl text-ink italic mb-2">
              All cities ranked
            </h2>
            <p className="text-sm text-muted mb-6">
              {cityRankings.length} cities, ranked by average water quality score. Click any city for a detailed breakdown.
            </p>

            <div className="card overflow-hidden">
              {/* Table header */}
              <div className="hidden sm:grid sm:grid-cols-[40px_1fr_90px_110px_90px_160px] gap-3 px-5 py-3 bg-[var(--color-wash)] border-b border-[var(--color-rule)] text-xs text-faint uppercase tracking-wider font-semibold">
                <span>#</span>
                <span>City</span>
                <span className="text-right">Score</span>
                <span className="text-right">Issues flagged</span>
                <span className="text-right">PFAS</span>
                <span>Main supplier</span>
              </div>

              {/* Rows */}
              {cityRankings.map((city) => (
                <Link
                  key={city.slug}
                  href={`/city/${city.slug}/`}
                  className="grid grid-cols-[32px_1fr_auto] sm:grid-cols-[40px_1fr_90px_110px_90px_160px] gap-x-3 gap-y-0.5 items-center px-5 py-3.5 border-b border-[var(--color-rule)] last:border-b-0 hover:bg-[var(--color-wash)] transition-colors group"
                >
                  {/* Rank */}
                  <span className="font-data text-sm text-faint tabular-nums">
                    {city.rank}
                  </span>

                  {/* City name */}
                  <div className="min-w-0">
                    <span className="font-medium text-sm text-ink group-hover:text-accent transition-colors">
                      {city.name}
                    </span>
                    <span className="text-xs text-faint ml-2 hidden sm:inline">
                      {city.region}
                    </span>
                  </div>

                  {/* Score */}
                  <span
                    className={`font-data text-sm font-bold text-right tabular-nums ${scoreTextClass(city.avgScore)}`}
                  >
                    {city.avgScore.toFixed(1)}
                    <span className="text-xs text-faint font-normal">/10</span>
                  </span>

                  {/* Contaminants flagged */}
                  <span className="font-data text-sm text-right text-muted hidden sm:block tabular-nums">
                    {city.contaminantsFlagged}
                  </span>

                  {/* PFAS */}
                  <span className="font-data text-sm text-right hidden sm:block tabular-nums">
                    {city.pfasCount > 0 ? (
                      <span className="text-[var(--color-pfas)] font-semibold">
                        {city.pfasCount}
                      </span>
                    ) : (
                      <span className="text-faint">—</span>
                    )}
                  </span>

                  {/* Supplier */}
                  <span className="text-xs text-muted hidden sm:flex items-center gap-1.5 min-w-0">
                    <Building2 className="w-3 h-3 text-faint shrink-0" />
                    <span className="truncate">{city.primarySupplier}</span>
                  </span>
                </Link>
              ))}
            </div>

            <p className="mt-3 text-xs text-faint">
              Score is average across all postcode districts in each city. PFAS column shows number of postcode districts where forever chemicals were detected.
            </p>
          </section>
        </ScrollReveal>

        <hr className="border-rule mt-12" />

        {/* ── Supplier leaderboard ── */}
        <ScrollReveal delay={0}>
          <section className="mt-10">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h2 className="font-display text-3xl text-ink italic">
                  Water company leaderboard
                </h2>
                <p className="text-sm text-muted mt-1 mb-6">
                  {supplierRankings.length} water companies ranked by average safety score across all postcodes served.
                </p>
              </div>
            </div>

            <div className="card overflow-hidden">
              <div className="hidden sm:grid sm:grid-cols-[40px_1fr_100px_120px] gap-4 px-5 py-3 bg-[var(--color-wash)] border-b border-[var(--color-rule)] text-xs text-faint uppercase tracking-wider font-semibold">
                <span>#</span>
                <span>Company</span>
                <span className="text-right">Avg score</span>
                <span className="text-right">Areas served</span>
              </div>

              {supplierRankings.map((supplier) => (
                <Link
                  key={supplier.id}
                  href={`/supplier/${supplier.id}/`}
                  className="grid grid-cols-[32px_1fr_auto] sm:grid-cols-[40px_1fr_100px_120px] gap-x-4 gap-y-0.5 items-center px-5 py-4 border-b border-[var(--color-rule)] last:border-b-0 hover:bg-[var(--color-wash)] transition-colors group"
                >
                  {/* Rank with medal for top 3 */}
                  <span className="font-data text-sm text-faint tabular-nums">
                    {supplier.rank <= 3 ? (
                      <span
                        className={
                          supplier.rank === 1
                            ? "text-amber-500 font-bold"
                            : supplier.rank === 2
                              ? "text-slate-400 font-bold"
                              : "text-amber-700 font-bold"
                        }
                      >
                        {supplier.rank}
                      </span>
                    ) : (
                      supplier.rank
                    )}
                  </span>

                  {/* Name */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[var(--color-wash)] flex items-center justify-center shrink-0 border border-[var(--color-rule)]">
                      <Building2 className="w-3.5 h-3.5 text-faint group-hover:text-accent transition-colors" />
                    </div>
                    <span className="font-medium text-sm text-ink group-hover:text-accent transition-colors truncate">
                      {supplier.name}
                    </span>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1 font-data text-sm font-bold px-2.5 py-0.5 rounded-full ${scoreBgClass(supplier.avgScore)}`}>
                      {supplier.avgScore.toFixed(1)}
                    </span>
                  </div>

                  {/* Areas */}
                  <span className="font-data text-sm text-right text-muted hidden sm:block tabular-nums">
                    {supplier.postcodeCount.toLocaleString()}
                  </span>
                </Link>
              ))}
            </div>

            <p className="mt-3 text-xs text-faint">
              Only companies serving 2 or more postcode districts are shown. Score is the unweighted average across all postcodes in the supplier&apos;s coverage area.
            </p>
          </section>
        </ScrollReveal>

        <hr className="border-rule mt-12" />

        {/* ── Regional comparison ── */}
        <ScrollReveal delay={0}>
          <section className="mt-10">
            <h2 className="font-display text-3xl text-ink italic mb-2">
              Regional comparison
            </h2>
            <p className="text-sm text-muted mb-6">
              {regionRankings.length} regions ranked by average water quality score.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {regionRankings.map((region) => (
                <Link
                  key={region.slug}
                  href={`/region/${region.slug}/`}
                  className="card p-4 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-data text-xs text-faint tabular-nums">
                          #{region.rank}
                        </span>
                        <MapPin className="w-3 h-3 text-faint" />
                      </div>
                      <p className="font-medium text-sm text-ink group-hover:text-accent transition-colors leading-snug">
                        {region.name}
                      </p>
                      <p className="text-xs text-faint mt-1">
                        {region.cityCount} cities · {region.postcodeCount} areas
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className={`font-data text-xl font-bold ${scoreTextClass(region.avgScore)}`}>
                        {region.avgScore.toFixed(1)}
                      </span>
                      <p className="text-xs text-faint">/10</p>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div className="mt-3 h-1 rounded-full bg-[var(--color-rule)] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        getScoreColor(region.avgScore) === "safe"
                          ? "bg-[var(--color-safe)]"
                          : getScoreColor(region.avgScore) === "warning"
                            ? "bg-[var(--color-warning)]"
                            : "bg-[var(--color-danger)]"
                      }`}
                      style={{ width: `${(region.avgScore / 10) * 100}%` }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </ScrollReveal>

        <hr className="border-rule mt-12" />

        {/* ── Methodology note ── */}
        <ScrollReveal delay={0}>
          <section className="mt-10 mb-8">
            <h2 className="font-display text-2xl text-ink italic mb-3">
              How these rankings work
            </h2>
            <div className="max-w-3xl">
              <p className="text-base text-body leading-relaxed">
                Rankings are based on water quality monitoring data from the Environment Agency Water Quality Archive
                and water company testing via the Stream Water Data Portal. Each postcode district receives a safety
                score from 0–10 based on measured contaminant levels against UK legal limits and WHO guidelines.
                City, supplier, and regional scores are averages across all postcode districts with data.
              </p>
              <p className="text-base text-body leading-relaxed mt-3">
                A lower score does not mean water is unsafe — all UK tap water meets legal standards. Scores reflect
                how cleanly water performs relative to both mandatory UK limits and stricter WHO advisory guidelines.
                PFAS detections are flagged where detected, even though the UK has no legal limit for PFAS in
                drinking water.
              </p>
              <p className="mt-4">
                <Link
                  href="/about/methodology/"
                  className="text-sm text-accent hover:underline underline-offset-2 inline-flex items-center gap-1"
                >
                  <Info className="w-3.5 h-3.5" />
                  Read the full methodology
                </Link>
              </p>
            </div>
          </section>
        </ScrollReveal>

        {/* Footer */}
        <footer className="mt-4 pb-6 text-sm text-faint leading-relaxed border-t border-[var(--color-rule)] pt-6">
          Data from the Environment Agency Water Quality Archive and water company testing. Rankings last updated{" "}
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
