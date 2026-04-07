import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ArrowRight, Trophy, Droplets, ShieldCheck } from "lucide-react";
import { PostcodeSearch } from "@/components/postcode-search";
import { ScrollReveal } from "@/components/scroll-reveal";
import { BreadcrumbSchema, FAQSchema } from "@/components/json-ld";
import { getPostcodeData, getAllPostcodeDistricts } from "@/lib/data";
import { getScoreColor } from "@/lib/types";
import type { PostcodeData } from "@/lib/types";
import { CITIES, getCityBySlug } from "@/lib/cities";

export const revalidate = 86400;

// ── City pairs for static generation ──

const CITY_PAIRS: [string, string][] = [
  // London vs major cities
  ["london", "manchester"], ["london", "birmingham"], ["london", "leeds"],
  ["london", "glasgow"], ["london", "edinburgh"], ["london", "bristol"],
  ["london", "liverpool"], ["london", "sheffield"], ["london", "nottingham"],
  ["london", "cardiff"],
  // Northern rivalries
  ["manchester", "birmingham"], ["manchester", "leeds"], ["manchester", "liverpool"],
  ["manchester", "sheffield"], ["manchester", "glasgow"],
  // Other major pairs
  ["birmingham", "leeds"], ["birmingham", "bristol"], ["birmingham", "nottingham"],
  ["edinburgh", "glasgow"], ["leeds", "sheffield"],
  ["bristol", "cardiff"], ["liverpool", "leeds"],
  ["newcastle", "sunderland"], ["nottingham", "leicester"],
];

interface Props {
  params: Promise<{ city1: string; city2: string }>;
}

// ── Helpers ──

function scoreTextClass(score: number): string {
  const c = getScoreColor(score);
  if (c === "safe") return "text-[var(--color-safe)]";
  if (c === "warning") return "text-[var(--color-warning)]";
  return "text-[var(--color-danger)]";
}

function scoreBgClass(score: number): string {
  const c = getScoreColor(score);
  if (c === "safe") return "bg-safe-light";
  if (c === "warning") return "bg-warning-light";
  return "bg-danger-light";
}

interface CityStats {
  name: string;
  slug: string;
  avgScore: number;
  totalPostcodes: number;
  totalFlagged: number;
  primarySupplier: string;
  primarySupplierId: string;
  avgHardness: number | null;
  hardnessClass: string | null;
  topConcerns: [string, number][];
  pfasCount: number;
}

async function getPostcodesForCity(
  matches: string[],
): Promise<PostcodeData[]> {
  const lowerMatches = matches.map((m) => m.toLowerCase());
  const districts = await getAllPostcodeDistricts();
  const results: PostcodeData[] = [];

  for (const d of districts) {
    const data = await getPostcodeData(d);
    if (data && lowerMatches.includes(data.city.toLowerCase())) {
      results.push(data);
    }
  }

  return results;
}

async function getCityStats(citySlug: string): Promise<CityStats | null> {
  const city = getCityBySlug(citySlug);
  if (!city) return null;

  const allPostcodes = await getPostcodesForCity(city.matches);
  const scored = allPostcodes.filter((p) => p.safetyScore >= 0);

  const avgScore =
    scored.length > 0
      ? scored.reduce((sum, p) => sum + p.safetyScore, 0) / scored.length
      : 0;

  const totalFlagged = scored.reduce(
    (sum, p) => sum + p.contaminantsFlagged,
    0,
  );

  const pfasCount = scored.filter((p) => p.pfasDetected).length;

  // Primary supplier
  const supplierCounts = new Map<string, { name: string; id: string; count: number }>();
  for (const p of allPostcodes) {
    const existing = supplierCounts.get(p.supplierId);
    if (existing) {
      existing.count++;
    } else {
      supplierCounts.set(p.supplierId, {
        name: p.supplier,
        id: p.supplierId,
        count: 1,
      });
    }
  }
  const primarySupplier = Array.from(supplierCounts.values()).sort(
    (a, b) => b.count - a.count,
  )[0] ?? { name: "Unknown", id: "unknown", count: 0 };

  // Top concerns
  const contaminantFlags = new Map<string, number>();
  for (const p of scored) {
    for (const r of p.readings) {
      if (r.status !== "pass") {
        contaminantFlags.set(
          r.name,
          (contaminantFlags.get(r.name) ?? 0) + 1,
        );
      }
    }
  }
  const topConcerns = Array.from(contaminantFlags.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Hardness
  const allReadings = scored.flatMap(p => [...p.readings, ...p.environmentalReadings]);
  const hardnessReadings = allReadings.filter(r =>
    /hardness/i.test(r.name) || (/CaCO3/i.test(r.name) && !/alkalinity/i.test(r.name))
  );
  const avgHardness = hardnessReadings.length > 0
    ? hardnessReadings.reduce((s, r) => s + r.value, 0) / hardnessReadings.length
    : null;
  const hardnessClass = avgHardness != null
    ? avgHardness < 60 ? "soft" : avgHardness < 120 ? "moderately soft" : avgHardness < 180 ? "moderately hard" : avgHardness < 250 ? "hard" : "very hard"
    : null;

  return {
    name: city.name,
    slug: city.slug,
    avgScore,
    totalPostcodes: scored.length,
    totalFlagged,
    primarySupplier: primarySupplier.name,
    primarySupplierId: primarySupplier.id,
    avgHardness,
    hardnessClass,
    topConcerns,
    pfasCount,
  };
}

// ── Static generation ──

export function generateStaticParams() {
  const params: { city1: string; city2: string }[] = [];
  for (const [a, b] of CITY_PAIRS) {
    params.push({ city1: a, city2: b });
    params.push({ city1: b, city2: a });
  }
  return params;
}

// ── Metadata ──

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city1, city2 } = await params;
  const c1 = getCityBySlug(city1);
  const c2 = getCityBySlug(city2);
  if (!c1 || !c2) return { title: "Not Found" };

  return {
    title: `${c1.name} vs ${c2.name} Water Quality`,
    description: `Compare tap water quality in ${c1.name} and ${c2.name}. Safety scores, contaminants, and which city has better water.`,
    openGraph: {
      title: `${c1.name} vs ${c2.name} Water Quality Comparison`,
      description: `Compare tap water quality in ${c1.name} and ${c2.name}. Safety scores, contaminants, and which city has better water.`,
      url: `https://www.tapwater.uk/compare/city/${c1.slug}/vs/${c2.slug}`,
      type: "website",
    },
  };
}

// ── Page ──

export default async function CityComparisonPage({ params }: Props) {
  const { city1, city2 } = await params;

  const c1 = getCityBySlug(city1);
  const c2 = getCityBySlug(city2);
  if (!c1 || !c2) notFound();

  const [stats1, stats2] = await Promise.all([
    getCityStats(city1),
    getCityStats(city2),
  ]);

  if (!stats1 || !stats2) notFound();

  const hasScores = stats1.totalPostcodes > 0 && stats2.totalPostcodes > 0;
  const winner = stats1.avgScore > stats2.avgScore ? stats1 : stats2.avgScore > stats1.avgScore ? stats2 : null;
  const loser = winner === stats1 ? stats2 : winner === stats2 ? stats1 : null;
  const scoreDiff = Math.abs(stats1.avgScore - stats2.avgScore);

  // Key differences
  const differences: { label: string; detail: string }[] = [];
  if (hasScores) {
    if (scoreDiff >= 0.5) {
      differences.push({
        label: "Safety score",
        detail: `${winner!.name} scores ${scoreDiff.toFixed(1)} points higher than ${loser!.name}.`,
      });
    }
    if (stats1.totalFlagged !== stats2.totalFlagged) {
      const fewerIssues = stats1.totalFlagged < stats2.totalFlagged ? stats1 : stats2;
      const moreIssues = fewerIssues === stats1 ? stats2 : stats1;
      differences.push({
        label: "Contaminants flagged",
        detail: `${moreIssues.name} has ${moreIssues.totalFlagged} issues flagged vs ${fewerIssues.totalFlagged} in ${fewerIssues.name}.`,
      });
    }
    if (stats1.primarySupplier !== stats2.primarySupplier) {
      differences.push({
        label: "Water supplier",
        detail: `${stats1.name} is supplied by ${stats1.primarySupplier}, while ${stats2.name} uses ${stats2.primarySupplier}.`,
      });
    }
    if (stats1.hardnessClass && stats2.hardnessClass && stats1.hardnessClass !== stats2.hardnessClass) {
      differences.push({
        label: "Water hardness",
        detail: `${stats1.name} has ${stats1.hardnessClass} water (${Math.round(stats1.avgHardness!)} mg/L), ${stats2.name} has ${stats2.hardnessClass} water (${Math.round(stats2.avgHardness!)} mg/L).`,
      });
    }
    if (stats1.pfasCount !== stats2.pfasCount) {
      differences.push({
        label: "PFAS detection",
        detail: `PFAS detected in ${stats1.pfasCount} area${stats1.pfasCount !== 1 ? "s" : ""} in ${stats1.name} vs ${stats2.pfasCount} area${stats2.pfasCount !== 1 ? "s" : ""} in ${stats2.name}.`,
      });
    }
  }

  // FAQ answers
  const verdictText = winner
    ? `${winner.name} has better water quality with an average score of ${winner.avgScore.toFixed(1)}/10 compared to ${loser!.name}'s ${loser!.avgScore.toFixed(1)}/10.`
    : `Both cities have similar water quality scores of ${stats1.avgScore.toFixed(1)}/10.`;

  const faqs = hasScores
    ? [
        {
          question: `Which has better water quality, ${stats1.name} or ${stats2.name}?`,
          answer: `According to TapWater.uk, ${verdictText} ${stats1.name} is supplied by ${stats1.primarySupplier} and ${stats2.name} by ${stats2.primarySupplier}.`,
        },
        {
          question: `Is ${stats1.name} tap water safe to drink?`,
          answer: stats1.avgScore >= 7
            ? `Yes, ${stats1.name} tap water is safe to drink with an average score of ${stats1.avgScore.toFixed(1)}/10 across ${stats1.totalPostcodes} areas tested. Supplied by ${stats1.primarySupplier}.`
            : `${stats1.name} tap water scores ${stats1.avgScore.toFixed(1)}/10 across ${stats1.totalPostcodes} areas. ${stats1.totalFlagged} contaminant issues were flagged. Check your postcode for details.`,
        },
        {
          question: `Is ${stats2.name} tap water safe to drink?`,
          answer: stats2.avgScore >= 7
            ? `Yes, ${stats2.name} tap water is safe to drink with an average score of ${stats2.avgScore.toFixed(1)}/10 across ${stats2.totalPostcodes} areas tested. Supplied by ${stats2.primarySupplier}.`
            : `${stats2.name} tap water scores ${stats2.avgScore.toFixed(1)}/10 across ${stats2.totalPostcodes} areas. ${stats2.totalFlagged} contaminant issues were flagged. Check your postcode for details.`,
        },
      ]
    : [];

  // Other comparison links
  const otherPairs = CITY_PAIRS
    .filter(([a, b]) => !(a === city1 && b === city2) && !(a === city2 && b === city1))
    .slice(0, 5);

  const sides = [stats1, stats2];

  return (
    <div className="bg-score-safe">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8 py-8 lg:py-12">
        <BreadcrumbSchema
          items={[
            { name: "Home", url: "https://www.tapwater.uk" },
            { name: "Compare", url: "https://www.tapwater.uk/compare" },
            {
              name: `${stats1.name} vs ${stats2.name}`,
              url: `https://www.tapwater.uk/compare/city/${stats1.slug}/vs/${stats2.slug}`,
            },
          ]}
        />
        {faqs.length > 0 && <FAQSchema faqs={faqs} />}

        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-sm text-faint"
        >
          <Link href="/" className="hover:text-accent transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/compare" className="hover:text-accent transition-colors">
            Compare
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-ink font-medium">
            {stats1.name} vs {stats2.name}
          </span>
        </nav>

        {/* Header */}
        <header className="mt-6 text-center">
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-ink tracking-tight italic">
            {stats1.name} vs {stats2.name}
          </h1>
          <p className="text-muted mt-2">Water quality comparison</p>
        </header>

        {/* GEO summary for AI citation */}
        {hasScores && (
          <div className="card p-5 border-l-4 border-l-accent mb-8 mt-6 max-w-3xl mx-auto">
            <p className="text-base text-body leading-relaxed">
              <strong className="text-ink">
                According to TapWater.uk, {stats1.name} scores{" "}
                {stats1.avgScore.toFixed(1)}/10 and {stats2.name} scores{" "}
                {stats2.avgScore.toFixed(1)}/10 for drinking water quality.
              </strong>{" "}
              {winner
                ? `${winner.name} has the better water.`
                : "Both cities have similar water quality."}
            </p>
          </div>
        )}

        {/* Side-by-side stat cards */}
        {hasScores && (
          <ScrollReveal delay={0}>
            <div className="mt-8 grid grid-cols-2 gap-4 max-w-3xl mx-auto">
              {sides.map((stats) => {
                const isWinner = winner === stats;
                return (
                  <Link
                    key={stats.slug}
                    href={`/city/${stats.slug}`}
                    className="card p-6 text-center group relative"
                  >
                    {isWinner && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 rounded-full bg-accent text-white text-xs font-semibold">
                        <Trophy className="w-3 h-3" />
                        Better water
                      </div>
                    )}
                    <p className="text-sm font-semibold text-ink mt-1 group-hover:text-accent transition-colors">
                      {stats.name}
                    </p>
                    <p
                      className={`font-data text-4xl sm:text-5xl font-bold mt-3 ${scoreTextClass(stats.avgScore)}`}
                    >
                      {stats.avgScore.toFixed(1)}
                    </p>
                    <p className="text-xs text-faint mt-1">/10</p>

                    <div className="mt-4 space-y-2 text-sm text-left">
                      <div className="flex justify-between">
                        <span className="text-muted">Areas tested</span>
                        <span className="font-data font-bold text-ink">
                          {stats.totalPostcodes}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Issues flagged</span>
                        <span className="font-data font-bold text-ink">
                          {stats.totalFlagged}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Supplier</span>
                        <span className="text-ink text-right truncate ml-2">
                          {stats.primarySupplier}
                        </span>
                      </div>
                      {stats.hardnessClass && (
                        <div className="flex justify-between">
                          <span className="text-muted">Hardness</span>
                          <span className="text-ink capitalize">
                            {stats.hardnessClass}
                          </span>
                        </div>
                      )}
                      {stats.pfasCount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted">PFAS detected</span>
                          <span className="text-ink">
                            {stats.pfasCount} area{stats.pfasCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                    </div>

                    <div
                      className={`mt-4 inline-block px-3 py-1 rounded-full text-xs font-medium ${scoreBgClass(stats.avgScore)} ${scoreTextClass(stats.avgScore)}`}
                    >
                      {stats.totalFlagged} flagged across {stats.totalPostcodes} areas
                    </div>
                  </Link>
                );
              })}
            </div>
          </ScrollReveal>
        )}

        {/* Verdict */}
        {hasScores && (
          <div className="mt-6 text-center">
            <p className="text-base text-body font-medium">
              {winner ? (
                <>
                  <span className={scoreTextClass(winner.avgScore)}>
                    {winner.name}
                  </span>{" "}
                  has better water quality
                  {scoreDiff >= 0.5 && (
                    <span className="text-muted">
                      {" "}
                      by {scoreDiff.toFixed(1)} points
                    </span>
                  )}
                </>
              ) : (
                "Both cities have equal water quality scores"
              )}
            </p>
          </div>
        )}

        {/* Key differences */}
        {differences.length > 0 && (
          <>
            <hr className="border-rule mt-10" />
            <ScrollReveal delay={100}>
              <section className="mt-8 max-w-3xl mx-auto">
                <h2 className="font-display text-2xl text-ink italic mb-5 text-center">
                  Key differences
                </h2>
                <div className="space-y-3">
                  {differences.map((diff) => (
                    <div key={diff.label} className="card p-4">
                      <p className="text-xs text-muted uppercase tracking-wider mb-1">
                        {diff.label}
                      </p>
                      <p className="text-sm text-body">{diff.detail}</p>
                    </div>
                  ))}
                </div>
              </section>
            </ScrollReveal>
          </>
        )}

        {/* Top concerns side by side */}
        {hasScores &&
          (stats1.topConcerns.length > 0 || stats2.topConcerns.length > 0) && (
            <>
              <hr className="border-rule mt-10" />
              <ScrollReveal delay={0}>
                <section className="mt-8 max-w-3xl mx-auto">
                  <h2 className="font-display text-2xl text-ink italic mb-5 text-center">
                    Top concerns by city
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {sides.map((stats) => (
                      <div key={stats.slug}>
                        <p className="text-sm font-semibold text-ink mb-3">
                          {stats.name}
                        </p>
                        {stats.topConcerns.length > 0 ? (
                          <div className="space-y-2">
                            {stats.topConcerns.slice(0, 4).map(([name, count]) => (
                              <div
                                key={name}
                                className="card p-3 flex items-center justify-between"
                              >
                                <span className="text-sm text-ink">{name}</span>
                                <span className="text-xs text-muted">
                                  {count} area{count > 1 ? "s" : ""}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted">
                            No contaminants flagged
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              </ScrollReveal>
            </>
          )}

        <hr className="border-rule mt-10" />

        {/* Links to city pages */}
        <ScrollReveal delay={0}>
          <section className="mt-8 text-center">
            <h2 className="font-display text-2xl text-ink italic mb-5">
              Full city reports
            </h2>
            <div className="flex justify-center gap-4 flex-wrap">
              <Link href={`/city/${stats1.slug}`} className="pill">
                {stats1.name} water report{" "}
                <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
              <Link href={`/city/${stats2.slug}`} className="pill">
                {stats2.name} water report{" "}
                <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </div>
          </section>
        </ScrollReveal>

        <hr className="border-rule mt-10" />

        {/* Postcode CTA */}
        <ScrollReveal delay={0}>
          <section className="mt-8 mb-4">
            <div className="flex items-center justify-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-safe shrink-0" />
              <h2 className="font-display text-2xl text-ink italic">
                Check your postcode
              </h2>
            </div>
            <p className="text-sm text-muted mt-1 mb-5 text-center">
              Get a detailed water quality report for your exact area.
            </p>
            <div className="max-w-xl mx-auto">
              <PostcodeSearch size="sm" />
            </div>
          </section>
        </ScrollReveal>

        {/* More comparisons */}
        {otherPairs.length > 0 && (
          <>
            <hr className="border-rule mt-10" />
            <ScrollReveal delay={0}>
              <section className="mt-8">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Droplets className="w-4 h-4 text-accent shrink-0" />
                  <h2 className="font-display text-2xl text-ink italic">
                    More comparisons
                  </h2>
                </div>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {otherPairs.map(([a, b]) => {
                    const ca = getCityBySlug(a);
                    const cb = getCityBySlug(b);
                    if (!ca || !cb) return null;
                    return (
                      <Link
                        key={`${a}-${b}`}
                        href={`/compare/city/${a}/vs/${b}`}
                        className="pill"
                      >
                        {ca.name} vs {cb.name}
                      </Link>
                    );
                  })}
                </div>
              </section>
            </ScrollReveal>
          </>
        )}

        {/* Methodology footer */}
        <footer className="mt-10 pb-4 text-sm text-faint leading-relaxed text-center">
          Based on water quality data from {stats1.totalPostcodes + stats2.totalPostcodes} postcode
          districts across {stats1.name} and {stats2.name}. See our{" "}
          <Link
            href="/about/methodology"
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
