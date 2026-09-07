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
const SLUG = "harvey-vs-kinetico-water-softener";
const URL = `https://www.tapwater.uk/guides/${SLUG}`;
const TITLE = `Harvey vs Kinetico Water Softener (${year}): Which Premium Softener Fits Your Home`;
const DESCRIPTION =
  "Harvey and Kinetico both make non-electric, twin-cylinder, block-salt water softeners. Where they differ, who each suits, what they typically cost installed, and why getting quotes for both is the right move.";

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
    question: "Is Harvey or Kinetico better?",
    answer:
      "Neither is better at softening water: both are non-electric, twin-cylinder, block-salt softeners and both give soft water 24 hours a day. The differences are commercial. Harvey is British-made and sold and fitted through its own network; Kinetico is an American brand sold through independent regional dealers. Fit, warranty terms and price depend on who is quoting you, so the right answer for most homes is to get a quote for each and compare.",
  },
  {
    question: "How much do Harvey and Kinetico softeners cost?",
    answer:
      "Both typically cost £1,000 to £2,500 installed. Where a given home lands in that range depends on the model size, whether fitting is bundled, and, for Kinetico, on the dealer. Neither brand sells credibly through Amazon; you buy through a survey and quote.",
  },
  {
    question: "Do Harvey and Kinetico use the same salt?",
    answer:
      "Both take block salt in the UK: 4 kg blocks that stand in the cabinet rather than tablets poured into a brine tank. Each brand sells its own blocks and third-party blocks of the same size, such as BWT's, physically fit. A two-block pack is the usual purchase.",
  },
  {
    question: "Do they need electricity?",
    answer:
      "No. Both use the flow of water through the unit to drive the valve that switches cylinders and starts regeneration. There is no plug, no timer to set, and nothing to reset after a power cut. Regeneration happens when the resin is actually spent rather than on a schedule.",
  },
  {
    question: "Which is smaller?",
    answer:
      "Both make compact models designed to fit a standard kitchen base unit, and both make larger units for big households. Dimensions differ by model rather than by brand, so compare the specific units you are quoted for against the space you have.",
  },
  {
    question: "Is there a cheaper alternative with the same performance?",
    answer:
      "For the resin, yes: a metered single-cylinder unit from Monarch or BWT softens water just as thoroughly and typically costs less. What you give up is soft water during the overnight regeneration and the non-electric design. For most households that is an acceptable trade; for a large family in very hard water that runs hot water at all hours, the twin-cylinder premium is easier to justify.",
  },
];

const ROWS: { feature: string; harvey: string; kinetico: string }[] = [
  { feature: "Design", harvey: "Non-electric twin-cylinder", kinetico: "Non-electric twin-tank" },
  { feature: "Power", harvey: "None", kinetico: "None" },
  { feature: "Salt", harvey: "Block", kinetico: "Block (UK models)" },
  { feature: "Soft water during regeneration", harvey: "Yes", kinetico: "Yes" },
  { feature: "Regeneration trigger", harvey: "Water used, metered by flow", kinetico: "Water used, metered by flow" },
  { feature: "Made", harvey: "UK, Surrey", kinetico: "US brand, UK-supplied" },
  { feature: "Sold through", harvey: "Harvey's own installers", kinetico: "Independent regional dealers" },
  { feature: "Typical installed cost", harvey: "£1,000–£2,500", kinetico: "£1,000–£2,500" },
];

export default function HarveyVsKineticoGuide() {
  const block = getProductsByCategory("softener_salt").find((p) => p.id === "bwt-block-salt-8kg");

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Guides", url: "https://www.tapwater.uk/guides" },
          { name: "Harvey vs Kinetico", url: URL },
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
        <GuideBreadcrumb title="Harvey vs Kinetico" />
        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          Harvey vs Kinetico water softener ({year})
        </h1>
        <GuideByline updated={`September ${year}`} />

        <p className="text-lg text-body leading-relaxed">
          If you have had a survey for a softener in the South East, you have
          probably been quoted for one of these two. Harvey and Kinetico are
          the premium end of the British market and, mechanically, near
          cousins: no plug, two resin cylinders that take turns, block salt.
          The interesting differences are in who builds them, who sells them,
          and what that means for the price on your quote.
        </p>

        <GeoCitation
          headline={`According to TapWater.uk, Harvey and Kinetico softeners share the same non-electric twin-cylinder, block-salt design and typically cost £1,000 to £2,500 installed in the UK in ${year}; the practical difference is the sales channel.`}
          detail="Harvey sells and fits through its own network; Kinetico through independent dealers whose pricing varies by region."
        />

        <GuideDisclosure quotes />

        {/* ── Side by side ───────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-12 mb-4">Side by side</h2>
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm border-collapse">
            <caption className="sr-only">Harvey and Kinetico compared</caption>
            <thead>
              <tr className="border-b border-rule text-left">
                <th className="py-2.5 pr-3 text-xs font-medium text-muted"> </th>
                <th className="py-2.5 px-3 text-xs font-medium text-muted">Harvey</th>
                <th className="py-2.5 pl-3 text-xs font-medium text-muted">Kinetico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {ROWS.map((r) => (
                <tr key={r.feature}>
                  <td className="py-3 pr-3 font-medium text-ink align-top">{r.feature}</td>
                  <td className="py-3 px-3 text-body align-top">{r.harvey}</td>
                  <td className="py-3 pl-3 text-body align-top">{r.kinetico}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── What they share ─────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          What they share, which is most of it
        </h2>
        <p className="text-base text-body leading-relaxed">
          Both are twin-cylinder softeners. While one cylinder of resin is
          being rinsed with brine, the other is softening, so the house never
          sees hard water. Both are non-electric: a small turbine or piston
          driven by the water you use meters the flow and triggers regeneration
          when the resin is spent, not at 2 a.m. on a timer whether it needs it
          or not. Both take block salt, 4 kg blocks that drop into the cabinet
          without a scoop. Both come in compact models sized for a kitchen base
          unit. And both are sold with a survey, a fitted price and a warranty
          that assumes their own people did the fitting.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          In other words, the water coming out of the tap is the same. A
          softened supply is a softened supply; the resin does not know whose
          badge is on the cabinet.
        </p>

        {/* ── Where they differ ───────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Where they differ
        </h2>
        <div className="space-y-6">
          <div className="border-l-2 border-rule pl-5">
            <h3 className="font-display text-xl italic text-ink">Harvey</h3>
            <p className="text-base text-body leading-relaxed mt-2">
              A British manufacturer, based in Surrey, that designs, builds,
              sells and fits its own units. You deal with one company from
              survey to service, and the price is Harvey&rsquo;s price rather
              than a dealer&rsquo;s. For a homeowner who values a single point
              of responsibility, that is the appeal. The trade is that there is
              no shopping around within the brand: the quote is the quote.
            </p>
          </div>
          <div className="border-l-2 border-rule pl-5">
            <h3 className="font-display text-xl italic text-ink">Kinetico</h3>
            <p className="text-base text-body leading-relaxed mt-2">
              An American brand with a long record in non-electric softeners,
              sold in Britain through independent regional dealers who survey,
              quote, fit and service. The dealer model cuts both ways. A good
              local dealer is often quicker to reach and more flexible on price
              than a national company; a mediocre one is a mediocre one, and the
              brand&rsquo;s reputation cannot fix that. Ask who will actually
              turn up in five years.
            </p>
          </div>
        </div>

        {/* ── Who each suits ─────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Which fits which home
        </h2>
        <dl className="divide-y divide-rule border-y border-rule">
          {[
            [
              "You want one company for everything",
              "Harvey. Manufacturer, installer and service line are the same phone number.",
            ],
            [
              "You have a well-regarded local dealer",
              "Kinetico. A strong regional dealer is the best version of this brand, and pricing has room to move.",
            ],
            [
              "You are price-sensitive but want twin-cylinder",
              "Get both quotes. The overlap in the £1,000 to £2,500 range is wide and the cheaper one depends on where you live.",
            ],
            [
              "You could live with an hour of hard water overnight",
              "Neither, honestly. A metered Monarch or BWT does the same softening for less and is fitted by any plumber.",
            ],
          ].map(([who, pick]) => (
            <div key={who} className="py-4 sm:grid sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-6">
              <dt className="text-base font-medium text-ink">{who}</dt>
              <dd className="text-base text-body leading-relaxed mt-1 sm:mt-0">{pick}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-10">
          <SoftenerLeadForm
            hardnessValue={250}
            hardnessLabel="very hard"
            source="softener_guide"
            heading="Get quotes for both"
            intro="Neither brand publishes a fitted price, so the comparison only becomes real with two surveys. Request free quotes from installers covering your postcode and ask each to itemise the unit, fitting and the hard-water tap."
          />
        </div>

        {/* ── Salt ────────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          The salt they both eat
        </h2>
        <p className="text-base text-body leading-relaxed mb-6">
          Whichever you choose, you will be buying 4 kg blocks for the rest of
          its life. Each brand sells its own; third-party blocks of the same
          size fit the cabinet. Budget roughly £5 to £10 a month for a family
          home in very hard water.
        </p>
        {block && (
          <ProductCard
            product={block}
            pageType="harvey-vs-kinetico-guide"
            placement="guide-salt-rail"
            highlight="Block salt for twin-cylinder cabinets"
          />
        )}
        <p className="text-sm text-muted mt-4">
          More on formats and usage in{" "}
          <Link href="/guides/water-softener-salt-guide/" className="text-accent hover:underline">
            the salt guide
          </Link>
          ; the whole market, including the metered alternatives, is in{" "}
          <Link href="/guides/best-water-softener-uk/" className="text-accent hover:underline">
            best water softener UK
          </Link>
          .
        </p>

        <GuideFaq faqs={FAQ_DATA} />

        <SoftenerGuidesNav current={SLUG} className="mt-14" />

        <GuideFooter reviewed={`September ${year}`}>
          TapWater.uk has no commercial relationship with Harvey or Kinetico and earns
          nothing from either brand.{" "}
        </GuideFooter>
      </div>
    </div>
  );
}
