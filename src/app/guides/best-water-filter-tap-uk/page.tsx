import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Star, ShieldCheck, Search, Wrench } from "lucide-react";
import { PostcodeSearch } from "@/components/postcode-search";
import { AffiliateLink } from "@/components/affiliate-link";
import { ProductCard } from "@/components/product-card";
import { ProductComparisonTable } from "@/components/product-comparison-table";
import { RunningCostComparison } from "@/components/running-cost";
import { ArticleSchema, BreadcrumbSchema, FAQSchema } from "@/components/json-ld";
import { getProductsByCategory } from "@/lib/products";
import { OG_IMAGE } from "@/lib/og";

const year = new Date().getFullYear();

const FAQ_DATA = [
  {
    question: "What is a 3 way filter tap?",
    answer:
      "A 3 way tap (also sold as a triflow tap) replaces your kitchen mixer and dispenses hot, cold, and filtered water from one spout, each through its own internal waterway. The tap itself contains no filter: it is the delivery end for an under-sink filter or reverse osmosis system hidden in the cupboard below. You buy it to avoid drilling a second hole in the worktop for a separate filtered-water tap.",
  },
  {
    question: "Do tap-mounted water filters actually work?",
    answer:
      "Within their limits, yes. A tap-mounted filter like the TAPP Water EcoPro or Waterdrop WD-FC-06 screws onto the spout in minutes and its carbon block genuinely reduces chlorine, lead, and in the EcoPro's case carries a total PFAS reduction claim. The limits are real too: small cartridges mean more frequent replacement, flow through the filter is slower than the open tap, and they fit standard round spouts only, so pull-out sprayers and some designer taps are out.",
  },
  {
    question: "Should I get a filter tap or an under sink filter?",
    answer:
      "They answer different budgets rather than different jobs. A tap-mounted filter costs £30 to £60 and needs no tools, which makes it the right first step for renters or anyone testing whether filtered water is worth it to them. An under sink filter with its own tap or a 3 way tap costs more up front but runs cheaper per litre, filters at full mains pressure, and keeps the spout clear. If you already know you filter every glass, start under the sink.",
  },
  {
    question: "Can I fit a 3-way tap myself?",
    answer:
      "If you are comfortable swapping a kitchen tap, a 3-way tap is the same job plus one extra flexible hose to the filter: isolate the water, disconnect the old mixer, seat the new tap, and connect hot, cold, and the filter line. Allow an hour or two. If the existing tap has seized fittings or your sink has no isolation valves, a plumber will charge roughly £80 to £150 for the swap.",
  },
];

export function generateMetadata(): Metadata {
  return {
    title: `Best Water Filter Taps UK ${year}: 3-Way & Tap-Mounted`,
    description:
      "Water filter taps compared: 3-way triflow taps for under-sink systems and tap-mounted filters that fit in minutes, matched to real UK water data.",
    alternates: {
      canonical: "https://www.tapwater.uk/guides/best-water-filter-tap-uk",
    },
    openGraph: {
      images: OG_IMAGE,
      title: `Best Water Filter Taps UK (${year})`,
      description:
        "3-way triflow taps and tap-mounted filters compared on what they remove and what they cost to run.",
      url: "https://www.tapwater.uk/guides/best-water-filter-tap-uk",
      type: "article",
    },
    twitter: {
      images: OG_IMAGE,
      card: "summary_large_image",
      title: `Best Water Filter Taps UK (${year})`,
      description:
        "3-way triflow taps and tap-mounted filters compared honestly.",
    },
  };
}

/* ── Helpers ─────────────────────────────────────────────────────────── */

function ProductReview({
  product,
  heading,
  verdict,
  review,
  pros,
  cons,
  ctaLabel,
}: {
  product: ReturnType<typeof getProductsByCategory>[number];
  heading: string;
  verdict: string;
  review: string;
  pros: string[];
  cons: string[];
  ctaLabel?: string;
}) {
  return (
    <div className="card p-6 lg:p-8">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-display text-xl italic text-ink">{heading}</h3>
          <p className="text-sm text-muted mt-0.5">
            {product.brand} {product.model}
          </p>
        </div>
        <span className="font-data text-2xl font-bold text-ink">
          &pound;{product.priceGbp}
        </span>
      </div>

      <p className="text-xs font-medium text-accent mt-2">{verdict}</p>

      <p className="text-base text-body leading-relaxed mt-4">{review}</p>

      {/* What it removes */}
      {product.removes.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-ink uppercase tracking-wider mb-2">
            Removes
          </p>
          <div className="flex flex-wrap gap-1.5">
            {product.removes.map((r) => (
              <span
                key={r}
                className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 rounded-full px-2.5 py-1"
              >
                <Check className="w-3 h-3" />
                {r}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {product.certifications.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {product.certifications.map((cert) => (
            <span
              key={cert}
              className="text-xs bg-gray-100 text-faint rounded px-1.5 py-0.5"
            >
              {cert}
            </span>
          ))}
        </div>
      )}

      {/* Pros / Cons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
        <div>
          <p className="text-xs font-medium text-safe uppercase tracking-wider mb-2">
            Pros
          </p>
          <ul className="space-y-1.5">
            {pros.map((p) => (
              <li
                key={p}
                className="flex items-start gap-1.5 text-sm text-body"
              >
                <Check className="w-3.5 h-3.5 text-safe shrink-0 mt-0.5" />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium text-warning uppercase tracking-wider mb-2">
            Cons
          </p>
          <ul className="space-y-1.5">
            {cons.map((c) => (
              <li
                key={c}
                className="flex items-start gap-1.5 text-sm text-body"
              >
                <span className="w-3.5 h-3.5 shrink-0 mt-0.5 text-warning">
                  &ndash;
                </span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Specs row */}
      <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-rule">
        <div>
          <p className="text-xs text-faint uppercase tracking-wider">Flow rate</p>
          <p className="font-data text-sm text-ink font-medium">{product.flowRate ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-faint uppercase tracking-wider">Filter life</p>
          <p className="font-data text-sm text-ink font-medium">{product.filterLife ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-faint uppercase tracking-wider">Annual cost</p>
          <p className="font-data text-sm text-ink font-medium">{product.annualCost ? `£${product.annualCost}/yr` : "—"}</p>
        </div>
      </div>

      {/* Rating + CTA */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-rule">
        <span className="flex items-center gap-1 text-sm text-muted">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          {product.rating.toFixed(1)} average rating
        </span>
        <AffiliateLink
          href={product.affiliateUrl}
          pageType="best-filter-tap-guide"
          recommendationReason={heading}
          productCategory={product.category}
          productSlug={product.slug}
          placement="guide-review"
          campaign="best-filter-tap-guide"
          className="inline-flex items-center gap-1.5 bg-btn text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-btn-hover transition-colors"
        >
          {ctaLabel ?? "View deal"}
          <ArrowUpRight className="w-3.5 h-3.5" />
        </AffiliateLink>
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────── */

export default function BestFilterTapGuide() {
  const tapProducts = getProductsByCategory("filter_tap");
  const mountedProducts = getProductsByCategory("countertop");
  const sofia = tapProducts.find((p) => p.id === "osmio-sofia-triflow")!;
  const ecopro = mountedProducts.find((p) => p.id === "tapp-water-ecopro")!;
  const fc06 = mountedProducts.find((p) => p.id === "waterdrop-fc06")!;
  const allProducts = [sofia, ecopro, fc06];

  const comparisonContaminants = [
    "Chlorine",
    "Lead",
    "Microplastics",
    "PFAS (total)",
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* ── Schema markup ────────────────────────────────────────────── */}
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Guides", url: "https://www.tapwater.uk/guides" },
          {
            name: "Best Water Filter Taps UK",
            url: "https://www.tapwater.uk/guides/best-water-filter-tap-uk",
          },
        ]}
      />
      <ArticleSchema
        headline={`Best Water Filter Taps UK ${year}`}
        description="3-way triflow taps and tap-mounted water filters compared on what they remove and what they really cost to run, matched to UK water quality data."
        url="https://www.tapwater.uk/guides/best-water-filter-tap-uk"
        datePublished="2026-08-20"
        dateModified={new Date().toISOString().split("T")[0]}
        authorName="TapWater.uk Research"
        authorUrl="https://www.tapwater.uk/about"
      />
      <FAQSchema faqs={FAQ_DATA} />

      <div className="max-w-3xl mx-auto">
        {/* ── Breadcrumb nav ───────────────────────────────────────── */}
        <nav className="text-sm text-muted mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-accent transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href="/guides"
                className="hover:text-accent transition-colors"
              >
                Guides
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-ink" aria-current="page">
              Best Water Filter Taps UK
            </li>
          </ol>
        </nav>

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          Best Water Filter Taps UK {year}
        </h1>
        <div className="flex items-center gap-2 mt-3 mb-8 text-sm text-muted">
          <span>
            By <span className="text-ink font-medium">TapWater.uk Research</span>
          </span>
          <span>&middot;</span>
          <span>Published August {year}</span>
        </div>

        <div className="prose-section">
          <p className="text-lg text-body leading-relaxed">
            &ldquo;Water filter tap&rdquo; covers two very different products,
            and shops happily blur them. A tap-mounted filter screws onto your
            existing spout and does the filtering itself. A 3-way filter tap
            (or triflow tap) is a full mixer with a third waterway for filtered
            water, and it filters nothing: it is the delivery end for an
            under-sink system.
          </p>
          <p className="text-base text-body leading-relaxed mt-4">
            This guide compares both honestly: the two tap-mounted filters we
            rate for a no-plumbing start, and the 3-way tap we recommend when
            an under-sink filter deserves a proper spout.
          </p>
        </div>

        {/* ── Affiliate disclosure ─────────────────────────────────── */}
        <div className="bg-wash border border-rule rounded-xl p-4 mt-6 mb-8 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <p className="text-sm text-body">
            This guide contains affiliate links. If you buy through these links,
            we earn a small commission at no extra cost to you. This funds our
            independent water quality research. Our recommendations are based on
            real contaminant data, not sponsorship.{" "}
            <Link
              href="/affiliate-disclosure"
              className="text-accent hover:underline"
            >
              Full disclosure
            </Link>
          </p>
        </div>

        {/* ── Quick picks ──────────────────────────────────────────── */}
        <div className="card-elevated rounded-2xl p-6 lg:p-8 mb-12">
          <h2 className="font-display text-xl italic text-ink mb-4">
            Quick picks
          </h2>
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-rule">
              <div>
                <p className="text-xs text-accent font-medium uppercase tracking-wider">Best tap-mounted filter</p>
                <p className="font-display text-base italic text-ink mt-0.5">
                  {ecopro.brand} {ecopro.model}
                </p>
                <p className="text-sm text-muted mt-0.5">
                  Fits in minutes, total PFAS reduction claim, recyclable
                  cartridges
                </p>
              </div>
              <span className="font-data text-lg font-bold text-ink shrink-0">
                &pound;{ecopro.priceGbp}
              </span>
            </div>
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-rule">
              <div>
                <p className="text-xs text-accent font-medium uppercase tracking-wider">Budget tap-mounted</p>
                <p className="font-display text-base italic text-ink mt-0.5">
                  {fc06.brand} {fc06.model}
                </p>
                <p className="text-sm text-muted mt-0.5">
                  Chlorine, lead, and fluoride reduction for £30
                </p>
              </div>
              <span className="font-data text-lg font-bold text-ink shrink-0">
                &pound;{fc06.priceGbp}
              </span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-accent font-medium uppercase tracking-wider">Best 3-way filter tap</p>
                <p className="font-display text-base italic text-ink mt-0.5">
                  {sofia.brand} {sofia.model}
                </p>
                <p className="text-sm text-muted mt-0.5">
                  Hot, cold, and filtered from one spout; pair with an
                  under-sink filter
                </p>
              </div>
              <span className="font-data text-lg font-bold text-ink shrink-0">
                &pound;{sofia.priceGbp}
              </span>
            </div>
          </div>
        </div>

        {/* ── Which type do you need? ──────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-12 mb-4">
          Which type of filter tap do you need?
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-ink text-lg mb-2">
              Tap-mounted filter: the no-plumbing start
            </h3>
            <p className="text-base text-body leading-relaxed">
              Screws onto a standard round spout in minutes, no tools, no
              plumber, and moves out with you, which makes it the renter&apos;s
              option. The cartridge does real work on chlorine and lead, but it
              is small, so expect to replace it every few months and accept a
              slower filtered-water flow than the open tap.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-ink text-lg mb-2">
              3-way filter tap: the finished under-sink setup
            </h3>
            <p className="text-base text-body leading-relaxed">
              A triflow tap replaces your kitchen mixer and adds a third,
              separate waterway fed by whatever filter lives in the cupboard
              below. The tap removes nothing by itself, so it only makes sense
              together with an{" "}
              <Link href="/guides/best-under-sink-water-filter-uk" className="text-accent hover:underline">
                under sink water filter
              </Link>{" "}
              or a{" "}
              <Link href="/guides/best-reverse-osmosis-system-uk" className="text-accent hover:underline">
                reverse osmosis system
              </Link>
              . What it buys you is one clean spout instead of a second drilled
              hole in the worktop.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-ink text-lg mb-2">
              Neither fixes hardness
            </h3>
            <p className="text-base text-body leading-relaxed">
              No filter tap reduces limescale. If scale is the problem you are
              trying to solve, check your{" "}
              <Link href="/hardness" className="text-accent hover:underline">
                water hardness by postcode
              </Link>{" "}
              first; hard water areas need a softener, not a tap filter.
            </p>
          </div>
        </div>

        <div className="mt-8 card-elevated p-8 text-center rounded-2xl">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <Search className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="font-display text-xl italic text-ink">
            First, check what is in your water
          </h3>
          <p className="text-base text-muted mt-2 max-w-md mx-auto">
            Enter your postcode to see the contaminants measured in your area,
            so you pick the filter your water actually needs.
          </p>
          <div className="mt-6 max-w-sm mx-auto">
            <PostcodeSearch />
          </div>
        </div>

        {/* ── Product reviews ──────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          The filter taps we rate
        </h2>

        {/* Product cards at a glance */}
        <div className="space-y-4 mb-8">
          {allProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              highlight={
                product.id === "tapp-water-ecopro"
                  ? "Best tap-mounted — PFAS reduction claim"
                  : product.id === "waterdrop-fc06"
                    ? "Budget tap-mounted — £30 entry"
                    : "Best 3-way tap — pair with an under-sink filter"
              }
            />
          ))}
        </div>

        {/* Detailed reviews */}
        <div className="space-y-8">
          <ProductReview
            product={ecopro}
            heading="TAPP Water EcoPro — Best tap-mounted filter"
            verdict="The most capable filter that fits without opening a single cupboard."
            review="The EcoPro is the tap-mounted filter we point people to first. It clips onto a standard spout in a couple of minutes and its carbon block covers the everyday list, chlorine, lead, and microplastics, with a total PFAS reduction claim published by TAPP on top. The cartridges are recyclable through TAPP's return scheme, which answers the usual objection to disposable tap filters. Honest limits: the PFAS figure is the manufacturer's own testing rather than an NSF verification, the filtered flow is noticeably slower than the open tap, and it will not fit pull-out sprayers or most designer taps, so check your spout before ordering."
            pros={ecopro.pros}
            cons={ecopro.cons}
            ctaLabel="View on Amazon"
          />

          <ProductReview
            product={fc06}
            heading="Waterdrop WD-FC-06 — Budget tap-mounted"
            verdict="The cheapest credible way to filter at the tap."
            review="At £30 the WD-FC-06 exists for one job: make the water from your existing tap taste better without any commitment. The carbon cartridge reduces chlorine, lead, and fluoride, which is an unusual claim at this price, and swapping cartridges takes seconds. The trade-offs are what you would expect at the entry point: shorter cartridge life than the EcoPro, no PFAS claim at all, and the same standard-spout limitation every tap-mounted filter shares. If it fits your tap and your budget, it is a fine first step; if you find yourself refilling glasses all day, that is the sign to move under the sink."
            pros={fc06.pros}
            cons={fc06.cons}
            ctaLabel="View on Amazon"
          />

          <ProductReview
            product={sofia}
            heading="Osmio Sofia Long Reach Triflow — Best 3-way tap"
            verdict="The clean way to finish an under-sink filter installation."
            review="The Sofia is a full kitchen mixer with a third, separate waterway for filtered water, in a brushed finish that does not announce itself as water-treatment kit. Be clear about what you are buying: the tap itself filters nothing, which is exactly why it appears here with an empty removals list. Its job is to give the filter under your sink a proper spout, so you get hot, cold, and filtered from one fitting instead of drilling the worktop for a separate mini tap. Build quality is solid, the long-reach spout suits double sinks, and the filtered waterway keeps treated water out of the brass mixer body. Budget for the filter itself separately, and for an hour or two of fitting if you have not swapped a kitchen tap before."
            pros={sofia.pros}
            cons={sofia.cons}
            ctaLabel="View on Osmio"
          />
        </div>

        {/* ── Comparison table ─────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Side-by-side comparison
        </h2>
        <p className="text-base text-muted mb-6">
          The two tap-mounted filters do the filtering themselves; the Sofia
          delivers whatever the filter beneath it removes, so its own row is
          honestly empty.
        </p>
        <div className="card p-4 lg:p-6">
          <ProductComparisonTable
            pageType="best-filter-tap-guide"
            campaign="best-filter-tap-guide"
            products={allProducts}
            contaminants={comparisonContaminants}
          />
        </div>

        <RunningCostComparison
          products={allProducts}
          pageType="best-filter-tap-guide"
          campaign="best-filter-tap-guide"
        />

        {/* ── Pair the Sofia ───────────────────────────────────────── */}
        <div className="card p-6 mt-10 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-ink text-base">
              Buying the Sofia? Pick its filter first
            </h3>
            <p className="text-sm text-body leading-relaxed mt-1">
              A 3-way tap is only as good as the filter feeding it. For
              certified carbon and ceramic options see our{" "}
              <Link href="/guides/best-under-sink-water-filter-uk" className="text-accent hover:underline">
                under sink water filter guide
              </Link>
              ; for PFAS and fluoride removal, an{" "}
              <Link href="/guides/best-reverse-osmosis-system-uk" className="text-accent hover:underline">
                under-sink reverse osmosis system
              </Link>{" "}
              is the route.
            </p>
          </div>
        </div>

        {/* ── Verdict ──────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Our verdict
        </h2>
        <div className="prose-section">
          <p className="text-base text-body leading-relaxed">
            Renting, or just testing the water? The{" "}
            <strong className="text-ink">TAPP Water EcoPro</strong> is the
            tap-mounted filter to get, with the{" "}
            <strong className="text-ink">Waterdrop WD-FC-06</strong> as the £30
            fallback when budget decides.
          </p>
          <p className="text-base text-body leading-relaxed mt-4">
            Committed to filtered water every day? Put the money under the sink
            and finish the job with the{" "}
            <strong className="text-ink">Osmio Sofia triflow tap</strong>: one
            spout, three waterways, no second hole in the worktop.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <AffiliateLink
            href={ecopro.affiliateUrl}
            pageType="best-filter-tap-guide"
            recommendationReason="verdict"
            productCategory={ecopro.category}
            productSlug={ecopro.slug}
            placement="guide-verdict"
            campaign="best-filter-tap-guide"
            className="inline-flex items-center justify-center gap-2 bg-btn text-white rounded-lg px-6 py-3 text-sm font-medium hover:bg-btn-hover transition-colors"
          >
            Get the TAPP Water EcoPro
            <ArrowRight className="w-4 h-4" />
          </AffiliateLink>
          <AffiliateLink
            href={sofia.affiliateUrl}
            pageType="best-filter-tap-guide"
            recommendationReason="verdict"
            productCategory={sofia.category}
            productSlug={sofia.slug}
            placement="guide-verdict"
            campaign="best-filter-tap-guide"
            className="inline-flex items-center justify-center gap-2 border border-rule text-ink rounded-lg px-6 py-3 text-sm font-medium hover:bg-wash transition-colors"
          >
            View the Osmio Sofia triflow
            <ArrowRight className="w-4 h-4" />
          </AffiliateLink>
        </div>

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-6">
          Frequently asked questions
        </h2>
        <div className="space-y-6">
          {FAQ_DATA.map((faq) => (
            <div key={faq.question}>
              <h3 className="font-semibold text-ink text-base">{faq.question}</h3>
              <p className="text-sm text-body leading-relaxed mt-2">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>

        {/* ── Related links ────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Related reading
        </h2>
        <div className="space-y-2">
          <Link
            href="/guides/best-under-sink-water-filter-uk"
            className="flex items-center gap-2 text-sm text-accent hover:underline"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            Best under sink water filter UK
          </Link>
          <Link
            href="/filters/filter-taps"
            className="flex items-center gap-2 text-sm text-accent hover:underline"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            All filter taps we review
          </Link>
          <Link
            href="/guides/best-reverse-osmosis-system-uk"
            className="flex items-center gap-2 text-sm text-accent hover:underline"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            Best reverse osmosis system UK
          </Link>
          <Link
            href="/guides/best-water-filters-uk"
            className="flex items-center gap-2 text-sm text-accent hover:underline"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            Best water filters UK (all categories)
          </Link>
        </div>

        {/* ── Affiliate disclosure footer ──────────────────────────── */}
        <footer className="mt-12 pb-4 text-sm text-faint leading-relaxed border-t border-rule pt-6">
          <p>
            Product recommendations last reviewed August {year}. Prices are
            approximate and may vary. Water quality data sourced from the
            Environment Agency and water company compliance reports covering
            2,800 UK postcode districts. We earn a commission from purchases
            made through affiliate links at no extra cost to you.{" "}
            <Link
              href="/affiliate-disclosure"
              className="underline underline-offset-2 hover:text-muted transition-colors"
            >
              Affiliate disclosure
            </Link>{" "}
            &middot;{" "}
            <Link
              href="/about/methodology"
              className="underline underline-offset-2 hover:text-muted transition-colors"
            >
              Our methodology
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
