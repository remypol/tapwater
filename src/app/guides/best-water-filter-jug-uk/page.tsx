import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Minus,
  Search,
  Star,
  X,
} from "lucide-react";
import { PostcodeSearch } from "@/components/postcode-search";
import { AffiliateLink } from "@/components/affiliate-link";
import { ProductCard } from "@/components/product-card";
import { ProductComparisonTable } from "@/components/product-comparison-table";
import { RunningCostComparison } from "@/components/running-cost";
import { ArticleSchema, BreadcrumbSchema, FAQSchema } from "@/components/json-ld";
import { GeoCitation } from "@/components/geo-citation";
import { AffiliateNote, Kicker, TypicalPrice } from "@/components/commerce";
import {
  GuideBreadcrumb,
  GuideByline,
  GuideDisclosure,
  GuideFaq,
  GuideFooter,
} from "@/components/guide-chrome";
import { getProductsByCategory } from "@/lib/products";
import type { FilterProduct } from "@/lib/types";
import { OG_IMAGE } from "@/lib/og";

export const revalidate = 86400;

const year = new Date().getFullYear();
const SLUG = "best-water-filter-jug-uk";
const URL = `https://www.tapwater.uk/guides/${SLUG}`;
const PAGE_TYPE = "best-water-filter-jug-guide";
const TITLE = `Best Water Filter Jug UK (${year}): BRITA, ZeroWater and More`;
const DESCRIPTION =
  "Four water filter jugs compared on what they remove from UK tap water, cost per litre, hard water and limescale, and which BRITA jug to buy. Plain answers.";

export function generateMetadata(): Metadata {
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: URL },
    openGraph: {
      images: OG_IMAGE,
      title: TITLE,
      description: DESCRIPTION,
      url: URL,
      type: "article",
    },
    twitter: {
      images: OG_IMAGE,
      card: "summary_large_image",
      title: TITLE,
      description: DESCRIPTION,
    },
  };
}

/* ── Content ────────────────────────────────────────────────────────── */

const FAQ_DATA = [
  {
    question: "What is the best water filter jug in the UK?",
    answer:
      "It depends on what you want out of the water. If you want chlorine gone and better-tasting tea, the BRITA Marella XL with MAXTRA PRO is the sensible default: around £25, 3.5 litres, filters in every supermarket, roughly £52 a year. If you want contaminants removed rather than taste improved, the ZeroWater 12-Cup is the only jug here certified to NSF/ANSI 53 and 401 and the only one listed for PFAS, fluoride, nitrate and arsenic, at a higher running cost of around £120 a year. The Aqua Optima Liscia is the cheapest to buy and run at about £36 a year, and the PUR Plus 11-Cup is the family pick with NSF/ANSI 53 lead certification and the longest cartridge life at two months.",
  },
  {
    question: "Which BRITA jug is best?",
    answer:
      "The filtering is done by the cartridge, not the jug, and current BRITA jugs take the same MAXTRA PRO cartridge, so the water that comes out is the same whichever shape you pick. Choose on size and where it will live. The Marella XL, the one we list, holds 3.5 litres and suits a family of up to four; smaller BRITA jugs suit a fridge door or a one-person household. Whatever the jug, MAXTRA PRO is rated for four weeks and works out at roughly £52 a year, and it is listed for chlorine, lead, copper, mercury and cadmium, not PFAS, fluoride or nitrate.",
  },
  {
    question: "Does a water filter jug remove limescale or soften hard water?",
    answer:
      "None of the four jugs here lists hardness reduction, so do not buy one for that. BRITA, Aqua Optima and PUR cartridges are carbon and ion-exchange blends aimed at chlorine and metals, and the calcium that furs your kettle passes through. ZeroWater is the partial exception: its five-stage cartridge takes out dissolved solids, which is why it ships with a TDS meter and why its filters run out in two to three weeks in hard water, but ZeroWater sells it as a contaminant filter and makes no limescale claim. For a kettle that stays clean in a hard water area, a kettle designed for hard water or a whole-house softener is the honest answer.",
  },
  {
    question: "BRITA or ZeroWater: what is the difference?",
    answer:
      "They are different products at similar prices. BRITA MAXTRA PRO is listed for chlorine, lead, copper, mercury and cadmium and is TUV SUD tested; its job is taste. ZeroWater is certified to NSF/ANSI 53 and 401 and listed for lead, chromium, mercury, PFAS, fluoride, nitrate, arsenic and cadmium; its job is removal, and the listing does not even lead with chlorine. The trade is cost and speed: ZeroWater cartridges last two to four weeks against BRITA's four, so around £120 a year against £52, and a full ZeroWater jug takes five minutes or more to filter. If your postcode shows nothing but chlorine, BRITA is enough. If it flags PFAS, nitrate or lead, ZeroWater is the only jug that addresses them.",
  },
  {
    question: "Do water filter jugs remove PFAS?",
    answer:
      "Only one of the four here. The ZeroWater 12-Cup is certified to NSF/ANSI 53 and 401 and lists PFAS among its removals. BRITA, Aqua Optima and PUR do not list PFAS, and both BRITA and PUR say so in their own limitations. If PFAS has been detected at your postcode, a ZeroWater jug is the cheapest way to reduce exposure at the glass; a reverse osmosis system is the more reliable route if you want it out of all your drinking and cooking water.",
  },
  {
    question: "How often should you change a water filter jug cartridge?",
    answer:
      "BRITA MAXTRA PRO: every four weeks. Aqua Optima Evolve+: every 30 days. PUR Plus: every two months, the longest here, with an indicator light on the lid. ZeroWater: every two to four weeks depending on how much is dissolved in your water; in hard water areas it is the shorter end. ZeroWater includes a TDS meter, and when the filtered reading climbs towards the tap reading the cartridge is spent. For the others, the date on the calendar is the only reliable signal, because a saturated carbon cartridge quietly stops removing chlorine before the water tastes any different.",
  },
  {
    question: "Is a water filter jug worth it in the UK?",
    answer:
      "For taste, yes, and cheaply: every UK mains supply is chlorinated, and a £20 to £25 jug with a £36 to £52 a year cartridge habit takes the chlorine out. For safety, usually no: UK tap water already meets the Drinking Water Inspectorate's standards, so most households have nothing to remove beyond taste. The exceptions are homes with lead pipes, where a jug certified to NSF/ANSI 53 for lead such as the PUR Plus or ZeroWater reduces what reaches the glass, and postcodes where PFAS or nitrate has been detected, where ZeroWater is the only jug that helps. Check your postcode first; it tells you which case you are in.",
  },
  {
    question: "Do water filter jugs remove lead?",
    answer:
      "All four list lead, but the paper trail differs. The PUR Plus and ZeroWater are certified to NSF/ANSI 53, the standard for health-related contaminants including lead. BRITA and Aqua Optima list lead reduction with TUV SUD testing rather than an NSF certification. If lead is the reason you are buying, and it usually is in homes built before 1970 that still have a lead supply pipe, pick one of the two NSF/ANSI 53 jugs and read our lead pipes guide, because the permanent fix is replacing the pipe.",
  },
];

/**
 * Litres a day the per-litre arithmetic assumes. Three litres is a small
 * household's drinking and kettle water; it is an assumption, and the page
 * says so, because no maker publishes a litres-per-cartridge figure we trust.
 */
const LITRES_PER_DAY = 3;
const LITRES_PER_YEAR = LITRES_PER_DAY * 365;

/**
 * The contaminants a UK reader actually asks about, and what each jug lists.
 * The ticks come from product.removes, so a claim can only appear here if it
 * is in the catalogue. The note carries the UK context for the row.
 */
const LEDGER_ROWS: { name: string; note: string }[] = [
  { name: "Chlorine", note: "In every UK mains supply; the taste most people buy a jug to fix" },
  { name: "Lead", note: "From old supply pipes in pre-1970 homes, not from the mains" },
  { name: "Copper", note: "From copper plumbing, especially new pipework" },
  { name: "Mercury", note: "Rarely detected in UK supplies" },
  { name: "Cadmium", note: "Rarely detected in UK supplies" },
  { name: "PFAS (total)", note: "Detected in some UK postcodes; check yours" },
  { name: "Fluoride", note: "Added in parts of the West Midlands and North East" },
  { name: "Nitrate", note: "Higher in farming areas; regulated to 50 mg/L" },
  { name: "Arsenic", note: "Rare in UK mains water" },
];

const NOT_LISTED_BY_ANY: string[] = [
  "Hardness and limescale: no jug here claims it",
  "Microplastics: none listed",
  "Bacteria: none listed, and UK mains water is already disinfected",
];

/* ── Helpers ─────────────────────────────────────────────────────────── */

function lists(product: FilterProduct, name: string): boolean {
  return product.removes.some((r) => r.toLowerCase() === name.toLowerCase());
}

function pencePerLitre(product: FilterProduct): string {
  if (typeof product.annualCost !== "number") return "Not published";
  const pence = (product.annualCost * 100) / LITRES_PER_YEAR;
  return `${pence.toFixed(1)}p`;
}

function ProductReview({
  product,
  heading,
  verdict,
  review,
  pros,
  cons,
  ctaLabel,
}: {
  product: FilterProduct;
  heading: string;
  verdict: string;
  review: string;
  pros: string[];
  cons: string[];
  ctaLabel: string;
}) {
  return (
    <article className="card p-6 lg:p-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-display text-xl italic text-ink">{heading}</h3>
          <p className="text-sm text-muted mt-0.5">
            {product.brand} {product.model}
          </p>
        </div>
        <TypicalPrice priceGbp={product.priceGbp} size="md" />
      </div>

      <p className="text-sm font-medium text-accent mt-3">{verdict}</p>

      <p className="text-base text-body leading-relaxed mt-4">{review}</p>

      <div className="mt-5">
        <Kicker className="mb-2">Listed to remove</Kicker>
        <div className="flex flex-wrap gap-1.5">
          {product.removes.map((r) => (
            <span
              key={r}
              className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 rounded-full px-2.5 py-1"
            >
              <Check className="w-3 h-3" aria-hidden="true" />
              {r}
            </span>
          ))}
        </div>
      </div>

      {product.certifications.length > 0 && (
        <div className="mt-3">
          <Kicker className="mb-2">Certifications and testing</Kicker>
          <div className="flex flex-wrap gap-1.5">
            {product.certifications.map((cert) => (
              <span
                key={cert}
                className="text-xs bg-wash text-body border border-rule rounded px-2 py-0.5"
              >
                {cert}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
        <div>
          <Kicker className="mb-2">Pros</Kicker>
          <ul className="space-y-1.5">
            {pros.map((p) => (
              <li key={p} className="flex items-start gap-1.5 text-sm text-body">
                <Check className="w-3.5 h-3.5 text-safe shrink-0 mt-0.5" aria-hidden="true" />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <Kicker className="mb-2">Cons</Kicker>
          <ul className="space-y-1.5">
            {cons.map((c) => (
              <li key={c} className="flex items-start gap-1.5 text-sm text-body">
                <Minus className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" aria-hidden="true" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-rule">
        <div>
          <dt>
            <Kicker as="span">Cartridge life</Kicker>
          </dt>
          <dd className="font-data text-sm text-ink font-medium mt-1">
            {product.filterLife ?? "Not published"}
          </dd>
        </div>
        <div>
          <dt>
            <Kicker as="span">Annual cost</Kicker>
          </dt>
          <dd className="font-data text-sm text-ink font-medium mt-1">
            {typeof product.annualCost === "number"
              ? `£${product.annualCost}/yr`
              : "Not published"}
          </dd>
        </div>
        <div>
          <dt>
            <Kicker as="span">Per litre</Kicker>
          </dt>
          <dd className="font-data text-sm text-ink font-medium mt-1">
            {pencePerLitre(product)}
          </dd>
        </div>
      </dl>

      <div className="flex items-center justify-between gap-4 flex-wrap mt-4 pt-4 border-t border-rule">
        <span className="flex items-center gap-1 text-sm text-muted">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
          {product.rating.toFixed(1)} average rating
        </span>
        <AffiliateLink
          href={product.affiliateUrl}
          pageType={PAGE_TYPE}
          recommendationReason={heading}
          productCategory={product.category}
          productSlug={product.slug}
          placement="guide-review"
          campaign={PAGE_TYPE}
          className="inline-flex items-center gap-1.5 bg-btn text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-btn-hover transition-colors"
        >
          {ctaLabel}
          <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
        </AffiliateLink>
      </div>
      <AffiliateNote className="mt-3" />
    </article>
  );
}

/* ── Page ────────────────────────────────────────────────────────────── */

export default function BestWaterFilterJugGuide() {
  const jugProducts = getProductsByCategory("jug");
  // Shown alongside the jugs in the running-cost table, not as a separate pitch.
  const underSinkProducts = getProductsByCategory("under_sink");
  const brita = jugProducts.find((p) => p.id === "brita-maxtra-pro");
  const zerowater = jugProducts.find((p) => p.id === "zerowater-12cup");
  const aquaOptima = jugProducts.find((p) => p.id === "aqua-optima-evolve");
  const pur = jugProducts.find((p) => p.id === "pur-plus-pitcher");

  const comparisonContaminants = ["Chlorine", "Lead", "PFAS (total)", "Fluoride", "Nitrate", "Mercury"];

  const highlights: Record<string, string> = {
    "zerowater-12cup": "Removal pick: the only jug here listed for PFAS, fluoride, nitrate and arsenic",
    "brita-maxtra-pro": "Taste pick: the UK default, with cartridges in every supermarket",
    "aqua-optima-evolve": "Budget pick: the cheapest to buy and to run",
    "pur-plus-pitcher": "Family pick: NSF/ANSI 53 for lead, two-month cartridges",
  };

  const costRows = [...jugProducts].sort(
    (a, b) => (a.annualCost ?? Infinity) - (b.annualCost ?? Infinity),
  );

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Guides", url: "https://www.tapwater.uk/guides" },
          { name: "Best Water Filter Jug UK", url: URL },
        ]}
      />
      <ArticleSchema
        headline={TITLE}
        description={DESCRIPTION}
        url={URL}
        datePublished="2026-04-05"
        dateModified={new Date().toISOString().split("T")[0]}
        authorName="TapWater.uk Research"
        authorUrl="https://www.tapwater.uk/about"
      />
      <FAQSchema faqs={FAQ_DATA} />

      <div className="max-w-3xl mx-auto">
        <GuideBreadcrumb title="Best Water Filter Jug UK" />

        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          Best Water Filter Jug UK ({year})
        </h1>
        <GuideByline updated={`September ${year}`} />

        <p className="text-lg text-body leading-relaxed">
          A water filter jug is the cheapest change you can make to your tap
          water: no plumbing, no installer, a cartridge you swap once a month.
          It is also the product where the gap between what the box implies
          and what the cartridge is listed to do is widest. Two of the four
          jugs here are taste products that remove chlorine and a few metals.
          One is a removal product certified for PFAS, fluoride and nitrate.
          None of them stops limescale.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          This guide starts with a plain ledger of what each jug does and does
          not remove, set against what is actually in UK water, then covers
          hard water and the kettle, the &ldquo;which BRITA&rdquo; question,
          what each jug costs per litre, and reviews of all four.
        </p>

        <GeoCitation
          headline={`According to TapWater.uk's ${year} comparison, the ZeroWater 12-Cup is the best water filter jug for contaminant removal in the UK, and the BRITA Marella XL with MAXTRA PRO the best for taste.`}
          detail="ZeroWater is the only jug of the four certified to NSF/ANSI 53 and 401 and listed for PFAS. No water filter jug in this guide reduces water hardness."
        />

        <GuideDisclosure />

        {/* ── Ledger ──────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-10 mb-4">
          What a jug removes, and what it does not
        </h2>
        <p className="text-base text-body leading-relaxed mb-6">
          Every tick below is a removal the maker lists for that cartridge.
          Where a cell is empty, the maker does not claim it, which for BRITA
          and PUR on PFAS is something they state outright. The right-hand
          note says whether the contaminant is even a question in UK mains
          water.
        </p>
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm border-collapse min-w-[640px]">
            <caption className="sr-only">
              Contaminants each water filter jug lists, with UK context
            </caption>
            <thead>
              <tr className="border-b border-rule text-left">
                <th className="py-2.5 pr-3 text-xs font-medium text-muted">Contaminant</th>
                {jugProducts.map((p) => (
                  <th
                    key={p.id}
                    className="py-2.5 px-2 text-xs font-medium text-muted text-center whitespace-nowrap"
                  >
                    {p.brand}
                  </th>
                ))}
                <th className="py-2.5 pl-3 text-xs font-medium text-muted">In UK water</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {LEDGER_ROWS.map((row) => (
                <tr key={row.name}>
                  <td className="py-3 pr-3 font-medium text-ink whitespace-nowrap align-top">
                    {row.name}
                  </td>
                  {jugProducts.map((p) => (
                    <td key={p.id} className="py-3 px-2 text-center align-top">
                      {lists(p, row.name) ? (
                        <Check className="w-4 h-4 text-safe mx-auto" aria-label={`${p.brand} lists ${row.name}`} />
                      ) : (
                        <X className="w-4 h-4 text-faint mx-auto" aria-label={`${p.brand} does not list ${row.name}`} />
                      )}
                    </td>
                  ))}
                  <td className="py-3 pl-3 text-body align-top">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="mt-5 space-y-2">
          {NOT_LISTED_BY_ANY.map((line) => (
            <li key={line} className="flex items-start gap-2.5 text-base text-body">
              <X className="w-4 h-4 text-warning shrink-0 mt-1" aria-hidden="true" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
        <p className="text-base text-body leading-relaxed mt-6">
          Three things stand out. Chlorine, the reason most people buy a jug,
          is listed by BRITA, Aqua Optima and PUR; ZeroWater&apos;s listing is
          built around metals and PFAS instead. Lead is listed by all four,
          but only PUR and ZeroWater carry the NSF/ANSI 53 certification that
          covers it, which matters if lead is your reason for buying. And PFAS,
          fluoride, nitrate and arsenic are ZeroWater alone. If your postcode
          flags any of those, the other three jugs are the wrong purchase.
        </p>

        {/* ── Quick picks ─────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Quick picks
        </h2>
        <div className="card-elevated rounded-2xl p-6 lg:p-8">
          <div className="space-y-4">
            {zerowater && (
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-rule">
                <div>
                  <Kicker accent>Removal pick</Kicker>
                  <p className="font-display text-lg italic text-ink mt-1">
                    {zerowater.brand} {zerowater.model}
                  </p>
                  <p className="text-sm text-muted mt-1">
                    NSF/ANSI 53 and 401 certified; the only jug here listed for
                    PFAS, fluoride, nitrate and arsenic. Highest running cost.
                  </p>
                </div>
                <TypicalPrice priceGbp={zerowater.priceGbp} size="sm" />
              </div>
            )}
            {brita && (
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-rule">
                <div>
                  <Kicker accent>Taste pick</Kicker>
                  <p className="font-display text-lg italic text-ink mt-1">
                    {brita.brand} {brita.model}
                  </p>
                  <p className="text-sm text-muted mt-1">
                    3.5 litres, MAXTRA PRO cartridges in every supermarket,
                    listed for chlorine and four metals
                  </p>
                </div>
                <TypicalPrice priceGbp={brita.priceGbp} size="sm" />
              </div>
            )}
            {aquaOptima && (
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-rule">
                <div>
                  <Kicker accent>Budget pick</Kicker>
                  <p className="font-display text-lg italic text-ink mt-1">
                    {aquaOptima.brand} {aquaOptima.model}
                  </p>
                  <p className="text-sm text-muted mt-1">
                    Cheapest to buy and run; Evolve+ cartridges also fit BRITA
                    jugs
                  </p>
                </div>
                <TypicalPrice priceGbp={aquaOptima.priceGbp} size="sm" />
              </div>
            )}
            {pur && (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Kicker accent>Family pick</Kicker>
                  <p className="font-display text-lg italic text-ink mt-1">
                    {pur.brand} {pur.model}
                  </p>
                  <p className="text-sm text-muted mt-1">
                    NSF/ANSI 42 and 53 certified for lead, 11 cups, two-month
                    cartridges
                  </p>
                </div>
                <TypicalPrice priceGbp={pur.priceGbp} size="sm" />
              </div>
            )}
          </div>
          <AffiliateNote className="mt-5" withFundingLink />
        </div>

        {/* ── Postcode ────────────────────────────────────────────── */}
        <div className="mt-10 card-elevated p-8 text-center rounded-2xl">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-accent-light flex items-center justify-center">
              <Search className="w-6 h-6 text-accent" aria-hidden="true" />
            </div>
          </div>
          <h3 className="font-display text-xl italic text-ink">
            Find out which jug your water needs
          </h3>
          <p className="text-base text-muted mt-2 max-w-md mx-auto">
            We hold the readings your water company reports for your supply
            zone. If nothing but chlorine shows up, a BRITA or Aqua Optima is
            enough. If PFAS, nitrate or lead is flagged, you want ZeroWater or
            something bigger than a jug.
          </p>
          <div className="mt-6 max-w-sm mx-auto">
            <PostcodeSearch />
          </div>
        </div>

        {/* ── Hard water ──────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Hard water, limescale and the kettle
        </h2>
        <p className="text-base text-body leading-relaxed">
          &ldquo;Best water filter jug for hard water&rdquo; is a search with
          a disappointing answer: there is not one. Hardness is dissolved
          calcium and magnesium, and none of the four cartridges here lists
          hardness or limescale as something it reduces. A BRITA-filtered
          kettle in Hertfordshire furs up almost as fast as an unfiltered one.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          ZeroWater is the partial exception, and it is worth being precise
          about why. Its five-stage cartridge reduces total dissolved solids,
          which is why it ships with a TDS meter to prove it and why ZeroWater
          say the filters last only two to three weeks in hard water: the
          minerals use the cartridge up. So a ZeroWater jug will put less
          scale-forming mineral in your kettle than the other three, but
          ZeroWater sells it as a contaminant filter and makes no limescale
          claim, and at roughly £120 a year it is an expensive way to descale.
        </p>
        <dl className="border-y border-rule divide-y divide-rule mt-6">
          {[
            {
              who: "You want chlorine out and a cleaner kettle, in a hard water area",
              pick: "Two purchases, not one. A taste jug for the drinking water, and a kettle built for hard water, with a removable scale filter or a design that sheds scale, for the boiling. Our kettle guide covers the second.",
              href: "/guides/best-kettle-for-hard-water-uk/",
              label: "Best kettle for hard water UK",
            },
            {
              who: "Scale on every tap, the shower screen and the boiler",
              pick: "That is a whole-house problem and a jug treats one litre at a time. Check the reading at your postcode; at 200 mg/L or more, an ion exchange softener is the thing that fixes it.",
              href: "/guides/do-i-need-a-water-softener/",
              label: "Do I need a water softener?",
            },
            {
              who: "You just want the tea to taste better",
              pick: "Any of the three taste jugs. Hardness affects tea flavour, but chlorine is the taste most people notice, and a jug removes it for a few pence a litre.",
              href: null,
              label: null,
            },
          ].map((row) => (
            <div key={row.who} className="py-4 sm:grid sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-6">
              <dt className="text-base font-medium text-ink">{row.who}</dt>
              <dd className="text-base text-body leading-relaxed mt-1 sm:mt-0">
                {row.pick}
                {row.href && row.label && (
                  <>
                    {" "}
                    <Link href={row.href} className="text-accent hover:underline">
                      {row.label}
                    </Link>
                    .
                  </>
                )}
              </dd>
            </div>
          ))}
        </dl>

        {/* ── Which BRITA ─────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Which BRITA jug is best?
        </h2>
        <p className="text-base text-body leading-relaxed">
          The most common jug question in Britain, and the answer is that it
          barely matters. The filtering is done by the cartridge, and current
          BRITA jugs take the same MAXTRA PRO cartridge, so the water out of a
          small fridge-door jug and a large family jug is the same water. The
          jug decides capacity, whether it fits your fridge, and how often you
          refill. The one we list, the{" "}
          <strong className="text-ink">Marella XL</strong>, holds 3.5 litres,
          which suits a household of up to four, and it is the size we would
          pick for a family kitchen. A one-person flat can go smaller.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          Two things to know before buying any BRITA. MAXTRA PRO is rated for
          four weeks and works out at roughly £52 a year, and it is listed for
          chlorine, lead, copper, mercury and cadmium with TUV SUD testing,
          not for PFAS, fluoride or nitrate, which BRITA state themselves. And
          if the running cost is what bothers you, the Aqua Optima Evolve+
          cartridge is BRITA-compatible and works out at about £36 a year, so
          a BRITA jug can be run on cheaper cartridges with a similar removal
          list.
        </p>

        {/* ── Cost per litre ──────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          What each jug costs per litre
        </h2>
        <p className="text-base text-body leading-relaxed mb-6">
          The jug price is close to irrelevant; the cartridge habit is the
          cost. The per-litre figures below divide each maker&apos;s annual
          cartridge cost by {LITRES_PER_YEAR.toLocaleString("en-GB")} litres,
          which is {LITRES_PER_DAY} litres a day of drinking and kettle water
          for a small household. Filter more and the pence per litre falls, up
          to the point where the cartridge is spent early.
        </p>
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm border-collapse min-w-[520px]">
            <caption className="sr-only">Water filter jug running cost per litre</caption>
            <thead>
              <tr className="border-b border-rule text-left">
                <th className="py-2.5 pr-3 text-xs font-medium text-muted">Jug</th>
                <th className="py-2.5 px-3 text-xs font-medium text-muted">Cartridge life</th>
                <th className="py-2.5 px-3 text-xs font-medium text-muted text-right">Per year</th>
                <th className="py-2.5 pl-3 text-xs font-medium text-muted text-right whitespace-nowrap">
                  Per litre at {LITRES_PER_DAY} L/day
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {costRows.map((p) => (
                <tr key={p.id}>
                  <td className="py-3 pr-3 align-top">
                    <AffiliateLink
                      href={p.affiliateUrl}
                      pageType={PAGE_TYPE}
                      recommendationReason="cost-per-litre"
                      productCategory={p.category}
                      productSlug={p.slug}
                      placement="cost-per-litre-table"
                      campaign={PAGE_TYPE}
                      className="font-medium text-ink hover:text-accent"
                    >
                      {p.brand} {p.model}
                    </AffiliateLink>
                  </td>
                  <td className="py-3 px-3 text-body align-top">{p.filterLife ?? "Not published"}</td>
                  <td className="py-3 px-3 font-data text-ink text-right tabular-nums align-top">
                    {typeof p.annualCost === "number" ? `£${p.annualCost}` : "Not published"}
                  </td>
                  <td className="py-3 pl-3 font-data text-ink font-medium text-right tabular-nums align-top">
                    {pencePerLitre(p)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <AffiliateNote className="mt-3" />
        <p className="text-base text-body leading-relaxed mt-6">
          Even the dearest jug is a fraction of bottled water per litre. The
          more useful comparison is with an under-sink filter, which costs
          more on the shelf and less to live with once cartridges are counted;
          the five-year table further down puts them side by side.
        </p>

        {/* ── Reviews ─────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          The four water filter jugs worth buying in the UK
        </h2>
        <p className="text-base text-body leading-relaxed mb-6">
          Three taste jugs with different price points and one removal jug.
          Every removal claim below is the maker&apos;s own listing.
        </p>

        <div className="space-y-4 mb-8">
          {jugProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              pageType={PAGE_TYPE}
              placement="guide-card"
              highlight={highlights[product.id]}
            />
          ))}
        </div>

        <div className="space-y-8">
          {zerowater && (
            <ProductReview
              product={zerowater}
              heading="ZeroWater 12-Cup Ready-Pour: removal pick"
              verdict="The only jug here certified for health contaminants and listed for PFAS. You pay for it in cartridges."
              review="The ZeroWater 12-Cup is the jug to buy if you want something removed rather than the water to taste nicer. It is certified to NSF/ANSI 53 and 401 and listed for lead, chromium, mercury, PFAS, fluoride, nitrate, arsenic and cadmium: a longer list than some under-sink filters. The five-stage cartridge reduces dissolved solids as it goes, and the TDS meter in the box lets you check that it is still working, which no other jug offers. The trade-offs are real. Cartridges last two to four weeks, and only two to three in hard water, so the running cost is around £120 a year, the highest here by a wide margin. A full jug takes five minutes or more to filter, and replacement cartridges cost more than the competition. If your postcode flags PFAS, nitrate or lead, none of that matters much, because it is the only jug that addresses them."
              pros={zerowater.pros}
              cons={zerowater.cons}
              ctaLabel="View on Amazon"
            />
          )}

          {brita && (
            <ProductReview
              product={brita}
              heading="BRITA Marella XL with MAXTRA PRO: taste pick"
              verdict="The UK default for a reason: chlorine gone, 3.5 litres, cartridges everywhere."
              review="The BRITA Marella XL is the jug most British kitchens already have, and it does the taste job well. MAXTRA PRO is listed for chlorine, lead, copper, mercury and cadmium with TUV SUD testing, it filters quickly, and the 3.5 litre capacity suits a family of up to four. Cartridges are in every supermarket, rated for four weeks, and work out at roughly £52 a year. Be clear about what it is not: BRITA say it does not remove PFAS, fluoride or nitrates, so if your postcode flags any of those, this is not the jug. It is also the largest jug here, which is good for a family and bad for fridge space. For a household whose only complaint is the chlorine taste, it is the sensible buy."
              pros={brita.pros}
              cons={brita.cons}
              ctaLabel="View on Amazon"
            />
          )}

          {aquaOptima && (
            <ProductReview
              product={aquaOptima}
              heading="Aqua Optima Liscia with Evolve+: budget pick"
              verdict="The cheapest jug to buy and to run, with a cartridge that also fits BRITA jugs."
              review="At around £20 for the jug and about £36 a year in Evolve+ cartridges, the Aqua Optima Liscia is the lowest-cost route into filtered water here. The removal list is the taste list, chlorine, lead, copper and mercury, with TUV SUD testing, so it does a similar job to BRITA for less. The Evolve+ cartridge is BRITA-compatible, which means you can run an existing BRITA jug on these and cut the running cost. The slim design fits a fridge door. The compromises are capacity, at 2.4 litres filtered, which is small for a family, and a lid that can leak if it is not seated properly. For one or two people who want chlorine out at the lowest possible cost, it is hard to argue with."
              pros={aquaOptima.pros}
              cons={aquaOptima.cons}
              ctaLabel="View on Amazon"
            />
          )}

          {pur && (
            <ProductReview
              product={pur}
              heading="PUR Plus 11-Cup Pitcher: family pick"
              verdict="Certified lead removal, the longest cartridge life here, and a light that tells you when to change it."
              review="The PUR Plus is the jug for a bigger household that wants a certification behind the lead claim. It carries NSF/ANSI 42 and 53, the second of which covers lead, and lists chlorine, lead, mercury, cadmium and copper. The 11-cup capacity is large, the cartridge is rated for two months, the longest here, so around £60 a year, and the indicator light on the lid takes the guesswork out of changing it. Two limits: it does not list PFAS or fluoride, which PUR state, and a full jug takes ten minutes or more to filter, the slowest here. Replacement cartridges are also harder to find in UK shops than BRITA's, so order them online rather than expecting to pick one up. For a family in an older house with lead pipes, it is the jug we would choose."
              pros={pur.pros}
              cons={pur.cons}
              ctaLabel="View on Amazon"
            />
          )}
        </div>

        {/* ── Comparison ──────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Side by side
        </h2>
        <p className="text-base text-muted mb-6">
          Listed removals, typical price and annual cartridge cost from the
          makers&apos; own specifications. None of the four reduces hardness.
        </p>
        <div className="card p-4 lg:p-6">
          <ProductComparisonTable
            pageType={PAGE_TYPE}
            campaign={PAGE_TYPE}
            products={jugProducts}
            contaminants={comparisonContaminants}
          />
          <AffiliateNote className="mt-4" />
        </div>

        {/* Under-sink units sit in the same table so the reader sees the five-year
            totals side by side rather than being told a jug is a false economy. */}
        <RunningCostComparison
          products={[...jugProducts, ...underSinkProducts]}
          pageType={PAGE_TYPE}
          campaign={PAGE_TYPE}
        />
        <p className="text-sm text-muted mt-3">
          The under-sink filters need fitting under the kitchen sink; the jugs
          need nothing. Our{" "}
          <Link href="/guides/best-under-sink-water-filter-uk/" className="text-accent hover:underline">
            under sink filter guide
          </Link>{" "}
          covers when that step up is worth it.
        </p>

        {/* ── Verdict ─────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Our verdict
        </h2>
        <p className="text-base text-body leading-relaxed">
          Buy the <strong className="text-ink">ZeroWater 12-Cup</strong> if
          your postcode flags PFAS, nitrate or lead, or you simply want a jug
          whose removal claims are certified to NSF/ANSI 53 and 401. Budget
          around £120 a year in cartridges and accept the slow pour.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          Buy the <strong className="text-ink">BRITA Marella XL</strong> if
          chlorine taste is the whole problem and you want cartridges you can
          pick up with the shopping. Buy the{" "}
          <strong className="text-ink">Aqua Optima Liscia</strong> for the same
          job at the lowest cost, or run its Evolve+ cartridge in the BRITA you
          already own. Buy the <strong className="text-ink">PUR Plus</strong>{" "}
          if you have a big household and want NSF/ANSI 53 lead certification
          without ZeroWater&apos;s cartridge bill.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          Buy none of them for limescale. A jug does not soften water; the
          kettle guide and the softener guides are where that problem gets
          solved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          {zerowater && (
            <AffiliateLink
              href={zerowater.affiliateUrl}
              pageType={PAGE_TYPE}
              recommendationReason="verdict"
              productCategory={zerowater.category}
              productSlug={zerowater.slug}
              placement="guide-verdict"
              campaign={PAGE_TYPE}
              className="inline-flex items-center justify-center gap-2 bg-btn text-white rounded-lg px-6 py-3 text-sm font-medium hover:bg-btn-hover transition-colors"
            >
              View the ZeroWater 12-Cup on Amazon
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </AffiliateLink>
          )}
          {brita && (
            <AffiliateLink
              href={brita.affiliateUrl}
              pageType={PAGE_TYPE}
              recommendationReason="verdict"
              productCategory={brita.category}
              productSlug={brita.slug}
              placement="guide-verdict"
              campaign={PAGE_TYPE}
              className="inline-flex items-center justify-center gap-2 border border-rule text-ink rounded-lg px-6 py-3 text-sm font-medium hover:bg-wash transition-colors"
            >
              View the BRITA Marella XL on Amazon
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </AffiliateLink>
          )}
        </div>
        <AffiliateNote className="mt-3" withFundingLink />

        <GuideFaq faqs={FAQ_DATA} />

        {/* ── Related ─────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Related guides
        </h2>
        <ul className="space-y-2">
          {[
            ["/guides/best-kettle-for-hard-water-uk/", "Best kettle for hard water UK, for the limescale a jug leaves"],
            ["/guides/do-i-need-a-water-softener/", "Do I need a water softener?"],
            ["/guides/best-water-filter-pfas/", "Best water filter for PFAS, when a jug is not enough"],
            ["/guides/lead-pipes-uk/", "Lead pipes in UK homes"],
            ["/guides/best-under-sink-water-filter-uk/", "Best under sink water filter UK"],
            ["/filters/water-filter-jugs/", "All water filter jugs we review"],
          ].map(([href, label]) => (
            <li key={href}>
              <Link
                href={href}
                className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
              >
                <ArrowRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <GuideFooter reviewed={`September ${year}`}>
          Removal claims, certifications and cartridge intervals are taken from
          the makers&apos; published specifications; per-litre figures are our
          arithmetic on those intervals at {LITRES_PER_DAY} litres a day. We
          earn a commission on purchases made through affiliate links at no
          extra cost to you.{" "}
          <Link
            href="/affiliate-disclosure"
            className="underline underline-offset-2 hover:text-muted transition-colors"
          >
            Affiliate disclosure
          </Link>
          .{" "}
        </GuideFooter>
      </div>
    </div>
  );
}
