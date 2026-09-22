import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TankSearch } from "@/components/tank/tank-search";
import "@/components/tank/tank.css";
import { BreadcrumbSchema, FAQSchema } from "@/components/json-ld";
import { getPostcodeData, getAllPostcodeDistricts } from "@/lib/data";
import type { PostcodeData } from "@/lib/types";
import { getCityBySlug } from "@/lib/cities";
import { CITY_COMPARISON_PAIRS, canonicalCityPair } from "@/lib/city-comparisons";
import { OG_IMAGE } from "@/lib/og";

export const revalidate = 86400;

interface Props {
  params: Promise<{ city1: string; city2: string }>;
}

// ── Helpers ──

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

// Every comparison pair is enumerated at build time from the repo. Without
// this, notFound() alone can still serve a cached 200 on Vercel — see the
// comment in /postcode/[district]/page.tsx for the measured behaviour.
export const dynamicParams = false;

export function generateStaticParams() {
  const params: { city1: string; city2: string }[] = [];
  for (const [a, b] of CITY_COMPARISON_PAIRS) {
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

  // Both directions render the same comparison, so point them at one canonical URL
  // rather than letting them compete as duplicates and split their link equity.
  const canonicalPair = canonicalCityPair(c1.slug, c2.slug);
  const canonicalUrl = `https://www.tapwater.uk/compare/city/${
    canonicalPair ? canonicalPair[0] : c1.slug
  }/vs/${canonicalPair ? canonicalPair[1] : c2.slug}`;

  return {
    title: `${c1.name} vs ${c2.name} Water Quality`,
    description: `Compare tap water quality in ${c1.name} and ${c2.name}. Safety scores, contaminants, and which city has better water.`,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      images: OG_IMAGE,
      title: `${c1.name} vs ${c2.name} Water Quality Comparison`,
      description: `Compare tap water quality in ${c1.name} and ${c2.name}. Safety scores, contaminants, and which city has better water.`,
      url: canonicalUrl,
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
  const otherPairs = CITY_COMPARISON_PAIRS
    .filter(([a, b]) => !(a === city1 && b === city2) && !(a === city2 && b === city1))
    .slice(0, 5);

  const sides = [stats1, stats2];

  return (
    <div className="wt">
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Compare", url: "https://www.tapwater.uk/compare" },
          { name: `${stats1.name} vs ${stats2.name}`, url: `https://www.tapwater.uk/compare/city/${stats1.slug}/vs/${stats2.slug}` },
        ]}
      />
      {faqs.length > 0 && <FAQSchema faqs={faqs} />}
      <div className="wt-top">
        <div className="wt-inner">
          <nav aria-label="Breadcrumb" className="wt-crumbs">
            <Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/compare">Compare</Link><span aria-hidden="true">/</span><span aria-current="page">{stats1.name} vs {stats2.name}</span>
          </nav>
        </div>
      </div>

      <section className="wt-band wt-band--foam">
        <div className="wt-inner">
          <h1 className="wt-h2" style={{ fontSize: "clamp(2.4rem, 6vw, 4.6rem)" }}>{stats1.name} vs {stats2.name}</h1>
          <p className="wt-sub">Water quality comparison</p>
          {hasScores ? (
            <>
              <p className="wt-prose wt-nums" style={{ marginTop: 24 }}>
                <strong>According to TapWater.uk, {stats1.name} scores {stats1.avgScore.toFixed(1)}/10 and {stats2.name} scores {stats2.avgScore.toFixed(1)}/10 for drinking water quality.</strong>{" "}
                {winner ? `${winner.name} has the better water.` : "Both cities have similar water quality."}
              </p>
              <div className="wt-vs-grid wt-nums" style={{ marginTop: 32 }}>
                {sides.map((stats) => (
                  <Link key={stats.slug} href={`/city/${stats.slug}`} className={`wt-card${winner === stats ? " wt-win" : ""}`}>
                    <i style={{ height: `${Math.max(12, Math.min(92, stats.avgScore * 10))}%` }} />
                    <b>{stats.name}</b>
                    <small>{stats.primarySupplier}{stats.hardnessClass ? ` · ${stats.hardnessClass} water` : ""}</small>
                    <span>{stats.avgScore.toFixed(1)} out of 10 · {stats.totalFlagged} flagged across {stats.totalPostcodes} areas{stats.pfasCount > 0 ? ` · PFAS in ${stats.pfasCount}` : ""}</span>
                  </Link>
                ))}
              </div>
              <p className="wt-verdict">
                {winner ? `${winner.name} has better water quality${scoreDiff >= 0.5 ? `, by ${scoreDiff.toFixed(1)} points.` : "."}` : "Both cities have equal water quality scores."}
              </p>
            </>
          ) : null}
        </div>
      </section>

      {differences.length > 0 ? (
        <section className="wt-band wt-band--white">
          <div className="wt-inner">
            <h2 className="wt-h2">Key differences</h2>
            <ul className="wt-facts" style={{ maxWidth: 720, marginTop: 24 }}>
              {differences.map((diff) => (
                <li key={diff.label}><strong>{diff.label}</strong><span>{diff.detail}</span></li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {hasScores && (stats1.topConcerns.length > 0 || stats2.topConcerns.length > 0) ? (
        <section className="wt-band wt-band--foam">
          <div className="wt-inner">
            <h2 className="wt-h2">Top concerns by city</h2>
            <div className="wt-twocol" style={{ marginTop: 24 }}>
              {sides.map((stats) => (
                <div key={stats.slug}>
                  <h3 className="wt-h3">{stats.name}</h3>
                  {stats.topConcerns.length > 0 ? (
                    <ul className="wt-ledger wt-nums" style={{ borderTopColor: "var(--wt-ink)" }}>
                      {stats.topConcerns.slice(0, 4).map(([name, count]) => (
                        <li key={name}><strong>{name}</strong><b>{count} area{count > 1 ? "s" : ""}</b></li>
                      ))}
                    </ul>
                  ) : (
                    <p className="wt-sub">No contaminants flagged</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="wt-band wt-band--white">
        <div className="wt-inner">
          <h2 className="wt-h2">Full city reports</h2>
          <p className="wt-pills" style={{ marginTop: 20 }}>
            <Link href={`/city/${stats1.slug}`}>{stats1.name} water report</Link>
            <Link href={`/city/${stats2.slug}`}>{stats2.name} water report</Link>
          </p>
          <div className="wt-check" style={{ marginTop: 48 }}>
            <h2 className="wt-h2">Check your postcode</h2>
            <p className="wt-sub">Get a detailed water quality report for your exact area.</p>
            <TankSearch />
          </div>
          {otherPairs.length > 0 ? (
            <>
              <h2 className="wt-h2" style={{ marginTop: 56 }}>More comparisons</h2>
              <p className="wt-pills" style={{ marginTop: 20 }}>
                {otherPairs.map(([a, b]) => {
                  const ca = getCityBySlug(a);
                  const cb = getCityBySlug(b);
                  if (!ca || !cb) return null;
                  return <Link key={`${a}-${b}`} href={`/compare/city/${a}/vs/${b}`}>{ca.name} vs {cb.name}</Link>;
                })}
              </p>
            </>
          ) : null}
          <p className="wt-fine" style={{ marginTop: 40 }}>
            Based on water quality data from {stats1.totalPostcodes + stats2.totalPostcodes} postcode districts across {stats1.name} and {stats2.name}. See our{" "}
            <Link href="/about/methodology">methodology</Link> for how scores are calculated.
          </p>
        </div>
      </section>
    </div>
  );
}
