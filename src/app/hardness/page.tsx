import type { Metadata } from "next"
import Link from "next/link"
import { PostcodeSearch } from "@/components/postcode-search"
import { FAQSchema, BreadcrumbSchema, ArticleSchema } from "@/components/json-ld"

export function generateMetadata(): Metadata {
  const year = new Date().getFullYear()
  return {
    title: `Water Hardness Checker: Is Your Water Hard or Soft? (${year})`,
    description:
      "Check your water hardness by postcode. Find out if you have hard or soft water, what it means for your home, and whether you need a water softener or filter.",
    openGraph: {
      title: `Water Hardness Checker: Is Your Water Hard or Soft? (${year})`,
      description:
        "Check your water hardness by postcode. Understand what causes hard water and what you can do about it.",
      url: "https://www.tapwater.uk/hardness",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `Water Hardness Checker (${year})`,
      description: "Is your water hard or soft? Check by postcode and find out what it means.",
    },
  }
}

export default function WaterHardnessCheckerPage() {
  const year = new Date().getFullYear()
  const dateModified = new Date().toISOString().split("T")[0]

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-14">
      <FAQSchema
        faqs={[
          {
            question: "Is my water hard or soft?",
            answer:
              "Enter your postcode on TapWater.uk to check. Generally, London and the South East has the hardest water (250\u2013350\u00a0mg/L), while Scotland, Wales, and the North West have softer water (under 100\u00a0mg/L).",
          },
          {
            question: "What causes hard water?",
            answer:
              "Hard water is caused by dissolved calcium and magnesium minerals, picked up as rainwater filters through chalk and limestone rock. Areas built on granite (Scotland, Wales) have naturally soft water.",
          },
          {
            question: "Is hard water bad for you?",
            answer:
              "No. Hard water is not harmful to health \u2014 the calcium and magnesium may actually be beneficial. However, it causes limescale buildup in pipes, kettles, and appliances.",
          },
          {
            question: "Do I need a water softener?",
            answer:
              "If your hardness is above 200\u00a0mg/L and you\u2019re experiencing limescale problems, a softener can help. They cost \u00a3500\u2013\u00a31,500 installed and require regular salt top-ups.",
          },
          {
            question: "What is the hardness scale?",
            answer:
              "Soft: 0\u201360\u00a0mg/L, Moderately soft: 60\u2013120\u00a0mg/L, Moderately hard: 120\u2013180\u00a0mg/L, Hard: 180\u2013250\u00a0mg/L, Very hard: 250+\u00a0mg/L (all as CaCO\u2083).",
          },
          {
            question: "Does a water filter remove hardness?",
            answer:
              "Standard filter jugs don\u2019t significantly reduce hardness. For hardness reduction, you need an ion exchange water softener or a reverse osmosis system.",
          },
        ]}
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Water Hardness Checker", url: "https://www.tapwater.uk/hardness" },
        ]}
      />

      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted mb-8">
          <Link href="/" className="hover:text-ink transition-colors">Home</Link>
          <span>/</span>
          <span className="text-body">Water Hardness Checker</span>
        </nav>

        <ArticleSchema
          headline={`Water Hardness Checker: Is Your Water Hard or Soft? (${year})`}
          description="Check your water hardness by postcode. Find out if you have hard or soft water, what it means for your home, and whether you need a water softener or filter."
          url="https://www.tapwater.uk/hardness"
          datePublished="2026-04-06"
          dateModified={dateModified}
          authorName="Remy"
          authorUrl="https://www.tapwater.uk/about"
        />

        <h1 className="font-display text-3xl lg:text-4xl italic text-ink mb-4 leading-tight">
          Water Hardness Checker: Is Your Water Hard or Soft? ({year})
        </h1>
        <div className="flex items-center gap-2 mt-3 mb-8 text-sm text-muted">
          <span>By <span className="text-ink font-medium">Remy</span></span>
          <span>·</span>
          <time dateTime={dateModified}>Updated {new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</time>
          <span>·</span>
          <span>Independent research</span>
        </div>

        {/* Hero postcode search */}
        <div className="bg-surface border border-edge rounded-lg p-6 mb-10">
          <p className="text-base text-body leading-relaxed mb-4">
            Enter your postcode to see the exact hardness reading for your supply zone, pulled
            from your water company&apos;s published compliance data.
          </p>
          <PostcodeSearch size="lg" />
        </div>

        <p className="text-base text-body leading-relaxed mb-4">
          Whether you&apos;ve noticed white deposits on your kettle, soap that won&apos;t lather, or
          a boiler that needs descaling more often than it should &mdash; water hardness is
          almost certainly the explanation. The UK has one of the widest hardness ranges of
          any country in Europe: from some of the softest water in Scotland and Wales to
          some of the hardest supplies in London and East Anglia, all from the same national
          infrastructure.
        </p>
        <p className="text-base text-body leading-relaxed mb-8">
          Hardness is measured in milligrams per litre of calcium carbonate equivalent
          (mg/L CaCO<sub>3</sub>). It is a regulated parameter that every water company
          monitors and reports to the Drinking Water Inspectorate, which is why we can
          show you an accurate reading for your specific postcode.
        </p>

        {/* Hardness Scale */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">The hardness scale</h2>
        <p className="text-base text-body leading-relaxed mb-6">
          UK water companies use the following classification. Each band reflects both
          the mineral content of the water and the practical effects you&apos;re likely to notice.
        </p>

        <div className="space-y-3 mb-8">
          <div className="flex items-start gap-4 p-4 rounded-lg border border-edge bg-surface">
            <div className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0 bg-blue-400" />
            <div>
              <div className="font-sans font-semibold text-ink text-sm">Soft &mdash; 0 to 60 mg/L</div>
              <p className="text-sm text-body mt-0.5">
                Scotland, Wales, and most of northwest England. Minimal limescale. Soap lathers easily.
                No descaling needed. Some very soft supplies can be slightly more corrosive on old pipes.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-lg border border-edge bg-surface">
            <div className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0 bg-sky-400" />
            <div>
              <div className="font-sans font-semibold text-ink text-sm">Moderately soft &mdash; 60 to 120 mg/L</div>
              <p className="text-sm text-body mt-0.5">
                Parts of the North East, some of Yorkshire and the South West. Light limescale
                deposits may form over time. Standard maintenance is usually enough.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-lg border border-edge bg-surface">
            <div className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0 bg-yellow-400" />
            <div>
              <div className="font-sans font-semibold text-ink text-sm">Moderately hard &mdash; 120 to 180 mg/L</div>
              <p className="text-sm text-body mt-0.5">
                Much of the Midlands and parts of the South West. Visible limescale in kettles
                and on shower screens. Regular descaling is advisable.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-lg border border-edge bg-surface">
            <div className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0 bg-orange-400" />
            <div>
              <div className="font-sans font-semibold text-ink text-sm">Hard &mdash; 180 to 250 mg/L</div>
              <p className="text-sm text-body mt-0.5">
                Much of the Midlands, parts of Yorkshire and the Home Counties. Limescale builds
                quickly on heating elements. Appliance lifespans are noticeably reduced.
                Dishwasher salt is essential.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-lg border border-edge bg-surface">
            <div className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0 bg-red-500" />
            <div>
              <div className="font-sans font-semibold text-ink text-sm">Very hard &mdash; 250 mg/L and above</div>
              <p className="text-sm text-body mt-0.5">
                London, the Thames Valley, East Anglia, and parts of Kent. Some areas exceed
                400 mg/L. Serious limescale damage to boilers and appliances. A water softener
                gives a meaningful return on investment here.
              </p>
            </div>
          </div>
        </div>

        {/* What causes hard water */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">What causes hard water?</h2>
        <p className="text-base text-body leading-relaxed mb-4">
          Rainwater starts out soft and slightly acidic. As it soaks into the ground and
          makes its way through soil and rock, it picks up whatever minerals it encounters.
          In southeast England, East Anglia, and much of the Midlands, the underground
          rock is chalk and limestone &mdash; both composed largely of calcium carbonate.
          Slightly acidic rainwater dissolves these rocks over time, loading the groundwater
          with calcium and magnesium ions before it reaches an aquifer or reservoir.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          Scotland, Wales, and northwest England sit on much older, harder geology: granite,
          gneiss, and other igneous or metamorphic rocks that resist dissolution. Water
          flowing over granite picks up almost no mineral content, emerging as naturally soft
          water. The Lake District, Snowdonia, and the Scottish Highlands all have this character.
          Cornwall, despite being in the far southwest, also produces soft water for the same reason.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          The upshot is that hardness in the UK maps almost directly onto the geological map.
          If you live over chalk downland, your water will be hard. If you live over old upland
          granite, it will be soft. Mixed geology &mdash; like parts of Yorkshire and the Midlands
          &mdash; produces a blend depending on how much groundwater versus surface reservoir water
          goes into the supply.
        </p>

        {/* Effects of hard water */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">What does hard water actually do?</h2>
        <p className="text-base text-body leading-relaxed mb-4">
          Hard water is not a health risk. The calcium and magnesium it contains contribute to
          your dietary mineral intake, and the World Health Organisation does not set any
          health-based guideline limit for hardness. Some studies have found associations
          between hard water and slightly lower cardiovascular risk, though the evidence
          is not strong enough to have changed public health advice.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          Where hard water matters is in your home. When hard water is heated, or when it
          evaporates, the dissolved calcium carbonate comes back out of solution and deposits
          as limescale &mdash; the white or off-white crust on heating elements, inside kettles,
          around taps, and on shower screens. Scale on a heating element acts as an insulator:
          even 1.6mm of buildup increases energy consumption by around 12%, according to
          research by the Water Quality Research Foundation. Over years, this adds meaningfully
          to energy bills and shortens appliance life.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          Other effects include: soap and shampoo that lather less effectively (calcium ions
          react with fatty acids in soap to form scum rather than foam), laundry needing
          more detergent for the same result, and shower screens and taps that need frequent
          cleaning. Some people with sensitive skin find very hard water aggravates dryness,
          though the science on this is mixed.
        </p>

        {/* How to deal with hard water */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">How to deal with hard water</h2>
        <p className="text-base text-body leading-relaxed mb-4">
          The right solution depends on your hardness level and what you actually want to fix.
        </p>

        <div className="space-y-4 mb-6">
          <div className="card p-5">
            <h3 className="font-sans font-semibold text-ink mb-2">Water softener (whole-house)</h3>
            <p className="text-base text-body leading-relaxed mb-2">
              An ion exchange softener is the most effective solution. It replaces calcium and
              magnesium ions with sodium ions, producing genuinely soft water throughout the
              house. Units cost £500&ndash;£1,500 installed, with ongoing costs of roughly
              £5&ndash;£10 per month for salt. Life expectancy is 15&ndash;20 years.
            </p>
            <p className="text-sm text-muted">
              Important: softened water should not be used as drinking water from the cold tap
              due to elevated sodium. Keep one unsoftened tap in the kitchen.
            </p>
          </div>

          <div className="card p-5">
            <h3 className="font-sans font-semibold text-ink mb-2">Water filter (drinking water)</h3>
            <p className="text-base text-body leading-relaxed mb-2">
              Standard filter jugs and most under-sink filters do not significantly reduce
              hardness &mdash; they are designed to improve taste by removing chlorine and
              some contaminants. For hardness reduction from a filter, you need a reverse
              osmosis system, which removes virtually all dissolved minerals including
              calcium and magnesium.
            </p>
            <p className="text-sm text-muted">
              <Link href="/filters/" className="underline hover:text-ink transition-colors">Browse water filters</Link>
              {" "}for options suited to your water type.
            </p>
          </div>

          <div className="card p-5">
            <h3 className="font-sans font-semibold text-ink mb-2">Descaling products (maintenance)</h3>
            <p className="text-base text-body leading-relaxed">
              For managing existing limescale without a softener, regular descaling is the
              practical option. Citric acid-based descalers work well on kettles and shower
              heads. Dishwasher salt and correct hardness settings on your dishwasher make
              a significant difference to wash results and machine longevity. This approach
              does nothing to reduce scale formation in your boiler or pipes, but covers
              most day-to-day inconveniences.
            </p>
          </div>
        </div>

        <p className="text-sm text-muted mb-8">
          Read more in our guide:{" "}
          <Link href="/guides/water-hardness-map/" className="underline hover:text-ink transition-colors">
            UK Water Hardness Map &mdash; which areas have the hardest water?
          </Link>
        </p>

        {/* Hardness by region */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">Water hardness by region</h2>
        <p className="text-base text-body leading-relaxed mb-4">
          These are the general ranges based on water company compliance data and DWI reporting.
          Your exact reading may differ &mdash; enter your postcode above for precise figures.
        </p>

        <div className="space-y-3 mb-8">
          <div className="flex items-start justify-between gap-4 py-3 border-b border-edge">
            <div>
              <span className="font-sans font-semibold text-ink text-sm">London &amp; Thames Valley</span>
              <span className="text-muted text-sm ml-2">&mdash; Thames Water, Affinity Water</span>
            </div>
            <span className="text-sm font-mono text-body flex-shrink-0">250&ndash;400 mg/L</span>
          </div>
          <div className="flex items-start justify-between gap-4 py-3 border-b border-edge">
            <div>
              <span className="font-sans font-semibold text-ink text-sm">East Anglia &amp; East Midlands</span>
              <span className="text-muted text-sm ml-2">&mdash; Anglian Water</span>
            </div>
            <span className="text-sm font-mono text-body flex-shrink-0">200&ndash;350 mg/L</span>
          </div>
          <div className="flex items-start justify-between gap-4 py-3 border-b border-edge">
            <div>
              <span className="font-sans font-semibold text-ink text-sm">Midlands</span>
              <span className="text-muted text-sm ml-2">&mdash; Severn Trent</span>
            </div>
            <span className="text-sm font-mono text-body flex-shrink-0">180&ndash;280 mg/L</span>
          </div>
          <div className="flex items-start justify-between gap-4 py-3 border-b border-edge">
            <div>
              <span className="font-sans font-semibold text-ink text-sm">Yorkshire</span>
              <span className="text-muted text-sm ml-2">&mdash; Yorkshire Water</span>
            </div>
            <span className="text-sm font-mono text-body flex-shrink-0">80&ndash;200 mg/L</span>
          </div>
          <div className="flex items-start justify-between gap-4 py-3 border-b border-edge">
            <div>
              <span className="font-sans font-semibold text-ink text-sm">Northwest England</span>
              <span className="text-muted text-sm ml-2">&mdash; United Utilities</span>
            </div>
            <span className="text-sm font-mono text-body flex-shrink-0">50&ndash;100 mg/L</span>
          </div>
          <div className="flex items-start justify-between gap-4 py-3 border-b border-edge">
            <div>
              <span className="font-sans font-semibold text-ink text-sm">Wales</span>
              <span className="text-muted text-sm ml-2">&mdash; Dwr Cymru</span>
            </div>
            <span className="text-sm font-mono text-body flex-shrink-0">below 80 mg/L</span>
          </div>
          <div className="flex items-start justify-between gap-4 py-3">
            <div>
              <span className="font-sans font-semibold text-ink text-sm">Scotland</span>
              <span className="text-muted text-sm ml-2">&mdash; Scottish Water</span>
            </div>
            <span className="text-sm font-mono text-body flex-shrink-0">below 60 mg/L</span>
          </div>
        </div>

        <p className="text-sm text-muted mb-8">
          See more:{" "}
          <Link href="/guides/water-hardness-map/" className="underline hover:text-ink transition-colors">
            UK Water Hardness Map by region
          </Link>
        </p>

        {/* CTA */}
        <div className="bg-surface border border-edge rounded-lg p-6 mt-10">
          <h2 className="font-display text-xl italic text-ink mb-3">Check your specific postcode</h2>
          <p className="text-base text-body leading-relaxed mb-4">
            Regional averages only tell part of the story. Enter your postcode to see the
            exact hardness reading for your supply zone, along with all other quality parameters
            tested by your water company.
          </p>
          <PostcodeSearch size="lg" />
        </div>

      </div>
    </div>
  )
}
