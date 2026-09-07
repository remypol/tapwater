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
const SLUG = "best-shower-filter-uk";
const URL = `https://www.tapwater.uk/guides/${SLUG}`;
const PAGE_TYPE = "best-shower-filter-guide";
const TITLE = `Best Shower Filter for Hard Water UK (${year}): 5 Compared`;
const DESCRIPTION =
  "Five UK shower filters compared: inline vs filter shower head, what they remove (chlorine, not limescale), running costs, picks for London and eczema.";

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
    question: "What is the best shower filter for hard water in the UK?",
    answer:
      "Start by separating two problems. Hard water is calcium and magnesium, and no shower filter removes them: the limescale on the screen and the film on your skin stay. What a shower filter does remove is chlorine, which every UK mains supply carries, and which is often the real cause of dry skin and dull hair in hard water areas. Of the five we compare, the Jolie Filtered Showerhead is our top pick for a complete replacement head with KDF-55 and calcium sulphite media, the Philips AWP1775 is the inline value pick if you want to keep your own head, and the AquaBliss SF220 is the cheapest to run at around £20 a year. If limescale itself is the problem, you need a water softener, not a filter.",
  },
  {
    question: "Does a shower filter remove limescale or soften hard water?",
    answer:
      "No. Every shower filter sold in the UK works on chlorine, chloramine, sediment and in some cases metals. None of the five here lists hardness or limescale, and a cartridge the size of a fist passing eight or more litres a minute cannot do ion exchange. If you see 'hard water shower filter' on a box, read it as 'shower filter for people who live in hard water areas'. The only product that stops limescale is a whole-house water softener, which swaps the hardness minerals for a little sodium before the water reaches the bathroom.",
  },
  {
    question: "Is a shower head filter or an inline shower filter better?",
    answer:
      "They filter the same water; the difference is what you keep. An inline shower filter, like the Philips AWP1775, the AquaBliss SF220 or the Osmio Vitafresh Inline, screws between the shower arm and the head you already own, so you keep your spray pattern and can unscrew it when you move. A filter shower head, like the Jolie, replaces the head entirely and tends to look better because the filter is hidden inside. The Osmio Vitafresh Handheld sits between the two: it replaces the handset on a hose. Choose inline if you like your current head or rent; choose a filter shower head if the head is due a replacement anyway.",
  },
  {
    question: "What does a shower filter actually remove?",
    answer:
      "All five here list chlorine. The Jolie and the two Osmio Vitafresh filters also list chloramine, the longer-lasting disinfectant some UK supplies use. The Jolie and the AquaBliss list heavy metals, and the AquaBliss and Philips list sediment, which is the grit and rust that clogs a head. None of them lists fluoride, PFAS, bacteria or hardness. Water passes a shower cartridge far too quickly for that kind of removal, so those stay a job for the kitchen tap.",
  },
  {
    question: "Which shower filter is best for London water?",
    answer:
      "London sits in the very hard water band, mostly above 250 mg/L calcium carbonate, and every London supply is chlorinated. That combination is what makes showers feel harsh: chlorine dries the skin and the minerals leave a film that stops soap rinsing clean. A shower filter fixes the first half only. For the chlorine, any of the five here works; the Jolie also lists chloramine and heavy metals, and the Osmio Vitafresh filters neutralise chlorine chemically so hot water does not weaken the effect. For the limescale half, look at a water softener. Enter your postcode on TapWater.uk to see the hardness reading for your part of London before deciding which half you are buying for.",
  },
  {
    question: "Which shower filter is best for eczema or sensitive skin?",
    answer:
      "The NHS does not recommend shower filters for eczema, and none of these products is a medical device, so treat this as comfort rather than treatment. What is well established is that chlorine strips the natural oils that keep skin hydrated, and that hard water reduces how well soap rinses away, both of which can aggravate eczema. A shower filter removes the chlorine; the Jolie lists chloramine and heavy metals as well, which matters on supplies that use chloramine. If your postcode is in a hard water area, a softener addresses the mineral side too. Our water and eczema guide covers what the evidence actually shows.",
  },
  {
    question: "Is a shower filter good for hair and skin?",
    answer:
      "If chlorine is what is bothering you, yes. Chlorine dries skin and roughens the hair cuticle, and colour-treated hair fades faster in chlorinated water. Jolie describe a noticeable improvement in hair and skin softness within a week, and that matches what most owners report of shower filters generally. What a filter cannot do is change how hard your water is, so if your hair feels coated or your skin feels tight from mineral film rather than dryness, the filter will help less than you hope. The honest test is to check your postcode's hardness reading first.",
  },
  {
    question: "How often do you replace a shower filter, and what does it cost to run?",
    answer:
      "Between two and six months depending on the model. The AquaBliss SF220 is rated for six months and costs around £20 a year in cartridges. The Jolie and the Philips AWP1775 are rated for three months, at roughly £60 and £48 a year. The two Osmio Vitafresh filters use a vitamin C cartridge that lasts around two months, so about £70 a year, and the inline version has a separate fabric pre-filter on top. In a busy household or a very chlorinated supply, expect the shorter end of each range. Cartridges do not announce themselves when spent, so put the change date in your calendar.",
  },
];

/** The reader's real question, answered before anything is sold. */
const FIXES: string[] = [
  "Removes the chlorine that dries skin and roughens hair",
  "On the Jolie and Osmio filters, also lists chloramine",
  "On the AquaBliss and Jolie, lists heavy metals; AquaBliss and Philips catch sediment",
  "Fits in minutes with no plumber, and unscrews when you move",
];

const STAYS: string[] = [
  "Limescale on the screen, tiles and head: hardness is untouched",
  "The mineral film that stops soap rinsing clean",
  "Fluoride, PFAS and bacteria: none of the five lists them",
  "Anything at the kitchen tap: this treats one shower only",
];

type FilterType = "Filter shower head" | "Inline filter" | "Filtered handset";

const TYPE_ROWS: { feature: string; head: boolean | string; inline: boolean | string }[] = [
  { feature: "Keeps the shower head you already own", head: false, inline: true },
  { feature: "Filter hidden inside the head", head: true, inline: false },
  { feature: "Works with any standard half-inch shower arm", head: true, inline: true },
  { feature: "Adds length between arm and head", head: false, inline: true },
  { feature: "Moves with you when you leave a rental", head: "Yes, but you refit the old head", inline: true },
  { feature: "Examples here", head: "Jolie; Osmio Handheld (handset)", inline: "Philips, AquaBliss, Osmio Inline" },
];

const SYMPTOMS: { who: string; why: string; fit: boolean | "maybe" }[] = [
  {
    who: "Dry, itchy or tight skin after a shower",
    why: "The most common reason people buy one. Chlorine strips natural oils, and a filter takes the chlorine out. If the tightness is a mineral film rather than dryness, hardness is the cause and a filter will not shift it.",
    fit: true,
  },
  {
    who: "Dull, brittle or colour-fading hair",
    why: "Chlorine roughens the cuticle and fades colour. Every filter here lists chlorine, so this is where a shower filter earns its keep.",
    fit: true,
  },
  {
    who: "Swimming-pool smell in the bathroom",
    why: "That is chlorine gassing off in hot water. A filter removes it at the head; the Osmio vitamin C cartridges neutralise it chemically rather than adsorbing it, so heat does not reduce the effect.",
    fit: true,
  },
  {
    who: "Eczema or sensitive skin that flares after showering",
    why: "Chlorine is one aggravating factor and hard water is another. A filter deals with the first. Read our eczema guide for what the evidence supports before expecting a cure.",
    fit: "maybe",
  },
  {
    who: "Limescale on the screen, tiles and head",
    why: "That is hardness, and no shower filter reduces it. Check the reading at your postcode and, if it is 200 mg/L or more, look at a softener instead.",
    fit: false,
  },
  {
    who: "Soap and shampoo that will not lather or rinse clean",
    why: "Hardness again. A filter removes chlorine and leaves every milligram of calcium in place, so lather will not improve.",
    fit: false,
  },
];

/* ── Helpers ─────────────────────────────────────────────────────────── */

function ProductReview({
  product,
  heading,
  type,
  verdict,
  review,
  pros,
  cons,
  ctaLabel,
}: {
  product: FilterProduct;
  heading: string;
  type: FilterType;
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
          <span className="inline-flex items-center gap-1 text-xs bg-wash text-muted border border-rule rounded-full px-2.5 py-1">
            <X className="w-3 h-3" aria-hidden="true" />
            Hardness
          </span>
        </div>
      </div>

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
            <Kicker as="span">Type</Kicker>
          </dt>
          <dd className="font-data text-sm text-ink font-medium mt-1">{type}</dd>
        </div>
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

function FitMark({ fit }: { fit: boolean | "maybe" }) {
  if (fit === "maybe") {
    return <Minus className="w-4 h-4 text-amber-600 shrink-0 mt-1" aria-label="Partly" />;
  }
  return fit ? (
    <Check className="w-4 h-4 text-safe shrink-0 mt-1" aria-label="A shower filter helps" />
  ) : (
    <X className="w-4 h-4 text-warning shrink-0 mt-1" aria-label="A shower filter does not help" />
  );
}

function Cell({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span className="text-sm text-ink">{value}</span>;
  }
  return value ? (
    <Check className="w-4 h-4 text-safe mx-auto" aria-label="Yes" />
  ) : (
    <X className="w-4 h-4 text-faint mx-auto" aria-label="No" />
  );
}

/* ── Page ────────────────────────────────────────────────────────────── */

export default function BestShowerFilterGuide() {
  const showerProducts = getProductsByCategory("shower");
  const jolie = showerProducts.find((p) => p.id === "jolie-filtered-showerhead");
  const aquabliss = showerProducts.find((p) => p.id === "aquabliss-sf220");
  const philips = showerProducts.find((p) => p.id === "philips-awp1775");
  const osmioInline = showerProducts.find((p) => p.id === "osmio-vitafresh-inline");
  const osmioHandheld = showerProducts.find((p) => p.id === "osmio-vitafresh-handheld");

  const comparisonContaminants = ["Chlorine", "Chloramine", "Heavy metals", "Sediment"];

  const highlights: Record<string, string> = {
    "jolie-filtered-showerhead": "Top pick: a complete filter shower head, listed for chlorine, chloramine and heavy metals",
    "philips-awp1775": "Inline value pick: keeps your own shower head",
    "aquabliss-sf220": "Budget pick: the cheapest to run, at around £20 a year",
    "osmio-vitafresh-inline": "Vitamin C pick: chemistry that holds up in hot water, inline",
    "osmio-vitafresh-handheld": "Vitamin C pick: the same cartridge as a handset",
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Guides", url: "https://www.tapwater.uk/guides" },
          { name: "Best Shower Filter UK", url: URL },
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
        <GuideBreadcrumb title="Best Shower Filter UK" />

        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          Best Shower Filter for Hard Water UK ({year})
        </h1>
        <GuideByline updated={`September ${year}`} />

        <p className="text-lg text-body leading-relaxed">
          A shower filter removes chlorine. It does not remove hardness. If you
          came here because of limescale on the shower screen, soap that will
          not lather, or a film on your skin, a filter will not fix it and you
          should read the softener guides instead. If you came here because
          your skin feels dry and your hair feels rough after showering, keep
          reading: chlorine is very likely the cause, every UK mains supply
          carries it, and a filter is the cheapest thing that takes it out.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          This guide compares the five shower filters worth buying in Britain,
          two that replace the head and three that sit inline behind the head
          you already own, then works through the London and very hard water
          question, the eczema and hair question, and what each one costs to
          keep running. Nothing here needs a plumber.
        </p>

        <GeoCitation
          headline={`According to TapWater.uk's ${year} comparison, the Jolie Filtered Showerhead is the best shower filter for UK homes, with the Philips AWP1775 the inline value pick and the AquaBliss SF220 the cheapest to run.`}
          detail="Every one of the 2,800 UK postcode districts we hold data for receives chlorinated water, which is what a shower filter removes. No shower filter reduces water hardness or limescale."
        />

        <GuideDisclosure />

        {/* ── Fixes / stays ───────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-10 mb-4">
          What a shower filter fixes, and what stays
        </h2>
        <p className="text-base text-body leading-relaxed mb-6">
          Read this before the reviews. Most of the searches that land on this
          page say &ldquo;hard water&rdquo;, and the products below do nothing
          about hardness, however good they are at the rest.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 border-y border-rule divide-y sm:divide-y-0 sm:divide-x divide-rule">
          <div className="py-5 sm:pr-6">
            <p className="font-display text-lg italic text-ink mb-3">It fixes</p>
            <ul className="space-y-2.5">
              {FIXES.map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-base text-body">
                  <Check className="w-4 h-4 text-safe shrink-0 mt-1" aria-hidden="true" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="py-5 sm:pl-6">
            <p className="font-display text-lg italic text-ink mb-3">What stays</p>
            <ul className="space-y-2.5">
              {STAYS.map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-base text-body">
                  <X className="w-4 h-4 text-warning shrink-0 mt-1" aria-hidden="true" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="text-base text-body leading-relaxed mt-6">
          The hardness point is the one that costs people money. Limescale is
          dissolved calcium and magnesium, and taking it out means ion exchange
          on the incoming main, which is what a{" "}
          <Link href="/guides/do-i-need-a-water-softener/" className="text-accent hover:underline">
            water softener
          </Link>{" "}
          does. A cartridge in a shower arm cannot. If scale is your problem,
          check the reading at your postcode and, if it is 200 mg/L or more,{" "}
          <Link href="/hardness#softener-quotes" className="text-accent hover:underline">
            get softener quotes
          </Link>{" "}
          rather than buying a filter and being disappointed.
        </p>

        {/* ── Quick picks ─────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Quick picks
        </h2>
        <div className="card-elevated rounded-2xl p-6 lg:p-8">
          <div className="space-y-4">
            {jolie && (
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-rule">
                <div>
                  <Kicker accent>Top pick</Kicker>
                  <p className="font-display text-lg italic text-ink mt-1">
                    {jolie.brand} {jolie.model}
                  </p>
                  <p className="text-sm text-muted mt-1">
                    Complete filter shower head in brushed steel, KDF-55 and
                    calcium sulphite media, listed for chlorine, chloramine and
                    heavy metals
                  </p>
                </div>
                <TypicalPrice priceGbp={jolie.priceGbp} size="sm" />
              </div>
            )}
            {philips && (
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-rule">
                <div>
                  <Kicker accent>Inline value pick</Kicker>
                  <p className="font-display text-lg italic text-ink mt-1">
                    {philips.brand} {philips.model}
                  </p>
                  <p className="text-sm text-muted mt-1">
                    Activated carbon fibre inline filter that keeps your own
                    shower head, from a brand you recognise
                  </p>
                </div>
                <TypicalPrice priceGbp={philips.priceGbp} size="sm" />
              </div>
            )}
            {aquabliss && (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Kicker accent>Budget pick</Kicker>
                  <p className="font-display text-lg italic text-ink mt-1">
                    {aquabliss.brand} {aquabliss.model}
                  </p>
                  <p className="text-sm text-muted mt-1">
                    Sediment, KDF and carbon block stages, six-month cartridge,
                    the cheapest here to run
                  </p>
                </div>
                <TypicalPrice priceGbp={aquabliss.priceGbp} size="sm" />
              </div>
            )}
          </div>
          <AffiliateNote className="mt-5" withFundingLink />
        </div>

        {/* ── Symptoms ────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Do you need a shower filter, or a softener?
        </h2>
        <p className="text-base text-body leading-relaxed mb-6">
          The symptoms of chlorine and the symptoms of hard water overlap, and
          the boxes on Amazon blur them on purpose. Here is how they separate.
        </p>
        <dl className="border-y border-rule divide-y divide-rule">
          {SYMPTOMS.map((row) => (
            <div key={row.who} className="py-4 flex items-start gap-3">
              <FitMark fit={row.fit} />
              <div className="sm:grid sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-6 flex-1">
                <dt className="text-base font-medium text-ink">{row.who}</dt>
                <dd className="text-base text-body leading-relaxed mt-1 sm:mt-0">{row.why}</dd>
              </div>
            </div>
          ))}
        </dl>

        <div className="mt-8 card-elevated p-8 text-center rounded-2xl">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-accent-light flex items-center justify-center">
              <Search className="w-6 h-6 text-accent" aria-hidden="true" />
            </div>
          </div>
          <h3 className="font-display text-xl italic text-ink">
            Check your water hardness before you buy
          </h3>
          <p className="text-base text-muted mt-2 max-w-md mx-auto">
            We hold the hardness reading your water company reports for your
            supply zone. Under 120 mg/L, chlorine is almost certainly your
            problem and a filter is the right buy. Over 200, a filter fixes
            half of it.
          </p>
          <div className="mt-6 max-w-sm mx-auto">
            <PostcodeSearch />
          </div>
        </div>

        {/* ── Inline vs head ──────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Inline shower filter or filter shower head?
        </h2>
        <p className="text-base text-body leading-relaxed">
          Shower filters come in two shapes. An{" "}
          <strong className="text-ink">inline filter</strong> is a cartridge
          housing that screws onto the shower arm, with your existing head
          screwed onto the other end. A{" "}
          <strong className="text-ink">filter shower head</strong> builds the
          cartridge into a new head, so the whole thing is replaced. A third
          variant, the filtered handset, does the same on a hose-fed shower.
          The water is filtered the same way in each; the difference is what
          you keep, how it looks, and how easy it is to take with you.
        </p>

        <div className="overflow-x-auto -mx-4 px-4 mt-6">
          <table className="w-full text-sm border-collapse">
            <caption className="sr-only">Filter shower head versus inline shower filter</caption>
            <thead>
              <tr className="border-b border-rule text-left">
                <th className="py-2.5 pr-3 text-xs font-medium text-muted">Feature</th>
                <th className="py-2.5 px-3 text-xs font-medium text-muted text-center">
                  Filter shower head
                </th>
                <th className="py-2.5 px-3 text-xs font-medium text-muted text-center">
                  Inline filter
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {TYPE_ROWS.map((row) => (
                <tr key={row.feature}>
                  <td className="py-3 pr-3 font-medium text-ink">{row.feature}</td>
                  <td className="py-3 px-3 text-center">
                    <Cell value={row.head} />
                  </td>
                  <td className="py-3 px-3 text-center">
                    <Cell value={row.inline} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-base text-body leading-relaxed mt-6">
          Choose inline if you like your current head, if you rent, or if you
          want to try filtering before committing to a new head: the Philips
          AWP1775, AquaBliss SF220 and Osmio Vitafresh Inline all unscrew in a
          minute. Choose a filter shower head if the head is due for
          replacement anyway and you would rather not see a cartridge housing:
          the Jolie is the one to look at. On an electric shower, check the
          fitting before ordering either: Osmio warn that the steel plate on
          their handheld is unsuitable for some electric units.
        </p>

        <h3 className="font-semibold text-ink text-lg mt-8 mb-2">
          What is inside the cartridge
        </h3>
        <p className="text-base text-body leading-relaxed">
          Three media turn up across the five filters here.{" "}
          <strong className="text-ink">KDF-55</strong>, a copper-zinc alloy,
          converts free chlorine to chloride and is in the Jolie and AquaBliss.{" "}
          <strong className="text-ink">Activated carbon</strong> adsorbs
          chlorine and is the main stage in the Philips and one stage in the
          AquaBliss; carbon loses some efficiency as water gets hotter, which is
          why shower cartridges are rated for months rather than years.{" "}
          <strong className="text-ink">Vitamin C</strong>, in both Osmio
          Vitafresh filters, neutralises chlorine and chloramine chemically as
          it dissolves, so heat does not reduce the effect, but the cartridge
          is used up faster. Jolie pairs KDF-55 with calcium sulphite. None of
          these media touches hardness.
        </p>

        {/* ── London / very hard water ────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          For London and very hard water areas
        </h2>
        <p className="text-base text-body leading-relaxed">
          &ldquo;Best shower filter for London water&rdquo; is one of the
          searches that brings people here, and London is the clearest example
          of the two-problem shower. Most of the capital sits in the very hard
          band, above 250 mg/L calcium carbonate on the readings water
          companies report, and every London supply is chlorinated. The
          combination is what makes a London shower feel harsh: chlorine dries
          the skin, and the minerals leave a film that stops soap rinsing
          clean and furs the screen.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          A shower filter handles the chlorine half completely. Any of the
          five here does that; if your supply uses chloramine, which lasts
          longer in the pipes than plain chlorine, the Jolie and both Osmio
          Vitafresh filters list it and the Philips and AquaBliss do not. The
          mineral half is untouched. If your postcode reads 200 mg/L or more,
          the honest advice is to think of a shower filter as the £25 to £85
          fix for the skin and hair, and a{" "}
          <Link href="/guides/best-water-softener-uk/" className="text-accent hover:underline">
            water softener
          </Link>{" "}
          as the separate, larger fix for the scale. The same applies across
          the South East, East Anglia and much of the Midlands, which share
          London&apos;s hardness band. Our{" "}
          <Link href="/guides/water-hardness-map/" className="text-accent hover:underline">
            UK water hardness map
          </Link>{" "}
          shows where the bands fall.
        </p>

        {/* ── Eczema, hair, skin ──────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          For eczema, hair and sensitive skin
        </h2>
        <p className="text-base text-body leading-relaxed">
          Two things are well established. Chlorine strips the natural oils
          that keep skin hydrated and roughens the hair cuticle, which is why
          colour-treated hair fades faster in chlorinated water. And hard water
          reduces how well soap and shampoo rinse away, leaving a residue that
          can irritate reactive skin. A shower filter deals with the first
          only.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          For eczema specifically, the NHS does not recommend shower filters
          and none of the products here is a medical device, so buy one for
          comfort rather than as treatment. What owners consistently report,
          and what Jolie describe, is skin and hair feeling softer within a
          week or two of removing chlorine. If your skin reacts more in a hard
          water area than it did in a soft one, the mineral side is likely
          part of it, and the softener route is the one that addresses that.
          We go through the evidence, including the hard water and eczema
          studies, in{" "}
          <Link href="/guides/water-and-eczema/" className="text-accent hover:underline">
            water and eczema
          </Link>
          .
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          For hair and skin without a skin condition, the choice is simpler:
          any filter here removes the chlorine. The Jolie adds chloramine and
          heavy metals to the list, the Osmio filters keep working at full
          strength in hot water, and the AquaBliss is the cheapest way to find
          out whether chlorine was the problem at all.
        </p>

        {/* ── Reviews ─────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          The five shower filters worth buying in the UK
        </h2>
        <p className="text-base text-body leading-relaxed mb-6">
          Two filter shower heads, three inline filters, three different
          filtering chemistries. Every removal claim below comes from the
          maker&apos;s own listing; none of the five carries an independent
          certification, which is normal for this category and worth knowing.
        </p>

        <div className="space-y-4 mb-8">
          {showerProducts.map((product) => (
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
          {jolie && (
            <ProductReview
              product={jolie}
              heading="Jolie Filtered Showerhead: top pick"
              type="Filter shower head"
              verdict="The complete filter shower head to buy, with the longest removal list here."
              review="The Jolie replaces your shower head with a brushed-steel one that has the filter built in, and it is the only product here that does not look like a filter. Inside, KDF-55 and calcium sulphite media target chlorine and chloramine, and Jolie also list heavy metals, which makes it the widest listing of the five. Jolie describe a noticeable improvement in hair and skin softness within a week, and that is the reason most people buy it. The costs are the highest here: around £85 for the head and a cartridge every three months, roughly £60 a year. Two honest limits. It carries no independent certification, and Jolie themselves say it will not remove fluoride, PFAS or heavy metals beyond basic levels. And like every shower filter, it does nothing about hardness, so a London bathroom will still need descaling."
              pros={jolie.pros}
              cons={jolie.cons}
              ctaLabel="View on Amazon"
            />
          )}

          {philips && (
            <ProductReview
              product={philips}
              heading="Philips AWP1775: inline value pick"
              type="Inline filter"
              verdict="A recognisable brand, an inline fit, and your own shower head stays where it is."
              review="The Philips AWP1775 screws between the shower arm and the head you already own, so you keep your spray pattern and can unscrew it when you move. The media is activated carbon fibre, which removes chlorine effectively, and the listing adds sediment. It does not list heavy metals or chloramine, so if your supply uses chloramine, the Jolie or the Osmio filters are the better match. At around £35 with a cartridge every three months, roughly £48 a year, it sits in the middle of the range on both counts. The cartridge is Philips-proprietary with no third-party alternative, and Philips note a slight pressure drop on low-pressure systems, which is worth weighing if your shower is already weak."
              pros={philips.pros}
              cons={philips.cons}
              ctaLabel="View on Amazon"
            />
          )}

          {aquabliss && (
            <ProductReview
              product={aquabliss}
              heading="AquaBliss SF220: budget pick"
              type="Inline filter"
              verdict="The cheapest way to find out whether chlorine is your problem, and the cheapest to run."
              review="At around £25, with a cartridge rated for six months and roughly £20 a year in replacements, the AquaBliss SF220 is the lowest-cost shower filter here by some distance. It is a multi-stage inline housing: a sediment stage for grit and rust, KDF media for chlorine, and a carbon block, and the listing covers chlorine, heavy metals and sediment. It fits any standard shower arm. The trade-offs are what you would expect at the price: the plastic housing feels less premium than the Jolie, AquaBliss note that flow drops noticeably after about two months, and replacement cartridges can be hard to source in the UK, so buy a spare when you see one. If you are not sure a shower filter will do anything for you, this is the one to test with."
              pros={aquabliss.pros}
              cons={aquabliss.cons}
              ctaLabel="View on Amazon"
            />
          )}

          {osmioInline && (
            <ProductReview
              product={osmioInline}
              heading="Osmio Vitafresh Inline: vitamin C pick"
              type="Inline filter"
              verdict="A different chemistry that holds up in hot water, at the highest running cost here."
              review="The three filters above work by adsorption: media hold onto chlorine as water passes through, and carbon in particular loses efficiency as the water gets hotter. The Osmio Vitafresh Inline works chemically instead, dissolving pharmaceutical food grade vitamin C that neutralises chlorine and chloramine outright, so shower temperature does not reduce the effect. It fits inline above your existing head. Osmio state the vitamin C is compliant with UK and European standards, but there is no independent certification on the product. The cost is in the cartridge: it lasts around two months, the shortest life here, which works out at roughly £70 a year, and the fabric pre-filter is a separate consumable on top. At around £59 up front it is cheaper than the Jolie to buy and dearer than any of them to keep going."
              pros={osmioInline.pros}
              cons={osmioInline.cons}
              ctaLabel="View on Osmio"
            />
          )}

          {osmioHandheld && (
            <ProductReview
              product={osmioHandheld}
              heading="Osmio Vitafresh Handheld: vitamin C pick"
              type="Filtered handset"
              verdict="The same vitamin C stage as the inline version, built into a handset."
              review="This is the handset version of the filter above. It replaces the handset on a hose-fed shower and fits in seconds with no tools, and the see-through housing lets you watch the vitamin C level drop so you know when to change it. The chemistry and the cartridge are the same as the inline version, so the performance argument and the roughly £70 a year running cost are identical. What differs is that you lose your existing handset, and the entry price is lower at around £37.50. One caveat to take seriously: Osmio warn that the fine-holed stainless steel plate is unsuitable for some electric showers, so check your setup before ordering. If you have a hose-fed shower and want to try vitamin C filtering, this is the cheaper door in."
              pros={osmioHandheld.pros}
              cons={osmioHandheld.cons}
              ctaLabel="View on Osmio"
            />
          )}
        </div>

        {/* ── Comparison ──────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Side by side
        </h2>
        <p className="text-base text-muted mb-6">
          Listed removals, typical price and annual cartridge cost from the
          makers&apos; own specifications. None of the five reduces hardness.
        </p>
        <div className="card p-4 lg:p-6">
          <ProductComparisonTable
            pageType={PAGE_TYPE}
            campaign={PAGE_TYPE}
            products={showerProducts}
            contaminants={comparisonContaminants}
          />
          <AffiliateNote className="mt-4" />
        </div>

        <RunningCostComparison
          products={showerProducts}
          pageType={PAGE_TYPE}
          campaign={PAGE_TYPE}
        />

        {/* ── Verdict ─────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Our verdict
        </h2>
        <p className="text-base text-body leading-relaxed">
          Buy the <strong className="text-ink">Jolie Filtered Showerhead</strong>{" "}
          if you want a complete filter shower head that looks like a shower
          head, with the widest listing here: chlorine, chloramine and heavy
          metals. Go in knowing it is around £85 plus roughly £60 a year.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          Buy the <strong className="text-ink">Philips AWP1775</strong> if you
          want to keep the shower head you have and prefer a brand you know;
          buy the <strong className="text-ink">AquaBliss SF220</strong> if you
          want the cheapest way to test whether chlorine was the problem, at
          around £20 a year to run. Buy an{" "}
          <strong className="text-ink">Osmio Vitafresh</strong> if you want
          vitamin C chemistry that does not weaken in hot water and can live
          with the roughly £70 a year that follows.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          Buy none of them for limescale. Check the hardness at your postcode
          and, if it is 200 mg/L or more, start with the softener guides.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          {jolie && (
            <AffiliateLink
              href={jolie.affiliateUrl}
              pageType={PAGE_TYPE}
              recommendationReason="verdict"
              productCategory={jolie.category}
              productSlug={jolie.slug}
              placement="guide-verdict"
              campaign={PAGE_TYPE}
              className="inline-flex items-center justify-center gap-2 bg-btn text-white rounded-lg px-6 py-3 text-sm font-medium hover:bg-btn-hover transition-colors"
            >
              View the Jolie Filtered Showerhead
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </AffiliateLink>
          )}
          {aquabliss && (
            <AffiliateLink
              href={aquabliss.affiliateUrl}
              pageType={PAGE_TYPE}
              recommendationReason="verdict"
              productCategory={aquabliss.category}
              productSlug={aquabliss.slug}
              placement="guide-verdict"
              campaign={PAGE_TYPE}
              className="inline-flex items-center justify-center gap-2 border border-rule text-ink rounded-lg px-6 py-3 text-sm font-medium hover:bg-wash transition-colors"
            >
              View the AquaBliss SF220 on Amazon
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
            ["/guides/do-i-need-a-water-softener/", "Do I need a water softener? For the limescale half of the problem"],
            ["/guides/best-water-softener-uk/", "Best water softener UK"],
            ["/guides/water-and-eczema/", "Water and eczema: what the evidence shows"],
            ["/guides/water-hardness-map/", "UK water hardness map"],
            ["/guides/best-whole-house-water-filter-uk/", "Best whole house water filter UK, if you want chlorine out of every tap"],
            ["/filters/shower-filters/", "All shower filters we review"],
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
          Removal claims, media and cartridge intervals are taken from the
          makers&apos; published listings; none of the five filters carries an
          independent certification. We earn a commission on purchases made
          through affiliate links at no extra cost to you.{" "}
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
