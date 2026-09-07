import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ShieldCheck, Star } from "lucide-react";
import { PostcodeSearch } from "@/components/postcode-search";
import { AffiliateLink } from "@/components/affiliate-link";
import { ProductCard } from "@/components/product-card";
import { ArticleSchema, BreadcrumbSchema, FAQSchema } from "@/components/json-ld";
import { GeoCitation } from "@/components/geo-citation";
import { getProductsByCategory } from "@/lib/products";
import { OG_IMAGE } from "@/lib/og";

const year = new Date().getFullYear();
const URL = "https://www.tapwater.uk/guides/best-kettle-for-hard-water-uk";
const PAGE_TYPE = "best-kettle-hard-water-guide";

/* ── FAQ ─────────────────────────────────────────────────────────────── */

const FAQ_DATA = [
  {
    question: "What is the best kettle for hard water in the UK?",
    answer:
      "For hard and very hard water (above 180 mg/L calcium carbonate), a kettle with a treatment cartridge is the only kind that reduces the scale forming in the first place. The Russell Hobbs BRITA Purity models run water through a MAXTRA PRO Limescale Expert cartridge before boiling. Every other 'anti-limescale' kettle only catches flakes in the spout. If you would rather not buy cartridges, a glass kettle plus a monthly descale is the honest alternative.",
  },
  {
    question: "Does a kettle limescale filter actually stop limescale?",
    answer:
      "No. On almost every kettle the limescale filter is a fine mesh inside the spout. It stops flakes that have already broken off the element landing in your cup. It does nothing to the water, so scale still forms inside. Only a cartridge kettle (BRITA-type) changes the water itself, and even that reduces rather than removes hardness.",
  },
  {
    question: "Why does my kettle fur up so quickly?",
    answer:
      "Because your water carries dissolved calcium and magnesium bicarbonate, called temporary hardness. Heating turns it into solid calcium carbonate, which sticks to the hottest surface: the element or the base plate. The harder your water, the faster it builds. In parts of London, Kent and East Anglia (300 mg/L and above) a kettle can show visible scale within two weeks of a descale.",
  },
  {
    question: "Is a glass or stainless steel kettle better for hard water?",
    answer:
      "The material does not change how much scale forms. Glass shows it sooner, which is a good thing: you descale before it thickens, and glass wipes clean. Steel and plastic hide scale until you open the lid. If you are not the type to keep a schedule, glass is the better choice because it nags you.",
  },
  {
    question: "How often should I descale a kettle in a hard water area?",
    answer:
      "Roughly monthly in hard water (180 to 250 mg/L) and every two to three weeks in very hard water (above 250 mg/L). Fill with a 1:1 mix of white vinegar and water, or a citric acid descaler, boil, leave for an hour, empty, then boil and discard two loads of fresh water. Wipe the element or base with a soft cloth while damp.",
  },
  {
    question: "Will a water filter jug stop my kettle scaling?",
    answer:
      "It helps. A BRITA or similar jug cartridge reduces temporary hardness, so filling the kettle from the jug slows scale noticeably. It is the same cartridge chemistry as a filter kettle, just in a separate container. If you already own a jug, use it for the kettle before spending on a new one.",
  },
  {
    question: "Is limescale in a kettle bad for you?",
    answer:
      "No. Limescale is calcium carbonate, the same mineral as chalk. Flakes in your tea are unpleasant but harmless. The real cost is to the kettle: a scaled element takes longer to boil, uses more electricity, and fails sooner.",
  },
  {
    question: "Should I just get a water softener instead?",
    answer:
      "If your kettle is the only problem, no. A softener costs from around £400 plus fitting and treats the whole house: boiler, shower screen, dishwasher, taps. If you live above 250 mg/L and are fighting scale everywhere, a softener is the fix that ends the kettle problem as a side effect. Check your postcode hardness first; below 180 mg/L it rarely pays back.",
  },
];

/* ── Metadata ────────────────────────────────────────────────────────── */

export async function generateMetadata(): Promise<Metadata> {
  const title = `Best Kettle for Hard Water UK (${year}): Filter Kettles Compared`;
  const description =
    "Why kettles fur up, which kettle limescale filters actually work, and seven UK kettles compared for hard water. Check your postcode hardness first.";
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
      title: `Best Kettle for Hard Water UK (${year})`,
      description,
    },
  };
}

/* ── Hardness bands, mirroring hardnessLabelFor in src/lib/data.ts ─────── */

const HARDNESS_BANDS = [
  {
    label: "Soft",
    range: "under 60 mg/L",
    where: "Scotland, Wales, the North West",
    kettle: "A faint haze on the element after months. Any kettle will do; skip the filter models.",
  },
  {
    label: "Moderately soft",
    range: "60 to 120 mg/L",
    where: "Pennine towns, parts of Yorkshire and the South West",
    kettle: "Light scale after two or three months. A rinse-out spout mesh and a descale a few times a year is enough.",
  },
  {
    label: "Moderately hard",
    range: "120 to 180 mg/L",
    where: "Much of the Midlands and the West Country",
    kettle: "Visible crust within six to eight weeks. Glass helps you catch it; descale every couple of months.",
  },
  {
    label: "Hard",
    range: "180 to 250 mg/L",
    where: "Birmingham, Leicester, Bristol, the South Coast",
    kettle: "Flakes in your tea within a month. This is where a cartridge kettle or a jug starts to earn its keep.",
  },
  {
    label: "Very hard",
    range: "over 250 mg/L",
    where: "London, Kent, Essex, East Anglia, Oxfordshire",
    kettle: "Scale within a fortnight; elements fail early. Cartridge kettle plus monthly descale, or a softener for the whole house.",
  },
];

/* ── Kettle spec table (facts not held in the product catalogue) ────────── */

const KETTLE_SPECS: Record<
  string,
  { body: string; defence: string; capacity: string }
> = {
  "russell-hobbs-brita-purity-glass-1-5l": {
    body: "Glass",
    defence: "BRITA MAXTRA PRO cartridge, monthly",
    capacity: "1.5L",
  },
  "russell-hobbs-brita-purity-1l": {
    body: "Plastic",
    defence: "BRITA MAXTRA PRO cartridge, monthly",
    capacity: "1L",
  },
  "russell-hobbs-illuminating-glass-1-7l": {
    body: "Glass",
    defence: "Washable spout mesh",
    capacity: "1.7L",
  },
  "cosori-stainless-1-7l": {
    body: "Stainless steel",
    defence: "Removable spout mesh",
    capacity: "1.7L",
  },
  "morphy-richards-hive-1-5l": {
    body: "Plastic",
    defence: "Spout mesh",
    capacity: "1.5L",
  },
  "tefal-loft-1-7l": {
    body: "Plastic",
    defence: "Removable spout mesh",
    capacity: "1.7L",
  },
  "swan-windsor-1-7l": {
    body: "Plastic",
    defence: "Removable spout mesh",
    capacity: "1.7L",
  },
};

const HIGHLIGHTS: Record<string, string> = {
  "russell-hobbs-brita-purity-glass-1-5l": "Top pick for hard water: the only glass kettle here that treats the water",
  "russell-hobbs-brita-purity-1l": "Small-household pick: same cartridge, smaller kettle",
  "russell-hobbs-illuminating-glass-1-7l": "Glass pick: see the scale, wipe the scale",
  "cosori-stainless-1-7l": "Plastic-free pick: steel inside, descale on a schedule",
  "morphy-richards-hive-1-5l": "Design pick for moderately hard areas",
  "tefal-loft-1-7l": "Easy-clean pick: wide lid, removable mesh",
  "swan-windsor-1-7l": "Budget pick: traditional shape, full size",
};

/* ── Page ────────────────────────────────────────────────────────────── */

export default function BestKettleHardWaterGuide() {
  const kettles = getProductsByCategory("kettle");
  const britaGlass = kettles.find((p) => p.id === "russell-hobbs-brita-purity-glass-1-5l")!;
  const illuminating = kettles.find((p) => p.id === "russell-hobbs-illuminating-glass-1-7l")!;
  const tefal = kettles.find((p) => p.id === "tefal-loft-1-7l")!;

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Guides", url: "https://www.tapwater.uk/guides" },
          { name: "Best Kettle for Hard Water UK", url: URL },
        ]}
      />
      <ArticleSchema
        headline={`Best Kettle for Hard Water UK ${year}`}
        description="Why kettles fur up, what a kettle limescale filter really does, and seven UK kettles compared for hard water, matched to postcode hardness data."
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
              Best Kettle for Hard Water UK
            </li>
          </ol>
        </nav>

        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          Best Kettle for Hard Water UK {year}
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
            A furred-up kettle is not a kettle problem. It is a water problem, and
            it is mapped. Around three in five English postcodes receive hard or
            very hard water, and in the hardest of them a freshly descaled kettle
            shows white crust again inside a fortnight. No kettle changes that.
            A few of them slow it down, and the rest just keep the flakes out of
            your cup.
          </p>
          <p className="text-base text-body leading-relaxed mt-4">
            This guide explains why kettles scale, what a &ldquo;limescale
            filter&rdquo; genuinely does, and which of seven widely sold UK
            kettles is worth buying for your hardness band. Start by checking
            your postcode: the right answer in Manchester is the wrong answer in
            Canterbury.
          </p>
        </div>

        <GeoCitation
          headline={`According to TapWater.uk's analysis of 2,800 UK postcode districts, roughly 60% of England receives hard or very hard water above 180 mg/L, the range in which kettle limescale returns within weeks of descaling.`}
          detail={`Our ${year} pick for hard water is the Russell Hobbs BRITA Purity Glass Kettle; the Russell Hobbs Illuminating Glass is the no-cartridge alternative.`}
        />

        <div className="bg-wash border border-rule rounded-xl p-4 mt-6 mb-8 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <p className="text-sm text-body">
            This guide contains Amazon affiliate links. If you buy through them we
            earn a small commission at no extra cost to you, which funds our
            independent water data work. Prices are not shown because Amazon
            changes them daily; every link opens the live listing.{" "}
            <Link href="/affiliate-disclosure" className="text-accent hover:underline">
              Full disclosure
            </Link>
          </p>
        </div>

        {/* ── Quick picks ──────────────────────────────────────────── */}
        <div className="card-elevated rounded-2xl p-6 lg:p-8 mb-12">
          <h2 className="font-display text-xl italic text-ink mb-4">Quick picks</h2>
          <div className="space-y-3">
            {[
              {
                label: "Hard and very hard water",
                product: britaGlass,
                why: "Treats the water before it boils; glass shows what is left",
              },
              {
                label: "No cartridges, please",
                product: illuminating,
                why: "Glass body so you descale on sight; washable mesh keeps flakes out",
              },
              {
                label: "Easiest to keep clean",
                product: tefal,
                why: "Wide lid, removable filter, highest rating in the group",
              },
            ].map((pick, i, arr) => (
              <div
                key={pick.product.id}
                className={`flex items-start justify-between gap-4 ${i < arr.length - 1 ? "pb-3 border-b border-rule" : ""}`}
              >
                <div>
                  <p className="text-xs text-accent font-medium">{pick.label}</p>
                  <p className="font-display text-base italic text-ink mt-0.5">
                    {pick.product.brand} {pick.product.model}
                  </p>
                  <p className="text-sm text-muted mt-0.5">{pick.why}</p>
                </div>
                <AffiliateLink
                  href={pick.product.affiliateUrl}
                  pageType={PAGE_TYPE}
                  recommendationReason={pick.label}
                  productCategory={pick.product.category}
                  productSlug={pick.product.slug}
                  placement="quick-picks"
                  campaign={PAGE_TYPE}
                  className="shrink-0 inline-flex items-center gap-1 text-sm font-medium text-ink hover:text-accent transition-colors"
                >
                  Check price
                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                </AffiliateLink>
              </div>
            ))}
          </div>
        </div>

        {/* ── Why kettles fur up ───────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-12 mb-4">
          Why kettles fur up
        </h2>
        <p className="text-base text-body leading-relaxed">
          Rain falling on chalk and limestone dissolves calcium and magnesium on
          its way into the aquifer. Your water company measures the result as
          milligrams of calcium carbonate per litre. Part of that load is
          &ldquo;temporary hardness&rdquo;: bicarbonates that stay dissolved in
          cold water but break down the moment you heat it, turning back into
          solid chalk. The hottest surface in the kettle, the element or the base
          plate, is where it lands.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          That is why the kettle scales before anything else in the house, and
          why the speed is so different from one town to the next. Our postcode
          data uses five hardness bands. Here is what each one means for the
          kettle on your worktop.
        </p>

        <div className="mt-6 border-t border-rule">
          {HARDNESS_BANDS.map((band) => (
            <div
              key={band.label}
              className="py-4 border-b border-rule grid gap-2 sm:grid-cols-[180px_1fr] sm:gap-x-6"
            >
              <div>
                <p className="font-display italic text-lg text-ink leading-tight">{band.label}</p>
                <p className="font-mono text-xs text-muted mt-1">{band.range}</p>
                <p className="text-xs text-faint mt-1 leading-snug">{band.where}</p>
              </div>
              <p className="text-sm text-body leading-relaxed sm:pt-0.5">{band.kettle}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-faint mt-3">
          Bands follow the classification used on our postcode pages. Regional
          examples are typical, not universal: hardness varies by supply zone
          within a city.
        </p>

        <div className="mt-8 p-5 bg-wash rounded-xl">
          <p className="text-sm text-body font-medium mb-3">
            Find your band. Enter your postcode for the hardness reading in your
            supply zone.
          </p>
          <div className="max-w-md">
            <PostcodeSearch size="sm" />
          </div>
        </div>

        {/* ── What actually helps ─────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          What actually helps, in order of how much
        </h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-ink text-base">A kettle with a treatment cartridge</h3>
            <p className="text-sm text-body leading-relaxed mt-1.5">
              The Russell Hobbs BRITA Purity kettles pass water through a MAXTRA
              PRO Limescale Expert cartridge as you fill them. The cartridge
              swaps out some of the calcium and magnesium, so less scale forms
              when the water boils. It reduces hardness rather than removing it,
              and the cartridge is spent after roughly four weeks, which is
              around £50 a year in refills. In hard and very hard water that is
              the trade: less descaling, more cartridges.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-ink text-base">A glass body</h3>
            <p className="text-sm text-body leading-relaxed mt-1.5">
              Glass does not change the chemistry, it changes your behaviour.
              You see the first haze and descale before it becomes a crust, and
              glass wipes clean where plastic stays cloudy. Most people who
              &ldquo;never get round to descaling&rdquo; a steel kettle do it
              on time with a glass one.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-ink text-base">A descaling routine</h3>
            <p className="text-sm text-body leading-relaxed mt-1.5">
              Free, and the single biggest difference to how long a kettle
              lasts. Half white vinegar, half water, boil, leave an hour, rinse
              with two boiled-and-discarded fills. Citric acid sachets do the
              same job without the smell. Monthly in hard water, fortnightly in
              very hard.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-ink text-base">Filling from a jug filter</h3>
            <p className="text-sm text-body leading-relaxed mt-1.5">
              Same cartridge chemistry as a filter kettle, in a jug you may
              already own. Slower, but it means any kettle becomes a filter
              kettle. We compared the jugs in{" "}
              <Link href="/guides/best-water-filter-jug-uk" className="text-accent hover:underline">
                Best Water Filter Jug UK
              </Link>
              .
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-ink text-base">A water softener</h3>
            <p className="text-sm text-body leading-relaxed mt-1.5">
              The only option that stops scale everywhere, not just in the
              kettle. From around £400 for the unit plus fitting, it makes sense
              in very hard areas where the boiler, shower and dishwasher are
              scaling too. Read{" "}
              <Link href="/guides/best-water-softener-uk" className="text-accent hover:underline">
                Best Water Softener UK
              </Link>{" "}
              or{" "}
              <Link href="/hardness#softener-quotes" className="text-accent hover:underline">
                request installer quotes for your postcode
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="card p-5 mt-8 border-l-4 border-l-warning">
          <p className="text-sm text-body leading-relaxed">
            <strong className="text-ink">About &ldquo;limescale filter&rdquo; on the box.</strong>{" "}
            On five of the seven kettles below it means a mesh in the spout. It
            catches flakes that have already broken off the element so they do
            not end up in your tea. It does nothing to the water and does not
            slow scale forming. Useful, but not what the words suggest.
          </p>
        </div>

        {/* ── Product rail ─────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-2">
          Seven kettles for hard water, compared
        </h2>
        <p className="text-sm text-muted mb-6">
          All seven are sold on Amazon UK with large review bases. Ratings are
          Amazon averages at the time of writing.
        </p>
        <div className="space-y-4">
          {kettles.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              pageType={PAGE_TYPE}
              highlight={HIGHLIGHTS[product.id]}
            />
          ))}
        </div>

        {/* ── Comparison table ─────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Side by side
        </h2>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-rule">
                <th className="text-left p-3 text-faint font-medium text-xs">Kettle</th>
                <th className="text-left p-3 text-faint font-medium text-xs">Body</th>
                <th className="text-left p-3 text-faint font-medium text-xs">Scale defence</th>
                <th className="text-center p-3 text-faint font-medium text-xs">Size</th>
                <th className="text-center p-3 text-faint font-medium text-xs">Rating</th>
                <th className="text-center p-3 text-faint font-medium text-xs whitespace-nowrap">Yearly cost</th>
              </tr>
            </thead>
            <tbody>
              {kettles.map((product) => {
                const spec = KETTLE_SPECS[product.id];
                return (
                  <tr key={product.id} className="border-b border-rule/50 hover:bg-wash/50">
                    <td className="p-3">
                      <AffiliateLink
                        href={product.affiliateUrl}
                        pageType={PAGE_TYPE}
                        recommendationReason={product.bestFor}
                        productCategory={product.category}
                        productSlug={product.slug}
                        placement="comparison-table"
                        campaign={PAGE_TYPE}
                        className="font-medium text-ink hover:text-accent"
                      >
                        {product.brand} {product.model}
                      </AffiliateLink>
                    </td>
                    <td className="p-3 text-body">{spec?.body ?? "—"}</td>
                    <td className="p-3 text-body">{spec?.defence ?? "—"}</td>
                    <td className="p-3 text-center font-data text-ink">{spec?.capacity ?? "—"}</td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" aria-hidden="true" />
                        <span className="font-data text-ink">{product.rating.toFixed(1)}</span>
                      </span>
                    </td>
                    <td className="p-3 text-center font-data text-muted">
                      {product.annualCost ? `£${product.annualCost}` : "None"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-faint mt-3">
          Yearly cost is replacement cartridges only. Kettles with a rinse-out
          mesh have no running cost beyond electricity and descaler.
        </p>

        {/* ── Verdict ─────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Which one for your water
        </h2>
        <div className="prose-section space-y-4">
          <p className="text-base text-body leading-relaxed">
            <strong className="text-ink">Hard or very hard (180 mg/L and up):</strong>{" "}
            the BRITA Purity Glass. It is the only kettle here that reduces the
            scale forming, and the glass shows you what the cartridge did not
            catch. Budget the cartridges, or fill any other kettle from a jug
            you already own.
          </p>
          <p className="text-base text-body leading-relaxed">
            <strong className="text-ink">Moderately hard (120 to 180 mg/L):</strong>{" "}
            a cartridge is overkill. Buy glass so you descale on sight; the
            Russell Hobbs Illuminating is the well-reviewed default. The Cosori
            is the choice if you want steel and no plastic in contact with the
            water, provided you set a descaling reminder.
          </p>
          <p className="text-base text-body leading-relaxed">
            <strong className="text-ink">Soft or moderately soft (under 120 mg/L):</strong>{" "}
            scale is not your problem. Pick on looks, size and price; the Tefal
            Loft and Swan Windsor are perfectly good, and you will barely see
            the mesh do anything.
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
            { href: "/guides/best-water-filter-jug-uk", label: "Best water filter jug UK" },
            { href: "/guides/best-water-softener-uk", label: "Best water softener UK" },
            { href: "/guides/best-boiling-water-tap-uk", label: "Best boiling water tap UK" },
            { href: "/filters/kettles-hard-water", label: "All kettles for hard water we list" },
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
            Product selection last reviewed September {year}. Ratings and review
            counts are Amazon UK averages at the time of writing and will drift.
            Hardness data comes from water company compliance reports covering
            2,800 UK postcode districts. We earn a commission from purchases made
            through affiliate links at no extra cost to you.{" "}
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
