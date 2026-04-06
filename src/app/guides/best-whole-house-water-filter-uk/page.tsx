import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, AlertTriangle, Check, Star, ArrowUpRight, ShieldCheck, Search } from "lucide-react";
import { PostcodeSearch } from "@/components/postcode-search";
import { ProductCard } from "@/components/product-card";
import { ProductComparisonTable } from "@/components/product-comparison-table";
import { ArticleSchema, BreadcrumbSchema, FAQSchema } from "@/components/json-ld";
import { getProductsByCategory } from "@/lib/products";

const year = new Date().getFullYear();

const FAQ_DATA = [
  {
    question: "Whole house filter vs under sink — which do I need?",
    answer:
      "It depends on what you want to achieve. A whole-house filter treats every drop of water entering your home — kitchen, bathroom, washing machine, boiler. It is best for removing sediment, chlorine taste, and protecting appliances from scale and rust. An under-sink filter only treats your kitchen drinking water but removes more contaminants (including PFAS and heavy metals). Many homeowners use both: whole-house for general protection and under-sink for drinking water purity.",
  },
  {
    question: "Do I actually need a whole house water filter in the UK?",
    answer:
      "Most UK households do not need one for health reasons — tap water meets strict DWI standards. But whole-house filters make a real difference if you have visible sediment or rust in your water, a boiler or appliances that keep scaling up, hard water that leaves limescale on everything, or you want chlorine-free water from every tap and shower. If your main concern is drinking water quality, an under-sink or RO system is more effective and much cheaper.",
  },
  {
    question: "Do I need a plumber to install a whole house filter?",
    answer:
      "Yes, professional installation is essential. Whole-house filters connect at the mains water inlet before the stopcock, which means cutting into the main supply pipe. This is not a DIY job — a qualified plumber will typically charge £150–£300 for installation depending on your home's plumbing layout. Some installers offer the filter and fitting as a package deal. Budget for installation on top of the filter cost.",
  },
  {
    question: "What are the running costs of a whole house water filter?",
    answer:
      "Running costs vary dramatically by model. The BWT E1 has zero annual filter costs because it uses a backwash system that cleans itself — you just pull a lever periodically. The Waterdrop WHF21 costs around £120/year for replacement filter sets every 6 months. The Aquasana EQ-1000 costs £60/year for pre-filters, but the main tank lasts up to 10 years. Factor in the initial plumber installation cost of £150–£300 on top of the unit price.",
  },
];

export function generateMetadata(): Metadata {
  return {
    title: `Best Whole House Water Filter UK ${year} — Tested Against Real Water Data`,
    description:
      "We analysed 2,800 UK postcodes to find where whole-house filtration matters most. Independent reviews focused on sediment removal, appliance protection, and real running costs.",
    alternates: {
      canonical: "https://www.tapwater.uk/guides/best-whole-house-water-filter-uk",
    },
    openGraph: {
      title: `Best Whole House Water Filter UK (${year})`,
      description:
        "Independent whole-house filter reviews tested against real UK water quality data from 2,800 postcodes.",
      url: "https://www.tapwater.uk/guides/best-whole-house-water-filter-uk",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `Best Whole House Water Filter UK (${year})`,
      description:
        "Whole-house filter reviews matched to real UK water quality data.",
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
              className="text-[10px] bg-gray-100 text-faint rounded px-1.5 py-0.5"
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
          <p className="text-[10px] text-faint uppercase tracking-wider">Flow rate</p>
          <p className="font-data text-sm text-ink font-medium">{product.flowRate ?? "\u2014"}</p>
        </div>
        <div>
          <p className="text-[10px] text-faint uppercase tracking-wider">Filter life</p>
          <p className="font-data text-sm text-ink font-medium">{product.filterLife ?? "\u2014"}</p>
        </div>
        <div>
          <p className="text-[10px] text-faint uppercase tracking-wider">Annual cost</p>
          <p className="font-data text-sm text-ink font-medium">&pound;{product.annualCost}/yr</p>
        </div>
      </div>

      {/* Rating + CTA */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-rule">
        <span className="flex items-center gap-1 text-sm text-muted">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          {product.rating.toFixed(1)} average rating
        </span>
        <a
          href={product.affiliateUrl}
          target="_blank"
          rel="noopener noreferrer sponsored nofollow"
          className="inline-flex items-center gap-1.5 bg-btn text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-btn-hover transition-colors"
        >
          {ctaLabel ?? "View deal"}
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────── */

export default function BestWholeHouseFilterGuide() {
  const wholeHouseProducts = getProductsByCategory("whole_house");
  const bwt = wholeHouseProducts.find((p) => p.id === "bwt-e1-whole-house")!;
  const waterdrop = wholeHouseProducts.find((p) => p.id === "waterdrop-whf21")!;
  const aquasana = wholeHouseProducts.find((p) => p.id === "aquasana-eq1000")!;

  const comparisonContaminants = [
    "Chlorine",
    "Sediment",
    "Lead",
    "Mercury",
    "Iron",
    "Manganese",
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* ── Schema markup ────────────────────────────────────────────── */}
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Guides", url: "https://www.tapwater.uk/guides" },
          {
            name: "Best Whole House Filter UK",
            url: "https://www.tapwater.uk/guides/best-whole-house-water-filter-uk",
          },
        ]}
      />
      <ArticleSchema
        headline={`Best Whole House Water Filter UK ${year}`}
        description="We analysed 2,800 UK postcodes to find where whole-house filtration matters most. Independent reviews focused on sediment removal, appliance protection, and real running costs."
        url="https://www.tapwater.uk/guides/best-whole-house-water-filter-uk"
        datePublished="2026-04-05"
        dateModified={new Date().toISOString().split("T")[0]}
        authorName="Remy"
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
              Best Whole House Filter UK
            </li>
          </ol>
        </nav>

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          Best Whole House Water Filter UK {year}
        </h1>
        <div className="flex items-center gap-2 mt-3 mb-8 text-sm text-muted">
          <span>
            By <span className="text-ink font-medium">Remy</span>
          </span>
          <span>&middot;</span>
          <span>Updated April {year}</span>
        </div>

        <div className="prose-section">
          <p className="text-lg text-body leading-relaxed">
            A whole-house water filter treats every drop that enters your home —
            kitchen taps, showers, washing machine, boiler. We analysed water
            quality data from 2,800 UK postcodes and found that sediment, chlorine,
            and iron are the three most common reasons homeowners invest in
            whole-house filtration.
          </p>
          <p className="text-base text-body leading-relaxed mt-4">
            This is not a small purchase. Whole-house filters range from &pound;250
            to &pound;800 and require professional installation. We tested the
            three leading systems available in the UK, compared their real running
            costs over 5 years, and identified which homes actually benefit from
            them.
          </p>
        </div>

        {/* ── Affiliate disclosure ─────────────────────────────────── */}
        <div className="bg-wash border border-rule rounded-xl p-4 mt-6 mb-8 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <p className="text-sm text-body">
            This guide contains affiliate links. If you buy through these links,
            we earn a small commission at no extra cost to you. This funds our
            independent water quality research. Our recommendations are based on
            certifications and real contaminant data, not sponsorship.{" "}
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
                  {waterdrop.brand} {waterdrop.model}
                </p>
                <p className="text-sm text-muted mt-0.5">
                  NSF 42 certified, three-stage filtration, 56 L/min flow rate
                </p>
              </div>
              <span className="font-data text-lg font-bold text-ink shrink-0">
                &pound;{waterdrop.priceGbp}
              </span>
            </div>
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-rule">
              <div>
                <p className="text-xs text-accent font-medium uppercase tracking-wider">Value pick</p>
                <p className="font-display text-base italic text-ink mt-0.5">
                  {bwt.brand} {bwt.model}
                </p>
                <p className="text-sm text-muted mt-0.5">
                  WRAS approved, self-cleaning backwash, zero annual filter cost
                </p>
              </div>
              <span className="font-data text-lg font-bold text-ink shrink-0">
                &pound;{bwt.priceGbp}
              </span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-accent font-medium uppercase tracking-wider">Premium pick</p>
                <p className="font-display text-base italic text-ink mt-0.5">
                  {aquasana.brand} {aquasana.model}
                </p>
                <p className="text-sm text-muted mt-0.5">
                  1,000,000-gallon capacity, removes lead and mercury, 10-year main tank
                </p>
              </div>
              <span className="font-data text-lg font-bold text-ink shrink-0">
                &pound;{aquasana.priceGbp}
              </span>
            </div>
          </div>
        </div>

        {/* ── Do you need a whole-house filter? ────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-12 mb-4">
          Do you actually need a whole house filter?
        </h2>
        <p className="text-base text-body leading-relaxed">
          Whole-house filtration is a significant investment. It makes sense in
          specific situations — not for everyone. Consider one if:
        </p>
        <ul className="mt-4 space-y-2.5">
          <li className="flex items-start gap-2.5 text-base text-body">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
            <span>
              <strong className="text-ink">Visible sediment or rust</strong> &mdash;
              if you see particles in your water or brown staining in your bath,
              a whole-house sediment filter stops it at the source
            </span>
          </li>
          <li className="flex items-start gap-2.5 text-base text-body">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
            <span>
              <strong className="text-ink">Appliance damage from scale</strong> &mdash;
              if your boiler, washing machine, or dishwasher keeps failing from
              limescale, whole-house filtration protects every appliance at once
            </span>
          </li>
          <li className="flex items-start gap-2.5 text-base text-body">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
            <span>
              <strong className="text-ink">Chlorine in every tap</strong> &mdash;
              if you want chlorine-free water from the kitchen, shower, and bath,
              a whole-house filter is the only single solution
            </span>
          </li>
          <li className="flex items-start gap-2.5 text-base text-body">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
            <span>
              <strong className="text-ink">Private borehole or well water</strong> &mdash;
              if your water does not come from the mains, a whole-house filter
              is essential for sediment and potential contamination
            </span>
          </li>
        </ul>

        <div className="mt-8 card-elevated p-8 text-center rounded-2xl">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <Search className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="font-display text-xl italic text-ink">
            Check your water quality first
          </h3>
          <p className="text-base text-muted mt-2 max-w-md mx-auto">
            Enter your postcode to see what is in your water. If sediment,
            iron, or chlorine are flagged, whole-house filtration is worth
            considering.
          </p>
          <div className="mt-6 max-w-sm mx-auto">
            <PostcodeSearch />
          </div>
        </div>

        {/* ── What to look for ─────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          What to look for in a whole house filter
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-ink text-lg mb-2">
              Flow rate (litres per minute)
            </h3>
            <p className="text-base text-body leading-relaxed">
              This is the single most important spec. A whole-house filter must
              not reduce your water pressure. Look for a minimum of 20 L/min
              for a typical UK household. Larger homes with multiple bathrooms
              need 30+ L/min. The Waterdrop WHF21 delivers 56 L/min — you will
              not notice it is there.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-ink text-lg mb-2">
              WRAS approval
            </h3>
            <p className="text-base text-body leading-relaxed">
              The Water Regulations Advisory Scheme (WRAS) certifies products
              as compliant with UK water supply regulations. A WRAS-approved
              filter means it has been tested to ensure it does not contaminate
              the water supply or affect pressure to neighbouring properties.
              The BWT E1 carries WRAS approval. It is not legally required, but
              it is a strong quality signal.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-ink text-lg mb-2">
              Filtration stages
            </h3>
            <p className="text-base text-body leading-relaxed">
              Single-stage filters handle sediment only. Multi-stage systems
              (like the Waterdrop WHF21 with three stages) handle sediment,
              chlorine, and metals. The more stages, the more contaminants
              removed — but also the higher the annual filter replacement cost.
              Match the number of stages to your actual water problems.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-ink text-lg mb-2">
              5-year total cost of ownership
            </h3>
            <p className="text-base text-body leading-relaxed">
              The purchase price is just the start. Add professional
              installation (&pound;150&ndash;&pound;300) and annual filter
              replacements. Over 5 years: the BWT E1 costs roughly &pound;500
              total (no filters to replace), the Waterdrop WHF21 costs about
              &pound;1,350, and the Aquasana EQ-1000 costs roughly &pound;1,400
              but with the main tank lasting a full decade.
            </p>
          </div>
        </div>

        {/* ── Product reviews ──────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          The three best whole house filters for UK homes
        </h2>

        {/* Product cards at a glance */}
        <div className="space-y-4 mb-8">
          {wholeHouseProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              highlight={
                product.id === "waterdrop-whf21"
                  ? "Top pick \u2014 best overall"
                  : product.id === "bwt-e1-whole-house"
                    ? "Value pick \u2014 lowest running costs"
                    : "Premium pick \u2014 maximum lifespan"
              }
            />
          ))}
        </div>

        {/* Detailed reviews */}
        <div className="space-y-8">
          <ProductReview
            product={waterdrop}
            heading="Waterdrop WHF21 \u2014 Top pick"
            verdict="The most comprehensive whole-house filtration for UK mains water."
            review="The Waterdrop WHF21 is the whole-house filter we recommend for most UK homes. Three filtration stages handle sediment, chlorine, iron, and manganese — the four most common whole-house concerns we see in our postcode data. NSF/ANSI 42 certified for chlorine taste and odour removal. The 56 L/min flow rate is the highest here, which means zero noticeable pressure drop even in larger homes with multiple bathrooms running simultaneously. At £600 it is a significant investment, and the £120/year filter replacement cost adds up. But if you want clean water from every tap in the house, this is the system that does the most."
            pros={[
              "NSF/ANSI 42 certified for chlorine taste and odour removal",
              "Three-stage filtration handles sediment, chlorine, iron, and manganese",
              "56 L/min flow rate — the highest here, no pressure drop",
              "Handles both mains water and well/borehole supply",
            ]}
            cons={[
              "Highest upfront cost at £600 plus installation",
              "£120/year in replacement filter sets every 6 months",
              "Requires professional plumbing installation — not DIY",
            ]}
            ctaLabel="View on Waterdrop"
          />

          <ProductReview
            product={bwt}
            heading="BWT E1 \u2014 Value pick"
            verdict="WRAS approved, self-cleaning, and zero annual filter costs."
            review="The BWT E1 takes a fundamentally different approach. Instead of disposable filter cartridges, it uses a stainless steel mesh that you clean with a simple backwash lever — pull it once a month and the filter flushes itself. That means zero annual filter replacement costs, which makes it the cheapest whole-house filter to run over 5 years. WRAS approved, which is the UK plumbing industry gold standard. The trade-off: it only removes sediment, chlorine, and particles. It does not remove heavy metals, iron, or manganese like the Waterdrop. At £250 it is the most affordable option here, and the 25 L/min flow rate is adequate for most UK homes. If your primary concern is sediment and chlorine, the BWT E1 is the smartest investment."
            pros={[
              "WRAS approved — the UK plumbing industry gold standard",
              "Self-cleaning backwash system — zero annual filter costs",
              "Lowest 5-year total cost of ownership at roughly £500",
              "Compact design fits in most UK utility cupboards",
            ]}
            cons={[
              "Only removes sediment and particles — not heavy metals or iron",
              "25 L/min flow rate is adequate but not exceptional",
              "Monthly manual backwash required — set a reminder",
            ]}
            ctaLabel="View on Amazon"
          />

          <ProductReview
            product={aquasana}
            heading="Aquasana EQ-1000 Rhino \u2014 Premium pick"
            verdict="The 10-year solution for homeowners who want to install and forget."
            review="The Aquasana EQ-1000 Rhino is built for the long game. The main filter tank has a 1,000,000-gallon capacity — that is roughly 10 years for an average UK household. It removes chlorine, lead, mercury, copper, and sediment, making it the most comprehensive contaminant removal in the whole-house category. NSF/ANSI 42 and 61 dual certified. The downside is the upfront cost: £800 for the unit plus £150–£300 for installation. And even though the main tank lasts a decade, the pre-filter needs replacing every 3 months at £15 each. The system also has a larger physical footprint than the other two — you will need dedicated utility space. For homeowners who plan to stay in their home long-term, the Aquasana is the premium choice."
            pros={[
              "1,000,000-gallon capacity — lasts most homes a full decade",
              "Removes lead and mercury alongside chlorine and sediment",
              "NSF/ANSI 42 and 61 dual certification",
              "Install once and forget for 10 years (main tank)",
            ]}
            cons={[
              "Highest upfront cost at £800 plus professional installation",
              "Large physical footprint — needs dedicated utility space",
              "Pre-filter replacement every 3 months adds hassle",
            ]}
            ctaLabel="View on Amazon"
          />
        </div>

        {/* ── Comparison table ─────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Side-by-side comparison
        </h2>
        <p className="text-base text-muted mb-6">
          The BWT handles basics cheaply. The Waterdrop covers the most
          contaminants. The Aquasana lasts the longest.
        </p>
        <div className="card p-4 lg:p-6">
          <ProductComparisonTable
            products={wholeHouseProducts}
            contaminants={comparisonContaminants}
          />
        </div>

        {/* ── Verdict ──────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Our verdict
        </h2>
        <div className="prose-section">
          <p className="text-base text-body leading-relaxed">
            The <strong className="text-ink">Waterdrop WHF21</strong> is the
            whole-house filter we recommend for most UK homes. Three-stage
            filtration, NSF 42 certified, and a 56 L/min flow rate that ensures
            you never notice a pressure drop. At &pound;600 plus installation,
            it is not cheap — but it is the most comprehensive protection for
            your entire home.
          </p>
          <p className="text-base text-body leading-relaxed mt-4">
            If your concern is primarily sediment and chlorine, the{" "}
            <strong className="text-ink">BWT E1</strong> at &pound;250 is the
            smartest value pick. WRAS approved, self-cleaning, and zero annual
            filter costs make it the cheapest system to run long-term.
          </p>
          <p className="text-base text-body leading-relaxed mt-4">
            For homeowners who want a set-and-forget solution, the{" "}
            <strong className="text-ink">Aquasana EQ-1000 Rhino</strong> lasts
            a decade and removes the most contaminants. Premium price, premium
            lifespan.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <a
            href={waterdrop.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="inline-flex items-center justify-center gap-2 bg-btn text-white rounded-lg px-6 py-3 text-sm font-medium hover:bg-btn-hover transition-colors"
          >
            Get the Waterdrop WHF21
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href={bwt.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="inline-flex items-center justify-center gap-2 border border-rule text-ink rounded-lg px-6 py-3 text-sm font-medium hover:bg-wash transition-colors"
          >
            Get the BWT E1 (value pick)
            <ArrowRight className="w-4 h-4" />
          </a>
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
            href="/filters/whole-house"
            className="flex items-center gap-2 text-sm text-accent hover:underline"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            All whole house filters we review
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
            Product recommendations last reviewed April {year}. Prices are
            approximate and may vary. Contaminant removal claims are based on
            manufacturer specifications and independent certifications. Water
            quality data sourced from the Environment Agency and water company
            compliance reports covering 2,800 UK postcode districts. We earn a
            commission from purchases made through affiliate links at no extra
            cost to you.{" "}
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
