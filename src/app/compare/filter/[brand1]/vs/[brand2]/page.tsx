import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TankSearch } from "@/components/tank/tank-search";
import "@/components/tank/tank.css";
import { BreadcrumbSchema, FAQSchema } from "@/components/json-ld";
import { ProductCard } from "@/components/product-card";
import { PRODUCTS } from "@/lib/products";
import {
  BRAND_COMPARISONS,
  BRAND_COMPARISON_PAIRS,
  getBrandComparison,
  type BrandComparison,
} from "@/lib/brand-comparisons";
import type { FilterProduct } from "@/lib/types";
import { OG_IMAGE } from "@/lib/og";

export const revalidate = 86400;

interface Props {
  params: Promise<{ brand1: string; brand2: string }>;
}

// ── Static params: both directions for all 4 pairs ──

// Every brand pair is enumerated at build time from the repo. Without this,
// notFound() alone can still serve a cached 200 on Vercel — see the comment in
// /postcode/[district]/page.tsx for the measured behaviour.
export const dynamicParams = false;

export function generateStaticParams() {
  const out: { brand1: string; brand2: string }[] = [];
  for (const [a, b] of BRAND_COMPARISON_PAIRS) {
    out.push({ brand1: a, brand2: b });
    out.push({ brand1: b, brand2: a });
  }
  return out;
}

// ── Metadata ──

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { brand1, brand2 } = await params;
  const comparison = getBrandComparison(brand1, brand2);
  if (!comparison) return { title: "Not Found" };

  const [a, b] = [comparison.brand1Label, comparison.brand2Label];
  const canonical = getCanonicalUrl(comparison);

  const title = `${a} vs ${b} UK (2026): Which Is Better?`;
  const description = `${a} vs ${b}: independent comparison covering filtration, certifications, running costs, and which is right for your home.`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      images: OG_IMAGE,
      title,
      description,
      url: canonical,
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

// ── Helpers ──

function getCanonicalUrl(
  comparison: BrandComparison,
): string {
  // Canonical is always brand1Slug/vs/brand2Slug as defined in config
  return `https://www.tapwater.uk/compare/filter/${comparison.brand1Slug}/vs/${comparison.brand2Slug}`;
}

function getProductById(id: string): FilterProduct | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

// ── Page ──

export default async function FilterBrandComparisonPage({ params }: Props) {
  const { brand1, brand2 } = await params;

  const comparison = getBrandComparison(brand1, brand2);
  if (!comparison) notFound();

  const product1 = getProductById(comparison.brand1ProductId);
  const product2 = getProductById(comparison.brand2ProductId);
  if (!product1 || !product2) notFound();

  // Resolve display order — always show brand1 from config first
  const isFlipped = brand1 === comparison.brand2Slug;
  const [displayComparison, displayProduct1, displayProduct2] = isFlipped
    ? [
        {
          ...comparison,
          brand1Slug: comparison.brand2Slug,
          brand2Slug: comparison.brand1Slug,
          brand1Label: comparison.brand2Label,
          brand2Label: comparison.brand1Label,
          brand1ProductId: comparison.brand2ProductId,
          brand2ProductId: comparison.brand1ProductId,
          brand1BestFor: comparison.brand2BestFor,
          brand2BestFor: comparison.brand1BestFor,
          comparisonPoints: comparison.comparisonPoints.map((pt) => ({
            ...pt,
            brand1: pt.brand2,
            brand2: pt.brand1,
            winner: pt.winner === 1 ? (2 as const) : pt.winner === 2 ? (1 as const) : null,
          })),
        } as BrandComparison,
        product2,
        product1,
      ]
    : [comparison, product1, product2];

  const canonicalUrl = getCanonicalUrl(comparison);

  const breadcrumbItems = [
    { name: "Home", url: "https://www.tapwater.uk" },
    { name: "Compare", url: "https://www.tapwater.uk/compare" },
    {
      name: `${displayComparison.brand1Label} vs ${displayComparison.brand2Label}`,
      url: canonicalUrl,
    },
  ];

  // Other comparisons (not this one)
  const otherComparisons = BRAND_COMPARISONS.filter(
    (c) =>
      !(
        (c.brand1Slug === comparison.brand1Slug &&
          c.brand2Slug === comparison.brand2Slug) ||
        (c.brand1Slug === comparison.brand2Slug &&
          c.brand2Slug === comparison.brand1Slug)
      ),
  );

  const specs: [string, string, string][] = [
    ["Price", `£${displayProduct1.priceGbp}`, `£${displayProduct2.priceGbp}`],
    ["Annual filter cost", displayProduct1.annualCost != null ? `~£${displayProduct1.annualCost}/yr` : "–", displayProduct2.annualCost != null ? `~£${displayProduct2.annualCost}/yr` : "–"],
    ["Rating", `${displayProduct1.rating}/5`, `${displayProduct2.rating}/5`],
    ["Type", displayProduct1.category.replace("_", " "), displayProduct2.category.replace("_", " ")],
    ...(displayProduct1.filterLife || displayProduct2.filterLife ? [["Filter life", displayProduct1.filterLife ?? "–", displayProduct2.filterLife ?? "–"] as [string, string, string]] : []),
    ...(displayProduct1.flowRate || displayProduct2.flowRate ? [["Flow rate", displayProduct1.flowRate ?? "–", displayProduct2.flowRate ?? "–"] as [string, string, string]] : []),
    ["Certifications", displayProduct1.certifications.length > 0 ? displayProduct1.certifications.join(", ") : "None listed", displayProduct2.certifications.length > 0 ? displayProduct2.certifications.join(", ") : "None listed"],
    ["What it removes", displayProduct1.removes.join(", "), displayProduct2.removes.join(", ")],
  ];

  return (
    <div className="wt">
      <BreadcrumbSchema items={breadcrumbItems} />
      <FAQSchema faqs={displayComparison.faqs} />
      <div className="wt-top">
        <div className="wt-inner">
          <nav aria-label="Breadcrumb" className="wt-crumbs">
            <Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/compare">Compare</Link><span aria-hidden="true">/</span><span aria-current="page">{displayComparison.brand1Label} vs {displayComparison.brand2Label}</span>
          </nav>
        </div>
      </div>

      <section className="wt-band wt-band--foam">
        <div className="wt-inner">
          <p className="wt-tag" style={{ background: "var(--wt-sky)", color: "var(--wt-deep)" }}>{displayComparison.category} comparison</p>
          <h1 className="wt-h2" style={{ fontSize: "clamp(2.4rem, 6vw, 4.6rem)" }}>{displayComparison.brand1Label} vs {displayComparison.brand2Label}</h1>
          <p className="wt-sub">
            An honest, data-driven comparison of two popular UK water filters: what they remove, what they cost to run, and which one belongs in your kitchen.
          </p>
          <div className="wt-do-grid" style={{ marginTop: 40 }}>
            <div className="wt-primary">
              <h3>Our verdict</h3>
              <p><strong>Key difference:</strong> {displayComparison.keyDifference}</p>
              <p>{displayComparison.verdict}</p>
            </div>
            <div className="wt-side">
              <div className="wt-second"><h3>{displayComparison.brand1Label} is best for</h3><p>{displayComparison.brand1BestFor}</p></div>
              <div className="wt-second"><h3>{displayComparison.brand2Label} is best for</h3><p>{displayComparison.brand2BestFor}</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="wt-band wt-band--white">
        <div className="wt-inner">
          <h2 className="wt-h2">Specs at a glance</h2>
          <div className="wt-tablewrap" style={{ marginTop: 24 }}>
            <table className="wt-table wt-table--light wt-nums" style={{ minWidth: 560, maxWidth: 900 }}>
              <thead><tr><th scope="col"></th><th scope="col">{displayComparison.brand1Label} <small>{displayProduct1.model}</small></th><th scope="col">{displayComparison.brand2Label} <small>{displayProduct2.model}</small></th></tr></thead>
              <tbody>
                {specs.map(([label, v1, v2]) => (
                  <tr key={label}><td style={{ opacity: 0.7, fontWeight: 500 }}>{label}</td><td>{v1}</td><td>{v2}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="wt-band wt-band--foam">
        <div className="wt-inner">
          <h2 className="wt-h2">Head-to-head breakdown</h2>
          <ul className="wt-facts" style={{ marginTop: 24, maxWidth: 900 }}>
            {displayComparison.comparisonPoints.map((pt) => (
              <li key={pt.category}>
                <strong>
                  {pt.category}
                  {pt.winner !== null ? <em style={{ fontStyle: "normal", fontWeight: 600, color: "var(--wt-pool)", marginLeft: 12 }}>{pt.winner === 1 ? displayComparison.brand1Label : displayComparison.brand2Label} wins</em> : null}
                </strong>
                <span><b>{displayComparison.brand1Label}:</b> {pt.brand1}</span>
                <span><b>{displayComparison.brand2Label}:</b> {pt.brand2}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="wt-band wt-band--white">
        <div className="wt-inner">
          <h2 className="wt-h2">Buy either filter</h2>
          <div className="wt-picks">
            <ProductCard product={displayProduct1} highlight={displayComparison.brand1BestFor} pageType="brand-compare" />
            <ProductCard product={displayProduct2} highlight={displayComparison.brand2BestFor} pageType="brand-compare" />
          </div>
        </div>
      </section>

      <section className="wt-faq">
        <div className="wt-inner">
          <h2 className="wt-h2">Common questions</h2>
          {displayComparison.faqs.map((faq, i) => (
            <details key={faq.question} open={i === 0}><summary>{faq.question}</summary><p>{faq.answer}</p></details>
          ))}
        </div>
      </section>

      <section className="wt-band wt-band--foam">
        <div className="wt-inner">
          <div className="wt-check">
            <h2 className="wt-h2">See what is in your water</h2>
            <p className="wt-sub">Enter your postcode to get a detailed water quality report for your area, so you know exactly which contaminants you need to target.</p>
            <TankSearch />
          </div>
          {otherComparisons.length > 0 ? (
            <>
              <h2 className="wt-h2" style={{ marginTop: 56 }}>More filter comparisons</h2>
              <p className="wt-pills" style={{ marginTop: 20 }}>
                {otherComparisons.map((c) => (
                  <Link key={`${c.brand1Slug}-${c.brand2Slug}`} href={`/compare/filter/${c.brand1Slug}/vs/${c.brand2Slug}`}>{c.brand1Label} vs {c.brand2Label}</Link>
                ))}
              </p>
            </>
          ) : null}
          <p className="wt-fine" style={{ marginTop: 40 }}>
            Product specifications and pricing are based on manufacturer data and independent testing. Annual cost estimates reflect average UK household usage. See our{" "}
            <Link href="/about/methodology">methodology</Link> for how we evaluate filters.
          </p>
        </div>
      </section>
    </div>
  );
}
