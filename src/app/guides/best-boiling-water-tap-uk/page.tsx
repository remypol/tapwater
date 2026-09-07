import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ShieldCheck, Search } from "lucide-react";
import { PostcodeSearch } from "@/components/postcode-search";
import { ProductCard } from "@/components/product-card";
import { ArticleSchema, BreadcrumbSchema, FAQSchema } from "@/components/json-ld";
import { GeoCitation } from "@/components/geo-citation";
import { getProductsByCategory } from "@/lib/products";
import { OG_IMAGE } from "@/lib/og";

const year = new Date().getFullYear();
const URL = "https://www.tapwater.uk/guides/best-boiling-water-tap-uk";
const PAGE_TYPE = "best-boiling-water-tap-guide";

/* ── FAQ ─────────────────────────────────────────────────────────────── */

const FAQ_DATA = [
  {
    question: "What is the best boiling water tap in the UK?",
    answer:
      "It depends on budget and water. Quooker is the benchmark: true 100°C water, the widest range of tanks and finishes, and prices from about £1,050 before installation. Qettle is the British alternative at a lower price with a 100°C stored tank. Fohen and Hanstrom sell 3-in-1 and 4-in-1 taps from around £289 to £419 that dispense at 98°C. Franke's Maris Water Hub sits in between. In hard water, the best tap is the one whose filter you will actually replace on time.",
  },
  {
    question: "What does 3-in-1 and 4-in-1 mean on a boiling water tap?",
    answer:
      "A 3-in-1 tap gives normal hot, normal cold and boiling water from one fitting. A 4-in-1 adds filtered cold drinking water, usually through the same cartridge that feeds the boiler. Some brands now sell 5-in-1 taps that add chilled or sparkling water from a second unit under the sink.",
  },
  {
    question: "How does an instant boiling water tap work?",
    answer:
      "A small insulated tank under the sink, typically 2 to 7 litres, holds water at or near boiling point around the clock. A filter cartridge on the cold feed treats the water before it enters the tank. When you open the boiling lever, the tank pushes hot water up to the spout and refills itself from the mains. Heating a full tank from cold takes 10 to 20 minutes; keeping it hot uses a small trickle of electricity.",
  },
  {
    question: "Do boiling water taps work in hard water areas?",
    answer:
      "Yes, with a filter and discipline. The tank holds water at 98 to 100°C for hours at a time, which is exactly the condition that makes calcium carbonate drop out of solution fastest. Every maker fits a scale-reducing cartridge and ties the warranty to replacing it on schedule; Franke, for example, states 6 to 12 months depending on hardness. None of the five publishes a simple mg/L cut-off on its site, so check your postcode hardness, then ask the maker for the hardness limit before you buy. In very hard areas, above 250 mg/L, a whole-house softener protects the tank far better than any cartridge.",
  },
  {
    question: "How much does the filter cost per year?",
    answer:
      "Budget £50 to £100 a year across the brands, depending on the cartridge and how hard your water is. Harder water means more frequent changes. This is the running cost people forget: over ten years it can add up to more than the tap itself on the cheaper brands.",
  },
  {
    question: "Is a Quooker really 100°C?",
    answer:
      "Yes. Quooker's own FAQ states boiling water is dispensed at 100°C; the tank stores it above boiling under slight pressure. Qettle also stores at 100°C. Fohen and Hanstrom dispense at 98°C, and the InSinkErator HOT150 dispenser delivers near-boiling water at around 98°C. For tea and coffee the difference is imperceptible; for sterilising or some recipes it matters.",
  },
  {
    question: "Can I fit a boiling water tap myself?",
    answer:
      "The plumbing is push-fit and within reach of a confident DIYer, but the tank needs a mains socket under the sink and the tap needs a suitable hole in the worktop. Most buyers use a plumber, and some warranties expect professional installation. Allow £150 to £300 for fitting on top of the tap.",
  },
  {
    question: "Is the InSinkErator HOT150 a proper boiling water tap?",
    answer:
      "Not in the Quooker sense. It is an instant hot water dispenser with its own small tap and tank, delivering water at around 98°C. It does not replace your kitchen mixer and does not come with a scale filter. It is the one credible option sold on Amazon UK, and for many people it does the same job for a fraction of the price.",
  },
];

/* ── Metadata ────────────────────────────────────────────────────────── */

export async function generateMetadata(): Promise<Metadata> {
  const title = `Best Boiling Water Tap UK (${year}): Quooker, Qettle, Fohen, Franke, Hanstrom`;
  const description =
    "How instant boiling water taps work, 3-in-1 vs 4-in-1, what hard water does to the tank, and an honest comparison of the five main UK brands. Check your hardness before you buy.";
  return {
    title,
    description,
    alternates: { canonical: URL },
    openGraph: {
      images: OG_IMAGE,
      title,
      description,
      url: URL,
      type: "article",
    },
    twitter: {
      images: OG_IMAGE,
      card: "summary_large_image",
      title: `Best Boiling Water Tap UK (${year})`,
      description,
    },
  };
}

/* ── Brand ledger. Only facts we could read on each maker's own site. ── */

const BRANDS = [
  {
    name: "Quooker",
    url: "https://www.quooker.co.uk/",
    from: "From about £1,050",
    temp: "100°C",
    configs: "3-in-1 and, with the CUBE, chilled and sparkling",
    hardWater:
      "Quooker's FAQ says the HiTAC filter in the tank improves taste and “isn’t a limescale filter”. In hard water it advises soaking the aerator in white vinegar; scale inside the tank needs a maintenance kit or a service. It accepts softened water if the pH is 6.5 to 9.5, there is no excess salt and pressure is 2 bar or more.",
    warranty: "2 years",
    verdict:
      "The benchmark. Dearest by a distance, but the widest range and the most mature product. In a very hard area, pair it with a softener rather than relying on descaling.",
  },
  {
    name: "Qettle",
    url: "https://www.qettle.com/",
    from: "From about £480 (Mini)",
    temp: "100°C stored",
    configs: "Original 4-in-1; Mini 2-in-1; 2, 4 and 7 litre tanks",
    hardWater:
      "No hardness guidance on the pages we read. Ask for the hardness limit and the filter interval before ordering.",
    warranty: "See Qettle warranty page",
    verdict:
      "The British mid-market answer to Quooker: 100°C from a British-built tank at a lower price. The 4-in-1 Original is the one most people want.",
  },
  {
    name: "Fohen",
    url: "https://www.fohen.co.uk/",
    from: "3-in-1 from £289; 4-in-1 from £399",
    temp: "98°C",
    configs: "2-in-1, 3-in-1, 4-in-1, 5-in-1",
    hardWater:
      "Warranty depends on “replacing filters at the recommended intervals”. No published hardness limit; check before you buy.",
    warranty: "2 years on most taps, 1 year on some",
    verdict:
      "The value 3-in-1. You give up two degrees and the Quooker badge and keep most of the convenience.",
  },
  {
    name: "Franke",
    url: "https://www.franke.com/gb/en/home-solutions/products/instant-boiling.html",
    from: "Price on application",
    temp: "Not stated on the page we read",
    configs: "Maris Water Hub 3-in-1, 4-in-1 with filtration kit; 4L or 7L tank",
    hardWater:
      "Pro M filter cartridge to be replaced “every 6 to 12 months, depending on water hardness”. Franke suggests checking hardness with your water authority: our postcode search does that for you.",
    warranty: "Not stated on the page we read",
    verdict:
      "The kitchen-brand option, typically bought through a kitchen retailer. The one maker that puts hardness in its own filter guidance.",
  },
  {
    name: "Hanstrom",
    url: "https://hanstrom.com/",
    from: "3-in-1 from £319; 4-in-1 from £419",
    temp: "98°C",
    configs: "2-in-1, 3-in-1, 4-in-1, 5-in-1; 2.4 litre tank",
    hardWater:
      "Warranty depends on replacing filters at the recommended intervals. No published hardness limit; check before you buy.",
    warranty: "2 years",
    verdict:
      "Close sibling of Fohen in price and spec, WRAS approved. Choose on finish and offer rather than expecting a different tap.",
  },
];

/* ── Page ────────────────────────────────────────────────────────────── */

export default function BestBoilingWaterTapGuide() {
  const insinkerator = getProductsByCategory("boiling_tap").find(
    (p) => p.id === "insinkerator-hot150",
  )!;

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Guides", url: "https://www.tapwater.uk/guides" },
          { name: "Best Boiling Water Tap UK", url: URL },
        ]}
      />
      <ArticleSchema
        headline={`Best Boiling Water Tap UK ${year}`}
        description="How instant boiling water taps work, what hard water does to them, and an honest comparison of Quooker, Qettle, Fohen, Franke and Hanstrom, with postcode hardness data."
        url={URL}
        datePublished="2026-09-07"
        dateModified={new Date().toISOString().split("T")[0]}
        authorName="TapWater.uk Research"
        authorUrl="https://www.tapwater.uk/about"
      />
      <FAQSchema faqs={FAQ_DATA} />

      <div className="max-w-3xl mx-auto">
        <nav className="text-sm text-muted mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-accent transition-colors">Home</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/guides" className="hover:text-accent transition-colors">Guides</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-ink" aria-current="page">
              Best Boiling Water Tap UK
            </li>
          </ol>
        </nav>

        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          Best Boiling Water Tap UK {year}
        </h1>
        <div className="flex items-center gap-2 mt-3 mb-8 text-sm text-muted">
          <span>
            By <span className="text-ink font-medium">TapWater.uk Research</span>
          </span>
          <span>&middot;</span>
          <span>Updated September {year}</span>
        </div>

        <div className="prose-section">
          <p className="text-lg text-body leading-relaxed">
            A boiling water tap keeps two to seven litres of water at or near
            100°C under your sink, all day, every day. That is wonderful for
            tea and terrible for limescale, because a hot, still tank is the
            fastest place in your house for calcium carbonate to settle out. The
            tap you should buy depends less on the brand than on a number your
            water company already publishes: the hardness of your supply.
          </p>
          <p className="text-base text-body leading-relaxed mt-4">
            This guide covers how the taps work, what 3-in-1 and 4-in-1 mean,
            why the filter cartridge matters more than the spout, and an honest
            comparison of Quooker, Qettle, Fohen, Franke and Hanstrom. We earn
            nothing on any of those five. The only product on this page that
            pays us a commission is the InSinkErator dispenser at the end, and
            we say plainly what it is and is not.
          </p>
        </div>

        <GeoCitation
          headline={`According to TapWater.uk's analysis of 2,800 UK postcode districts, roughly 60% of England receives hard or very hard water above 180 mg/L, the range in which a boiling water tap's tank and filter need the most attention.`}
          detail={`Every maker ties its warranty to replacing the scale filter on schedule; Franke's own guidance is every 6 to 12 months depending on hardness. Check your postcode before you buy.`}
        />

        {/* ── Commercial honesty ───────────────────────────────────── */}
        <div className="bg-wash border border-rule rounded-xl p-4 mt-6 mb-8 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <p className="text-sm text-body">
            We have no commercial relationship with Quooker, Qettle, Fohen,
            Franke or Hanstrom. Links to their sites are plain links with no
            tracking and earn us nothing. The InSinkErator card lower down is an
            Amazon affiliate link and is marked as such.{" "}
            <Link href="/affiliate-disclosure" className="text-accent hover:underline">
              Full disclosure
            </Link>
          </p>
        </div>

        {/* ── Before you buy CTA ───────────────────────────────────── */}
        <div className="card-elevated rounded-2xl p-6 lg:p-8 mb-12">
          <div className="flex items-start gap-3">
            <Search className="w-5 h-5 text-accent shrink-0 mt-1" aria-hidden="true" />
            <div className="flex-1">
              <h2 className="font-display text-xl italic text-ink">
                Before you spend £300 to £1,500, check your hardness
              </h2>
              <p className="text-sm text-body mt-2 leading-relaxed">
                Enter your postcode for the hardness reading in your supply
                zone. Under 120 mg/L, any of these taps will run for years on
                its standard filter. Over 250 mg/L, budget for frequent
                cartridges or a softener, and ask the maker for its hardness
                limit in writing.
              </p>
              <div className="mt-4 max-w-md">
                <PostcodeSearch size="sm" />
              </div>
            </div>
          </div>
        </div>

        {/* ── How they work ────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-12 mb-4">
          How a boiling water tap works
        </h2>
        <p className="text-base text-body leading-relaxed">
          Three parts. A tank under the sink, insulated and electrically heated,
          holding water at 98 to 100°C. A filter cartridge on the cold feed into
          the tank. And the tap itself, which on most systems is a mixer with a
          separate, child-safe boiling lever. Open the lever and the tank pushes
          water up to the spout, refilling from the mains behind it. The tank
          takes 10 to 20 minutes to heat from cold and then sips electricity to
          stay there.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "3-in-1",
              body: "Normal hot, normal cold and boiling from one tap. The kettle goes in the cupboard.",
            },
            {
              title: "4-in-1",
              body: "Adds filtered cold drinking water through the same cartridge. The most popular configuration at every brand.",
            },
            {
              title: "5-in-1",
              body: "Adds chilled or sparkling water from a second unit under the sink. Fohen, Hanstrom and Quooker (CUBE) offer it.",
            },
          ].map((c) => (
            <div key={c.title} className="card p-5">
              <p className="font-display italic text-xl text-ink">{c.title}</p>
              <p className="text-sm text-body leading-relaxed mt-2">{c.body}</p>
            </div>
          ))}
        </div>

        {/* ── Why the filter matters ───────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Why the filter matters more than the spout
        </h2>
        <p className="text-base text-body leading-relaxed">
          The cartridge does two jobs. It takes chlorine and particles out so
          the boiling water tastes clean, and, on most systems, it reduces the
          minerals that become limescale. Because the tank is hot and still,
          any hardness that gets past the filter drops out inside the tank
          rather than in your cup. Once the element is coated, heating slows,
          the thermostat works harder and the tank eventually fails. That is
          why every maker ties its warranty to changing the cartridge on time.
        </p>
        <div className="mt-6 border-t border-rule">
          {[
            { k: "Typical cartridge cost", v: "£50 to £100 a year, more in very hard water" },
            { k: "Franke's own interval", v: "Every 6 to 12 months, depending on hardness" },
            { k: "Quooker's tank filter", v: "“Isn’t a limescale filter”, per Quooker's FAQ" },
            { k: "Ten-year filter bill", v: "£500 to £1,000, often more than a budget tap" },
          ].map((row) => (
            <div
              key={row.k}
              className="py-3 border-b border-rule grid gap-1 sm:grid-cols-[220px_1fr] sm:gap-x-6"
            >
              <p className="text-sm font-medium text-ink">{row.k}</p>
              <p className="text-sm text-body">{row.v}</p>
            </div>
          ))}
        </div>

        {/* ── Hard water ───────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          What hard water does to a boiling tap
        </h2>
        <p className="text-base text-body leading-relaxed">
          Your water company reports hardness as milligrams of calcium
          carbonate per litre. Our postcode pages use five bands: soft under
          60, moderately soft to 120, moderately hard to 180, hard to 250, and
          very hard above that. London, Kent, Essex, East Anglia and Oxfordshire
          sit almost entirely in the top band. In those areas a boiling tap
          without a working filter can scale its tank in months, and the
          symptoms are a slower flow, spitting at the spout and a tank that
          takes longer to recover between cups.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          None of the five makers publishes a plain mg/L limit on the pages we
          could read, so the honest advice is: find your hardness below, then
          ask the maker for its hardness limit and the filter interval at that
          hardness before you order. Above 250 mg/L, a whole-house softener is
          the only thing that protects the tank rather than slowing the damage.
          Quooker states its taps accept softened water within conditions.
          You can{" "}
          <Link href="/hardness#softener-quotes" className="text-accent hover:underline">
            request softener quotes for your postcode
          </Link>{" "}
          on our hardness page.
        </p>

        {/* ── Brand ledger ─────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-2">
          The five brands, honestly
        </h2>
        <p className="text-sm text-muted mb-6">
          Facts below are what each maker says on its own website at the time
          of writing. Prices are before installation and change often; follow
          the plain link to check. We earn nothing on any of these.
        </p>
        <div className="space-y-6">
          {BRANDS.map((b) => (
            <article key={b.name} className="card p-6 lg:p-7">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="font-display text-2xl italic text-ink">{b.name}</h3>
                  <p className="text-sm text-muted mt-0.5">{b.from}</p>
                </div>
                <a
                  href={b.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-ink hover:text-accent transition-colors"
                >
                  Official site
                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="sr-only"> (opens in new tab)</span>
                </a>
              </div>
              <dl className="mt-4 border-t border-rule divide-y divide-rule">
                {[
                  { k: "Water temperature", v: b.temp },
                  { k: "Configurations", v: b.configs },
                  { k: "Hard water guidance", v: b.hardWater },
                  { k: "Warranty", v: b.warranty },
                  { k: "Our relationship", v: "None. Plain link, no commission." },
                ].map((row) => (
                  <div key={row.k} className="py-3 sm:grid sm:grid-cols-[168px_1fr] sm:gap-x-4">
                    <dt className="text-sm font-medium text-ink sm:pt-0.5">{row.k}</dt>
                    <dd className="text-sm text-body leading-relaxed mt-1 sm:mt-0">{row.v}</dd>
                  </div>
                ))}
              </dl>
              <p className="text-sm text-body leading-relaxed mt-4">
                <strong className="text-ink">Verdict.</strong> {b.verdict}
              </p>
            </article>
          ))}
        </div>

        {/* ── Head-to-heads (appended block) ───────────────────────── */}
        <div className="mt-10 border-y border-rule py-5">
          <p className="text-sm font-medium text-ink">Head-to-head</p>
          <p className="text-sm text-body mt-1 leading-relaxed">
            Narrowed it to two? We have compared the pairs people search for
            most, using only what each maker publishes.
          </p>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
            {[
              { href: "/guides/qettle-vs-quooker", label: "Qettle vs Quooker" },
              { href: "/guides/fohen-vs-quooker", label: "Fohen vs Quooker" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
              >
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        {/* ── Amazon alternative ───────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-2">
          The Amazon-available alternative
        </h2>
        <p className="text-base text-body leading-relaxed mb-6">
          None of the five brands above is sold on Amazon UK in any listing we
          would send you to. The one credible product there is a hot water
          dispenser rather than a boiling tap: a small tank and its own tap,
          delivering near-boiling water at around 98°C, sold with 900-plus
          reviews. If you want the convenience without the kitchen refit, this
          is the one to look at. This link is an affiliate link.
        </p>
        <ProductCard
          product={insinkerator}
          pageType={PAGE_TYPE}
          highlight="Near-boiling water on demand, without the refit"
        />

        {/* ── Verdict ──────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Which one for your kitchen
        </h2>
        <div className="prose-section space-y-4">
          <p className="text-base text-body leading-relaxed">
            <strong className="text-ink">Budget under £500:</strong> Fohen or
            Hanstrom 3-in-1 at 98°C, or the InSinkErator dispenser if you would
            rather keep your existing mixer. Put the money you save into a
            filter subscription and a descaling reminder.
          </p>
          <p className="text-base text-body leading-relaxed">
            <strong className="text-ink">£500 to £1,000:</strong> Qettle
            Original 4-in-1 for a 100°C tank at a British mid-market price, or
            Franke's Maris Water Hub if you are buying through a kitchen fitter.
          </p>
          <p className="text-base text-body leading-relaxed">
            <strong className="text-ink">£1,000 and up:</strong> Quooker. Add the
            CUBE if you want chilled and sparkling. In a very hard area, add a
            softener too; the tap will outlast the alternative.
          </p>
        </div>

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-6">
          Frequently asked questions
        </h2>
        <div className="space-y-6">
          {FAQ_DATA.map((faq) => (
            <div key={faq.question}>
              <h3 className="font-semibold text-ink text-base">{faq.question}</h3>
              <p className="text-sm text-body leading-relaxed mt-2">{faq.answer}</p>
            </div>
          ))}
        </div>

        {/* ── Related ──────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Related reading
        </h2>
        <div className="space-y-2">
          {[
            { href: "/hardness", label: "Check water hardness by postcode" },
            { href: "/guides/water-hardness-map", label: "UK water hardness map" },
            { href: "/guides/best-kettle-for-hard-water-uk", label: "Best kettle for hard water UK" },
            { href: "/guides/best-water-softener-uk", label: "Best water softener UK" },
            { href: "/guides/best-water-filter-tap-uk", label: "Best water filter taps UK" },
            { href: "/filters/boiling-water-taps", label: "Boiling water taps we list" },
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

        <footer className="mt-12 pb-4 text-sm text-faint leading-relaxed border-t border-rule pt-6">
          <p>
            Brand facts last checked against each manufacturer's website in
            September {year}; prices and warranty terms change and the maker's
            site is the authority. Hardness data comes from water company
            compliance reports covering 2,800 UK postcode districts. We have no
            commercial relationship with Quooker, Qettle, Fohen, Franke or
            Hanstrom. The InSinkErator link is an Amazon affiliate link.{" "}
            <Link href="/affiliate-disclosure" className="underline underline-offset-2 hover:text-muted transition-colors">
              Affiliate disclosure
            </Link>{" "}
            &middot;{" "}
            <Link href="/about/methodology" className="underline underline-offset-2 hover:text-muted transition-colors">
              Methodology
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
