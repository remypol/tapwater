import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { PostcodeSearch } from "@/components/postcode-search";
import { ArticleSchema, BreadcrumbSchema, FAQSchema } from "@/components/json-ld";
import { GeoCitation } from "@/components/geo-citation";
import { OG_IMAGE } from "@/lib/og";

const year = new Date().getFullYear();

const FAQ_DATA = [
  {
    question: "Can you drink rainwater in the UK?",
    answer:
      "Not untreated, and in a country with safe mains water there is rarely a reason to. Rain picks up whatever it lands on: roofs carry bird droppings, moss, and metals from flashing and gutters, and harvested rainwater routinely fails microbiological drinking standards. Research has also measured PFAS in rainwater worldwide at levels above some drinking-water guidelines. Harvested rainwater is excellent for gardens, toilets, and washing machines; treated to drinking standard it is technically possible but rarely worth it in the UK.",
  },
  {
    question: "Is boiled rainwater safe to drink?",
    answer:
      "Boiling kills bacteria, viruses, and parasites, which removes the most acute risk. It does nothing for chemical contamination: metals from the roof, PFAS, and particulates all survive boiling, and boiling actually concentrates dissolved substances slightly as water evaporates. Boiled rainwater is an emergency measure, not a routine drinking source.",
  },
  {
    question: "Is collecting rainwater legal in the UK?",
    answer:
      "Yes. Rainwater harvesting from your own roof is legal and actively encouraged for garden and non-potable household use; water butts and harvesting systems need no permission. The rules only get involved when a harvesting system cross-connects with the mains: plumbing regulations require backflow protection and clear labelling so untreated water can never enter the drinking supply.",
  },
  {
    question: "What would it take to make rainwater drinkable?",
    answer:
      "A first-flush diverter to discard the dirtiest roof runoff, sediment filtration, activated carbon, disinfection (UV or chlorination), and realistically reverse osmosis if PFAS is a concern, plus regular testing. That is a serious treatment train to maintain for water that costs pennies from the tap. For UK households the practical split is: rain for the garden, mains for the glass.",
  },
];

export function generateMetadata(): Metadata {
  return {
    title: "Can You Drink Rainwater? The Honest UK Answer",
    description:
      "Can you drink rainwater in the UK? What harvested rain actually contains, what boiling does and does not fix, the legality, and when treatment makes sense.",
    alternates: {
      canonical: "https://www.tapwater.uk/guides/can-you-drink-rainwater-uk",
    },
    openGraph: {
      images: OG_IMAGE,
      title: "Can You Drink Rainwater? (UK)",
      description:
        "What harvested rainwater contains, what boiling fixes and misses, and when treatment makes sense.",
      url: "https://www.tapwater.uk/guides/can-you-drink-rainwater-uk",
      type: "article",
    },
    twitter: {
      images: OG_IMAGE,
      card: "summary_large_image",
      title: "Can You Drink Rainwater? (UK)",
      description:
        "The honest answer on drinking rainwater in the UK.",
    },
  };
}

export default function RainwaterGuide() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Guides", url: "https://www.tapwater.uk/guides" },
          {
            name: "Can You Drink Rainwater?",
            url: "https://www.tapwater.uk/guides/can-you-drink-rainwater-uk",
          },
        ]}
      />
      <ArticleSchema
        headline="Can You Drink Rainwater? The Honest UK Answer"
        description="What harvested rainwater actually contains, what boiling does and does not fix, the legality of collection, and when treatment to drinking standard makes sense."
        url="https://www.tapwater.uk/guides/can-you-drink-rainwater-uk"
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
              Can You Drink Rainwater?
            </li>
          </ol>
        </nav>

        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          Can you drink rainwater?
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
            Untreated: no. Rain is close to distilled when it condenses, but by
            the time it reaches your water butt it has washed the sky and your
            roof. Collected rainwater routinely carries bacteria from bird
            droppings, metals from flashing and gutters, moss, and airborne
            pollutants, and it fails drinking-water standards far more often
            than it passes.
          </p>
          <p className="text-base text-body leading-relaxed mt-4">
            There is also a newer problem no amount of roof hygiene fixes:
            researchers have measured PFAS, the forever chemicals, in rainwater
            around the world at levels above some drinking-water guidelines.
            That does not make a splash of rain dangerous; it does mean
            rainwater is not the pristine source it is often imagined to be.
          </p>
        </div>

        <GeoCitation
          headline={`Untreated rainwater is not safe to drink in the UK, according to TapWater.uk's review of harvesting guidance: roof contamination and PFAS both survive boiling.`}
          detail={`For gardens, toilets, and washing machines it is excellent; for the glass, treated mains water remains the sensible source.`}
        />

        <h2 className="font-display text-2xl italic text-ink mt-12 mb-4">
          What rain picks up on the way to your glass
        </h2>
        <p className="text-base text-body leading-relaxed">
          Three stages, three sets of contaminants. Falling through the air it
          collects dust, spores, and dissolved pollutants including PFAS. On
          the roof it gains the microbiological load: droppings, decaying
          leaves, moss, and insects, plus metals where it crosses lead
          flashing, zinc gutters, or bitumen felt. In the tank, anything that
          arrived alive multiplies, which is why stored rainwater grows more
          contaminated the longer it sits, especially in warm weather.
        </p>

        <h2 className="font-display text-2xl italic text-ink mt-12 mb-4">
          What rainwater is genuinely good for
        </h2>
        <p className="text-base text-body leading-relaxed">
          Almost everything except drinking. Gardens prefer it to softened or
          chlorinated mains water. Toilets, washing machines, and car washing
          run happily on it, and a harvesting system doing those jobs can cut
          a household&apos;s mains use by a third or more. UK plumbing rules ask
          only that harvested water stays physically separated from the
          drinking supply with backflow protection and labelled pipes, so an
          error can never send tank water to the kitchen tap.
        </p>

        <h2 className="font-display text-2xl italic text-ink mt-12 mb-4">
          Treating it to drinking standard: possible, rarely sensible
        </h2>
        <p className="text-base text-body leading-relaxed">
          Off-grid households do it with a full treatment train: first-flush
          diversion, sediment and carbon filtration, UV disinfection, and
          reverse osmosis where PFAS or metals are a concern, backed by
          periodic lab testing. Each stage needs maintenance, and skipping any
          of it reintroduces the risk. With safe mains water available for
          pennies, the honest UK answer is that treated rainwater is a
          resilience hobby, not a saving. If contaminant removal is what
          interests you, our{" "}
          <Link href="/guides/best-reverse-osmosis-system-uk" className="text-accent hover:underline">
            reverse osmosis guide
          </Link>{" "}
          applies the same technology to the water you already have.
        </p>

        <div className="mt-10 card-elevated p-8 text-center rounded-2xl">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <Search className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h2 className="font-display text-xl italic text-ink">
            Wondering about the water you already drink?
          </h2>
          <p className="text-base text-muted mt-2 max-w-md mx-auto">
            Enter your postcode to see the measured quality of your mains
            supply, including any flagged contaminants.
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
            href="/guides/pfas-uk-explained"
            className="flex items-center gap-2 text-sm text-accent hover:underline"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            PFAS in UK drinking water
          </Link>
          <Link
            href="/guides/is-uk-tap-water-safe"
            className="flex items-center gap-2 text-sm text-accent hover:underline"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            Is UK tap water safe?
          </Link>
          <Link
            href="/guides/how-to-test-your-water"
            className="flex items-center gap-2 text-sm text-accent hover:underline"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            How to test your water
          </Link>
        </div>

        <footer className="mt-12 pb-4 text-sm text-faint leading-relaxed border-t border-rule pt-6">
          <p>
            Last reviewed August {year}. General guidance; harvested rainwater
            systems should follow UK water regulations on backflow prevention
            and pipe labelling.{" "}
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
