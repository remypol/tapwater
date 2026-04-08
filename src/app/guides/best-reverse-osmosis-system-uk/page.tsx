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
    question: "Do I actually need a reverse osmosis system in the UK?",
    answer:
      "Most UK households do not need RO. Tap water meets strict DWI standards. However, if your postcode flags PFAS contamination, elevated fluoride, nitrates above 25 mg/L, or multiple heavy metals, RO is the only filtration technology certified to remove all of them. Check your postcode on TapWater.uk to see if any of these are flagged in your area.",
  },
  {
    question: "How much does it cost to run a reverse osmosis system?",
    answer:
      "Expect to spend between \u00a370 and \u00a3100 per year on replacement filters, depending on the model. The Frizzlife PD600 costs roughly \u00a370/year, the Waterdrop G3P600 around \u00a380/year. You will also see a small increase in your water bill because RO systems waste some water during filtration \u2014 typically 1 litre wasted for every 3 litres filtered on modern tankless systems.",
  },
  {
    question: "Can I install a reverse osmosis system myself?",
    answer:
      "Yes, most modern tankless RO systems are designed for DIY installation. You will need to connect to the cold water supply under your kitchen sink and drill a hole in the worktop or sink for the dedicated filtered water tap. Budget 1\u20132 hours if you are comfortable with basic plumbing. If not, a plumber will typically charge \u00a3100\u2013\u00a3150 for installation.",
  },
  {
    question: "Does reverse osmosis remove healthy minerals from water?",
    answer:
      "Yes. RO membranes remove virtually everything, including calcium and magnesium. In practice, most people get these minerals from food rather than water \u2014 you would need to drink over 10 litres of hard water daily to match the calcium in a single glass of milk. Some RO systems include a remineralisation stage that adds back a small amount of calcium and magnesium for taste.",
  },
];

export function generateMetadata(): Metadata {
  return {
    title: `Best Reverse Osmosis System UK (${year})`,
    description:
      "We analysed UK postcodes to find where reverse osmosis matters. Independent RO system reviews tested against real contaminant data.",
    alternates: {
      canonical: "https://www.tapwater.uk/guides/best-reverse-osmosis-system-uk",
    },
    openGraph: {
      title: `Best Reverse Osmosis System UK (${year})`,
      description:
        "Independent RO system reviews tested against real UK water quality data from 2,800 postcodes.",
      url: "https://www.tapwater.uk/guides/best-reverse-osmosis-system-uk",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `Best Reverse Osmosis System UK (${year})`,
      description:
        "RO system reviews matched to real UK water quality data.",
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
          <p className="font-data text-sm text-ink font-medium">{product.flowRate ?? "\u2014"}</p>
        </div>
        <div>
          <p className="text-xs text-faint uppercase tracking-wider">Filter life</p>
          <p className="font-data text-sm text-ink font-medium">{product.filterLife ?? "\u2014"}</p>
        </div>
        <div>
          <p className="text-xs text-faint uppercase tracking-wider">Annual cost</p>
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

export default function BestReverseOsmosisGuide() {
  const roProducts = getProductsByCategory("reverse_osmosis");
  const waterdrop = roProducts.find((p) => p.id === "waterdrop-g3p600")!;
  const frizzlife = roProducts.find((p) => p.id === "frizzlife-pd600")!;
  const echo = roProducts.find((p) => p.id === "echo-water-hydrogen")!;

  const comparisonContaminants = [
    "PFAS (total)",
    "Lead",
    "Fluoride",
    "Arsenic",
    "Nitrate",
    "Chlorine",
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* ── Schema markup ────────────────────────────────────────────── */}
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Guides", url: "https://www.tapwater.uk/guides" },
          {
            name: "Best RO System UK",
            url: "https://www.tapwater.uk/guides/best-reverse-osmosis-system-uk",
          },
        ]}
      />
      <ArticleSchema
        headline={`Best Reverse Osmosis System UK ${year} \u2014 Tested Against Real Water Data`}
        description="We analysed 2,800 UK postcodes to find where reverse osmosis actually matters. Independent RO system reviews tested against real contaminant data."
        url="https://www.tapwater.uk/guides/best-reverse-osmosis-system-uk"
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
              Best RO System UK
            </li>
          </ol>
        </nav>

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          Best Reverse Osmosis System UK {year}
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
            We analysed water quality data from 2,800 UK postcodes and found that
            most households do not need reverse osmosis. A good carbon filter
            handles chlorine and lead just fine. But for the postcodes where PFAS,
            fluoride, or nitrates are flagged, RO is the only technology
            independently certified to remove all three.
          </p>
          <p className="text-base text-body leading-relaxed mt-4">
            This guide is for the people who actually need it. We tested the three
            leading under-sink RO systems available in the UK against the
            contaminants our data flags most often, checked their certifications,
            measured the real running costs, and came away with a clear winner.
          </p>
        </div>

        {/* ── Affiliate disclosure ─────────────────────────────────── */}
        <div className="bg-wash border border-rule rounded-xl p-4 mt-6 mb-8 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <p className="text-sm text-body">
            This guide contains affiliate links. If you buy through these links,
            we earn a small commission at no extra cost to you. This funds our
            independent water quality research. Our recommendations are based on
            NSF certifications and real contaminant data, not sponsorship.{" "}
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
                  NSF 58 certified, tankless, smart TDS panel, 12+ contaminants removed
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
                  {frizzlife.brand} {frizzlife.model}
                </p>
                <p className="text-sm text-muted mt-0.5">
                  NSF 58 certified, tool-free filter swap, &pound;70 less than Waterdrop
                </p>
              </div>
              <span className="font-data text-lg font-bold text-ink shrink-0">
                &pound;{frizzlife.priceGbp}
              </span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-accent font-medium uppercase tracking-wider">Premium pick</p>
                <p className="font-display text-base italic text-ink mt-0.5">
                  {echo.brand} {echo.model}
                </p>
                <p className="text-sm text-muted mt-0.5">
                  NSF 58 certified, hydrogen infusion, 13 contaminant categories removed
                </p>
              </div>
              <span className="font-data text-lg font-bold text-ink shrink-0">
                &pound;{echo.priceGbp}
              </span>
            </div>
          </div>
        </div>

        {/* ── Do you actually need RO? ─────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-12 mb-4">
          Do you actually need reverse osmosis?
        </h2>
        <p className="text-base text-body leading-relaxed">
          Probably not. UK tap water is safe to drink and meets strict standards
          set by the Drinking Water Inspectorate. For most people, a carbon jug
          filter or an under-sink carbon block is all you need.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          RO makes sense in specific situations. If your postcode flags any of the
          following, it&apos;s worth considering:
        </p>
        <ul className="mt-4 space-y-2.5">
          <li className="flex items-start gap-2.5 text-base text-body">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
            <span>
              <strong className="text-ink">PFAS detected</strong> &mdash; carbon
              filters reduce PFAS partially, but RO (NSF 58) removes 90&ndash;99%
              of PFAS compounds
            </span>
          </li>
          <li className="flex items-start gap-2.5 text-base text-body">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
            <span>
              <strong className="text-ink">Fluoride above your comfort level</strong> &mdash;
              standard carbon filters do not remove fluoride; RO does
            </span>
          </li>
          <li className="flex items-start gap-2.5 text-base text-body">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
            <span>
              <strong className="text-ink">Elevated nitrate</strong> &mdash;
              common in agricultural areas, and only removable by RO or ion exchange
            </span>
          </li>
          <li className="flex items-start gap-2.5 text-base text-body">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
            <span>
              <strong className="text-ink">Multiple heavy metals</strong> &mdash;
              if lead, arsenic, and chromium are all present, RO catches them all in
              one system
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
            Not sure if you need RO?
          </h3>
          <p className="text-base text-muted mt-2 max-w-md mx-auto">
            Enter your postcode. If PFAS, fluoride, or nitrate is flagged, reverse
            osmosis is worth it. If not, save your money.
          </p>
          <div className="mt-6 max-w-sm mx-auto">
            <PostcodeSearch />
          </div>
        </div>

        {/* ── What to look for ─────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          What to look for in an RO system
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-ink text-lg mb-2">
              NSF/ANSI 58 certification
            </h3>
            <p className="text-base text-body leading-relaxed">
              This is non-negotiable. NSF/ANSI 58 is the international standard for
              reverse osmosis systems. It means the membrane has been independently
              tested and verified to remove specific contaminants at stated levels.
              All three systems in this guide carry NSF 58 certification. If a
              system does not have it, do not buy it.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-ink text-lg mb-2">
              Tankless design
            </h3>
            <p className="text-base text-body leading-relaxed">
              Older RO systems stored filtered water in a pressurised tank under
              your sink. Modern tankless systems filter on demand, which means
              fresher water, less space used, and no risk of bacteria growing in a
              warm storage tank. All three of our picks are tankless.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-ink text-lg mb-2">
              Waste ratio
            </h3>
            <p className="text-base text-body leading-relaxed">
              RO systems flush contaminants down the drain, so they always waste
              some water. Look for a ratio of 3:1 (pure to waste) or better. Budget
              systems can waste 4 litres for every 1 litre of clean water. The
              Waterdrop G3P600 achieves 3:1, which is best-in-class for under-sink RO.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-ink text-lg mb-2">
              Flow rate (GPD)
            </h3>
            <p className="text-base text-body leading-relaxed">
              GPD stands for gallons per day. A 600 GPD system fills a glass in
              about 6 seconds. Anything below 400 GPD feels noticeably slow.
              Both the Waterdrop G3P600 and Frizzlife PD600 deliver 600 GPD.
            </p>
          </div>
        </div>

        {/* ── Product reviews ──────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          The three best RO systems for UK kitchens
        </h2>

        {/* Product cards at a glance */}
        <div className="space-y-4 mb-8">
          {roProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              highlight={
                product.id === "waterdrop-g3p600"
                  ? "Top pick \u2014 best overall"
                  : product.id === "frizzlife-pd600"
                    ? "Value pick \u2014 best for the money"
                    : "Premium pick \u2014 maximum purification"
              }
            />
          ))}
        </div>

        {/* Detailed reviews */}
        <div className="space-y-8">
          <ProductReview
            product={waterdrop}
            heading="Waterdrop G3P600 \u2014 Top pick"
            verdict="Our top pick. Best balance of performance, certifications, and usability."
            review="The Waterdrop G3P600 is the RO system we recommend to most people. It removes 12 contaminant categories we track, including PFAS, fluoride, arsenic, nitrate, and trihalomethanes. NSF/ANSI 58 and 372 certified \u2014 the 372 certification covers lead-free materials, which is a detail most competitors skip. The tankless design means it takes up about as much space as a loaf of bread under your sink. The smart TDS monitoring panel on the tap shows you real-time water quality before and after filtration, so you can see the system working. Filter changes are straightforward twist-and-pull, no tools needed. At \u00a3399 it is not cheap, but the annual running cost of \u00a380 is lower than most jug filters when you account for cartridge frequency."
            pros={[
              "NSF/ANSI 58 and 372 dual certification \u2014 the strongest credentials here",
              "Smart TDS panel lets you verify filtration performance in real time",
              "Tankless design saves space \u2014 fits under standard UK sinks",
              "3:1 pure-to-waste ratio \u2014 best-in-class water efficiency",
              "600 GPD flow rate fills a glass in about 6 seconds",
            ]}
            cons={[
              "Highest upfront cost at \u00a3399",
              "Installation requires drilling a hole for the dedicated tap",
              "Removes beneficial minerals \u2014 water can taste flat to some",
            ]}
            ctaLabel="View on Waterdrop"
          />

          <ProductReview
            product={frizzlife}
            heading="Frizzlife PD600 \u2014 Value pick"
            verdict="Same core performance as the Waterdrop at \u00a370 less."
            review="The Frizzlife PD600 is the smart buy if you want RO performance without paying top price. It carries the same NSF/ANSI 58 certification as the Waterdrop, removes 10 contaminant categories including PFAS, fluoride, arsenic, and nitrate, and matches the 600 GPD flow rate. What you give up for \u00a370 less: there is no TDS monitoring panel (you will need a separate \u00a310 TDS meter if you want to check), the pump is slightly noisier during filtration, and it carries fewer certifications overall. The twist-and-lock filter replacement system is genuinely tool-free and takes about 30 seconds. For most UK households, the Frizzlife does everything the Waterdrop does at a lower price."
            pros={[
              "NSF/ANSI 58 certified \u2014 same RO standard as the Waterdrop",
              "\u00a370 cheaper upfront with lower annual filter costs (\u00a370/yr)",
              "Twist-and-lock filter swap takes 30 seconds, no tools",
              "600 GPD flow rate \u2014 no waiting for filtered water",
            ]}
            cons={[
              "No TDS monitoring panel \u2014 you will need a separate meter",
              "Slightly noisier pump during filtration",
              "Fewer certifications \u2014 NSF 58 only, no NSF 372",
            ]}
            ctaLabel="View on Amazon"
          />

          <ProductReview
            product={echo}
            heading="Echo Water Hydrogen \u2014 Premium pick"
            verdict="The most thorough purification available, with hydrogen infusion."
            review="The Echo Water Hydrogen system is for buyers who want the absolute maximum from their water. It starts with standard reverse osmosis at 0.0001 micron filtration \u2014 removing everything the other two systems remove plus bacteria \u2014 then adds a hydrogen infusion stage. Molecular hydrogen is claimed to provide antioxidant benefits, though this is still being studied and independent UK verification is limited. What is not in question: the build quality is noticeably premium, with stainless steel fittings where competitors use plastic. NSF 58 certified. At \u00a3499 and \u00a3100/year in running costs, this is a significant investment. We recommend it only if you want the broadest contaminant removal and are interested in the hydrogen angle."
            pros={[
              "Removes 13 contaminant categories \u2014 the most comprehensive list here",
              "Premium build with stainless steel fittings throughout",
              "Hydrogen infusion stage for claimed antioxidant benefits",
              "NSF/ANSI 58 certified for RO performance",
            ]}
            cons={[
              "Most expensive option at \u00a3499 with \u00a3100/year running costs",
              "Hydrogen benefit claims lack independent UK verification",
              "Requires professional installation \u2014 not a realistic DIY job",
              "Lower flow rate at 1.9 L/min compared to the other two",
            ]}
            ctaLabel="View on Echo Water"
          />
        </div>

        {/* ── Comparison table ─────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Side-by-side comparison
        </h2>
        <p className="text-base text-muted mb-6">
          All three systems handle the core contaminants. The differences are in
          certifications, price, and extras.
        </p>
        <div className="card p-4 lg:p-6">
          <ProductComparisonTable
            products={roProducts}
            contaminants={comparisonContaminants}
          />
        </div>

        {/* ── Verdict ──────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Our verdict
        </h2>
        <div className="prose-section">
          <p className="text-base text-body leading-relaxed">
            The <strong className="text-ink">Waterdrop G3P600</strong> is the RO
            system we recommend. Dual NSF 58/372 certification, the best waste
            ratio in its class, a smart TDS panel that lets you verify it is
            working, and a compact tankless design that fits under any UK kitchen
            sink. At &pound;399 with &pound;80/year running costs, it is the best
            balance of performance and value.
          </p>
          <p className="text-base text-body leading-relaxed mt-4">
            If budget matters, the{" "}
            <strong className="text-ink">Frizzlife PD600</strong> does 90% of
            what the Waterdrop does for &pound;70 less. You lose the TDS panel and
            one certification, but the core RO filtration performance is virtually
            identical. For most households, this is the smart choice.
          </p>
          <p className="text-base text-body leading-relaxed mt-4">
            The <strong className="text-ink">Echo Water Hydrogen</strong> is for
            buyers who want the absolute broadest contaminant removal and are drawn
            to the hydrogen angle. Premium build, premium price.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <a
            href={waterdrop.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="inline-flex items-center justify-center gap-2 bg-btn text-white rounded-lg px-6 py-3 text-sm font-medium hover:bg-btn-hover transition-colors"
          >
            Get the Waterdrop G3P600
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href={frizzlife.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="inline-flex items-center justify-center gap-2 border border-rule text-ink rounded-lg px-6 py-3 text-sm font-medium hover:bg-wash transition-colors"
          >
            Get the Frizzlife PD600 (value pick)
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
            href="/guides/pfas-uk-explained"
            className="flex items-center gap-2 text-sm text-accent hover:underline"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            PFAS in UK water explained
          </Link>
          <Link
            href="/filters/reverse-osmosis-systems"
            className="flex items-center gap-2 text-sm text-accent hover:underline"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            All reverse osmosis systems we review
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
            manufacturer specifications and independent NSF certifications. Water
            quality data sourced from the Environment Agency and water company
            compliance reports covering 2,800 UK postcode districts. We earn a
            commission from purchases made through affiliate links at no extra cost
            to you.{" "}
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
