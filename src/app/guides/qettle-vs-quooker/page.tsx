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
const SLUG = "qettle-vs-quooker";
const URL = `https://www.tapwater.uk/guides/${SLUG}`;
const PAGE_TYPE = "qettle-vs-quooker-guide";
const TITLE = `Qettle vs Quooker (${year}): Which Boiling Tap Is Worth It?`;
const DESCRIPTION =
  "Qettle from £480 and Quooker from £1,050 both store water at 100°C. Tanks, filters, warranty and hard water compared from the makers' own sites.";

export function generateMetadata(): Metadata {
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: URL },
    openGraph: { images: OG_IMAGE, title: TITLE, description: DESCRIPTION, url: URL, type: "article" },
    twitter: { images: OG_IMAGE, card: "summary_large_image", title: `Qettle vs Quooker (${year})`, description: DESCRIPTION },
  };
}

/* ── Sources. Every fact below was read on these pages in September 2026. ── */

const SOURCES = [
  { name: "Quooker UK homepage and tanks page", url: "https://www.quooker.co.uk/" },
  { name: "Quooker FAQ", url: "https://www.quooker.co.uk/support/faq" },
  { name: "Quooker warranty", url: "https://www.quooker.co.uk/support/warranty" },
  { name: "Qettle homepage and Original 4-in-1 page", url: "https://www.qettle.com/" },
  { name: "Qettle specifications", url: "https://www.qettle.com/specifications" },
  { name: "Qettle FAQs", url: "https://www.qettle.com/support/faqs" },
  { name: "Qettle installation", url: "https://www.qettle.com/installation" },
  { name: "Qettle warranty", url: "https://www.qettle.com/warranty" },
];

/* ── At a glance. "Edge" is our reading of the two makers' own figures. ── */

const ROWS: { feature: string; qettle: string; quooker: string; edge: string }[] = [
  {
    feature: "Boiling water temperature",
    qettle: "100°C, stored in the boiler",
    quooker: "100°C, stored under slight pressure",
    edge: "Tie",
  },
  {
    feature: "Tank options",
    qettle: "2, 4 or 7 litres",
    quooker: "PRO3 3 litres; COMBI and COMBI+ 7 litres of boiling plus hot tap water",
    edge: "Quooker, if you want the tank to feed your hot tap too",
  },
  {
    feature: "Heat-up from cold",
    qettle: "15 min (2 L), 17.5 min (4 L), 20 min (7 L)",
    quooker: "10 min (PRO3), 20 min (COMBI)",
    edge: "Tie",
  },
  {
    feature: "Filter",
    qettle: "Cartridge on the boiler feed, formulated to protect the element from limescale; change twice a year; £35.50 to £36.50",
    quooker: "HiTAC carbon filter in the tank for taste; Quooker says it “isn’t a limescale filter”",
    edge: "Qettle in hard water",
  },
  {
    feature: "Price from",
    qettle: "£480 (Mini 2-in-1); £545 (Original 4-in-1)",
    quooker: "£1,050 (Nordic single tap); £1,250 (Flex, Fusion)",
    edge: "Qettle, by roughly half",
  },
  {
    feature: "Warranty",
    qettle: "2 years on boiler, filter system and working parts; 1 year on the chrome Original finish, lifetime on the stainless Signature finish",
    quooker: "2 years on all products",
    edge: "Tie",
  },
  {
    feature: "Installation",
    qettle: "Designed for “a happy DIY-er” or a professional; 13 amp socket, no extension lead; 1.5 to 5 bar",
    quooker: "“Your plumber, builder, or even you”, or Quooker’s own engineers; 13 amp socket, 2 bar minimum",
    edge: "Tie",
  },
  {
    feature: "Chilled and sparkling",
    qettle: "Separate chiller unit on some models; check the maker",
    quooker: "CUBE add-on, 5 W standby, £70 filter cartridge",
    edge: "Quooker",
  },
  {
    feature: "Standby energy (maker’s figure)",
    qettle: "0.15 kWh a day, “just over 4p” at 28p/kWh",
    quooker: "10 watts; COMBI 515 kWh a year including use",
    edge: "Not comparable; see below",
  },
];

/* ── FAQ ─────────────────────────────────────────────────────────────── */

const FAQ_DATA = [
  {
    question: "Is Qettle as good as Quooker?",
    answer:
      "On the thing that matters most, the water, yes: both store water at 100°C and both dispense it through a child-safe lever. Quooker has the wider range, the option of a tank that also feeds your ordinary hot tap (COMBI), and the CUBE for chilled and sparkling. Qettle costs roughly half as much and fits a scale-protecting filter as standard. Which is better depends on your budget, your kitchen and, above all, how hard your water is.",
  },
  {
    question: "How much cheaper is Qettle than Quooker?",
    answer:
      "At the time of writing Qettle's Mini starts at £480 and the Original 4-in-1 is £545 on qettle.com. Quooker's cheapest tap is the Nordic single tap from £1,050, with the Flex and Fusion from £1,250 on quooker.co.uk. Both prices are before installation, which typically adds £150 to £300, and both makers change prices often.",
  },
  {
    question: "Does Quooker have a limescale filter?",
    answer:
      "Not in the way Qettle does. Quooker's FAQ says its HiTAC filter improves taste and “isn’t a limescale filter”. In hard water Quooker advises descaling the aerator and servicing the tank. Qettle's cartridge is “especially formulated to protect the boiler's heating element from the adverse effects of limescale” and Qettle asks you to change it twice a year and deep-clean the boiler annually.",
  },
  {
    question: "Can I run a Qettle or Quooker on softened water?",
    answer:
      "Quooker accepts softened water if the pH is between 6.5 and 9.5, there is no excess salt and pressure is at least 2 bar. Qettle takes the opposite line: it suggests feeding hard, unsoftened water to the boiling and filtered side and softened water only to the normal hot and cold flows, and notes that softened water is not recommended for babies. If you have a softener, ask the maker how to plumb it before ordering.",
  },
  {
    question: "Which costs more to run?",
    answer:
      "Both makers quote small figures but measure them differently, so they are not directly comparable. Qettle says standby is about 0.15 kWh a day, “just over 4p” at 28p per kWh, with roughly a penny per cup on top. Quooker says its tanks draw 10 watts on standby, which works out at about 0.24 kWh a day, and that a COMBI uses 515 kWh a year in total. Treat all of these as the makers' claims; a hard-water tank that has scaled up will use more than either.",
  },
  {
    question: "Which should I buy in a hard water area?",
    answer:
      "Check your postcode hardness first. Under 120 mg/L either tap will run for years on its standard maintenance. Between 120 and 250 mg/L Qettle's scale filter and six-month change interval are the simpler routine. Above 250 mg/L, a whole-house softener protects either tank better than any cartridge; Quooker's stated softened-water conditions make it the easier one to pair with a softener.",
  },
];

/* ── Page ────────────────────────────────────────────────────────────── */

export default function QettleVsQuookerGuide() {
  const insinkerator = getProductsByCategory("boiling_tap").find(
    (p) => p.id === "insinkerator-hot150",
  );

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Guides", url: "https://www.tapwater.uk/guides" },
          { name: "Qettle vs Quooker", url: URL },
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
        <GuideBreadcrumb title="Qettle vs Quooker" />
        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          Qettle vs Quooker ({year})
        </h1>
        <GuideByline updated={`September ${year}`} />

        <p className="text-lg text-body leading-relaxed">
          Quooker invented the category and still sets the price of it. Qettle
          is the British tap that asks why a boiling water tap should cost
          more than a dishwasher. Both hold water at 100°C under your sink
          all day, which is why both live or die by how hard your water is.
          This is the two-brand comparison, using only what each maker says on
          its own site.
        </p>

        <GeoCitation
          headline={`According to TapWater.uk's reading of both makers' sites in ${year}, Qettle and Quooker both store water at 100°C; Qettle's taps start at £480 and Quooker's at £1,050 before installation.`}
          detail="Qettle fits a limescale-protecting cartridge it asks you to change twice a year. Quooker's in-tank HiTAC filter is, in Quooker's words, not a limescale filter. In roughly 60% of England the water is hard enough for that difference to matter."
        />

        {/* ── Commercial honesty ───────────────────────────────────── */}
        <div className="bg-wash border border-rule rounded-xl p-4 mt-6 mb-8 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-body">
            We have no commercial relationship with Qettle or Quooker. Links to
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
          them. Prices are before installation and move often.
        </p>
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm border-collapse min-w-[640px]">
            <caption className="sr-only">Qettle and Quooker compared</caption>
            <thead>
              <tr className="border-b border-rule text-left">
                <th scope="col" className="py-2.5 pr-3 text-xs font-medium text-muted"> </th>
                <th scope="col" className="py-2.5 px-3 text-xs font-medium text-muted">Qettle</th>
                <th scope="col" className="py-2.5 px-3 text-xs font-medium text-muted">Quooker</th>
                <th scope="col" className="py-2.5 pl-3 text-xs font-medium text-muted w-[130px]">Edge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {ROWS.map((r) => (
                <tr key={r.feature}>
                  <th scope="row" className="py-3 pr-3 font-medium text-ink align-top text-left">{r.feature}</th>
                  <td className="py-3 px-3 text-body align-top leading-relaxed">{r.qettle}</td>
                  <td className="py-3 px-3 text-body align-top leading-relaxed">{r.quooker}</td>
                  <td className="py-3 pl-3 align-top leading-relaxed font-display italic text-ink">{r.edge}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <a
            href="https://www.qettle.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-ink hover:text-accent transition-colors"
          >
            Qettle official site
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
            <h3 className="font-display text-xl italic text-ink">Qettle wins on</h3>
            <p className="text-base text-body leading-relaxed mt-2">
              Price, most obviously: the Original 4-in-1 at £545 is a true
              100°C system with filtered cold water, for less than half the
              cheapest Quooker. It also wins on hard water housekeeping. The
              cartridge on the boiler feed is there to protect the heating
              element from scale, Qettle tells you plainly to change it twice
              a year and deep-clean the boiler once a year, and the
              replacement costs about £36. Installation is pitched at a
              confident DIYer with a 13 amp socket under the sink, and the
              boilers are compact enough that the 4 litre fits a 450 mm
              cupboard.
            </p>
          </div>
          <div className="border-l-2 border-rule pl-5">
            <h3 className="font-display text-xl italic text-ink">Quooker wins on</h3>
            <p className="text-base text-body leading-relaxed mt-2">
              Range and integration. The COMBI tank holds 7 litres of boiling
              water and also supplies your ordinary hot tap, so a kitchen far
              from the boiler gets hot water instantly; the COMBI+ does the
              same with unlimited hot water. The CUBE adds chilled and
              sparkling water from the same spout. There are a dozen tap
              designs, an energy label A on the COMBI, a national network of
              Quooker&rsquo;s own engineers, and a resale name that kitchen
              buyers recognise. If you have a softener, Quooker publishes the
              conditions under which its tap accepts softened water; Qettle
              would rather you kept hard water on the boiling side.
            </p>
          </div>
        </div>

        {/* ── Running cost ─────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Running cost, using the makers&rsquo; own figures
        </h2>
        <p className="text-base text-body leading-relaxed">
          Both companies say their tank costs pennies a day to keep hot, and
          both are probably right, but they measure different things so the
          numbers cannot simply be lined up. Here is what each publishes and
          what it works out to.
        </p>
        <div className="mt-6 border-t border-rule">
          {[
            {
              k: "Qettle, standby",
              v: "Qettle's FAQ: about 0.15 kWh a day, “just over 4p” at 28p per kWh. That is roughly 55 kWh a year before you draw a cup.",
            },
            {
              k: "Qettle, per cup",
              v: "Qettle's FAQ: four cups a day adds about 3.5p, so call it a penny a cup.",
            },
            {
              k: "Quooker, standby",
              v: "Quooker's site: 10 watts. Ten watts for 24 hours is 0.24 kWh a day, or about 88 kWh a year; at Qettle's 28p rate that is roughly 7p a day.",
            },
            {
              k: "Quooker, whole year",
              v: "Quooker's FAQ: a COMBI consumes 515 kWh a year. That includes heating the boiling and the ordinary hot water you use, so it is not a standby figure.",
            },
            {
              k: "The bit neither counts",
              v: "A scaled element heats more slowly and runs longer. In hard water the cost that matters is the cartridge (about £70 a year on Qettle's twice-yearly schedule) and, above 250 mg/L, whether you also need a softener.",
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
          measurements. The 28p per kWh rate is the one Qettle uses in its own
          example; substitute your tariff.
        </p>

        {/* ── Hard water ───────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Hard water: what each maker tells you to do
        </h2>
        <p className="text-base text-body leading-relaxed">
          A tank held at 100°C is the fastest place in your house for
          limescale to form, so this is where the two brands genuinely part
          company.
        </p>
        <dl className="mt-6 divide-y divide-rule border-y border-rule">
          {[
            [
              "Qettle",
              "Its filter cartridge is “especially formulated to protect the boiler's heating element from the adverse effects of limescale”. Change it twice a year, deep-clean the boiler annually (Qettle says you can do this yourself), and keep proof of cartridge purchases, which the warranty asks for if you claim on a filter-related fault. On softeners: feed hard water to the boiling side, softened water to the ordinary flows.",
            ],
            [
              "Quooker",
              "The in-tank HiTAC filter is for taste and, in Quooker's words, “isn’t a limescale filter”. In hard water Quooker's advice is to soak the aerator in vinegar and to have scale inside the tank dealt with by a maintenance kit or a service. It accepts softened water if the pH is 6.5 to 9.5, there is no excess salt and pressure is at least 2 bar, which makes it the easier tap to pair with a whole-house softener.",
            ],
            [
              "Neither",
              "Neither publishes a plain mg/L hardness limit on the pages we read. Ask for one in writing before you order, along with the filter interval at your hardness.",
            ],
          ].map(([who, what]) => (
            <div key={who} className="py-4 sm:grid sm:grid-cols-[120px_1fr] sm:gap-6">
              <dt className="font-display italic text-lg text-ink">{who}</dt>
              <dd className="text-base text-body leading-relaxed mt-1 sm:mt-0">{what}</dd>
            </div>
          ))}
        </dl>
        <p className="text-base text-body leading-relaxed mt-6">
          Above 250 mg/L, in London, Kent, Essex, East Anglia and much of the
          Thames valley, a cartridge slows the damage but a softener stops it.
          You can{" "}
          <Link href="/hardness#softener-quotes" className="text-accent hover:underline">
            request softener quotes for your postcode
          </Link>{" "}
          on our hardness page, and our{" "}
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
                zone. Under 120 mg/L, the cheaper tap is the sensible one.
                Over 250 mg/L, budget for cartridges or a softener whichever
                badge you choose.
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
            <strong className="text-ink">Buy the Qettle</strong> if you want
            100°C water, filtered cold and a scale routine you can follow
            yourself, and you would rather spend the £500 you save on a
            decade of cartridges. In moderately hard water it is the more
            rational purchase.
          </p>
          <p className="text-base text-body leading-relaxed">
            <strong className="text-ink">Buy the Quooker</strong> if the tank
            is also going to feed your hot tap, if you want chilled and
            sparkling from the same spout, if you already have or are
            planning a softener, or if the kitchen is being sold with the
            house. You are paying for range and a service network, not for
            hotter water.
          </p>
          <p className="text-base text-body leading-relaxed">
            <strong className="text-ink">Buy neither yet</strong> if your
            postcode comes back above 250 mg/L and you have no softener.
            Sort the water first; either tank will thank you.
          </p>
        </div>

        {/* ── Amazon alternative ───────────────────────────────────── */}
        {insinkerator && (
          <>
            <h2 className="font-display text-2xl italic text-ink mt-14 mb-2">
              If both are more than you wanted to spend
            </h2>
            <p className="text-base text-body leading-relaxed mb-6">
              Neither Qettle nor Quooker is sold on Amazon UK in any listing we
              would send you to. The one credible product there is a hot water
              dispenser rather than a boiling tap: its own small tap and tank,
              water at around 98°C, no scale filter, and your existing mixer
              stays. It does the tea job for a fraction of the price.
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
            { href: "/guides/fohen-vs-quooker", label: "Fohen vs Quooker" },
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
          Brand facts were read on qettle.com and quooker.co.uk in September {year};
          both makers change prices and terms, and their sites are the authority.
          TapWater.uk has no commercial relationship with Qettle or Quooker. The
          InSinkErator link is an Amazon affiliate link.{" "}
        </GuideFooter>
      </div>
    </div>
  );
}
