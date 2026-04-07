import type { Metadata } from 'next'
import Link from 'next/link'
import { BreadcrumbSchema } from '@/components/json-ld'

export const metadata: Metadata = {
  title: 'Data Sources — Where TapWater.uk Gets Its Data',
  description:
    'Real drinking water test results from 16 UK water companies, plus Environment Agency monitoring. Fully transparent, open data.',
  openGraph: {
    title: 'Data Sources — Where TapWater.uk Gets Its Data',
    description:
      'Real drinking water test results from 16 UK water companies, plus Environment Agency monitoring. Fully transparent, open data.',
    url: 'https://www.tapwater.uk/about/data-sources',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Data Sources — Where TapWater.uk Gets Its Data',
    description:
      'Real drinking water test results from 16 UK water companies, plus Environment Agency monitoring. Fully transparent, open data.',
  },
}

export default function DataSourcesPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="max-w-3xl mx-auto">
        <BreadcrumbSchema
          items={[
            { name: "Home", url: "https://www.tapwater.uk" },
            { name: "About", url: "https://www.tapwater.uk/about" },
            { name: "Data Sources", url: "https://www.tapwater.uk/about/data-sources" },
          ]}
        />
        <nav className="text-sm text-muted mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5">
            <li><Link href="/" className="hover:text-accent transition-colors">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/about" className="hover:text-accent transition-colors">About</Link></li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-ink" aria-current="page">Data Sources</li>
          </ol>
        </nav>

        <h1 className="text-3xl font-bold font-display italic text-ink mb-6">Where Our Data Comes From</h1>

        <p className="text-base text-body leading-relaxed mb-4">
          TapWater.uk uses two layers of publicly available water quality data. We do not
          collect our own samples or conduct laboratory analysis. This page explains exactly
          where our data comes from and what it does (and doesn&apos;t) tell you.
        </p>

        {/* Layer 1: Stream */}
        <h2 className="font-display text-xl italic text-ink mt-10 mb-4">
          Layer 1: Drinking Water Quality Tests (Primary)
        </h2>
        <div className="card p-5 my-4 border-l-4 border-l-[var(--color-safe)]">
          <p className="text-sm text-ink font-semibold mb-2">
            Real tap water — sampled from kitchen taps across the UK
          </p>
          <p className="text-sm text-body leading-relaxed">
            This is actual drinking water quality data from your water company, published
            through the Stream Water Data Portal. These results are from samples taken at
            household taps — what you actually drink.
          </p>
        </div>
        <p className="text-base text-body leading-relaxed mb-4">
          The <strong className="text-ink">Stream Water Data Portal</strong> is a collaborative
          initiative where UK water companies publish their drinking water quality test results.
          Currently, 16 of 18 major water companies participate, including Yorkshire Water,
          Severn Trent, United Utilities, Anglian Water, Southern Water, and others.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          Stream data includes <strong className="text-ink">121+ regulated parameters</strong> tested
          by the Drinking Water Inspectorate (DWI): metals (lead, arsenic, copper), disinfection
          byproducts (trihalomethanes, bromate), nutrients (nitrate, nitrite, fluoride), pesticides,
          microbiological indicators (E. coli, coliforms), and physical properties (turbidity, colour,
          pH). Results are mapped to Lower Super Output Areas (LSOAs), which we link to postcode
          districts using the ONS National Statistics Postcode Lookup.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          Where Stream data is available, it drives your postcode&apos;s safety score. These pages
          show a green <span className="inline-flex items-center gap-1.5 bg-wash border border-rule rounded-full px-2 py-0.5 text-xs"><span className="w-1.5 h-1.5 rounded-full bg-safe" />Drinking water quality data</span> badge.
        </p>

        {/* Layer 2: EA */}
        <h2 className="font-display text-xl italic text-ink mt-10 mb-4">
          Layer 2: Environmental Water Monitoring (Supplementary)
        </h2>
        <div className="card p-5 my-4 border-l-4 border-l-[var(--color-warning)]">
          <p className="text-sm text-ink font-semibold mb-2">
            Rivers, groundwater and reservoirs — not treated tap water
          </p>
          <p className="text-sm text-body leading-relaxed">
            The Environment Agency monitors the raw water sources that feed into treatment works.
            This data is shown separately on postcode pages and clearly labelled as environmental
            monitoring.
          </p>
        </div>
        <p className="text-base text-body leading-relaxed mb-4">
          The <strong className="text-ink">Environment Agency (EA)</strong> operates one of the most
          extensive environmental water monitoring networks in Europe. Their open data API provides
          access to millions of water quality observations from rivers, lakes, reservoirs, and
          groundwater boreholes in England.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          EA data includes metals, nutrients, physical parameters, and PFAS monitoring. For postcodes
          where Stream drinking water data isn&apos;t yet available, EA data provides the primary score
          with an amber <span className="inline-flex items-center gap-1.5 bg-wash border border-rule rounded-full px-2 py-0.5 text-xs"><span className="w-1.5 h-1.5 rounded-full bg-warning" />Environmental monitoring only</span> badge.
        </p>

        {/* Postcode mapping */}
        <h2 className="font-display text-xl italic text-ink mt-10 mb-4">
          Geographic Mapping
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          We use the <strong className="text-ink">ONS National Statistics Postcode Lookup</strong> to
          map every UK postcode to its LSOA (Lower Super Output Area), which links to Stream drinking
          water data. For EA data, we use <strong className="text-ink">postcodes.io</strong> to resolve
          postcodes to geographic coordinates and find nearby monitoring points.
        </p>

        {/* Update frequency */}
        <h2 className="font-display text-xl italic text-ink mt-10 mb-4">Update Frequency</h2>
        <p className="text-base text-body leading-relaxed mb-4">
          Our data pipeline runs automatically on a daily schedule:
        </p>
        <ul className="list-disc pl-5 mb-4 space-y-1 text-base text-body leading-relaxed">
          <li>
            <strong className="text-ink">Stream Water Data Portal</strong> — water companies publish
            annual datasets. We fetch the most recent year&apos;s data for each company daily.
          </li>
          <li>
            <strong className="text-ink">EA Water Quality API</strong> — queried daily for
            each covered postcode area. New observations are incorporated automatically.
          </li>
          <li>
            <strong className="text-ink">LSOA mappings</strong> — updated when the ONS publishes
            new postcode lookup data (typically quarterly).
          </li>
        </ul>

        {/* Coverage */}
        <h2 className="font-display text-xl italic text-ink mt-10 mb-4">Coverage</h2>
        <p className="text-base text-body leading-relaxed mb-4">
          Stream drinking water data is currently available from: Yorkshire Water, Severn Trent,
          United Utilities, Anglian Water, Southern Water, South West Water, Portsmouth Water,
          Welsh Water, and Northumbrian Water. Thames Water, Wessex Water, and Bristol Water
          are not yet on the portal — postcodes in those areas use EA environmental data only.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          We cover 220 postcode districts across England, Wales, and parts of Scotland, with more
          being added as water companies publish additional data.
        </p>

        {/* Open data */}
        <h2 className="font-display text-xl italic text-ink mt-10 mb-4">Open Data Commitment</h2>
        <p className="text-base text-body leading-relaxed mb-4">
          All data used by TapWater.uk is published under open licences and is freely available
          to anyone. We do not claim ownership of any underlying data. Our value is in combining,
          scoring, and presenting this information in a way that&apos;s useful to real people —
          not in the data itself.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          Sources:{' '}
          <a href="https://portal-streamwaterdata.hub.arcgis.com/" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">Stream Water Data Portal</a>,{' '}
          <a href="https://environment.data.gov.uk/water-quality" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">EA Water Quality API</a>,{' '}
          <a href="https://geoportal.statistics.gov.uk/" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">ONS Open Geography Portal</a>.
        </p>
      </div>
    </div>
  )
}
