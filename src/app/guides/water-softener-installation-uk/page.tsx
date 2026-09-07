import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { SoftenerLeadForm } from "@/components/softener-lead-form";
import { SoftenerGuidesNav } from "@/components/softener-guides-nav";
import { ArticleSchema, BreadcrumbSchema, FAQSchema } from "@/components/json-ld";
import { GeoCitation } from "@/components/geo-citation";
import {
  GuideBreadcrumb,
  GuideByline,
  GuideDisclosure,
  GuideFaq,
  GuideFooter,
} from "@/components/guide-chrome";
import { OG_IMAGE } from "@/lib/og";

export const revalidate = 86400;

const year = new Date().getFullYear();
const SLUG = "water-softener-installation-uk";
const URL = `https://www.tapwater.uk/guides/${SLUG}`;
const TITLE = `Water Softener Installation UK (${year}): What It Involves and What It Costs`;
const DESCRIPTION =
  "How a water softener is installed in a UK home: where it goes, the bypass, the drain, the hard-water tap, DIY versus a plumber, typical £150 to £300 fitting costs, and a pre-install checklist.";

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
    question: "How much does it cost to install a water softener?",
    answer:
      "Professional installation typically costs £150 to £300 on top of the unit, and is often bundled into the price by premium brands such as Harvey and Kinetico. The fee covers cutting into the rising main after the stop tap, a bypass valve, a drain and overflow, and a separate hard-water tap in the kitchen. Awkward pipework, a loft location or a stop tap buried behind kitchen units adds to it.",
  },
  {
    question: "Where is a water softener installed?",
    answer:
      "On the incoming cold main, after the internal stop tap and before the water splits to the boiler and the rest of the house. In most UK homes that means under the kitchen sink, in a utility room, a garage or an airing cupboard. It needs to be near a drain or waste pipe for the regeneration rinse, reachable for salt top-ups, and, for electric units, within reach of a socket.",
  },
  {
    question: "Can I install a water softener myself?",
    answer:
      "A confident DIYer with plumbing experience can fit a compact metered unit: the connections are standard compression or push-fit, and most budget units are sold on that basis. The parts that go wrong are the drain, which must have an air gap and a fall, and the bypass. Twin-cylinder premium units are generally fitted by the brand's own installers as a condition of the warranty. Any fittings that touch the mains must be WRAS approved.",
  },
  {
    question: "Does a water softener need a drain?",
    answer:
      "Yes. During regeneration the unit flushes brine and the hardness it has captured to waste, so it needs a drain line, usually into a washing machine standpipe or the sink waste via a tundish, plus an overflow in case a float sticks. It must have an air gap so drain water can never siphon back into the supply. A home with no accessible drain near the mains is the commonest reason a softener cannot be fitted.",
  },
  {
    question: "Why do installers fit a separate hard water tap?",
    answer:
      "Because softened water carries a little added sodium. The Drinking Water Inspectorate advises keeping an unsoftened supply for drinking and cooking and against using softened water to make up infant formula. Installers tee off before the softener and run a small hard-water tap next to the kitchen mixer. It also feeds an outside tap, since there is no point softening water for the garden.",
  },
  {
    question: "Does a softener affect my boiler or combi?",
    answer:
      "Softened water is fine for modern boilers and is easier on them than scale-forming hard water. Check the manufacturer's instructions: a few older or specific models advise against softened water for the primary heating circuit, in which case the installer fills the heating system with hard water and softens only the domestic supply. Where a boiler warranty mentions it, the installer should follow it.",
  },
];

const STEPS = [
  {
    title: "Find the incoming main and stop tap",
    body: "The softener sits just after the internal stop tap so every tap in the house except the bypass gets soft water. The installer checks the pipe size, the state of the stop tap and the mains pressure.",
  },
  {
    title: "Fit the bypass",
    body: "Three valves, or a single bypass block, let the softener be isolated for servicing while the house keeps its water. It is also how the hard-water tap and any outside tap are fed.",
  },
  {
    title: "Connect in and out",
    body: "Flexible hoses or rigid pipe connect the mains to the unit's inlet and the unit's outlet back to the house. Non-return valves stop softened water flowing backwards.",
  },
  {
    title: "Run the drain and overflow",
    body: "A drain line takes the regeneration rinse to a standpipe or waste, with an air gap so nothing can siphon back. A separate overflow guards against a stuck float in the salt cabinet.",
  },
  {
    title: "Plumb the hard-water tap",
    body: "A small tap by the kitchen sink, teed off before the softener, for drinking, cooking and formula. It is the one tap that stays hard on purpose.",
  },
  {
    title: "Commission and set the hardness",
    body: "The installer loads salt, sets the unit to your water's hardness, runs a regeneration and tests the softened tap. Electric units also get the meter and clock set.",
  },
];

const CHECKLIST = [
  "Where is the internal stop tap, and can you reach the pipe just after it?",
  "Is there a drain, standpipe or waste pipe within a few metres of that point?",
  "Is there room for the cabinet, plus space above it to drop in salt?",
  "For an electric unit: is there a socket, or can one be added?",
  "Does the boiler manual say anything about softened water?",
  "Do you want the hard-water tap by the kitchen sink, and is there a hole for it?",
  "Does the outside tap need to stay hard? (Usually yes.)",
  "Does the quote include the bypass, drain, hard-water tap and first salt fill?",
];

export default function WaterSoftenerInstallationGuide() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Guides", url: "https://www.tapwater.uk/guides" },
          { name: "Water Softener Installation UK", url: URL },
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
        <GuideBreadcrumb title="Water Softener Installation UK" />
        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          Water softener installation UK ({year})
        </h1>
        <GuideByline updated={`September ${year}`} />

        <p className="text-lg text-body leading-relaxed">
          Fitting a softener is a morning&rsquo;s plumbing, not a building
          project, but it has three details that decide whether the unit works
          for fifteen years or floods the cupboard in month two: where it cuts
          into the main, how the rinse water gets away, and the small hard-water
          tap the regulations expect you to keep. Here is what an installer
          does, what it costs, and how to tell whether you could do it yourself.
        </p>

        <GeoCitation
          headline={`According to TapWater.uk, professional water softener installation in the UK typically costs £150 to £300 in ${year}, covering the mains connection, bypass, drain and a separate hard-water drinking tap.`}
          detail="Premium brands usually bundle fitting into the unit price; budget online units are sold for self-install or a local plumber."
        />

        <GuideDisclosure quotes />

        {/* ── Where ───────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-12 mb-4">
          Where it goes
        </h2>
        <p className="text-base text-body leading-relaxed">
          A softener treats the whole house, so it sits on the cold main as it
          enters the property, after the internal stop tap and before the pipe
          splits to the boiler, the bathrooms and the kitchen. In a typical UK
          house that is under the kitchen sink. Utility rooms, garages, airing
          cupboards and lofts all work if the three needs are met: a drain
          within reach, a socket for an electric unit, and enough headroom to
          tip in salt without dismantling the cupboard.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          Cabinet size is the practical constraint. Compact twin-cylinder units
          from Harvey and Kinetico and the smaller metered units from BWT and
          Monarch are designed for a standard kitchen base unit; the larger
          single-cylinder units need a utility space. Flats with a shared rising
          main and no private drain point are the homes that usually cannot
          have one.
        </p>

        {/* ── Steps ───────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          What the installer does, in order
        </h2>
        <ol className="border-t border-rule">
          {STEPS.map((step, i) => (
            <li key={step.title} className="border-b border-rule py-4 grid grid-cols-[2.5rem_1fr] gap-x-3">
              <span className="font-mono text-sm text-muted pt-0.5">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="font-semibold text-ink text-base">{step.title}</h3>
                <p className="text-base text-body leading-relaxed mt-1">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* ── The tap you keep hard ──────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          The tap you keep hard, and why it is not optional
        </h2>
        <p className="text-base text-body leading-relaxed">
          Ion exchange swaps calcium and magnesium for sodium. In most UK water
          the softened result stays within the 200 mg/L sodium standard in the
          drinking water regulations, but the Drinking Water Inspectorate still
          advises keeping an unsoftened supply for drinking and cooking, and
          softened water should not be used to make up infant formula. Anyone on
          a low-sodium diet should treat it the same way. Installers therefore
          tee off before the softener and fit a small hard-water tap by the
          kitchen sink. The outside tap is fed the same way, because there is no
          reason to soften water for the garden. All fittings on the mains side
          should carry WRAS approval; ask, and any reputable installer will
          show you.
        </p>

        {/* ── DIY vs pro ──────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Do it yourself or pay a plumber
        </h2>
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm border-collapse">
            <caption className="sr-only">DIY versus professional installation</caption>
            <thead>
              <tr className="border-b border-rule text-left">
                <th className="py-2.5 pr-3 text-xs font-medium text-muted"> </th>
                <th className="py-2.5 px-3 text-xs font-medium text-muted">Do it yourself</th>
                <th className="py-2.5 pl-3 text-xs font-medium text-muted">Installer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {[
                ["Cost", "Parts only, typically under £100", "£150–£300, often bundled"],
                ["Suits", "Compact metered units sold for self-fit", "Any unit; required for most premium warranties"],
                ["Skills needed", "Cutting and joining copper or plastic pipe, drain with air gap", "None from you"],
                ["Risk", "A bad drain floods; a missed bypass strands the house", "Installer carries it, and the warranty"],
                ["Time", "Half a day if the pipework is accessible", "Two to three hours"],
              ].map(([row, diy, pro]) => (
                <tr key={row}>
                  <td className="py-3 pr-3 font-medium text-ink align-top">{row}</td>
                  <td className="py-3 px-3 text-body align-top">{diy}</td>
                  <td className="py-3 pl-3 text-body align-top">{pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-base text-body leading-relaxed mt-6">
          The honest line: if you have fitted a washing machine and a kitchen
          tap and understand why a drain needs an air gap, a budget metered
          unit is within reach. If any of that sentence was new, pay the £150 to
          £300. On a Harvey or Kinetico the question does not arise, because
          the brand fits it.
        </p>

        <div className="mt-10">
          <SoftenerLeadForm
            hardnessValue={220}
            hardnessLabel="hard"
            source="softener_guide"
            heading="Get installation quotes for your postcode"
            intro="Installers price on your pipework and unit size. Request free quotes from installers covering your area and ask each one to itemise the bypass, drain and hard-water tap."
          />
        </div>

        {/* ── Checklist ───────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Before the installer arrives
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          Eight questions that turn a survey visit into a quote you can compare.
        </p>
        <ul className="space-y-2.5">
          {CHECKLIST.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-base text-body">
              <Check className="w-4 h-4 text-safe shrink-0 mt-1" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <p className="text-base text-body leading-relaxed mt-8">
          The unit itself is chosen in{" "}
          <Link href="/guides/best-water-softener-uk/" className="text-accent hover:underline">
            best water softener UK
          </Link>
          ; the full cost picture, including running costs, is in{" "}
          <Link href="/guides/water-softener-cost-uk/" className="text-accent hover:underline">
            water softener cost UK
          </Link>
          .
        </p>

        <GuideFaq faqs={FAQ_DATA} />

        <SoftenerGuidesNav current={SLUG} className="mt-14" />

        <GuideFooter reviewed={`September ${year}`}>
          Advice on the hard-water tap follows Drinking Water Inspectorate guidance on
          softened water; fittings on the mains should be WRAS approved.{" "}
        </GuideFooter>
      </div>
    </div>
  );
}
