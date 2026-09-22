import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostcodeData } from "@/lib/data";
import { BreadcrumbSchema, FAQSchema } from "@/components/json-ld";
import { TankSearch } from "@/components/tank/tank-search";
import { formatReading } from "@/lib/tank-plan";
import "@/components/tank/tank.css";
import { OG_IMAGE } from "@/lib/og";

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
      images: OG_IMAGE,
      title: `${d1} vs ${d2} Water Quality Comparison`,
      description: `${d1} scores ${data1.safetyScore}/10, ${d2} scores ${data2.safetyScore}/10. Compare contaminants, suppliers, and safety data.`,
      url: `https://www.tapwater.uk/compare/${d1}/vs/${d2}`,
      type: "website",
    },
  };
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
    <div className="wt">
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Compare", url: "https://www.tapwater.uk/compare" },
          { name: `${d1} vs ${d2}`, url: `https://www.tapwater.uk/compare/${d1}/vs/${d2}` },
        ]}
      />
      {faqs.length > 0 && <FAQSchema faqs={faqs} />}
      <div className="wt-top">
        <div className="wt-inner">
          <nav aria-label="Breadcrumb" className="wt-crumbs">
            <Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/compare">Compare</Link><span aria-hidden="true">/</span><span aria-current="page">{d1} vs {d2}</span>
          </nav>
        </div>
      </div>

      <section className="wt-band wt-band--foam">
        <div className="wt-inner">
          <h1 className="wt-h2" style={{ fontSize: "clamp(2.4rem, 6vw, 4.6rem)" }}>{d1} vs {d2}</h1>
          <p className="wt-sub">Water quality comparison</p>
          {hasScores ? (
            <>
              <div className="wt-vs-grid wt-nums" style={{ marginTop: 32 }}>
                {sides.map(({ district, data }) => (
                  <Link key={district} href={`/postcode/${district}`} className={`wt-card${winner === district ? " wt-win" : ""}`}>
                    <i style={{ height: `${Math.max(12, Math.min(92, data.safetyScore * 10))}%` }} />
                    <b>{district}</b>
                    <small>{data.areaName} · {data.supplier}</small>
                    <span>{data.safetyScore.toFixed(1)} out of 10 · {data.contaminantsFlagged} flagged of {data.contaminantsTested} tested</span>
                  </Link>
                ))}
              </div>
              <p className="wt-verdict">{winner ? `${winner} has the better water quality.` : "Both areas score the same."}</p>
            </>
          ) : null}
        </div>
      </section>

      {comparisonRows.length > 0 ? (
        <section className="wt-band wt-band--white">
          <div className="wt-inner">
            <h2 className="wt-h2">Contaminant comparison</h2>
            <p className="wt-sub">The lower reading is marked. Both are inside the legal limit unless the result says otherwise.</p>
            <div className="wt-tablewrap" style={{ marginTop: 24 }}>
              <table className="wt-table wt-table--light wt-nums" style={{ minWidth: 560, maxWidth: 820 }}>
                <thead><tr><th scope="col">Contaminant</th><th scope="col" style={{ textAlign: "right" }}>{d1}</th><th scope="col" style={{ textAlign: "right" }}>{d2}</th><th scope="col" style={{ textAlign: "right" }}>Legal limit</th></tr></thead>
                <tbody>
                  {comparisonRows.map((row) => {
                    const better = row.v1! < row.v2! ? "left" : row.v2! < row.v1! ? "right" : "tie";
                    return (
                      <tr key={row.name}>
                        <td>{row.name}</td>
                        <td style={{ textAlign: "right" }} className={better === "left" ? "wt-better" : undefined}>{formatReading(row.v1!)} {row.unit}</td>
                        <td style={{ textAlign: "right" }} className={better === "right" ? "wt-better" : undefined}>{formatReading(row.v2!)} {row.unit}</td>
                        <td style={{ textAlign: "right", opacity: 0.7 }}>{row.limit != null ? `${formatReading(row.limit)} ${row.unit}` : "–"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}

      <section className="wt-band wt-band--foam">
        <div className="wt-inner">
          <p className="wt-prose wt-nums">
            {d1} ({data1.areaName}, {data1.city}) scored {data1.safetyScore.toFixed(1)}/10 with {data1.contaminantsFlagged} contaminants exceeding safe levels out of {data1.contaminantsTested} tested. {d2} ({data2.areaName}, {data2.city}) scored{" "}
            {data2.safetyScore.toFixed(1)}/10 with {data2.contaminantsFlagged} flagged out of {data2.contaminantsTested} tested. {verdictText}
          </p>
          <p className="wt-pills" style={{ marginTop: 28 }}>
            <Link href={`/postcode/${d1}`}>Full {d1} report</Link>
            <Link href={`/postcode/${d2}`}>Full {d2} report</Link>
            <Link href="/compare">All rankings</Link>
          </p>
          <div className="wt-check" style={{ marginTop: 48 }}>
            <h2 className="wt-h2">Check your own postcode</h2>
            <p className="wt-sub">Every substance, the hardness and what to do about it, for your district.</p>
            <TankSearch />
          </div>
        </div>
      </section>
    </div>
  );
}
