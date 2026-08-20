import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Star, ShieldCheck, Search, Droplets } from "lucide-react";
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
    question: "Can I install an under sink water filter myself?",
    answer:
      "Usually, yes. Most under sink water filters connect to the cold line with push-fit connectors and include a separate tap or an adapter for your existing one. The Waterdrop 10UA is designed for DIY fitting in around half an hour with no special tools. If your kitchen has non-standard plumbing or you want a dedicated filter tap drilled into the worktop, budget for an hour of a plumber's time. This is a far smaller job than a whole-house system, which always needs professional installation.",
  },
  {
    question: "Is an under sink filter better than a filter jug?",
    answer:
      "For most households that filter water every day, yes. An undersink water filter treats water on demand at mains pressure, so there is no waiting and no jug hogging fridge space, and the per-litre cost works out lower over a year of heavy use. Certified under sink units also tend to remove more than basic jugs. A jug still makes sense if you rent, move often, or want to spend less than £30 up front.",
  },
  {
    question: "Do under sink water filters remove PFAS or limescale?",
    answer:
      "It depends on the technology. Standard carbon and ceramic cartridges do not meaningfully reduce PFAS: of the two filters in this guide, the Waterdrop 10UA carries a total PFAS reduction claim while the Doulton Ultracarb does not, and neither reduces water hardness, so limescale stays. For verified PFAS and fluoride removal the reliable route is an under-sink reverse osmosis system, and for limescale the answer is a water softener, not a drinking-water filter.",
  },
  {
    question: "How often do under sink filter cartridges need replacing?",
    answer:
      "Check the rated capacity rather than the marketing headline. The Waterdrop 10UA is rated for roughly 11,000 gallons or twelve months, whichever comes first, which is why its running cost stays low. The Doulton Ultracarb ceramic element is a six-month cartridge, though the ceramic shell can be scrubbed clean several times within that window to restore flow. Hard water areas clog cartridges faster, so expect the shorter end of any range if your postcode reads hard.",
  },
];

export function generateMetadata(): Metadata {
  return {
    title: `Best Under Sink Water Filter UK ${year}`,
    description:
      "Under sink water filters compared on certifications, what they actually remove, and true running costs, matched to real UK water quality data.",
    alternates: {
      canonical: "https://www.tapwater.uk/guides/best-under-sink-water-filter-uk",
    },
    openGraph: {
      images: OG_IMAGE,
      title: `Best Under Sink Water Filter UK (${year})`,
      description:
        "Under sink water filters compared on certifications, removal claims, and true running costs.",
      url: "https://www.tapwater.uk/guides/best-under-sink-water-filter-uk",
      type: "article",
    },
    twitter: {
      images: OG_IMAGE,
      card: "summary_large_image",
      title: `Best Under Sink Water Filter UK (${year})`,
      description:
        "Under sink water filters compared on certifications and true running costs.",
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
          pageType="best-under-sink-guide"
          recommendationReason={heading}
          productCategory={product.category}
          productSlug={product.slug}
          placement="guide-review"
          campaign="best-under-sink-guide"
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

export default function BestUnderSinkFilterGuide() {
  const underSinkProducts = getProductsByCategory("under_sink");
  const waterdrop = underSinkProducts.find((p) => p.id === "waterdrop-10ua")!;
  const doulton = underSinkProducts.find(
    (p) => p.id === "doulton-hip-ultracarb"
  )!;

  const comparisonContaminants = [
    "Chlorine",
    "Lead",
    "Bacteria",
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
            name: "Best Under Sink Water Filter UK",
            url: "https://www.tapwater.uk/guides/best-under-sink-water-filter-uk",
          },
        ]}
      />
      <ArticleSchema
        headline={`Best Under Sink Water Filter UK ${year}`}
        description="Under sink water filters compared on certifications, removal claims, and true running costs, matched to real UK water quality data from 2,800 postcodes."
        url="https://www.tapwater.uk/guides/best-under-sink-water-filter-uk"
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
              Best Under Sink Water Filter UK
            </li>
          </ol>
        </nav>

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          Best Under Sink Water Filter UK {year}
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
            An under sink water filter treats your kitchen drinking water on
            demand, at mains pressure, from a unit hidden in the cupboard. No
            jug to refill, no counter space lost, and certified removal claims
            that basic jugs rarely match.
          </p>
          <p className="text-base text-body leading-relaxed mt-4">
            We compared the under sink water filters most readily available in
            the UK on their certifications, what they are actually rated to
            remove, and what a year of cartridges really costs. Both picks fit
            a standard UK kitchen cupboard, and one of them is a genuine DIY
            install.
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
                <p className="text-xs text-accent font-medium uppercase tracking-wider">Top pick</p>
                <p className="font-display text-base italic text-ink mt-0.5">
                  {doulton.brand} {doulton.model}
                </p>
                <p className="text-sm text-muted mt-0.5">
                  British ceramic filtration, NSF 42 and 53 certified, removes
                  bacteria and lead
                </p>
              </div>
              <span className="font-data text-lg font-bold text-ink shrink-0">
                &pound;{doulton.priceGbp}
              </span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-accent font-medium uppercase tracking-wider">Budget pick</p>
                <p className="font-display text-base italic text-ink mt-0.5">
                  {waterdrop.brand} {waterdrop.model}
                </p>
                <p className="text-sm text-muted mt-0.5">
                  Year-long cartridge, DIY install, total PFAS reduction claim
                </p>
              </div>
              <span className="font-data text-lg font-bold text-ink shrink-0">
                &pound;{waterdrop.priceGbp}
              </span>
            </div>
          </div>
        </div>

        {/* ── What to look for ─────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-12 mb-4">
          What to look for in an under sink water filter
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-ink text-lg mb-2">
              Carbon, ceramic, or reverse osmosis
            </h3>
            <p className="text-base text-body leading-relaxed">
              Carbon block cartridges (like the Waterdrop 10UA) target chlorine,
              taste, and lead at a low running cost. Ceramic elements (like the
              Doulton Ultracarb) add bacteria and microplastics removal, and the
              shell can be cleaned to extend its life. Neither touches fluoride,
              and hardness passes straight through both. If your priority is
              PFAS or fluoride, skip both and go straight to an under-sink
              reverse osmosis system: our{" "}
              <Link href="/guides/best-reverse-osmosis-system-uk" className="text-accent hover:underline">
                reverse osmosis guide
              </Link>{" "}
              covers the two we rate.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-ink text-lg mb-2">
              Certified claims, not marketing claims
            </h3>
            <p className="text-base text-body leading-relaxed">
              NSF/ANSI 42 covers taste and chlorine; NSF/ANSI 53 covers health
              contaminants like lead and cysts. A filter listing both, as the
              Doulton does, has had its removal claims independently verified.
              Treat any water filter under sink unit without certifications as
              an unverified claim, whatever the listing promises.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-ink text-lg mb-2">
              Cartridge capacity and real annual cost
            </h3>
            <p className="text-base text-body leading-relaxed">
              The sticker price misleads: a cheap unit with a three-month
              cartridge costs more by year two than a dearer unit with a
              twelve-month cartridge. The running cost comparison further down
              this page does that arithmetic for both picks.
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
            Enter your postcode to see the contaminants and hardness measured in
            your area, so you buy the filter your water actually needs.
          </p>
          <div className="mt-6 max-w-sm mx-auto">
            <PostcodeSearch />
          </div>
        </div>

        {/* ── Product reviews ──────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          The best under sink water filters for UK kitchens
        </h2>

        {/* Product cards at a glance */}
        <div className="space-y-4 mb-8">
          {underSinkProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              highlight={
                product.id === "doulton-hip-ultracarb"
                  ? "Top pick — certified bacteria and lead removal"
                  : "Budget pick — lowest running cost"
              }
            />
          ))}
        </div>

        {/* Detailed reviews */}
        <div className="space-y-8">
          <ProductReview
            product={doulton}
            heading="Doulton HIP Ultracarb — Top pick"
            verdict="Certified British ceramic filtration for families who want bacteria and lead handled."
            review="Doulton has made ceramic water filters in Staffordshire for longer than the NSF has existed, and the Ultracarb is the configuration we rate for UK kitchens. The ceramic shell physically blocks bacteria and microplastics while the carbon core inside it handles chlorine and lead, and the combination carries both NSF/ANSI 42 and 53 certification, so those claims are independently verified rather than promised. The shell can be taken out and scrubbed several times across its six-month life to restore flow, which no carbon-only cartridge offers. The honest limits: it does not reduce PFAS or fluoride, the 2 litres per minute flow suits filling glasses and kettles rather than pans in a hurry, and at roughly £80 a year in cartridges it costs more to run than the Waterdrop."
            pros={doulton.pros}
            cons={doulton.cons}
            ctaLabel="View on Amazon"
          />

          <ProductReview
            product={waterdrop}
            heading="Waterdrop 10UA — Budget pick"
            verdict="The cheapest credible way to filter every glass from the cold tap."
            review="The 10UA is the under sink filter for people who want the jug routine gone without spending three figures. It connects to the existing cold line with push-fit connectors, no separate tap needed, and the install is genuinely a half-hour DIY job. The cartridge is rated for around 11,000 gallons or a year of typical use, which makes its running cost the lowest here, and alongside the NSF/ANSI 42 chlorine certification Waterdrop publishes a total PFAS reduction claim for this cartridge. The honest limits: that PFAS claim is the manufacturer's own rather than an NSF 53 verification, bacteria are not on the menu at all, and hard water areas will shorten the cartridge's real-world life."
            pros={waterdrop.pros}
            cons={waterdrop.cons}
            ctaLabel="View at Waterdrop"
          />
        </div>

        {/* ── Comparison table ─────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Side-by-side comparison
        </h2>
        <p className="text-base text-muted mb-6">
          Both handle chlorine and lead. The differences are bacteria,
          PFAS, and what a year of cartridges costs.
        </p>
        <div className="card p-4 lg:p-6">
          <ProductComparisonTable
            pageType="best-under-sink-guide"
            campaign="best-under-sink-guide"
            products={underSinkProducts}
            contaminants={comparisonContaminants}
          />
        </div>

        <RunningCostComparison
          products={underSinkProducts}
          pageType="best-under-sink-guide"
          campaign="best-under-sink-guide"
        />

        {/* ── Need more than these remove? ─────────────────────────── */}
        <div className="card p-6 mt-10 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Droplets className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-ink text-base">
              Need PFAS, fluoride, or hardness handled?
            </h3>
            <p className="text-sm text-body leading-relaxed mt-1">
              Carbon and ceramic filters have hard limits. An under-sink
              reverse osmosis system removes PFAS, fluoride, and dissolved
              minerals with certified performance; see our{" "}
              <Link href="/guides/best-reverse-osmosis-system-uk" className="text-accent hover:underline">
                best reverse osmosis system UK guide
              </Link>
              . For limescale itself, the fix is a{" "}
              <Link href="/guides/best-water-softener-uk" className="text-accent hover:underline">
                water softener
              </Link>
              , not a drinking-water filter.
            </p>
          </div>
        </div>

        {/* ── Verdict ──────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Our verdict
        </h2>
        <div className="prose-section">
          <p className="text-base text-body leading-relaxed">
            The <strong className="text-ink">Doulton HIP Ultracarb</strong> is
            the under sink filter we recommend for most UK households. Dual NSF
            certification, bacteria and microplastics removal that carbon-only
            units cannot offer, and a cleanable ceramic element from a British
            maker with real heritage.
          </p>
          <p className="text-base text-body leading-relaxed mt-4">
            If the budget stops at double digits, the{" "}
            <strong className="text-ink">Waterdrop 10UA</strong> is the smart
            entry point: a year-long cartridge, DIY installation, and the lowest
            running cost of anything we have compared in this category.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <AffiliateLink
            href={doulton.affiliateUrl}
            pageType="best-under-sink-guide"
            recommendationReason="verdict"
            productCategory={doulton.category}
            productSlug={doulton.slug}
            placement="guide-verdict"
            campaign="best-under-sink-guide"
            className="inline-flex items-center justify-center gap-2 bg-btn text-white rounded-lg px-6 py-3 text-sm font-medium hover:bg-btn-hover transition-colors"
          >
            Get the Doulton HIP Ultracarb
            <ArrowRight className="w-4 h-4" />
          </AffiliateLink>
          <AffiliateLink
            href={waterdrop.affiliateUrl}
            pageType="best-under-sink-guide"
            recommendationReason="verdict"
            productCategory={waterdrop.category}
            productSlug={waterdrop.slug}
            placement="guide-verdict"
            campaign="best-under-sink-guide"
            className="inline-flex items-center justify-center gap-2 border border-rule text-ink rounded-lg px-6 py-3 text-sm font-medium hover:bg-wash transition-colors"
          >
            Try the Waterdrop 10UA (budget pick)
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
            href="/guides/best-reverse-osmosis-system-uk"
            className="flex items-center gap-2 text-sm text-accent hover:underline"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            Best reverse osmosis system UK
          </Link>
          <Link
            href="/filters/under-sink-filters"
            className="flex items-center gap-2 text-sm text-accent hover:underline"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            All under sink filters we review
          </Link>
          <Link
            href="/guides/best-water-filter-jug-uk"
            className="flex items-center gap-2 text-sm text-accent hover:underline"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            Best water filter jug UK
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
