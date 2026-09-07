import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { ProductComparisonTable } from "@/components/product-comparison-table";
import { PostcodeSearch } from "@/components/postcode-search";
import { BreadcrumbSchema, FAQSchema } from "@/components/json-ld";
import {
  CATEGORY_META,
  CATEGORY_ORDER,
  getProductsByCategory,
} from "@/lib/products";
import type { ProductCategory } from "@/lib/types";
import { OG_IMAGE } from "@/lib/og";

/* ── slug ↔ category mapping ──────────────────────────────────────────── */

const SLUG_TO_CATEGORY: Record<string, ProductCategory> = Object.fromEntries(
  CATEGORY_ORDER.map((cat) => [CATEGORY_META[cat].slug, cat]),
) as Record<string, ProductCategory>;

/* ── category → buying guide link ─────────────────────────────────────── */

const CATEGORY_GUIDE: Partial<
  Record<ProductCategory, { title: string; href: string }>
> = {
  reverse_osmosis: {
    title: "Best Reverse Osmosis System UK",
    href: "/guides/best-reverse-osmosis-system-uk/",
  },
  shower: {
    title: "Best Shower Filter for Hard Water UK",
    href: "/guides/best-shower-filter-uk/",
  },
  whole_house: {
    title: "Best Whole House Water Filter UK",
    href: "/guides/best-whole-house-water-filter-uk/",
  },
  testing_kit: {
    title: "Best Water Testing Kit UK",
    href: "/guides/best-water-testing-kit-uk/",
  },
  jug: {
    title: "Best Water Filter Jug UK",
    href: "/guides/best-water-filter-jug-uk/",
  },
  under_sink: {
    title: "Best Under Sink Water Filter UK",
    href: "/guides/best-under-sink-water-filter-uk/",
  },
  filter_tap: {
    title: "Best Water Filter Taps UK",
    href: "/guides/best-water-filter-tap-uk/",
  },
  countertop: {
    title: "Best Water Filter Taps UK (tap-mounted picks)",
    href: "/guides/best-water-filter-tap-uk/",
  },
  water_softener: {
    title: "Best Water Softener UK",
    href: "/guides/best-water-softener-uk/",
  },
  // Hard-water appliances (appended block)
  kettle: {
    title: "Best Kettle for Hard Water UK",
    href: "/guides/best-kettle-for-hard-water-uk/",
  },
  boiling_tap: {
    title: "Best Boiling Water Tap UK",
    href: "/guides/best-boiling-water-tap-uk/",
  },
  softener_salt: {
    title: "Water Softener Salt Guide: tablet, block or granular",
    href: "/guides/water-softener-salt-guide/",
  },
};

/* ── optional per-category long intro (rendered when present) ─────────── */

const CATEGORY_INTRO: Partial<Record<ProductCategory, string[]>> = {
  reverse_osmosis: [
    "A reverse osmosis water filter pushes mains water through a semi-permeable membrane with pores small enough to reject dissolved contaminants that carbon filters let through: PFAS, fluoride, nitrates, heavy metals, and the hardness minerals behind limescale. A carbon pre-filter protects the membrane from chlorine, and a post-filter polishes the taste on the way out.",
    "In the UK the case for an RO system is specific rather than general. Tap water here meets strict legal standards, but PFAS currently has no statutory limit in England and Wales, fluoride passes every other filter type, and most of the country lives with hard water. Reverse osmosis is the one home technology that answers all three at once, which is why it anchors the top of our removal comparison.",
    "The practical trade-offs: RO wastes some water (modern tankless systems run around 3:1 pure-to-drain), strips beneficial minerals along with the bad (remineralisation stages exist for that), and filters drinking water at one tap rather than the whole house. Check your postcode below to see whether your water actually carries the contaminants an RO system is built for.",
  ],
  whole_house: [
    "A whole house water filter, also sold as a mains water filter or point-of-entry filter, sits on the pipe where water enters your home and treats everything downstream: kitchen tap, showers, bath, washing machine and boiler. Depending on the stages inside, it removes chlorine taste and smell, grit and rust from old mains, and on multi-stage systems bacteria, lead, nitrates and other metals.",
    "It is not a water softener. A filter takes chlorine and particles out but leaves the calcium and magnesium that cause limescale, so if furred-up kettles and scaled shower screens are your problem you need a softener, not one of the systems below. Our full guide explains who in the UK benefits, how to size one by flow rate, what fitting and cartridges cost, and why neither system here is certified for PFAS.",
  ],
};

/* ── per-category FAQs ────────────────────────────────────────────────── */

const CATEGORY_FAQS: Partial<
  Record<ProductCategory, { question: string; answer: string }[]>
> = {
  jug: [
    {
      question: "How often do I need to replace a water filter jug cartridge?",
      answer:
        "Most jug filters last between 4 weeks and 2 months depending on the brand and your water hardness. ZeroWater filters may need replacing sooner in hard water areas.",
    },
    {
      question: "Do water filter jugs remove fluoride?",
      answer:
        "Standard carbon-based jugs like BRITA do not remove fluoride. ZeroWater is one of the few jug filters certified to reduce fluoride levels.",
    },
  ],
  countertop: [
    {
      question: "Will a countertop filter fit my tap?",
      answer:
        "Most clip-on tap filters work with standard round taps. They are not compatible with pull-out, spray, or designer taps. Check the adapter list before buying.",
    },
    {
      question: "Is a countertop filter better than a jug?",
      answer:
        "Countertop filters provide on-demand filtered water without waiting, and many remove more contaminants than basic jugs. They are a good middle ground between jugs and under-sink systems.",
    },
  ],
  under_sink: [
    {
      question: "Do I need a plumber to install an under-sink filter?",
      answer:
        "Basic under-sink filters like the Waterdrop 10UA use push-fit connectors and can be installed DIY. More complex systems may need a plumber.",
    },
    {
      question: "How is an under-sink filter different from reverse osmosis?",
      answer:
        "Under-sink carbon filters remove chlorine, lead, and some chemicals but leave minerals in. Reverse osmosis removes virtually everything, including fluoride, PFAS, and nitrates.",
    },
  ],
  reverse_osmosis: [
    {
      question: "What is a reverse osmosis water filter?",
      answer:
        "A reverse osmosis water filter forces tap water through a semi-permeable membrane whose pores reject dissolved contaminants, backed by carbon pre- and post-filters. It removes the widest range of anything available for home use, including PFAS, fluoride, nitrates, heavy metals, and hardness minerals.",
    },
    {
      question: "How much does a reverse osmosis system cost in the UK?",
      answer:
        "The systems we review run from £329 to £650 up front. Budget £60-£120 a year for replacement filters depending on the model, and factor the membrane itself every two to three years. Tankless designs cost more up front but save cupboard space and waste less water.",
    },
    {
      question: "Is reverse osmosis water safe to drink?",
      answer:
        "Yes. RO water is safe and is used worldwide for drinking water. The debate is about minerals: RO strips calcium and magnesium along with the contaminants. A balanced diet supplies far more of both than tap water does, and several systems add a remineralisation stage for taste.",
    },
    {
      question: "Does reverse osmosis waste a lot of water?",
      answer:
        "Modern tankless RO systems like the Waterdrop G3P600 have a 3:1 pure-to-waste ratio, meaning 3 litres of clean water for every 1 litre wasted. Older systems can be less efficient.",
    },
    {
      question: "Does reverse osmosis remove minerals I need?",
      answer:
        "RO removes most dissolved minerals. Some systems add minerals back with a remineralisation stage. For most people, a balanced diet provides enough minerals without relying on tap water.",
    },
  ],
  whole_house: [
    {
      question: "Is a whole house water filter the same as a water softener?",
      answer:
        "No. A whole house filter removes chlorine, sediment and, on multi-stage systems, metals and bacteria from all the water entering your home, but it does not reduce hardness or stop limescale. A water softener does the opposite. If limescale is your problem, check the hardness at your postcode and read the softener guides instead.",
    },
    {
      question: "Do whole house filters reduce water pressure?",
      answer:
        "Not noticeably when sized correctly. Compare the rated flow in litres per minute with your household's peak draw: a one or two bathroom home is usually covered by 25 L/min, which is what the BWT E1 is rated at. Larger 20-inch housings lose less pressure than 10-inch ones.",
    },
    {
      question: "Can I install a whole house filter myself?",
      answer:
        "It is a cut-and-fit job on the incoming main, with isolation valves either side and a bypass loop, so most people use a plumber. Expect £150 to £300 for a straightforward fitting on top of the unit price.",
    },
  ],
  shower: [
    {
      question: "Do shower filters actually work?",
      answer:
        "Shower filters using KDF-55 and activated carbon media can significantly reduce chlorine levels. Many users report softer skin and hair within the first week of use.",
    },
    {
      question: "Will a shower filter help with hard water?",
      answer:
        "Shower filters reduce chlorine and some heavy metals but do not soften water. For hard water, you need a dedicated water softener installed on your mains supply.",
    },
  ],
  testing_kit: [
    {
      question: "Are home water testing kits accurate?",
      answer:
        "DIY strip tests give a useful snapshot but are less precise than lab analysis. For definitive results, send a sample to an ISO 17025 accredited lab like Tap Score.",
    },
    {
      question: "What should I test my water for?",
      answer:
        "At minimum, test for hardness, pH, chlorine, lead, and nitrates. If you are concerned about PFAS or microplastics, you will need a lab test as strip kits cannot detect these.",
    },
  ],
  // Hard-water appliances (appended block)
  kettle: [
    {
      question: "Does a kettle limescale filter stop limescale?",
      answer:
        "No. On most kettles the 'limescale filter' is a fine mesh in the spout. It catches flakes of scale that have already broken off the element so they do not land in your cup. Scale still forms inside. The exception is a kettle with a treatment cartridge, such as the Russell Hobbs BRITA models, which reduces temporary hardness before the water is boiled.",
    },
    {
      question: "Is a glass or stainless steel kettle better for hard water?",
      answer:
        "Neither material changes how much scale forms; that depends on your water. Glass shows scale sooner, which most people find useful because you descale before it thickens and it wipes clean. Steel and plastic hide scale until you look inside, so you need a routine rather than a visual cue.",
    },
  ],
  boiling_tap: [
    {
      question: "Is the InSinkErator HOT150 a boiling water tap?",
      answer:
        "Not strictly. It is an instant hot water dispenser that delivers near-boiling water at around 98°C from a tank under the sink. True boiling taps from Quooker, Qettle, Fohen, Franke and Hanstrom hold water at or above 100°C under pressure. For tea, coffee and most cooking the difference is small; for some recipes it matters.",
    },
    {
      question: "Do boiling water taps work in hard water areas?",
      answer:
        "Yes, but only with a filter cartridge in the feed and regular replacement. The tank holds water at very high temperature for hours, which is exactly the condition that drives scale to form fastest. Check your hardness by postcode before buying and follow the manufacturer's hardness limit; in very hard areas some makers recommend a softener.",
    },
  ],
};

/* ── static params ────────────────────────────────────────────────────── */

// Every category slug is enumerated at build time from CATEGORY_ORDER. Without
// this, notFound() alone can still serve a cached 200 on Vercel — see the
// comment in /postcode/[district]/page.tsx for the measured behaviour.
export const dynamicParams = false;

export function generateStaticParams() {
  return CATEGORY_ORDER.map((cat) => ({
    category: CATEGORY_META[cat].slug,
  }));
}

/* ── metadata ─────────────────────────────────────────────────────────── */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const category = SLUG_TO_CATEGORY[slug];
  if (!category) return {};

  const meta = CATEGORY_META[category];
  const count = getProductsByCategory(category).length;
  // An empty category (water_softener: units are sold through installers) redirects
  // to its guide in the page component; keep it out of the index meanwhile.
  if (count === 0) return { title: meta.title, robots: { index: false, follow: true } };

  // A category can legitimately hold one product, so nothing here may hard-code a
  // plural: "Compare 1 Filters" is the kind of wording that ends up in a search result.
  const filters = count === 1 ? "1 Filter" : `${count} Filters`;
  const products = count === 1 ? "1 product" : `${count} products`;

  const title = `${meta.title} — Compare ${filters}`;
  const descFull = `${meta.description} ${products} compared with prices, ratings, and contaminant removal data.`;
  const descShort = `${meta.description} ${products} compared with prices and ratings.`;
  const firstSentence = meta.description.split(/(?<=\.)\s/)[0];
  const descMin = `${firstSentence} ${products} compared with prices and ratings.`;
  const description =
    descFull.length <= 155 ? descFull : descShort.length <= 155 ? descShort : descMin.slice(0, 155);
  const url = `https://www.tapwater.uk/filters/${meta.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      images: OG_IMAGE,
      title,
      description,
      url,
      type: "website",
    },
    twitter: {
      images: OG_IMAGE,
      card: "summary_large_image",
      title,
      description,
    },
  };
}

/* ── page ──────────────────────────────────────────────────────────────── */

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const category = SLUG_TO_CATEGORY[slug];
  if (!category) notFound();
  // Softener units are sold through installers, so the category has no products:
  // send the visitor (and Google) to the guide that actually answers the question.
  if (category === "water_softener" && getProductsByCategory(category).length === 0) {
    permanentRedirect("/guides/best-water-softener-uk");
  }

  const meta = CATEGORY_META[category];
  const products = getProductsByCategory(category);
  const guide = CATEGORY_GUIDE[category];
  const intro = CATEGORY_INTRO[category] ?? [];
  const faqs = CATEGORY_FAQS[category] ?? [];
  // Salt and test tablets remove nothing, so a contaminant-removal table would be
  // a grid of crosses.
  const showComparison = category !== "testing_kit" && category !== "softener_salt";

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Filters", url: "https://www.tapwater.uk/filters" },
          {
            name: meta.title,
            url: `https://www.tapwater.uk/filters/${meta.slug}`,
          },
        ]}
      />
      {faqs.length > 0 && <FAQSchema faqs={faqs} />}

      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        {/* Breadcrumb nav */}
        <nav className="flex items-center gap-1.5 text-xs text-faint mb-8">
          <Link href="/" className="hover:text-accent transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link
            href="/filters"
            className="hover:text-accent transition-colors"
          >
            Filters
          </Link>
          <span>/</span>
          <span className="text-muted">{meta.title}</span>
        </nav>

        {/* Header */}
        <h1 className="font-display text-3xl sm:text-4xl text-ink italic tracking-tight">
          {meta.title}
        </h1>
        <p className="text-body mt-3 max-w-2xl text-lg">{meta.description}</p>
        <p className="text-sm text-muted mt-2">
          Best for: {meta.bestFor} &middot; {meta.priceRange}
        </p>

        {/* Guide link */}
        {guide && (
          <Link
            href={guide.href}
            className="inline-flex items-center gap-1.5 mt-4 text-sm text-accent hover:underline"
          >
            Read our full guide: {guide.title}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}

        {/* Long intro (only categories that define one) */}
        {intro.length > 0 && (
          <div className="mt-6 space-y-4 max-w-2xl">
            {intro.map((paragraph) => (
              <p key={paragraph.slice(0, 40)} className="text-base text-body leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        )}

        {/* Postcode search */}
        <div className="mt-8 p-5 bg-wash rounded-xl">
          <p className="text-sm text-body font-medium mb-3">
            Not sure which to pick? Check your water first.
          </p>
          <div className="max-w-md">
            <PostcodeSearch />
          </div>
        </div>

        {/* Product cards */}
        <div className="mt-10 grid gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Comparison table */}
        {showComparison && products.length > 1 && (
          <section className="mt-12">
            <h2 className="font-display text-xl text-ink italic mb-4">
              Side-by-side comparison
            </h2>
            <ProductComparisonTable
              pageType="category"
              campaign={`category-${slug}`}
              products={products}
            />
          </section>
        )}

        {/* FAQs */}
        {faqs.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-xl text-ink italic mb-6">
              Common questions
            </h2>
            <dl className="space-y-6">
              {faqs.map((faq) => (
                <div key={faq.question}>
                  <dt className="text-ink font-medium">{faq.question}</dt>
                  <dd className="text-body mt-1.5 text-sm">{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* Affiliate disclosure */}
        <p className="text-xs text-faint mt-12">
          We may earn a commission when you buy through our links, at no extra
          cost to you. Recommendations are based on water quality data, not
          sponsorship.{" "}
          <Link
            href="/affiliate-disclosure"
            className="text-accent hover:underline"
          >
            Affiliate disclosure
          </Link>
        </p>
      </div>
    </>
  );
}
