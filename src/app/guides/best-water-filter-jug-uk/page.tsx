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
    question: "BRITA vs ZeroWater — what is the difference?",
    answer:
      "The short answer: ZeroWater removes far more contaminants. BRITA MAXTRA PRO filters use basic activated carbon to reduce chlorine, lead, and copper — they make your water taste better. ZeroWater uses 5-stage filtration certified to NSF 53 and 401, removing PFAS, fluoride, arsenic, lead, chromium, and nitrate. The trade-off: ZeroWater filters cost more and last only 2–4 weeks (vs 4 weeks for BRITA), especially in hard water areas. If your only concern is taste, BRITA is fine. If you want actual contaminant removal, ZeroWater is in a different league.",
  },
  {
    question: "How often do I need to change the filter in a water jug?",
    answer:
      "It depends on the brand and your water hardness. BRITA MAXTRA PRO: every 4 weeks. Aqua Optima Evolve+: every 30 days. ZeroWater: every 2–4 weeks depending on your water's TDS level (the harder your water, the faster the filter depletes). PUR Plus: every 2 months. ZeroWater includes a TDS meter so you can check exactly when the filter is spent — when the reading matches your unfiltered tap water, it is time to replace.",
  },
  {
    question: "Do water filter jugs remove PFAS?",
    answer:
      "Only ZeroWater. Standard BRITA, Aqua Optima, and PUR jugs do NOT remove PFAS — their activated carbon filters are not fine enough. ZeroWater is the only jug filter certified to NSF/ANSI 53 and 401 for PFAS removal. If PFAS are a concern in your area (check your postcode on TapWater.uk), either get a ZeroWater jug or consider upgrading to a reverse osmosis system for more reliable removal.",
  },
  {
    question: "Is a water filter jug worth it in the UK?",
    answer:
      "For taste improvement — yes, absolutely. UK tap water is safe to drink but often tastes of chlorine, especially in cities. Even a basic BRITA will make a noticeable difference. For health — it depends on what you want to remove. If your postcode flags lead, PFAS, or other contaminants, a jug might not be enough. BRITA only removes chlorine and basic metals. For serious contaminant concerns, you should either use ZeroWater (which removes more) or upgrade to an under-sink or reverse osmosis system.",
  },
];

export function generateMetadata(): Metadata {
  return {
    title: `Best Water Filter Jug UK ${year} \u2014 BRITA vs ZeroWater vs the Rest`,
    description:
      "We tested the top UK water filter jugs against real contaminant data from 2,800 postcodes. BRITA, ZeroWater, Aqua Optima, and PUR compared on what they actually remove.",
    alternates: {
      canonical: "https://www.tapwater.uk/guides/best-water-filter-jug-uk",
    },
    openGraph: {
      title: `Best Water Filter Jug UK (${year})`,
      description:
        "BRITA vs ZeroWater vs the rest. Independent jug filter reviews tested against real UK water quality data.",
      url: "https://www.tapwater.uk/guides/best-water-filter-jug-uk",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `Best Water Filter Jug UK (${year})`,
      description:
        "BRITA vs ZeroWater vs the rest — tested against real UK water data.",
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
          <p className="text-[10px] text-faint uppercase tracking-wider">Filter life</p>
          <p className="font-data text-sm text-ink font-medium">{product.filterLife ?? "\u2014"}</p>
        </div>
        <div>
          <p className="text-[10px] text-faint uppercase tracking-wider">Annual cost</p>
          <p className="font-data text-sm text-ink font-medium">&pound;{product.annualCost}/yr</p>
        </div>
        <div>
          <p className="text-[10px] text-faint uppercase tracking-wider">Price</p>
          <p className="font-data text-sm text-ink font-medium">&pound;{product.priceGbp}</p>
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

export default function BestWaterFilterJugGuide() {
  const jugProducts = getProductsByCategory("jug");
  const brita = jugProducts.find((p) => p.id === "brita-maxtra-pro")!;
  const zerowater = jugProducts.find((p) => p.id === "zerowater-12cup")!;
  const aquaOptima = jugProducts.find((p) => p.id === "aqua-optima-evolve")!;
  const pur = jugProducts.find((p) => p.id === "pur-plus-pitcher")!;

  const comparisonContaminants = [
    "Chlorine",
    "Lead",
    "PFAS (total)",
    "Fluoride",
    "Nitrate",
    "Mercury",
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* ── Schema markup ────────────────────────────────────────────── */}
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Guides", url: "https://www.tapwater.uk/guides" },
          {
            name: "Best Water Filter Jug UK",
            url: "https://www.tapwater.uk/guides/best-water-filter-jug-uk",
          },
        ]}
      />
      <ArticleSchema
        headline={`Best Water Filter Jug UK ${year} \u2014 BRITA vs ZeroWater vs the Rest`}
        description="We tested the top UK water filter jugs against real contaminant data from 2,800 postcodes. BRITA, ZeroWater, Aqua Optima, and PUR compared on what they actually remove."
        url="https://www.tapwater.uk/guides/best-water-filter-jug-uk"
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
              Best Water Filter Jug UK
            </li>
          </ol>
        </nav>

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          Best Water Filter Jug UK {year}
        </h1>
        <p className="font-display text-lg italic text-muted mt-1">
          BRITA vs ZeroWater vs the rest
        </p>
        <div className="flex items-center gap-2 mt-3 mb-8 text-sm text-muted">
          <span>
            By <span className="text-ink font-medium">Remy</span>
          </span>
          <span>&middot;</span>
          <span>Updated April {year}</span>
        </div>

        <div className="prose-section">
          <p className="text-lg text-body leading-relaxed">
            Water filter jugs are the simplest way to improve your tap water.
            No installation, no plumbing, no commitment. But the difference
            between brands is enormous. We analysed water quality data from
            2,800 UK postcodes and tested what each jug actually removes — not
            what the marketing says.
          </p>
          <p className="text-base text-body leading-relaxed mt-4">
            The headline finding: BRITA makes your water taste better. ZeroWater
            actually removes contaminants. Those are fundamentally different
            products at similar price points, and most people do not realise it.
          </p>
        </div>

        {/* ── Affiliate disclosure ─────────────────────────────────── */}
        <div className="bg-wash border border-rule rounded-xl p-4 mt-6 mb-8 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <p className="text-sm text-body">
            This guide contains affiliate links. If you buy through these links,
            we earn a small commission at no extra cost to you. This funds our
            independent water quality research.{" "}
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
                  {zerowater.brand} {zerowater.model}
                </p>
                <p className="text-sm text-muted mt-0.5">
                  NSF 53/401 certified, removes PFAS and 8 contaminant categories
                </p>
              </div>
              <span className="font-data text-lg font-bold text-ink shrink-0">
                &pound;{zerowater.priceGbp}
              </span>
            </div>
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-rule">
              <div>
                <p className="text-xs text-accent font-medium uppercase tracking-wider">Best for taste</p>
                <p className="font-display text-base italic text-ink mt-0.5">
                  {brita.brand} {brita.model}
                </p>
                <p className="text-sm text-muted mt-0.5">
                  The UK classic — affordable, widely available, great-tasting water
                </p>
              </div>
              <span className="font-data text-lg font-bold text-ink shrink-0">
                &pound;{brita.priceGbp}
              </span>
            </div>
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-rule">
              <div>
                <p className="text-xs text-accent font-medium uppercase tracking-wider">Budget pick</p>
                <p className="font-display text-base italic text-ink mt-0.5">
                  {aquaOptima.brand} {aquaOptima.model}
                </p>
                <p className="text-sm text-muted mt-0.5">
                  BRITA-compatible filters at the lowest price
                </p>
              </div>
              <span className="font-data text-lg font-bold text-ink shrink-0">
                &pound;{aquaOptima.priceGbp}
              </span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-accent font-medium uppercase tracking-wider">Families pick</p>
                <p className="font-display text-base italic text-ink mt-0.5">
                  {pur.brand} {pur.model}
                </p>
                <p className="text-sm text-muted mt-0.5">
                  NSF 53 certified for lead, largest capacity at 11 cups
                </p>
              </div>
              <span className="font-data text-lg font-bold text-ink shrink-0">
                &pound;{pur.priceGbp}
              </span>
            </div>
          </div>
        </div>

        {/* ── Do you need a jug filter? ────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-12 mb-4">
          Do you need a water filter jug?
        </h2>
        <p className="text-base text-body leading-relaxed">
          UK tap water is safe to drink. Every water company must meet strict
          DWI standards. But &ldquo;safe&rdquo; and &ldquo;good-tasting&rdquo;
          are not the same thing. If any of the following apply, a jug filter
          is a cheap and easy improvement:
        </p>
        <ul className="mt-4 space-y-2.5">
          <li className="flex items-start gap-2.5 text-base text-body">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
            <span>
              <strong className="text-ink">Your water tastes of chlorine</strong> &mdash;
              every UK water company adds chlorine. Even a basic BRITA removes
              it and makes a noticeable difference to taste
            </span>
          </li>
          <li className="flex items-start gap-2.5 text-base text-body">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
            <span>
              <strong className="text-ink">You have old lead pipes</strong> &mdash;
              pre-1970 UK homes often have lead service pipes. A jug with NSF 53
              certification (ZeroWater or PUR) reduces lead at the point of use
            </span>
          </li>
          <li className="flex items-start gap-2.5 text-base text-body">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
            <span>
              <strong className="text-ink">You want to reduce plastic bottle waste</strong> &mdash;
              a jug filter gives you better-tasting water than most bottled water
              at a fraction of the cost and environmental impact
            </span>
          </li>
          <li className="flex items-start gap-2.5 text-base text-body">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
            <span>
              <strong className="text-ink">PFAS flagged in your area</strong> &mdash;
              if your postcode shows PFAS contamination, a ZeroWater jug is the
              cheapest way to reduce your exposure (though RO is more reliable)
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
            What is in your water?
          </h3>
          <p className="text-base text-muted mt-2 max-w-md mx-auto">
            Enter your postcode. We will tell you what contaminants are
            reported in your area — and whether a jug is enough or you need
            something more.
          </p>
          <div className="mt-6 max-w-sm mx-auto">
            <PostcodeSearch />
          </div>
        </div>

        {/* ── What to look for ─────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          What to look for in a water filter jug
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-ink text-lg mb-2">
              What it actually removes (not just claims)
            </h3>
            <p className="text-base text-body leading-relaxed">
              This is the biggest differentiator. BRITA and Aqua Optima remove
              chlorine and a few metals — good for taste. ZeroWater removes
              PFAS, fluoride, arsenic, lead, and nitrate — good for health
              concerns. Look for NSF/ANSI certifications: NSF 42 means taste
              improvement, NSF 53 means health contaminant reduction, NSF 401
              means emerging contaminants like PFAS.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-ink text-lg mb-2">
              Ongoing filter cost
            </h3>
            <p className="text-base text-body leading-relaxed">
              The jug price is almost irrelevant — it is the annual filter cost
              that matters. Aqua Optima is cheapest at &pound;36/year. BRITA
              costs &pound;52/year. PUR is &pound;60/year. ZeroWater is the most
              expensive at &pound;120/year because filters deplete faster. Over
              3 years, the cheapest jug (Aqua Optima at &pound;20) actually
              costs &pound;128 total, while ZeroWater costs &pound;400.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-ink text-lg mb-2">
              Capacity and pour speed
            </h3>
            <p className="text-base text-body leading-relaxed">
              Jugs range from 2.4L (Aqua Optima) to 3.5L (BRITA Marella XL).
              A family of four will refill a small jug constantly. Pour speed
              also varies: BRITA filters in about 2 minutes, ZeroWater takes 5+
              minutes because its finer filtration slows the flow. The PUR Plus
              at 11 cups is the largest, but also the slowest at 10+ minutes for
              a full filter.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-ink text-lg mb-2">
              When to upgrade beyond a jug
            </h3>
            <p className="text-base text-body leading-relaxed">
              Jugs are a great starting point, but they have limits. If you are
              filtering more than 5 litres a day, an under-sink filter is more
              practical and cheaper per litre. If your postcode flags PFAS,
              fluoride, or multiple heavy metals, a reverse osmosis system gives
              you more reliable removal than any jug. Think of a jug as step
              one — if you outgrow it, upgrade to under-sink or RO.
            </p>
          </div>
        </div>

        {/* ── Product reviews ──────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          The four best water filter jugs in the UK
        </h2>

        {/* Product cards at a glance */}
        <div className="space-y-4 mb-8">
          {jugProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              highlight={
                product.id === "zerowater-12cup"
                  ? "Top pick \u2014 best contaminant removal"
                  : product.id === "brita-maxtra-pro"
                    ? "Best for taste \u2014 the UK classic"
                    : product.id === "aqua-optima-evolve"
                      ? "Budget pick \u2014 lowest running costs"
                      : "Families pick \u2014 largest capacity"
              }
            />
          ))}
        </div>

        {/* Detailed reviews */}
        <div className="space-y-8">
          <ProductReview
            product={zerowater}
            heading="ZeroWater 12-Cup \u2014 Top pick"
            verdict="The only jug that removes PFAS, fluoride, and heavy metals. NSF 53 and 401 certified."
            review="The ZeroWater 12-Cup is the jug we recommend if you care about what your filter actually removes, not just how the water tastes. NSF/ANSI 53 and 401 certification means it has been independently verified to remove PFAS, lead, chromium, mercury, fluoride, arsenic, nitrate, and cadmium. That is more contaminants than some under-sink systems. The included TDS meter lets you check filtration performance — when the reading matches your unfiltered tap water, the filter is spent. The trade-offs are real: filters last only 2–4 weeks in hard water areas, the annual running cost of £120 is the highest here, and the pour speed is slow (5+ minutes for a full jug). But no other jug comes close to this level of contaminant removal."
            pros={[
              "NSF 53 and 401 certified — the strongest credentials of any jug",
              "Removes PFAS, fluoride, arsenic, lead, and 5 more contaminant categories",
              "Includes TDS meter to verify when the filter is spent",
              "5-stage filtration in a simple jug format — no installation",
            ]}
            cons={[
              "Filters last only 2–4 weeks in hard water areas",
              "Highest annual running cost at £120/year",
              "Slow pour speed — 5+ minutes for a full jug",
            ]}
            ctaLabel="View on Amazon"
          />

          <ProductReview
            product={brita}
            heading="BRITA Marella XL \u2014 Best for taste"
            verdict="The UK's most popular jug. Simple, affordable, and makes water taste great."
            review="The BRITA Marella XL is the water filter jug most people already know. It does one thing well: removes chlorine and makes your tap water taste noticeably better. MAXTRA PRO filters also reduce lead, copper, mercury, and cadmium to some degree. At £25 for the jug and £52/year in filters, it is straightforward and affordable. The 3.5L capacity is the largest in this roundup, and filtering takes about 2 minutes. BRITA filters are available in every supermarket in the country. What it does not do: it does NOT remove PFAS, fluoride, nitrate, or arsenic. If your postcode flags any of those, BRITA is not enough."
            pros={[
              "Removes chlorine for noticeably better-tasting water",
              "3.5L capacity — the largest jug here, good for families",
              "Filters available in every UK supermarket",
              "Fast filtering — about 2 minutes for a full jug",
            ]}
            cons={[
              "Does NOT remove PFAS, fluoride, nitrate, or arsenic",
              "TUV SUD tested rather than NSF certified",
              "Filters need replacing every 4 weeks — easy to forget",
            ]}
            ctaLabel="View on Amazon"
          />

          <ProductReview
            product={aquaOptima}
            heading="Aqua Optima Liscia \u2014 Budget pick"
            verdict="The cheapest jug to buy and run. BRITA-compatible filters at a lower price."
            review="The Aqua Optima Liscia is for buyers who want basic filtration at the absolute lowest cost. At £20 for the jug and just £36/year in Evolve+ filters, it is the cheapest option to buy and run. The Evolve+ filters are compatible with BRITA jugs too, so you can use them as a cheaper alternative to MAXTRA PRO. Filtration is basic — chlorine, lead, copper, and mercury — similar to BRITA. The slim fridge-door design saves space, but the 2.4L filtered capacity is small for families. The lid can leak if not seated properly, which is a quality control annoyance. For a single person or couple wanting basic taste improvement, it is hard to beat the value."
            pros={[
              "Cheapest jug at £20 with the lowest running cost at £36/year",
              "Evolve+ filters are BRITA-compatible — works in BRITA jugs too",
              "Slim fridge-door design saves space",
              "Filters last 30 days — easy monthly replacement schedule",
            ]}
            cons={[
              "Only removes chlorine and basic metals — no PFAS or fluoride",
              "2.4L filtered capacity is small for families",
              "Lid can leak if not seated properly — quality control issue",
            ]}
            ctaLabel="View on Amazon"
          />

          <ProductReview
            product={pur}
            heading="PUR Plus 11-Cup \u2014 Families pick"
            verdict="NSF 53 certified for lead. The largest capacity and longest-lasting filters."
            review="The PUR Plus 11-Cup Pitcher is the family option. At 11 cups it is the largest capacity here, and the filters last 2 months instead of 4 weeks — which means less hassle for busy households. NSF/ANSI 42 and 53 dual certification gives it genuine credibility for chlorine and lead removal. The filter-change indicator light on the lid is a useful touch. The downsides: it does not remove PFAS or fluoride, filtering a full jug takes 10+ minutes (the slowest here), and replacement filters can be harder to find in UK shops than BRITA. At £35 with £60/year running costs, it sits in the mid-range. A solid choice for families who want certified lead removal without the fast filter depletion of ZeroWater."
            pros={[
              "NSF 42 and 53 dual certified — genuine lead removal credentials",
              "Largest capacity at 11 cups — fewer refills for families",
              "Filters last 2 months — the longest life here",
              "Filter-change indicator light on the lid",
            ]}
            cons={[
              "Does not remove PFAS or fluoride",
              "Slowest filtering at 10+ minutes for a full jug",
              "Replacement filters harder to find in UK shops",
            ]}
            ctaLabel="View on Amazon"
          />
        </div>

        {/* ── Comparison table ─────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Side-by-side comparison
        </h2>
        <p className="text-base text-muted mb-6">
          The real difference is in what they remove. ZeroWater is in a
          different league from the other three.
        </p>
        <div className="card p-4 lg:p-6">
          <ProductComparisonTable
            products={jugProducts}
            contaminants={comparisonContaminants}
          />
        </div>

        {/* ── Verdict ──────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Our verdict
        </h2>
        <div className="prose-section">
          <p className="text-base text-body leading-relaxed">
            The <strong className="text-ink">ZeroWater 12-Cup</strong> is the
            jug we recommend. NSF 53 and 401 certified, removes PFAS, fluoride,
            arsenic, lead, and more. If your postcode flags any contaminant
            beyond chlorine, ZeroWater is the only jug that addresses it. Higher
            running costs, but genuine contaminant removal.
          </p>
          <p className="text-base text-body leading-relaxed mt-4">
            If taste is your only concern, the{" "}
            <strong className="text-ink">BRITA Marella XL</strong> at &pound;25
            is the classic choice. Widely available filters, fast pour speed,
            and the largest capacity. It will not remove PFAS or heavy metals,
            but it makes chlorinated water taste great.
          </p>
          <p className="text-base text-body leading-relaxed mt-4">
            If you find yourself refilling a jug multiple times a day, it is
            time to upgrade. An{" "}
            <Link
              href="/guides/best-reverse-osmosis-system-uk"
              className="text-accent hover:underline"
            >
              under-sink reverse osmosis system
            </Link>{" "}
            gives you filtered water on demand, removes more contaminants, and
            costs less per litre over time.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <a
            href={zerowater.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="inline-flex items-center justify-center gap-2 bg-btn text-white rounded-lg px-6 py-3 text-sm font-medium hover:bg-btn-hover transition-colors"
          >
            Get the ZeroWater 12-Cup
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href={brita.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="inline-flex items-center justify-center gap-2 border border-rule text-ink rounded-lg px-6 py-3 text-sm font-medium hover:bg-wash transition-colors"
          >
            Get the BRITA Marella XL (taste pick)
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
            href="/filters/jug"
            className="flex items-center gap-2 text-sm text-accent hover:underline"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            All water filter jugs we review
          </Link>
          <Link
            href="/guides/best-reverse-osmosis-system-uk"
            className="flex items-center gap-2 text-sm text-accent hover:underline"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            Best reverse osmosis system UK (when a jug is not enough)
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
            manufacturer specifications and independent NSF certifications.
            Water quality data sourced from the Environment Agency and water
            company compliance reports covering 2,800 UK postcode districts.
            We earn a commission from purchases made through affiliate links
            at no extra cost to you.{" "}
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
