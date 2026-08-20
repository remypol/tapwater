import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { PostcodeSearch } from "@/components/postcode-search";
import { ArticleSchema, BreadcrumbSchema, FAQSchema } from "@/components/json-ld";
import { OG_IMAGE } from "@/lib/og";

const year = new Date().getFullYear();

const FAQ_DATA = [
  {
    question: "What is smart water?",
    answer:
      "Smartwater (styled Glaceau Smartwater, owned by Coca-Cola) is vapour-distilled water with electrolytes added back for taste: typically calcium chloride, magnesium chloride, and potassium bicarbonate. The distillation removes everything, the added salts return a clean mineral taste. There is nothing else in it: no sugar, no caffeine, no vitamins in the standard version.",
  },
  {
    question: "Is smart water good for you?",
    answer:
      "It is water, so it hydrates you exactly as water does. The added electrolytes are flavour-level amounts, far below what a sports drink or a normal diet provides, and no independent evidence shows a health benefit over tap or other bottled waters. It is not bad for you either; the honest description is premium-tasting water at a premium price.",
  },
  {
    question: "Does smart water hydrate better than tap water?",
    answer:
      "No. Hydration comes from the water itself, and the electrolyte quantities in smartwater are too small to change fluid absorption meaningfully for everyday drinking. For heavy sweating, an actual electrolyte drink with meaningful sodium does the job smartwater's marketing hints at. For sitting at a desk, tap water performs identically.",
  },
  {
    question: "Is smart water worth the price?",
    answer:
      "As hydration, no: at typical UK retail it costs several hundred times more per litre than tap water, and UK tap water in most areas already contains more calcium and magnesium than smartwater adds back. As a taste preference it is legitimate: distillation gives a consistent, soft taste some people genuinely prefer. A filter jug or reverse osmosis system with remineralisation reproduces much of that character for pennies a litre.",
  },
];

export function generateMetadata(): Metadata {
  return {
    title: "What Is Smart Water, Actually? Marketing vs Chemistry",
    description:
      "What smart water is (vapour-distilled water plus electrolytes for taste), whether it hydrates better, and how its mineral content compares to UK tap water.",
    alternates: {
      canonical: "https://www.tapwater.uk/guides/what-is-smart-water",
    },
    openGraph: {
      images: OG_IMAGE,
      title: "What Is Smart Water, Actually?",
      description:
        "Vapour-distilled water plus electrolytes for taste: the chemistry behind the brand, compared with UK tap water.",
      url: "https://www.tapwater.uk/guides/what-is-smart-water",
      type: "article",
    },
    twitter: {
      images: OG_IMAGE,
      card: "summary_large_image",
      title: "What Is Smart Water, Actually?",
      description:
        "The chemistry behind the brand, compared honestly with UK tap water.",
    },
  };
}

export default function SmartWaterGuide() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Guides", url: "https://www.tapwater.uk/guides" },
          {
            name: "What Is Smart Water?",
            url: "https://www.tapwater.uk/guides/what-is-smart-water",
          },
        ]}
      />
      <ArticleSchema
        headline="What Is Smart Water, Actually?"
        description="What smartwater is chemically, whether it hydrates better than tap water, and how its added mineral content compares with what UK taps already deliver."
        url="https://www.tapwater.uk/guides/what-is-smart-water"
        datePublished="2026-08-20"
        dateModified={new Date().toISOString().split("T")[0]}
        authorName="TapWater.uk Research"
        authorUrl="https://www.tapwater.uk/about"
      />
      <FAQSchema faqs={FAQ_DATA} />

      <div className="max-w-3xl mx-auto">
        <nav className="text-sm text-muted mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-accent transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/guides" className="hover:text-accent transition-colors">
                Guides
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-ink" aria-current="page">
              What Is Smart Water?
            </li>
          </ol>
        </nav>

        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          What is smart water, actually?
        </h1>
        <div className="flex items-center gap-2 mt-3 mb-8 text-sm text-muted">
          <span>
            By <span className="text-ink font-medium">TapWater.uk Research</span>
          </span>
          <span>&middot;</span>
          <span>Published August {year}</span>
        </div>

        <div className="prose-section">
          <p className="text-lg text-body leading-relaxed">
            Strip the branding and smartwater is a two-step recipe: water is
            vapour-distilled, which removes everything dissolved in it, and a
            pinch of electrolytes is added back, calcium chloride, magnesium
            chloride, and potassium bicarbonate, purely for taste. That is the
            whole product. No sugar, no vitamins, no caffeine, and no
            ingredient your tap cannot match.
          </p>
          <p className="text-base text-body leading-relaxed mt-4">
            None of which makes it a scam: distilled-then-remineralised water
            has a genuinely consistent, soft taste, and taste is a fair reason
            to buy a drink. The marketing question is whether the word
            electrolytes buys you better hydration. It does not, and here is
            the honest comparison with what comes out of a UK tap.
          </p>
        </div>

        <h2 className="font-display text-2xl italic text-ink mt-12 mb-4">
          The electrolyte claim, measured
        </h2>
        <p className="text-base text-body leading-relaxed">
          The electrolytes in smartwater are dosed for flavour, not function.
          They amount to a few milligrams of minerals per bottle, a rounding
          error against what food supplies and well below the sodium levels
          that make sports drinks work during heavy sweating. Hydration
          research is unambiguous that for everyday drinking, plain water
          hydrates exactly as well. If you genuinely need electrolyte
          replacement, an actual electrolyte product with meaningful sodium is
          the tool; smartwater is not formulated to be one.
        </p>

        <h2 className="font-display text-2xl italic text-ink mt-12 mb-4">
          Smartwater vs UK tap water
        </h2>
        <p className="text-base text-body leading-relaxed">
          Here is the part the label leaves out: most UK tap water already
          contains more calcium and magnesium than smartwater adds back,
          because much of the country&apos;s supply runs over chalk and
          limestone. Hard-water areas drink water carrying hundreds of
          milligrams of dissolved minerals per litre. The differences that
          remain are chlorine (tap water carries a trace disinfectant residual
          that distillation removes) and consistency (your tap varies by
          region, the bottle never does). Both are taste matters, and both are
          solvable at home: a carbon filter removes the chlorine note, and a{" "}
          <Link href="/guides/best-reverse-osmosis-system-uk" className="text-accent hover:underline">
            reverse osmosis system
          </Link>{" "}
          with a remineralisation stage is, chemically, the smartwater recipe
          running under your sink.
        </p>

        <h2 className="font-display text-2xl italic text-ink mt-12 mb-4">
          What a litre costs
        </h2>
        <p className="text-base text-body leading-relaxed">
          UK mains water costs a fraction of a penny per litre. Bottled
          smartwater at typical retail runs several hundred times that before
          counting the plastic. A{" "}
          <Link href="/guides/best-water-filter-jug-uk" className="text-accent hover:underline">
            filter jug
          </Link>{" "}
          lands at pennies per litre and removes the chlorine taste that sends
          most people to bottled water in the first place. If the soft
          distilled taste is specifically what you like, RO with
          remineralisation gets closest and pays for itself against a bottle
          habit within months.
        </p>

        <div className="mt-10 card-elevated p-8 text-center rounded-2xl">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <Search className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h2 className="font-display text-xl italic text-ink">
            What does your tap already deliver?
          </h2>
          <p className="text-base text-muted mt-2 max-w-md mx-auto">
            Enter your postcode to see the measured mineral content and quality
            of your own supply.
          </p>
          <div className="mt-6 max-w-sm mx-auto">
            <PostcodeSearch />
          </div>
        </div>

        <h2 className="font-display text-2xl italic text-ink mt-14 mb-6">
          Frequently asked questions
        </h2>
        <div className="space-y-6">
          {FAQ_DATA.map((faq) => (
            <div key={faq.question}>
              <h3 className="font-semibold text-ink text-base">{faq.question}</h3>
              <p className="text-sm text-body leading-relaxed mt-2">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>

        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Related reading
        </h2>
        <div className="space-y-2">
          <Link
            href="/guides/tap-water-vs-bottled-water"
            className="flex items-center gap-2 text-sm text-accent hover:underline"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            Tap water vs bottled water
          </Link>
          <Link
            href="/guides/best-reverse-osmosis-system-uk"
            className="flex items-center gap-2 text-sm text-accent hover:underline"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            Best reverse osmosis system UK
          </Link>
          <Link
            href="/guides/water-hardness-map"
            className="flex items-center gap-2 text-sm text-accent hover:underline"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            UK water hardness map
          </Link>
        </div>

        <footer className="mt-12 pb-4 text-sm text-faint leading-relaxed border-t border-rule pt-6">
          <p>
            Last reviewed August {year}. Smartwater is a trademark of its
            respective owner; this is an independent explainer and comparison
            with UK mains water.{" "}
            <Link
              href="/about/methodology"
              className="underline underline-offset-2 hover:text-muted transition-colors"
            >
              Our methodology
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
