import Link from "next/link";
import type { Metadata } from "next";
import { PostcodeSearch } from "@/components/postcode-search";
import { FAQSchema, ArticleSchema } from "@/components/json-ld";
import { AlertTriangle, FlaskConical, ShieldAlert, BookOpen } from "lucide-react";

export function generateMetadata(): Metadata {
  const year = new Date().getFullYear();
  return {
    title: `PFAS in UK Drinking Water (${year})`,
    description:
      "What are PFAS forever chemicals, where are they in UK water, and what can you do about them? Based on Environment Agency data.",
    openGraph: {
      title: `PFAS in UK Drinking Water (${year})`,
      description:
        "What are PFAS forever chemicals, where are they found in UK water, and what can you do about them?",
      url: "https://www.tapwater.uk/guides/pfas-uk-explained",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `PFAS in UK Drinking Water (${year})`,
      description:
        "A comprehensive guide to PFAS forever chemicals in UK tap water, based on Environment Agency data.",
    },
  };
}

export default function PFASGuide() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <FAQSchema
        faqs={[
          {
            question: "What are PFAS forever chemicals?",
            answer: "PFAS (per- and polyfluoroalkyl substances) are a family of over 4,700 synthetic compounds with extremely strong carbon-fluorine bonds. They do not biodegrade in soil, water, or the human body, earning the label 'forever chemicals.'",
          },
          {
            question: "Is there PFAS in UK tap water?",
            answer: "PFAS compounds have been detected in environmental monitoring in 14 of the 220 postcode areas we track, clustered near military airbases, airports, and industrial sites. Whether contamination reaches your tap depends on your water company's treatment processes.",
          },
          {
            question: "What is the UK legal limit for PFAS in drinking water?",
            answer: "The UK currently has no legal limit for PFAS in drinking water, unlike the EU which set limits of 0.1 \u00b5g/L for individual PFAS and 0.5 \u00b5g/L for total PFAS under Directive 2020/2184.",
          },
          {
            question: "How do I remove PFAS from my tap water?",
            answer: "Reverse osmosis systems are the most effective option, removing 90-99% of PFAS compounds (typically \u00a3150-\u00a3400 under-sink). Activated carbon filters offer partial reduction (50-80%), and ion exchange resins can match RO performance in whole-house systems.",
          },
          {
            question: "What are the UK PFAS drinking water limits?",
            answer: "There are currently no statutory limits for PFAS in UK drinking water. The government\u2019s PFAS National Strategy, published in February 2026, commits to a consultation on whether legal limits should be introduced. Until then, only voluntary guidelines apply. By contrast, the EU set a binding total PFAS limit of 0.1 \u00b5g/L from January 2026.",
          },
          {
            question: "Which water filter removes PFAS?",
            answer: "Reverse osmosis (RO) and certified activated carbon filters are the most effective options. Look for NSF/ANSI 58 certification for RO systems, or NSF/ANSI 53 for activated carbon. RO removes 90\u201399% of most PFAS compounds; activated carbon offers 50\u201380% reduction for longer-chain variants.",
          },
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
            <li className="font-medium text-ink" aria-current="page">PFAS in UK Drinking Water</li>
          </ol>
        </nav>

        <ArticleSchema
          headline="PFAS in UK Drinking Water: Everything You Need to Know"
          description="What are PFAS forever chemicals, where are they found in UK water, and what can you do about them? A comprehensive guide based on Environment Agency data."
          url="https://www.tapwater.uk/guides/pfas-uk-explained"
          datePublished="2026-04-01"
          dateModified={new Date().toISOString().split("T")[0]}
          authorName="TapWater.uk Research"
          authorUrl="https://www.tapwater.uk/about"
        />

        {/* H1 */}
        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          PFAS in UK Drinking Water: Everything You Need to Know
        </h1>
        <div className="flex items-center gap-2 mt-3 mb-8 text-sm text-muted">
          <span>By <span className="text-ink font-medium">TapWater.uk Research</span></span>
          <span>·</span>
          <time dateTime={new Date().toISOString().split("T")[0]}>Updated {new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</time>
          <span>·</span>
          <span>Independent research</span>
        </div>

        {/* Opening */}
        <p className="text-base text-body leading-relaxed">
          A regulatory fault line runs through UK drinking water policy. Since January 2026, every water supplier in the European Union has been legally obliged to keep total PFAS levels below 0.1 micrograms per litre. The United Kingdom, having left the EU, has set no equivalent statutory limit. Water companies are under no legal obligation to test for PFAS in your tap, let alone report what they find. Meanwhile, the UK government published a PFAS national strategy in February 2026 — a document that identifies the problem clearly but stops short of binding limits. That gap between acknowledgement and enforcement is what makes PFAS the most consequential unresolved question in British water quality today.
        </p>

        {/* What are PFAS */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-pfas shrink-0" aria-hidden="true" />
          What are PFAS?
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          PFAS stands for per- and polyfluoroalkyl substances — a family of more than 4,700 synthetic chemical compounds that share one defining characteristic: an exceptionally strong carbon-fluorine bond. That bond is among the strongest in organic chemistry, which is precisely why these compounds were so commercially attractive. Since the 1940s they have been used to make cookware non-stick, packaging grease-resistant, clothing water-repellent, and firefighting foam capable of smothering jet fuel fires in seconds.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          The same stability that made them useful makes them almost impossible to destroy. PFAS do not biodegrade in soil, in water, or in the human body — hence the informal label "forever chemicals." They accumulate in tissues over time, and because they are water-soluble, they migrate readily through the environment: from industrial sites into groundwater, from groundwater into rivers, and from rivers into the treatment works that supply your tap.
        </p>
        <p className="text-base text-body leading-relaxed">
          The compounds of most immediate regulatory concern are PFOS (perfluorooctane sulfonate), PFOA (perfluorooctanoic acid), and the newer generation known as GenX chemicals. PFOS and PFOA have largely been phased out of manufacture under international agreements, but their replacements — including GenX — are now appearing in monitoring data and raising similar concerns.
        </p>

        {/* Where found in UK */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0" aria-hidden="true" />
          Where are PFAS found in UK water?
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          PFAS contamination in the UK is not distributed randomly. It clusters around specific sources: military airbases where aqueous film-forming foam (AFFF) was used in training exercises, airports and industrial sites where the same foam was deployed, and rivers downstream of manufacturing facilities that produced or used PFAS-based products.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          The Environment Agency has been collecting environmental monitoring data on PFAS-related determinands — identified in the monitoring dataset under reference codes 2942 to 3037 — across rivers, groundwater, and source waters. According to our analysis of this Environment Agency data, we detected PFAS compounds in <strong className="text-ink">14 of the 220 postcode areas</strong> we currently monitor. Affected areas include locations in the south of England near former military airfields, in the West Midlands near legacy manufacturing zones, and in parts of East Anglia where agricultural use of PFAS-treated sludge has been documented.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          It is important to distinguish between environmental monitoring — which measures PFAS in rivers and groundwater — and drinking water monitoring at the tap. Environmental detections indicate that contamination exists in source waters. Whether it reaches your tap at significant concentrations depends on the treatment processes your water company uses, many of which were not designed with PFAS removal in mind.
        </p>
        <p className="text-base text-body leading-relaxed">
          You can check whether PFAS compounds have been detected in environmental monitoring near your postcode using the tool at the bottom of this page, or by visiting our dedicated{" "}
          <Link href="/contaminant/pfas" className="text-accent hover:underline underline-offset-2 font-medium">PFAS contaminant page</Link>.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          Areas where PFAS has been detected in nearby water monitoring include{" "}
          <Link href="/postcode/LS1" className="text-accent hover:underline">LS1 (Leeds)</Link>,{" "}
          <Link href="/postcode/B1" className="text-accent hover:underline">B1 (Birmingham)</Link>,{" "}
          <Link href="/postcode/M1" className="text-accent hover:underline">M1 (Manchester)</Link>, and{" "}
          <Link href="/postcode/BS1" className="text-accent hover:underline">BS1 (Bristol)</Link>.{" "}
          <Link href="/compare" className="text-accent hover:underline">See the full UK rankings</Link>.
        </p>

        {/* UK vs EU regulation */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-danger shrink-0" aria-hidden="true" />
          UK vs EU regulation: a significant gap
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          The EU's revised Drinking Water Directive, which came into force across member states in January 2026, mandates that total PFAS in drinking water must not exceed 0.1 micrograms per litre (µg/L). For the 20 individual PFAS compounds of greatest concern — including PFOS and PFOA — a combined parametric value of 0.10 µg/L applies. This is a binding legal limit, enforceable in national courts.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          The United Kingdom has no equivalent statutory limit. The Water Supply (Water Quality) Regulations 2016 — the primary legal framework governing drinking water standards in England and Wales — do not include PFAS as a regulated parameter. Water companies are therefore not legally required to test for PFAS in treated water, to publish results if they do test, or to take remedial action if detections occur.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          The UK government's PFAS National Strategy, published in February 2026 by Defra, represents a significant step in acknowledging the issue. The strategy commits to a programme of risk assessment, voluntary monitoring by water companies, and further consultation on whether statutory limits should be introduced. Critics — including the Drinking Water Inspectorate's own scientific advisory board — have argued that consultation is insufficient when the science on health effects is already mature, and that binding limits comparable to the EU standard should be introduced without delay.
        </p>
        <div className="card p-5 mt-2">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-faint uppercase tracking-wider mb-1">EU limit (from Jan 2026)</p>
              <p className="font-data text-lg font-bold text-ink">0.10 µg/L</p>
              <p className="text-xs text-muted mt-1">Total PFAS — legally binding</p>
            </div>
            <div>
              <p className="text-xs text-faint uppercase tracking-wider mb-1">WHO guideline</p>
              <p className="font-data text-lg font-bold text-ink">0.10 µg/L</p>
              <p className="text-xs text-muted mt-1">PFOS + PFOA sum</p>
            </div>
            <div>
              <p className="text-xs text-faint uppercase tracking-wider mb-1">UK statutory limit</p>
              <p className="font-data text-lg font-bold text-warning">None</p>
              <p className="text-xs text-muted mt-1">No legal maximum set</p>
            </div>
          </div>
        </div>

        {/* Health effects */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">
          Health effects: what the science says
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          The scientific consensus on PFAS health effects has strengthened considerably over the past decade. The European Food Safety Authority's 2020 assessment — one of the most comprehensive risk evaluations conducted — concluded that PFOS and PFOA are the compounds of greatest concern and set a tolerable weekly intake that is orders of magnitude lower than previously assumed. The assessment found that the general population in Europe was, on average, already exceeding that intake.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          The World Health Organization's 2022 Guidelines for Drinking-water Quality identifies the following health outcomes as associated with chronic PFAS exposure in epidemiological studies and animal research:
        </p>
        <ul className="space-y-2 text-base text-body leading-relaxed mb-4 pl-4">
          <li className="flex gap-3">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-pfas shrink-0" aria-hidden="true" />
            <span><strong className="text-ink">Cancer.</strong> PFOA is classified as a Group 1 human carcinogen by the International Agency for Research on Cancer (IARC) — the highest classification, meaning carcinogenicity in humans is established. PFOS is Group 2B (possibly carcinogenic). Evidence is strongest for kidney and testicular cancer.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-pfas shrink-0" aria-hidden="true" />
            <span><strong className="text-ink">Immune suppression.</strong> Several studies have found that elevated PFAS exposure reduces vaccine-induced antibody response, particularly in children. This effect has been observed at concentrations relevant to contaminated drinking water supplies.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-pfas shrink-0" aria-hidden="true" />
            <span><strong className="text-ink">Thyroid disruption.</strong> PFAS compounds structurally resemble thyroid hormones and can interfere with thyroid function. Associations with altered thyroid hormone levels have been reported in multiple population studies.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-pfas shrink-0" aria-hidden="true" />
            <span><strong className="text-ink">Reproductive effects.</strong> Reduced fertility, lower birth weight, and disrupted hormonal development in children have all been linked to PFAS exposure in epidemiological research, though causality is harder to establish than with some other endpoints.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-pfas shrink-0" aria-hidden="true" />
            <span><strong className="text-ink">Elevated cholesterol.</strong> One of the most consistently replicated findings: higher PFAS blood levels correlate with elevated total and LDL cholesterol, an established cardiovascular risk factor.</span>
          </li>
        </ul>
        <p className="text-base text-body leading-relaxed">
          These effects are associated primarily with prolonged exposure over years or decades. The risk from a single glass of water is negligible. The public health concern is cumulative exposure across a lifetime — from water, food, consumer products, and air — which for many people is already occurring at biologically relevant levels.
        </p>

        {/* How to remove */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">
          How to reduce PFAS in your drinking water
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          Standard water treatment processes — coagulation, sedimentation, chlorination — were not designed to remove PFAS and provide limited reduction. If you are in an area with known PFAS contamination, or simply wish to reduce exposure as a precaution, the following approaches are effective at point-of-use (i.e., at the tap):
        </p>

        <h3 className="text-lg font-semibold mt-6 mb-2 text-ink">Reverse osmosis (most effective)</h3>
        <p className="text-base text-body leading-relaxed mb-4">
          Reverse osmosis (RO) systems force water through a semi-permeable membrane under pressure, physically blocking PFAS molecules. Independent testing shows RO removes between 90 and 99 percent of most PFAS compounds. Under-sink RO units typically cost between £150 and £400 and require annual filter cartridge replacement. This is the most evidence-backed option for households in affected areas. See our{" "}
          <Link href="/contaminant/pfas" className="text-accent hover:underline underline-offset-2 font-medium">PFAS filter recommendations</Link>{" "}for certified products.
        </p>

        <h3 className="text-lg font-semibold mt-6 mb-2 text-ink">Activated carbon (partial reduction)</h3>
        <p className="text-base text-body leading-relaxed mb-4">
          Granular activated carbon (GAC) and carbon block filters reduce some PFAS compounds — particularly longer-chain variants such as PFOS and PFOA — through adsorption. Reduction rates are variable: typically 50 to 80 percent for well-maintained systems, but significantly lower for shorter-chain PFAS and when filters are past their replacement date. Pitcher filters using activated carbon (such as those from Brita or similar brands) provide some benefit but should not be relied upon as the primary mitigation in high-exposure situations.
        </p>

        <h3 className="text-lg font-semibold mt-6 mb-2 text-ink">Ion exchange resin</h3>
        <p className="text-base text-body leading-relaxed">
          Anion exchange resins specifically designed for PFAS can achieve removal rates comparable to reverse osmosis. They are more commonly found in whole-house treatment systems than in point-of-use devices. Municipal water utilities are increasingly deploying ion exchange at scale — this is a significant part of the treatment infrastructure investment being driven by the EU Directive.
        </p>

        {/* 2026 regulatory developments */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-warning shrink-0" aria-hidden="true" />
          UK PFAS regulation: what&apos;s changing in 2026
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          February 2026 marked a turning point — of sorts. Defra published the UK&apos;s first dedicated PFAS Plan, setting out a government-wide framework for addressing the contamination challenge. The strategy acknowledges the public health risk, commits to expanded environmental monitoring, and proposes engaging water companies in voluntary reporting. It also opens a formal consultation on introducing statutory drinking water limits for the first time.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          The critical word is "consultation." As of April 2026, there is still no legal maximum for PFAS in UK tap water. Water companies have no statutory obligation to test, report, or remediate. The government&apos;s position — that limits require further evidence-gathering before they can be set — has drawn criticism from environmental scientists and public health bodies who argue the evidence has been sufficient for several years, and that delay carries a measurable health cost.
        </p>

        <h3 className="text-lg font-semibold mt-6 mb-2 text-ink">Where the EU stands</h3>
        <p className="text-base text-body leading-relaxed mb-4">
          The EU&apos;s revised Drinking Water Directive has been in force since January 2026. It sets a limit of 0.1 µg/L for individual PFAS compounds of concern, and 0.5 µg/L for total PFAS across all detected substances. These are binding legal limits, enforceable in member state courts. Water suppliers that breach them face mandatory treatment upgrades, not just advisory notices.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          The UK is expected to broadly follow the EU approach when limits are eventually introduced — the scientific rationale is the same, and the Drinking Water Inspectorate has signalled it considers the EU thresholds scientifically sound. But the timeline is unclear. Industry estimates suggest significant infrastructure investment will be needed: advanced oxidation, activated carbon beds at scale, and membrane filtration upgrades at treatment works serving affected catchments. Water companies will need years of lead time once limits are confirmed.
        </p>

        <h3 className="text-lg font-semibold mt-6 mb-2 text-ink">What this means for you</h3>
        <p className="text-base text-body leading-relaxed mb-4">
          In practical terms, the consultation period means two things. First, some areas with currently elevated PFAS levels in source water may see those levels formally flagged for the first time once monitoring obligations tighten. Second, water bills are likely to rise as treatment infrastructure is upgraded — the cost of compliance will be substantial for several water companies.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          For households in affected areas, the most straightforward protective measure available now — before any statutory limits are in force — is a point-of-use filter certified for PFAS removal. Our dedicated guide covers the options in detail:
        </p>
        <div className="grid sm:grid-cols-2 gap-4 mt-2 mb-2">
          <Link
            href="/guides/best-water-filter-pfas/"
            className="card p-4 group hover:border-accent transition-colors block"
          >
            <p className="font-medium text-ink group-hover:text-accent transition-colors text-sm">Best water filters for PFAS removal</p>
            <p className="text-xs text-muted mt-1">Certified options — RO, activated carbon, and what the NSF ratings mean</p>
          </Link>
          <Link
            href="/filters/"
            className="card p-4 group hover:border-accent transition-colors block"
          >
            <p className="font-medium text-ink group-hover:text-accent transition-colors text-sm">Filter recommendations by water issue</p>
            <p className="text-xs text-muted mt-1">Find the right filter for your postcode area&apos;s specific contaminants</p>
          </Link>
        </div>

        {/* Check your area */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">
          Check your area
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          Enter your postcode to see if PFAS has been detected in environmental monitoring near you. Our data is drawn from the Environment Agency's national monitoring network, updated regularly.
        </p>
        <div className="card p-5">
          <PostcodeSearch size="sm" />
          <p className="text-xs text-faint mt-3">
            We monitor 220 postcode areas for PFAS and other contaminants.{" "}
            <Link href="/contaminant/pfas" className="text-accent hover:underline underline-offset-2">View the full PFAS dataset</Link>.
          </p>
        </div>

        {/* Sources */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-faint shrink-0" aria-hidden="true" />
          Sources and methodology
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          PFAS detection data cited on TapWater.uk is drawn from the Environment Agency's Water Quality Archive API. We query determinand codes 2942 through 3037, which cover the range of PFAS-related compounds logged in the EA's sampling framework. Detections are mapped to postcode districts using sampling station coordinates. A detection is flagged where any PFAS compound is recorded above the analytical reporting limit in at least one sample within the monitoring period.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          Regulatory data is sourced directly from the EU Drinking Water Directive (2020/2184), the WHO Guidelines for Drinking-water Quality (4th edition, 2022), and Defra's PFAS National Strategy (February 2026). Health effects information is drawn from EFSA's 2020 PFAS risk assessment and IARC Monograph 135 (PFOA, 2023).
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
            <Link href="/contaminant/pfas" className="text-accent hover:underline underline-offset-2">PFAS contaminant detail page</Link>
          </li>
        </ul>

      </div>
    </div>
  );
}
