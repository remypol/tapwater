import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
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
import { getProductsByCategory } from "@/lib/products";
import { OG_IMAGE } from "@/lib/og";

export const revalidate = 86400;

const year = new Date().getFullYear();
const SLUG = "water-softener-salt-guide";
const URL = `https://www.tapwater.uk/guides/${SLUG}`;
const TITLE = `Water Softener Salt Guide (${year}): Tablet vs Block vs Granular`;
const DESCRIPTION =
  "Which salt your water softener takes, tablets versus blocks versus granular, how much a UK home gets through, what BS EN 973 means, and the best-rated salt on Amazon UK.";

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
    question: "What salt do I use in a water softener?",
    answer:
      "The format your softener was designed for. Non-electric twin-cylinder units from Harvey and Kinetico, and BWT's block-salt models, take 4 kg block salt. Most metered single-cylinder units from Monarch, BWT and Water2Buy take salt tablets poured into the brine tank. A few older units and dishwashers specify granular salt. Whatever the format, it should be pure sodium chloride made for softeners, ideally marked BS EN 973 Class A.",
  },
  {
    question: "Can I use table salt, rock salt or dishwasher salt in a softener?",
    answer:
      "No to table salt and rock salt: table salt contains anti-caking agents and iodine, rock salt carries grit and clay, and both can foul the resin and the valve. Dishwasher salt is pure sodium chloride and will not harm the resin, but it is sold in small bags at a high price per kilo and its grain size can bridge in a brine tank. Buy softener salt.",
  },
  {
    question: "How much salt does a water softener use?",
    answer:
      "It depends on how hard the water is and how much you use: a large family in very hard water regenerates far more often than a couple in merely hard water. As a rule of thumb, a family home in very hard water budgets £5 to £10 a month, which is roughly a 25 kg sack of tablets or several pairs of blocks. A metered unit only regenerates when the resin is spent, so it uses less than a timer unit set to rinse on fixed days.",
  },
  {
    question: "Tablet salt or block salt: which is cheaper?",
    answer:
      "Tablets, per kilogram. They come in 10 kg and 25 kg sacks and three-sack bundles, and the price falls with size. Block salt is sold in pairs of 4 kg blocks and costs more per kilo; what you pay for is a format that drops into the cabinet without scooping or spillage and that the twin-cylinder brands require. Neither softens water better than the other.",
  },
  {
    question: "What does BS EN 973 Class A mean?",
    answer:
      "BS EN 973 is the European standard for sodium chloride used to regenerate ion exchange softeners. Class A is the higher purity grade. It tells you the salt is free of the impurities that foul resin, which is what you want. Some reputable salt is not labelled with the standard, so its absence is not proof of a problem, but its presence is a reassurance.",
  },
  {
    question: "Why has my softener stopped using salt?",
    answer:
      "Usually a salt bridge: a crust forms over the brine tank and the salt below it looks full while the water underneath has no salt to dissolve. Break it up with a broom handle. Other causes are a blocked brine line or a stuck float. If the salt level is fine and the water still feels hard, test the softened tap with a hardness tablet before calling anyone; it tells you in a minute whether the resin is doing its job.",
  },
];

interface Format {
  name: string;
  fits: string;
  sold: string;
  perKilo: string;
  handling: string;
  verdict: string;
}

const FORMATS: Format[] = [
  {
    name: "Tablets",
    fits: "Metered single-cylinder units: Monarch, most BWT, Water2Buy and the majority of online brands",
    sold: "10 kg and 25 kg sacks, three-sack bundles",
    perKilo: "Lowest",
    handling: "Pour into the brine tank; 25 kg is a two-handed lift",
    verdict:
      "The default. Buy the biggest sack you can store dry and lift safely.",
  },
  {
    name: "Blocks",
    fits: "Twin-cylinder cabinets: Harvey, Kinetico, BWT block-salt models",
    sold: "Pairs of 4 kg blocks",
    perKilo: "Highest",
    handling: "Stand two blocks in the cabinet; no scoop, no spillage",
    verdict:
      "Not a choice, a requirement of the softener. Convenient enough that nobody minds.",
  },
  {
    name: "Granular",
    fits: "Some older softeners and any unit whose manual specifies it; dishwashers",
    sold: "10 kg bags",
    perKilo: "Low to middling",
    handling: "Dissolves fast; can cake and bridge in a damp tank",
    verdict:
      "Only if the manual says so. Do not put it in a unit designed for tablets.",
  },
];

export default function WaterSoftenerSaltGuide() {
  const salt = getProductsByCategory("softener_salt");
  const byId = (id: string) => salt.find((p) => p.id === id);
  const tablets = [byId("hydrosalt-tablets-25kg"), byId("monarch-ultimate-tablets-10kg"), byId("aquasol-tablets-3x25kg")].filter(
    (p): p is NonNullable<typeof p> => Boolean(p),
  );
  const block = byId("bwt-block-salt-8kg");
  const granular = byId("hydrosoft-granular-10kg");
  const test = byId("simplexhealth-hardness-tablets");

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Guides", url: "https://www.tapwater.uk/guides" },
          { name: "Water Softener Salt Guide", url: URL },
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
        <GuideBreadcrumb title="Water Softener Salt Guide" />
        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          Water softener salt: tablet, block or granular ({year})
        </h1>
        <GuideByline updated={`September ${year}`} />

        <p className="text-lg text-body leading-relaxed">
          Salt is the only thing a water softener ever asks of you, and it
          asks every few weeks for fifteen years. The format is decided by the
          unit, not by preference: blocks for the twin-cylinder cabinets,
          tablets for almost everything else, granular for the few that say so.
          What you can choose is where to buy it and how much to buy at once,
          which is where the running cost is actually decided.
        </p>

        <GeoCitation
          headline={`According to TapWater.uk, a family home in very hard UK water typically spends £5 to £10 a month on softener salt in ${year}, with tablets in 25 kg sacks the cheapest per kilo and 4 kg blocks the format twin-cylinder softeners require.`}
          detail="The highest-rated softener salt on Amazon UK is Hydrosalt's 25 kg tablets at 4.7 stars from more than 2,000 reviews."
        />

        <GuideDisclosure />

        {/* ── Which salt ──────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-12 mb-4">
          Which format your softener takes
        </h2>
        <p className="text-base text-body leading-relaxed mb-6">
          Look at the cabinet. A slot the shape of a house brick takes blocks.
          A tank with a lid takes tablets, unless the manual says granular.
          Each format is pure sodium chloride; the resin does not care which,
          but the mechanism that dissolves it does.
        </p>
        <div className="border-t border-rule">
          {FORMATS.map((f) => (
            <div key={f.name} className="border-b border-rule py-5">
              <h3 className="font-display text-xl italic text-ink">{f.name}</h3>
              <dl className="mt-3 grid grid-cols-[7rem_1fr] gap-x-4 gap-y-1.5 text-sm">
                <dt className="text-muted">Fits</dt>
                <dd className="text-body">{f.fits}</dd>
                <dt className="text-muted">Sold as</dt>
                <dd className="text-body">{f.sold}</dd>
                <dt className="text-muted">Price per kilo</dt>
                <dd className="text-body">{f.perKilo}</dd>
                <dt className="text-muted">Handling</dt>
                <dd className="text-body">{f.handling}</dd>
              </dl>
              <p className="text-base text-ink mt-3">{f.verdict}</p>
            </div>
          ))}
        </div>

        {/* ── Tablets rail ───────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-2">
          Tablet salt
        </h2>
        <p className="text-base text-body leading-relaxed mb-6">
          The workhorse. Three sizes, from a 10 kg bag you can carry up a loft
          ladder to a three-sack bundle that lasts a very hard water household
          a season. Look for BS EN 973 Class A on the bag where the maker
          states it.
        </p>
        <div className="space-y-4">
          {tablets.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              pageType="water-softener-salt-guide"
              placement="guide-salt-rail"
              highlight={
                product.id === "hydrosalt-tablets-25kg"
                  ? "Best-rated tablets on Amazon UK"
                  : product.id === "monarch-ultimate-tablets-10kg"
                    ? "The lighter bag, standard-marked"
                    : "Bulk buy: three sacks in one delivery"
              }
            />
          ))}
        </div>

        {/* ── Block ──────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-2">
          Block salt
        </h2>
        <p className="text-base text-body leading-relaxed mb-6">
          For Harvey, Kinetico and BWT block-salt cabinets. Each brand sells
          its own blocks; third-party 4 kg blocks are the same size and fit the
          same slot. You pay more per kilo than tablets and in return never
          touch a scoop.
        </p>
        {block && (
          <ProductCard
            product={block}
            pageType="water-softener-salt-guide"
            placement="guide-salt-rail"
            highlight="For twin-cylinder cabinets"
          />
        )}

        {/* ── Granular ───────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-2">
          Granular salt
        </h2>
        <p className="text-base text-body leading-relaxed mb-6">
          Fine-grained and quick to dissolve, which is why some older softeners
          and every dishwasher specify it. In a modern tablet unit it can cake
          into a bridge over the brine tank, so only use it where the manual
          says to.
        </p>
        {granular && (
          <ProductCard
            product={granular}
            pageType="water-softener-salt-guide"
            placement="guide-salt-rail"
            highlight="Only where the manual specifies it"
          />
        )}

        {/* ── How much ───────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          How much you will get through
        </h2>
        <p className="text-base text-body leading-relaxed">
          Two things set the rate: how hard the water is, because harder water
          exhausts the resin sooner, and how much water the household runs.
          A metered softener only regenerates when the resin is spent, so a
          couple in 200 mg/L water might top up every couple of months while a
          family of five in 350 mg/L water is lifting a sack every few weeks.
          The sensible budget for a family home in very hard water is £5 to
          £10 a month, and it falls if you buy in bulk.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          Storage matters more than brand. Salt kept somewhere damp cakes into
          a solid lump that will not pour and, in the tank, forms a bridge
          that leaves the softener rinsing with plain water. Keep sacks sealed,
          off a concrete floor, and do not overfill the brine tank.
        </p>

        {/* ── Test ───────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-2">
          Check it is actually working
        </h2>
        <p className="text-base text-body leading-relaxed mb-6">
          A full salt tank proves nothing if a bridge has formed or the resin
          is spent. A hardness test tablet dropped into a glass from the
          softened tap gives a yes-or-no answer in a minute. Test the hard
          kitchen tap alongside it and you will see the difference the unit is
          making, or not.
        </p>
        {test && (
          <ProductCard
            product={test}
            pageType="water-softener-salt-guide"
            placement="guide-salt-rail"
            highlight="A one-minute answer"
          />
        )}

        <p className="text-base text-body leading-relaxed mt-8">
          Do not have a softener yet? Start with{" "}
          <Link href="/guides/do-i-need-a-water-softener/" className="text-accent hover:underline">
            do I need a water softener
          </Link>{" "}
          and then{" "}
          <Link href="/guides/best-water-softener-uk/" className="text-accent hover:underline">
            best water softener UK
          </Link>
          .
        </p>

        <GuideFaq faqs={FAQ_DATA} />

        <SoftenerGuidesNav current={SLUG} className="mt-14" />

        <GuideFooter reviewed={`September ${year}`}>
          Ratings and review counts are from Amazon UK listings at the time of review
          and change daily.{" "}
        </GuideFooter>
      </div>
    </div>
  );
}
