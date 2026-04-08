import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Check, Minus, ShieldCheck, ArrowRight } from "lucide-react";
import { PostcodeSearch } from "@/components/postcode-search";
import { ScrollReveal } from "@/components/scroll-reveal";
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

export const revalidate = 86400;

interface Props {
  params: Promise<{ brand1: string; brand2: string }>;
}

// ── Static params: both directions for all 4 pairs ──

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
  const canonical = getCanonicalUrl(comparison, brand1, brand2);

  const title = `${a} vs ${b} UK (2026) — Which Filter is Better?`;
  const description = `${a} vs ${b}: independent comparison covering filtration, certifications, running costs, and which is right for your home.`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

// ── Helpers ──

function getCanonicalUrl(
  comparison: BrandComparison,
  brand1Param: string,
  brand2Param: string,
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

  const canonicalUrl = getCanonicalUrl(comparison, brand1, brand2);

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

  return (
    <div className="bg-hero min-h-screen">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8 py-8 lg:py-12">
        <BreadcrumbSchema items={breadcrumbItems} />
        <FAQSchema faqs={displayComparison.faqs} />

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-faint">
          <Link href="/" className="hover:text-accent transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/compare" className="hover:text-accent transition-colors">
            Compare
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-ink font-medium">
            {displayComparison.brand1Label} vs {displayComparison.brand2Label}
          </span>
        </nav>

        {/* ── Hero ── */}
        <header className="mt-8 max-w-3xl">
          <p className="text-xs font-medium text-accent uppercase tracking-widest mb-3">
            {displayComparison.category} Comparison
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-ink tracking-tight italic leading-tight">
            {displayComparison.brand1Label}{" "}
            <span className="text-faint not-italic text-3xl sm:text-4xl lg:text-5xl">vs</span>{" "}
            {displayComparison.brand2Label}
          </h1>
          <p className="text-base sm:text-lg text-muted mt-4 max-w-2xl leading-relaxed">
            An honest, data-driven comparison of two popular UK water filters — what they remove,
            what they cost to run, and which one belongs in your kitchen.
          </p>
        </header>

        {/* ── Quick verdict card ── */}
        <ScrollReveal delay={0}>
          <div className="mt-8 card border-l-4 border-l-accent p-6 lg:p-8 max-w-3xl">
            <p className="text-[11px] text-accent font-semibold uppercase tracking-widest mb-3">
              Our verdict
            </p>
            <p className="text-base text-body leading-relaxed">
              <strong className="text-ink">Key difference: </strong>
              {displayComparison.keyDifference}
            </p>
            <p className="text-base text-body leading-relaxed mt-3">
              {displayComparison.verdict}
            </p>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-wash rounded-lg p-4">
                <p className="text-[10px] text-faint uppercase tracking-wider mb-1">
                  {displayComparison.brand1Label} is best for
                </p>
                <p className="text-sm font-medium text-ink">
                  {displayComparison.brand1BestFor}
                </p>
              </div>
              <div className="bg-wash rounded-lg p-4">
                <p className="text-[10px] text-faint uppercase tracking-wider mb-1">
                  {displayComparison.brand2Label} is best for
                </p>
                <p className="text-sm font-medium text-ink">
                  {displayComparison.brand2BestFor}
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* ── Side-by-side specs table ── */}
        <hr className="border-rule mt-10" />
        <ScrollReveal delay={0}>
          <section className="mt-8">
            <h2 className="font-display text-2xl sm:text-3xl text-ink italic mb-6">
              Specs at a glance
            </h2>

            <div className="card overflow-hidden">
              {/* Column headers */}
              <div className="grid grid-cols-[1fr_1fr_1fr] border-b border-rule">
                <div className="p-4 border-r border-rule" />
                <div className="p-4 border-r border-rule text-center">
                  <p className="text-xs text-faint uppercase tracking-wider mb-0.5">Filter 1</p>
                  <p className="font-semibold text-ink text-sm">
                    {displayComparison.brand1Label}
                  </p>
                  <p className="text-xs text-muted">{displayProduct1.model}</p>
                </div>
                <div className="p-4 text-center">
                  <p className="text-xs text-faint uppercase tracking-wider mb-0.5">Filter 2</p>
                  <p className="font-semibold text-ink text-sm">
                    {displayComparison.brand2Label}
                  </p>
                  <p className="text-xs text-muted">{displayProduct2.model}</p>
                </div>
              </div>

              {/* Price */}
              <SpecRow
                label="Price"
                val1={`£${displayProduct1.priceGbp}`}
                val2={`£${displayProduct2.priceGbp}`}
                mono
              />

              {/* Annual cost */}
              <SpecRow
                label="Annual filter cost"
                val1={
                  displayProduct1.annualCost != null
                    ? `~£${displayProduct1.annualCost}/yr`
                    : "—"
                }
                val2={
                  displayProduct2.annualCost != null
                    ? `~£${displayProduct2.annualCost}/yr`
                    : "—"
                }
                mono
              />

              {/* Rating */}
              <SpecRow
                label="Rating"
                val1={`${displayProduct1.rating}/5`}
                val2={`${displayProduct2.rating}/5`}
                mono
              />

              {/* Category */}
              <SpecRow
                label="Type"
                val1={displayProduct1.category.replace("_", " ")}
                val2={displayProduct2.category.replace("_", " ")}
              />

              {/* Filter life */}
              {(displayProduct1.filterLife || displayProduct2.filterLife) && (
                <SpecRow
                  label="Filter life"
                  val1={displayProduct1.filterLife ?? "—"}
                  val2={displayProduct2.filterLife ?? "—"}
                />
              )}

              {/* Flow rate */}
              {(displayProduct1.flowRate || displayProduct2.flowRate) && (
                <SpecRow
                  label="Flow rate"
                  val1={displayProduct1.flowRate ?? "—"}
                  val2={displayProduct2.flowRate ?? "—"}
                  mono
                />
              )}

              {/* Certifications */}
              <SpecRow
                label="Certifications"
                val1={
                  displayProduct1.certifications.length > 0
                    ? displayProduct1.certifications.join(", ")
                    : "None listed"
                }
                val2={
                  displayProduct2.certifications.length > 0
                    ? displayProduct2.certifications.join(", ")
                    : "None listed"
                }
              />

              {/* Removes */}
              <div className="grid grid-cols-[1fr_1fr_1fr] border-t border-rule">
                <div className="p-4 border-r border-rule">
                  <p className="text-xs text-muted">What it removes</p>
                </div>
                <div className="p-4 border-r border-rule">
                  <div className="flex flex-wrap gap-1">
                    {displayProduct1.removes.map((r) => (
                      <span
                        key={r}
                        className="inline-flex items-center gap-0.5 text-[10px] bg-emerald-50 text-emerald-700 rounded px-1.5 py-0.5"
                      >
                        <Check className="w-2.5 h-2.5 shrink-0" />
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {displayProduct2.removes.map((r) => (
                      <span
                        key={r}
                        className="inline-flex items-center gap-0.5 text-[10px] bg-emerald-50 text-emerald-700 rounded px-1.5 py-0.5"
                      >
                        <Check className="w-2.5 h-2.5 shrink-0" />
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* ── Comparison points ── */}
        <hr className="border-rule mt-10" />
        <ScrollReveal delay={0}>
          <section className="mt-8">
            <h2 className="font-display text-2xl sm:text-3xl text-ink italic mb-6">
              Head-to-head breakdown
            </h2>

            <div className="space-y-3">
              {displayComparison.comparisonPoints.map((pt) => (
                <div key={pt.category} className="card p-5">
                  <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                    <p className="text-xs font-semibold text-ink uppercase tracking-wider">
                      {pt.category}
                    </p>
                    {pt.winner !== null && (
                      <span className="text-[10px] font-semibold text-accent bg-accent/8 rounded-full px-2.5 py-1">
                        {pt.winner === 1
                          ? `${displayComparison.brand1Label} wins`
                          : `${displayComparison.brand2Label} wins`}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <ComparisonCell
                      label={displayComparison.brand1Label}
                      text={pt.brand1}
                      isWinner={pt.winner === 1}
                    />
                    <ComparisonCell
                      label={displayComparison.brand2Label}
                      text={pt.brand2}
                      isWinner={pt.winner === 2}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </ScrollReveal>

        {/* ── Product cards side by side ── */}
        <hr className="border-rule mt-10" />
        <ScrollReveal delay={0}>
          <section className="mt-8">
            <h2 className="font-display text-2xl sm:text-3xl text-ink italic mb-6">
              Buy either filter
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ProductCard
                product={displayProduct1}
                highlight={displayComparison.brand1BestFor}
                pageType="brand-compare"
              />
              <ProductCard
                product={displayProduct2}
                highlight={displayComparison.brand2BestFor}
                pageType="brand-compare"
              />
            </div>
          </section>
        </ScrollReveal>

        {/* ── FAQ ── */}
        <hr className="border-rule mt-10" />
        <ScrollReveal delay={0}>
          <section className="mt-8 max-w-3xl">
            <h2 className="font-display text-2xl sm:text-3xl text-ink italic mb-6">
              Common questions
            </h2>
            <div className="space-y-4">
              {displayComparison.faqs.map((faq) => (
                <div key={faq.question} className="card p-5 lg:p-6">
                  <h3 className="font-semibold text-ink text-sm leading-snug mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-sm text-body leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        </ScrollReveal>

        {/* ── Postcode CTA ── */}
        <hr className="border-rule mt-10" />
        <ScrollReveal delay={0}>
          <section className="mt-8 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-safe shrink-0" />
              <h2 className="font-display text-2xl text-ink italic">
                See what is in your water
              </h2>
            </div>
            <p className="text-sm text-muted mt-1 mb-5 max-w-xl">
              Enter your postcode to get a detailed water quality report for your area — so you
              know exactly which contaminants you need to target.
            </p>
            <div className="max-w-xl">
              <PostcodeSearch size="sm" />
            </div>
          </section>
        </ScrollReveal>

        {/* ── Other comparisons ── */}
        {otherComparisons.length > 0 && (
          <>
            <hr className="border-rule mt-10" />
            <ScrollReveal delay={0}>
              <section className="mt-8">
                <h2 className="font-display text-xl text-ink italic mb-4">
                  More filter comparisons
                </h2>
                <div className="flex flex-wrap gap-2">
                  {otherComparisons.map((c) => (
                    <Link
                      key={`${c.brand1Slug}-${c.brand2Slug}`}
                      href={`/compare/filter/${c.brand1Slug}/vs/${c.brand2Slug}`}
                      className="pill"
                    >
                      {c.brand1Label} vs {c.brand2Label}
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Link>
                  ))}
                </div>
              </section>
            </ScrollReveal>
          </>
        )}

        {/* Footer */}
        <footer className="mt-10 pb-4 text-sm text-faint leading-relaxed">
          Product specifications and pricing are based on manufacturer data and independent testing.
          Annual cost estimates reflect average UK household usage. See our{" "}
          <Link
            href="/about/methodology"
            className="underline underline-offset-2 hover:text-muted transition-colors"
          >
            methodology
          </Link>{" "}
          for how we evaluate filters.
        </footer>
      </div>
    </div>
  );
}

// ── Sub-components ──

function SpecRow({
  label,
  val1,
  val2,
  mono = false,
}: {
  label: string;
  val1: string;
  val2: string;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-[1fr_1fr_1fr] border-t border-rule">
      <div className="p-4 border-r border-rule">
        <p className="text-xs text-muted">{label}</p>
      </div>
      <div className="p-4 border-r border-rule">
        <p className={`text-sm text-ink ${mono ? "font-data font-semibold" : ""}`}>{val1}</p>
      </div>
      <div className="p-4">
        <p className={`text-sm text-ink ${mono ? "font-data font-semibold" : ""}`}>{val2}</p>
      </div>
    </div>
  );
}

function ComparisonCell({
  label,
  text,
  isWinner,
}: {
  label: string;
  text: string;
  isWinner: boolean;
}) {
  return (
    <div
      className={`rounded-lg p-3.5 ${
        isWinner
          ? "bg-emerald-50 border border-emerald-200/60"
          : "bg-wash border border-transparent"
      }`}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        {isWinner ? (
          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        ) : (
          <Minus className="w-3.5 h-3.5 text-faint shrink-0" />
        )}
        <p
          className={`text-[10px] font-semibold uppercase tracking-wider ${
            isWinner ? "text-emerald-700" : "text-faint"
          }`}
        >
          {label}
        </p>
      </div>
      <p className="text-xs text-body leading-relaxed">{text}</p>
    </div>
  );
}
