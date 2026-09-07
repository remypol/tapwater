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
const SLUG = "best-whole-house-water-filter-uk";
const URL = `https://www.tapwater.uk/guides/${SLUG}`;
const PAGE_TYPE = "best-whole-house-filter-guide";
const TITLE = `Best Whole House Water Filter UK (${year}): Systems Compared`;
const DESCRIPTION =
  "Whole house and mains water filters for UK homes: what they remove, sizing by flow rate, running costs, fitting, and why a filter is not a softener.";

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
    question: "What is the best whole house water filter in the UK?",
    answer:
      "For most UK homes that want more than sediment removal, the Osmio PRO-III Ultimate is the whole house water filter we recommend. It is UK-made, certified to NSF/ANSI 42 and 61 with WaterMark approval, and its three stages are listed for chlorine, sediment, lead, bacteria, nitrates, heavy metals, hormones and pharmaceutical residues. It costs around £499 plus fitting and roughly £188 a year in cartridges. If your only problem is grit, rust or particles, the BWT E1 at around £250 is the value pick: it is WRAS approved, cleans itself with a backwash lever, and has no cartridges to buy.",
  },
  {
    question: "Is a whole house water filter the same as a water softener?",
    answer:
      "No. A whole house water filter takes chlorine, sediment and, on better units, metals and bacteria out of all the water entering your home, but it leaves the calcium and magnesium that make limescale. A water softener does the reverse: it swaps those hardness minerals for a little sodium and does nothing about chlorine or grit. If limescale is your problem, you need a softener. If taste, smell, staining or particles are the problem, you need a filter. In hard water areas some homes fit both, one after the other on the incoming main.",
  },
  {
    question: "What does a mains water filter actually remove?",
    answer:
      "It depends on the stages inside. A single sediment stage, like the BWT E1, catches grit, rust flakes and particles. Add a carbon block and you remove the chlorine that gives tap water its swimming-pool smell and dries skin in the shower. Multi-stage systems like the Osmio PRO-III Ultimate add a ceramic stage for bacteria and a GAC and KDF stage listed for lead, heavy metals, nitrates, hormones and pharmaceutical residues. No whole house filter in this guide removes fluoride or is certified for PFAS, and none reduces water hardness.",
  },
  {
    question: "Do I need a whole house water filter in the UK?",
    answer:
      "Most households do not need one for safety, because UK mains water already meets the Drinking Water Inspectorate's standards at the tap. You are a good candidate if chlorine taste or smell bothers you at every tap, if your skin or hair reacts to chlorinated showers, if you see grit, rust or brown staining from old mains or a recent burst, or if you are on a private well, spring or borehole where sediment and bacteria are your responsibility. If your only concern is drinking water at the kitchen tap, an under-sink or reverse osmosis system does more for less money.",
  },
  {
    question: "What size whole house water filter do I need?",
    answer:
      "Size by flow rate, in litres per minute, not by the size of the house. A one-bathroom home rarely draws more than 15 to 20 L/min at once. Two bathrooms and a kitchen running together can reach 25 to 30 L/min, and a home with three or more bathrooms should plan for 30 L/min or more. The BWT E1 is rated at 25 L/min, which covers a typical one or two bathroom home. Osmio do not publish a flow rate for the PRO-III Ultimate, so ask them before ordering if you have several showers in use at the same time. Larger 20-inch housings pass more water with less pressure loss than 10-inch ones and their cartridges last longer.",
  },
  {
    question: "How much does a whole house water filter system cost to install and run?",
    answer:
      "Budget three amounts: the unit, the fitting and the cartridges. The two systems in this guide cost around £250 and £499. A plumber typically charges £150 to £300 to fit one on the incoming main with isolation valves and a bypass, more if the stopcock is awkward to reach. Running cost is where they separate: the BWT E1 has nothing to replace, so it costs £0 a year after fitting, while the Osmio PRO-III Ultimate needs a carbon change every 6 to 12 months and a GAC and KDF change every 12 to 18 months, which works out at roughly £188 a year, with the ceramic stage lasting three years.",
  },
  {
    question: "Does a whole house water filter remove PFAS?",
    answer:
      "Not reliably, and neither system here claims it. Activated carbon can reduce some PFAS compounds, but a whole house filter passes water through far too fast to be relied on, and there is no PFAS certification on either unit; Osmio even sell a separate PFAS filter. If PFAS is your concern, treat drinking water at the point of use with a reverse osmosis system or an under-sink filter certified to NSF/ANSI 53 or 58 for PFAS, and check your postcode on TapWater.uk to see whether PFAS has actually been detected in your area.",
  },
  {
    question: "Can I get a whole house water softener and filter in one unit?",
    answer:
      "Not in one box from either brand in this guide. The usual arrangement is two units in series on the incoming main: a sediment filter first to protect the softener's valve from grit, then the softener, then any carbon stage. A plumber can fit both on the same visit. Before buying a softener at all, check the hardness at your postcode: below about 200 mg/L calcium carbonate the payback is slow, and a filter on its own may be all you need.",
  },
];

/** The reader's real question, answered before anything is sold. */
const DOES: string[] = [
  "Removes chlorine taste and smell from every tap and shower",
  "Catches grit, rust flakes and particles before they reach appliances",
  "On multi-stage systems, targets bacteria, lead, nitrates and other metals",
  "Protects the whole house from one fitting on the incoming main",
];

const DOES_NOT: string[] = [
  "Does not reduce water hardness or stop limescale: that is a softener's job",
  "Is not certified to remove PFAS: use reverse osmosis at the kitchen tap",
  "Does not remove fluoride",
  "Cannot fix lead that comes from pipes inside your own home",
];

/** Flow-rate sizing, in litres per minute, for a UK home. */
const SIZING_ROWS: { home: string; peak: string; housing: string }[] = [
  {
    home: "Flat or one-bathroom house",
    peak: "15–20 L/min",
    housing: '10" housings cope; 20" gives longer cartridge life',
  },
  {
    home: "Two bathrooms, family kitchen",
    peak: "25–30 L/min",
    housing: '20" housings, or a backwash unit rated 25 L/min or more',
  },
  {
    home: "Three or more bathrooms",
    peak: "30+ L/min",
    housing: '20" housings with 1" ports; confirm the rated flow before buying',
  },
];

const WHO_NEEDS_ONE: { who: string; why: string; fit: boolean | "maybe" }[] = [
  {
    who: "Chlorine taste or smell at every tap",
    why: "Every UK mains supply is chlorinated. A carbon stage on the incoming main removes it from the kitchen, the shower and the bath at once, and is the most common reason people fit one.",
    fit: true,
  },
  {
    who: "Dry skin, eczema or brittle hair after showering",
    why: "Chlorine strips natural oils. A whole house filter does what a shower filter does, but for every outlet. If hard water is the real cause, you need a softener instead.",
    fit: true,
  },
  {
    who: "Grit, rust or brown water from old mains",
    why: "Cast-iron mains and burst repairs shed particles that clog shower heads and boiler valves. A sediment stage, or a backwash filter like the BWT E1, stops that at the front door.",
    fit: true,
  },
  {
    who: "Private well, spring or borehole",
    why: "Off the mains you are the water company. Sediment and bacteria are your problem, and a multi-stage system with a ceramic stage is the usual first line of defence.",
    fit: true,
  },
  {
    who: "Limescale on kettles, taps and shower screens",
    why: "That is hardness, and no filter here reduces it. Read the softener guides below and check the reading at your postcode before spending anything.",
    fit: false,
  },
  {
    who: "Lead from old pipes",
    why: "Lead almost never comes from the mains; it comes from the supply pipe and internal plumbing of older homes. A point-of-entry filter sits upstream of most of that pipework, so the fix is pipe replacement or a certified filter at the kitchen tap.",
    fit: "maybe",
  },
  {
    who: "PFAS or fluoride in drinking water",
    why: "Neither is what a whole house filter is built for. Reverse osmosis at the point of use is the certified route.",
    fit: false,
  },
];

const INSTALL_STEPS: { title: string; body: string }[] = [
  {
    title: "Where it goes",
    body: "On the rising main just after your internal stopcock and before the first branch, so every outlet in the house is downstream. Under the kitchen sink, a utility cupboard or a garage are the usual spots. A 20-inch housing needs roughly 70 cm of clear height plus room to unscrew the bowl for cartridge changes.",
  },
  {
    title: "Isolation valves and a bypass",
    body: "Ask for a full-bore isolation valve either side of the filter and a bypass loop with its own valve. That lets you change cartridges without cutting the water to the house, and keeps water running if a housing ever fails. Fittings should be WRAS approved; both units here are WRAS or WaterMark listed.",
  },
  {
    title: "Who fits it and what it costs",
    body: "It is a cut-and-fit job on the main supply, so use a plumber unless you are comfortable soldering or using push-fit on 22 mm pipe under mains pressure. Expect £150 to £300 for a straightforward fitting, more if the stopcock is buried in a floor or the pipework is old lead or iron that needs adapting.",
  },
  {
    title: "Afterwards",
    body: "Flush the new cartridges for a few minutes until the water runs clear. Put the change dates in your calendar: cartridges do not tell you when they are spent, and a saturated carbon block quietly stops working long before it blocks the flow.",
  },
];

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
          <Kicker className="mb-2">Certifications</Kicker>
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
            <Kicker as="span">Flow rate</Kicker>
          </dt>
          <dd className="font-data text-sm text-ink font-medium mt-1">
            {product.flowRate ?? "Not published"}
          </dd>
        </div>
        <div>
          <dt>
            <Kicker as="span">Filter life</Kicker>
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
    <Check className="w-4 h-4 text-safe shrink-0 mt-1" aria-label="A filter helps" />
  ) : (
    <X className="w-4 h-4 text-warning shrink-0 mt-1" aria-label="A filter does not help" />
  );
}

/* ── Page ────────────────────────────────────────────────────────────── */

export default function BestWholeHouseFilterGuide() {
  const wholeHouseProducts = getProductsByCategory("whole_house");
  const osmio = wholeHouseProducts.find((p) => p.id === "osmio-pro-iii-ultimate");
  const bwt = wholeHouseProducts.find((p) => p.id === "bwt-e1-whole-house");

  const comparisonContaminants = [
    "Chlorine",
    "Sediment",
    "Lead",
    "Bacteria",
    "Nitrates",
    "Heavy metals",
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Guides", url: "https://www.tapwater.uk/guides" },
          { name: "Best Whole House Water Filter UK", url: URL },
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
        <GuideBreadcrumb title="Best Whole House Water Filter UK" />

        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          Best Whole House Water Filter UK ({year})
        </h1>
        <GuideByline updated={`September ${year}`} />

        <p className="text-lg text-body leading-relaxed">
          A whole house water filter, sometimes called a mains water filter or
          point-of-entry filter, sits on the pipe where water enters your home
          and treats everything downstream: kitchen tap, showers, bath,
          washing machine, boiler. One fitting, every outlet.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          It is also the most misunderstood product we cover. Roughly half the
          people searching for one are looking for a way to stop limescale,
          and a filter will not do that. This guide starts with what a whole
          house filter does and does not do, works through who in Britain
          actually benefits, how to size one, what it costs to fit and run,
          and then reviews the two systems worth buying.
        </p>

        <GeoCitation
          headline={`According to TapWater.uk's ${year} comparison, the Osmio PRO-III Ultimate is the best whole house water filter for UK homes, with the BWT E1 the value pick for sediment.`}
          detail="Every UK mains supply is chlorinated, which is what a whole house carbon stage removes. Neither system reduces water hardness, and neither is certified for PFAS."
        />

        <GuideDisclosure />

        {/* ── Does / does not ─────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-10 mb-4">
          What a whole house filter does, and what it does not
        </h2>
        <p className="text-base text-body leading-relaxed mb-6">
          Read this before the reviews. If your problem is in the right-hand
          column, the products below are the wrong purchase, however good they
          are.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 border-y border-rule divide-y sm:divide-y-0 sm:divide-x divide-rule">
          <div className="py-5 sm:pr-6">
            <p className="font-display text-lg italic text-ink mb-3">It does</p>
            <ul className="space-y-2.5">
              {DOES.map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-base text-body">
                  <Check className="w-4 h-4 text-safe shrink-0 mt-1" aria-hidden="true" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="py-5 sm:pl-6">
            <p className="font-display text-lg italic text-ink mb-3">It does not</p>
            <ul className="space-y-2.5">
              {DOES_NOT.map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-base text-body">
                  <X className="w-4 h-4 text-warning shrink-0 mt-1" aria-hidden="true" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="text-base text-body leading-relaxed mt-6">
          The hardness point matters most. A filter strips chlorine and
          particles but leaves the dissolved calcium and magnesium that fur up
          kettles and boilers. A{" "}
          <Link href="/guides/do-i-need-a-water-softener/" className="text-accent hover:underline">
            water softener
          </Link>{" "}
          does the opposite. If limescale is what brought you here, check the
          reading at your postcode and, if it is 200 mg/L or more,{" "}
          <Link href="/hardness#softener-quotes" className="text-accent hover:underline">
            get softener quotes
          </Link>{" "}
          instead of buying a filter.
        </p>

        {/* ── Quick picks ─────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Quick picks
        </h2>
        <div className="card-elevated rounded-2xl p-6 lg:p-8">
          <div className="space-y-4">
            {osmio && (
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-rule">
                <div>
                  <Kicker accent>Top pick</Kicker>
                  <p className="font-display text-lg italic text-ink mt-1">
                    {osmio.brand} {osmio.model}
                  </p>
                  <p className="text-sm text-muted mt-1">
                    UK-made, NSF/ANSI 42 and 61 certified, three stages listed
                    for bacteria, lead, nitrates and heavy metals as well as
                    chlorine
                  </p>
                </div>
                <TypicalPrice priceGbp={osmio.priceGbp} size="sm" />
              </div>
            )}
            {bwt && (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Kicker accent>Value pick for sediment</Kicker>
                  <p className="font-display text-lg italic text-ink mt-1">
                    {bwt.brand} {bwt.model}
                  </p>
                  <p className="text-sm text-muted mt-1">
                    WRAS approved backwash filter, 25 L/min, no cartridges to
                    buy
                  </p>
                </div>
                <TypicalPrice priceGbp={bwt.priceGbp} size="sm" />
              </div>
            )}
          </div>
          <AffiliateNote className="mt-5" withFundingLink />
        </div>

        {/* ── Who needs one ───────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Who actually needs one in the UK
        </h2>
        <p className="text-base text-body leading-relaxed mb-6">
          Mains water in Britain already meets the Drinking Water
          Inspectorate&apos;s standards at your tap, so nobody on a public
          supply needs a whole house filter for safety. People fit them for
          comfort, taste, and to protect plumbing. Here is how the common
          reasons stack up.
        </p>
        <dl className="border-y border-rule divide-y divide-rule">
          {WHO_NEEDS_ONE.map((row) => (
            <div key={row.who} className="py-4 flex items-start gap-3">
              <FitMark fit={row.fit} />
              <div className="sm:grid sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-6 flex-1">
                <dt className="text-base font-medium text-ink">{row.who}</dt>
                <dd className="text-base text-body leading-relaxed mt-1 sm:mt-0">
                  {row.why}
                </dd>
              </div>
            </div>
          ))}
        </dl>
        <p className="text-sm text-muted mt-4">
          More on the lead question in{" "}
          <Link href="/guides/lead-pipes-uk/" className="text-accent hover:underline">
            lead pipes in UK homes
          </Link>
          , and on the chemical question in{" "}
          <Link href="/guides/best-water-filter-pfas/" className="text-accent hover:underline">
            the best water filters for PFAS
          </Link>
          .
        </p>

        <div className="mt-8 card-elevated p-8 text-center rounded-2xl">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-accent-light flex items-center justify-center">
              <Search className="w-6 h-6 text-accent" aria-hidden="true" />
            </div>
          </div>
          <h3 className="font-display text-xl italic text-ink">
            Check what is actually in your water before buying
          </h3>
          <p className="text-base text-muted mt-2 max-w-md mx-auto">
            We hold the readings your water company reports for your supply
            zone: chlorine, hardness, lead, nitrate and more. If hardness is
            the only thing flagged, you want a softener, not this page.
          </p>
          <div className="mt-6 max-w-sm mx-auto">
            <PostcodeSearch />
          </div>
        </div>

        {/* ── Sizing ──────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Sizing: flow rate, not house size
        </h2>
        <p className="text-base text-body leading-relaxed">
          A whole house filter has to pass every litre the house draws at its
          busiest moment without choking the pressure. The number to compare
          is rated flow in litres per minute. Undersize it and the shower goes
          weak when the washing machine fills; oversize it and you have paid
          for capacity you never use, which is the cheaper mistake.
        </p>
        <div className="overflow-x-auto -mx-4 px-4 mt-6">
          <table className="w-full text-sm border-collapse">
            <caption className="sr-only">
              Whole house filter sizing by household and peak flow
            </caption>
            <thead>
              <tr className="border-b border-rule text-left">
                <th className="py-2.5 pr-3 text-xs font-medium text-muted">Household</th>
                <th className="py-2.5 px-3 text-xs font-medium text-muted whitespace-nowrap">
                  Peak draw
                </th>
                <th className="py-2.5 pl-3 text-xs font-medium text-muted">What to fit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {SIZING_ROWS.map((row) => (
                <tr key={row.home}>
                  <td className="py-3 pr-3 font-medium text-ink align-top">{row.home}</td>
                  <td className="py-3 px-3 font-data text-ink whitespace-nowrap align-top">
                    {row.peak}
                  </td>
                  <td className="py-3 pl-3 text-body align-top">{row.housing}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3 className="font-semibold text-ink text-lg mt-8 mb-2">
          20-inch or 10-inch housings
        </h3>
        <p className="text-base text-body leading-relaxed">
          Cartridge systems come in two standard housing lengths. A 10-inch
          housing is compact and cheaper to fill, but the cartridge holds less
          media, so it clogs sooner and drops more pressure at high flow. A
          20-inch housing holds roughly twice the media: longer intervals
          between changes, less pressure loss, and enough headroom for a
          family home. If you have the cupboard height, 20-inch is the better
          buy for anything beyond a small flat. Backwash units like the BWT E1
          skip cartridges entirely and are sized by their rated flow alone.
        </p>
        <h3 className="font-semibold text-ink text-lg mt-8 mb-2">
          Cartridge life and what you will keep spending
        </h3>
        <p className="text-base text-body leading-relaxed">
          Sediment cartridges are judged by how quickly they block, which
          depends on your mains: a few months on an old iron main, a year or
          more on a clean one. Carbon blocks are judged by capacity, and they
          stop removing chlorine before they stop passing water, so change
          them on the calendar rather than waiting for a symptom. On the Osmio
          that is a carbon change every 6 to 12 months and a GAC and KDF
          change every 12 to 18 months, with the ceramic stage rated for three
          years, which works out at roughly £188 a year averaged out. The BWT
          E1 has nothing to buy: you pull the lever once a month and the mesh
          flushes itself to the drain.
        </p>

        {/* ── Reviews ─────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          The two whole house filters worth buying in the UK
        </h2>
        <p className="text-base text-body leading-relaxed mb-6">
          We list two rather than ten because the market splits cleanly in
          two: a cartridge system that treats the water chemically, and a
          backwash strainer that only removes particles. Everything else on
          sale is a variation on one of them.
        </p>

        <div className="space-y-4 mb-8">
          {wholeHouseProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              pageType={PAGE_TYPE}
              placement="guide-card"
              highlight={
                product.id === "osmio-pro-iii-ultimate"
                  ? "Top pick: chlorine, bacteria, lead and nitrates from every tap"
                  : "Value pick: sediment and particles, with nothing to replace"
              }
            />
          ))}
        </div>

        <div className="space-y-8">
          {osmio && (
            <ProductReview
              product={osmio}
              heading="Osmio PRO-III Ultimate: top pick"
              verdict="The widest removal list, the strongest certifications, and the only one here that goes beyond chlorine and grit."
              review="Osmio build this in the UK and it is the whole house filter to buy if you want the water treated rather than merely strained. Three stages sit in line: a ceramic stage rated for three years that is listed for bacteria, a carbon stage for chlorine and taste that is changed every 6 to 12 months, and a GAC and KDF stage, changed every 12 to 18 months, that is listed for lead, heavy metals, nitrates, hormones and pharmaceutical residues. It is certified to NSF/ANSI 42 and 61 through IAPMO and carries WaterMark approval, which is a stronger paper trail than most whole house systems sold in Britain can show. Be clear about three things before ordering. It does not soften water, and Osmio say so themselves, so a hard-water home still needs a softener alongside it. There is no PFAS certification, which stands out because Osmio sell a separate PFAS filter. And Osmio do not publish a flow rate, so if you run several showers at once, ask them before you buy. Running cost is the highest here at roughly £188 a year once every stage is counted, although most years only the carbon needs changing."
              pros={osmio.pros}
              cons={[
                ...osmio.cons,
                "Flow rate not published, so check with Osmio for homes with three or more bathrooms",
              ]}
              ctaLabel="View on Osmio"
            />
          )}

          {bwt && (
            <ProductReview
              product={bwt}
              heading="BWT E1 Single Lever: value pick"
              verdict="WRAS approved, self-cleaning, and nothing to buy after the day it is fitted."
              review="The BWT E1 is a different kind of product. Instead of cartridges it has a fine stainless mesh, and once a month you pull a single lever to backwash the collected grit to the drain. That is the whole maintenance routine, and it is why the annual cost is zero. It is WRAS approved, rated at 25 L/min, which covers a typical one or two bathroom home, and compact enough for a utility cupboard. The trade is what it does not do: it is listed for sediment, chlorine and particles, not for metals, bacteria or nitrates, so if your water needs treating rather than straining, it is not enough on its own. Where it earns its place is on old mains that shed rust and grit, as the first stage in front of a softener, and for anyone who wants boiler and appliance protection without a cartridge subscription. At around £250 plus fitting, it is the cheapest system here to own over five years by a wide margin."
              pros={bwt.pros}
              cons={bwt.cons}
              ctaLabel="View on Amazon"
            />
          )}
        </div>

        {/* ── Comparison ──────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Side by side
        </h2>
        <p className="text-base text-muted mb-6">
          Listed removals, price and annual cost from the manufacturers&apos;
          own specifications. Neither reduces hardness.
        </p>
        <div className="card p-4 lg:p-6">
          <ProductComparisonTable
            pageType={PAGE_TYPE}
            campaign={PAGE_TYPE}
            products={wholeHouseProducts}
            contaminants={comparisonContaminants}
          />
          <AffiliateNote className="mt-4" />
        </div>

        <RunningCostComparison
          products={wholeHouseProducts}
          pageType={PAGE_TYPE}
          campaign={PAGE_TYPE}
        />
        <p className="text-sm text-muted mt-3">
          Add £150 to £300 for a plumber to either total. The five-year
          figures above are unit plus cartridges only.
        </p>

        {/* ── Installation ────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Fitting a whole house filter
        </h2>
        <div className="border-y border-rule divide-y divide-rule">
          {INSTALL_STEPS.map((step) => (
            <div key={step.title} className="py-5 sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(0,3fr)] sm:gap-6">
              <h3 className="text-base font-medium text-ink">{step.title}</h3>
              <p className="text-base text-body leading-relaxed mt-1 sm:mt-0">{step.body}</p>
            </div>
          ))}
        </div>
        <p className="text-base text-body leading-relaxed mt-6">
          Fitting a softener as well? The order on the main is sediment
          filter, then softener, then carbon, and one plumber visit covers
          all of it. The softener side is in{" "}
          <Link href="/guides/water-softener-installation-uk/" className="text-accent hover:underline">
            water softener installation UK
          </Link>
          .
        </p>

        {/* ── PFAS and the limits ─────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          The honest limits: PFAS, fluoride and lead
        </h2>
        <p className="text-base text-body leading-relaxed">
          Activated carbon does reduce some PFAS compounds, and you will see
          whole house systems marketed on that basis. Treat the claim with
          care. Water passes a point-of-entry carbon block far faster than it
          passes an under-sink filter, contact time is what PFAS removal
          depends on, and neither system in this guide carries a PFAS
          certification. The certified route is a reverse osmosis system or an
          under-sink filter tested to NSF/ANSI 53 or 58 for PFAS at the tap
          you drink from. Our{" "}
          <Link href="/guides/best-water-filter-pfas/" className="text-accent hover:underline">
            PFAS filter guide
          </Link>{" "}
          and{" "}
          <Link href="/guides/best-reverse-osmosis-system-uk/" className="text-accent hover:underline">
            reverse osmosis guide
          </Link>{" "}
          cover those.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          Fluoride passes straight through carbon and ceramic; only reverse
          osmosis removes it at home. Lead is a pipe problem rather than a
          mains problem: the water company&apos;s network is lead-free, and
          what reaches the tap in older homes comes from the supply pipe and
          internal plumbing. A point-of-entry filter can only treat lead that
          is already in the water when it arrives, so if your home was built
          before 1970 and never replumbed, read{" "}
          <Link href="/guides/lead-pipes-uk/" className="text-accent hover:underline">
            lead pipes UK
          </Link>{" "}
          first.
        </p>

        {/* ── Verdict ─────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Our verdict
        </h2>
        <p className="text-base text-body leading-relaxed">
          Buy the <strong className="text-ink">Osmio PRO-III Ultimate</strong>{" "}
          if you want chlorine gone from every tap and shower and you care
          about the longer list: bacteria, lead, nitrates and other metals.
          It is UK-made, certified to NSF/ANSI 42 and 61 with WaterMark
          approval, and its ceramic stage runs three years. Go in knowing it
          costs around £499 plus fitting and roughly £188 a year to run.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          Buy the <strong className="text-ink">BWT E1</strong> if your
          problem is grit, rust and particles rather than chemistry, or as the
          first stage in front of a softener. WRAS approved, 25 L/min, and
          nothing to replace, it is the cheapest whole house filter to live
          with by a wide margin.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          Buy neither if limescale is your complaint. Check the hardness at
          your postcode and start with the softener guides instead.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          {osmio && (
            <AffiliateLink
              href={osmio.affiliateUrl}
              pageType={PAGE_TYPE}
              recommendationReason="verdict"
              productCategory={osmio.category}
              productSlug={osmio.slug}
              placement="guide-verdict"
              campaign={PAGE_TYPE}
              className="inline-flex items-center justify-center gap-2 bg-btn text-white rounded-lg px-6 py-3 text-sm font-medium hover:bg-btn-hover transition-colors"
            >
              View the Osmio PRO-III Ultimate
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </AffiliateLink>
          )}
          {bwt && (
            <AffiliateLink
              href={bwt.affiliateUrl}
              pageType={PAGE_TYPE}
              recommendationReason="verdict"
              productCategory={bwt.category}
              productSlug={bwt.slug}
              placement="guide-verdict"
              campaign={PAGE_TYPE}
              className="inline-flex items-center justify-center gap-2 border border-rule text-ink rounded-lg px-6 py-3 text-sm font-medium hover:bg-wash transition-colors"
            >
              View the BWT E1 on Amazon
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
            ["/guides/do-i-need-a-water-softener/", "Do I need a water softener?"],
            ["/guides/best-water-softener-uk/", "Best water softener UK"],
            ["/guides/best-shower-filter-uk/", "Best shower filter UK, if you only want chlorine out of the shower"],
            ["/guides/best-under-sink-water-filter-uk/", "Best under sink water filter UK, for drinking water alone"],
            ["/guides/best-reverse-osmosis-system-uk/", "Best reverse osmosis system UK"],
            ["/filters/whole-house-filters/", "All whole house filters we review"],
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
          Removal claims, certifications, flow rates and cartridge intervals are
          taken from the manufacturers&apos; published specifications; plumber
          costs are typical UK ranges. We earn a commission on purchases made
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
