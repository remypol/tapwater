import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { PostcodeSearch } from "@/components/postcode-search";
import { ArticleSchema, BreadcrumbSchema, FAQSchema } from "@/components/json-ld";
import { GeoCitation } from "@/components/geo-citation";
import { OG_IMAGE } from "@/lib/og";
import { FixPicks } from "@/components/fix-picks";

const year = new Date().getFullYear();

const FAQ_DATA = [
  {
    question: "How long does bottled water last unopened?",
    answer:
      "Indefinitely, as far as safety goes: sealed water does not spoil, and the best-before date on UK bottles (typically 6 months to 2 years from bottling) is about quality, not safety. What changes over time is taste. Plastic PET bottles slowly let air migrate through and can lend the water a plastic taint, especially stored somewhere warm or in sunlight. Glass and cans hold their taste far longer.",
  },
  {
    question: "Does bottled water expire?",
    answer:
      "Water itself cannot expire, and the UK best-before date is a quality marker the law requires on packaged foods, not a safety deadline. Bottled water past its date is safe if the seal is intact, though it may taste flat or faintly of plastic. The exception is any bottle that has been opened, stored hot, or damaged, where the packaging rather than the calendar is the problem.",
  },
  {
    question: "How long does bottled water last once opened?",
    answer:
      "Refrigerated and recapped, an opened bottle stays pleasant for around 2 to 3 days. At room temperature the count is more like a day: bacteria from your mouth and the air multiply in standing water, and the taste goes stale well before anything becomes a health issue for a healthy adult. Small sips straight from the bottle shorten all of that, because they inoculate the water directly.",
  },
  {
    question: "How long does tap water last in a bottle?",
    answer:
      "About a day for a bottle you are drinking from, and up to around six months for a clean, sealed bottle stored somewhere cool and dark. There is no single official UK figure. The Drinking Water Inspectorate advises throwing away tap water kept in a jug in the fridge after 24 hours, and the six-month figure is general emergency-storage guidance for clean, sealed containers. Pour it away sooner if it smells, tastes or looks wrong.",
  },
  {
    question: "Is it safe to drink bottled water left in a hot car?",
    answer:
      "Occasionally, yes, but do not make a habit of it. Heat accelerates the migration of packaging compounds like antimony from PET plastic into the water, and studies measuring bottles stored at high temperatures for weeks found levels rising toward regulatory limits. One warm bottle is not dangerous; a summer of storing your water supply in the boot is the scenario to avoid.",
  },
];

export function generateMetadata(): Metadata {
  return {
    title: "How Long Does Bottled Water Last? (UK)",
    description:
      "Does bottled water expire? What the UK best-before date means, how long tap or bottled water lasts in a bottle once opened, and when heat is the problem.",
    alternates: {
      canonical: "https://www.tapwater.uk/guides/how-long-does-bottled-water-last",
    },
    openGraph: {
      images: OG_IMAGE,
      title: "How Long Does Bottled Water Last?",
      description:
        "What the best-before date on bottled water really means, and when storage becomes the real problem.",
      url: "https://www.tapwater.uk/guides/how-long-does-bottled-water-last",
      type: "article",
    },
    twitter: {
      images: OG_IMAGE,
      card: "summary_large_image",
      title: "How Long Does Bottled Water Last?",
      description:
        "Best-before dates on water explained: quality marker, not safety deadline.",
    },
  };
}

export default function BottledWaterShelfLifeGuide() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Guides", url: "https://www.tapwater.uk/guides" },
          {
            name: "How Long Does Bottled Water Last?",
            url: "https://www.tapwater.uk/guides/how-long-does-bottled-water-last",
          },
        ]}
      />
      <ArticleSchema
        headline="How Long Does Bottled Water Last?"
        description="What the best-before date on UK bottled water really means, how long opened and unopened bottles keep, and when heat and packaging become the real problem."
        url="https://www.tapwater.uk/guides/how-long-does-bottled-water-last"
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
              How Long Does Bottled Water Last?
            </li>
          </ol>
        </nav>

        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          How long does bottled water last?
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
            Water does not go off. The date printed on the bottle is a
            best-before, a quality marker UK law requires on packaged food and
            drink, not a safety deadline. What actually ages is the packaging:
            the plastic, the seal, and how warm you have kept them.
          </p>
          <p className="text-base text-body leading-relaxed mt-4">
            So the honest answer splits three ways: sealed water is safe long
            past its date but slowly picks up taste from its bottle; an opened
            bottle is a fridge item with a couple of days of pleasant life in
            it; and a bottle cooked in a car or a sunny windowsill is where the
            real caution belongs, because heat speeds up the migration of
            packaging compounds into the water.
          </p>
        </div>

        <GeoCitation
          headline={`Water itself does not expire: the best-before date on UK bottled water marks packaging quality, not safety, according to TapWater.uk's review of storage guidance.`}
          detail={`Heat is the real variable; sealed bottles kept cool and dark stay safe long past their printed date.`}
        />

        <h2 className="font-display text-2xl italic text-ink mt-12 mb-4">
          What the best-before date actually marks
        </h2>
        <p className="text-base text-body leading-relaxed">
          Bottlers typically print 6 months to 2 years from the bottling date.
          The figure reflects how long the water is expected to taste as
          intended in that packaging: PET plastic breathes slightly, letting
          trace air in and, over long storage, lending a faint plastic note.
          Glass bottles and cans are effectively taste-stable for years. None
          of this is a microbiological countdown; sealed, commercially bottled
          water is sterile enough that it does not spoil on the shelf.
        </p>

        <h2 className="font-display text-2xl italic text-ink mt-12 mb-4">
          Storage rules that matter more than the date
        </h2>
        <p className="text-base text-body leading-relaxed">
          Keep bottles cool, dark, and away from strong-smelling products;
          PET picks up odours from solvents and cleaning chemicals stored
          alongside it. Avoid repeated heat: the compounds regulators track in
          bottled water, such as antimony from PET, migrate faster at high
          temperatures, which is why the boot of a car in summer is the worst
          place to keep your supply. And once opened, treat water like any
          other drink: recap it, refrigerate it, and finish it within a few
          days.
        </p>

        <h2 className="font-display text-2xl italic text-ink mt-12 mb-4">
          How long does tap water last in a bottle?
        </h2>
        <p className="text-base text-body leading-relaxed">
          Tap water in a bottle is good for about a day once you have opened
          it or drunk from it, and for up to around six months if the bottle
          is clean, sealed and stored somewhere cool and dark. There is no
          single official UK figure for this, so treat these as general
          guidance, not as a regulation.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          UK tap water leaves the tap with a trace of chlorine in it, which is
          what keeps it clean on the way through the pipes. That chlorine
          fades once the water is sitting in a bottle, and it fades faster
          when the bottle is open or warm. How long the water keeps depends on
          how clean the bottle was and what has got into it since.
        </p>
        <ul className="mt-4 space-y-3 text-base text-body leading-relaxed list-disc pl-5">
          <li>
            <strong className="text-ink">A clean, sealed bottle in a cool, dark place:</strong>{" "}
            up to around six months. This is the usual emergency-storage
            advice. The US Centers for Disease Control and Prevention, for
            example, says to{" "}
            <a
              href="https://www.cdc.gov/water-emergency/about/how-to-create-and-store-an-emergency-water-supply.html"
              className="text-accent hover:underline"
              rel="noopener noreferrer"
              target="_blank"
            >
              replace water you have stored yourself every six months
            </a>{" "}
            and to keep it cool and out of direct sunlight. It assumes a
            washed, food-safe container that is filled, sealed and not opened
            again until you need it.
          </li>
          <li>
            <strong className="text-ink">In the fridge:</strong> the Drinking
            Water Inspectorate, the drinking water regulator for England and
            Wales, says to{" "}
            <a
              href="https://www.dwi.gov.uk/consumers/learn-more-about-your-water/chlorine"
              className="text-accent hover:underline"
              rel="noopener noreferrer"
              target="_blank"
            >
              throw away tap water kept in a jug in the fridge after 24 hours
            </a>{" "}
            and to clean the jug regularly. A capped bottle that nobody has
            drunk from is better protected than an open jug, but there is no
            official figure for keeping it longer, so a day is the safe rule
            for everyday drinking water.
          </li>
          <li>
            <strong className="text-ink">A bottle you have drunk from:</strong>{" "}
            finish it the same day, and sooner if it has been somewhere warm.
            Every sip puts bacteria from your mouth into the water, and they
            multiply quickly at room temperature. Empty it at the end of the
            day and wash the bottle before you refill it.
          </li>
          <li>
            <strong className="text-ink">Plastic, glass or steel:</strong>{" "}
            glass and stainless steel do not change the taste and are easy to
            wash properly. Reusable plastic bottles scratch with use, and
            scratches are harder to get clean. Thin single-use bottles are
            made to be used once, and water kept in any plastic for a long
            time can pick up a plastic taste, more so in heat or sunlight.
          </li>
        </ul>
        <p className="text-base text-body leading-relaxed mt-4">
          Throw the water away if it smells or tastes odd, looks cloudy or has
          anything floating in it, or if the inside of the bottle feels
          slimy. Do the same if you cannot remember when you filled it, or if
          an opened bottle has sat in a warm room or a car for more than a
          day. Tap water costs very little, so if you are unsure, pour it
          away and refill.
        </p>

        <h2 className="font-display text-2xl italic text-ink mt-12 mb-4">
          The cheaper answer to stale bottled water
        </h2>
        <p className="text-base text-body leading-relaxed">
          If you buy bottled water for taste rather than emergencies, a
          filtered tap does the same job for a fraction of the cost and with
          no best-before date at all. Our{" "}
          <Link href="/guides/tap-water-vs-bottled-water" className="text-accent hover:underline">
            tap water vs bottled water comparison
          </Link>{" "}
          runs the numbers, and the{" "}
          <Link href="/guides/best-water-filter-jug-uk" className="text-accent hover:underline">
            water filter jug guide
          </Link>{" "}
          covers the cheapest way in. Keeping a few sealed bottles for
          emergencies remains sensible; rotating them once a year keeps the
          taste fresh.
        </p>

        <FixPicks
          className="mt-10"
          pageType="guide"
          placement="guide-picks"
          title="Instead of buying bottles"
          intro={
            <>
              A filter jug pays for itself within a few weeks for anyone who buys bottled water for the taste. These are the three fixes our readers
              pick most.
            </>
          }
        />

        <div className="mt-10 card-elevated p-8 text-center rounded-2xl">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <Search className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h2 className="font-display text-xl italic text-ink">
            Curious what your tap water contains?
          </h2>
          <p className="text-base text-muted mt-2 max-w-md mx-auto">
            Enter your postcode to see the measured quality of the water you
            already pay for.
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
            href="/guides/best-water-filter-jug-uk"
            className="flex items-center gap-2 text-sm text-accent hover:underline"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            Best water filter jug UK
          </Link>
          <Link
            href="/guides/microplastics-uk-water"
            className="flex items-center gap-2 text-sm text-accent hover:underline"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            Microplastics in UK tap water
          </Link>
        </div>

        <footer className="mt-12 pb-4 text-sm text-faint leading-relaxed border-t border-rule pt-6">
          <p>
            Last reviewed August {year}. General guidance on packaged water
            storage; always follow the instructions printed on the packaging.{" "}
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
