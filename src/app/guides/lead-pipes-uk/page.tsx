import Link from "next/link";
import type { Metadata } from "next";
import { PostcodeSearch } from "@/components/postcode-search";
import { Pipette, AlertTriangle, BookOpen, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "The UK's Lead Pipe Problem: Which Areas Are Most Affected? (2026)",
  description:
    "Millions of UK homes still have lead pipes. Find out how lead gets into tap water, which areas are worst affected, and what you can do to protect your household.",
  openGraph: {
    title: "The UK's Lead Pipe Problem: Which Areas Are Most Affected? (2026)",
    description:
      "Millions of UK homes still have lead pipes. Find out how lead gets into tap water and what you can do.",
    url: "https://tapwater.uk/guides/lead-pipes-uk/",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "The UK's Lead Pipe Problem: Which Areas Are Most Affected? (2026)",
    description:
      "An estimated 6–7 million UK homes still have lead service pipes. Here is what that means for your tap water.",
  },
};

export default function LeadPipesGuide() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="max-w-3xl mx-auto">

        {/* Breadcrumb */}
        <nav className="text-sm text-muted mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5">
            <li><Link href="/" className="hover:text-accent transition-colors">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/guides" className="hover:text-accent transition-colors">Guides</Link></li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-ink" aria-current="page">Lead Pipes in the UK</li>
          </ol>
        </nav>

        {/* H1 */}
        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          The UK&apos;s Lead Pipe Problem: Which Areas Are Most Affected?
        </h1>
        <p className="text-sm text-faint mt-2 mb-8">Updated April 2026</p>

        {/* Opening */}
        <p className="text-base text-body leading-relaxed mb-4">
          An estimated 6 to 7 million homes across the United Kingdom are still connected to the water network via lead service pipes. These are the pipes that run from the water main in the street to the property boundary — and in many older homes, from the boundary into the building itself. They were standard practice in UK housebuilding until the 1970s, when the risks of lead exposure became impossible for regulators to ignore. But replacing them is expensive, logistically complex, and moving slowly: at the current rate of pipe replacement, it will take several decades to eliminate the UK's lead pipe estate entirely.
        </p>
        <p className="text-base text-body leading-relaxed">
          Lead is classified as a Tier 1 health concern in the Drinking Water Inspectorate's risk framework — the highest category, reserved for contaminants with the most serious potential consequences for human health. Unlike PFAS, where the regulatory picture is still evolving, the science on lead is settled: there is no safe level of lead exposure. The question for UK households is not whether lead is dangerous, but whether it is reaching your tap — and what you can do about it.
        </p>

        {/* Why it matters */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-danger shrink-0" aria-hidden="true" />
          Why lead in water matters
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          Lead is a potent neurotoxin. It accumulates in bones and organs over a lifetime and is particularly harmful during developmental stages — in children under six years old and in foetuses during pregnancy. The World Health Organization's position, unchanged for decades, is that no safe level of lead in blood has been identified. Any exposure carries some measurable biological cost; the question is one of degree.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          In children, chronic low-level lead exposure is associated with reduced cognitive development, lower IQ scores, impaired attention and executive function, and increased likelihood of behavioural disorders. These effects are permanent: there is no treatment that reverses neurological damage caused by early-life lead exposure. Even blood lead levels well below the previous intervention thresholds used by UK health authorities are now associated with measurable effects in the scientific literature.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          In adults, long-term lead exposure is linked to hypertension, kidney disease, cardiovascular events, and reproductive problems. These outcomes have been observed at blood lead levels that were, until recently, considered acceptable — which is why regulatory limits have been progressively tightened and why scientists argue they need to go further.
        </p>
        <div className="card p-5 mt-2">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-faint uppercase tracking-wider mb-1">UK legal limit</p>
              <p className="font-data text-lg font-bold text-ink">10 µg/L</p>
              <p className="text-xs text-muted mt-1">Reduced from 25 µg/L in 2013</p>
            </div>
            <div>
              <p className="text-xs text-faint uppercase tracking-wider mb-1">WHO guideline</p>
              <p className="font-data text-lg font-bold text-ink">10 µg/L</p>
              <p className="text-xs text-muted mt-1">Provisional — no safe level</p>
            </div>
            <div>
              <p className="text-xs text-faint uppercase tracking-wider mb-1">EU standard (2036)</p>
              <p className="font-data text-lg font-bold text-safe">5 µg/L</p>
              <p className="text-xs text-muted mt-1">Tightened under 2020 Directive</p>
            </div>
          </div>
        </div>
        <p className="text-base text-body leading-relaxed mt-4">
          The UK reduced its drinking water lead limit from 25 micrograms per litre to 10 in 2013 — a substantial improvement. But it is worth noting that the EU has committed to halving that standard again, to 5 µg/L, by 2036 under the revised Drinking Water Directive. The UK, post-Brexit, is not required to follow suit. Whether it will choose to is currently under review by the Drinking Water Inspectorate.
        </p>

        {/* Which areas most affected */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink flex items-center gap-2">
          <Pipette className="w-5 h-5 text-warning shrink-0" aria-hidden="true" />
          Which areas are most affected?
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          Lead pipe prevalence in the UK follows the geography of Victorian and Edwardian housebuilding. The older the housing stock, the higher the probability of lead infrastructure — both in the service pipe from the street and in the internal plumbing. This makes the problem particularly acute in the large industrial cities that grew rapidly in the second half of the nineteenth century.
        </p>

        <h3 className="text-lg font-semibold mt-6 mb-2 text-ink">Cities with the highest estimated risk</h3>
        <p className="text-base text-body leading-relaxed mb-4">
          London has the largest absolute number of properties with lead plumbing, given its size and the age of its housing stock. Thames Water has estimated that around one million properties in its supply area have lead service pipes. Glasgow and Edinburgh face a similar problem in proportional terms: Scotland's tenement housing boom in the late 1800s left a legacy of lead plumbing that water companies are still working to address. Birmingham and other major Midlands cities, Manchester, Liverpool, and Leeds all have substantial concentrations of pre-1970 housing stock where lead remains a live concern.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          Rural areas built out in the same era are not exempt, but the density of the problem — and therefore the public health impact — is concentrated in urban centres. New-build housing constructed after 1987 (when lead solder was banned for use in water supply systems in the UK) is generally considered free of the lead pipe risk, though properties that were subsequently renovated with non-compliant materials represent a small exception.
        </p>
        <p className="text-base text-body leading-relaxed">
          You can check whether lead has been detected in environmental monitoring near your postcode using the tool at the bottom of this page. Our{" "}
          <Link href="/contaminant/lead" className="text-accent hover:underline font-medium">lead contaminant page</Link>{" "}also shows postcode-level data drawn from Environment Agency and Drinking Water Inspectorate monitoring.
        </p>

        {/* How lead gets into water */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">
          How lead gets into your water
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          Water leaving a modern treatment works contains effectively no lead. The lead that reaches your tap comes from the infrastructure between the works and your glass — specifically from pipes, fittings, and solder that contain lead and that come into direct contact with drinking water.
        </p>

        <h3 className="text-lg font-semibold mt-6 mb-2 text-ink">Lead service pipes</h3>
        <p className="text-base text-body leading-relaxed mb-4">
          The service pipe runs from the water company's main in the street to the property. It has two sections: the communication pipe (owned by the water company, running from the main to the boundary stopcock) and the supply pipe (owned by the property, running from the stopcock into the building). Both sections may be lead in older properties. This matters because water companies can replace only their section of the pipe — if they do so while the internal supply pipe remains lead, the benefit is substantially reduced.
        </p>

        <h3 className="text-lg font-semibold mt-6 mb-2 text-ink">Internal plumbing and lead solder</h3>
        <p className="text-base text-body leading-relaxed mb-4">
          Inside the property, lead can also enter the water supply through older lead-jointed fittings and, historically, through lead solder used to join copper pipes. Lead solder was widely used in UK plumbing until 1987. The amount of lead that leaches from solder joints is generally lower than from full lead pipes, but it adds to the cumulative exposure — particularly for water that has been standing in the pipe overnight or for several hours.
        </p>

        <h3 className="text-lg font-semibold mt-6 mb-2 text-ink">Water chemistry and lead dissolution</h3>
        <p className="text-base text-body leading-relaxed">
          The rate at which lead dissolves from pipes into water depends significantly on water chemistry. Soft, slightly acidic water — typical in upland areas of Wales, Scotland, and parts of northern England where rainfall percolates through non-calcareous geology — is more aggressive at dissolving lead. Hard water, by contrast, deposits a thin calcium carbonate film on the inside of pipes that acts as a partial barrier. This is why lead problems tend to be somewhat more acute in soft-water regions, even when the pipe infrastructure is of comparable age.
        </p>

        {/* What water companies are doing */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">
          What your water company is doing
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          All major UK water companies have programmes to address lead in drinking water, operating across two main approaches:
        </p>

        <h3 className="text-lg font-semibold mt-6 mb-2 text-ink">Orthophosphate dosing</h3>
        <p className="text-base text-body leading-relaxed mb-4">
          The most immediate and widespread intervention is the addition of orthophosphate — a phosphate compound — to treated water before it enters the distribution network. Orthophosphate reacts with lead in pipe surfaces to form an insoluble lead phosphate coating, significantly reducing the rate at which lead dissolves into the water. Most water companies supplying areas with significant lead pipe infrastructure dose their water with orthophosphate. It is effective: studies suggest it can reduce lead concentrations at the tap by 50 to 80 percent compared to untreated supplies.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          However, orthophosphate dosing is not a solution — it is a mitigation. It reduces the problem substantially but does not eliminate it, and its effectiveness depends on maintaining appropriate concentrations throughout the distribution network. The only permanent fix is pipe replacement.
        </p>

        <h3 className="text-lg font-semibold mt-6 mb-2 text-ink">Pipe replacement programmes</h3>
        <p className="text-base text-body leading-relaxed">
          Water companies are investing in replacing lead communication pipes — the sections they own. Progress has been steady but slow relative to the scale of the problem. Ofwat, the water industry regulator, has set targets for lead pipe replacement as part of companies' five-year business plan commitments (known as AMP7 and AMP8 periods). At current rates of replacement across the industry, the elimination of lead service pipes will take several decades. The constraint is not primarily financial: it is the challenge of coordinating replacement of the water company's section of the pipe with simultaneous replacement of the customer's internal supply pipe — a piece of work that requires engagement with individual property owners and, in the case of rented properties, landlords.
        </p>

        {/* What you can do */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-safe shrink-0" aria-hidden="true" />
          What you can do to reduce your exposure
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          If you live in a property built before 1970 — or before 1987 if you are primarily concerned about lead solder — there are practical steps you can take now, regardless of what your water company is doing.
        </p>

        <h3 className="text-lg font-semibold mt-6 mb-2 text-ink">Run the tap before drinking</h3>
        <p className="text-base text-body leading-relaxed mb-4">
          Lead dissolves into water that has been standing in contact with pipes — particularly overnight or after periods of no use. Running your kitchen cold tap for 30 to 60 seconds before filling a glass or kettle flushes the standing water and replaces it with fresh water from the main. This is especially important first thing in the morning. It costs nothing and can substantially reduce your daily lead intake if you have lead plumbing. Use the flushed water on plants rather than wasting it.
        </p>

        <h3 className="text-lg font-semibold mt-6 mb-2 text-ink">Use a certified lead-reducing filter</h3>
        <p className="text-base text-body leading-relaxed mb-4">
          Activated carbon block filters certified to NSF/ANSI Standard 53 (or the equivalent British Standard BS EN 14743) are effective at reducing lead at the tap. Pitcher-style filters with certified lead reduction — note that not all carbon filters reduce lead; look for specific lead certification — are the most accessible option. Under-sink reverse osmosis systems, which remove 90 to 99 percent of lead, provide a more robust solution. See our{" "}
          <Link href="/contaminant/lead" className="text-accent hover:underline font-medium">lead filter recommendations</Link>{" "}for a guide to certified products at different price points.
        </p>

        <h3 className="text-lg font-semibold mt-6 mb-2 text-ink">Test your water and consider pipe replacement</h3>
        <p className="text-base text-body leading-relaxed mb-4">
          If you want to know your actual lead level — rather than relying on area-level data — you can commission a water test from an accredited laboratory. Samples are taken from your tap after a defined standing period and analysed for lead concentration. Expect to pay between £30 and £80 for a certified lead analysis. Your water company may offer free testing; it is worth asking.
        </p>
        <p className="text-base text-body leading-relaxed">
          If a test confirms elevated lead levels, replacing the internal supply pipe — the section running from the boundary stopcock into your home — is the permanent solution. Costs vary significantly depending on the length of the pipe run and excavation required, but typically fall in the range of £1,000 to £3,000 for a standard terraced or semi-detached property. Many water companies offer a contribution towards the cost of simultaneous supply pipe replacement when they are replacing their own communication pipe in the same street. Contact your water company to find out whether your street is in their current programme.
        </p>

        {/* Check your area */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">
          Check your area
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          Enter your postcode to see what monitoring data shows for your area. We track lead detections in environmental and drinking water monitoring across 220 postcode districts in England, Wales, and Scotland.
        </p>
        <div className="card p-5">
          <PostcodeSearch size="sm" />
          <p className="text-xs text-faint mt-3">
            Our data covers{" "}
            <Link href="/contaminant/lead" className="text-accent hover:underline">lead and 50+ other contaminants</Link>. Check your postcode for a full water quality report.
          </p>
        </div>

        {/* Sources */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-faint shrink-0" aria-hidden="true" />
          Sources
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          Lead data on TapWater.uk draws on multiple official sources. Drinking water monitoring data is sourced from the Drinking Water Inspectorate's compliance monitoring returns, which water companies are required to submit under the Water Supply (Water Quality) Regulations 2016. Environmental monitoring data is from the Environment Agency's Water Quality Archive. Housing stock age estimates are derived from Office for National Statistics dwelling age data.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          Health effects information is drawn from the World Health Organization's Guidelines for Drinking-water Quality (4th edition, 2022), the US Centers for Disease Control and Prevention's childhood lead poisoning prevention programme, and peer-reviewed epidemiological literature including Lanphear et al. (2005) on low-level lead exposure and intellectual development.
        </p>
        <ul className="space-y-2 text-base text-body leading-relaxed">
          <li className="flex gap-2">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-rule-strong shrink-0" aria-hidden="true" />
            <Link href="/about/methodology" className="text-accent hover:underline">Our full scoring methodology</Link>
          </li>
          <li className="flex gap-2">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-rule-strong shrink-0" aria-hidden="true" />
            <Link href="/about/data-sources" className="text-accent hover:underline">Data sources and update frequency</Link>
          </li>
          <li className="flex gap-2">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-rule-strong shrink-0" aria-hidden="true" />
            <Link href="/contaminant/lead" className="text-accent hover:underline">Lead contaminant detail page</Link>
          </li>
        </ul>

      </div>
    </div>
  );
}
