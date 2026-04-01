import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Methodology — How We Calculate Water Quality Scores',
  description:
    'A full explanation of how TapWater.uk calculates its 0–10 water quality safety scores, including data sources, parameter weighting, and grade thresholds.',
}

export default function MethodologyPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">
          How We Calculate Water Quality Scores
        </h1>

        <h2 className="text-xl font-bold text-slate-900 mt-10 mb-4">Overview</h2>
        <p className="text-base text-slate-600 leading-relaxed mb-4">
          Each area on TapWater.uk receives a safety score between 0 and 10. A score of 10 means
          every measured parameter is well within its regulatory limit; a score of 0 would indicate
          one or more parameters at or exceeding their legal maximum. In practice, the vast majority
          of areas in England and Wales score above 7.
        </p>
        <p className="text-base text-slate-600 leading-relaxed mb-4">
          The score is not a pass/fail: it is a relative indicator of margin from regulatory limits,
          weighted by the health significance of each parameter. A higher score means more headroom
          between measured levels and the limits set by the Drinking Water Inspectorate.
        </p>

        <h2 className="text-xl font-bold text-slate-900 mt-10 mb-4">Data Sources</h2>
        <p className="text-base text-slate-600 leading-relaxed mb-4">
          The overall score is derived from two layers of data, combined with fixed weights:
        </p>
        <ul className="list-disc pl-5 mb-4 space-y-1 text-base text-slate-600 leading-relaxed">
          <li>
            <strong className="text-slate-800">Drinking Water (80% weight)</strong> — data from the
            Drinking Water Inspectorate covering regulated parameters tested at the tap. This is the
            primary layer because it directly reflects the water you drink. It covers 48 parameters
            tested on a regular schedule across all supply zones in England and Wales.
          </li>
          <li>
            <strong className="text-slate-800">Environmental Context (20% weight)</strong> — data
            from the Environment Agency's water quality monitoring network, which measures
            contaminants in source waters, rivers, and groundwater in the surrounding area. This
            layer adds broader ecological context and can indicate emerging trends before they reach
            treatment works.
          </li>
        </ul>
        <p className="text-base text-slate-600 leading-relaxed mb-4">
          Drinking water data is weighted at 80% because it is the most direct measure of what
          comes out of your tap after treatment. Environmental data provides useful context but does
          not reflect the output of the treatment process.
        </p>

        <h2 className="text-xl font-bold text-slate-900 mt-10 mb-4">Scoring Formula</h2>
        <p className="text-base text-slate-600 leading-relaxed mb-4">
          For each measured parameter, we calculate a parameter score based on how close the
          measured value is to its regulatory limit:
        </p>
        <div className="bg-slate-50 border border-slate-200 rounded-lg px-5 py-4 mb-4 font-mono text-sm text-slate-700">
          parameter_score = 10 × (1 − measured / limit)
        </div>
        <p className="text-base text-slate-600 leading-relaxed mb-4">
          A reading at 10% of its limit gives a parameter score of 9.0. A reading at the limit
          gives 0. Readings above the limit are clamped to 0 (they cannot make the overall score
          negative, but they pull it down significantly due to their weighting).
        </p>
        <p className="text-base text-slate-600 leading-relaxed mb-4">
          Parameters are grouped into three tiers based on their health significance. Each tier
          carries a different weight in the composite drinking water score:
        </p>

        <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-2">Tier 1 — Weight 3.0</h3>
        <p className="text-base text-slate-600 leading-relaxed mb-4">
          Lead, PFAS (per- and polyfluoroalkyl substances), E. coli, total coliform, arsenic.
          These parameters carry the greatest weight because exceedances pose the most serious
          acute or chronic health risks.
        </p>

        <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-2">Tier 2 — Weight 2.0</h3>
        <p className="text-base text-slate-600 leading-relaxed mb-4">
          Nitrate, pesticides, trihalomethanes (THMs), copper. Significant health implications at
          elevated concentrations, particularly for vulnerable groups.
        </p>

        <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-2">Tier 3 — Weight 1.0</h3>
        <p className="text-base text-slate-600 leading-relaxed mb-4">
          Turbidity, chlorine, pH, hardness, iron. These parameters affect taste, appearance, and
          infrastructure, but pose lower direct health risk within regulatory ranges.
        </p>

        <p className="text-base text-slate-600 leading-relaxed mb-4">
          The final overall score combines the two layers as follows:
        </p>
        <div className="bg-slate-50 border border-slate-200 rounded-lg px-5 py-4 mb-4 font-mono text-sm text-slate-700">
          overall_score = (drinking_score × 0.8) + (env_score × 0.2)
        </div>

        <h2 className="text-xl font-bold text-slate-900 mt-10 mb-4">Grade Scale</h2>
        <p className="text-base text-slate-600 leading-relaxed mb-4">
          Scores are mapped to a five-band grade for easier interpretation:
        </p>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm text-left border border-slate-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-semibold">
                <th className="px-4 py-3 border-b border-slate-200">Score range</th>
                <th className="px-4 py-3 border-b border-slate-200">Grade</th>
                <th className="px-4 py-3 border-b border-slate-200">What it means</th>
              </tr>
            </thead>
            <tbody className="text-slate-600 divide-y divide-slate-100">
              <tr>
                <td className="px-4 py-3">9.0 – 10</td>
                <td className="px-4 py-3 font-medium text-emerald-700">Excellent</td>
                <td className="px-4 py-3">All parameters well within limits; very high margin.</td>
              </tr>
              <tr>
                <td className="px-4 py-3">7.0 – 8.9</td>
                <td className="px-4 py-3 font-medium text-green-700">Good</td>
                <td className="px-4 py-3">Parameters comfortably within limits.</td>
              </tr>
              <tr>
                <td className="px-4 py-3">5.0 – 6.9</td>
                <td className="px-4 py-3 font-medium text-yellow-700">Fair</td>
                <td className="px-4 py-3">Some parameters closer to limits; worth monitoring.</td>
              </tr>
              <tr>
                <td className="px-4 py-3">3.0 – 4.9</td>
                <td className="px-4 py-3 font-medium text-orange-700">Poor</td>
                <td className="px-4 py-3">One or more parameters significantly elevated.</td>
              </tr>
              <tr>
                <td className="px-4 py-3">0 – 2.9</td>
                <td className="px-4 py-3 font-medium text-red-700">Very Poor</td>
                <td className="px-4 py-3">Parameters near or at regulatory limits.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 className="text-xl font-bold text-slate-900 mt-10 mb-4">Transparency</h2>
        <p className="text-base text-slate-600 leading-relaxed mb-4">
          Every report page shows the individual parameter readings that contribute to the score,
          so you can see exactly which substances were measured, at what concentration, and how that
          compares to the regulatory limit. We never present a score in isolation.
        </p>
        <p className="text-base text-slate-600 leading-relaxed mb-4">
          Where data for a parameter is missing for a given period or zone, we exclude that
          parameter from the weighted average rather than treating a missing value as zero. This
          means the score reflects only what has actually been measured and reported. Where missing
          data is extensive, we flag this on the report.
        </p>

        <h2 className="text-xl font-bold text-slate-900 mt-10 mb-4">Limitations</h2>
        <p className="text-base text-slate-600 leading-relaxed mb-4">
          Our score is a useful summary, but it does not capture everything. Key limitations to be
          aware of:
        </p>
        <ul className="list-disc pl-5 mb-4 space-y-1 text-base text-slate-600 leading-relaxed">
          <li>
            <strong className="text-slate-800">Infrastructure age.</strong> Lead pipes in older
            properties can leach lead into water even when the supply zone score is high. DWI data
            is collected at the treatment works and at a sample of taps — it may not reflect your
            specific property.
          </li>
          <li>
            <strong className="text-slate-800">Private water supplies.</strong> Properties served by
            private boreholes or springs are not covered by DWI data and are not included in our
            scores.
          </li>
          <li>
            <strong className="text-slate-800">Sampling frequency.</strong> Some parameters are
            tested quarterly or annually. The score reflects the most recent data available, which
            may not capture very recent changes.
          </li>
          <li>
            <strong className="text-slate-800">Emerging contaminants.</strong> Regulatory limits
            exist only for a defined list of parameters. Substances not yet regulated are not
            reflected in the score, even if they are present.
          </li>
          <li>
            <strong className="text-slate-800">This is not medical advice.</strong> If you have
            health concerns related to your water, please consult a healthcare professional and
            contact your water supplier.
          </li>
        </ul>
      </div>
    </div>
  )
}
