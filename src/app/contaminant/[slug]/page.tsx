import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { PostcodeSearch } from "@/components/postcode-search";

type ContaminantEntry = {
  name: string;
  description: string;
  healthEffects: string;
  sources: string;
  ukLimit: string | null;
  whoGuideline: string;
  euLimit: string;
  removal: string[];
};

const CONTAMINANTS: Record<string, ContaminantEntry> = {
  pfas: {
    name: "PFAS (Forever Chemicals)",
    description:
      "PFAS (per- and polyfluoroalkyl substances) are a large group of man-made chemicals that have been used in industry and consumer products since the 1940s. They are called 'forever chemicals' because they do not break down naturally in the environment or the human body, and can accumulate over time. PFAS have been found in drinking water sources across the UK, often as a result of industrial activity, firefighting foam use, and agricultural runoff.",
    healthEffects:
      "Long-term exposure to certain PFAS compounds has been linked to a range of adverse health outcomes, including increased cholesterol levels, immune system disruption, thyroid hormone interference, reduced vaccine effectiveness in children, and an elevated risk of some cancers including kidney and testicular cancer. The health effects vary depending on the specific compound, level of exposure, and duration.",
    sources:
      "PFAS enter drinking water sources primarily through industrial discharge, the use of aqueous film-forming foam (AFFF) at military bases and airports, landfill leachate, and agricultural application of PFAS-contaminated sludge or pesticides. Manufacturing sites producing non-stick coatings, water-resistant textiles, and food packaging are also significant sources.",
    ukLimit: null,
    whoGuideline: "0.1 µg/L",
    euLimit: "0.1 µg/L (total)",
    removal: ["Reverse osmosis", "Activated carbon", "Ion exchange"],
  },
  lead: {
    name: "Lead",
    description:
      "Lead is a naturally occurring heavy metal that has no safe level of exposure in humans. In drinking water, lead contamination most commonly arises not from treatment works but from lead service pipes, lead soldered joints, and brass fittings in older properties — particularly homes built before 1970. Water that is slightly acidic or soft is more likely to dissolve lead from pipes.",
    healthEffects:
      "Lead is a potent neurotoxin, particularly harmful to children under six and developing foetuses. Even low-level exposure can impair cognitive development, reduce IQ, and cause behavioural problems in children. In adults, chronic lead exposure is associated with high blood pressure, kidney damage, cardiovascular disease, and reproductive issues. There is no known safe level of lead in blood.",
    sources:
      "The primary source of lead in UK tap water is aging internal plumbing. Lead water supply pipes (known as 'lead communication pipes') were commonly installed in UK homes until the 1970s. Lead solder was used in copper pipework until 1987. Properties in cities such as London, Glasgow, Edinburgh, and Birmingham are most likely to still have lead plumbing, particularly in Victorian-era housing stock.",
    ukLimit: "0.01 mg/L",
    whoGuideline: "0.01 mg/L",
    euLimit: "0.005 mg/L (from 2036)",
    removal: ["Reverse osmosis", "Distillation", "Carbon block filters"],
  },
  nitrate: {
    name: "Nitrate",
    description:
      "Nitrate is a naturally occurring compound found in soil and water. In drinking water, elevated nitrate levels are predominantly caused by agricultural runoff from fertilised fields and the decomposition of organic matter. While nitrate itself is relatively low in toxicity, it can be converted by bacteria in the gut into nitrite, a more reactive compound, particularly in infants.",
    healthEffects:
      "High nitrate levels in drinking water are most dangerous for infants under three months old, where gut bacteria can convert nitrate to nitrite, which can interfere with oxygen transport in the blood — a condition known as methaemoglobinaemia or 'blue baby syndrome'. In adults, some studies have suggested a link between high nitrate intake and increased cancer risk, though the evidence is still debated.",
    sources:
      "The main source of nitrate in UK drinking water is agricultural activity — specifically the use of nitrogen-based fertilisers and the spreading of animal manure on farmland. Nitrate leaches through soil into groundwater and rivers, which are often used as drinking water sources. Sewage effluent and urban runoff also contribute, though to a lesser extent.",
    ukLimit: "50 mg/L",
    whoGuideline: "50 mg/L",
    euLimit: "50 mg/L",
    removal: ["Reverse osmosis", "Ion exchange", "Distillation"],
  },
};

const REMOVAL_DESCRIPTIONS: Record<string, string> = {
  "Reverse osmosis":
    "A membrane filtration process that removes up to 99% of contaminants by forcing water through a semi-permeable membrane under pressure. Highly effective but produces some wastewater.",
  "Activated carbon":
    "Porous carbon material (from charcoal or coconut shell) that adsorbs contaminants as water passes through. Best for organic compounds and some heavy metals.",
  "Ion exchange":
    "Replaces unwanted ions (such as nitrate or lead) with harmless ones using resin beads. Effective and widely used in both whole-house and point-of-use systems.",
  "Carbon block filters":
    "Dense blocks of activated carbon that physically block particles and adsorb chemicals. More effective than granular carbon for lead and other heavy metals.",
  Distillation:
    "Water is boiled and the steam condensed, leaving most contaminants behind. Highly effective but slow and energy-intensive — typically used in countertop units.",
};

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return Object.keys(CONTAMINANTS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const contaminant = CONTAMINANTS[slug];

  if (!contaminant) {
    return { title: "Not Found" };
  }

  const description = `Learn about ${contaminant.name} in UK tap water — health effects, sources, UK and WHO legal limits, and how to remove it with the right water filter.`;

  return {
    title: `${contaminant.name} in UK Drinking Water`,
    description,
    openGraph: {
      title: `${contaminant.name} in UK Drinking Water`,
      description,
      url: `https://tapwater.uk/contaminant/${slug}/`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${contaminant.name} in UK Drinking Water`,
      description,
    },
  };
}

export default async function ContaminantPage({ params }: Props) {
  const { slug } = await params;
  const contaminant = CONTAMINANTS[slug];

  if (!contaminant) {
    notFound();
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 1. Breadcrumb */}
      <nav className="text-sm text-slate-500 mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-slate-700 transition-colors">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href="/contaminant"
              className="hover:text-slate-700 transition-colors"
            >
              Contaminants
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="font-medium text-slate-700" aria-current="page">
            {contaminant.name}
          </li>
        </ol>
      </nav>

      {/* 2. H1 */}
      <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-6">
        {contaminant.name} in UK Drinking Water
      </h1>

      {/* 3. Quick facts card */}
      <div className="bg-blue-50 rounded-xl p-6 mb-10">
        <h2 className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-4">
          Quick Facts
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-slate-500 mb-1">UK Legal Limit</p>
            <p className="text-base font-bold font-data text-slate-900">
              {contaminant.ukLimit ?? (
                <span className="text-warning">No UK limit set</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">WHO Guideline</p>
            <p className="text-base font-bold font-data text-slate-900">
              {contaminant.whoGuideline}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">EU Standard</p>
            <p className="text-base font-bold font-data text-slate-900">
              {contaminant.euLimit}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Primary Sources</p>
            <p className="text-base font-semibold text-slate-900 leading-snug">
              {slug === "pfas"
                ? "Industry, firefighting foam"
                : slug === "lead"
                  ? "Old lead pipes"
                  : "Agricultural runoff"}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Health Effects */}
      <section className="mt-8">
        <h2 className="text-xl font-bold text-slate-900 mb-3">
          Health Effects
        </h2>
        <p className="text-base text-slate-600 leading-relaxed">
          {contaminant.healthEffects}
        </p>
      </section>

      {/* 5. Where It Comes From */}
      <section className="mt-8">
        <h2 className="text-xl font-bold text-slate-900 mb-3">
          Where It Comes From
        </h2>
        <p className="text-base text-slate-600 leading-relaxed">
          {contaminant.sources}
        </p>
      </section>

      {/* 6. Regulatory Standards */}
      <section className="mt-8">
        <h2 className="text-xl font-bold text-slate-900 mb-4">
          Regulatory Standards
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 pr-6 font-semibold text-slate-700">
                  Jurisdiction
                </th>
                <th className="text-left py-2 pr-6 font-semibold text-slate-700">
                  Limit / Guideline
                </th>
                <th className="text-left py-2 font-semibold text-slate-700">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3 pr-6 text-slate-700 font-medium">
                  UK (DWI)
                </td>
                <td className="py-3 pr-6 font-data text-slate-900">
                  {contaminant.ukLimit ?? (
                    <span className="text-warning font-semibold">
                      No legal limit
                    </span>
                  )}
                </td>
                <td className="py-3 text-slate-500">
                  {contaminant.ukLimit
                    ? "Regulated under the Water Supply (Water Quality) Regulations 2016"
                    : "The UK has not yet set a statutory limit. Guidance is voluntary."}
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-6 text-slate-700 font-medium">WHO</td>
                <td className="py-3 pr-6 font-data text-slate-900">
                  {contaminant.whoGuideline}
                </td>
                <td className="py-3 text-slate-500">
                  World Health Organization Guidelines for Drinking-water Quality
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-6 text-slate-700 font-medium">EU</td>
                <td className="py-3 pr-6 font-data text-slate-900">
                  {contaminant.euLimit}
                </td>
                <td className="py-3 text-slate-500">
                  EU Drinking Water Directive (2020/2184). The UK no longer
                  automatically mirrors EU standards post-Brexit.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {!contaminant.ukLimit && (
          <p className="mt-4 text-sm text-slate-500 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            The UK currently has no statutory limit for {contaminant.name}.
            This means water companies are not legally required to monitor or
            report levels, even though both the WHO and EU have set guidelines.
            Campaigners and scientists have called on the UK government to
            introduce binding limits.
          </p>
        )}
      </section>

      {/* 7. How to Remove */}
      <section className="mt-8">
        <h2 className="text-xl font-bold text-slate-900 mb-4">
          How to Remove {contaminant.name}
        </h2>
        <ul className="space-y-3">
          {contaminant.removal.map((method) => (
            <li
              key={method}
              className="flex gap-3 bg-white rounded-lg border border-slate-200 p-4"
            >
              <span className="mt-0.5 flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2" />
              <div>
                <p className="font-semibold text-slate-900">{method}</p>
                <p className="text-sm text-slate-500 mt-0.5">
                  {REMOVAL_DESCRIPTIONS[method] ??
                    "An effective water treatment method for removing this contaminant."}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* 8. Check Your Area */}
      <section className="mt-10 bg-slate-50 rounded-xl border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Check Your Area
        </h2>
        <p className="text-base text-slate-600 mb-4">
          Want to know the {contaminant.name} levels in your water? Enter your
          postcode to get a free report for your area.
        </p>
        <PostcodeSearch size="sm" />
      </section>

      {/* 9. Filter link */}
      <div className="mt-8">
        <Link
          href={`/contaminant/${slug}`}
          className="inline-flex items-center gap-2 text-blue-600 font-medium hover:underline"
        >
          View filters that remove {contaminant.name} &rarr;
        </Link>
      </div>
    </div>
  );
}
