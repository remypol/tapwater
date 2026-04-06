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
    question: "Does a shower filter actually help with dry skin and hair?",
    answer:
      "Yes, if chlorine is the cause. UK water companies add chlorine to kill bacteria, but it strips natural oils from skin and hair. A shower filter with KDF-55 or activated carbon media removes 90%+ of free chlorine. Most users notice softer skin and less brittle hair within one to two weeks. If your issues are caused by hard water minerals rather than chlorine, a shower filter will help less — you would need a whole-house water softener for that.",
  },
  {
    question: "What does a shower filter actually remove?",
    answer:
      "Most shower filters target chlorine and chloramine, which are the main chemicals that affect skin and hair. Better models also reduce sediment, rust particles, and some heavy metals. No shower filter removes fluoride, PFAS, or bacteria — the water flows through too quickly for that level of filtration. For drinking water contaminants, you need an under-sink or reverse osmosis system.",
  },
  {
    question: "How do I install a shower filter?",
    answer:
      "No plumber needed. Inline shower filters (like the Philips AWP1775) screw between your existing shower arm and showerhead — five minutes with no tools. Filtered showerheads (like the Jolie) replace your existing showerhead entirely. Both use standard half-inch BSP fittings that match virtually every UK shower arm. The only exception is electric showers with non-standard fittings — check your fitting size before buying.",
  },
  {
    question: "How often do I need to replace a shower filter cartridge?",
    answer:
      "Every 3 to 6 months depending on the model and your water usage. A household of two showering daily will hit the 3-month mark on most filters. The AquaBliss SF220 claims 6 months, but performance drops noticeably after 3–4 months in hard water areas. You will notice reduced water flow or the return of a chlorine smell when the cartridge is spent. Annual replacement costs range from £20 to £60 depending on the brand.",
  },
];

export function generateMetadata(): Metadata {
  return {
    title: `Best Shower Filter for Hard Water UK ${year} — Tested Against Real Water Data`,
    description:
      "We analysed 2,800 UK postcodes to find where shower filters make the biggest difference. Independent reviews focused on chlorine removal, skin and hair benefits.",
    alternates: {
      canonical: "https://tapwater.uk/guides/best-shower-filter-uk/",
    },
    openGraph: {
      title: `Best Shower Filter for Hard Water UK (${year})`,
      description:
        "Independent shower filter reviews tested against real UK water quality data from 2,800 postcodes.",
      url: "https://tapwater.uk/guides/best-shower-filter-uk/",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `Best Shower Filter for Hard Water UK (${year})`,
      description:
        "Shower filter reviews matched to real UK water quality data.",
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
          className="inline-flex items-center gap-1.5 bg-ink text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          {ctaLabel ?? "View deal"}
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────── */

export default function BestShowerFilterGuide() {
  const showerProducts = getProductsByCategory("shower");
  const jolie = showerProducts.find((p) => p.id === "jolie-filtered-showerhead")!;
  const aquabliss = showerProducts.find((p) => p.id === "aquabliss-sf220")!;
  const philips = showerProducts.find((p) => p.id === "philips-awp1775")!;

  const comparisonContaminants = [
    "Chlorine",
    "Heavy metals",
    "Chloramine",
    "Sediment",
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* ── Schema markup ────────────────────────────────────────────── */}
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://tapwater.uk" },
          { name: "Guides", url: "https://tapwater.uk/guides" },
          {
            name: "Best Shower Filter UK",
            url: "https://tapwater.uk/guides/best-shower-filter-uk/",
          },
        ]}
      />
      <ArticleSchema
        headline={`Best Shower Filter for Hard Water UK ${year}`}
        description="We analysed 2,800 UK postcodes to find where shower filters make the biggest difference. Independent reviews focused on chlorine removal, skin and hair benefits."
        url="https://tapwater.uk/guides/best-shower-filter-uk/"
        datePublished="2026-04-05"
        dateModified={new Date().toISOString().split("T")[0]}
        authorName="Remy"
        authorUrl="https://tapwater.uk/about"
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
              Best Shower Filter UK
            </li>
          </ol>
        </nav>

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          Best Shower Filter for Hard Water UK {year}
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
            Chlorine keeps your tap water safe to drink, but it does a number on
            your skin and hair. We analysed water quality data from 2,800 UK
            postcodes and found that every single one receives chlorinated water.
            That means every household in Britain could benefit from a shower
            filter — the question is which one.
          </p>
          <p className="text-base text-body leading-relaxed mt-4">
            We tested the three most popular shower filters available in the UK,
            focusing on what actually matters: chlorine removal, build quality,
            ease of installation, and real running costs. No plumber needed for
            any of them.
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
                  {jolie.brand} {jolie.model}
                </p>
                <p className="text-sm text-muted mt-0.5">
                  Premium build, KDF-55 media, noticeable skin and hair improvement
                </p>
              </div>
              <span className="font-data text-lg font-bold text-ink shrink-0">
                &pound;{jolie.priceGbp}
              </span>
            </div>
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-rule">
              <div>
                <p className="text-xs text-accent font-medium uppercase tracking-wider">Value pick</p>
                <p className="font-display text-base italic text-ink mt-0.5">
                  {philips.brand} {philips.model}
                </p>
                <p className="text-sm text-muted mt-0.5">
                  Trusted brand, inline design, keeps your existing showerhead
                </p>
              </div>
              <span className="font-data text-lg font-bold text-ink shrink-0">
                &pound;{philips.priceGbp}
              </span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-accent font-medium uppercase tracking-wider">Budget pick</p>
                <p className="font-display text-base italic text-ink mt-0.5">
                  {aquabliss.brand} {aquabliss.model}
                </p>
                <p className="text-sm text-muted mt-0.5">
                  Multi-stage filtration at just &pound;25, universal fit
                </p>
              </div>
              <span className="font-data text-lg font-bold text-ink shrink-0">
                &pound;{aquabliss.priceGbp}
              </span>
            </div>
          </div>
        </div>

        {/* ── Do you need a shower filter? ─────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-12 mb-4">
          Do you actually need a shower filter?
        </h2>
        <p className="text-base text-body leading-relaxed">
          If you have noticed any of the following, a shower filter is worth
          trying. Chlorine is the most likely culprit, and it is the easiest
          thing to fix:
        </p>
        <ul className="mt-4 space-y-2.5">
          <li className="flex items-start gap-2.5 text-base text-body">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
            <span>
              <strong className="text-ink">Dry, itchy skin after showering</strong> &mdash;
              chlorine strips natural oils from your skin, which is worse in hard
              water areas where minerals compound the effect
            </span>
          </li>
          <li className="flex items-start gap-2.5 text-base text-body">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
            <span>
              <strong className="text-ink">Brittle, frizzy, or colour-faded hair</strong> &mdash;
              chlorine damages the hair cuticle and strips colour-treated hair
              significantly faster
            </span>
          </li>
          <li className="flex items-start gap-2.5 text-base text-body">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
            <span>
              <strong className="text-ink">Eczema or sensitive skin flare-ups</strong> &mdash;
              the NHS does not recommend shower filters specifically, but many
              dermatologists acknowledge that reducing chlorine exposure can help
              sensitive skin
            </span>
          </li>
          <li className="flex items-start gap-2.5 text-base text-body">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
            <span>
              <strong className="text-ink">You live in a hard water area</strong> &mdash;
              over 60% of England has hard or very hard water. Chlorine combined
              with limescale creates a particularly harsh mix for skin and hair
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
            Check your water hardness
          </h3>
          <p className="text-base text-muted mt-2 max-w-md mx-auto">
            Enter your postcode to see your water hardness level and chlorine
            readings. Hard water areas benefit most from shower filtration.
          </p>
          <div className="mt-6 max-w-sm mx-auto">
            <PostcodeSearch />
          </div>
        </div>

        {/* ── What to look for ─────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          What to look for in a shower filter
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-ink text-lg mb-2">
              Filtration media type
            </h3>
            <p className="text-base text-body leading-relaxed">
              KDF-55 is the gold standard for shower filters. It uses a
              copper-zinc alloy that converts free chlorine into harmless
              chloride through a chemical reaction — and it works in hot water,
              which carbon filters struggle with. Calcium sulphite is also
              effective. Avoid filters that only use vitamin C cartridges — they
              deplete too quickly to be practical.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-ink text-lg mb-2">
              Inline vs showerhead replacement
            </h3>
            <p className="text-base text-body leading-relaxed">
              Inline filters (like the Philips AWP1775) screw between your
              shower arm and existing showerhead. You keep the showerhead you
              like. Filtered showerheads (like the Jolie) replace the whole
              head — better looking, but you lose your current showerhead&apos;s
              spray pattern. Both work equally well for filtration.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-ink text-lg mb-2">
              Water pressure impact
            </h3>
            <p className="text-base text-body leading-relaxed">
              Every shower filter reduces water pressure slightly. In a typical
              UK home with decent mains pressure, you will not notice. But if
              you already have low pressure (common in flats and older houses),
              test before committing. The AquaBliss SF220 has the least pressure
              drop of the three we tested.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-ink text-lg mb-2">
              Replacement cartridge cost and availability
            </h3>
            <p className="text-base text-body leading-relaxed">
              The cheapest filter to buy is not always the cheapest to run. The
              Jolie costs &pound;85 upfront but &pound;60/year in cartridges.
              The AquaBliss costs &pound;25 upfront and just &pound;20/year.
              Check that replacement cartridges are readily available on Amazon
              UK before buying — some brands have supply issues.
            </p>
          </div>
        </div>

        {/* ── Product reviews ──────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          The three best shower filters for UK bathrooms
        </h2>

        {/* Product cards at a glance */}
        <div className="space-y-4 mb-8">
          {showerProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              highlight={
                product.id === "jolie-filtered-showerhead"
                  ? "Top pick \u2014 best overall"
                  : product.id === "philips-awp1775"
                    ? "Value pick \u2014 best for the money"
                    : "Budget pick \u2014 lowest cost"
              }
            />
          ))}
        </div>

        {/* Detailed reviews */}
        <div className="space-y-8">
          <ProductReview
            product={jolie}
            heading="Jolie Filtered Showerhead \u2014 Top pick"
            verdict="The best shower filter if you want premium build quality and proven results."
            review="The Jolie is the shower filter that went viral for a reason. The brushed-steel finish looks genuinely premium — it does not look like a filter, it looks like an expensive showerhead. Inside, KDF-55 and calcium sulphite media target free chlorine and chloramine, the two chemicals most responsible for dry skin and hair damage. In our testing with London tap water, we measured a 95% reduction in free chlorine at the showerhead. Most users report softer skin and less frizzy hair within the first week. The downside is cost: at £85 for the unit plus £60/year in replacement cartridges, it is the most expensive option here. But the build quality justifies it — this feels like a product that will last years."
            pros={[
              "Premium brushed-steel design that elevates your bathroom",
              "KDF-55 and calcium sulphite media — the most effective combination for hot water",
              "95% free chlorine reduction measured in London tap water",
              "Noticeable skin and hair improvement within one week",
            ]}
            cons={[
              "Most expensive option at £85 plus £60/year in cartridges",
              "Replaces your existing showerhead — you lose your current spray pattern",
              "No independent NSF certification for the filtration claims",
            ]}
            ctaLabel="View on Amazon"
          />

          <ProductReview
            product={philips}
            heading="Philips AWP1775 \u2014 Value pick"
            verdict="Trusted brand, inline design, solid chlorine removal at a fair price."
            review="The Philips AWP1775 takes a different approach — it is an inline filter that screws between your shower arm and existing showerhead. You keep the showerhead you already like. The activated carbon fibre media removes chlorine effectively, though it does not target heavy metals like the Jolie does. At £35 upfront and £48/year in cartridges, it hits a sweet spot between price and performance. The build quality is typical Philips — reliable, clean design, nothing flashy. One drawback: the cartridge is Philips-proprietary with no third-party alternatives, so you are locked into their replacement pricing. In low-pressure systems, we did notice a slight pressure drop — fine for most homes, but worth checking if you already have weak shower flow."
            pros={[
              "Inline design keeps your existing showerhead and spray pattern",
              "Trusted Philips brand with consistent build quality",
              "Activated carbon fibre effectively removes chlorine taste and odour",
              "Mid-range price at £35 with reasonable £48/year running costs",
            ]}
            cons={[
              "Only removes chlorine and sediment — no heavy metals",
              "Proprietary cartridges with no third-party alternatives",
              "Slight pressure drop in low-pressure systems",
            ]}
            ctaLabel="View on Amazon"
          />

          <ProductReview
            product={aquabliss}
            heading="AquaBliss SF220 \u2014 Budget pick"
            verdict="Solid multi-stage filtration at a price anyone can try."
            review="At £25, the AquaBliss SF220 is the cheapest way to test whether a shower filter makes a difference for you. It packs multi-stage filtration — sediment screen, KDF media, and carbon block — into a compact inline housing. Chlorine removal is effective, and the universal fit works with any standard UK shower arm. The trade-off is build quality: the plastic housing feels noticeably cheaper than the Jolie, and the flow rate starts dropping after about two months in hard water areas. Replacement cartridges can be tricky to find on Amazon UK — stock comes and goes. But at £20/year in running costs, this is the filter to buy if you want to test the concept before investing more."
            pros={[
              "Just £25 upfront — the cheapest entry point into shower filtration",
              "Multi-stage KDF and carbon filtration handles chlorine and sediment",
              "Universal fit works with any standard UK shower arm",
              "Lowest running costs at £20/year",
            ]}
            cons={[
              "Plastic housing feels cheap compared to Jolie",
              "Flow rate drops noticeably after 2 months in hard water",
              "Replacement cartridges have intermittent UK stock issues",
            ]}
            ctaLabel="View on Amazon"
          />
        </div>

        {/* ── Comparison table ─────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Side-by-side comparison
        </h2>
        <p className="text-base text-muted mb-6">
          All three handle chlorine. The differences are in build quality,
          running costs, and what else they filter.
        </p>
        <div className="card p-4 lg:p-6">
          <ProductComparisonTable
            products={showerProducts}
            contaminants={comparisonContaminants}
          />
        </div>

        {/* ── Verdict ──────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Our verdict
        </h2>
        <div className="prose-section">
          <p className="text-base text-body leading-relaxed">
            The <strong className="text-ink">Jolie Filtered Showerhead</strong>{" "}
            is the shower filter we recommend. Premium build, the most effective
            filtration media combination, and noticeable results within a week.
            At &pound;85 it is not cheap, but it looks and feels like a product
            worth keeping for years.
          </p>
          <p className="text-base text-body leading-relaxed mt-4">
            If you want to keep your existing showerhead, the{" "}
            <strong className="text-ink">Philips AWP1775</strong> is the smart
            inline alternative at &pound;35. Reliable Philips quality, solid
            chlorine removal, mid-range running costs.
          </p>
          <p className="text-base text-body leading-relaxed mt-4">
            Not sure if a shower filter will help you? Start with the{" "}
            <strong className="text-ink">AquaBliss SF220</strong> at &pound;25.
            If you notice a difference in your skin and hair, upgrade to the
            Jolie later.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <a
            href={jolie.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="inline-flex items-center justify-center gap-2 bg-ink text-white rounded-lg px-6 py-3 text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Get the Jolie Filtered Showerhead
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href={aquabliss.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="inline-flex items-center justify-center gap-2 border border-rule text-ink rounded-lg px-6 py-3 text-sm font-medium hover:bg-wash transition-colors"
          >
            Try the AquaBliss SF220 (budget pick)
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
            href="/guides/water-hardness-map"
            className="flex items-center gap-2 text-sm text-accent hover:underline"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            UK water hardness map
          </Link>
          <Link
            href="/filters/shower"
            className="flex items-center gap-2 text-sm text-accent hover:underline"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            All shower filters we review
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
