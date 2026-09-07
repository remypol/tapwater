import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Search, ShieldCheck } from "lucide-react";
import { PostcodeSearch } from "@/components/postcode-search";
import { ProductCard } from "@/components/product-card";
import { AffiliateNote } from "@/components/commerce";
import { ArticleSchema, BreadcrumbSchema, FAQSchema } from "@/components/json-ld";
import { GeoCitation } from "@/components/geo-citation";
import {
  GuideBreadcrumb,
  GuideByline,
  GuideFaq,
  GuideFooter,
} from "@/components/guide-chrome";
import { getProductsByCategory } from "@/lib/products";
import { OG_IMAGE } from "@/lib/og";

const year = new Date().getFullYear();
const SLUG = "fohen-vs-quooker";
const URL = `https://www.tapwater.uk/guides/${SLUG}`;
const PAGE_TYPE = "fohen-vs-quooker-guide";
const TITLE = `Fohen vs Quooker (${year}): Is the £289 Tap Really a Rival?`;
const DESCRIPTION =
  "Fohen: 98°C, 2.4 litre tank, from £289. Quooker: 100°C, 3 or 7 litres, from £1,050. Filters, warranty, running cost and hard water compared.";

export function generateMetadata(): Metadata {
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: URL },
    openGraph: { images: OG_IMAGE, title: TITLE, description: DESCRIPTION, url: URL, type: "article" },
    twitter: { images: OG_IMAGE, card: "summary_large_image", title: `Fohen vs Quooker (${year})`, description: DESCRIPTION },
  };
}

/* ── Sources. Every fact below was read on these pages in September 2026. ── */

const SOURCES = [
  { name: "Quooker UK homepage and tanks page", url: "https://www.quooker.co.uk/" },
  { name: "Quooker FAQ", url: "https://www.quooker.co.uk/support/faq" },
  { name: "Quooker warranty", url: "https://www.quooker.co.uk/support/warranty" },
  { name: "Fohen homepage", url: "https://www.fohen.co.uk/" },
  { name: "Fohen FAQs", url: "https://www.fohen.co.uk/pages/faqs" },
  { name: "Fohen filters", url: "https://www.fohen.co.uk/collections/filters" },
];

/* ── At a glance. "Edge" is our reading of the two makers' own figures. ── */

const ROWS: { feature: string; fohen: string; quooker: string; edge: string }[] = [
  {
    feature: "Boiling water temperature",
    fohen: "98°C, adjustable down to 75°C",
    quooker: "100°C, stored under slight pressure",
    edge: "Quooker, by two degrees",
  },
  {
    feature: "Tank",
    fohen: "2.4 litres, “approximately 5–6 cups” before a reheat",
    quooker: "PRO3 3 litres; COMBI and COMBI+ 7 litres of boiling plus hot tap water",
    edge: "Quooker",
  },
  {
    feature: "Heat-up from cold",
    fohen: "Not published on the pages we read; check the manufacturer",
    quooker: "10 min (PRO3), 20 min (COMBI)",
    edge: "Unknown",
  },
  {
    feature: "Filter",
    fohen: "Carbon phosphate cartridge, £49.99 single or £99.99 for three; warranty depends on changing it at the recommended interval, which is not published on the pages we read",
    quooker: "HiTAC carbon filter in the tank for taste; Quooker says it “isn’t a limescale filter”",
    edge: "Fohen, narrowly: phosphate dosing is a scale treatment",
  },
  {
    feature: "Price from",
    fohen: "£289 (3-in-1); £399 (4-in-1); £739 (5-in-1). Heavily discounted from list prices of £529 to £1,099",
    quooker: "£1,050 (Nordic single tap); £1,250 (Flex, Fusion)",
    edge: "Fohen, by a factor of three",
  },
  {
    feature: "Warranty",
    fohen: "2 years on most taps, 1 year on some models and accessories",
    quooker: "2 years on all products",
    edge: "Quooker, for consistency",
  },
  {
    feature: "Installation",
    fohen: "Not detailed on the pages we read; the tank needs a socket under the sink like every boiling tap",
    quooker: "“Your plumber, builder, or even you”, or Quooker’s own engineers; 13 amp socket, 2 bar minimum",
    edge: "Tie",
  },
  {
    feature: "Chilled and sparkling",
    fohen: "5-in-1 adds filtered chilled water, from £739",
    quooker: "CUBE adds chilled and sparkling, 5 W standby, £70 filter cartridge",
    edge: "Quooker, if you want sparkling",
  },
  {
    feature: "Standby energy (maker’s figure)",
    fohen: "“around 1 watt of standby power”, “around 3p per day”",
    quooker: "10 watts; COMBI 515 kWh a year including use",
    edge: "Not comparable; see below",
  },
];

/* ── FAQ ─────────────────────────────────────────────────────────────── */

const FAQ_DATA = [
  {
    question: "Is Fohen as good as Quooker?",
    answer:
      "It is a different product at a different price. Fohen dispenses at 98°C from a 2.4 litre tank; Quooker stores water at 100°C in tanks of 3 or 7 litres, and the COMBI also feeds your ordinary hot tap. For tea and coffee the two degrees are imperceptible. Where Quooker earns its price is range, tank capacity, the CUBE for sparkling water and its own service network. Where Fohen earns its following is a 3-in-1 tap for under £300.",
  },
  {
    question: "Why is Fohen so much cheaper than Quooker?",
    answer:
      "Fohen sells online at deep discounts to its own list prices: 3-in-1 taps from £289 against list prices of £529 and up, 4-in-1 from £399. The tank is smaller, the temperature is 98°C rather than 100°C, and there is no national engineer network. Quooker's cheapest tap is £1,050 and most are £1,250 or more. Both prices are before installation.",
  },
  {
    question: "Does Fohen's tap reach a true boil?",
    answer:
      "No. Fohen's site states boiling filtered water at 98°C, and its FAQ gives a range of 75°C to 98°C. Quooker's FAQ states 100°C. For drinks the difference does not register; for sterilising or a recipe that needs a rolling boil, Quooker is the one that does it.",
  },
  {
    question: "Which is better in hard water?",
    answer:
      "Neither publishes a hardness limit. Fohen ships a carbon phosphate cartridge, and phosphate is a scale-inhibiting treatment, so the filter is doing something for the tank; Fohen's warranty depends on replacing it at the recommended interval, which you should ask for in writing. Quooker's HiTAC filter is for taste only and Quooker relies on descaling and servicing. Above 250 mg/L, a softener protects either tank better than a cartridge, and Quooker publishes the conditions under which it accepts softened water.",
  },
  {
    question: "Which costs more to run?",
    answer:
      "Fohen's FAQ quotes around 1 watt on standby and about 3p a day; Quooker quotes 10 watts, which is about 0.24 kWh a day, and 515 kWh a year for a COMBI including the water you use. These are the makers' claims measured different ways. On the makers' figures a Fohen tank costs less to keep hot, which is what you would expect from 2.4 litres against 3 or 7. The cost that grows in hard water is the cartridge.",
  },
  {
    question: "Is there a middle option between Fohen and Quooker?",
    answer:
      "Yes: Qettle, the British brand whose Original 4-in-1 stores water at 100°C for £545, with a limescale-protecting cartridge changed twice a year. Our Qettle vs Quooker comparison covers it. If you would rather keep your existing mixer, the InSinkErator HOT150 dispenser on Amazon delivers near-boiling water from its own small tap.",
  },
];

/* ── Page ────────────────────────────────────────────────────────────── */

export default function FohenVsQuookerGuide() {
  const insinkerator = getProductsByCategory("boiling_tap").find(
    (p) => p.id === "insinkerator-hot150",
  );

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Guides", url: "https://www.tapwater.uk/guides" },
          { name: "Fohen vs Quooker", url: URL },
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
        <GuideBreadcrumb title="Fohen vs Quooker" />
        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          Fohen vs Quooker ({year})
        </h1>
        <GuideByline updated={`September ${year}`} />

        <p className="text-lg text-body leading-relaxed">
          This is the comparison people make when they have priced a Quooker
          and flinched. Fohen sells a 3-in-1 boiling tap for £289; Quooker
          starts at £1,050. The question is what the extra £750 to £1,000
          buys, and whether your water is hard enough for the answer to
          change. We used only what each maker publishes on its own site.
        </p>

        <GeoCitation
          headline={`According to TapWater.uk's reading of both makers' sites in ${year}, Fohen dispenses at 98°C from a 2.4 litre tank and starts at £289; Quooker stores water at 100°C in 3 or 7 litre tanks and starts at £1,050.`}
          detail="Fohen fits a carbon phosphate cartridge and ties its warranty to replacing it on schedule. Quooker's in-tank filter is, in Quooker's words, not a limescale filter. In roughly 60% of England the water is hard enough for that to matter."
        />

        {/* ── Commercial honesty ───────────────────────────────────── */}
        <div className="bg-wash border border-rule rounded-xl p-4 mt-6 mb-8 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-body">
            We have no commercial relationship with Fohen or Quooker. Links to
            their sites are plain links with no tracking and earn us nothing.
            The one affiliate link on this page is the InSinkErator dispenser
            near the end, and it is marked.{" "}
            <Link href="/affiliate-disclosure" className="text-accent hover:underline">
              Full disclosure
            </Link>
          </p>
        </div>

        {/* ── At a glance ──────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-12 mb-2">At a glance</h2>
        <p className="text-sm text-muted mb-4">
          Facts are what each maker publishes; the last column is our reading of
          them. Prices are before installation and move often, and Fohen&rsquo;s
          in particular are sale prices.
        </p>
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm border-collapse min-w-[640px]">
            <caption className="sr-only">Fohen and Quooker compared</caption>
            <thead>
              <tr className="border-b border-rule text-left">
                <th scope="col" className="py-2.5 pr-3 text-xs font-medium text-muted"> </th>
                <th scope="col" className="py-2.5 px-3 text-xs font-medium text-muted">Fohen</th>
                <th scope="col" className="py-2.5 px-3 text-xs font-medium text-muted">Quooker</th>
                <th scope="col" className="py-2.5 pl-3 text-xs font-medium text-muted w-[130px]">Edge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {ROWS.map((r) => (
                <tr key={r.feature}>
                  <th scope="row" className="py-3 pr-3 font-medium text-ink align-top text-left">{r.feature}</th>
                  <td className="py-3 px-3 text-body align-top leading-relaxed">{r.fohen}</td>
                  <td className="py-3 px-3 text-body align-top leading-relaxed">{r.quooker}</td>
                  <td className="py-3 pl-3 align-top leading-relaxed font-display italic text-ink">{r.edge}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <a
            href="https://www.fohen.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-ink hover:text-accent transition-colors"
          >
            Fohen official site
            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="sr-only"> (opens in new tab)</span>
          </a>
          <a
            href="https://www.quooker.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-ink hover:text-accent transition-colors"
          >
            Quooker official site
            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="sr-only"> (opens in new tab)</span>
          </a>
        </div>

        {/* ── Where each wins ──────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">Where each wins</h2>
        <div className="space-y-6">
          <div className="border-l-2 border-rule pl-5">
            <h3 className="font-display text-xl italic text-ink">Fohen wins on</h3>
            <p className="text-base text-body leading-relaxed mt-2">
              Price, and it is not close. A 3-in-1 from £289 and a 4-in-1
              with filtered cold from £399 put a boiling tap within reach of a
              kitchen refresh rather than a kitchen refit. Fohen claims a very
              low standby draw, around 1 watt, which is plausible for a small,
              well insulated 2.4 litre tank. It ships with a phosphate-dosed
              carbon cartridge, which is at least a scale treatment, and it
              offers a 5-in-1 with chilled water for less than Quooker&rsquo;s
              cheapest tap without a CUBE. The trade-offs are two degrees, a
              tank that runs out after five or six cups, and a warranty that
              is two years on most taps but one on some.
            </p>
          </div>
          <div className="border-l-2 border-rule pl-5">
            <h3 className="font-display text-xl italic text-ink">Quooker wins on</h3>
            <p className="text-base text-body leading-relaxed mt-2">
              True 100°C water, stored rather than heated on demand. Tanks of
              3 or 7 litres, so a pan of pasta water does not empty it. The
              COMBI supplies your ordinary hot tap as well, which for a
              kitchen far from the boiler is worth more than the boiling
              function. Sparkling water via the CUBE. Published installation
              requirements, published softened-water conditions, a two-year
              warranty across the board and Quooker&rsquo;s own engineers to
              honour it. And a brand that a future buyer of your house will
              recognise.
            </p>
          </div>
        </div>

        {/* ── Running cost ─────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Running cost, using the makers&rsquo; own figures
        </h2>
        <p className="text-base text-body leading-relaxed">
          Both makers say their tank costs pennies a day to keep hot. They
          measure it differently, so line the figures up with care.
        </p>
        <div className="mt-6 border-t border-rule">
          {[
            {
              k: "Fohen, standby",
              v: "Fohen's FAQ: “around 1 watt of standby power”, costing “around 3p per day”. One watt for 24 hours is 0.024 kWh, so the 3p figure presumably allows for reheats; Fohen also says the tap uses “up to 50% less energy than a traditional kettle”.",
            },
            {
              k: "Quooker, standby",
              v: "Quooker's site: 10 watts. Ten watts for 24 hours is 0.24 kWh a day, about 88 kWh a year; at a 28p tariff that is roughly 7p a day.",
            },
            {
              k: "Quooker, whole year",
              v: "Quooker's FAQ: a COMBI consumes 515 kWh a year. That includes the boiling and the ordinary hot water you draw, so it is not a standby figure.",
            },
            {
              k: "The bit neither counts",
              v: "A scaled element heats slowly and runs longer. In hard water the cost that grows is the cartridge: Fohen's is £49.99 singly or £99.99 for three, and the interval is one to confirm with Fohen before you rely on the warranty.",
            },
          ].map((row) => (
            <div
              key={row.k}
              className="py-3 border-b border-rule grid gap-1 sm:grid-cols-[200px_1fr] sm:gap-x-6"
            >
              <p className="text-sm font-medium text-ink">{row.k}</p>
              <p className="text-sm text-body leading-relaxed">{row.v}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted mt-4">
          Electricity figures are the manufacturers&rsquo; claims, not our
          measurements. The 28p per kWh rate is illustrative; substitute your
          tariff.
        </p>

        {/* ── Hard water ───────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Hard water: what each maker tells you to do
        </h2>
        <p className="text-base text-body leading-relaxed">
          A tank held near boiling is the fastest place in your house for
          limescale to form. Here is how far each maker goes in telling you
          what to do about it.
        </p>
        <dl className="mt-6 divide-y divide-rule border-y border-rule">
          {[
            [
              "Fohen",
              "Ships a carbon phosphate cartridge; phosphate dosing is a recognised way of holding scale in suspension, though Fohen does not describe it in those terms on the pages we read. The warranty is conditional on “replacing filters at the recommended intervals”, but the interval itself and any hardness limit are not published there, so ask for both in writing. Nothing is said about softened water.",
            ],
            [
              "Quooker",
              "The in-tank HiTAC filter is for taste and, in Quooker's words, “isn’t a limescale filter”. In hard water Quooker's advice is to soak the aerator in vinegar and have scale inside the tank dealt with by a maintenance kit or a service. It accepts softened water if the pH is 6.5 to 9.5, there is no excess salt and pressure is at least 2 bar.",
            ],
            [
              "Neither",
              "Neither publishes a plain mg/L hardness limit. Above 250 mg/L a cartridge slows the damage; a softener stops it, and Quooker is the one that tells you how to plumb one in.",
            ],
          ].map(([who, what]) => (
            <div key={who} className="py-4 sm:grid sm:grid-cols-[120px_1fr] sm:gap-6">
              <dt className="font-display italic text-lg text-ink">{who}</dt>
              <dd className="text-base text-body leading-relaxed mt-1 sm:mt-0">{what}</dd>
            </div>
          ))}
        </dl>
        <p className="text-base text-body leading-relaxed mt-6">
          If your postcode comes back very hard, you can{" "}
          <Link href="/hardness#softener-quotes" className="text-accent hover:underline">
            request softener quotes for your postcode
          </Link>{" "}
          on our hardness page; the{" "}
          <Link href="/guides/best-water-softener-uk" className="text-accent hover:underline">
            softener guide
          </Link>{" "}
          explains what a fitted unit costs.
        </p>

        {/* ── Before you buy CTA ───────────────────────────────────── */}
        <div className="card-elevated rounded-2xl p-6 lg:p-8 mt-10">
          <div className="flex items-start gap-3">
            <Search className="w-5 h-5 text-accent shrink-0 mt-1" aria-hidden="true" />
            <div className="flex-1">
              <h2 className="font-display text-xl italic text-ink">
                Before you buy either: check your hardness
              </h2>
              <p className="text-sm text-body mt-2 leading-relaxed">
                Enter your postcode for the hardness reading in your supply
                zone. Under 120 mg/L, the £289 tap is a perfectly good buy.
                Over 250 mg/L, a small tank scales fastest, so budget for
                cartridges or a softener whichever badge you choose.
              </p>
              <div className="mt-4 max-w-md">
                <PostcodeSearch size="sm" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Verdict ──────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">Verdict</h2>
        <div className="space-y-4">
          <p className="text-base text-body leading-relaxed">
            <strong className="text-ink">Buy the Fohen</strong> if you want
            the convenience of a boiling tap for the price of a good kettle
            and a tap, you make drinks rather than fill pans, and your water
            is soft to moderately hard. Set a reminder for the cartridge and
            get the interval from Fohen in writing.
          </p>
          <p className="text-base text-body leading-relaxed">
            <strong className="text-ink">Buy the Quooker</strong> if you want a
            true boil, a tank that will not run dry mid-pan, hot tap water
            from the same unit, sparkling water, or a softener-friendly spec
            with a service network behind it. You are paying for the whole
            system, not for the spout.
          </p>
          <p className="text-base text-body leading-relaxed">
            <strong className="text-ink">Look at Qettle</strong> if £289 feels
            thin and £1,050 feels steep: 100°C from a British-built boiler at
            £545, with a scale filter changed twice a year. Our{" "}
            <Link href="/guides/qettle-vs-quooker" className="text-accent hover:underline">
              Qettle vs Quooker
            </Link>{" "}
            comparison covers it.
          </p>
        </div>

        {/* ── Amazon alternative ───────────────────────────────────── */}
        {insinkerator && (
          <>
            <h2 className="font-display text-2xl italic text-ink mt-14 mb-2">
              If you would rather keep your existing tap
            </h2>
            <p className="text-base text-body leading-relaxed mb-6">
              Neither Fohen nor Quooker is sold on Amazon UK in any listing we
              would send you to. The one credible product there is a hot water
              dispenser rather than a boiling tap: its own small tap and tank,
              water at around 98°C, no scale filter, and your mixer stays where
              it is.
            </p>
            <ProductCard
              product={insinkerator}
              pageType={PAGE_TYPE}
              highlight="Near-boiling water on demand, without the refit"
            />
            <AffiliateNote withFundingLink className="mt-3" />
          </>
        )}

        <GuideFaq faqs={FAQ_DATA} />

        {/* ── Sources ──────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">What we read</h2>
        <ul className="space-y-2">
          {SOURCES.map((s) => (
            <li key={s.url}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
              >
                {s.name}
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="sr-only"> (opens in new tab)</span>
              </a>
            </li>
          ))}
        </ul>

        {/* ── Related ──────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">Related reading</h2>
        <div className="space-y-2">
          {[
            { href: "/guides/best-boiling-water-tap-uk", label: "Best boiling water tap UK: all five brands" },
            { href: "/guides/qettle-vs-quooker", label: "Qettle vs Quooker" },
            { href: "/guides/best-kettle-for-hard-water-uk", label: "Best kettle for hard water UK" },
            { href: "/guides/best-water-softener-uk", label: "Best water softener UK" },
            { href: "/hardness", label: "Check water hardness by postcode" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex items-center gap-2 text-sm text-accent hover:underline"
            >
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              {l.label}
            </Link>
          ))}
        </div>

        <GuideFooter reviewed={`September ${year}`}>
          Brand facts were read on fohen.co.uk and quooker.co.uk in September {year};
          both makers change prices and terms, and their sites are the authority.
          TapWater.uk has no commercial relationship with Fohen or Quooker. The
          InSinkErator link is an Amazon affiliate link.{" "}
        </GuideFooter>
      </div>
    </div>
  );
}
