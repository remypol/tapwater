import type { Metadata } from "next";
import Link from "next/link";
import { CompareSearch } from "@/components/compare-search";
import { TankSearch } from "@/components/tank/tank-search";
import "@/components/tank/tank.css";
import { FixPicks } from "@/components/fix-picks";
import { BreadcrumbSchema, FAQSchema } from "@/components/json-ld";
import { getPostcodeData, getAllPostcodeDistricts, isRankable } from "@/lib/data";
import { CITY_COMPARISON_PAIRS, cityLabel } from "@/lib/city-comparisons";
import type { PostcodeData } from "@/lib/types";
import { OG_IMAGE } from "@/lib/og";

export const revalidate = 86400;

const year = new Date().getFullYear();

// ── Helpers ──

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

/** Inline ranked list for the intro: "SW1A (Westminster) 9.4, ..." with links. */
function RankedNames({ areas }: { areas: PostcodeData[] }) {
  return (
    <>
      {areas.map((p, i) => (
        <span key={p.district}>
          {i > 0 && (i === areas.length - 1 ? " and " : ", ")}
          <Link
            href={`/postcode/${p.district}`}
            className="wt-link"
          >
            {p.district} ({p.areaName})
          </Link>{" "}
          <span className="wt-nums">{p.safetyScore.toFixed(1)}</span>
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

  const tank = (d: PostcodeData, rank: number) => (
    <Link key={d.district} href={`/postcode/${d.district}`} className="wt-card">
      <i style={{ height: `${Math.max(12, Math.min(92, d.safetyScore * 10))}%` }} />
      <b>{rank}. {d.district}</b>
      <small>{d.areaName}</small>
      <span>{d.safetyScore.toFixed(1)} out of 10{d.contaminantsFlagged > 0 ? ` · ${d.contaminantsFlagged} flagged` : ""}</span>
    </Link>
  );

  return (
    <div className="wt">
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Compare", url: "https://www.tapwater.uk/compare" },
        ]}
      />
      <FAQSchema faqs={faqs} />
      <div className="wt-top">
        <div className="wt-inner">
          <nav aria-label="Breadcrumb" className="wt-crumbs">
            <Link href="/">Home</Link><span aria-hidden="true">/</span><span aria-current="page">Compare</span>
          </nav>
        </div>
      </div>

      <section className="wt-tank" style={{ ["--wt-surface" as string]: "16%" }}>
        <div className="wt-inner" style={{ gridTemplateColumns: "1fr", minHeight: 0, paddingBlock: "88px 64px" }}>
          <div>
            <h1 className="wt-h2" style={{ fontSize: "clamp(2.4rem, 6vw, 4.6rem)", maxWidth: "16ch" }}>
              The best and worst tap water in the UK in {year}
            </h1>
            {topThree.length > 0 && bottomThree.length > 0 ? (
              <>
                <p className="wt-basis wt-nums" style={{ maxWidth: "62ch", fontSize: "1.15rem" }}>
                  The cleanest tap water in the UK right now is in <RankedNames areas={topThree} />. The lowest scores are in <RankedNames areas={bottomThree} />.
                </p>
                <p className="wt-homefacts">
                  Scores are out of 10 and compare the latest drinking-water tests for {totalTested} postcode districts against the legal limit for each of {contaminantCount} substances.
                  Even the lowest-scoring area meets the rules for drinking water: a low score means readings sat closer to their limits, not that the water is unsafe.{" "}
                  <Link href="/about/methodology">How the score works</Link>
                </p>
              </>
            ) : (
              <p className="wt-basis">Rankings appear here once enough recent test results are in.</p>
            )}
            <div style={{ marginTop: 32, maxWidth: 620 }}><CompareSearch /></div>
          </div>
        </div>
      </section>

      <section className="wt-band wt-band--white">
        <div className="wt-inner wt-twocol">
          <div>
            <h2 className="wt-h2">Top 10 cleanest</h2>
            <p className="wt-sub">The highest-scoring areas in the UK.</p>
            <div className="wt-cards wt-nums">{best.map((d, i) => tank(d, i + 1))}</div>
          </div>
          <div>
            <h2 className="wt-h2">Top 10 worst</h2>
            <p className="wt-sub">The lowest-scoring areas in the UK.</p>
            <div className="wt-cards wt-nums">{worst.map((d, i) => tank(d, i + 1))}</div>
          </div>
        </div>
      </section>

      <section className="wt-band wt-band--foam">
        <div className="wt-inner">
          <h2 className="wt-h2">By water company</h2>
          <p className="wt-sub">Average postcode safety score per supplier, not compliance rate.</p>
          <div className="wt-tablewrap" style={{ marginTop: 24 }}>
            <table className="wt-table wt-table--light wt-nums" style={{ minWidth: 520, maxWidth: 760 }}>
              <thead><tr><th scope="col">#</th><th scope="col">Supplier</th><th scope="col" style={{ textAlign: "right" }}>Avg safety score</th><th scope="col" style={{ textAlign: "right" }}>Postcodes</th></tr></thead>
              <tbody>
                {suppliers.map((s, i) => (
                  <tr key={s.id}>
                    <td style={{ opacity: 0.6 }}>{i + 1}</td>
                    <td><Link href={`/supplier/${s.id}`}>{s.name}</Link></td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{s.avgScore.toFixed(1)}</td>
                    <td style={{ textAlign: "right", opacity: 0.7 }}>{s.postcodeCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="wt-band wt-band--white">
        <div className="wt-inner">
          <div className="wt-check">
            <h2 className="wt-h2">Check your postcode</h2>
            <p className="wt-sub">See exactly what&apos;s in the tap water at your address.</p>
            <TankSearch />
          </div>
          {/* City-vs-city comparisons. These pages were in the sitemap but linked from nowhere. */}
          <h2 className="wt-h2" style={{ marginTop: 64 }}>Compare two cities</h2>
          <p className="wt-sub">Side-by-side water quality for the UK&apos;s largest cities, based on the same test data as the postcode reports.</p>
          <p className="wt-pills" style={{ marginTop: 20 }}>
            {CITY_COMPARISON_PAIRS.map(([a, b]) => (
              <Link key={`${a}-${b}`} href={`/compare/city/${a}/vs/${b}`}>{cityLabel(a)} vs {cityLabel(b)}</Link>
            ))}
          </p>
        </div>
      </section>

      <section className="wt-faq" aria-labelledby="compare-faq-heading">
        <div className="wt-inner">
          <h2 className="wt-h2" id="compare-faq-heading">Common questions</h2>
          {faqs.map(({ question, answer }, i) => (
            <details key={question} open={i === 0}>
              <summary>{question}</summary>
              <p>
                {answer}
                {question === "How is the score calculated?" ? <> <Link href="/about/methodology">Read the methodology</Link></> : null}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="wt-band wt-band--foam">
        <div className="wt-inner">
          {/* Closing commercial step. Readers arrive here to see where their area ranks; the natural next question is "so what do I do about it". */}
          <FixPicks
            pageType="compare"
            placement="compare-picks"
            title="Whatever your water scored, this is what fixes it"
            intro={
              <>
                A low score does not mean unsafe water, and a high one does not mean nothing to improve. These are the three fixes readers click most across every ranking on
                this page. For a recommendation matched to your own readings, open your postcode report above.
              </>
            }
          />
          <p className="wt-fine" style={{ marginTop: 40 }}>
            Rankings based on {totalTested} postcode districts across the UK. Data from water companies via the Stream Water Data Portal and the Environment Agency. See our{" "}
            <Link href="/about/methodology">methodology</Link> for how scores are calculated.
          </p>
        </div>
      </section>
    </div>
  );
}
