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
const SLUG = "best-water-testing-kit-uk";
const URL = `https://www.tapwater.uk/guides/${SLUG}`;
const PAGE_TYPE = "best-water-testing-kit-guide";
const TITLE = `Best Water Testing Kit UK (${year}): Strips, TDS and Lab Tests`;
const DESCRIPTION =
  "Home water test kits for UK tap water: what strips, TDS meters and lab tests can and cannot detect, when a lab test is worth it, and how to read results.";

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
    question: "What is the best water testing kit for UK tap water?",
    answer:
      "For most UK homes on a mains supply, the best first test is free: your water company's compliance data for your supply zone, which we hold for 2,800 postcode districts. If you then want to check your own tap, the SimplexHealth 17-in-1 strips at around £13 screen hardness, pH, chlorine, lead and more in two minutes, and the SJ WAVE 16-in-1 at around £15 gives you 150 strips for repeat testing. Neither detects PFAS or microplastics. If you need a number you can act on, for lead in an old house, a private supply, or after plumbing work, a UKAS-accredited laboratory test is the only home test that gives one.",
  },
  {
    question: "Water test strips or a lab test: which should I use?",
    answer:
      "Strips are a screen, a lab is a measurement. A strip gives you a colour that you match to a chart, so the result is a band, such as 'lead between 0 and 15 parts per billion', and it depends on your eye and your lighting. That is enough to spot high hardness, odd pH or a lot of chlorine. A laboratory test gives you a figure with a stated uncertainty for each parameter, run to the same standards the regulator uses, and it is the only route to PFAS, microplastics or a reliable lead figure. Screen with strips if you are curious; go straight to a lab if you have a specific reason to worry.",
  },
  {
    question: "Can a home water test kit detect lead?",
    answer:
      "Strips can flag it but not measure it well. Both kits here include a lead pad, and a strong colour change tells you to investigate, but the UK limit for lead is 10 micrograms per litre and strip bands are too coarse to tell you whether you are under or over it. If your home was built before 1970 and the supply pipe has never been replaced, ask your water company first: most will test for lead free of charge because it is their compliance problem too. Otherwise a UKAS-accredited lab test on a first-draw morning sample is the test that answers the question.",
  },
  {
    question: "Can a TDS meter tell me if my water is safe?",
    answer:
      "No. A TDS meter measures total dissolved solids by how well the water conducts electricity, which mostly reflects the calcium, magnesium and other harmless minerals that make water hard. It cannot see lead, PFAS, nitrate, bacteria or pesticides, and a reading of 50 can be less safe than a reading of 400. What a TDS meter is good for is checking a filter is working, which is why the ZeroWater jug ships with one, and getting a rough sense of hardness. It is not a safety test.",
  },
  {
    question: "How can I test my tap water for free in the UK?",
    answer:
      "Two ways. First, enter your postcode on TapWater.uk: we show the readings your water company reports for your supply zone, including hardness, chlorine, lead, nitrate and PFAS where it has been tested, against the UK limits. Second, contact your water company. Every UK supplier publishes a water quality report by postcode, and if you suspect lead pipes most will send someone to sample your tap for free. Buying a kit makes sense when you want to check your own pipework, not the mains, or you are on a private supply.",
  },
  {
    question: "When is a lab water test worth paying for?",
    answer:
      "Four situations. You are on a private well, spring or borehole, where nobody tests the water for you and bacteria, nitrate and metals are your responsibility; annual testing is the norm. Your house predates 1970 and still has its original supply pipe, and you want a lead figure rather than a colour band. You have just had plumbing or building work and want to confirm nothing has leached into the water. Or you are about to spend several hundred pounds on a reverse osmosis system to remove something specific, and a test costing a fraction of that would tell you whether you need to. Use a laboratory accredited by UKAS for drinking water analysis.",
  },
  {
    question: "What should I test my tap water for?",
    answer:
      "For a mains supply: hardness, because it decides whether you need a softener; pH, because very low pH corrodes pipes; chlorine, because it is always there and drives taste; lead, if the house is old; and nitrate, if you are in a farming area. Both strip kits here cover those. Add bacteria if you are on a private supply, and PFAS only if your postcode data shows detections, because only a lab can test for it. Testing for everything is a waste of money; the postcode data tells you which few things are worth checking at your own tap.",
  },
  {
    question: "How do I read water test results against UK limits?",
    answer:
      "UK drinking water standards are set in the Water Supply (Water Quality) Regulations. The ones a home test touches are lead at 10 micrograms per litre, nitrate at 50 milligrams per litre, copper at 2 milligrams per litre, iron at 200 micrograms per litre, fluoride at 1.5 milligrams per litre and pH between 6.5 and 9.5. Hardness has no limit because it is not a health issue, and chlorine has no numeric UK limit. For PFAS, the Drinking Water Inspectorate uses a guideline of 0.1 micrograms per litre for individual compounds. Compare your figure to the limit, and if a strip band straddles the limit, treat it as a reason to get a lab test rather than a result. Each contaminant page on TapWater.uk shows the limit and the readings in your area.",
  },
];

type Verdict = boolean | "partly";

const METHOD_ROWS: {
  what: string;
  strips: Verdict;
  tds: Verdict;
  lab: Verdict;
}[] = [
  { what: "Hardness (limescale)", strips: true, tds: "partly", lab: true },
  { what: "pH", strips: true, tds: false, lab: true },
  { what: "Chlorine", strips: true, tds: false, lab: true },
  { what: "Lead: is there any?", strips: "partly", tds: false, lab: true },
  { what: "Lead: over or under the 10 µg/L limit?", strips: false, tds: false, lab: true },
  { what: "Nitrate", strips: true, tds: false, lab: true },
  { what: "Iron and copper", strips: true, tds: false, lab: true },
  { what: "Bacteria", strips: "partly", tds: false, lab: true },
  { what: "PFAS", strips: false, tds: false, lab: true },
  { what: "Microplastics", strips: false, tds: false, lab: true },
  { what: "Is my filter still working?", strips: "partly", tds: true, lab: true },
];

const UK_LIMITS: { param: string; limit: string; note: string; href: string | null }[] = [
  { param: "Lead", limit: "10 µg/L", note: "From your own pipes, not the mains. Sample first thing in the morning.", href: "/contaminant/lead" },
  { param: "Nitrate", limit: "50 mg/L", note: "Higher in arable areas; matters most for babies.", href: "/contaminant/nitrate" },
  { param: "Copper", limit: "2 mg/L", note: "New copper pipework; a metallic taste is the clue.", href: "/contaminant/copper" },
  { param: "Iron", limit: "200 µg/L", note: "Brown water and staining, usually from old mains.", href: "/contaminant/iron" },
  { param: "Fluoride", limit: "1.5 mg/L", note: "Added in parts of the West Midlands and North East.", href: "/contaminant/fluoride" },
  { param: "pH", limit: "6.5 to 9.5", note: "Below 6.5 corrodes pipes and pulls metals into the water.", href: null },
  { param: "PFAS (individual)", limit: "0.1 µg/L guideline", note: "DWI guideline value; only a lab can measure it.", href: "/contaminant/pfas" },
  { param: "Hardness", limit: "No limit", note: "Not a health issue. Over 200 mg/L is where a softener pays.", href: "/hardness" },
  { param: "Chlorine", limit: "No numeric UK limit", note: "Always present; a filter removes the taste.", href: "/contaminant/chlorine" },
];

const WHEN_LAB: { who: string; why: string; fit: Verdict }[] = [
  {
    who: "Private well, spring or borehole",
    why: "Nobody tests this water but you. Bacteria, nitrate and metals move with the seasons, so a UKAS-accredited lab test once a year is the baseline, and strips between tests catch changes.",
    fit: true,
  },
  {
    who: "House built before 1970 with its original supply pipe",
    why: "Lead almost never comes from the mains; it comes from your pipe. Ask the water company for a free lead test first. If you want your own figure, a lab test on a first-draw morning sample is the one that gives it.",
    fit: true,
  },
  {
    who: "After plumbing or building work",
    why: "New solder, flux and disturbed pipework can leach metals for a while. A lab test a few weeks after the work tells you whether it has settled.",
    fit: true,
  },
  {
    who: "About to buy a reverse osmosis system for PFAS or nitrate",
    why: "Check the postcode data first. If it shows detections, a lab test confirms it at your tap before you spend several hundred pounds on removal.",
    fit: "partly",
  },
  {
    who: "Mains supply, no old pipes, water tastes fine",
    why: "The free data already answers it. A strip kit is a reasonable £13 curiosity; a lab test is money you do not need to spend.",
    fit: false,
  },
  {
    who: "Checking a filter or softener is still working",
    why: "A TDS meter or a hardness strip does this for pennies. You are comparing before and after, not measuring against a limit, so precision does not matter.",
    fit: false,
  },
];

/* ── Helpers ─────────────────────────────────────────────────────────── */

function VerdictMark({ value, label }: { value: Verdict; label: string }) {
  if (value === "partly") {
    return <Minus className="w-4 h-4 text-amber-600 mx-auto" aria-label={`${label}: partly`} />;
  }
  return value ? (
    <Check className="w-4 h-4 text-safe mx-auto" aria-label={`${label}: yes`} />
  ) : (
    <X className="w-4 h-4 text-faint mx-auto" aria-label={`${label}: no`} />
  );
}

function FitMark({ fit }: { fit: Verdict }) {
  if (fit === "partly") {
    return <Minus className="w-4 h-4 text-amber-600 shrink-0 mt-1" aria-label="Sometimes" />;
  }
  return fit ? (
    <Check className="w-4 h-4 text-safe shrink-0 mt-1" aria-label="A lab test is worth it" />
  ) : (
    <X className="w-4 h-4 text-warning shrink-0 mt-1" aria-label="A lab test is not needed" />
  );
}

function ProductReview({
  product,
  heading,
  verdict,
  review,
  pros,
  cons,
  ctaLabel,
  tests,
  cannot,
}: {
  product: FilterProduct;
  heading: string;
  verdict: string;
  review: string;
  pros: string[];
  cons: string[];
  ctaLabel: string;
  tests: string[];
  cannot: string[];
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
        <Kicker className="mb-2">Tests for</Kicker>
        <div className="flex flex-wrap gap-1.5">
          {tests.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 rounded-full px-2.5 py-1"
            >
              <Check className="w-3 h-3" aria-hidden="true" />
              {t}
            </span>
          ))}
          {cannot.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1 text-xs bg-wash text-muted border border-rule rounded-full px-2.5 py-1"
            >
              <X className="w-3 h-3" aria-hidden="true" />
              {c}
            </span>
          ))}
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

      <div className="flex items-center justify-between gap-4 flex-wrap mt-6 pt-4 border-t border-rule">
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

export default function BestWaterTestingKitGuide() {
  const testingProducts = getProductsByCategory("testing_kit");
  const simplex = testingProducts.find((p) => p.id === "simplexhealth-17-in-1");
  const sjWave = testingProducts.find((p) => p.id === "sj-wave-16-in-1");

  const highlights: Record<string, string> = {
    "simplexhealth-17-in-1": "Quick screen: 17 parameters in two minutes, the cheapest way to check your own tap",
    "sj-wave-16-in-1": "Repeat testing: 150 strips, with a bacteria test for private supplies",
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Guides", url: "https://www.tapwater.uk/guides" },
          { name: "Best Water Testing Kit UK", url: URL },
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
        <GuideBreadcrumb title="Best Water Testing Kit UK" />

        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          Best Water Testing Kit UK ({year})
        </h1>
        <GuideByline updated={`September ${year}`} />

        <p className="text-lg text-body leading-relaxed">
          Most people looking for a water test kit do not need one. If you are
          on a mains supply in the UK, your water company already tests it
          thousands of times a year and publishes the results, and we hold
          those readings for 2,800 postcode districts. Start there. A kit
          earns its place when you want to check your own pipes rather than
          the mains, when you are on a private supply, or when you need a
          figure a strip cannot give you.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          This guide explains what the three kinds of home water test, strips,
          digital TDS meters and laboratory tests, can and cannot tell you,
          when a lab test is worth paying for, how to read a result against
          the UK limits, and reviews the two strip kits worth buying.
        </p>

        <GeoCitation
          headline={`According to TapWater.uk's ${year} guide, most UK households on a mains supply do not need a water testing kit, because their water company's compliance data already covers their supply zone.`}
          detail="Strip kits such as the SimplexHealth 17-in-1 screen hardness, pH, chlorine and lead in minutes; no strip or TDS meter can detect PFAS or measure lead against the 10 µg/L limit. That needs a UKAS-accredited laboratory."
        />

        <GuideDisclosure />

        {/* ── Free data first ─────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-10 mb-4">
          Check the free data first
        </h2>
        <p className="text-base text-body leading-relaxed">
          Every UK water company samples its supply zones continuously and
          reports the results to the Drinking Water Inspectorate, which
          publishes compliance at over 99.9%. Those reports cover hardness,
          chlorine, lead, nitrate, iron, pH and dozens of other parameters,
          and increasingly PFAS. They describe the water leaving the network,
          which for most homes is the water at the tap.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          Where they cannot help is the last few metres. Lead comes from a
          supply pipe or internal plumbing in older homes, not from the mains,
          so a clean zone reading says nothing about a 1930s terrace with its
          original pipe. Copper comes from new pipework. And a private well or
          borehole is not in anyone&apos;s data but yours. Those are the cases
          a kit is for.
        </p>

        <div className="mt-8 card-elevated p-8 text-center rounded-2xl">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-accent-light flex items-center justify-center">
              <Search className="w-6 h-6 text-accent" aria-hidden="true" />
            </div>
          </div>
          <h3 className="font-display text-xl italic text-ink">
            See what your water company reports for your postcode
          </h3>
          <p className="text-base text-muted mt-2 max-w-md mx-auto">
            Hardness, chlorine, lead, nitrate, PFAS and more, against the UK
            limits, for your supply zone. Free, and for most homes the only
            test you need.
          </p>
          <div className="mt-6 max-w-sm mx-auto">
            <PostcodeSearch />
          </div>
        </div>

        {/* ── Three methods ───────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Strips, TDS meters and lab tests: what each can tell you
        </h2>
        <p className="text-base text-body leading-relaxed mb-6">
          Home water testing means one of three things, and they answer
          different questions. The table is the short version; the notes
          below explain the gaps.
        </p>
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm border-collapse min-w-[520px]">
            <caption className="sr-only">
              What test strips, TDS meters and laboratory tests can detect
            </caption>
            <thead>
              <tr className="border-b border-rule text-left">
                <th className="py-2.5 pr-3 text-xs font-medium text-muted">Question</th>
                <th className="py-2.5 px-3 text-xs font-medium text-muted text-center">Strips</th>
                <th className="py-2.5 px-3 text-xs font-medium text-muted text-center">TDS meter</th>
                <th className="py-2.5 px-3 text-xs font-medium text-muted text-center">Lab test</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {METHOD_ROWS.map((row) => (
                <tr key={row.what}>
                  <td className="py-3 pr-3 font-medium text-ink">{row.what}</td>
                  <td className="py-3 px-3 text-center">
                    <VerdictMark value={row.strips} label="Strips" />
                  </td>
                  <td className="py-3 px-3 text-center">
                    <VerdictMark value={row.tds} label="TDS meter" />
                  </td>
                  <td className="py-3 px-3 text-center">
                    <VerdictMark value={row.lab} label="Lab test" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-faint mt-3">
          A dash means the method gives a hint rather than an answer: a colour
          band for lead, a conductivity number for hardness, a 48-hour
          incubation for bacteria.
        </p>

        <h3 className="font-semibold text-ink text-lg mt-8 mb-2">Test strips</h3>
        <p className="text-base text-body leading-relaxed">
          You dip a strip of chemical pads into a glass of tap water and match
          the colours to a chart. The result is a band, not a number: the
          SimplexHealth strip reports lead as a range, and whether you read it
          as the second or third shade depends on your eyes and your kitchen
          lighting. That is fine for hardness, pH and chlorine, where the
          bands are wide and the question is &ldquo;roughly how much&rdquo;.
          It is not fine for lead, where the UK limit of 10 µg/L sits inside
          a single band. Neither strip kit here detects PFAS, microplastics or
          pharmaceutical residues, and both say so.
        </p>

        <h3 className="font-semibold text-ink text-lg mt-8 mb-2">Digital TDS meters</h3>
        <p className="text-base text-body leading-relaxed">
          A TDS meter is a pen-sized probe that measures how well water
          conducts electricity and converts that to total dissolved solids in
          parts per million. Almost all of what it measures is calcium,
          magnesium and other harmless minerals, so a high reading means hard
          water, not dangerous water, and a low reading does not mean safe. A
          TDS meter cannot detect lead, PFAS, nitrate or bacteria: lead at ten
          times the UK limit would not move the display. What it is genuinely
          good for is checking a filter is working, by comparing the reading
          before and after, which is why the{" "}
          <Link href="/guides/best-water-filter-jug-uk/" className="text-accent hover:underline">
            ZeroWater jug
          </Link>{" "}
          ships with one. Treat it as a filter gauge, not a safety test.
        </p>

        <h3 className="font-semibold text-ink text-lg mt-8 mb-2">Laboratory tests</h3>
        <p className="text-base text-body leading-relaxed">
          You fill sample bottles from your tap following the lab&apos;s
          instructions, post them, and receive a figure with a stated
          uncertainty for each parameter. This is the same kind of analysis
          the water companies and the regulator rely on, and it is the only
          home route to PFAS, microplastics, a bacteria count you can trust,
          or a lead figure you can compare with the limit. Look for a
          laboratory accredited by UKAS for drinking water analysis, choose
          the parameter list to match your actual worry rather than buying the
          longest one, and expect to pay many times the price of a strip kit,
          with prices varying by lab and by what you ask for. We no longer
          list a specific lab kit: the one we used to recommend is not sold in
          the UK.
        </p>

        {/* ── When lab ────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          When a lab test is worth paying for
        </h2>
        <dl className="border-y border-rule divide-y divide-rule">
          {WHEN_LAB.map((row) => (
            <div key={row.who} className="py-4 flex items-start gap-3">
              <FitMark fit={row.fit} />
              <div className="sm:grid sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-6 flex-1">
                <dt className="text-base font-medium text-ink">{row.who}</dt>
                <dd className="text-base text-body leading-relaxed mt-1 sm:mt-0">{row.why}</dd>
              </div>
            </div>
          ))}
        </dl>
        <p className="text-sm text-muted mt-4">
          The lead case in full, including how to tell whether your supply
          pipe is lead, is in{" "}
          <Link href="/guides/lead-pipes-uk/" className="text-accent hover:underline">
            lead pipes in UK homes
          </Link>
          . Sampling technique matters more than the kit: for lead, take the
          first water out of the cold kitchen tap in the morning, before
          anything has run; for everything else, run the tap for a minute
          first.
        </p>

        {/* ── UK limits ───────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          How to read results against UK limits
        </h2>
        <p className="text-base text-body leading-relaxed mb-6">
          A result means nothing without the limit next to it. These are the
          standards from the Water Supply (Water Quality) Regulations that a
          home test is likely to touch. If a strip band straddles a limit,
          that is a reason to get a lab figure, not a result in itself.
        </p>
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm border-collapse min-w-[560px]">
            <caption className="sr-only">UK drinking water limits for common home test parameters</caption>
            <thead>
              <tr className="border-b border-rule text-left">
                <th className="py-2.5 pr-3 text-xs font-medium text-muted">Parameter</th>
                <th className="py-2.5 px-3 text-xs font-medium text-muted whitespace-nowrap">UK limit</th>
                <th className="py-2.5 pl-3 text-xs font-medium text-muted">What it usually means</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {UK_LIMITS.map((row) => (
                <tr key={row.param}>
                  <td className="py-3 pr-3 font-medium text-ink align-top whitespace-nowrap">
                    {row.href ? (
                      <Link href={row.href} className="hover:text-accent">
                        {row.param}
                      </Link>
                    ) : (
                      row.param
                    )}
                  </td>
                  <td className="py-3 px-3 font-data text-ink align-top whitespace-nowrap">{row.limit}</td>
                  <td className="py-3 pl-3 text-body align-top">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted mt-4">
          Each linked contaminant page shows the limit alongside the readings
          reported in your area, so you can see whether a home result is out
          of line with the zone or typical of it.
        </p>

        {/* ── Reviews ─────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          The two water test kits worth buying in the UK
        </h2>
        <p className="text-base text-body leading-relaxed mb-6">
          Both are strip kits, and both do the same job: a two-minute screen
          of your own tap for a few pounds. One is cheaper and tests one more
          parameter; the other gives you enough strips to test every month for
          years and adds a bacteria test.
        </p>

        <div className="space-y-4 mb-8">
          {testingProducts.map((product) => (
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
          {simplex && (
            <ProductReview
              product={simplex}
              heading="SimplexHealth 17-in-1: quick screen"
              verdict="The cheapest, fastest way to check your own tap, as long as you treat the result as a screen."
              review="At around £13, the SimplexHealth 17-in-1 is where most people should start if they want to test at all. It covers 17 parameters, including lead, pH and hardness, and gives you colour-match results in about two minutes with no posting and no waiting. It is accurate enough to flag the obvious: water that is very hard, a pH that is off, a lot of chlorine, or a lead pad that changes colour when it should not. What it cannot do is give you a number. Colour matching is subjective, especially in poor light, so a result is a band rather than a figure, and SimplexHealth are clear that it does not test for PFAS or microplastics. If the strip flags something, that is your cue for a lab test or a call to the water company, not a filter purchase."
              pros={simplex.pros}
              cons={simplex.cons}
              ctaLabel="View on Amazon"
              tests={["Lead", "pH", "Hardness", "Chlorine", "17 parameters in total"]}
              cannot={["PFAS", "Microplastics"]}
            />
          )}

          {sjWave && (
            <ProductReview
              product={sjWave}
              heading="SJ WAVE 16-in-1: repeat testing"
              verdict="150 strips and a bacteria test make this the kit for private supplies and monthly checks."
              review="The SJ WAVE 16-in-1 tests one fewer parameter than the SimplexHealth but comes with 150 strips, which at around £15 is enough for monthly testing for years. That changes what it is for: rather than a one-off screen, it suits anyone who wants to watch their water over time, which mostly means private supplies and people who have just fitted a filter or softener and want to see it holding up. It tests bacteria, lead, iron and copper among others, and the colour chart is printed on the bottle so it does not go missing. The bacteria test needs a 48-hour incubation and is the least precise pad in the kit, and like every strip there is no digital readout, only your eye against a chart. SJ WAVE say it cannot detect PFAS or pharmaceutical residues. For a borehole owner or a monthly habit, it is the better buy of the two."
              pros={sjWave.pros}
              cons={sjWave.cons}
              ctaLabel="View on Amazon"
              tests={["Bacteria (48h)", "Lead", "Iron", "Copper", "16 parameters in total"]}
              cannot={["PFAS", "Pharmaceutical residues"]}
            />
          )}
        </div>

        {/* ── Verdict ─────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Our verdict
        </h2>
        <p className="text-base text-body leading-relaxed">
          Start with your postcode. For most UK homes the water company&apos;s
          data is the test, and it is free. If you want to check your own tap
          once, the <strong className="text-ink">SimplexHealth 17-in-1</strong>{" "}
          at around £13 is the screen to buy. If you are on a private supply
          or want to test every month, the{" "}
          <strong className="text-ink">SJ WAVE 16-in-1</strong> with its 150
          strips and bacteria test is the one.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          If you need a number rather than a colour, for lead in an old house,
          PFAS, or a private supply, no kit on Amazon will give you one. Ask
          your water company for a free lead test if that is the worry, and
          otherwise use a UKAS-accredited laboratory. Skip TDS meters as a
          safety test; keep one only to check a filter is working.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          {simplex && (
            <AffiliateLink
              href={simplex.affiliateUrl}
              pageType={PAGE_TYPE}
              recommendationReason="verdict"
              productCategory={simplex.category}
              productSlug={simplex.slug}
              placement="guide-verdict"
              campaign={PAGE_TYPE}
              className="inline-flex items-center justify-center gap-2 bg-btn text-white rounded-lg px-6 py-3 text-sm font-medium hover:bg-btn-hover transition-colors"
            >
              View the SimplexHealth 17-in-1 on Amazon
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </AffiliateLink>
          )}
          {sjWave && (
            <AffiliateLink
              href={sjWave.affiliateUrl}
              pageType={PAGE_TYPE}
              recommendationReason="verdict"
              productCategory={sjWave.category}
              productSlug={sjWave.slug}
              placement="guide-verdict"
              campaign={PAGE_TYPE}
              className="inline-flex items-center justify-center gap-2 border border-rule text-ink rounded-lg px-6 py-3 text-sm font-medium hover:bg-wash transition-colors"
            >
              View the SJ WAVE 16-in-1 on Amazon
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
            ["/guides/how-to-test-your-water/", "How to test your tap water, step by step"],
            ["/guides/lead-pipes-uk/", "Lead pipes in UK homes"],
            ["/guides/pfas-uk-explained/", "PFAS in UK water, explained"],
            ["/guides/is-uk-tap-water-safe/", "Is UK tap water safe?"],
            ["/guides/best-water-filters-uk/", "Best water filters UK, once you know what to remove"],
            ["/filters/water-testing-kits/", "All water testing kits we review"],
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
          Parameter counts and limitations are taken from the makers&apos;
          published listings. UK limits are from the Water Supply (Water
          Quality) Regulations and Drinking Water Inspectorate guidance. We
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
