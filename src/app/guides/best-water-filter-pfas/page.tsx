import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, AlertTriangle, Check, Star, ArrowUpRight, ShieldCheck, Search } from "lucide-react";
import { PostcodeSearch } from "@/components/postcode-search";
import { ProductCard } from "@/components/product-card";
import { ProductComparisonTable } from "@/components/product-comparison-table";
import { ArticleSchema, BreadcrumbSchema, FAQSchema } from "@/components/json-ld";
import { PRODUCTS } from "@/lib/products";

const year = new Date().getFullYear();

const FAQ_DATA = [
  {
    question: "What are forever chemicals (PFAS)?",
    answer:
      "PFAS stands for per- and polyfluoroalkyl substances — a family of over 12,000 synthetic chemicals used since the 1950s in non-stick coatings, food packaging, waterproof clothing, and firefighting foam. They are called 'forever chemicals' because they do not break down in the environment or in your body. PFAS have been linked to increased cancer risk, thyroid disease, immune system suppression, and reproductive problems. They enter the water supply through industrial discharge, landfill leachate, and agricultural runoff.",
  },
  {
    question: "Does boiling water remove PFAS?",
    answer:
      "No. Boiling water does not remove PFAS — it actually concentrates them. As water evaporates, the PFAS remain behind in a smaller volume of water, making the concentration higher. The same applies to distillation unless you capture and condense the steam while leaving the residue behind. The only proven methods for removing PFAS from drinking water are reverse osmosis (NSF 58), activated carbon filtration (to a lesser extent), and ion exchange resins.",
  },
  {
    question: "Does a BRITA filter remove PFAS?",
    answer:
      "No. Standard BRITA MAXTRA PRO filters are not certified to remove PFAS. BRITA's activated carbon reduces chlorine, lead, and some metals, but PFAS molecules require either a much finer filtration medium (like an RO membrane) or a specialised carbon block certified to NSF/ANSI 53 for PFAS. If PFAS are a concern in your area, the ZeroWater jug (NSF 53 and 401 certified) is the only jug that removes them. For the most reliable PFAS removal, a reverse osmosis system certified to NSF 58 is the gold standard.",
  },
  {
    question: "Is UK tap water safe from PFAS?",
    answer:
      "UK tap water meets current DWI standards, but PFAS regulation is evolving. The UK does not yet have legally binding limits for PFAS in drinking water — the DWI uses a guideline value of 100 ng/L for total PFAS. Our analysis of 2,800 UK postcodes found that PFAS have been detected in multiple water supply zones, particularly near industrial sites and former military bases. Whether current levels are 'safe' depends on which scientific body you ask. The EU has proposed stricter limits of 4 ng/L for individual PFAS compounds. If you want to minimise your exposure, filtration is the only option available to you today.",
  },
];

/* ── Get PFAS-removing products across all categories ────────────────── */
const pfasProducts = PRODUCTS.filter((p) =>
  p.removes.includes("PFAS (total)")
);

export function generateMetadata(): Metadata {
  return {
    title: `Best Water Filter for PFAS Removal UK ${year} — Forever Chemicals Guide`,
    description:
      "We analysed 2,800 UK postcodes for PFAS contamination. Only reverse osmosis and select filters reliably remove forever chemicals. Independent reviews with real data.",
    alternates: {
      canonical: "https://www.tapwater.uk/guides/best-water-filter-pfas/",
    },
    openGraph: {
      title: `Best Water Filter for PFAS Removal UK (${year})`,
      description:
        "Which filters actually remove PFAS? Independent reviews tested against real UK water quality data.",
      url: "https://www.tapwater.uk/guides/best-water-filter-pfas/",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `Best Water Filter for PFAS Removal UK (${year})`,
      description:
        "Only specific filters remove PFAS. We tested which ones work.",
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
  product: (typeof pfasProducts)[number];
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
              className={`inline-flex items-center gap-1 text-xs rounded-full px-2.5 py-1 ${
                r === "PFAS (total)"
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "bg-emerald-50 text-emerald-700"
              }`}
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

export default function BestWaterFilterPfasGuide() {
  const waterdropRO = pfasProducts.find((p) => p.id === "waterdrop-g3p600")!;
  const frizzlife = pfasProducts.find((p) => p.id === "frizzlife-pd600")!;
  const zerowater = pfasProducts.find((p) => p.id === "zerowater-12cup")!;
  const tappWater = pfasProducts.find((p) => p.id === "tapp-water-ecopro")!;

  // Top 4 products for the comparison table and cards
  const featuredProducts = [waterdropRO, frizzlife, zerowater, tappWater];

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
            name: "Best Water Filter for PFAS UK",
            url: "https://www.tapwater.uk/guides/best-water-filter-pfas/",
          },
        ]}
      />
      <ArticleSchema
        headline={`Best Water Filter for PFAS Removal UK ${year}`}
        description="We analysed 2,800 UK postcodes for PFAS contamination. Only reverse osmosis and select filters reliably remove forever chemicals."
        url="https://www.tapwater.uk/guides/best-water-filter-pfas/"
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
              Best Water Filter for PFAS UK
            </li>
          </ol>
        </nav>

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          Best Water Filter for PFAS Removal UK {year}
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
            PFAS — per- and polyfluoroalkyl substances, also called
            &ldquo;forever chemicals&rdquo; — have been found in water supplies
            across the UK. We analysed water quality data from 2,800 UK
            postcodes and found PFAS detections in multiple water supply zones,
            particularly near industrial sites and former military bases.
          </p>
          <p className="text-base text-body leading-relaxed mt-4">
            Here is the uncomfortable truth: most water filters do not remove
            PFAS. Standard BRITA jugs, basic carbon filters, and boiling your
            water all fail. Only specific filtration technologies —
            reverse osmosis (NSF 58) and select advanced carbon filters — are
            proven to reduce PFAS to safe levels. This guide covers the filters
            that actually work.
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
            Quick picks for PFAS removal
          </h2>
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-rule">
              <div>
                <p className="text-xs text-accent font-medium uppercase tracking-wider">Most reliable</p>
                <p className="font-display text-base italic text-ink mt-0.5">
                  {waterdropRO.brand} {waterdropRO.model}
                </p>
                <p className="text-sm text-muted mt-0.5">
                  NSF 58 certified RO, removes 90&ndash;99% of PFAS compounds
                </p>
              </div>
              <span className="font-data text-lg font-bold text-ink shrink-0">
                &pound;{waterdropRO.priceGbp}
              </span>
            </div>
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-rule">
              <div>
                <p className="text-xs text-accent font-medium uppercase tracking-wider">Value RO pick</p>
                <p className="font-display text-base italic text-ink mt-0.5">
                  {frizzlife.brand} {frizzlife.model}
                </p>
                <p className="text-sm text-muted mt-0.5">
                  NSF 58 certified, same PFAS removal for &pound;70 less
                </p>
              </div>
              <span className="font-data text-lg font-bold text-ink shrink-0">
                &pound;{frizzlife.priceGbp}
              </span>
            </div>
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-rule">
              <div>
                <p className="text-xs text-accent font-medium uppercase tracking-wider">Budget pick</p>
                <p className="font-display text-base italic text-ink mt-0.5">
                  {zerowater.brand} {zerowater.model}
                </p>
                <p className="text-sm text-muted mt-0.5">
                  NSF 53/401 certified jug — the cheapest PFAS removal option
                </p>
              </div>
              <span className="font-data text-lg font-bold text-ink shrink-0">
                &pound;{zerowater.priceGbp}
              </span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-accent font-medium uppercase tracking-wider">No-install option</p>
                <p className="font-display text-base italic text-ink mt-0.5">
                  {tappWater.brand} {tappWater.model}
                </p>
                <p className="text-sm text-muted mt-0.5">
                  Clips onto your tap, removes PFAS and microplastics
                </p>
              </div>
              <span className="font-data text-lg font-bold text-ink shrink-0">
                &pound;{tappWater.priceGbp}
              </span>
            </div>
          </div>
        </div>

        {/* ── What are PFAS? ───────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-12 mb-4">
          What are PFAS and why should you care?
        </h2>
        <p className="text-base text-body leading-relaxed">
          PFAS are a family of over 12,000 man-made chemicals that have been
          used since the 1950s. You will find them in non-stick pans, food
          packaging, waterproof jackets, and firefighting foam. They are called
          &ldquo;forever chemicals&rdquo; because they do not break down —
          not in the environment, and not in your body.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          The health concerns are serious. Peer-reviewed research has linked PFAS
          exposure to:
        </p>
        <ul className="mt-4 space-y-2.5">
          <li className="flex items-start gap-2.5 text-base text-body">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
            <span>
              <strong className="text-ink">Increased cancer risk</strong> &mdash;
              particularly kidney and testicular cancer
            </span>
          </li>
          <li className="flex items-start gap-2.5 text-base text-body">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
            <span>
              <strong className="text-ink">Thyroid disease</strong> &mdash;
              PFAS interfere with thyroid hormone production
            </span>
          </li>
          <li className="flex items-start gap-2.5 text-base text-body">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
            <span>
              <strong className="text-ink">Immune system suppression</strong> &mdash;
              reduced vaccine effectiveness has been observed in children with
              higher PFAS levels
            </span>
          </li>
          <li className="flex items-start gap-2.5 text-base text-body">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
            <span>
              <strong className="text-ink">Reproductive problems</strong> &mdash;
              linked to reduced fertility and increased risk of pre-eclampsia
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
            Is PFAS detected in your area?
          </h3>
          <p className="text-base text-muted mt-2 max-w-md mx-auto">
            Enter your postcode to check. If PFAS is flagged, a certified
            filter is the only way to reduce your exposure today.
          </p>
          <div className="mt-6 max-w-sm mx-auto">
            <PostcodeSearch />
          </div>
        </div>

        {/* ── Which filter types remove PFAS? ──────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Which filter types actually remove PFAS?
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-ink text-lg mb-2">
              Reverse osmosis (NSF 58) — the gold standard
            </h3>
            <p className="text-base text-body leading-relaxed">
              RO membranes filter at 0.0001 microns — small enough to physically
              block PFAS molecules. NSF/ANSI 58 certified systems have been
              independently tested and verified to remove 90&ndash;99% of PFAS
              compounds. This is the most reliable option if PFAS are your
              primary concern. The trade-off: RO systems cost &pound;329&ndash;&pound;499,
              require under-sink installation, and waste some water during
              filtration.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-ink text-lg mb-2">
              Specialised carbon filtration (NSF 53/401) — the budget option
            </h3>
            <p className="text-base text-body leading-relaxed">
              Not all carbon filters remove PFAS. Standard activated carbon
              (like in a BRITA) does not. But specialised 5-stage carbon
              filtration (like ZeroWater) certified to NSF/ANSI 53 and 401 has
              been independently verified for PFAS reduction. The ZeroWater jug
              is the cheapest option at &pound;40, but filters deplete quickly
              in hard water areas — expect &pound;120/year in replacements.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-ink text-lg mb-2">
              What does NOT remove PFAS
            </h3>
            <p className="text-base text-body leading-relaxed">
              Standard BRITA filters, basic carbon jug filters, boiling water,
              UV treatment, and water softeners do NOT remove PFAS. Boiling
              actually concentrates PFAS by evaporating the water while leaving
              the chemicals behind. If a filter does not carry NSF 53, NSF 401,
              or NSF 58 certification specifically for PFAS, do not trust
              marketing claims.
            </p>
          </div>
        </div>

        {/* ── Product reviews ──────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          The best filters for PFAS removal in the UK
        </h2>

        {/* Product cards at a glance */}
        <div className="space-y-4 mb-8">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              highlight={
                product.id === "waterdrop-g3p600"
                  ? "Most reliable \u2014 NSF 58 certified RO"
                  : product.id === "frizzlife-pd600"
                    ? "Value RO pick \u2014 same PFAS removal, lower price"
                    : product.id === "zerowater-12cup"
                      ? "Budget pick \u2014 cheapest PFAS removal"
                      : "No-install option \u2014 clips onto your tap"
              }
            />
          ))}
        </div>

        {/* Detailed reviews */}
        <div className="space-y-8">
          <ProductReview
            product={waterdropRO}
            heading="Waterdrop G3P600 \u2014 Most reliable PFAS removal"
            verdict="NSF 58 certified. The most dependable way to remove PFAS from your drinking water."
            review="If PFAS are your primary concern, this is the filter to buy. The Waterdrop G3P600 is a tankless reverse osmosis system certified to NSF/ANSI 58 — the international standard that verifies 90–99% PFAS removal. It also removes fluoride, arsenic, nitrate, lead, and 8 other contaminant categories. The smart TDS monitoring panel shows you real-time filtration performance so you can see it working. At £399 plus £80/year in running costs, it is a significant investment. But it is the only technology that reliably removes PFAS regardless of which specific PFAS compounds are present in your water."
            pros={[
              "NSF/ANSI 58 certified — independently verified 90–99% PFAS removal",
              "Removes 12+ contaminant categories including fluoride and arsenic",
              "Smart TDS panel verifies filtration is working in real time",
              "Tankless design fits under standard UK kitchen sinks",
            ]}
            cons={[
              "£399 upfront plus £80/year — the most expensive option",
              "Requires under-sink installation with a dedicated tap",
              "Wastes some water during filtration (3:1 pure-to-waste ratio)",
            ]}
            ctaLabel="View on Waterdrop"
          />

          <ProductReview
            product={frizzlife}
            heading="Frizzlife PD600 \u2014 Value RO pick"
            verdict="Same NSF 58 PFAS removal standard at £70 less than the Waterdrop."
            review="The Frizzlife PD600 carries the same NSF/ANSI 58 certification as the Waterdrop, which means identical PFAS removal verification. It removes 10 contaminant categories including PFAS, fluoride, arsenic, and nitrate. What you give up for £70 less: no TDS monitoring panel, slightly noisier operation, and fewer certifications overall. But the core PFAS removal performance is equivalent. If you want RO-level PFAS protection and price matters, the Frizzlife is the smarter buy."
            pros={[
              "NSF/ANSI 58 certified — same PFAS removal standard as the Waterdrop",
              "£70 cheaper upfront with £70/year running costs",
              "Twist-and-lock filter replacement takes 30 seconds",
              "600 GPD flow rate — no waiting for filtered water",
            ]}
            cons={[
              "No TDS monitoring panel — you need a separate TDS meter",
              "Slightly noisier pump during filtration",
              "Fewer certifications overall than the Waterdrop",
            ]}
            ctaLabel="View on Amazon"
          />

          <ProductReview
            product={zerowater}
            heading="ZeroWater 12-Cup \u2014 Budget PFAS removal"
            verdict="The cheapest way to remove PFAS. NSF 53 and 401 certified in a simple jug."
            review="If you cannot install an under-sink system — or you want PFAS removal for £40 instead of £329 — the ZeroWater is the answer. It is the only jug filter certified to NSF/ANSI 53 and 401 for PFAS removal. The 5-stage filtration also removes lead, chromium, mercury, fluoride, arsenic, and nitrate. The included TDS meter lets you check when the filter is spent. The catch: ZeroWater filters deplete fast, especially in hard water areas (2–3 weeks per filter). At £120/year in replacement filters, the annual running cost is higher than the RO systems. But as a starting point for PFAS removal, nothing else comes close at this price."
            pros={[
              "NSF/ANSI 53 and 401 certified for PFAS removal",
              "Just £40 upfront — the cheapest PFAS removal entry point",
              "No installation — fill, filter, pour",
              "Includes TDS meter to verify filter performance",
            ]}
            cons={[
              "Filters last only 2–3 weeks in hard water areas",
              "£120/year running costs — higher than RO systems annually",
              "Slow pour rate — 5+ minutes to fill the jug",
            ]}
            ctaLabel="View on Amazon"
          />

          <ProductReview
            product={tappWater}
            heading="TAPP Water EcoPro \u2014 No-install PFAS option"
            verdict="Clips onto your tap. Removes PFAS and microplastics without plumbing."
            review="The TAPP Water EcoPro is a tap-mounted filter that clips onto most standard UK kitchen taps. It removes PFAS, microplastics, chlorine, and lead — rare for a filter at this price point and form factor. The biodegradable filter cartridges are an eco-friendly touch. The caveat: it is SGS tested rather than NSF certified, which means the testing was done by a reputable lab but did not go through the full NSF certification process. For renters or anyone who cannot modify their plumbing, it is the most practical PFAS-reducing option available. At £60 upfront and £80/year, the total cost of ownership is moderate."
            pros={[
              "Clips onto most standard UK kitchen taps — no plumbing needed",
              "Removes PFAS and microplastics at the tap",
              "Biodegradable filter cartridges reduce environmental waste",
              "Practical for renters who cannot install under-sink systems",
            ]}
            cons={[
              "SGS tested rather than NSF certified — less rigorous verification",
              "Not compatible with pull-out or spray taps",
              "£80/year running costs on subscription model",
            ]}
            ctaLabel="View on Amazon"
          />
        </div>

        {/* ── Comparison table ─────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Side-by-side comparison
        </h2>
        <p className="text-base text-muted mb-6">
          All four remove PFAS. The difference is how reliably, what else they
          remove, and what they cost.
        </p>
        <div className="card p-4 lg:p-6">
          <ProductComparisonTable
            products={featuredProducts}
            contaminants={comparisonContaminants}
          />
        </div>

        {/* ── Verdict ──────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Our verdict
        </h2>
        <div className="prose-section">
          <p className="text-base text-body leading-relaxed">
            For the most reliable PFAS removal, a{" "}
            <strong className="text-ink">reverse osmosis system</strong> is the
            answer. The{" "}
            <strong className="text-ink">Waterdrop G3P600</strong> (&pound;399)
            is our top pick with NSF 58 certification and real-time TDS
            monitoring. The{" "}
            <strong className="text-ink">Frizzlife PD600</strong> (&pound;329)
            offers the same PFAS removal at a lower price.
          </p>
          <p className="text-base text-body leading-relaxed mt-4">
            If you cannot install an under-sink system, the{" "}
            <strong className="text-ink">ZeroWater 12-Cup jug</strong> at
            &pound;40 is the only jug with certified PFAS removal. Higher
            running costs, but the lowest possible entry point.
          </p>
          <p className="text-base text-body leading-relaxed mt-4">
            One thing is certain: standard BRITA filters do NOT remove PFAS.
            If forever chemicals are a concern in your area, you need one of
            the filters above.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <a
            href={waterdropRO.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="inline-flex items-center justify-center gap-2 bg-btn text-white rounded-lg px-6 py-3 text-sm font-medium hover:bg-btn-hover transition-colors"
          >
            Get the Waterdrop G3P600
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href={zerowater.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="inline-flex items-center justify-center gap-2 border border-rule text-ink rounded-lg px-6 py-3 text-sm font-medium hover:bg-wash transition-colors"
          >
            Get ZeroWater jug (budget pick)
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
            href="/contaminant/pfas"
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
            href="/guides/best-reverse-osmosis-system-uk"
            className="flex items-center gap-2 text-sm text-accent hover:underline"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            Best reverse osmosis system UK
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
