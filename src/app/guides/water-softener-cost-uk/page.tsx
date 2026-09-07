import type { Metadata } from "next";
import Link from "next/link";
import { SoftenerLeadForm } from "@/components/softener-lead-form";
import { SoftenerGuidesNav } from "@/components/softener-guides-nav";
import { ProductCard } from "@/components/product-card";
import { ArticleSchema, BreadcrumbSchema, FAQSchema } from "@/components/json-ld";
import { GeoCitation } from "@/components/geo-citation";
import {
  GuideBreadcrumb,
  GuideByline,
  GuideDisclosure,
  GuideFaq,
  GuideFooter,
} from "@/components/guide-chrome";
import { getProductsByCategory } from "@/lib/products";
import { OG_IMAGE } from "@/lib/og";

export const revalidate = 86400;

const year = new Date().getFullYear();
const SLUG = "water-softener-cost-uk";
const URL = `https://www.tapwater.uk/guides/${SLUG}`;
const TITLE = `Water Softener Cost UK (${year}): Unit, Installation and Running Costs`;
const DESCRIPTION =
  "What a water softener costs in the UK: typical unit prices by type, installation at £150 to £300, salt at £5 to £10 a month, and how the payback against limescale damage works.";

export function generateMetadata(): Metadata {
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: URL },
    openGraph: { images: OG_IMAGE, title: TITLE, description: DESCRIPTION, url: URL, type: "article" },
    twitter: { images: OG_IMAGE, card: "summary_large_image", title: TITLE, description: DESCRIPTION },
  };
}

const FAQ_DATA = [
  {
    question: "How much does a water softener cost in the UK?",
    answer:
      "Typically £1,000 to £2,500 installed for a branded unit from Harvey, Kinetico, BWT or Monarch, with non-electric twin-cylinder models at the top of that range and metered single-cylinder models lower down. Budget online units such as Water2Buy sell for a few hundred pounds without fitting. Add £150 to £300 for professional installation if it is not bundled, and £5 to £10 a month for salt.",
  },
  {
    question: "How much does water softener installation cost?",
    answer:
      "Professional installation typically costs £150 to £300 on top of the unit. That covers cutting into the rising main after the stop tap, fitting a bypass, running a drain and overflow, and plumbing a separate hard-water tap in the kitchen. Long pipe runs, a loft location or a boxed-in stop tap push the price toward the top. Premium brands often bundle fitting into the quoted price.",
  },
  {
    question: "What are the running costs of a water softener?",
    answer:
      "Salt is the main cost, roughly £5 to £10 a month for a family home in very hard water, less in a smaller household or in merely hard water. Electric units use a small amount of power for the controller; non-electric units use none. Regeneration uses some water on each cycle, which shows up on a metered bill but as a small line. Resin lasts many years and most units need no annual service contract.",
  },
  {
    question: "Does a water softener save money?",
    answer:
      "In very hard water areas, usually yes over its lifetime. Scale on a heating element insulates it, so a boiler or immersion heater uses more energy for the same hot water; heating elements and pumps in appliances fail early; and you spend more on detergent, descaler and cleaning products. Against typical running costs of £60 to £120 a year, most households in 250 mg/L-plus water see the unit pay for itself within several years. In water under 150 mg/L the sums rarely work.",
  },
  {
    question: "Is a cheap water softener worth it?",
    answer:
      "The resin inside a £400 online unit softens water in exactly the same way as the resin in a £2,000 one. What you pay extra for is twin-cylinder design that keeps softening during regeneration, non-electric operation, a compact cabinet, a UK service network and a long warranty. If you have a plumber and are happy to be your own support line, a budget metered unit is a legitimate choice.",
  },
  {
    question: "Are there grants for water softeners in the UK?",
    answer:
      "No. Water softeners are treated as a household appliance, not an energy efficiency measure, and are not covered by the government home energy schemes. Some water companies and installers run finance or spread-the-cost offers; treat those as loans and compare the total repayable, not the monthly figure.",
  },
];

const COST_LINES: { item: string; range: string; note: string }[] = [
  {
    item: "Non-electric twin-cylinder unit",
    range: "£1,000–£2,500 installed",
    note: "Harvey, Kinetico. Soft water 24 hours a day, block salt, sold through their own installers so fitting is usually in the price.",
  },
  {
    item: "Metered single-cylinder unit",
    range: "lower end of £1,000–£2,500 installed",
    note: "BWT, Monarch. Tablet salt, electric controller, fitted by a local plumber or merchant-approved installer.",
  },
  {
    item: "Budget online unit",
    range: "from a few hundred pounds, unit only",
    note: "Water2Buy and similar. Same resin, no service network. Add fitting below unless you do it yourself.",
  },
  {
    item: "Professional installation",
    range: "£150–£300",
    note: "Mains connection, bypass, drain, hard-water kitchen tap. Awkward pipework or a loft location costs more.",
  },
  {
    item: "Salt",
    range: "£5–£10 a month",
    note: "Family home in very hard water. Tablets are cheaper per kilo than blocks; a 25 kg sack lasts weeks, not days.",
  },
  {
    item: "Electricity",
    range: "pence a month, or nothing",
    note: "A metered controller draws very little. Harvey and Kinetico units have no plug at all.",
  },
  {
    item: "Water for regeneration",
    range: "a small line on a metered bill",
    note: "Each rinse uses some water. Metered units regenerate only when the resin is spent, so a small household rinses less often.",
  },
];

export default function WaterSoftenerCostGuide() {
  const salt = getProductsByCategory("softener_salt");
  const rail = ["hydrosalt-tablets-25kg", "aquasol-tablets-3x25kg"]
    .map((id) => salt.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Guides", url: "https://www.tapwater.uk/guides" },
          { name: "Water Softener Cost UK", url: URL },
        ]}
      />
      <ArticleSchema
        headline={TITLE}
        description={DESCRIPTION}
        url={URL}
        datePublished="2026-09-07"
        dateModified={new Date().toISOString().split("T")[0]}
        authorName="TapWater.uk Research"
        authorUrl="https://www.tapwater.uk/about"
      />
      <FAQSchema faqs={FAQ_DATA} />

      <div className="max-w-3xl mx-auto">
        <GuideBreadcrumb title="Water Softener Cost UK" />
        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          Water softener cost UK ({year})
        </h1>
        <GuideByline updated={`September ${year}`} />

        <p className="text-lg text-body leading-relaxed">
          The honest answer to &ldquo;how much is a water softener&rdquo; is that
          the unit is the smaller half of the question. A softener is bought
          once, fitted once, and then fed salt for fifteen years, while the
          limescale it prevents would otherwise have been quietly charging you
          through your gas bill and your appliance repairs. This guide puts
          typical figures on all of it.
        </p>

        <GeoCitation
          headline={`According to TapWater.uk, a branded water softener in the UK typically costs £1,000 to £2,500 installed in ${year}, with fitting at £150 to £300 where it is not bundled and salt at £5 to £10 a month.`}
          detail="Figures are typical ranges from installer quotes and retail listings, not offers; unit size and pipework move the price more than the brand."
        />

        <GuideDisclosure quotes />

        {/* ── The bill ─────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-12 mb-4">
          The bill, line by line
        </h2>
        <p className="text-base text-body leading-relaxed mb-6">
          Every softener quote breaks down into the same seven lines. The first
          three are alternatives, not a sum: you buy one unit.
        </p>
        <dl className="border-y border-rule divide-y divide-rule">
          {COST_LINES.map((line) => (
            <div key={line.item} className="py-4 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1">
              <dt className="text-base font-medium text-ink">{line.item}</dt>
              <dd className="font-data text-base text-ink text-right whitespace-nowrap">
                {line.range}
              </dd>
              <dd className="col-span-2 text-sm text-muted leading-relaxed">{line.note}</dd>
            </div>
          ))}
        </dl>

        {/* ── Why the unit price varies ────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Why one softener costs three times another
        </h2>
        <p className="text-base text-body leading-relaxed">
          The resin does the same job in every unit, so the spread is not about
          how soft the water gets. It is about four things.
        </p>
        <ul className="mt-4 space-y-3 text-base text-body">
          <li className="pl-5 border-l-2 border-rule">
            <strong className="text-ink">Twin cylinders.</strong> Two resin tanks
            that take turns mean soft water even during regeneration. It is
            the main thing Harvey and Kinetico charge for.
          </li>
          <li className="pl-5 border-l-2 border-rule">
            <strong className="text-ink">No electrics.</strong> A valve driven by
            water flow costs more to engineer than a timer and a plug, and it
            means no socket and nothing to reset after a power cut.
          </li>
          <li className="pl-5 border-l-2 border-rule">
            <strong className="text-ink">Capacity.</strong> A five-person house in
            350 mg/L water needs more resin than a couple in 220 mg/L water.
            Installers size the unit; online buyers often under-size to save
            money and then regenerate constantly.
          </li>
          <li className="pl-5 border-l-2 border-rule">
            <strong className="text-ink">Who stands behind it.</strong> Premium
            brands bundle fitting, a long warranty and a service network. A
            budget online unit bundles a box.
          </li>
        </ul>

        {/* ── Payback ─────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          What limescale is already costing you
        </h2>
        <p className="text-base text-body leading-relaxed">
          Scale is an insulator. When it coats a heating element or the inside
          of a heat exchanger, the boiler burns more gas to push the same heat
          through. The figures quoted in the industry, and in our{" "}
          <Link href="/hardness/" className="text-accent hover:underline">
            hardness explainer
          </Link>
          , put even a millimetre or two of scale at several percent extra
          energy for water heating. On top of that sit the things you pay for
          directly: immersion heaters and washing machine elements that fail
          early, shower heads and taps that need replacing, and the extra
          detergent and descaler a hard-water household gets through.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          Put the two columns side by side and the pattern is consistent. In
          very hard water, above 250 mg/L, a household with a gas combi and the
          usual appliances typically covers the running cost many times over
          and recovers the purchase price within several years. In hard water
          around 200 mg/L it still works, more slowly. Below about 150 mg/L,
          the scale is not costing you enough for the arithmetic to close, and
          descaling the kettle is the better buy.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          Not sure which band you are in?{" "}
          <Link href="/guides/do-i-need-a-water-softener/" className="text-accent hover:underline">
            Check your postcode first
          </Link>
          .
        </p>

        <div className="mt-10">
          <SoftenerLeadForm
            hardnessValue={220}
            hardnessLabel="hard"
            source="softener_guide"
            heading="Turn the ranges into a real number"
            intro="Installers price by unit size and your pipework, so the only accurate cost is a quote for your home. Request free quotes from installers covering your postcode and compare at least two."
          />
        </div>

        {/* ── Running cost detail ─────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          The salt bill in practice
        </h2>
        <p className="text-base text-body leading-relaxed">
          How much salt you use depends on how hard the water is and how much
          of it you run: harder water and more people mean more frequent
          regeneration. A metered unit only rinses when the resin is spent, so
          it wastes little. As a rule of thumb a family home in very hard water
          budgets £5 to £10 a month, and buying tablets by the 25 kg sack rather
          than the 10 kg bag brings the per-kilo price down. Block salt for
          twin-cylinder cabinets costs more per kilo and is the trade for
          convenience.
        </p>
        <div className="mt-6 space-y-4">
          {rail.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              pageType="water-softener-cost-guide"
              placement="guide-salt-rail"
              highlight={
                product.id === "hydrosalt-tablets-25kg"
                  ? "The usual monthly sack"
                  : "Bulk buy for very hard water"
              }
            />
          ))}
        </div>
        <p className="text-sm text-muted mt-4">
          Which format your softener takes, and how to store it, is in{" "}
          <Link href="/guides/water-softener-salt-guide/" className="text-accent hover:underline">
            the salt guide
          </Link>
          .
        </p>

        {/* ── Ways to spend less ──────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Where the savings are, and where they are not
        </h2>
        <dl className="divide-y divide-rule border-y border-rule">
          {[
            [
              "Get two or three quotes",
              "Dealer pricing on the premium brands varies by region. This is the single biggest lever and it costs nothing.",
            ],
            [
              "Size it right, not big",
              "An oversized unit costs more and holds stale water between regenerations. Installers size on people and hardness; give them honest numbers.",
            ],
            [
              "Buy the unit online and use your own plumber",
              "Legitimate, and cheaper. You lose the brand's fitting warranty and service line, so it suits people who are comfortable troubleshooting.",
            ],
            [
              "Do not skip the hard-water tap",
              "It looks like a saving. It is the tap the Drinking Water Inspectorate advises you keep for drinking, cooking and infant formula.",
            ],
            [
              "Ignore the monthly finance figure",
              "Compare the total repayable against paying outright. A softener is a fifteen-year purchase; do not finance it over five at a high rate.",
            ],
          ].map(([head, body]) => (
            <div key={head} className="py-4 sm:grid sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-6">
              <dt className="text-base font-medium text-ink">{head}</dt>
              <dd className="text-base text-body leading-relaxed mt-1 sm:mt-0">{body}</dd>
            </div>
          ))}
        </dl>

        <GuideFaq faqs={FAQ_DATA} />

        <SoftenerGuidesNav current={SLUG} className="mt-14" />

        <GuideFooter reviewed={`September ${year}`} />
      </div>
    </div>
  );
}
