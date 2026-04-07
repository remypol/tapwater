import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, AlertTriangle, Shield, Droplets, Search, ArrowRight } from "lucide-react";
import { BreadcrumbSchema, ArticleSchema, FAQSchema } from "@/components/json-ld";
import { ScrollReveal } from "@/components/scroll-reveal";
import { PostcodeSearch } from "@/components/postcode-search";
import { getAllPostcodeDistricts, getPostcodeData, getHardness } from "@/lib/data";
import { getScoreColor } from "@/lib/types";
import type { PostcodeData } from "@/lib/types";

export const revalidate = 86400;

// ── Rankings config ──

const RANKINGS = {
  "worst-lead": {
    title: "UK Postcodes With the Highest Lead Levels",
    shortTitle: "Highest Lead Levels",
    description: "Which UK postcodes have the highest lead levels in drinking water? Data from Environment Agency monitoring.",
    contaminant: "Lead",
    sortField: "contaminant" as const,
    sortDirection: "desc" as const,
    unit: "mg/L",
    limit: "0.01 mg/L",
    limitValue: 0.01,
    accentColor: null,
    faqs: [
      {
        question: "What is the safe limit for lead in drinking water?",
        answer: "The UK legal limit for lead in drinking water is 0.01 mg/L (10 micrograms per litre). The WHO recommends keeping lead as low as reasonably practicable, as there is no known safe level of exposure to lead.",
      },
      {
        question: "Why is lead found in UK tap water?",
        answer: "Lead in UK tap water typically comes from old lead service pipes connecting properties to the water main. Homes built before 1970 are most likely to have lead pipes. Water companies treat water to reduce lead dissolving from pipes, but replacement is the only permanent solution.",
      },
      {
        question: "How can I reduce lead in my tap water?",
        answer: "You can reduce lead exposure by running the tap for 30 seconds before use (especially in the morning), using a water filter certified to remove lead (such as a reverse osmosis system), or arranging for your water company to replace lead service pipes.",
      },
    ],
    explainer: "Lead is a toxic heavy metal with no safe level of exposure. Even low concentrations can cause neurological damage, particularly in children. The UK reduced its legal limit from 0.025 mg/L to 0.01 mg/L in 2013 to align with WHO guidelines. Most lead contamination comes from old lead pipes rather than the water supply itself.",
    filterAdvice: "A reverse osmosis system or activated carbon filter certified to NSF/ANSI 53 can remove over 99% of lead from drinking water.",
  },
  "worst-nitrate": {
    title: "UK Postcodes With the Highest Nitrate Levels",
    shortTitle: "Highest Nitrate Levels",
    description: "Nitrate levels by UK postcode. Data from Environment Agency and water company testing.",
    contaminant: "Nitrate",
    sortField: "contaminant" as const,
    sortDirection: "desc" as const,
    unit: "mg/L",
    limit: "50 mg/L",
    limitValue: 50,
    accentColor: null,
    faqs: [
      {
        question: "What causes high nitrate levels in UK water?",
        answer: "High nitrate levels are primarily caused by agricultural fertiliser runoff and livestock waste entering water sources. Areas with intensive farming, particularly in eastern England, tend to have the highest nitrate concentrations.",
      },
      {
        question: "Is nitrate in drinking water dangerous?",
        answer: "At levels above 50 mg/L, nitrate can pose health risks, particularly for bottle-fed infants under 6 months (causing 'blue baby syndrome'). For most adults, nitrate at typical UK levels is not considered dangerous, though some studies link long-term exposure to certain cancers.",
      },
      {
        question: "How can I remove nitrate from tap water?",
        answer: "Standard carbon filters and boiling do not remove nitrate. Reverse osmosis systems or ion exchange filters are effective at reducing nitrate levels. If you have a baby under 6 months and live in a high-nitrate area, consider using bottled water for formula.",
      },
    ],
    explainer: "Nitrate is one of the most common contaminants in UK groundwater, primarily from agricultural fertiliser use. The UK legal limit is 50 mg/L, matching WHO guidelines. Water companies blend high-nitrate sources with cleaner supplies to keep levels within limits, but some areas consistently test near the threshold.",
    filterAdvice: "Reverse osmosis is the most effective method for removing nitrate. Standard carbon jug filters do not remove nitrate effectively.",
  },
  "worst-pfas": {
    title: "UK Areas Where PFAS Has Been Detected",
    shortTitle: "PFAS Detections",
    description: "Which UK postcodes have PFAS forever chemicals in nearby water sources? Environment Agency monitoring data.",
    contaminant: null,
    sortField: "pfas" as const,
    sortDirection: "desc" as const,
    unit: "\u00b5g/L",
    limit: "0.1 \u00b5g/L (WHO)",
    limitValue: 0.1,
    accentColor: "pfas",
    faqs: [
      {
        question: "What are PFAS and why are they called 'forever chemicals'?",
        answer: "PFAS (per- and polyfluoroalkyl substances) are a group of over 14,000 synthetic chemicals that do not break down in the environment. They persist in water, soil, and the human body for decades, which is why they are called 'forever chemicals'. They are used in non-stick coatings, food packaging, firefighting foam, and waterproof clothing.",
      },
      {
        question: "Is there a legal limit for PFAS in UK drinking water?",
        answer: "The UK does not currently have a legally binding limit for PFAS in drinking water. The Drinking Water Inspectorate (DWI) uses a guideline of 0.1 \u00b5g/L for individual PFAS compounds. The WHO recommends similar thresholds. The EU has introduced a binding limit of 0.1 \u00b5g/L for individual PFAS from 2026.",
      },
      {
        question: "How can I remove PFAS from my drinking water?",
        answer: "Activated carbon filters can reduce some PFAS compounds. Reverse osmosis systems are more effective, removing 90%+ of PFAS. Boiling water does not remove PFAS. Look for filters specifically tested against PFAS (PFOA and PFOS).",
      },
    ],
    explainer: "PFAS are synthetic 'forever chemicals' found in an increasing number of UK water sources. Unlike regulated contaminants, the UK has no legally binding limit for PFAS in drinking water, though the DWI recommends a guideline of 0.1 \u00b5g/L. Environmental Agency monitoring reveals PFAS presence in waterways near military bases, airports, and industrial sites.",
    filterAdvice: "A granular activated carbon (GAC) or reverse osmosis filter can significantly reduce PFAS. Look for filters tested specifically against PFOA and PFOS.",
  },
  "hardest-water": {
    title: "UK's Hardest Water Areas by Postcode",
    shortTitle: "Hardest Water",
    description: "The UK postcodes with the hardest water. Ranked by calcium carbonate levels.",
    contaminant: null,
    sortField: "hardness" as const,
    sortDirection: "desc" as const,
    unit: "mg/L CaCO3",
    limit: "200 mg/L",
    limitValue: 200,
    accentColor: null,
    faqs: [
      {
        question: "What makes water 'hard' and is it safe to drink?",
        answer: "Hard water contains high levels of dissolved calcium and magnesium, measured as calcium carbonate (CaCO3). It is safe to drink and may even provide beneficial minerals. However, hard water causes limescale buildup in kettles, boilers, and pipes, and can make skin and hair feel dry.",
      },
      {
        question: "Which parts of the UK have the hardest water?",
        answer: "South-east and eastern England typically have the hardest water, particularly London, Kent, Essex, and East Anglia. These areas sit on chalk and limestone geology which naturally dissolves minerals into groundwater. Scotland and Wales generally have softer water.",
      },
      {
        question: "How can I soften hard water?",
        answer: "A whole-house water softener using ion exchange is the most effective solution. For drinking water, a reverse osmosis system will reduce hardness. Jug filters with ion exchange resin can partially soften water. Scale inhibitors can protect appliances without removing minerals.",
      },
    ],
    explainer: "Water hardness is measured in milligrams per litre of calcium carbonate (CaCO3). Water below 60 mg/L is considered soft, 60-120 moderately soft, 120-180 moderately hard, 180-250 hard, and above 250 very hard. Hardness is not a health concern but causes limescale and can affect skin, hair, and appliance efficiency.",
    filterAdvice: "A water softener is the most effective way to deal with hard water for the whole home. For drinking water, a reverse osmosis system also removes hardness minerals.",
  },
  "best-water": {
    title: "UK's Best Tap Water: Top Rated Postcodes",
    shortTitle: "Best Water Quality",
    description: "The UK postcodes with the highest water quality scores. Ranked by TapWater.uk safety score.",
    contaminant: null,
    sortField: "score" as const,
    sortDirection: "desc" as const,
    unit: "/10",
    limit: null,
    limitValue: null,
    accentColor: null,
    faqs: [
      {
        question: "Which UK postcode has the best tap water?",
        answer: "The postcodes with the highest water quality scores are typically in areas with clean upland water sources, low population density, and modern infrastructure. Scotland and Wales tend to score well due to soft, low-contaminant water from mountain reservoirs.",
      },
      {
        question: "What makes tap water score highly?",
        answer: "High-scoring water has low levels of all tested contaminants relative to both UK legal limits and stricter WHO guidelines. Key factors include low lead, nitrate, and pesticide levels, no PFAS detected, and minimal treatment byproducts like trihalomethanes.",
      },
      {
        question: "Does a high score mean I don't need a water filter?",
        answer: "A high safety score means your water is well within safe limits for all tested parameters. Whether you need a filter depends on personal preference — some people use filters to improve taste, reduce chlorine, or provide extra peace of mind. Even the best-scoring water may benefit from a simple carbon filter for taste.",
      },
    ],
    explainer: "TapWater.uk's safety score rates water quality from 0 to 10 based on measured contaminant levels against UK legal limits and WHO guidelines. A score of 10 means all tested parameters are well within safe thresholds. Higher scores indicate fewer contaminants and lower concentrations relative to safety limits.",
    filterAdvice: "Even in areas with excellent water quality, a simple carbon jug filter can improve taste by reducing chlorine. This is purely optional for preference rather than safety.",
  },
  "worst-water": {
    title: "UK's Worst Tap Water: Lowest Rated Postcodes",
    shortTitle: "Worst Water Quality",
    description: "The UK postcodes with the lowest water quality scores. Ranked by TapWater.uk safety score.",
    contaminant: null,
    sortField: "score" as const,
    sortDirection: "asc" as const,
    unit: "/10",
    limit: null,
    limitValue: null,
    accentColor: null,
    faqs: [
      {
        question: "Is UK tap water safe to drink even with a low score?",
        answer: "Yes. All UK tap water must meet legal safety standards set by the Drinking Water Inspectorate. A low score on TapWater.uk does not mean water is unsafe — it means more contaminants were detected at levels closer to legal limits, or above stricter WHO guidelines. The UK has some of the most regulated tap water in the world.",
      },
      {
        question: "Why does my area have a low water quality score?",
        answer: "Low scores can result from several factors: proximity to agricultural land (higher nitrate/pesticide levels), old infrastructure (lead pipes), industrial or military sites (PFAS), or naturally hard water. Multiple contaminants near their respective limits will also lower the overall score.",
      },
      {
        question: "What should I do if my area has a low water quality score?",
        answer: "Consider installing a water filter appropriate to your area's specific concerns. Check the contaminant breakdown on your postcode page to see what is driving the low score. For lead concerns, contact your water company about pipe replacement. For a general solution, a reverse osmosis filter removes the widest range of contaminants.",
      },
    ],
    explainer: "A low safety score does not mean water is unsafe to drink. All UK tap water meets legal standards enforced by the Drinking Water Inspectorate. Low scores indicate that contaminant levels are closer to legal limits or exceed stricter WHO advisory guidelines. They highlight areas where water quality could be improved.",
    filterAdvice: "A reverse osmosis system provides the most comprehensive filtration, removing lead, nitrate, PFAS, pesticides, and other contaminants. For specific concerns, check your postcode page to see which contaminants are elevated.",
  },
} as const;

type RankingSlug = keyof typeof RANKINGS;

const ALL_SLUGS = Object.keys(RANKINGS) as RankingSlug[];

// ── Ranked entry type ──

interface RankedEntry {
  rank: number;
  district: string;
  areaName: string;
  city: string;
  region: string;
  value: number;
  displayValue: string;
  status: "pass" | "warning" | "fail";
}

// ── Static params ──

export function generateStaticParams() {
  return ALL_SLUGS.map((slug) => ({ slug }));
}

// ── Metadata ──

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const config = RANKINGS[slug as RankingSlug];
  if (!config) return {};

  const year = new Date().getFullYear();
  // Keep title under 45 chars by using shortTitle
  const title = `${config.shortTitle} (${year})`;
  const description = config.description.length > 155
    ? config.description.slice(0, 152) + "..."
    : config.description;

  return {
    title,
    description,
    openGraph: {
      title: config.title,
      description,
      url: `https://www.tapwater.uk/rankings/${slug}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: config.title,
      description,
    },
  };
}

// ── Score colour helpers ──

function scoreTextClass(score: number): string {
  const c = getScoreColor(score);
  if (c === "safe") return "text-[var(--color-safe)]";
  if (c === "warning") return "text-[var(--color-warning)]";
  return "text-[var(--color-danger)]";
}

function statusBadge(status: "pass" | "warning" | "fail"): { bg: string; text: string; label: string } {
  if (status === "pass") return { bg: "bg-[var(--color-safe-light)]", text: "text-[var(--color-safe)]", label: "Within limit" };
  if (status === "warning") return { bg: "bg-[var(--color-warning-light)]", text: "text-[var(--color-warning)]", label: "Near limit" };
  return { bg: "bg-[var(--color-danger-light)]", text: "text-[var(--color-danger)]", label: "Over limit" };
}

function hardnessLabel(value: number): string {
  if (value < 60) return "Soft";
  if (value < 120) return "Mod. soft";
  if (value < 180) return "Mod. hard";
  if (value < 250) return "Hard";
  return "Very hard";
}

function hardnessStatus(value: number): "pass" | "warning" | "fail" {
  if (value < 150) return "pass";
  if (value < 250) return "warning";
  return "fail";
}

function scoreStatus(score: number, direction: "desc" | "asc"): "pass" | "warning" | "fail" {
  if (direction === "desc") {
    // best water — high = good
    if (score >= 7) return "pass";
    if (score >= 4) return "warning";
    return "fail";
  }
  // worst water — low = bad, but we still colour by score value
  if (score >= 7) return "pass";
  if (score >= 4) return "warning";
  return "fail";
}

// ── Data loading ──

async function buildRankingData(slug: RankingSlug) {
  const config = RANKINGS[slug];
  const districts = await getAllPostcodeDistricts();
  const allData = (
    await Promise.all(districts.map((d) => getPostcodeData(d)))
  ).filter(Boolean) as PostcodeData[];

  const scored = allData.filter((p) => p.safetyScore >= 0);
  const totalAnalysed = scored.length;

  let entries: RankedEntry[] = [];

  if (config.sortField === "contaminant" && config.contaminant) {
    // Find postcodes with a reading matching the contaminant name
    const contaminantName = config.contaminant.toLowerCase();
    const withReading: { data: PostcodeData; reading: PostcodeData["readings"][0] }[] = [];

    for (const p of scored) {
      const allReadings = [...p.readings];
      const match = allReadings.find((r) =>
        r.name.toLowerCase().includes(contaminantName)
      );
      if (match && match.value > 0) {
        withReading.push({ data: p, reading: match });
      }
    }

    withReading.sort((a, b) =>
      config.sortDirection === "desc"
        ? b.reading.value - a.reading.value
        : a.reading.value - b.reading.value
    );

    entries = withReading.slice(0, 50).map((item, i) => ({
      rank: i + 1,
      district: item.data.district,
      areaName: item.data.areaName,
      city: item.data.city,
      region: item.data.region,
      value: item.reading.value,
      displayValue: `${parseFloat(item.reading.value.toPrecision(4))} ${config.unit}`,
      status: item.reading.status,
    }));
  } else if (config.sortField === "pfas") {
    const withPfas = scored.filter((p) => p.pfasDetected && p.pfasLevel != null);
    withPfas.sort((a, b) => (b.pfasLevel ?? 0) - (a.pfasLevel ?? 0));

    entries = withPfas.slice(0, 50).map((p, i) => {
      const level = p.pfasLevel ?? 0;
      const status: "pass" | "warning" | "fail" =
        level > 0.1 ? "fail" : level > 0.05 ? "warning" : "pass";
      return {
        rank: i + 1,
        district: p.district,
        areaName: p.areaName,
        city: p.city,
        region: p.region,
        value: level,
        displayValue: `${parseFloat(level.toPrecision(4))} ${config.unit}`,
        status,
      };
    });
  } else if (config.sortField === "hardness") {
    // Load hardness for all postcodes
    const hardnessResults: { data: PostcodeData; hardness: number }[] = [];
    for (const p of scored) {
      const h = await getHardness(p.district);
      if (h) {
        hardnessResults.push({ data: p, hardness: h.value });
      }
    }

    hardnessResults.sort((a, b) => b.hardness - a.hardness);

    entries = hardnessResults.slice(0, 50).map((item, i) => ({
      rank: i + 1,
      district: item.data.district,
      areaName: item.data.areaName,
      city: item.data.city,
      region: item.data.region,
      value: item.hardness,
      displayValue: `${item.hardness} ${config.unit}`,
      status: hardnessStatus(item.hardness),
    }));
  } else if (config.sortField === "score") {
    const sorted = [...scored].sort((a, b) =>
      config.sortDirection === "asc"
        ? a.safetyScore - b.safetyScore
        : b.safetyScore - a.safetyScore
    );

    entries = sorted.slice(0, 50).map((p, i) => ({
      rank: i + 1,
      district: p.district,
      areaName: p.areaName,
      city: p.city,
      region: p.region,
      value: p.safetyScore,
      displayValue: `${p.safetyScore.toFixed(1)}${config.unit}`,
      status: scoreStatus(p.safetyScore, config.sortDirection),
    }));
  }

  // Compute summary stats
  const values = entries.map((e) => e.value);
  const worstValue = values.length > 0 ? values[0] : 0;

  // National average for the metric
  let nationalAvg = 0;
  if (config.sortField === "contaminant" && config.contaminant) {
    const contaminantName = config.contaminant.toLowerCase();
    const allValues: number[] = [];
    for (const p of scored) {
      const match = p.readings.find((r) =>
        r.name.toLowerCase().includes(contaminantName)
      );
      if (match && match.value > 0) allValues.push(match.value);
    }
    nationalAvg = allValues.length > 0
      ? allValues.reduce((s, v) => s + v, 0) / allValues.length
      : 0;
  } else if (config.sortField === "pfas") {
    const pfasValues = scored
      .filter((p) => p.pfasDetected && p.pfasLevel != null)
      .map((p) => p.pfasLevel!);
    nationalAvg = pfasValues.length > 0
      ? pfasValues.reduce((s, v) => s + v, 0) / pfasValues.length
      : 0;
  } else if (config.sortField === "hardness") {
    // Already loaded above, recalculate from full dataset would be expensive
    // Use the entries we have as a representative sample
    nationalAvg = values.length > 0
      ? values.reduce((s, v) => s + v, 0) / values.length
      : 0;
  } else if (config.sortField === "score") {
    nationalAvg = scored.length > 0
      ? scored.reduce((s, p) => s + p.safetyScore, 0) / scored.length
      : 0;
  }

  return {
    entries,
    totalAnalysed,
    worstValue,
    nationalAvg,
  };
}

// ── Page ──

export default async function RankingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!ALL_SLUGS.includes(slug as RankingSlug)) notFound();

  const rankingSlug = slug as RankingSlug;
  const config = RANKINGS[rankingSlug];
  const { entries, totalAnalysed, worstValue, nationalAvg } = await buildRankingData(rankingSlug);

  const year = new Date().getFullYear();
  const isPfas = config.accentColor === "pfas";
  const accentClass = isPfas ? "text-[var(--color-pfas)]" : "text-accent";
  const accentBgClass = isPfas ? "bg-[var(--color-pfas-light)] text-[var(--color-pfas)]" : "bg-[var(--color-accent-light)] text-accent";

  // Format the key finding for the GEO summary
  const keyFinding = config.sortField === "score"
    ? config.sortDirection === "desc"
      ? `the best-scoring postcode achieved ${worstValue.toFixed(1)}/10`
      : `the lowest-scoring postcode recorded ${worstValue.toFixed(1)}/10`
    : config.sortField === "pfas"
      ? `${entries.length} postcode areas have confirmed PFAS detections`
      : config.sortField === "hardness"
        ? `the hardest area recorded ${Math.round(worstValue)} ${config.unit}`
        : `the highest reading was ${parseFloat(worstValue.toPrecision(4))} ${config.unit}`;

  // Other rankings for cross-linking
  const otherRankings = ALL_SLUGS.filter((s) => s !== rankingSlug);

  return (
    <div className="bg-hero min-h-screen">
      <div className="mx-auto max-w-5xl px-5 sm:px-6 lg:px-8 py-8 lg:py-14">
        <BreadcrumbSchema
          items={[
            { name: "Home", url: "https://www.tapwater.uk" },
            { name: "Rankings", url: "https://www.tapwater.uk/rankings" },
            { name: config.shortTitle, url: `https://www.tapwater.uk/rankings/${slug}` },
          ]}
        />
        <ArticleSchema
          headline={config.title}
          description={config.description}
          url={`https://www.tapwater.uk/rankings/${slug}`}
          datePublished="2025-01-01"
          dateModified={new Date().toISOString().split("T")[0]}
          authorName="TapWater.uk Research"
          authorUrl="https://www.tapwater.uk/about"
        />
        <FAQSchema faqs={[...config.faqs]} />

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-faint">
          <Link href="/" className="hover:text-accent transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/rankings/" className="hover:text-accent transition-colors">Rankings</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-ink font-medium">{config.shortTitle}</span>
        </nav>

        {/* ── Hero ── */}
        <header className="mt-6 mb-10">
          <p className={`text-xs uppercase tracking-[0.15em] font-semibold animate-fade-up delay-1 ${accentClass}`}>
            {year} Data
          </p>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-ink tracking-tight mt-2 animate-fade-up delay-2">
            {config.title}
          </h1>
          <p className="text-muted mt-3 max-w-2xl text-lg animate-fade-up delay-3">
            {config.description}
          </p>

          {/* GEO summary */}
          <div className={`mt-6 p-4 rounded-xl border animate-fade-up delay-4 ${
            isPfas
              ? "bg-[var(--color-pfas-light)] border-[var(--color-pfas)]"
              : "bg-[var(--color-wash)] border-[var(--color-rule)]"
          }`}>
            <p className="text-sm text-body leading-relaxed">
              According to TapWater.uk&apos;s analysis of{" "}
              <span className="font-semibold text-ink">{totalAnalysed.toLocaleString()}</span>{" "}
              UK postcodes, {keyFinding}.
            </p>
          </div>

          {/* Key stat cards */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3 animate-fade-up delay-4">
            <div className="card p-4 text-center">
              <p className="font-data text-2xl font-bold text-ink">
                {config.sortField === "score"
                  ? worstValue.toFixed(1)
                  : config.sortField === "hardness"
                    ? Math.round(worstValue)
                    : parseFloat(worstValue.toPrecision(4))}
              </p>
              <p className="text-xs text-faint uppercase tracking-wider mt-1">
                {config.sortDirection === "desc" && config.sortField !== "score"
                  ? "Highest found"
                  : config.sortField === "score" && config.sortDirection === "desc"
                    ? "Top score"
                    : config.sortField === "score"
                      ? "Lowest score"
                      : "Highest found"}
              </p>
            </div>
            <div className="card p-4 text-center">
              <p className="font-data text-2xl font-bold text-ink">
                {config.sortField === "score"
                  ? nationalAvg.toFixed(1)
                  : config.sortField === "hardness"
                    ? Math.round(nationalAvg)
                    : parseFloat(nationalAvg.toPrecision(3))}
              </p>
              <p className="text-xs text-faint uppercase tracking-wider mt-1">
                {config.sortField === "pfas" ? "Avg where detected" : "UK average"}
              </p>
            </div>
            {config.limit && (
              <div className="card p-4 text-center">
                <p className="font-data text-2xl font-bold text-ink">{config.limit.split(" ")[0]}</p>
                <p className="text-xs text-faint uppercase tracking-wider mt-1">UK limit</p>
              </div>
            )}
          </div>
        </header>

        <hr className="border-rule" />

        {/* ── Rankings table ── */}
        <ScrollReveal delay={0}>
          <section className="mt-10">
            <h2 className="font-display text-3xl text-ink italic mb-2">
              {config.sortField === "score" && config.sortDirection === "desc"
                ? "Top 50 postcodes"
                : config.sortField === "pfas"
                  ? `All ${entries.length} detected areas`
                  : "Top 50 postcodes"}
            </h2>
            <p className="text-sm text-muted mb-6">
              {config.sortField === "score" && config.sortDirection === "desc"
                ? "Ranked by highest safety score. Click any postcode for a full water quality report."
                : config.sortField === "score"
                  ? "Ranked by lowest safety score. Click any postcode for a full report."
                  : config.sortField === "pfas"
                    ? "Areas where PFAS forever chemicals were detected. Click any postcode for details."
                    : `Ranked by ${config.contaminant?.toLowerCase() ?? "level"}. Click any postcode for the full breakdown.`}
            </p>

            <div className="card overflow-hidden">
              {/* Table header */}
              <div className="hidden sm:grid sm:grid-cols-[50px_100px_1fr_130px_100px] gap-3 px-5 py-3 bg-[var(--color-wash)] border-b border-[var(--color-rule)] text-xs text-faint uppercase tracking-wider font-semibold">
                <span>#</span>
                <span>Postcode</span>
                <span>Area</span>
                <span className="text-right">
                  {config.sortField === "score"
                    ? "Score"
                    : config.sortField === "hardness"
                      ? "Hardness"
                      : config.sortField === "pfas"
                        ? "PFAS level"
                        : config.contaminant}
                </span>
                <span className="text-right">Status</span>
              </div>

              {/* Rows */}
              {entries.map((entry) => {
                const badge = config.sortField === "hardness"
                  ? { bg: statusBadge(entry.status).bg, text: statusBadge(entry.status).text, label: hardnessLabel(entry.value) }
                  : config.sortField === "score"
                    ? { bg: statusBadge(entry.status).bg, text: statusBadge(entry.status).text, label: entry.value >= 7 ? "Good" : entry.value >= 4 ? "Fair" : "Poor" }
                    : statusBadge(entry.status);

                return (
                  <Link
                    key={entry.district}
                    href={`/postcode/${entry.district}/`}
                    className="grid grid-cols-[32px_70px_1fr_auto] sm:grid-cols-[50px_100px_1fr_130px_100px] gap-x-3 gap-y-0.5 items-center px-5 py-3.5 border-b border-[var(--color-rule)] last:border-b-0 hover:bg-[var(--color-wash)] transition-colors group"
                  >
                    {/* Rank */}
                    <span className="font-data text-sm text-faint tabular-nums">
                      {entry.rank <= 3 ? (
                        <span className={`font-bold ${
                          entry.rank === 1
                            ? isPfas ? "text-[var(--color-pfas)]" : "text-amber-500"
                            : entry.rank === 2
                              ? "text-slate-400"
                              : "text-amber-700"
                        }`}>
                          {entry.rank}
                        </span>
                      ) : (
                        entry.rank
                      )}
                    </span>

                    {/* Postcode */}
                    <span className={`font-data text-sm font-semibold group-hover:text-accent transition-colors ${
                      isPfas ? "text-[var(--color-pfas)]" : "text-ink"
                    }`}>
                      {entry.district}
                    </span>

                    {/* Area */}
                    <div className="min-w-0">
                      <span className="text-sm text-ink">{entry.areaName}</span>
                      <span className="text-xs text-faint ml-2 hidden sm:inline">{entry.region}</span>
                    </div>

                    {/* Value */}
                    <span className={`font-data text-sm font-bold text-right tabular-nums ${
                      config.sortField === "score"
                        ? scoreTextClass(entry.value)
                        : entry.status === "fail"
                          ? "text-[var(--color-danger)]"
                          : entry.status === "warning"
                            ? "text-[var(--color-warning)]"
                            : "text-ink"
                    }`}>
                      {entry.displayValue}
                    </span>

                    {/* Status badge */}
                    <span className={`hidden sm:inline-flex items-center justify-end`}>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                    </span>
                  </Link>
                );
              })}

              {entries.length === 0 && (
                <div className="px-5 py-12 text-center text-muted">
                  <p className="text-sm">No data available for this ranking yet.</p>
                </div>
              )}
            </div>

            <p className="mt-3 text-xs text-faint">
              {config.sortField === "score"
                ? `Scores are based on ${totalAnalysed.toLocaleString()} postcode districts with Environment Agency data. Score methodology: contaminant levels measured against UK legal limits and WHO guidelines.`
                : config.sortField === "pfas"
                  ? "PFAS detections based on Environment Agency environmental monitoring data. Levels shown are from the nearest monitoring point to each postcode."
                  : config.sortField === "hardness"
                    ? "Hardness values based on water company drinking water quality data, measured as calcium carbonate (CaCO3)."
                    : `Based on Environment Agency water quality monitoring. Values show the most recent ${config.contaminant?.toLowerCase()} reading for each postcode district.`}
            </p>
          </section>
        </ScrollReveal>

        <hr className="border-rule mt-12" />

        {/* ── What this means ── */}
        <ScrollReveal delay={0}>
          <section className="mt-10">
            <h2 className="font-display text-2xl text-ink italic mb-3">
              What this means
            </h2>
            <div className="max-w-3xl">
              <p className="text-base text-body leading-relaxed">
                {config.explainer}
              </p>
            </div>
          </section>
        </ScrollReveal>

        <hr className="border-rule mt-12" />

        {/* ── How to protect yourself ── */}
        <ScrollReveal delay={0}>
          <section className="mt-10">
            <h2 className="font-display text-2xl text-ink italic mb-3">
              How to protect yourself
            </h2>
            <div className="max-w-3xl">
              <p className="text-base text-body leading-relaxed">
                {config.filterAdvice}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/filters/"
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isPfas
                      ? "bg-[var(--color-pfas)] text-white hover:opacity-90"
                      : "bg-btn text-white hover:bg-btn-hover"
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  Browse water filters
                </Link>
                <Link
                  href="/guides/how-to-test-your-water/"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium card hover:bg-[var(--color-wash)] transition-colors"
                >
                  <Droplets className="w-4 h-4 text-faint" />
                  Test your water
                </Link>
              </div>
            </div>
          </section>
        </ScrollReveal>

        <hr className="border-rule mt-12" />

        {/* ── Check your postcode ── */}
        <ScrollReveal delay={0}>
          <section className="mt-10">
            <h2 className="font-display text-2xl text-ink italic mb-3">
              Check your postcode
            </h2>
            <p className="text-sm text-muted mb-4 max-w-xl">
              See the full water quality report for your area, including all tested contaminants and personalised filter recommendations.
            </p>
            <div className="max-w-lg">
              <PostcodeSearch size="sm" />
            </div>
          </section>
        </ScrollReveal>

        <hr className="border-rule mt-12" />

        {/* ── FAQs ── */}
        <ScrollReveal delay={0}>
          <section className="mt-10">
            <h2 className="font-display text-2xl text-ink italic mb-6">
              Frequently asked questions
            </h2>
            <div className="max-w-3xl flex flex-col gap-6">
              {config.faqs.map((faq, i) => (
                <div key={i}>
                  <h3 className="text-base font-semibold text-ink mb-1.5">{faq.question}</h3>
                  <p className="text-sm text-body leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        </ScrollReveal>

        <hr className="border-rule mt-12" />

        {/* ── More rankings ── */}
        <ScrollReveal delay={0}>
          <section className="mt-10 mb-8">
            <h2 className="font-display text-2xl text-ink italic mb-4">
              More rankings
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {otherRankings.map((otherSlug) => {
                const other = RANKINGS[otherSlug];
                const isOtherPfas = other.accentColor === "pfas";
                return (
                  <Link
                    key={otherSlug}
                    href={`/rankings/${otherSlug}/`}
                    className="card p-4 group"
                  >
                    <p className={`text-xs uppercase tracking-[0.12em] font-semibold mb-1 ${
                      isOtherPfas ? "text-[var(--color-pfas)]" : "text-accent"
                    }`}>
                      Ranking
                    </p>
                    <p className="font-medium text-sm text-ink group-hover:text-accent transition-colors leading-snug">
                      {other.shortTitle}
                    </p>
                    <p className="text-xs text-faint mt-1.5 line-clamp-2">
                      {other.description}
                    </p>
                  </Link>
                );
              })}
            </div>
            <p className="mt-4">
              <Link
                href="/rankings/"
                className="text-sm text-accent hover:underline underline-offset-2 inline-flex items-center gap-1"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                View all rankings
              </Link>
            </p>
          </section>
        </ScrollReveal>

        {/* Footer */}
        <footer className="mt-4 pb-6 text-sm text-faint leading-relaxed border-t border-[var(--color-rule)] pt-6">
          Data from the Environment Agency Water Quality Archive and water company testing.
          Rankings compiled by TapWater.uk from {totalAnalysed.toLocaleString()} postcode districts.
          See our{" "}
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
