import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronRight,
  AlertTriangle,
  ShieldCheck,
  Building2,
  Trophy,
} from "lucide-react";
import { PostcodeSearch } from "@/components/postcode-search";
import { CompareSearch } from "@/components/compare-search";
import { ScrollReveal } from "@/components/scroll-reveal";
import { FixPicks } from "@/components/fix-picks";
import { BreadcrumbSchema, FAQSchema } from "@/components/json-ld";
import { getPostcodeData, getAllPostcodeDistricts, isRankable } from "@/lib/data";
import { CITY_COMPARISON_PAIRS, cityLabel } from "@/lib/city-comparisons";
import { getScoreColor } from "@/lib/types";
import type { PostcodeData } from "@/lib/types";
import { OG_IMAGE } from "@/lib/og";

export const revalidate = 86400;

const year = new Date().getFullYear();

// ── Helpers ──

function scoreTextClass(score: number): string {
  const c = getScoreColor(score);
  if (c === "safe") return "text-[var(--color-safe)]";
  if (c === "warning") return "text-[var(--color-warning)]";
  return "text-[var(--color-danger)]";
}

interface SupplierRanking {
  name: string;
  id: string;
  avgScore: number;
  postcodeCount: number;
}

async function buildRankings() {
  const districts = await getAllPostcodeDistricts();

  // Only treated tap water with recent, reasonably complete tests may be named
  // in a public best/worst list. See isRankable for why.
  const allScored: PostcodeData[] = [];
  for (const d of districts) {
    const data = await getPostcodeData(d);
    if (data && isRankable(data)) {
      allScored.push(data);
    }
  }

  const contaminantCount = new Set(
    allScored.flatMap((p) => p.readings.map((r) => r.name)),
  ).size;

  // Sort for best/worst
  const sorted = [...allScored].sort(
    (a, b) => a.safetyScore - b.safetyScore,
  );
  const worst = sorted.slice(0, 10);
  const best = sorted.slice(-10).reverse();

  // By water company
  const supplierMap = new Map<
    string,
    { name: string; id: string; total: number; count: number }
  >();
  for (const p of allScored) {
    const existing = supplierMap.get(p.supplierId);
    if (existing) {
      existing.total += p.safetyScore;
      existing.count++;
    } else {
      supplierMap.set(p.supplierId, {
        name: p.supplier,
        id: p.supplierId,
        total: p.safetyScore,
        count: 1,
      });
    }
  }

  const suppliers: SupplierRanking[] = Array.from(supplierMap.values())
    .map((s) => ({
      name: s.name,
      id: s.id,
      avgScore: s.total / s.count,
      postcodeCount: s.count,
    }))
    .sort((a, b) => b.avgScore - a.avgScore);

  return {
    best,
    worst,
    suppliers,
    totalTested: allScored.length,
    contaminantCount,
  };
}

/** "SW1A (Westminster) 9.4" — one ranked area as prose. */
function areaClause(p: PostcodeData): string {
  return `${p.district} (${p.areaName}) at ${p.safetyScore.toFixed(1)}/10`;
}

/** Join names the way a sentence does: "A, B and C". */
function joinProse(parts: string[]): string {
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

// ── Metadata ──

export async function generateMetadata(): Promise<Metadata> {
  const { best, worst, totalTested } = await buildRankings();
  const lead =
    best[0] && worst[0]
      ? `${best[0].district} (${best[0].areaName}) scores highest, ${worst[0].district} (${worst[0].areaName}) lowest.`
      : "Ranked by real drinking-water tests.";
  const description =
    `Best and worst tap water in the UK, ranked across ${totalTested} postcode districts. ${lead}`.slice(0, 155);
  const title = `Best Tap Water in the UK ${year}: Ranked by Area`;

  return {
    title,
    description,
    openGraph: {
      images: OG_IMAGE,
      title,
      description,
      url: "https://www.tapwater.uk/compare",
      type: "article",
    },
    twitter: {
      images: OG_IMAGE,
      card: "summary_large_image",
      title,
      description,
    },
  };
}

// ── Ranking card component ──

function RankingCard({
  rank,
  data,
}: {
  rank: number;
  data: PostcodeData;
}) {
  return (
    <Link
      href={`/postcode/${data.district}`}
      className="card p-4 group block"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-faint font-data w-5 shrink-0">
              {rank}.
            </span>
            <span className="font-data font-bold text-sm text-ink">
              {data.district}
            </span>
            <span className="text-sm text-muted truncate">{data.areaName}</span>
          </div>
          <div className="flex items-center gap-3 mt-1.5 ml-7">
            <span className="text-xs text-muted flex items-center gap-1">
              <Building2 className="w-3 h-3 text-faint" />
              {data.supplier}
            </span>
            {data.contaminantsFlagged > 0 && (
              <span className="text-xs text-muted">
                {data.contaminantsFlagged} flagged
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          <span
            className={`font-data text-lg font-bold leading-none ${scoreTextClass(data.safetyScore)}`}
          >
            {data.safetyScore.toFixed(1)}
          </span>
          <span className="text-xs text-faint uppercase tracking-wider">
            /10
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Inline ranked list for the intro: "SW1A (Westminster) 9.4, ..." with links. */
function RankedNames({ areas }: { areas: PostcodeData[] }) {
  return (
    <>
      {areas.map((p, i) => (
        <span key={p.district}>
          {i > 0 && (i === areas.length - 1 ? " and " : ", ")}
          <Link
            href={`/postcode/${p.district}`}
            className="text-ink font-medium hover:text-accent transition-colors"
          >
            {p.district} ({p.areaName})
          </Link>{" "}
          <span className={`font-data ${scoreTextClass(p.safetyScore)}`}>
            {p.safetyScore.toFixed(1)}
          </span>
        </span>
      ))}
    </>
  );
}

// ── Page ──

export default async function ComparePage() {
  const { best, worst, suppliers, totalTested, contaminantCount } =
    await buildRankings();

  const bestArea = best[0];
  const worstArea = worst[0];
  const bestSupplier = suppliers[0];
  const topThree = best.slice(0, 3);
  const bottomThree = worst.slice(0, 3);

  const cleanestCity = topThree[0]?.city ?? null;

  const faqs = [
    {
      question: "Where is the best tap water in the UK?",
      answer: topThree.length
        ? `On the most recent tests, the highest-scoring areas are ${joinProse(topThree.map(areaClause))}. ${bestArea.contaminantsFlagged === 0 ? `Nothing in ${bestArea.district}'s water came close to a legal limit.` : `${bestArea.district} had ${bestArea.contaminantsFlagged} reading${bestArea.contaminantsFlagged === 1 ? "" : "s"} worth watching, but every one stayed inside the legal limit.`} Rankings move as new test results come in.`
        : "We are still gathering enough recent test results to name a best area.",
    },
    {
      question: "Which UK city has the cleanest tap water?",
      answer: cleanestCity
        ? `${cleanestCity} currently has the top-scoring district, ${bestArea.district} (${bestArea.areaName}), at ${bestArea.safetyScore.toFixed(1)}/10, supplied by ${bestArea.supplier}. Water quality varies street by street rather than city by city, so two postcodes in the same city can sit at opposite ends of this list. Check your own postcode for the reading that applies to your tap.${bestSupplier ? ` Across whole companies, ${bestSupplier.name} has the highest average at ${bestSupplier.avgScore.toFixed(1)}/10.` : ""}`
        : "We are still gathering enough recent test results to name a cleanest city.",
    },
    {
      question: "Is UK tap water safe to drink?",
      answer: `Yes. UK tap water is among the most tested in the world and almost every sample passes the legal limits. A low score here does not mean the water is unsafe.${worstArea ? ` Even ${worstArea.district} (${worstArea.areaName}), the lowest-scoring area at ${worstArea.safetyScore.toFixed(1)}/10, is supplied as drinking water that meets the rules.` : ""} A low score means some readings sat closer to their limits than elsewhere, which is worth knowing if you are pregnant, have a baby or are sensitive to taste.`,
    },
    {
      question: "Why does tap water quality differ by area?",
      answer: `Because the water starts in different places. Areas fed by upland reservoirs tend to have soft water with few dissolved minerals. Areas drawing on chalk or sandstone aquifers have hard water and, where farmland sits above, more nitrate. Older pipes can add lead, and the disinfection needed to keep water clean leaves traces of chlorine and its by-products. ${bottomThree.length ? `The lowest-scoring areas right now are ${joinProse(bottomThree.map(areaClause))}.` : ""}`,
    },
    {
      question: "How is the score calculated?",
      answer: `Every area gets a score out of 10. For each of the ${contaminantCount} substances tested, we measure how close the reading came to its legal limit: a reading at a tenth of the limit scores 9, a reading at the limit scores 0. Substances that matter most for health, such as lead, PFAS and bacteria, count three times as much as ones that mostly affect taste, such as chlorine or hardness. Drinking-water tests make up 80% of the final score and Environment Agency river and groundwater monitoring the other 20%. The full method is on our methodology page.`,
    },
  ];

  return (
    <div className="bg-score-safe">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8 py-8 lg:py-12">
        <BreadcrumbSchema
          items={[
            { name: "Home", url: "https://www.tapwater.uk" },
            { name: "Compare", url: "https://www.tapwater.uk/compare" },
          ]}
        />
        <FAQSchema faqs={faqs} />

        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-sm text-faint"
        >
          <Link href="/" className="hover:text-accent transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-ink font-medium">Compare</span>
        </nav>

        {/* Header */}
        <header className="mt-6">
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-ink tracking-tight animate-fade-up delay-2 italic">
            The best and worst tap water in the UK in {year}
          </h1>

          {/* The answer, first. Names and scores come straight from the ranking. */}
          {topThree.length > 0 && bottomThree.length > 0 ? (
            <div className="mt-5 max-w-3xl animate-fade-up delay-3">
              <p className="text-lg text-body leading-relaxed">
                The cleanest tap water in the UK right now is in{" "}
                <RankedNames areas={topThree} />. The lowest scores are in{" "}
                <RankedNames areas={bottomThree} />.
              </p>
              <p className="text-sm text-muted leading-relaxed mt-3">
                Scores are out of 10 and compare the latest drinking-water tests
                for {totalTested} postcode districts against the legal limit for
                each of {contaminantCount} substances. Even the lowest-scoring
                area meets the rules for drinking water: a low score means readings
                sat closer to their limits, not that the water is unsafe.{" "}
                <Link
                  href="/about/methodology"
                  className="text-accent underline underline-offset-2 hover:text-accent-hover transition-colors"
                >
                  How the score works
                </Link>
              </p>
            </div>
          ) : (
            <p className="text-muted mt-2 max-w-2xl animate-fade-up delay-3">
              Rankings appear here once enough recent test results are in.
            </p>
          )}
        </header>

        {/* Compare two postcodes */}
        <div className="mt-8 max-w-2xl">
          <CompareSearch />
        </div>

        {/* Best and Worst — side by side */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top 10 cleanest */}
          <section>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-safe shrink-0" />
              <h2 className="font-display text-2xl text-ink italic">
                Top 10 cleanest
              </h2>
            </div>
            <p className="text-sm text-muted mt-1 mb-5">
              The highest-scoring areas in the UK.
            </p>

            <div className="flex flex-col gap-3">
              {best.map((item, i) => (
                <RankingCard key={item.district} rank={i + 1} data={item} />
              ))}
            </div>
          </section>

          {/* Top 10 worst */}
          <section>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-danger shrink-0" />
              <h2 className="font-display text-2xl text-ink italic">
                Top 10 worst
              </h2>
            </div>
            <p className="text-sm text-muted mt-1 mb-5">
              The lowest-scoring areas in the UK.
            </p>

            <div className="flex flex-col gap-3">
              {worst.map((item, i) => (
                <RankingCard key={item.district} rank={i + 1} data={item} />
              ))}
            </div>
          </section>
        </div>

        <hr className="border-rule mt-10" />

        {/* By water company */}
        <ScrollReveal delay={0}>
          <section className="mt-8">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-accent shrink-0" />
              <h2 className="font-display text-2xl text-ink italic">
                By water company
              </h2>
            </div>
            <p className="text-sm text-muted mt-1 mb-5">
              Average postcode safety score per supplier — not compliance rate.
            </p>

            <div className="card overflow-hidden">
              {/* Table header */}
              <div className="hidden sm:grid sm:grid-cols-[40px_1fr_100px_100px] gap-4 px-4 py-2.5 bg-wash border-b border-rule text-xs text-faint uppercase tracking-wider font-medium">
                <span>#</span>
                <span>Supplier</span>
                <span className="text-right">Avg safety score</span>
                <span className="text-right">Postcodes</span>
              </div>

              {suppliers.map((s, i) => (
                <Link
                  key={s.id}
                  href={`/supplier/${s.id}`}
                  className="grid grid-cols-[40px_1fr_auto] sm:grid-cols-[40px_1fr_100px_100px] gap-4 px-4 py-3 border-b border-rule last:border-b-0 hover:bg-wash transition-colors group items-center"
                >
                  <span className="font-data text-sm text-faint">{i + 1}</span>
                  <span className="text-sm font-medium text-ink group-hover:text-accent transition-colors flex items-center gap-2 truncate">
                    <Building2 className="w-3.5 h-3.5 text-faint shrink-0" />
                    {s.name}
                  </span>
                  <span
                    className={`font-data text-sm font-bold text-right ${scoreTextClass(s.avgScore)}`}
                  >
                    {s.avgScore.toFixed(1)}
                  </span>
                  <span className="font-data text-sm text-right text-muted hidden sm:block">
                    {s.postcodeCount}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </ScrollReveal>

        <hr className="border-rule mt-10" />

        {/* Check your postcode CTA */}
        <ScrollReveal delay={0}>
          <section className="mt-8 mb-4">
            <h2 className="font-display text-2xl text-ink italic">
              Check your postcode
            </h2>
            <p className="text-sm text-muted mt-1 mb-5">
              See exactly what&apos;s in the tap water at your address.
            </p>

            <div className="max-w-xl">
              <PostcodeSearch size="sm" />
            </div>
          </section>
        </ScrollReveal>

        {/* City-vs-city comparisons.
            These pages were in the sitemap but linked from nowhere, which left 42 of
            them with no incoming internal links at all. */}
        <ScrollReveal>
          <section className="mt-14">
            <h2 className="font-display text-2xl italic text-ink">
              Compare two cities
            </h2>
            <p className="text-body mt-2 max-w-2xl">
              Side-by-side water quality for the UK&apos;s largest cities, based
              on the same test data as the postcode reports.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {CITY_COMPARISON_PAIRS.map(([a, b]) => (
                <Link
                  key={`${a}-${b}`}
                  href={`/compare/city/${a}/vs/${b}`}
                  className="rounded-lg border border-rule px-3 py-1.5 text-sm text-body hover:border-accent/40 hover:text-ink transition-colors"
                >
                  {cityLabel(a)} vs {cityLabel(b)}
                </Link>
              ))}
            </div>
          </section>
        </ScrollReveal>

        <hr className="border-rule mt-14" />

        {/* Common questions — plain answers, built from the same ranking */}
        <section className="mt-10" aria-labelledby="compare-faq-heading">
          <h2 id="compare-faq-heading" className="font-display text-2xl text-ink italic">
            Common questions
          </h2>
          <dl className="mt-5 max-w-3xl divide-y divide-rule border-y border-rule">
            {faqs.map(({ question, answer }) => (
              <div
                key={question}
                className="py-5 grid gap-2 sm:grid-cols-[minmax(0,15rem)_1fr] sm:gap-8"
              >
                <dt className="font-display text-lg text-ink italic leading-snug">
                  {question}
                </dt>
                <dd className="text-sm text-body leading-relaxed">
                  {answer}
                  {question === "How is the score calculated?" && (
                    <>
                      {" "}
                      <Link
                        href="/about/methodology"
                        className="text-accent underline underline-offset-2 hover:text-accent-hover transition-colors"
                      >
                        Read the methodology
                      </Link>
                    </>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <hr className="border-rule mt-14" />

        {/* Closing commercial step. Readers arrive here to see where their area
            ranks; the natural next question is "so what do I do about it". */}
        <FixPicks
          className="mt-8"
          pageType="compare"
          placement="compare-picks"
          title="Whatever your water scored, this is what fixes it"
          intro={
            <>
              A low score does not mean unsafe water, and a high one does not mean
              nothing to improve. These are the three fixes readers click most
              across every ranking on this page. For a recommendation matched to
              your own readings, open your postcode report above.
            </>
          }
        />

        {/* Methodology footer */}
        <footer className="mt-10 pb-4 text-sm text-faint leading-relaxed">
          Rankings based on {totalTested} postcode districts across the UK. Data
          from water companies via the Stream Water Data Portal and the
          Environment Agency. See our{" "}
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
