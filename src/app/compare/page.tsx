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
import { ScrollReveal } from "@/components/scroll-reveal";
import { BreadcrumbSchema, FAQSchema } from "@/components/json-ld";
import { getPostcodeData, getAllPostcodeDistricts } from "@/lib/data";
import { getScoreColor } from "@/lib/types";
import type { PostcodeData } from "@/lib/types";

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

  const allScored: PostcodeData[] = [];
  for (const d of districts) {
    const data = await getPostcodeData(d);
    if (data && data.safetyScore >= 0) {
      allScored.push(data);
    }
  }

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

  return { best, worst, suppliers, totalTested: allScored.length };
}

// ── Metadata ──

export async function generateMetadata(): Promise<Metadata> {
  const { totalTested } = await buildRankings();
  const description = `See which UK postcodes have the best and worst tap water quality. Rankings based on ${totalTested}+ real drinking water tests. Updated daily.`;

  return {
    title: `Best and Worst Tap Water in the UK — ${year} Rankings`,
    description,
    openGraph: {
      title: `Best and Worst Tap Water in the UK — ${year} Rankings`,
      description,
      url: "https://tapwater.uk/compare/",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `Best and Worst Tap Water in the UK — ${year}`,
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
      href={`/postcode/${data.district}/`}
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
          <span className="text-[10px] text-faint uppercase tracking-wider">
            /10
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Page ──

export default async function ComparePage() {
  const { best, worst, suppliers, totalTested } = await buildRankings();

  const bestArea = best[0];
  const worstArea = worst[0];
  const bestSupplier = suppliers[0];

  // FAQ answers
  const bestAnswer = bestArea
    ? `${bestArea.district} (${bestArea.areaName}) has the best tap water quality in the UK with a score of ${bestArea.safetyScore.toFixed(1)}/10, supplied by ${bestArea.supplier}. ${bestArea.contaminantsFlagged === 0 ? "No contaminants were flagged above recommended levels." : `Only ${bestArea.contaminantsFlagged} contaminant${bestArea.contaminantsFlagged > 1 ? "s were" : " was"} flagged.`}`
    : "We're still collecting enough data to determine the best area.";

  const worstAnswer = worstArea
    ? `${worstArea.district} (${worstArea.areaName}) currently has the lowest water quality score in the UK at ${worstArea.safetyScore.toFixed(1)}/10, supplied by ${worstArea.supplier}. ${worstArea.contaminantsFlagged} contaminant${worstArea.contaminantsFlagged !== 1 ? "s were" : " was"} flagged above recommended levels. This doesn't necessarily mean the water is unsafe — it still meets legal requirements.`
    : "We're still collecting enough data to determine the worst area.";

  const bestSupplierAnswer = bestSupplier
    ? `${bestSupplier.name} currently has the highest average water quality score at ${bestSupplier.avgScore.toFixed(1)}/10, based on ${bestSupplier.postcodeCount} postcode area${bestSupplier.postcodeCount > 1 ? "s" : ""} we monitor.`
    : "We're still collecting enough data to rank water companies.";

  return (
    <div className="bg-score-safe">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8 py-8 lg:py-12">
        <BreadcrumbSchema
          items={[
            { name: "Home", url: "https://tapwater.uk" },
            { name: "Compare", url: "https://tapwater.uk/compare/" },
          ]}
        />
        <FAQSchema
          faqs={[
            {
              question: "Which UK area has the best tap water?",
              answer: bestAnswer,
            },
            {
              question: "Which UK area has the worst tap water?",
              answer: worstAnswer,
            },
            {
              question: "Which water company has the best water quality?",
              answer: bestSupplierAnswer,
            },
          ]}
        />

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
            Best and worst tap water in the UK
          </h1>
          <p className="text-muted mt-2 max-w-2xl animate-fade-up delay-3">
            Rankings based on {totalTested} postcode areas tested. Scores
            reflect contaminant levels, PFAS, and overall water quality from
            real drinking water tests and environmental monitoring.
          </p>
        </header>

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
              Average water quality scores ranked by supplier.
            </p>

            <div className="card overflow-hidden">
              {/* Table header */}
              <div className="hidden sm:grid sm:grid-cols-[40px_1fr_100px_100px] gap-4 px-4 py-2.5 bg-wash border-b border-rule text-xs text-faint uppercase tracking-wider font-medium">
                <span>#</span>
                <span>Supplier</span>
                <span className="text-right">Avg score</span>
                <span className="text-right">Areas</span>
              </div>

              {suppliers.map((s, i) => (
                <Link
                  key={s.id}
                  href={`/supplier/${s.id}/`}
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
