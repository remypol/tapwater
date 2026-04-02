import Link from "next/link";
import type { Metadata } from "next";
import { PostcodeSearch } from "@/components/postcode-search";
import { FAQSchema, BreadcrumbSchema, ArticleSchema } from "@/components/json-ld";
import { Microscope, Waves, ShieldQuestion, BookOpen } from "lucide-react";

export function generateMetadata(): Metadata {
  const year = new Date().getFullYear();
  return {
    title: `Microplastics in UK Tap Water: What We Know So Far (${year})`,
    description:
      "Are there microplastics in your tap water? What the research says about microplastic contamination in UK drinking water, health risks, and how to reduce exposure.",
    openGraph: {
      title: `Microplastics in UK Tap Water: What We Know So Far (${year})`,
      description:
        "Are there microplastics in your tap water? What the research says about microplastic contamination in UK drinking water.",
      url: "https://tapwater.uk/guides/microplastics-uk-water/",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `Microplastics in UK Tap Water: What We Know So Far (${year})`,
      description:
        "What the research says about microplastic contamination in UK drinking water, health risks, and how to reduce exposure.",
    },
  };
}

export default function MicroplasticsGuide() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <FAQSchema
        faqs={[
          {
            question: "Are there microplastics in UK tap water?",
            answer: "Yes. A University of Manchester study found microplastics in 72% of UK tap water samples tested. The particles come from a range of sources including plastic bottles, synthetic clothing fibres, and degradation of water pipes.",
          },
          {
            question: "Is there a legal limit for microplastics in UK drinking water?",
            answer: "No. The UK has no legal limit for microplastics in drinking water. The EU Drinking Water Directive (2020/2184) requires monitoring but has not yet set binding limits. The WHO has called for more research but considers current risk levels low.",
          },
          {
            question: "How can I remove microplastics from my tap water?",
            answer: "Reverse osmosis filters are the most effective option, removing over 90% of microplastics. Activated carbon block filters offer moderate reduction. Boiling water does not remove microplastics. Notably, bottled water often contains more microplastics than tap water.",
          },
          {
            question: "Does bottled water have fewer microplastics than tap water?",
            answer: "No. Multiple studies, including a WHO-commissioned review, have found that bottled water frequently contains more microplastic particles than tap water — likely due to contamination from the plastic packaging itself.",
          },
        ]}
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://tapwater.uk" },
          { name: "Guides", url: "https://tapwater.uk/guides" },
          { name: "Microplastics in UK Tap Water", url: "https://tapwater.uk/guides/microplastics-uk-water/" },
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
            <li className="font-medium text-ink" aria-current="page">Microplastics in UK Tap Water</li>
          </ol>
        </nav>

        <ArticleSchema
          headline="Microplastics in UK Tap Water: What We Know So Far"
          description="Are there microplastics in your tap water? What the research says about microplastic contamination in UK drinking water, health risks, and how to reduce exposure."
          url="https://tapwater.uk/guides/microplastics-uk-water/"
          datePublished="2026-04-01"
          dateModified={new Date().toISOString().split("T")[0]}
          authorName="Remy"
          authorUrl="https://tapwater.uk/about"
        />

        {/* H1 */}
        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          Microplastics in UK Tap Water: What We Know So Far
        </h1>
        <div className="flex items-center gap-2 mt-3 mb-8 text-sm text-muted">
          <span>By <span className="text-ink font-medium">Remy</span></span>
          <span>·</span>
          <time dateTime={new Date().toISOString().split("T")[0]}>Updated {new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</time>
          <span>·</span>
          <span>Independent research</span>
        </div>

        {/* The scale of the problem */}
        <p className="text-base text-body leading-relaxed">
          Tiny fragments of plastic are turning up in drinking water everywhere — and the UK is no exception. A University of Manchester study found microplastic particles in 72% of UK tap water samples tested, placing British water supplies squarely within a global pattern that researchers have documented on every continent. Current estimates suggest the average UK adult may ingest more than 100,000 microplastic particles per year from all sources combined: food, water, air, and dust. That figure is uncertain — methodologies vary between studies, and particle counts depend heavily on the detection limit used — but the direction of the evidence is clear. These materials are pervasive, they are in your water, and the science on what that means for human health is still catching up.
        </p>

        {/* What are microplastics */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink flex items-center gap-2">
          <Microscope className="w-5 h-5 text-blue-600 shrink-0" aria-hidden="true" />
          What are microplastics?
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          Microplastics are plastic fragments smaller than 5 millimetres — roughly the size of a sesame seed at the upper end, and invisible to the naked eye at the lower end. Many of the particles found in drinking water are far smaller still, measured in micrometres (thousandths of a millimetre). Researchers distinguish between two categories:
        </p>
        <ul className="space-y-2 text-base text-body leading-relaxed mb-4 pl-4">
          <li className="flex gap-3">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" aria-hidden="true" />
            <span><strong className="text-ink">Primary microplastics</strong> — manufactured to be small. These include microbeads (once common in cosmetics and scrubs before the UK banned them in 2018), nurdles (industrial pellets used as raw material for plastic manufacturing), and synthetic fibres shed from polyester, nylon, and acrylic clothing during washing.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" aria-hidden="true" />
            <span><strong className="text-ink">Secondary microplastics</strong> — fragments broken down from larger plastic items by UV light, weathering, and mechanical abrasion. Plastic bottles, bags, food packaging, and tyre dust on roads all generate secondary microplastics that eventually wash into waterways.</span>
          </li>
        </ul>
        <p className="text-base text-body leading-relaxed">
          The materials most commonly identified in UK water samples include polyethylene (from packaging), polypropylene (bottle caps, food containers), polystyrene, and polyester fibres. These are among the most produced plastics globally, which is why they dominate the contamination profile.
        </p>

        {/* How do microplastics get into tap water */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink flex items-center gap-2">
          <Waves className="w-5 h-5 text-cyan-600 shrink-0" aria-hidden="true" />
          How do microplastics get into tap water?
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          Microplastics reach your tap through several routes, and no single intervention can address all of them:
        </p>
        <ul className="space-y-2 text-base text-body leading-relaxed mb-4 pl-4">
          <li className="flex gap-3">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" aria-hidden="true" />
            <span><strong className="text-ink">Source water contamination.</strong> Rivers and reservoirs that supply treatment works receive microplastics from urban runoff, wastewater treatment plant discharges, agricultural land where plastic-contaminated sewage sludge has been spread, and direct littering. UK rivers are among the most studied in the world for microplastic pollution, and concentrations are consistently measurable.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" aria-hidden="true" />
            <span><strong className="text-ink">Incomplete removal during treatment.</strong> Conventional water treatment — coagulation, flocculation, sedimentation, sand filtration, and chlorination — was not designed to target microplastics. Studies suggest these processes remove a proportion of larger particles but are less effective against particles below 10 micrometres, which are the majority by count.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" aria-hidden="true" />
            <span><strong className="text-ink">The distribution network.</strong> After treatment, water travels through miles of pipes before reaching your tap. Older sections of the UK distribution network include PVC and polyethylene pipes that can shed microplastic particles through degradation over time, particularly where water pressure fluctuates or pipes are ageing.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" aria-hidden="true" />
            <span><strong className="text-ink">Atmospheric deposition.</strong> Microplastic fibres are airborne. They settle from the atmosphere onto open reservoirs and into catchment areas. Research has documented microplastic fallout in rainfall across the UK, meaning even protected water sources receive some contamination from the air.</span>
          </li>
        </ul>

        {/* UK regulation */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink flex items-center gap-2">
          <ShieldQuestion className="w-5 h-5 text-amber-600 shrink-0" aria-hidden="true" />
          Is the UK regulating microplastics in drinking water?
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          In short: no. There is no UK legal limit for microplastics in drinking water. The Drinking Water Inspectorate (DWI), which oversees tap water quality in England and Wales, has not set monitoring requirements for microplastic particles. Microplastics do not appear in the 48 regulated parameters that water companies must test against.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          The World Health Organization published a comprehensive review in 2022 concluding that microplastics in drinking water posed a low risk to human health at current exposure levels — but added a significant caveat: the evidence base was limited, analytical methods were inconsistent across studies, and more research was urgently needed. The WHO stopped short of recommending specific limits, instead calling for standardised monitoring and better data.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          The EU's revised Drinking Water Directive (2020/2184), which came into force across member states in January 2023, takes a different approach. It requires EU countries to develop and implement methodologies for monitoring microplastics in drinking water — but has not yet set binding concentration limits. The monitoring requirement is itself significant: it acknowledges that the problem needs systematic measurement before limits can be set.
        </p>
        <p className="text-base text-body leading-relaxed">
          The UK, having left the EU, is not bound by this directive. As of {new Date().getFullYear()}, there is no published UK government plan to introduce microplastic monitoring requirements for drinking water suppliers. This places the UK behind the EU on a precautionary measure that many public health researchers consider overdue.
        </p>

        <div className="card p-5 mt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-faint uppercase tracking-wider mb-1">EU approach</p>
              <p className="font-data text-lg font-bold text-ink">Monitor</p>
              <p className="text-xs text-muted mt-1">Mandatory monitoring, no limits yet</p>
            </div>
            <div>
              <p className="text-xs text-faint uppercase tracking-wider mb-1">WHO position</p>
              <p className="font-data text-lg font-bold text-ink">Low risk</p>
              <p className="text-xs text-muted mt-1">But more research needed</p>
            </div>
            <div>
              <p className="text-xs text-faint uppercase tracking-wider mb-1">UK requirement</p>
              <p className="font-data text-lg font-bold text-warning">None</p>
              <p className="text-xs text-muted mt-1">No monitoring or limits</p>
            </div>
          </div>
        </div>

        {/* Health risks */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">
          Health risks: what we know and what we don't
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          The honest answer is that the science is still emerging, and anyone who tells you microplastics in drinking water are definitively safe or definitively dangerous is overstating the evidence. What researchers have established so far falls into several categories of concern:
        </p>
        <ul className="space-y-2 text-base text-body leading-relaxed mb-4 pl-4">
          <li className="flex gap-3">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" aria-hidden="true" />
            <span><strong className="text-ink">Physical effects.</strong> Laboratory studies have shown that very small microplastic particles (under 10 micrometres) can cross cell membranes and accumulate in tissues. Whether this occurs at concentrations found in drinking water, and whether it causes measurable harm in humans, remains under investigation. Animal studies have demonstrated inflammatory responses in gut tissue following microplastic exposure.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" aria-hidden="true" />
            <span><strong className="text-ink">Chemical leaching.</strong> Plastics are not inert. They contain additives — plasticisers like phthalates, flame retardants, and UV stabilisers — that can leach into water. Some of these compounds are endocrine disruptors (chemicals that interfere with hormone systems). BPA and phthalates are the most studied examples. There is also evidence that microplastics act as carriers for other environmental contaminants: PFAS, heavy metals, and pesticides can bind to microplastic surfaces and be transported into the body.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" aria-hidden="true" />
            <span><strong className="text-ink">Inflammatory response.</strong> Several peer-reviewed studies have documented increased markers of inflammation in laboratory animals exposed to microplastics at elevated doses. Translating these findings to the concentrations found in UK tap water is not straightforward — laboratory doses are often much higher than real-world exposure — but the biological mechanism is plausible.</span>
          </li>
        </ul>
        <p className="text-base text-body leading-relaxed">
          The WHO's current position is that the risk from microplastics in drinking water at measured levels appears low, but that significant knowledge gaps remain — particularly around the smallest particles (nanoplastics, below 1 micrometre), which are the hardest to detect and potentially the most biologically active. The absence of evidence of harm is not the same as evidence of absence, and the WHO has been explicit about that distinction.
        </p>

        {/* How to reduce exposure */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">
          How to reduce microplastics in your water
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          If you want to reduce your exposure, filtration at the tap is the most practical option. Not all methods are equally effective:
        </p>

        <h3 className="text-lg font-semibold mt-6 mb-2 text-ink">Reverse osmosis (most effective)</h3>
        <p className="text-base text-body leading-relaxed mb-4">
          Reverse osmosis systems force water through a membrane with pores small enough to block microplastic particles. Independent testing shows removal rates above 90% for particles across the size range found in drinking water. Under-sink RO units typically cost between £150 and £400 and require periodic filter replacement. If microplastic exposure is your primary concern, this is the strongest option available to households.
        </p>

        <h3 className="text-lg font-semibold mt-6 mb-2 text-ink">Activated carbon block filters (moderate)</h3>
        <p className="text-base text-body leading-relaxed mb-4">
          Carbon block filters — not to be confused with loose granular carbon — can trap larger microplastic particles through physical filtration. They are less effective than RO at catching the smallest particles, but they are significantly cheaper (£20-80 for jug or tap-mounted systems) and easier to maintain. For most households, a quality carbon block filter represents a reasonable reduction in exposure at an accessible price point.
        </p>

        <h3 className="text-lg font-semibold mt-6 mb-2 text-ink">Boiling (ineffective)</h3>
        <p className="text-base text-body leading-relaxed mb-4">
          Boiling water does not remove microplastics. The particles are heat-resistant at normal boiling temperatures and will remain in the water. Some recent research has suggested that boiling water with calcium carbonate (hard water) may encapsulate microplastic particles, making them easier to filter out, but this is preliminary and not a practical recommendation.
        </p>

        <div className="card p-5 mt-2">
          <p className="text-sm font-semibold text-ink mb-2">A note on bottled water</p>
          <p className="text-sm text-body leading-relaxed">
            Switching to bottled water is not a solution. A WHO-commissioned study and subsequent research by Orb Media found that bottled water frequently contains <strong className="text-ink">more</strong> microplastic particles than tap water — likely due to contamination from the plastic bottle itself during manufacturing, storage, and transport. In one widely cited analysis, 93% of bottled water brands tested contained microplastics.
          </p>
        </div>

        {/* Check your area */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">
          Check your area
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          Enter your postcode to see the overall water quality profile for your area. While microplastics are not yet part of routine UK monitoring, your report will show the contaminants that are tested and how your supply performs against legal limits.
        </p>
        <div className="card p-5">
          <PostcodeSearch size="sm" />
          <p className="text-xs text-faint mt-3">
            We monitor 220 postcode areas across 48+ regulated parameters.{" "}
            <Link href="/guides" className="text-accent hover:underline underline-offset-2">Browse all guides</Link>.
          </p>
        </div>

        {/* Sources */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-faint shrink-0" aria-hidden="true" />
          Sources and further reading
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          The evidence cited in this guide is drawn from peer-reviewed research and official assessments. Key sources include the University of Manchester's microplastic detection study in UK tap water, the WHO's 2022 report on microplastics in drinking water, the EU Drinking Water Directive (2020/2184), and Orb Media's investigation into microplastics in bottled water. Health effects information draws on systematic reviews published in Environmental Science & Technology and the journal Environment International.
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
            <Link href="/guides/pfas-uk-explained" className="text-accent hover:underline underline-offset-2">Related: PFAS forever chemicals in UK water</Link>
          </li>
        </ul>

      </div>
    </div>
  );
}
