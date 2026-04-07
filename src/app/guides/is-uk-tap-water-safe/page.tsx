import Link from "next/link";
import type { Metadata } from "next";
import { PostcodeSearch } from "@/components/postcode-search";
import { FAQSchema, ArticleSchema, BreadcrumbSchema } from "@/components/json-ld";
import { ShieldCheck, Droplets, AlertTriangle, FlaskConical, BookOpen, Info } from "lucide-react";

export function generateMetadata(): Metadata {
  const year = new Date().getFullYear();
  return {
    title: `Is UK Tap Water Safe to Drink? (${year})`,
    description:
      "Is UK tap water safe? Yes — but not perfect. Learn what's in your water, regional differences, and when to consider a filter. Based on official data.",
    openGraph: {
      title: `Is UK Tap Water Safe to Drink? (${year})`,
      description:
        "Everything you need to know about UK tap water safety — contaminants, regulations, regional differences, and practical advice.",
      url: "https://www.tapwater.uk/guides/is-uk-tap-water-safe",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `Is UK Tap Water Safe to Drink? (${year})`,
      description:
        "UK tap water is among the safest globally. But here's what you should actually know.",
    },
  };
}

export default function IsUKTapWaterSafeGuide() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <FAQSchema
        faqs={[
          {
            question: "Is UK tap water safe to drink?",
            answer:
              "Yes. UK tap water is among the safest in the world, regulated by the Drinking Water Inspectorate (DWI) and subject to testing against 40+ parameters. It passes compliance tests 99.96% of the time. That said, 'safe' does not mean 'perfect' — trace levels of some contaminants such as lead, nitrates, and PFAS can be present depending on your area and the age of your home's pipes.",
          },
          {
            question: "Can you drink bathroom tap water in the UK?",
            answer:
              "Generally yes, if your home is connected to the mains supply. The kitchen tap is preferred because it typically runs directly from the rising main. In older properties — particularly pre-1970s houses — bathroom cold taps may be fed from a header tank in the loft. These tanks can accumulate sediment and are not replenished as frequently, so the kitchen tap is the safer choice.",
          },
          {
            question: "Is bottled water safer than tap water in the UK?",
            answer:
              "Not necessarily. UK tap water and bottled water are both tested to strict standards, but tap water is actually tested more frequently — at source, in distribution, and at the tap. Bottled water is tested less regularly and can sit in plastic bottles for months. Beyond safety, bottled water generates roughly 500 times more plastic waste per litre than tap water, and costs up to 1,500 times more.",
          },
          {
            question: "What chemicals are in UK tap water?",
            answer:
              "UK tap water contains chlorine (added as a disinfectant to kill bacteria), calcium and magnesium (naturally occurring hardness minerals), and in some areas fluoride (added deliberately or occurring naturally). It can also contain trace levels of nitrates from agricultural runoff, lead leaching from old pipes, and PFAS 'forever chemicals' depending on your location. All regulated parameters must be within legal limits set by the Water Supply (Water Quality) Regulations 2016.",
          },
          {
            question: "Does UK tap water contain fluoride?",
            answer:
              "Only about 10% of UK homes receive fluoridated water. Fluoridation is mainly concentrated in parts of the West Midlands, North East England, and East Midlands, where it has been added since the 1960s as a public health measure to reduce tooth decay. The rest of England and most of Scotland, Wales, and Northern Ireland has naturally low fluoride levels. The legal limit is 1.5 mg/L.",
          },
          {
            question: "Is London tap water safe?",
            answer:
              "Yes, London tap water is safe and meets all legal standards. It is notably hard water — typically 250 to 350 mg/L CaCO₃ — which affects taste and causes limescale build-up on kettles and appliances, but is not a health risk. In fact, the calcium and magnesium in hard water contribute to daily mineral intake. Some Londoners prefer filtered water for taste reasons.",
          },
        ]}
      />

      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
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
              Is UK Tap Water Safe?
            </li>
          </ol>
        </nav>

        <BreadcrumbSchema
          items={[
            { name: "Home", url: "https://www.tapwater.uk" },
            { name: "Guides", url: "https://www.tapwater.uk/guides" },
            {
              name: "Is UK Tap Water Safe to Drink?",
              url: "https://www.tapwater.uk/guides/is-uk-tap-water-safe",
            },
          ]}
        />

        <ArticleSchema
          headline="Is UK Tap Water Safe to Drink? The Complete Guide"
          description="Is UK tap water safe? Yes — but not perfect. Learn what's in your water, regional differences, and when to consider a filter. Based on official data."
          url="https://www.tapwater.uk/guides/is-uk-tap-water-safe"
          datePublished="2026-04-06"
          dateModified={new Date().toISOString().split("T")[0]}
          authorName="Remy"
          authorUrl="https://www.tapwater.uk/about"
        />

        {/* H1 */}
        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          Is UK Tap Water Safe to Drink? The Complete Guide
        </h1>
        <div className="flex items-center gap-2 mt-3 mb-8 text-sm text-muted">
          <span>
            By <span className="text-ink font-medium">Remy</span>
          </span>
          <span>·</span>
          <time dateTime={new Date().toISOString().split("T")[0]}>
            Updated{" "}
            {new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
          </time>
          <span>·</span>
          <span>Based on official DWI data</span>
        </div>

        {/* TL;DR */}
        <div className="card p-5 mb-8 border-l-4 border-accent">
          <p className="text-sm font-semibold text-ink uppercase tracking-wide mb-2">
            Short answer
          </p>
          <p className="text-base text-body leading-relaxed">
            Yes, UK tap water is among the safest in the world. The Drinking Water Inspectorate
            tests it against 40+ parameters and it passes 99.96% of compliance checks. But
            "safe" does not mean "perfect" — trace contaminants, hard water, and ageing pipes
            mean your specific postcode matters. Read on to understand exactly what is in your
            water.
          </p>
        </div>

        {/* How UK water is regulated */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-accent shrink-0" aria-hidden="true" />
          How UK tap water is regulated
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          In England and Wales, drinking water is overseen by the Drinking Water Inspectorate
          (DWI) — an independent body that scrutinises the performance of the 22 licensed water
          companies. Scotland has its own regulator, Drinking Water Quality Regulator for
          Scotland (DWQR), and Northern Ireland is covered by the Drinking Water Inspectorate
          for Northern Ireland.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          The legal standards are set by the Water Supply (Water Quality) Regulations 2016,
          which establish maximum permitted concentrations for more than 40 parameters — from
          bacteria and heavy metals to pesticides and nitrates. These limits are derived from
          World Health Organization guidelines and, where relevant, former EU standards. Water
          companies are legally required to test water at treatment works, throughout the
          distribution network, and at customers' taps.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          The result is a system that catches problems early. In 2023, UK tap water passed
          99.96% of all compliance tests — a figure that has remained consistently above 99.9%
          for two decades. When failures occur, they are typically short-lived and result in
          public notices from water companies.
        </p>
        <div className="card p-5 mt-2">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-faint uppercase tracking-wider mb-1">
                Parameters tested
              </p>
              <p className="font-data text-lg font-bold text-ink">40+</p>
              <p className="text-xs text-muted mt-1">Bacteria, metals, chemicals</p>
            </div>
            <div>
              <p className="text-xs text-faint uppercase tracking-wider mb-1">
                Compliance rate
              </p>
              <p className="font-data text-lg font-bold text-ink">99.96%</p>
              <p className="text-xs text-muted mt-1">Tests passed in 2023</p>
            </div>
            <div>
              <p className="text-xs text-faint uppercase tracking-wider mb-1">
                Regulatory standard
              </p>
              <p className="font-data text-lg font-bold text-ink">WHO</p>
              <p className="text-xs text-muted mt-1">Guidelines-based limits</p>
            </div>
          </div>
        </div>

        {/* What's actually in your water */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-accent shrink-0" aria-hidden="true" />
          What is actually in your tap water?
        </h2>
        <p className="text-base text-body leading-relaxed mb-6">
          Tap water is not just H₂O. By the time it reaches your glass, it contains a range of
          substances — some deliberately added, some naturally present, and some that arrive as
          unwanted passengers. Here is what each one means for you.
        </p>

        <h3 className="text-lg font-semibold mt-6 mb-2 text-ink">Chlorine</h3>
        <p className="text-base text-body leading-relaxed mb-4">
          Chlorine is added at treatment works to kill bacteria and viruses. It is the reason
          your tap water is safe to drink straight from the tap without boiling. At the low
          concentrations used in UK water (typically 0.1–0.5 mg/L), it poses no health risk. The
          main downside is taste — chlorine gives tap water a slight swimming-pool smell that
          many people find off-putting, particularly in some parts of London and the South East.
          Leaving water in an open jug in the fridge for a few hours removes most of it.
        </p>

        <h3 className="text-lg font-semibold mt-6 mb-2 text-ink">Lead</h3>
        <p className="text-base text-body leading-relaxed mb-4">
          Lead enters drinking water not from treatment works but from old pipes — specifically
          the lead service pipes that connected homes to the mains supply before about 1970, and
          older internal plumbing. The legal limit in the UK is 10 micrograms per litre (µg/L),
          which aligns with WHO guidance. The critical point is that there is no known safe level
          of lead exposure, particularly for children and pregnant women. If your home was built
          before 1970, it may still have lead pipes. Running the cold tap for 30 seconds before
          drinking flushes stagnant water from the pipes and is the simplest precaution. See our{" "}
          <Link
            href="/guides/lead-pipes-uk"
            className="text-accent hover:underline underline-offset-2 font-medium"
          >
            full guide to lead pipes in UK homes
          </Link>
          .
        </p>

        <h3 className="text-lg font-semibold mt-6 mb-2 text-ink">Nitrates</h3>
        <p className="text-base text-body leading-relaxed mb-4">
          Nitrates come primarily from agricultural fertilisers leaching into groundwater and
          rivers. The UK legal limit is 50 mg/L, which matches EU and WHO standards. At levels
          below the limit, nitrates are generally harmless for adults. The main concern is infants
          under six months — high nitrate levels can interfere with oxygen transport in blood,
          causing a condition called methaemoglobinaemia. Areas of intensive farming in East
          Anglia and parts of the Midlands tend to have the highest nitrate readings. Check your{" "}
          <Link
            href="/contaminant/nitrate"
            className="text-accent hover:underline underline-offset-2 font-medium"
          >
            postcode's nitrate levels
          </Link>{" "}
          on TapWater.uk.
        </p>

        <h3 className="text-lg font-semibold mt-6 mb-2 text-ink">PFAS ("forever chemicals")</h3>
        <p className="text-base text-body leading-relaxed mb-4">
          PFAS — per- and polyfluoroalkyl substances — are synthetic compounds that do not
          break down in the environment or the human body. They have been detected in source
          waters near military airfields, airports, and industrial sites across the UK. Unlike the
          EU, which introduced a legal limit of 0.1 µg/L for PFAS in drinking water in January
          2026, the UK currently has no statutory limit. This is the most significant unresolved
          gap in UK water regulation. Read our{" "}
          <Link
            href="/guides/pfas-uk-explained"
            className="text-accent hover:underline underline-offset-2 font-medium"
          >
            full PFAS guide
          </Link>{" "}
          for detail on health effects and how to filter them.
        </p>

        <h3 className="text-lg font-semibold mt-6 mb-2 text-ink">Fluoride</h3>
        <p className="text-base text-body leading-relaxed mb-4">
          About 10% of UK homes receive fluoridated water, mainly in parts of the West Midlands,
          North East England, and East Midlands. Fluoridation was introduced as a public health
          measure to reduce tooth decay in children. The legal limit is 1.5 mg/L. Natural fluoride
          occurs in some groundwater at varying levels. Most of the UK — including Scotland, Wales,
          and most of Northern Ireland — has naturally low fluoride concentrations. See our{" "}
          <Link
            href="/contaminant/fluoride"
            className="text-accent hover:underline underline-offset-2 font-medium"
          >
            fluoride data by area
          </Link>
          .
        </p>

        <h3 className="text-lg font-semibold mt-6 mb-2 text-ink">
          Hardness minerals (calcium and magnesium)
        </h3>
        <p className="text-base text-body leading-relaxed mb-4">
          Water hardness is caused by dissolved calcium and magnesium — minerals that occur
          naturally as water passes through limestone and chalk. Hard water is not a health risk;
          in fact, the minerals it contains contribute to your daily calcium and magnesium intake.
          The main downsides are practical: limescale on kettles and shower heads, and a slight
          chalky taste. The UK{" "}
          <Link
            href="/guides/water-hardness-map"
            className="text-accent hover:underline underline-offset-2 font-medium"
          >
            water hardness map
          </Link>{" "}
          shows the stark divide between the hard South East (where water filters through chalk
          aquifers) and the soft North and West (where it runs off granite moorland).
        </p>

        {/* Regional differences */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink flex items-center gap-2">
          <Droplets className="w-5 h-5 text-accent shrink-0" aria-hidden="true" />
          How water quality varies across the UK
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          "UK tap water" is not a single thing. Water quality varies significantly by region,
          water company, and even by individual postcode. The differences are driven by geology
          (what the water passes through in the ground), catchment type (upland reservoirs vs
          lowland rivers), and the age and condition of local pipe networks.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          <Link href="/city/london/" className="text-accent hover:underline underline-offset-2 font-medium">
            London
          </Link>{" "}
          draws much of its water from the River Thames and River Lee — lowland rivers that pick
          up agricultural runoff from a large catchment area before treatment. The water is hard
          (250–350 mg/L CaCO₃), reliably safe, and occasionally tastes of chlorine. Trihalomethane
          levels (a by-product of chlorinating organic-rich river water) can be higher than in
          upland areas.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          <Link href="/region/scotland/" className="text-accent hover:underline underline-offset-2 font-medium">
            Scotland
          </Link>{" "}
          generally has some of the softest and cleanest water in the UK, sourced largely from
          upland lochs and reservoirs in areas with minimal industrial or agricultural footprint.
          Scottish Water consistently scores well in DWI-equivalent assessments.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          Parts of East Anglia and the East Midlands tend to have higher nitrate readings due to
          intensive arable farming. Areas near former industrial sites or military airfields are
          more likely to show PFAS detections in source water monitoring. Northern and Western
          regions — Cornwall, Wales, the Lake District — tend to have the softest water and
          lowest mineral levels overall.
        </p>
        <p className="text-base text-body leading-relaxed">
          Regional averages only tell part of the story. Postcode-level data is more useful —
          because two postcodes five miles apart can be served by different treatment works with
          meaningfully different profiles. That is why TapWater.uk reports at postcode district
          level. You can{" "}
          <Link href="/compare" className="text-accent hover:underline underline-offset-2 font-medium">
            compare postcodes
          </Link>{" "}
          side by side to see the differences directly.
        </p>

        {/* Tap vs bottled */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">
          Tap water vs bottled water: which is actually better?
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          The widespread belief that bottled water is purer than tap water does not hold up to
          scrutiny. Both are regulated to strict standards in the UK, but the testing regimes
          differ significantly. Water companies test tap water thousands of times a year — at
          source, at treatment works, in the distribution network, and at the tap. Bottled water
          is tested far less frequently, often only at the source spring, and can sit in plastic
          bottles for months before reaching you.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          The environmental and financial costs of bottled water are stark. A litre of UK tap
          water costs approximately 0.1p — a fraction of a penny. A litre of bottled water costs
          50–150p. Over a year, a household drinking bottled water exclusively instead of tap
          water would spend somewhere between £600 and £1,800 extra, for no measurable safety
          benefit. Plastic production for bottled water generates roughly 500 times more
          environmental impact per litre than tap water.
        </p>
        <p className="text-base text-body leading-relaxed">
          If taste or specific contaminants are your concern, a quality{" "}
          <Link href="/filters/" className="text-accent hover:underline underline-offset-2 font-medium">
            water filter
          </Link>{" "}
          addresses both at a fraction of the cost of bottled water. Read our comparison:{" "}
          <Link
            href="/guides/tap-water-vs-bottled-water"
            className="text-accent hover:underline underline-offset-2 font-medium"
          >
            tap water vs bottled water — the full breakdown
          </Link>
          .
        </p>

        {/* Bathroom tap */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink flex items-center gap-2">
          <Info className="w-5 h-5 text-muted shrink-0" aria-hidden="true" />
          Can you drink bathroom tap water?
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          In most UK homes, yes — bathroom cold tap water is safe to drink. Modern properties
          built since the 1970s are typically plumbed so that all cold taps draw directly from the
          mains supply. The water quality is the same as the kitchen tap.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          The exception is older properties — particularly pre-1970s houses — that use a "vented"
          plumbing system where a cold water storage tank (header tank) in the loft feeds
          bathroom taps. This tank stores mains water and distributes it to the bathroom cold tap
          and hot water cylinder. The water in a header tank is not continuously refreshed, can
          accumulate sediment or dust, and is technically not drinking water standard once it
          leaves the mains supply.
        </p>
        <p className="text-base text-body leading-relaxed">
          A simple test: if your bathroom cold tap runs noticeably colder in winter (tank water)
          or has lower pressure than the kitchen tap, you likely have a header tank system. In
          these homes, the kitchen tap — which almost always runs directly from the rising main —
          is the right choice for drinking water.
        </p>

        {/* When to be concerned */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0" aria-hidden="true" />
          When should you be more careful?
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          For the vast majority of people in the UK, tap water from a modern home is safe to
          drink without any additional precautions. There are, however, specific situations where
          extra care is warranted.
        </p>
        <ul className="space-y-4 text-base text-body leading-relaxed mb-4">
          <li className="flex gap-3">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-warning shrink-0" aria-hidden="true" />
            <span>
              <strong className="text-ink">Pre-1970 homes.</strong> If your property was built
              before about 1970, it may have lead service pipes connecting it to the mains, or
              lead solder on internal copper pipes. Lead leaches into water that sits in pipes
              overnight. Running the cold tap for 30 seconds each morning is good practice, and
              if you have young children or are pregnant, it is worth contacting your water company
              to ask about pipe replacement. Read our{" "}
              <Link
                href="/guides/lead-pipes-uk"
                className="text-accent hover:underline underline-offset-2 font-medium"
              >
                lead pipes guide
              </Link>{" "}
              for more detail.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-warning shrink-0" aria-hidden="true" />
            <span>
              <strong className="text-ink">Private water supplies.</strong> Around 1% of the UK
              population uses a private water supply — a borehole, spring, or private well — rather
              than a mains connection. These are not regulated by water companies and do not
              benefit from the same continuous treatment and testing regime. If you are on a
              private supply, you should test your water independently at least once a year and
              after any nearby agricultural or construction activity.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-warning shrink-0" aria-hidden="true" />
            <span>
              <strong className="text-ink">Immunocompromised individuals.</strong> People
              undergoing chemotherapy, those with HIV/AIDS, or others with severely compromised
              immune systems may be advised by their doctor to take extra precautions — such as
              boiling water or using a certified filter — because even the low levels of
              microorganisms present in compliant tap water can pose a risk.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-warning shrink-0" aria-hidden="true" />
            <span>
              <strong className="text-ink">Infant formula preparation.</strong> Tap water is
              safe for making up infant formula, but the NHS recommends using freshly boiled water
              that has cooled to at least 70°C to kill any residual bacteria in the formula powder
              itself, not in the water. In areas with high nitrate levels, some health authorities
              advise using low-nitrate bottled water for infants under six months.
            </span>
          </li>
        </ul>

        {/* What you can do */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">
          What you can do right now
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          The most useful thing you can do is understand what is actually in your water — not
          regional averages, but the specific profile for your postcode. TapWater.uk pulls data
          from the Environment Agency, the DWI, and water company reports to give you a
          postcode-level picture of contaminants, hardness, and quality scores.
        </p>

        <div className="card p-5 mb-6">
          <p className="text-sm font-semibold text-ink mb-3">Check your postcode</p>
          <PostcodeSearch size="sm" />
          <p className="text-xs text-faint mt-3">
            See your water quality score, hardness, and any flagged contaminants.
          </p>
        </div>

        <p className="text-base text-body leading-relaxed mb-4">
          Beyond checking your data, here are the practical steps worth taking:
        </p>
        <ul className="space-y-3 text-base text-body leading-relaxed mb-4">
          <li className="flex gap-3">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-accent shrink-0" aria-hidden="true" />
            <span>
              <strong className="text-ink">Run the cold tap for 30 seconds in the morning</strong>{" "}
              before drinking, especially in older homes. This flushes any water that has been
              sitting in the pipes overnight and may have picked up lead or copper.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-accent shrink-0" aria-hidden="true" />
            <span>
              <strong className="text-ink">Consider a filter if your data flags concerns.</strong>{" "}
              An activated carbon filter addresses chlorine taste and some contaminants. A
              reverse osmosis system is more thorough, removing 90–99% of PFAS, lead, nitrates,
              and other compounds. See our{" "}
              <Link
                href="/filters/"
                className="text-accent hover:underline underline-offset-2 font-medium"
              >
                filter recommendations
              </Link>{" "}
              for what works for which contaminants.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-accent shrink-0" aria-hidden="true" />
            <span>
              <strong className="text-ink">Contact your water company about lead pipes.</strong>{" "}
              Many companies offer free lead pipe replacement from the boundary of your property to
              the mains. This is one of the most impactful improvements you can make if your home
              was built before 1970.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-accent shrink-0" aria-hidden="true" />
            <span>
              <strong className="text-ink">Switch from bottled to filtered tap water.</strong>{" "}
              If you drink bottled water regularly for taste reasons, a filter jug or under-sink
              filter will give you better-tasting water at a fraction of the cost and plastic
              footprint.
            </span>
          </li>
        </ul>

        {/* Sources */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-faint shrink-0" aria-hidden="true" />
          Sources and further reading
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          Data on UK tap water quality is drawn from the Drinking Water Inspectorate's annual
          reports, the Environment Agency's Water Quality Archive, and water company Water Quality
          Reports published under statutory obligations. The 99.96% compliance figure is from the
          DWI's 2023 Drinking Water in England report. Regulatory standards are sourced from the
          Water Supply (Water Quality) Regulations 2016 (SI 2016/614) and the WHO Guidelines for
          Drinking-water Quality (4th edition, 2022).
        </p>
        <ul className="space-y-2 text-base text-body leading-relaxed">
          <li className="flex gap-2">
            <span
              className="mt-2 w-1.5 h-1.5 rounded-full bg-rule-strong shrink-0"
              aria-hidden="true"
            />
            <Link
              href="/about/methodology"
              className="text-accent hover:underline underline-offset-2"
            >
              How TapWater.uk scores water quality
            </Link>
          </li>
          <li className="flex gap-2">
            <span
              className="mt-2 w-1.5 h-1.5 rounded-full bg-rule-strong shrink-0"
              aria-hidden="true"
            />
            <Link
              href="/guides/lead-pipes-uk"
              className="text-accent hover:underline underline-offset-2"
            >
              Lead pipes in UK homes: what you need to know
            </Link>
          </li>
          <li className="flex gap-2">
            <span
              className="mt-2 w-1.5 h-1.5 rounded-full bg-rule-strong shrink-0"
              aria-hidden="true"
            />
            <Link
              href="/guides/pfas-uk-explained"
              className="text-accent hover:underline underline-offset-2"
            >
              PFAS in UK drinking water: the complete guide
            </Link>
          </li>
          <li className="flex gap-2">
            <span
              className="mt-2 w-1.5 h-1.5 rounded-full bg-rule-strong shrink-0"
              aria-hidden="true"
            />
            <Link
              href="/guides/tap-water-vs-bottled-water"
              className="text-accent hover:underline underline-offset-2"
            >
              Tap water vs bottled water: the real comparison
            </Link>
          </li>
          <li className="flex gap-2">
            <span
              className="mt-2 w-1.5 h-1.5 rounded-full bg-rule-strong shrink-0"
              aria-hidden="true"
            />
            <Link
              href="/guides/water-hardness-map"
              className="text-accent hover:underline underline-offset-2"
            >
              UK water hardness map and guide
            </Link>
          </li>
          <li className="flex gap-2">
            <span
              className="mt-2 w-1.5 h-1.5 rounded-full bg-rule-strong shrink-0"
              aria-hidden="true"
            />
            <Link
              href="/about/data-sources"
              className="text-accent hover:underline underline-offset-2"
            >
              Data sources and update frequency
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
