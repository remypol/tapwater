import type { Metadata } from "next";
import Link from "next/link";
import { Check, X, Search, Minus } from "lucide-react";
import { PostcodeSearch } from "@/components/postcode-search";
import { ProductCard } from "@/components/product-card";
import { SoftenerLeadForm } from "@/components/softener-lead-form";
import { SoftenerGuidesNav } from "@/components/softener-guides-nav";
import { HardnessBands } from "@/components/hardness-bands";
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
const SLUG = "best-water-softener-uk";
const URL = `https://www.tapwater.uk/guides/${SLUG}`;
const TITLE = `Best Water Softener UK (${year})`;
const DESCRIPTION =
  "Harvey, Kinetico, BWT, Monarch and Water2Buy compared: twin-cylinder vs metered, block salt vs tablets, real UK costs, and whether your postcode needs one at all.";

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
    question: "Which is the best water softener in the UK?",
    answer:
      "There is no single best unit, but there is a best type for each home. Harvey and Kinetico make non-electric twin-cylinder softeners that give soft water around the clock and run on block salt; they cost the most, typically £1,000 to £2,500 installed. BWT and Monarch make metered single-cylinder units, usually on tablet salt, that cost less and suit most households. Water2Buy sells budget metered units online for self-install. Pick the type first, then get two or three quotes.",
  },
  {
    question: "Do I need a water softener in the UK?",
    answer:
      "Only if your water is hard. Around 60% of England has hard or very hard water, above 200 mg/L calcium carbonate, and at that level a softener stops limescale forming in your boiler, kettle, shower and washing machine. Most of Scotland, Wales and north-west England has soft water and a softener would do nothing useful. Check your postcode on TapWater.uk to see your own reading before you spend anything.",
  },
  {
    question: "How much does a water softener cost in the UK?",
    answer:
      "Premium twin-cylinder units from Harvey or Kinetico typically cost £1,000 to £2,500 installed. Metered single-cylinder units from BWT or Monarch usually come in lower within that range, and budget online brands such as Water2Buy sell the unit alone for considerably less if you can arrange fitting yourself. Professional installation is typically £150 to £300 on top of the unit. Salt runs at roughly £5 to £10 a month for a family home.",
  },
  {
    question: "Twin-cylinder or single-cylinder: what is the difference?",
    answer:
      "A single-cylinder softener has one tank of resin. When it regenerates, usually overnight, it cannot soften water, so hard water reaches the taps for an hour or so. A twin-cylinder softener has two smaller tanks and regenerates one while the other keeps working, so the water is soft 24 hours a day. Twin-cylinder units are usually non-electric, driven by water flow, and cost more.",
  },
  {
    question: "Block salt or tablet salt?",
    answer:
      "It is decided by the softener, not by you. Harvey, Kinetico and some BWT units take 4 kg blocks that drop into the cabinet; most metered single-cylinder units take tablets poured into a brine tank. Blocks are tidier and lighter to handle; tablets are cheaper per kilogram and sold in 10 kg and 25 kg bags. Neither is better at softening water, and the resin does not care which you use.",
  },
  {
    question: "Is softened water safe to drink?",
    answer:
      "For most healthy adults, yes. Ion exchange swaps calcium and magnesium for a little sodium, and in most UK areas the result stays under the 200 mg/L sodium limit set by the drinking water regulations. The Drinking Water Inspectorate advises keeping an unsoftened tap for drinking and cooking, and softened water should not be used to make up infant formula because of the extra sodium. Installers fit a hard-water tap in the kitchen as standard.",
  },
  {
    question: "Is a salt-free water softener any good?",
    answer:
      "Salt-free conditioners and electronic descalers do not remove hardness; the water tests just as hard afterwards. Some people report less scale sticking to surfaces, but independent evidence is thin and results vary between homes. If you want soft water that lathers, protects the boiler and stops scale forming, an ion exchange softener is the only technology that reliably does it.",
  },
];

interface Brand {
  name: string;
  origin: string;
  type: string;
  power: "none" | "mains";
  salt: "Block" | "Tablet" | "Block or tablet";
  softAllDay: boolean;
  typicalCost: string;
  bought: string;
  verdict: string;
}

const BRANDS: Brand[] = [
  {
    name: "Harvey",
    origin: "UK-made, Surrey",
    type: "Non-electric twin-cylinder",
    power: "none",
    salt: "Block",
    softAllDay: true,
    typicalCost: "£1,000–£2,500 installed",
    bought: "Through Harvey's own installers",
    verdict:
      "The reference twin-cylinder softener in Britain. Two small resin tanks, no plug, block salt that drops in from the top, and soft water while the other cylinder regenerates. You pay for that at the top of the range, and you buy through Harvey's own network rather than a local plumber.",
  },
  {
    name: "Kinetico",
    origin: "US brand, UK dealer network",
    type: "Non-electric twin-tank",
    power: "none",
    salt: "Block",
    softAllDay: true,
    typicalCost: "£1,000–£2,500 installed",
    bought: "Through independent Kinetico dealers",
    verdict:
      "The other premium non-electric option, sold and fitted by regional dealers. Mechanically similar to Harvey: water flow drives the valve, regeneration happens on demand rather than on a timer, and UK models run on block salt. Dealer pricing varies, which is exactly why two quotes beat one.",
  },
  {
    name: "BWT",
    origin: "European group, UK range",
    type: "Metered single-cylinder, plus block-salt models",
    power: "mains",
    salt: "Block or tablet",
    softAllDay: false,
    typicalCost: "£1,000–£2,500 installed",
    bought: "Plumbers' merchants and approved installers",
    verdict:
      "A large water-treatment group with a wide UK range, from compact tablet-salt units to block-salt models. Metered control means it regenerates by the volume you have used rather than on a fixed schedule. Widely stocked, so any competent plumber can fit and service one.",
  },
  {
    name: "Monarch",
    origin: "UK company",
    type: "Metered single-cylinder",
    power: "mains",
    salt: "Tablet",
    softAllDay: false,
    typicalCost: "£1,000–£2,500 installed",
    bought: "Plumbers' merchants and independent installers",
    verdict:
      "A long-standing British name in metered softeners. Single cylinder, electric timer and meter, tablet salt in a brine tank. Typically towards the lower end of the installed range for a family-sized unit, with parts and salt easy to find. The sensible default for a household that does not need 24-hour soft water.",
  },
  {
    name: "Water2Buy",
    origin: "Online brand",
    type: "Metered single-cylinder",
    power: "mains",
    salt: "Tablet",
    softAllDay: false,
    typicalCost: "From a few hundred pounds, unit only",
    bought: "Direct online, self-install or your own plumber",
    verdict:
      "The budget route. You buy the unit online for a fraction of a Harvey and either fit it yourself or pay a local plumber the typical £150 to £300. Same ion exchange resin, same soft water; what you give up is the brand service network and the design polish. Good value if you are comfortable with a spanner or already know a plumber.",
  },
];

const TYPE_ROWS: {
  feature: string;
  twin: boolean | string;
  single: boolean | string;
}[] = [
  { feature: "Soft water during regeneration", twin: true, single: false },
  { feature: "Needs a plug socket", twin: false, single: true },
  { feature: "Regenerates by water used, not by clock", twin: true, single: "Metered models yes" },
  { feature: "Usual salt format", twin: "Block", single: "Tablet" },
  { feature: "Fits under a kitchen sink", twin: "Most models", single: "Compact models" },
  { feature: "Typical installed cost", twin: "£1,000–£2,500", single: "Lower end of range" },
  { feature: "Brands", twin: "Harvey, Kinetico", single: "BWT, Monarch, Water2Buy" },
];

function Cell({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span className="text-sm text-ink">{value}</span>;
  }
  return value ? (
    <Check className="w-4 h-4 text-safe mx-auto" aria-label="Yes" />
  ) : (
    <X className="w-4 h-4 text-warning mx-auto" aria-label="No" />
  );
}

/* ── Page ────────────────────────────────────────────────────────────── */

export default function BestWaterSoftenerGuide() {
  const salt = getProductsByCategory("softener_salt");
  const rail = ["hydrosalt-tablets-25kg", "bwt-block-salt-8kg", "simplexhealth-hardness-tablets"]
    .map((id) => salt.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Guides", url: "https://www.tapwater.uk/guides" },
          { name: "Best Water Softener UK", url: URL },
        ]}
      />
      <ArticleSchema
        headline={TITLE}
        description={DESCRIPTION}
        url={URL}
        datePublished="2026-04-07"
        dateModified={new Date().toISOString().split("T")[0]}
        authorName="TapWater.uk Research"
        authorUrl="https://www.tapwater.uk/about"
      />
      <FAQSchema faqs={FAQ_DATA} />

      <div className="max-w-3xl mx-auto">
        <GuideBreadcrumb title="Best Water Softener UK" />

        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          Best Water Softener UK ({year})
        </h1>
        <GuideByline updated={`September ${year}`} />

        <p className="text-lg text-body leading-relaxed">
          A water softener is the one home water product where the technology is
          settled and the decision is not. Every unit worth buying works the same
          way, by swapping the calcium and magnesium that make limescale for a
          little sodium. What differs is whether it keeps softening while it
          cleans itself, what kind of salt it eats, who fits it, and what all of
          that costs over the fifteen or so years it will sit in your cupboard.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          This guide compares the five names you will actually be quoted for in
          Britain, Harvey, Kinetico, BWT, Monarch and Water2Buy, explains the two
          designs they split into, and starts with the question the brochures
          skip: whether the water at your postcode is hard enough to justify one.
        </p>

        <GeoCitation
          headline={`According to TapWater.uk's analysis of 2,800 UK postcode districts, more than half of England receives hard or very hard water above 200 mg/L, the level at which an ion exchange softener is worth installing.`}
          detail={`For ${year}, Harvey and Kinetico lead on 24-hour soft water with non-electric twin cylinders; Monarch and BWT are the value metered picks; Water2Buy is the budget self-install route.`}
        />

        <GuideDisclosure quotes />

        <SoftenerLeadForm
          hardnessValue={220}
          hardnessLabel="hard"
          source="softener_guide"
          heading="Get softener quotes for your postcode"
          intro="Softeners are sold installed, so the real price is a quote, not a sticker. Tell us where you live and we will match you with installers who cover your area. Compare two or three before you decide."
        />

        {/* ── Do you need one ─────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          First: does your water need softening?
        </h2>
        <p className="text-base text-body leading-relaxed">
          Water companies report hardness in milligrams per litre of calcium
          carbonate. Below about 120 mg/L you will barely notice scale. Between
          120 and 200 you will see it on taps and in the kettle and can usually
          manage with descaler. From 200 upwards, the band most of London, the
          South East, East Anglia and the Midlands sits in, scale forms fast
          enough to cost you in boiler efficiency and appliance life, and a
          softener starts to pay for itself.
        </p>

        <HardnessBands />

        <div className="card-elevated p-8 text-center rounded-2xl">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-accent-light flex items-center justify-center">
              <Search className="w-6 h-6 text-accent" aria-hidden="true" />
            </div>
          </div>
          <h3 className="font-display text-xl italic text-ink">
            Check the hardness at your postcode
          </h3>
          <p className="text-base text-muted mt-2 max-w-md mx-auto">
            We hold the reading your water company reports for your supply
            zone. If it is 200 mg/L or more, carry on reading. If it is under
            120, save your money.
          </p>
          <div className="mt-6 max-w-sm mx-auto">
            <PostcodeSearch />
          </div>
        </div>
        <p className="text-sm text-muted mt-4">
          Not sure what the number means for your home? Start with{" "}
          <Link href="/guides/do-i-need-a-water-softener/" className="text-accent hover:underline">
            do I need a water softener
          </Link>
          , which walks through the bands and the symptoms.
        </p>

        {/* ── Two designs ─────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          The two designs, and why the price gap exists
        </h2>
        <p className="text-base text-body leading-relaxed">
          Inside every softener is a cylinder of resin beads that grab calcium
          and magnesium and release sodium. Once the beads are full the unit
          rinses them with brine, which is why it needs salt and a drain. The
          fork in the road is what happens during that rinse.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          A <strong className="text-ink">single-cylinder</strong> softener has
          one resin tank. While it regenerates, usually in the small hours, it
          passes hard water through to the taps. Most are electric: a meter
          counts the litres you have used and a controller decides when to
          rinse. A <strong className="text-ink">twin-cylinder</strong> softener
          splits the resin across two tanks and regenerates one while the other
          keeps softening. Harvey and Kinetico build theirs without electricity
          at all, using the flow of water to drive the valve. You get soft water
          at 3 a.m. and no plug socket in the cupboard; you also pay for two of
          everything.
        </p>

        <div className="overflow-x-auto -mx-4 px-4 mt-6">
          <table className="w-full text-sm border-collapse">
            <caption className="sr-only">Twin-cylinder versus single-cylinder softeners</caption>
            <thead>
              <tr className="border-b border-rule text-left">
                <th className="py-2.5 pr-3 text-xs font-medium text-muted">Feature</th>
                <th className="py-2.5 px-3 text-xs font-medium text-muted text-center">
                  Twin-cylinder, non-electric
                </th>
                <th className="py-2.5 px-3 text-xs font-medium text-muted text-center">
                  Single-cylinder, metered
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {TYPE_ROWS.map((row) => (
                <tr key={row.feature}>
                  <td className="py-3 pr-3 font-medium text-ink">{row.feature}</td>
                  <td className="py-3 px-3 text-center">
                    <Cell value={row.twin} />
                  </td>
                  <td className="py-3 px-3 text-center">
                    <Cell value={row.single} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="font-semibold text-ink text-lg mt-10 mb-2">Block salt or tablet salt</h3>
        <p className="text-base text-body leading-relaxed">
          The salt format follows the design. Twin-cylinder cabinets from Harvey
          and Kinetico take 4 kg blocks that you stand in the top; most
          single-cylinder units have a brine tank you pour tablets into. Blocks
          are cleaner and easier to carry, tablets cost less per kilogram and
          come in 25 kg sacks. The resin softens identically on either. Our{" "}
          <Link href="/guides/water-softener-salt-guide/" className="text-accent hover:underline">
            salt guide
          </Link>{" "}
          covers how much you will get through and where to buy it.
        </p>

        {/* ── Brands ──────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          The five brands you will be quoted for
        </h2>
        <p className="text-base text-body leading-relaxed mb-6">
          Softener units are not sold through Amazon in any credible form, and
          we do not earn a commission on any of these brands. What follows is
          how they differ in design, how you buy them and what an installed
          price typically looks like. Prices are ranges, not quotes: the size of
          unit your household needs and the state of your pipework move the
          number more than the badge does.
        </p>

        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm border-collapse">
            <caption className="sr-only">UK water softener brands compared</caption>
            <thead>
              <tr className="border-b border-rule text-left">
                <th className="py-2.5 pr-3 text-xs font-medium text-muted">Brand</th>
                <th className="py-2.5 px-3 text-xs font-medium text-muted">Design</th>
                <th className="py-2.5 px-3 text-xs font-medium text-muted text-center">Power</th>
                <th className="py-2.5 px-3 text-xs font-medium text-muted">Salt</th>
                <th className="py-2.5 px-3 text-xs font-medium text-muted text-center">
                  Soft 24h
                </th>
                <th className="py-2.5 pl-3 text-xs font-medium text-muted">Typical cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {BRANDS.map((b) => (
                <tr key={b.name}>
                  <td className="py-3 pr-3 align-top">
                    <span className="font-medium text-ink">{b.name}</span>
                    <span className="block text-xs text-muted">{b.origin}</span>
                  </td>
                  <td className="py-3 px-3 align-top text-body">{b.type}</td>
                  <td className="py-3 px-3 align-top text-center">
                    {b.power === "none" ? (
                      <span className="font-mono text-xs text-ink">none</span>
                    ) : (
                      <span className="font-mono text-xs text-muted">mains</span>
                    )}
                  </td>
                  <td className="py-3 px-3 align-top text-body">{b.salt}</td>
                  <td className="py-3 px-3 align-top text-center">
                    {b.softAllDay ? (
                      <Check className="w-4 h-4 text-safe mx-auto" aria-label="Yes" />
                    ) : (
                      <Minus className="w-4 h-4 text-faint mx-auto" aria-label="Not during regeneration" />
                    )}
                  </td>
                  <td className="py-3 pl-3 align-top font-data text-ink whitespace-nowrap">
                    {b.typicalCost}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 space-y-6">
          {BRANDS.map((b) => (
            <div key={b.name} className="border-l-2 border-rule pl-5">
              <h3 className="font-display text-xl italic text-ink">{b.name}</h3>
              <p className="text-xs text-muted mt-0.5">{b.bought}</p>
              <p className="text-base text-body leading-relaxed mt-2">{b.verdict}</p>
            </div>
          ))}
        </div>

        <p className="text-base text-body leading-relaxed mt-8">
          Torn between the two premium names? We put them head to head in{" "}
          <Link href="/guides/harvey-vs-kinetico-water-softener/" className="text-accent hover:underline">
            Harvey vs Kinetico
          </Link>
          .
        </p>

        {/* ── Which to choose ─────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Which one fits your home
        </h2>
        <dl className="divide-y divide-rule border-y border-rule">
          {[
            {
              who: "Large family, very hard water, wants to forget it exists",
              pick: "Harvey or Kinetico twin-cylinder. Soft water all day, no electrics, block salt you top up every few weeks.",
            },
            {
              who: "Typical three-bed household, hard water, sensible budget",
              pick: "Monarch or BWT metered single-cylinder, fitted by a local plumber. Most homes never notice the overnight regeneration.",
            },
            {
              who: "Confident DIYer or you already have a plumber",
              pick: "Water2Buy or a similar online metered unit. The saving is real; the trade is that you are your own service department.",
            },
            {
              who: "Flat, rental, or no space for a drain",
              pick: "A softener is probably out. Read the salt-free guide with realistic expectations, and fit a filter jug for the kettle.",
            },
            {
              who: "Hardness under 120 mg/L",
              pick: "Nothing. Descale the kettle twice a year and spend the money elsewhere.",
            },
          ].map((row) => (
            <div key={row.who} className="py-4 sm:grid sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-6">
              <dt className="text-base font-medium text-ink">{row.who}</dt>
              <dd className="text-base text-body leading-relaxed mt-1 sm:mt-0">{row.pick}</dd>
            </div>
          ))}
        </dl>

        {/* ── Costs ──────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          What you will actually spend
        </h2>
        <p className="text-base text-body leading-relaxed mb-6">
          Three lines on the bill: the unit, the fitting, and the salt you buy
          for the rest of its life. The unit dominates in year one; salt is the
          long tail.
        </p>
        <dl className="border-y border-rule divide-y divide-rule">
          {[
            ["Unit, premium twin-cylinder", "typically £1,000–£2,500 installed", "Harvey, Kinetico"],
            ["Unit, metered single-cylinder", "typically the lower end of that range", "BWT, Monarch"],
            ["Unit, budget online", "from a few hundred pounds, unit only", "Water2Buy and similar"],
            ["Professional installation", "typically £150–£300", "If not bundled with the unit"],
            ["Salt", "roughly £5–£10 a month", "Family home in very hard water"],
          ].map(([item, cost, note]) => (
            <div key={item} className="py-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5">
              <dt className="text-base text-ink">{item}</dt>
              <dd className="font-data text-base text-ink text-right whitespace-nowrap">{cost}</dd>
              <dd className="col-span-2 text-sm text-muted">{note}</dd>
            </div>
          ))}
        </dl>
        <p className="text-base text-body leading-relaxed mt-6">
          Against that sits what scale costs you: a boiler heating through a
          layer of limescale uses more gas for the same hot water, heating
          elements fail early, and you buy more detergent and descaler than a
          soft-water household does. We work through the payback in{" "}
          <Link href="/guides/water-softener-cost-uk/" className="text-accent hover:underline">
            water softener cost UK
          </Link>
          .
        </p>

        {/* ── Salt rail ───────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-2">
          Salt and a way to check it is working
        </h2>
        <p className="text-base text-body leading-relaxed mb-6">
          Once the unit is in, this is what you keep buying. Tablets for metered
          units, blocks for Harvey, Kinetico and BWT block-salt cabinets, and a
          pair of hardness test tablets so you know the resin is doing its job
          rather than trusting the salt level.
        </p>
        <div className="space-y-4">
          {rail.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              pageType="best-water-softener-guide"
              placement="guide-salt-rail"
              highlight={
                product.id === "hydrosalt-tablets-25kg"
                  ? "For metered single-cylinder units"
                  : product.id === "bwt-block-salt-8kg"
                    ? "For block-salt cabinets"
                    : "To prove it is working"
              }
            />
          ))}
        </div>
        <p className="text-sm text-muted mt-4">
          More formats and how much you will use in{" "}
          <Link href="/guides/water-softener-salt-guide/" className="text-accent hover:underline">
            the salt guide
          </Link>
          .
        </p>

        {/* ── Installation and drinking water ──────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Fitting it, and the tap you keep hard
        </h2>
        <p className="text-base text-body leading-relaxed">
          A softener goes on the incoming mains after the stop tap, usually under
          the kitchen sink or in a utility cupboard, garage or loft. It needs
          three connections: in, out, and a drain for the rinse water, plus a
          bypass so the unit can be isolated. Installers also plumb a separate
          hard-water tap in the kitchen. That tap is not a nicety. The Drinking
          Water Inspectorate advises against using softened water to make up
          infant formula because of the added sodium, and recommends keeping an
          unsoftened supply for drinking and cooking. Fittings should be WRAS
          approved, which any reputable installer's will be.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          The full picture, including whether to fit it yourself, is in{" "}
          <Link href="/guides/water-softener-installation-uk/" className="text-accent hover:underline">
            water softener installation UK
          </Link>
          .
        </p>

        <GuideFaq faqs={FAQ_DATA} />

        <div className="mt-14">
          <SoftenerLeadForm
            hardnessValue={220}
            hardnessLabel="hard"
            source="softener_guide"
            heading="Ready to compare quotes?"
            intro="The brands above all sell through installers, and prices vary by region. Two or three quotes for your postcode is the only way to find out what a softener really costs in your home."
          />
        </div>

        <SoftenerGuidesNav current={SLUG} className="mt-14" />

        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">Related guides</h2>
        <ul className="space-y-2">
          {[
            ["/guides/water-hardness-map/", "UK water hardness map"],
            ["/guides/best-whole-house-water-filter-uk/", "Best whole house water filter UK"],
            ["/guides/best-reverse-osmosis-system-uk/", "Reverse osmosis for a single soft drinking tap"],
            ["/hardness/", "Water hardness checker by postcode"],
          ].map(([href, label]) => (
            <li key={href}>
              <Link href={href} className="text-sm text-accent hover:underline">
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <GuideFooter reviewed={`September ${year}`}>
          Regulatory points reflect Drinking Water Inspectorate guidance on softened water
          and the 200 mg/L sodium standard in the Water Supply (Water Quality) Regulations.{" "}
        </GuideFooter>
      </div>
    </div>
  );
}
