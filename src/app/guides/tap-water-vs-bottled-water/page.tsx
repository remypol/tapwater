import Link from "next/link";
import type { Metadata } from "next";
import { PostcodeSearch } from "@/components/postcode-search";
import { FAQSchema, BreadcrumbSchema, ArticleSchema } from "@/components/json-ld";
import { Scale, ShieldCheck, Leaf, PiggyBank, BookOpen } from "lucide-react";

export function generateMetadata(): Metadata {
  const year = new Date().getFullYear();
  return {
    title: `Tap Water vs Bottled Water: Which Is Safer in the UK? (${year})`,
    description:
      "Is UK tap water safer than bottled water? Compare quality testing, contamination levels, environmental impact, and cost. The evidence may surprise you.",
    openGraph: {
      title: `Tap Water vs Bottled Water: Which Is Safer in the UK? (${year})`,
      description:
        "Is UK tap water safer than bottled water? Compare quality testing, contamination levels, environmental impact, and cost.",
      url: "https://tapwater.uk/guides/tap-water-vs-bottled-water/",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `Tap Water vs Bottled Water: Which Is Safer in the UK? (${year})`,
      description:
        "Compare quality testing, contamination levels, environmental impact, and cost of UK tap water vs bottled water.",
    },
  };
}

export default function TapVsBottledGuide() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <FAQSchema
        faqs={[
          {
            question: "Is UK tap water safe to drink?",
            answer: "Yes. UK tap water is among the safest in the world. It is continuously tested against 48+ regulated parameters by water companies under the supervision of the Drinking Water Inspectorate (DWI). Over 99.96% of tests meet all legal standards.",
          },
          {
            question: "Is bottled water safer than tap water in the UK?",
            answer: "No. UK tap water is tested far more rigorously and frequently than bottled water. Bottled water is regulated under food safety legislation with less frequent testing. Natural mineral water can legally contain higher levels of certain substances — including fluoride and arsenic — than would be permitted in tap water.",
          },
          {
            question: "Does bottled water contain microplastics?",
            answer: "Yes. Studies including research by Orb Media found microplastics in 93% of bottled water brands tested. Bottled water frequently contains more microplastic particles than tap water, likely due to contamination from PET plastic packaging during production and storage.",
          },
          {
            question: "How much money can I save by switching from bottled to tap water?",
            answer: "A household of four drinking 2 litres per person per day from bottled water could spend between £1,460 and £5,840 per year. The same household's entire water bill — covering all domestic use — is approximately £448 per year. A one-off investment in a quality water filter (£30-200) can further improve tap water while saving over a thousand pounds annually.",
          },
        ]}
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://tapwater.uk" },
          { name: "Guides", url: "https://tapwater.uk/guides" },
          { name: "Tap Water vs Bottled Water", url: "https://tapwater.uk/guides/tap-water-vs-bottled-water/" },
        ]}
      />
      <div className="max-w-3xl mx-auto">

        {/* Breadcrumb */}
        <nav className="text-sm text-muted mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5">
            <li><Link href="/" className="hover:text-accent transition-colors">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/guides" className="hover:text-accent transition-colors">Guides</Link></li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-ink" aria-current="page">Tap Water vs Bottled Water</li>
          </ol>
        </nav>

        <ArticleSchema
          headline="Tap Water vs Bottled Water: Which Is Safer in the UK?"
          description="Is UK tap water safer than bottled water? Compare quality testing, contamination levels, environmental impact, and cost. The evidence may surprise you."
          url="https://tapwater.uk/guides/tap-water-vs-bottled-water/"
          datePublished="2026-04-01"
          dateModified={new Date().toISOString().split("T")[0]}
          authorName="Remy"
          authorUrl="https://tapwater.uk/about"
        />

        {/* H1 */}
        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          Tap Water vs Bottled Water: Which Is Safer in the UK?
        </h1>
        <div className="flex items-center gap-2 mt-3 mb-8 text-sm text-muted">
          <span>By <span className="text-ink font-medium">Remy</span></span>
          <span>·</span>
          <time dateTime={new Date().toISOString().split("T")[0]}>Updated {new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</time>
          <span>·</span>
          <span>Independent research</span>
        </div>

        {/* The short answer */}
        <p className="text-base text-body leading-relaxed mb-4">
          The short answer is that UK tap water is tested far more rigorously than bottled water — and by a significant margin. The Drinking Water Inspectorate (DWI) requires water companies to test against 48 or more regulated parameters, continuously, at treatment works, across the distribution network, and at consumer taps. Over 99.96% of those tests meet all legal standards. Bottled water, by contrast, is regulated under food safety legislation by local authorities, with less frequent testing and, in some cases, more lenient allowable limits.
        </p>
        <p className="text-base text-body leading-relaxed">
          Both are safe to drink. But the popular assumption that bottled water is somehow purer or more carefully controlled than tap water is not supported by the evidence. In several important respects, the opposite is true.
        </p>

        {/* Testing standards */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink flex items-center gap-2">
          <Scale className="w-5 h-5 text-indigo-600 shrink-0" aria-hidden="true" />
          Testing standards compared
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          The regulatory frameworks governing tap water and bottled water in the UK are fundamentally different — in scope, frequency, and enforcement:
        </p>

        <div className="card p-5 mt-2 mb-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-faint uppercase tracking-wider mb-3 font-semibold">Tap water</p>
              <ul className="space-y-2 text-sm text-body">
                <li className="flex gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
                  <span>48+ regulated parameters</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
                  <span>Tested at treatment works, distribution, and consumer taps</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
                  <span>Regulated by DWI (specialist body)</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
                  <span>Continuous monitoring, millions of tests/year</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
                  <span>Results publicly available</span>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs text-faint uppercase tracking-wider mb-3 font-semibold">Bottled water</p>
              <ul className="space-y-2 text-sm text-body">
                <li className="flex gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" aria-hidden="true" />
                  <span>Regulated under Food Safety Act 1990</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" aria-hidden="true" />
                  <span>Tested less frequently</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" aria-hidden="true" />
                  <span>Enforced by local authorities</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" aria-hidden="true" />
                  <span>Natural mineral water has separate, looser rules</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" aria-hidden="true" />
                  <span>Results not routinely published</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <p className="text-base text-body leading-relaxed mb-4">
          One point that surprises many people: natural mineral water sold in the UK can legally contain higher concentrations of certain substances than would be allowed in tap water. The fluoride limit for natural mineral water is 5 mg/L, compared to 1.5 mg/L for tap water. The arsenic limit for both is 10 µg/L, but tap water is tested far more frequently for compliance. These are not theoretical differences — they reflect genuinely different regulatory philosophies. Tap water regulation prioritises continuous public health protection; bottled water regulation treats the product more like food, with less intensive oversight.
        </p>

        {/* What about contaminants */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" />
          What about contaminants?
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          Both tap and bottled water can contain trace contaminants. The question is not whether contaminants exist — at sufficiently sensitive detection levels, they always will — but whether they are present at concentrations that matter for health. The contamination profiles are different:
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          <strong className="text-ink">Tap water</strong> may contain trace levels of lead (leaching from older pipes in the distribution network or household plumbing), trihalomethanes (THMs — byproducts of chlorine disinfection), and trace PFAS (forever chemicals that have entered source waters from industrial and military sites). All of these are monitored and regulated. Lead and THMs have binding legal limits; PFAS does not yet, but is subject to increasing scrutiny. You can check the specific contaminant profile for your postcode using the tool at the bottom of this page.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          <strong className="text-ink">Bottled water</strong> carries a different set of concerns. Microplastics are the most prominent: an investigation by Orb Media found microplastic contamination in 93% of bottled water brands tested globally, at concentrations often exceeding those found in tap water. The source is primarily the PET plastic packaging. Antimony, a metalloid used as a catalyst in PET production, has been detected leaching from plastic bottles — particularly when stored at elevated temperatures. Phthalates, which are plasticisers, have also been identified in bottled water at measurable levels.
        </p>
        <p className="text-base text-body leading-relaxed">
          None of this means that either tap or bottled water is dangerous. It means that the marketing narrative — that bottled water is inherently cleaner or purer — is not borne out by the chemistry.
        </p>

        {/* Environmental cost */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink flex items-center gap-2">
          <Leaf className="w-5 h-5 text-green-600 shrink-0" aria-hidden="true" />
          The environmental cost
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          The environmental case against bottled water is unambiguous and well-documented:
        </p>
        <ul className="space-y-2 text-base text-body leading-relaxed mb-4 pl-4">
          <li className="flex gap-3">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" aria-hidden="true" />
            <span><strong className="text-ink">Plastic waste.</strong> The UK consumes approximately 7.7 billion plastic water bottles per year. Only around 45% of those are recycled. The rest end up in landfill, incineration, or the environment — where they break down into the microplastics that contaminate the water supply in the first place.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" aria-hidden="true" />
            <span><strong className="text-ink">Water usage.</strong> Producing one litre of bottled water requires approximately three litres of water in total — accounting for the water used in manufacturing the bottle, the production process, and cooling. This makes bottled water one of the most water-intensive consumer products available.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" aria-hidden="true" />
            <span><strong className="text-ink">Carbon footprint.</strong> The carbon footprint of bottled water is estimated at roughly 300 times that of tap water per litre. This accounts for plastic production (derived from fossil fuels), transportation, refrigeration, and disposal. Tap water is delivered by gravity and pressure through existing infrastructure with minimal energy input per litre.</span>
          </li>
        </ul>

        {/* Financial cost */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink flex items-center gap-2">
          <PiggyBank className="w-5 h-5 text-pink-600 shrink-0" aria-hidden="true" />
          The financial cost
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          The price difference between tap and bottled water is not subtle — it is orders of magnitude:
        </p>

        <div className="card p-5 mt-2 mb-6">
          <div className="grid grid-cols-2 gap-6 text-center">
            <div>
              <p className="text-xs text-faint uppercase tracking-wider mb-1">Tap water (whole household)</p>
              <p className="font-data text-2xl font-bold text-ink">~£448/yr</p>
              <p className="text-xs text-muted mt-1">Average UK water bill, unlimited supply</p>
            </div>
            <div>
              <p className="text-xs text-faint uppercase tracking-wider mb-1">Bottled water (one person)</p>
              <p className="font-data text-2xl font-bold text-ink">£365–1,460/yr</p>
              <p className="text-xs text-muted mt-1">At 2L/day, £0.50–£2.00 per litre</p>
            </div>
          </div>
        </div>

        <p className="text-base text-body leading-relaxed mb-4">
          The average UK household water bill is approximately £1.50 per day — and that covers every tap, shower, toilet, and appliance in the house. Compare that to bottled water at £0.50 to £2.00 per litre: a single person drinking the recommended two litres per day from bottles spends between £365 and £1,460 per year. A household of four could spend between £1,460 and £5,840 per year on bottled water alone — more than ten times their entire water bill.
        </p>
        <p className="text-base text-body leading-relaxed">
          Even premium filtered tap water is dramatically cheaper. A high-quality jug filter costs £20–40 with replacement cartridges at roughly £5 per month. An under-sink reverse osmosis system — the most thorough filtration option available to consumers — costs £150–400 upfront and £30–60 per year in replacement filters. In every scenario, filtered tap water costs a fraction of bottled.
        </p>

        {/* When bottled makes sense */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">
          When bottled water makes sense
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          There are legitimate situations where bottled water is the right choice:
        </p>
        <ul className="space-y-2 text-base text-body leading-relaxed mb-4 pl-4">
          <li className="flex gap-3">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-rule-strong shrink-0" aria-hidden="true" />
            <span><strong className="text-ink">Emergency or boil-water notices.</strong> When your water company issues a boil-water notice due to contamination, bottled water is the safest alternative until the notice is lifted.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-rule-strong shrink-0" aria-hidden="true" />
            <span><strong className="text-ink">Travel to areas with unsafe tap water.</strong> Many countries do not have drinking water infrastructure comparable to the UK's. In those situations, bottled water from a reputable brand is the prudent choice.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-rule-strong shrink-0" aria-hidden="true" />
            <span><strong className="text-ink">Temporary plumbing issues.</strong> If you are dealing with a known lead pipe, recent plumbing work that has disturbed sediment, or a private water supply that has not been tested, bottled water serves as a short-term bridge.</span>
          </li>
        </ul>
        <p className="text-base text-body leading-relaxed">
          Outside these situations, the case for routine bottled water consumption in the UK is difficult to justify on quality, cost, or environmental grounds.
        </p>

        {/* Best of both worlds */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">
          The best of both worlds
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          A quality water filter gives you water that is cleaner than most bottled brands, at a fraction of the cost, with none of the environmental damage. The main options:
        </p>
        <ul className="space-y-2 text-base text-body leading-relaxed mb-4 pl-4">
          <li className="flex gap-3">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" aria-hidden="true" />
            <span><strong className="text-ink">Jug filters</strong> (£20–40, cartridges ~£5/month) — reduce chlorine taste, some heavy metals, and larger microplastic particles. Good for general improvement. Brands like Brita and ZeroWater are widely available.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" aria-hidden="true" />
            <span><strong className="text-ink">Under-sink carbon block filters</strong> (£50–150 installed) — more thorough than jug filters. Remove chlorine, lead, some PFAS, and sediment. Convenient because they filter water on demand at the tap.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" aria-hidden="true" />
            <span><strong className="text-ink">Under-sink reverse osmosis</strong> (£150–400 installed, £30–60/year for filters) — the most effective consumer option. Removes 90%+ of microplastics, PFAS, heavy metals, THMs, and most other contaminants. The highest upfront cost but unmatched performance.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" aria-hidden="true" />
            <span><strong className="text-ink">Whole-house systems</strong> (£500–2,000+) — filter all water entering your home. Useful if you have known issues with your supply or older plumbing. Usually combine sediment, carbon, and sometimes UV filtration.</span>
          </li>
        </ul>

        {/* Check your area */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">
          Check your water quality
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          Enter your postcode to see how your local tap water measures up. Our reports cover the regulated parameters that your water company tests for, drawn from Environment Agency monitoring data.
        </p>
        <div className="card p-5">
          <PostcodeSearch size="sm" />
          <p className="text-xs text-faint mt-3">
            We monitor 220 postcode areas for 48+ parameters.{" "}
            <Link href="/guides" className="text-accent hover:underline underline-offset-2">Browse all guides</Link>.
          </p>
        </div>

        {/* Sources */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-faint shrink-0" aria-hidden="true" />
          Sources and methodology
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          Water quality data is drawn from the Environment Agency's Water Quality Archive API and DWI annual reports. Cost comparisons use the average UK water bill figure published by Water UK (2025/26) and retail bottled water prices surveyed across major UK supermarkets. Environmental data draws on WRAP's UK Plastics Pact progress reports, the Water Footprint Network, and lifecycle analysis published in the journal Resources, Conservation and Recycling. Microplastic findings reference the Orb Media investigation and the WHO's 2022 review of microplastics in drinking water.
        </p>
        <ul className="space-y-2 text-base text-body leading-relaxed">
          <li className="flex gap-2">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-rule-strong shrink-0" aria-hidden="true" />
            <Link href="/about/methodology" className="text-accent hover:underline underline-offset-2">Our full scoring methodology</Link>
          </li>
          <li className="flex gap-2">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-rule-strong shrink-0" aria-hidden="true" />
            <Link href="/about/data-sources" className="text-accent hover:underline underline-offset-2">Data sources and update frequency</Link>
          </li>
          <li className="flex gap-2">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-rule-strong shrink-0" aria-hidden="true" />
            <Link href="/guides/microplastics-uk-water" className="text-accent hover:underline underline-offset-2">Related: Microplastics in UK tap water</Link>
          </li>
          <li className="flex gap-2">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-rule-strong shrink-0" aria-hidden="true" />
            <Link href="/guides/pfas-uk-explained" className="text-accent hover:underline underline-offset-2">Related: PFAS forever chemicals in UK water</Link>
          </li>
        </ul>

      </div>
    </div>
  );
}
