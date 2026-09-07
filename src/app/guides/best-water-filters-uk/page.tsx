import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Minus, Search, X } from "lucide-react";
import { PostcodeSearch } from "@/components/postcode-search";
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
import {
  CATEGORY_META,
  getProductBySlug,
  getProductsByCategory,
} from "@/lib/products";
import type { FilterProduct, ProductCategory } from "@/lib/types";
import { OG_IMAGE } from "@/lib/og";

export const revalidate = 86400;

const year = new Date().getFullYear();
const SLUG = "best-water-filters-uk";
const URL = `https://www.tapwater.uk/guides/${SLUG}`;
const PAGE_TYPE = "best-water-filters-guide";
const TITLE = `Best Water Filter UK (${year}): Picks by Need & Type`;
const DESCRIPTION =
  "The best water filter for UK tap water depends on what is in yours. Picks by need, every filter type compared, real running costs, and a postcode check.";

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

/* ── FAQ (rendered visibly and fed to FAQSchema) ────────────────────── */

const FAQ_DATA = [
  {
    question: "What is the best water filter in the UK?",
    answer:
      "For most UK homes that want one filter to cover everything in drinking water, the Waterdrop G3P600 reverse osmosis system is the best water filter we have compared. It is certified to NSF/ANSI 58 and 372, lists 12 contaminants including PFAS, fluoride, lead and nitrate, and costs around £550 plus about £80 a year in filters. If you cannot plumb anything in, the Osmio Zero 2.0 is a countertop RO unit that plugs into a socket. If you only want chlorine taste gone, a £25 BRITA Marella XL jug does that for about £52 a year. The right answer depends on what is in your water, which you can check by postcode on this page.",
  },
  {
    question: "What is the best water filter system for a home?",
    answer:
      "It depends on how many taps you want treated. For drinking water at the kitchen sink, an under-sink filter such as the Doulton HIP Ultracarb (NSF/ANSI 42 and 53, around £120) or a reverse osmosis system such as the Waterdrop G3P600 gives the best result per litre. For every tap, shower and appliance, a whole house filter fitted on the incoming main is the route: the Osmio PRO-III Ultimate (around £499) is the one we rate, with the BWT E1 (around £250) as the value pick for sediment. No whole house filter in our catalogue softens water, so a hard water home usually adds a softener alongside it.",
  },
  {
    question: "Do I need a water filter in the UK?",
    answer:
      "Not for safety. UK mains water meets the Drinking Water Inspectorate's standards at the tap, so nobody on a public supply needs a filter to make it safe to drink. People buy one for taste and smell (chlorine is in every mains supply), for lead from old pipes in pre-1970 homes, for PFAS where it has been detected locally, or for peace of mind. Check your postcode first: if nothing is flagged in your area, a filter is optional and a cheap jug covers taste.",
  },
  {
    question: "What is the difference between a water filter and a water purifier?",
    answer:
      "In UK shops the words are used loosely and often mean the same product. Strictly, a filter removes some contaminants by passing water through a material such as carbon, ceramic or a membrane, while a purifier is a system that removes or kills a very wide range including bacteria and viruses. In practice, reverse osmosis systems and ceramic filters such as the Doulton HIP Ultracarb (listed for bacteria) do what most people mean by purifier, and a carbon jug is a filter for taste and a few metals. Ignore the label and read the removal list and certifications instead.",
  },
  {
    question: "Which water filter removes the most contaminants?",
    answer:
      "Reverse osmosis. Of everything in our catalogue, the Waterdrop G3P600 lists the most contaminants at 12, including PFAS, fluoride, lead, arsenic, nitrate, chlorine, trihalomethanes, mercury, cadmium, chromium, copper and nickel, and it is certified to NSF/ANSI 58. The Osmio Fusion and Zero units list a similar spread including bacteria and limescale, but without a stated NSF or WRAS certification. Among jugs, the ZeroWater 12-Cup lists eight contaminants including PFAS and fluoride, certified to NSF/ANSI 53 and 401.",
  },
  {
    question: "Are water filters worth it in the UK?",
    answer:
      "Worth it for taste, yes, at almost any budget: a £20 to £25 jug removes chlorine for £36 to £52 a year in cartridges. Worth it for health depends on your water. If your postcode shows lead, PFAS or nitrate flagged, a certified under-sink or reverse osmosis system is a sensible purchase. If your problem is limescale, no filter is worth it, because filters do not soften water; you want a water softener or a kettle designed for hard water. Count the running cost as well as the price: over five years a £40 jug can cost more to own than a £75 under-sink filter.",
  },
  {
    question: "What is the best water filter for hard water in the UK?",
    answer:
      "A filter is the wrong product for hard water. Hardness is dissolved calcium and magnesium, and carbon, ceramic and tap filters leave it in the water, so limescale carries on forming. To stop scale across the whole house you need an ion exchange water softener, typically £800 to £3,000 installed. For a single kettle, the Russell Hobbs BRITA Purity kettle reduces temporary hardness before the water boils. Reverse osmosis units do list limescale removal, but only for the drinking tap they feed. Our water softener guide and kettle guide cover both routes.",
  },
  {
    question: "How much does a home water filter system cost in the UK?",
    answer:
      "From our catalogue: water filter jugs cost £20 to £40 with cartridges of £36 to £120 a year; tap-mounted filters £30 to £60; under-sink filters £45 to £120 with £30 to £80 a year in cartridges; reverse osmosis systems £329 to £499 for the unit, with the Waterdrop G3P600 at around £550, and £70 to £130 a year in filters; whole house filters £250 to £499 plus fitting, with running costs from nothing (the BWT E1 backwashes itself) to around £188 a year; shower filters £25 to £85. A water softener is a different product at £800 to £3,000 installed.",
  },
];

/* ── Picks by need ──────────────────────────────────────────────────── */

interface NeedPick {
  need: string;
  slug: string | null;
  why: string;
  guide: { href: string; label: string };
  /** A need where the honest answer is a different product entirely. */
  redirect?: string;
}

const NEEDS: NeedPick[] = [
  {
    need: "Best overall",
    slug: "waterdrop-g3p600",
    why: "Certified to NSF/ANSI 58 and 372 and listed for 12 contaminants, including PFAS, fluoride, lead and nitrate. The widest coverage of anything we compare.",
    guide: { href: "/guides/best-reverse-osmosis-system-uk", label: "Reverse osmosis guide" },
  },
  {
    need: "Best for hard water and limescale",
    slug: null,
    redirect:
      "No filter here softens water. Limescale is calcium and magnesium, and carbon, ceramic and tap filters leave them in. You want a water softener for the whole house, or a kettle built for hard water if the kettle is the only problem.",
    why: "",
    guide: { href: "/guides/best-water-softener-uk", label: "Water softener guide" },
  },
  {
    need: "Best for PFAS",
    slug: "waterdrop-g3p600",
    why: "NSF/ANSI 58 reverse osmosis is the certified route for PFAS. The ZeroWater 12-Cup jug is the cheapest certified option, at NSF/ANSI 53 and 401.",
    guide: { href: "/guides/best-water-filter-pfas", label: "PFAS filter guide" },
  },
  {
    need: "Best budget jug",
    slug: "brita-marella-xl",
    why: "TUV SUD tested, listed for chlorine, lead, copper, mercury and cadmium. Around £25 to buy and £52 a year in MAXTRA PRO cartridges.",
    guide: { href: "/guides/best-water-filter-jug-uk", label: "Water filter jug guide" },
  },
  {
    need: "Best under sink",
    slug: "doulton-hip-ultracarb",
    why: "British-made ceramic with NSF/ANSI 42 and 53 certification, listed for bacteria, lead, chlorine and microplastics. The Waterdrop 10UA is the £75 budget route.",
    guide: { href: "/guides/best-under-sink-water-filter-uk", label: "Under sink filter guide" },
  },
  {
    need: "Best reverse osmosis without plumbing",
    slug: "osmio-zero",
    why: "The only RO unit we compare that plugs into a socket. Listed for chlorine, lead, bacteria, nitrate, fluoride and limescale, and it dispenses hot as well as cold.",
    guide: { href: "/guides/best-reverse-osmosis-system-uk", label: "Reverse osmosis guide" },
  },
  {
    need: "Best whole house",
    slug: "osmio-pro-iii-ultimate",
    why: "NSF/ANSI 42 and 61 certified with WaterMark approval, and the only whole house unit here listed for bacteria, nitrates and heavy metals as well as chlorine.",
    guide: { href: "/guides/best-whole-house-water-filter-uk", label: "Whole house filter guide" },
  },
  {
    need: "Best shower filter",
    slug: "jolie-filtered-showerhead",
    why: "KDF-55 and calcium sulphite media listed for chlorine, chloramine and heavy metals. A shower filter does not reduce limescale.",
    guide: { href: "/guides/best-shower-filter-uk", label: "Shower filter guide" },
  },
  {
    need: "Best for renters",
    slug: "tapp-water-ecopro",
    why: "Screws onto the tap and comes off when you leave. Listed for chlorine, lead, microplastics and PFAS, though SGS tested rather than NSF certified. The Osmio Zero above is the no-plumbing step up.",
    guide: { href: "/guides/best-water-filter-tap-uk", label: "Tap filter guide" },
  },
];

/* ── Decision table ─────────────────────────────────────────────────── */

interface TypeRow {
  type: string;
  category: ProductCategory | null;
  removes: string;
  install: string;
  /** Used only when the catalogue has no products to compute from. */
  running?: string;
  href: string;
}

const TYPE_ROWS: TypeRow[] = [
  {
    type: "Jug",
    category: "jug",
    removes: "Chlorine and taste; some metals. ZeroWater adds PFAS and fluoride.",
    install: "None. Fill and pour.",
    href: "/guides/best-water-filter-jug-uk",
  },
  {
    type: "Tap-mounted",
    category: "countertop",
    removes: "Chlorine and lead; TAPP EcoPro lists microplastics and PFAS.",
    install: "Screws onto the tap in minutes. Not for pull-out spray taps.",
    href: "/guides/best-water-filter-tap-uk",
  },
  {
    type: "Under-sink",
    category: "under_sink",
    removes: "Chlorine, lead, microplastics; ceramic units add bacteria.",
    install: "DIY push-fit for the Waterdrop; a separate filtered tap or a 3-way tap.",
    href: "/guides/best-under-sink-water-filter-uk",
  },
  {
    type: "Reverse osmosis",
    category: "reverse_osmosis",
    removes: "The widest list: PFAS, fluoride, lead, nitrate, arsenic and more.",
    install: "Plumbed under the sink, usually by a plumber. The Osmio Zero plugs in instead.",
    href: "/guides/best-reverse-osmosis-system-uk",
  },
  {
    type: "Whole house",
    category: "whole_house",
    removes: "Chlorine and sediment at every tap; the Osmio adds bacteria, lead and nitrates.",
    install: "Cut into the incoming main by a plumber.",
    href: "/guides/best-whole-house-water-filter-uk",
  },
  {
    type: "Shower",
    category: "shower",
    removes: "Chlorine and chloramine. Not limescale.",
    install: "Screws onto the shower arm.",
    href: "/guides/best-shower-filter-uk",
  },
  {
    type: "Water softener",
    category: "water_softener",
    removes: "Hardness only: calcium and magnesium, so no more limescale. Not a filter.",
    install: "Fitted on the incoming main by an installer.",
    running: "Salt top-ups",
    href: "/guides/best-water-softener-uk",
  },
];

/** The lowest and highest published annual cartridge cost in a category. */
function runningCostRange(category: ProductCategory): string | null {
  const costs = getProductsByCategory(category)
    .map((p) => p.annualCost)
    .filter((c): c is number => typeof c === "number");
  if (costs.length === 0) return null;
  const lo = Math.min(...costs);
  const hi = Math.max(...costs);
  if (lo === hi) return lo === 0 ? "Nothing to replace" : `£${lo}/yr`;
  return `£${lo}–£${hi}/yr`;
}

/* ── What UK water contains ─────────────────────────────────────────── */

const IN_YOUR_WATER: { name: string; href: string; body: string; fix: string }[] = [
  {
    name: "Chlorine",
    href: "/contaminant/chlorine",
    body: "Every UK mains supply is chlorinated to keep it safe in the pipes. It is the swimming-pool taste and smell, and the most common reason anyone buys a filter.",
    fix: "Any carbon filter, from a £20 jug up, removes it. A shower filter does the same in the bathroom.",
  },
  {
    name: "Hardness",
    href: "/hardness",
    body: "Roughly 60% of England receives hard or very hard water. It is not a health problem, but it furs up kettles, boilers and shower screens.",
    fix: "Not a filter job. A softener treats the whole house; a filter kettle treats the kettle; reverse osmosis treats one drinking tap.",
  },
  {
    name: "Lead",
    href: "/contaminant/lead",
    body: "The water company's network is lead-free. What reaches the tap in homes built before 1970 comes from the supply pipe and internal plumbing that was never replaced.",
    fix: "A filter certified to NSF/ANSI 53 for lead at the kitchen tap, or replacing the pipe. A whole house filter sits upstream of most of the problem.",
  },
  {
    name: "PFAS",
    href: "/contaminant/pfas",
    body: "The so-called forever chemicals. Detected in some UK supplies and catchments, but monitoring is patchy, so the honest position for most postcodes is uncertainty rather than a clean bill.",
    fix: "Reverse osmosis certified to NSF/ANSI 58, or a jug certified to NSF/ANSI 401. Ordinary carbon jugs and whole house filters are not certified for it.",
  },
  {
    name: "Nitrate",
    href: "/contaminant/nitrate",
    body: "Runs off farmland into rivers and groundwater, so readings are highest in arable areas of eastern and southern England.",
    fix: "Reverse osmosis, or the ZeroWater jug. Carbon filters do not remove it.",
  },
];

/* ── Page ────────────────────────────────────────────────────────────── */

export default function BestWaterFiltersGuide() {
  const picks = NEEDS.map((need) => ({
    ...need,
    product: need.slug ? getProductBySlug(need.slug) : undefined,
  })).filter((pick) => !pick.slug || pick.product?.availableInUk !== false);

  const featured = [
    { slug: "waterdrop-g3p600", highlight: "Best overall: the widest certified removal list we compare" },
    { slug: "osmio-zero", highlight: "Best without plumbing: reverse osmosis that plugs into a socket" },
    { slug: "brita-marella-xl", highlight: "Best budget jug: chlorine and taste for £52 a year" },
    { slug: "osmio-pro-iii-ultimate", highlight: "Best whole house: every tap and shower from one fitting" },
  ]
    .map((f) => ({ ...f, product: getProductBySlug(f.slug) }))
    .filter((f): f is typeof f & { product: FilterProduct } => !!f.product && f.product.availableInUk !== false);

  const categoryPicks = [
    "zerowater-12-cup",
    "tapp-water-ecopro",
    "doulton-hip-ultracarb",
    "waterdrop-g3p600",
    "osmio-zero",
    "osmio-pro-iii-ultimate",
    "jolie-filtered-showerhead",
  ]
    .map((slug) => getProductBySlug(slug))
    .filter((p): p is FilterProduct => !!p && p.availableInUk !== false);

  const drinkingWaterPicks = [
    "brita-marella-xl",
    "zerowater-12-cup",
    "tapp-water-ecopro",
    "waterdrop-10ua",
    "doulton-hip-ultracarb",
    "waterdrop-g3p600",
    "osmio-zero",
  ]
    .map((slug) => getProductBySlug(slug))
    .filter((p): p is FilterProduct => !!p && p.availableInUk !== false);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Guides", url: "https://www.tapwater.uk/guides" },
          { name: "Best Water Filter UK", url: URL },
        ]}
      />
      <ArticleSchema
        headline={TITLE}
        description={DESCRIPTION}
        url={URL}
        datePublished="2026-04-02"
        dateModified={new Date().toISOString().split("T")[0]}
        authorName="TapWater.uk Research"
        authorUrl="https://www.tapwater.uk/about"
      />
      <FAQSchema faqs={FAQ_DATA} />

      <div className="max-w-3xl mx-auto">
        <GuideBreadcrumb title="Best Water Filter UK" />

        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          Best Water Filter UK ({year})
        </h1>
        <GuideByline updated={`September ${year}`} />

        {/* ── The answer ───────────────────────────────────────────── */}
        <p className="text-lg text-body leading-relaxed">
          There is no single best water filter for the UK, because there is no
          single UK tap water. A house in Kent gets very hard water; a flat in
          Glasgow gets soft. A Victorian terrace may still have a lead supply
          pipe; a new build will not. PFAS has been found in some catchments and
          barely monitored in others. The right filter is the one that removes
          what is actually in your water, and nothing you do not need to pay
          for. We hold the readings your water company reports for your supply
          zone, so the fastest route to the answer is your postcode.
        </p>

        <div className="mt-6 card-elevated rounded-2xl p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-accent-light flex items-center justify-center shrink-0">
              <Search className="w-5 h-5 text-accent" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-xl italic text-ink">
                Start with what is in your water
              </h2>
              <p className="text-sm text-muted mt-1 max-w-lg">
                Chlorine, hardness, lead, nitrate, PFAS and more, from your
                supplier&apos;s own compliance data. Then come back to the picks.
              </p>
              <div className="mt-4 max-w-sm">
                <PostcodeSearch size="sm" />
              </div>
            </div>
          </div>
        </div>

        <GeoCitation
          headline={`According to TapWater.uk's ${year} comparison across 2,800 UK postcode districts, the Waterdrop G3P600 is the best water filter for UK homes that want one system to cover PFAS, fluoride, lead and nitrate, with the BRITA Marella XL the best budget jug and the Osmio Zero 2.0 the best reverse osmosis unit that needs no plumbing.`}
          detail="Every UK mains supply is chlorinated, which any carbon filter removes. No water filter in this guide reduces water hardness; limescale needs a softener."
        />

        <GuideDisclosure />

        {/* ── Picks by need ────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-10 mb-3">
          Our picks by need
        </h2>
        <p className="text-base text-body leading-relaxed mb-6">
          Find the line that describes your problem. Each pick is the product
          we rate in that category, with the reason in one sentence and a link
          to the full guide. Prices are typical and the retailer sets the final
          figure.
        </p>

        <dl className="border-y border-rule divide-y divide-rule">
          {picks.map((pick) => (
            <div key={pick.need} className="py-5 sm:grid sm:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] sm:gap-6">
              <dt>
                <p className="font-display text-lg italic text-ink leading-snug">{pick.need}</p>
                {pick.product ? (
                  <p className="text-sm font-medium text-ink mt-1">
                    {pick.product.brand} {pick.product.model}
                  </p>
                ) : (
                  <p className="text-sm font-medium text-warning mt-1">
                    Not a filter
                  </p>
                )}
              </dt>
              <dd className="mt-2 sm:mt-0">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm text-body leading-relaxed">
                    {pick.redirect ?? pick.why}
                  </p>
                  {pick.product && (
                    <TypicalPrice priceGbp={pick.product.priceGbp} size="sm" />
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                  <Link
                    href={pick.guide.href}
                    className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
                  >
                    {pick.guide.label}
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                  {!pick.product && (
                    <Link
                      href="/guides/best-kettle-for-hard-water-uk"
                      className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
                    >
                      Kettles for hard water
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </Link>
                  )}
                </div>
              </dd>
            </div>
          ))}
        </dl>
        <AffiliateNote className="mt-3" withFundingLink />

        {featured.length > 0 && (
          <>
            <h3 className="font-semibold text-ink text-lg mt-10 mb-2">
              The four we would actually buy
            </h3>
            <p className="text-base text-body leading-relaxed mb-5">
              One for each budget and each kind of home. The removal lists and
              certifications below come from the manufacturers&apos; own
              specifications; the trade-offs are ours.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 items-stretch">
              {featured.map(({ product, highlight }) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  highlight={highlight}
                  pageType={PAGE_TYPE}
                  placement="guide-picks"
                  recommendationReason={highlight}
                />
              ))}
            </div>
          </>
        )}

        {/* ── Which type ───────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-3">
          Which type of water filter do you need?
        </h2>
        <p className="text-base text-body leading-relaxed mb-6">
          Seven kinds of product get sold as &ldquo;water filters&rdquo; in
          Britain, and one of them is not a filter at all. Price bands and
          running costs are taken from the products in our catalogue.
        </p>

        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm border-collapse min-w-[640px]">
            <caption className="sr-only">
              Water filter types compared on what they remove, installation, price and running cost
            </caption>
            <thead>
              <tr className="border-b border-rule text-left">
                <th className="py-2.5 pr-3 text-xs font-medium text-muted">Type</th>
                <th className="py-2.5 px-3 text-xs font-medium text-muted">Removes</th>
                <th className="py-2.5 px-3 text-xs font-medium text-muted">Fitting</th>
                <th className="py-2.5 px-3 text-xs font-medium text-muted whitespace-nowrap">Typical price</th>
                <th className="py-2.5 pl-3 text-xs font-medium text-muted whitespace-nowrap">Running cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {TYPE_ROWS.map((row) => {
                const meta = row.category ? CATEGORY_META[row.category] : null;
                const running = row.category ? runningCostRange(row.category) : null;
                return (
                  <tr key={row.type}>
                    <td className="py-3 pr-3 align-top">
                      <Link href={row.href} className="font-medium text-ink hover:text-accent whitespace-nowrap">
                        {row.type}
                      </Link>
                    </td>
                    <td className="py-3 px-3 text-body align-top">{row.removes}</td>
                    <td className="py-3 px-3 text-body align-top">{row.install}</td>
                    <td className="py-3 px-3 font-data text-ink align-top whitespace-nowrap">
                      {meta?.priceRange ?? "—"}
                    </td>
                    <td className="py-3 pl-3 font-data text-ink align-top whitespace-nowrap">
                      {running ?? row.running ?? "Not published"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-faint mt-3">
          Running cost is the manufacturer&apos;s stated cartridge schedule at
          typical household use, lowest to highest across the products we list
          in that category. Whole house and softener prices exclude the
          plumber.
        </p>

        {/* ── What is in UK tap water ──────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-3">
          What UK tap water actually contains
        </h2>
        <p className="text-base text-body leading-relaxed mb-6">
          Our picks are grounded in what water companies report across 2,800
          postcode districts, not in marketing. These are the five things that
          decide which filter, if any, is worth your money.
        </p>
        <div className="border-y border-rule divide-y divide-rule">
          {IN_YOUR_WATER.map((item) => (
            <div key={item.name} className="py-5 sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(0,4fr)] sm:gap-6">
              <h3 className="text-base font-medium text-ink">
                <Link href={item.href} className="hover:text-accent transition-colors">
                  {item.name}
                </Link>
              </h3>
              <div className="mt-1 sm:mt-0">
                <p className="text-base text-body leading-relaxed">{item.body}</p>
                <p className="text-sm text-body leading-relaxed mt-2">
                  <span className="font-medium text-ink">What removes it: </span>
                  {item.fix}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Comparison ───────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-3">
          The top pick in each category, side by side
        </h2>
        <p className="text-base text-muted mb-6">
          Listed removals from each maker&apos;s own specification. A cross
          means the maker does not list it, not that it was tested and failed.
          Bacteria is listed only by the ceramic and RO units.
        </p>
        <div className="card p-4 lg:p-6">
          <ProductComparisonTable
            pageType={PAGE_TYPE}
            campaign={PAGE_TYPE}
            products={categoryPicks}
            contaminants={["Chlorine", "Lead", "PFAS (total)", "Fluoride", "Bacteria"]}
          />
          <AffiliateNote className="mt-4" />
        </div>

        <RunningCostComparison
          products={drinkingWaterPicks}
          pageType={PAGE_TYPE}
          campaign={PAGE_TYPE}
        />
        <AffiliateNote className="mt-3" />

        {/* ── Certifications ───────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-3">
          How to read the certifications
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          A removal claim is only as good as who checked it. These are the
          marks that appear on the products in this guide, and what each one
          actually covers.
        </p>
        <dl className="border-y border-rule divide-y divide-rule">
          {[
            ["NSF/ANSI 42", "Taste and smell: chlorine and particles. The baseline."],
            ["NSF/ANSI 53", "Health contaminants such as lead, mercury and cysts."],
            ["NSF/ANSI 58", "Reverse osmosis systems. Covers the membrane's removal claims."],
            ["NSF/ANSI 401", "Emerging contaminants including some PFAS and pharmaceuticals."],
            ["WRAS approved", "Safe to connect to UK mains plumbing. Says nothing about removal."],
            ["TUV SUD, SGS tested", "Independent lab testing, but not the same as NSF certification of a standard."],
          ].map(([mark, meaning]) => (
            <div key={mark} className="py-3 sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(0,3fr)] sm:gap-6">
              <dt className="font-data text-sm text-ink">{mark}</dt>
              <dd className="text-sm text-body leading-relaxed mt-1 sm:mt-0">{meaning}</dd>
            </div>
          ))}
        </dl>

        {/* ── Verdict ──────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Our verdict
        </h2>
        <ul className="space-y-3">
          {[
            {
              mark: "yes",
              text: "Nothing flagged at your postcode and you just want better-tasting water: buy a jug. The BRITA Marella XL is the cheapest good one to live with.",
            },
            {
              mark: "yes",
              text: "Lead, PFAS or nitrate flagged, or you want one system that covers everything in drinking water: buy the Waterdrop G3P600, or the Osmio Zero 2.0 if you cannot plumb anything in.",
            },
            {
              mark: "partial",
              text: "Chlorine bothering you at every tap and in the shower: a whole house filter. The Osmio PRO-III Ultimate treats the water; the BWT E1 is the value pick for sediment and chlorine.",
            },
            {
              mark: "no",
              text: "Limescale is the complaint: do not buy a filter. Check the hardness at your postcode and read the softener guide.",
            },
          ].map((line) => (
            <li key={line.text} className="flex items-start gap-3 text-base text-body leading-relaxed">
              {line.mark === "yes" && <Check className="w-4 h-4 text-safe shrink-0 mt-1.5" aria-hidden="true" />}
              {line.mark === "partial" && <Minus className="w-4 h-4 text-amber-600 shrink-0 mt-1.5" aria-hidden="true" />}
              {line.mark === "no" && <X className="w-4 h-4 text-warning shrink-0 mt-1.5" aria-hidden="true" />}
              <span>{line.text}</span>
            </li>
          ))}
        </ul>

        <div id="postcode-check" className="mt-10 card-elevated p-8 text-center rounded-2xl scroll-mt-24">
          <Kicker className="mb-2">Before you buy</Kicker>
          <h3 className="font-display text-xl italic text-ink">
            Check your postcode
          </h3>
          <p className="text-base text-muted mt-2 max-w-md mx-auto">
            See which of the five things above are flagged in your area, and
            which filter type, if any, we would point you to.
          </p>
          <div className="mt-6 max-w-sm mx-auto">
            <PostcodeSearch />
          </div>
        </div>

        <GuideFaq faqs={FAQ_DATA} />

        {/* ── Related ──────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          The category guides
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {[
            ["/guides/best-water-filter-jug-uk/", "Best water filter jug UK"],
            ["/guides/best-water-filter-tap-uk/", "Best water filter tap UK"],
            ["/guides/best-under-sink-water-filter-uk/", "Best under sink water filter UK"],
            ["/guides/best-reverse-osmosis-system-uk/", "Best reverse osmosis system UK"],
            ["/guides/best-water-filter-pfas/", "Best water filter for PFAS"],
            ["/guides/best-whole-house-water-filter-uk/", "Best whole house water filter UK"],
            ["/guides/best-shower-filter-uk/", "Best shower filter UK"],
            ["/guides/best-water-softener-uk/", "Best water softener UK"],
            ["/guides/best-kettle-for-hard-water-uk/", "Best kettle for hard water UK"],
            ["/guides/best-boiling-water-tap-uk/", "Best boiling water tap UK"],
            ["/guides/best-water-testing-kit-uk/", "Best water testing kit UK"],
            ["/guides/is-uk-tap-water-safe/", "Is UK tap water safe to drink?"],
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
          Removal claims, certifications, prices and cartridge intervals are
          taken from the manufacturers&apos; published specifications. We earn
          a commission on purchases made through affiliate links at no extra
          cost to you.{" "}
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
