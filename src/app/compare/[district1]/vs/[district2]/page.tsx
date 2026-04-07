import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ArrowRight } from "lucide-react";
import { getPostcodeData } from "@/lib/data";
import { getScoreColor } from "@/lib/types";
import { BreadcrumbSchema, FAQSchema } from "@/components/json-ld";
import { PostcodeSearch } from "@/components/postcode-search";

interface Props {
  params: Promise<{ district1: string; district2: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { district1, district2 } = await params;
  const [d1, d2] = [district1.toUpperCase(), district2.toUpperCase()];
  const [data1, data2] = await Promise.all([getPostcodeData(d1), getPostcodeData(d2)]);

  if (!data1 || !data2) return { title: "Not Found" };

  return {
    title: `${d1} vs ${d2} Water Quality — Which Is Better?`,
    description: (() => {
      const full = `Compare tap water quality between ${d1} (${data1.areaName}) and ${d2} (${data2.areaName}). ${d1} scores ${data1.safetyScore}/10, ${d2} scores ${data2.safetyScore}/10. Side-by-side contaminant comparison.`;
      const short = `Compare tap water quality: ${d1} scores ${data1.safetyScore}/10, ${d2} scores ${data2.safetyScore}/10. Side-by-side contaminant comparison.`;
      return full.length <= 155 ? full : short;
    })(),
    openGraph: {
      title: `${d1} vs ${d2} Water Quality Comparison`,
      description: `${d1} scores ${data1.safetyScore}/10, ${d2} scores ${data2.safetyScore}/10. Compare contaminants, suppliers, and safety data.`,
      url: `https://www.tapwater.uk/compare/${d1}/vs/${d2}`,
      type: "website",
    },
  };
}

function scoreTextClass(score: number): string {
  const c = getScoreColor(score);
  if (c === "safe") return "text-safe";
  if (c === "warning") return "text-warning";
  return "text-danger";
}

function scoreBgClass(score: number): string {
  const c = getScoreColor(score);
  if (c === "safe") return "bg-safe-light";
  if (c === "warning") return "bg-warning-light";
  return "bg-danger-light";
}

export default async function ComparePage({ params }: Props) {
  const { district1, district2 } = await params;
  const [d1, d2] = [district1.toUpperCase(), district2.toUpperCase()];
  const [data1, data2] = await Promise.all([getPostcodeData(d1), getPostcodeData(d2)]);

  if (!data1 || !data2) notFound();

  const hasScores = data1.safetyScore >= 0 && data2.safetyScore >= 0;
  const winner = data1.safetyScore > data2.safetyScore ? d1 : data2.safetyScore > data1.safetyScore ? d2 : null;
  const winnerData = winner === d1 ? data1 : winner === d2 ? data2 : null;

  // Build comparison rows for shared contaminants
  const contaminantMap = new Map<string, { name: string; v1: number | null; v2: number | null; unit: string; limit: number | null }>();
  for (const r of data1.readings) {
    contaminantMap.set(r.name, { name: r.name, v1: r.value, v2: null, unit: r.unit, limit: r.ukLimit });
  }
  for (const r of data2.readings) {
    const existing = contaminantMap.get(r.name);
    if (existing) {
      existing.v2 = r.value;
    } else {
      contaminantMap.set(r.name, { name: r.name, v1: null, v2: r.value, unit: r.unit, limit: r.ukLimit });
    }
  }
  const comparisonRows = Array.from(contaminantMap.values())
    .filter((r) => r.v1 !== null && r.v2 !== null)
    .slice(0, 15);

  const verdictText = winner
    ? `${winner} (${winnerData!.areaName}) has better water quality with a score of ${winnerData!.safetyScore.toFixed(1)}/10.`
    : `Both areas have the same water quality score of ${data1.safetyScore.toFixed(1)}/10.`;

  const faqs = hasScores ? [
    {
      question: `Is ${d1} or ${d2} water better?`,
      answer: verdictText,
    },
    {
      question: `What is the water quality score for ${d1}?`,
      answer: `${d1} (${data1.areaName}) has a water quality score of ${data1.safetyScore.toFixed(1)}/10 with ${data1.contaminantsFlagged} contaminants exceeding safe levels out of ${data1.contaminantsTested} tested. Supplied by ${data1.supplier}.`,
    },
    {
      question: `What is the water quality score for ${d2}?`,
      answer: `${d2} (${data2.areaName}) has a water quality score of ${data2.safetyScore.toFixed(1)}/10 with ${data2.contaminantsFlagged} contaminants exceeding safe levels out of ${data2.contaminantsTested} tested. Supplied by ${data2.supplier}.`,
    },
  ] : [];

  const sides = [
    { district: d1, data: data1 },
    { district: d2, data: data2 },
  ];

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 py-8 lg:py-12">
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Compare", url: "https://www.tapwater.uk/compare" },
          { name: `${d1} vs ${d2}`, url: `https://www.tapwater.uk/compare/${d1}/vs/${d2}` },
        ]}
      />
      {faqs.length > 0 && <FAQSchema faqs={faqs} />}

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-faint">
        <Link href="/" className="hover:text-accent transition-colors">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/compare" className="hover:text-accent transition-colors">Compare</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-ink font-medium">{d1} vs {d2}</span>
      </nav>

      {/* Header */}
      <header className="mt-6 text-center">
        <h1 className="font-display text-3xl sm:text-4xl text-ink tracking-tight italic">
          {d1} vs {d2}
        </h1>
        <p className="text-muted mt-2">Water quality comparison</p>
      </header>

      {/* Score comparison cards */}
      {hasScores && (
        <div className="mt-8 grid grid-cols-2 gap-4 max-w-2xl mx-auto">
          {sides.map(({ district, data }) => (
            <Link key={district} href={`/postcode/${district}`} className="card p-6 text-center group">
              <p className="text-xs text-faint uppercase tracking-wider">{data.areaName}</p>
              <p className="font-data text-lg font-bold text-ink mt-1">{district}</p>
              <p className={`font-data text-4xl font-bold mt-3 ${scoreTextClass(data.safetyScore)}`}>
                {data.safetyScore.toFixed(1)}
              </p>
              <p className="text-xs text-faint mt-1">/10</p>
              <div className={`mt-3 inline-block px-3 py-1 rounded-full text-xs font-medium ${scoreBgClass(data.safetyScore)} ${scoreTextClass(data.safetyScore)}`}>
                {data.contaminantsFlagged} flagged · {data.contaminantsTested} tested
              </div>
              <p className="text-xs text-muted mt-3">{data.supplier}</p>
            </Link>
          ))}
        </div>
      )}

      {/* Verdict */}
      {hasScores && (
        <div className="mt-6 text-center">
          <p className="text-base text-body font-medium">
            {winner ? (
              <>
                <span className={scoreTextClass(winnerData!.safetyScore)}>{winner}</span> has better water quality
              </>
            ) : (
              "Both areas have equal water quality scores"
            )}
          </p>
        </div>
      )}

      {/* Contaminant comparison table */}
      {comparisonRows.length > 0 && (
        <section className="mt-10 max-w-3xl mx-auto">
          <h2 className="font-display text-xl text-ink italic mb-4 text-center">Contaminant comparison</h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-rule text-xs text-faint uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Contaminant</th>
                  <th className="text-right px-4 py-3">{d1}</th>
                  <th className="text-right px-4 py-3">{d2}</th>
                  <th className="text-right px-4 py-3 hidden sm:table-cell">Safe level</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => {
                  const better = row.v1! < row.v2! ? "left" : row.v2! < row.v1! ? "right" : "tie";
                  return (
                    <tr key={row.name} className={i % 2 === 0 ? "bg-wash/30" : ""}>
                      <td className="px-4 py-2.5 text-ink font-medium">{row.name}</td>
                      <td className={`px-4 py-2.5 text-right font-data ${better === "left" ? "text-safe font-bold" : ""}`}>
                        {row.v1!.toPrecision(3)} {row.unit}
                      </td>
                      <td className={`px-4 py-2.5 text-right font-data ${better === "right" ? "text-safe font-bold" : ""}`}>
                        {row.v2!.toPrecision(3)} {row.unit}
                      </td>
                      <td className="px-4 py-2.5 text-right text-faint font-data hidden sm:table-cell">
                        {row.limit != null ? `${row.limit} ${row.unit}` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* AI-citable summary */}
      <div className="mt-8 max-w-3xl mx-auto">
        <p className="text-sm text-body leading-relaxed">
          {d1} ({data1.areaName}, {data1.city}) scored {data1.safetyScore.toFixed(1)}/10 with {data1.contaminantsFlagged} contaminants
          exceeding safe levels out of {data1.contaminantsTested} tested. {d2} ({data2.areaName}, {data2.city}) scored{" "}
          {data2.safetyScore.toFixed(1)}/10 with {data2.contaminantsFlagged} flagged out of {data2.contaminantsTested} tested. {verdictText}
        </p>
      </div>

      {/* CTA */}
      <div className="mt-10 text-center">
        <p className="text-sm text-muted mb-3">Check your own postcode</p>
        <div className="max-w-md mx-auto">
          <PostcodeSearch size="lg" />
        </div>
      </div>

      {/* Links to individual pages */}
      <div className="mt-8 flex justify-center gap-4">
        <Link href={`/postcode/${d1}`} className="pill">
          Full {d1} report <ArrowRight className="w-3 h-3 ml-1" />
        </Link>
        <Link href={`/postcode/${d2}`} className="pill">
          Full {d2} report <ArrowRight className="w-3 h-3 ml-1" />
        </Link>
      </div>
    </div>
  );
}
