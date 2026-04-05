import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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
      question: "Do whole house filters reduce water pressure?",
      answer:
        "Quality whole house filters are designed to maintain flow rates of 15-56 L/min, which is enough for most UK homes. Pressure drops are minimal with properly sized systems.",
    },
    {
      question: "Can I install a whole house filter myself?",
      answer:
        "Whole house filters are installed at the mains inlet and require professional plumbing. This is not a DIY job unless you are a qualified plumber.",
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
};

/* ── static params ────────────────────────────────────────────────────── */

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

  return {
    title: `${meta.title} — Compare ${count} Filters`,
    description: `${meta.description} ${count} products compared with prices, ratings, and contaminant removal data.`,
    alternates: { canonical: `https://tapwater.uk/filters/${meta.slug}/` },
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

  const meta = CATEGORY_META[category];
  const products = getProductsByCategory(category);
  const guide = CATEGORY_GUIDE[category];
  const faqs = CATEGORY_FAQS[category] ?? [];
  const showComparison = category !== "testing_kit";

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://tapwater.uk" },
          { name: "Filters", url: "https://tapwater.uk/filters/" },
          {
            name: meta.title,
            url: `https://tapwater.uk/filters/${meta.slug}/`,
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
            href="/filters/"
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
            <ProductComparisonTable products={products} />
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
