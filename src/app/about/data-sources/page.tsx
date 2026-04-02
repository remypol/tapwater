import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Data Sources — TapWater.uk',
  description:
    'A transparent overview of every data source used by TapWater.uk, including the Drinking Water Inspectorate, water company postcode lookups, and the Environment Agency water quality API.',
}

export default function DataSourcesPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="max-w-3xl mx-auto">
        <nav className="text-sm text-muted mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5">
            <li><Link href="/" className="hover:text-accent transition-colors">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/about" className="hover:text-accent transition-colors">About</Link></li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-ink" aria-current="page">Data Sources</li>
          </ol>
        </nav>

        <h1 className="text-3xl font-bold font-display italic text-ink mb-6">Our Data Sources</h1>

        <p className="text-base text-body leading-relaxed mb-4">
          TapWater.uk is built entirely on publicly available data from UK government and regulatory
          bodies. We do not collect our own water samples or conduct laboratory analysis. This page
          explains exactly where our data comes from, what it covers, and how it is kept up to date
          — because we believe full transparency about data provenance is essential for a project
          like this.
        </p>

        <h2 className="font-display text-xl italic text-ink mt-10 mb-4">
          Drinking Water Inspectorate (DWI)
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          <strong className="text-ink">This is our primary source.</strong> The Drinking Water
          Inspectorate is the independent regulator for drinking water quality in England and Wales.
          It publishes the most comprehensive and authoritative dataset on the quality of treated
          tap water supplied to homes and businesses.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          The DWI dataset covers 48 regulated parameters — including microbiological indicators
          (E. coli, total coliform), heavy metals (lead, arsenic, copper), organic compounds
          (pesticides, trihalomethanes, PFAS), and aesthetic parameters (turbidity, pH, hardness,
          chlorine, iron). Sampling takes place at treatment works, service reservoirs, and at
          consumers' taps, giving a broad picture of water quality throughout the distribution
          system.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          Data is published on both an annual and a quarterly basis depending on the parameter.
          Annual reports cover the full set of 48 parameters at the supply zone level; quarterly
          releases focus on the most health-critical parameters. We ingest both schedules and use
          the most recent available result for each parameter when calculating scores.
        </p>

        <h2 className="font-display text-xl italic text-ink mt-10 mb-4">
          Water Company Postcode Lookups
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          England and Wales are served by approximately 20 licensed water companies, each
          responsible for one or more supply zones. To map a postcode to the correct set of DWI
          data, we maintain a regularly updated lookup table sourced directly from each water
          company's published supply zone information.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          This water company layer provides the most granular geographic mapping available —
          more precise than regional or local authority boundaries — because supply zones are drawn
          to reflect the physical infrastructure of the water distribution network. A single
          postcode district can sometimes span two different supply zones with meaningfully
          different water characteristics; the water company lookup ensures we assign each postcode
          to the correct zone.
        </p>

        <h2 className="font-display text-xl italic text-ink mt-10 mb-4">
          Environment Agency Water Quality API
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          <strong className="text-ink">This is a supplementary source.</strong> The
          Environment Agency (EA) operates one of the most extensive environmental monitoring
          networks in Europe. Their open data API provides access to over 72 million water quality
          observations from more than 58,000 sampling points across rivers, lakes, estuaries, and
          groundwater in England.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          The EA dataset includes measurements for 50+ PFAS (per- and polyfluoroalkyl substance)
          compounds, nitrates, pesticides, heavy metals, biological oxygen demand, and many other
          determinands. The coverage of PFAS is particularly notable given growing scientific
          interest in this class of compounds.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          <strong className="text-ink">
            Important distinction: EA data measures environmental water, not treated drinking water.
          </strong>{' '}
          A river or groundwater source with elevated contaminants does not mean your tap water
          contains those contaminants — water treatment is specifically designed to remove or reduce
          them. We use EA data as contextual background (weighted at 20% in our overall score) to
          indicate the environmental quality of source waters in your area, not as a direct measure
          of drinking water safety.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          The EA Water Quality API is publicly accessible at{' '}
          <span className="font-mono text-sm bg-wash px-1.5 py-0.5 rounded text-body border border-rule">
            environment.data.gov.uk/water-quality/api
          </span>
          .
        </p>

        <h2 className="font-display text-xl italic text-ink mt-10 mb-4">Postcode Mapping</h2>
        <p className="text-base text-body leading-relaxed mb-4">
          Translating a postcode search into the correct water supply zone involves two reference
          datasets:
        </p>
        <ul className="list-disc pl-5 mb-4 space-y-1 text-base text-body leading-relaxed">
          <li>
            <strong className="text-ink">Water UK postcode lookup</strong> — maps postcodes
            to water company and supply zone identifiers, maintained by the industry body Water UK.
          </li>
          <li>
            <strong className="text-ink">ONS Postcode Directory (ONSPD)</strong> — the Office
            for National Statistics' definitive postcode reference, used to validate postcodes,
            resolve geographic coordinates, and link to local authority and region boundaries for
            contextual display.
          </li>
        </ul>

        <h2 className="font-display text-xl italic text-ink mt-10 mb-4">Update Frequency</h2>
        <p className="text-base text-body leading-relaxed mb-4">
          Different data sources are refreshed on different schedules, reflecting the cadence at
          which upstream data is published:
        </p>
        <ul className="list-disc pl-5 mb-4 space-y-1 text-base text-body leading-relaxed">
          <li>
            <strong className="text-ink">Environment Agency API</strong> — checked daily for
            new observations; new measurements are incorporated within 24 hours of publication.
          </li>
          <li>
            <strong className="text-ink">Water company postcode lookups</strong> — re-scraped
            weekly to capture supply zone boundary changes and new postcode assignments.
          </li>
          <li>
            <strong className="text-ink">DWI drinking water data</strong> — ingested on a
            quarterly basis, aligned with the DWI's own publication schedule. Annual reports are
            processed as soon as they are released, typically in the spring following the reference
            year.
          </li>
        </ul>

        <h2 className="font-display text-xl italic text-ink mt-10 mb-4">Open Data</h2>
        <p className="text-base text-body leading-relaxed mb-4">
          The Environment Agency water quality data is published under the Open Government Licence
          and is freely available to anyone. DWI drinking water reports are public documents
          available on the DWI website. Water company postcode mapping data is published by each
          company as part of their regulatory obligations.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          TapWater.uk does not claim ownership of any underlying data. We are a presentation and
          analysis layer on top of publicly funded, publicly available information. Our value lies
          in combining, normalising, and making this data accessible — not in the data itself.
        </p>
      </div>
    </div>
  )
}
