import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Data Sources — TapWater.uk',
  description:
    'Where TapWater.uk gets its data: Environment Agency Water Quality API for river, groundwater and lake monitoring across England. Fully transparent, open government data.',
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
          TapWater.uk is built entirely on publicly available data from UK government bodies.
          We do not collect our own water samples or conduct laboratory analysis. This page
          explains exactly where our data comes from and what it does (and doesn&apos;t) tell you.
        </p>

        {/* What we use now */}
        <h2 className="font-display text-xl italic text-ink mt-10 mb-4">
          Environment Agency Water Quality API
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          <strong className="text-ink">This is our current data source.</strong> The
          Environment Agency (EA) operates one of the most extensive environmental water
          monitoring networks in Europe. Their open data API provides access to millions of
          water quality observations from sampling points across rivers, lakes, reservoirs,
          and groundwater boreholes in England.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          We specifically query <strong className="text-ink">water-type sampling points only</strong> —
          freshwater rivers, lakes, reservoirs, groundwater boreholes, and springs. We exclude
          sewage discharge points, trade/industrial discharges, biota tissue analysis, and
          sediment monitoring, as these don&apos;t reflect water quality relevant to your supply.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          The EA dataset includes measurements for metals (lead, arsenic, cadmium, mercury,
          copper, nickel, iron, manganese), nutrients (nitrate, nitrite, ammonia, phosphate),
          and physical parameters (pH, turbidity, conductivity, dissolved oxygen, temperature).
          PFAS (forever chemicals) monitoring data is also available for some areas.
        </p>

        <div className="card p-5 my-6">
          <p className="text-sm text-ink font-semibold mb-2">
            Important: environmental water, not treated tap water
          </p>
          <p className="text-sm text-body leading-relaxed">
            EA data measures rivers, lakes, and groundwater — the raw sources before treatment.
            Your tap water goes through extensive treatment to remove or reduce contaminants.
            Our scores reflect the quality of source water in your area, which gives an indication
            of what your water company needs to treat. A low score doesn&apos;t mean your tap water
            is unsafe — it means there&apos;s more for the treatment works to handle.
          </p>
        </div>

        <p className="text-base text-body leading-relaxed mb-4">
          The EA Water Quality API is publicly accessible at{' '}
          <span className="font-mono text-sm bg-wash px-1.5 py-0.5 rounded text-body border border-rule">
            environment.data.gov.uk/water-quality
          </span>{' '}
          under the Open Government Licence.
        </p>

        {/* Postcode mapping */}
        <h2 className="font-display text-xl italic text-ink mt-10 mb-4">
          Postcode Mapping
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          We use <strong className="text-ink">postcodes.io</strong> (powered by the ONS Postcode
          Directory) to resolve each postcode district to geographic coordinates and administrative
          area information. This tells us the latitude, longitude, local authority, city, and region
          for each postcode — which we then use to find nearby EA sampling points.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          Water company assignment is currently based on a city-to-supplier mapping covering the
          major UK water companies. This will be refined to use supply zone-level mapping as we
          integrate more data sources.
        </p>

        {/* Update frequency */}
        <h2 className="font-display text-xl italic text-ink mt-10 mb-4">Update Frequency</h2>
        <p className="text-base text-body leading-relaxed mb-4">
          Our data pipeline runs automatically on a daily schedule:
        </p>
        <ul className="list-disc pl-5 mb-4 space-y-1 text-base text-body leading-relaxed">
          <li>
            <strong className="text-ink">EA Water Quality API</strong> — queried daily for
            each covered postcode area. New observations from the EA are incorporated
            automatically when they appear in the API.
          </li>
          <li>
            <strong className="text-ink">Postcode data</strong> — refreshed monthly from
            postcodes.io to capture any boundary or administrative changes.
          </li>
        </ul>
        <p className="text-base text-body leading-relaxed mb-4">
          Each postcode page shows when its data was last sampled by the EA. Some areas
          have very recent data; others may show older observations depending on the EA&apos;s
          monitoring schedule for that location.
        </p>

        {/* Coming next */}
        <h2 className="font-display text-xl italic text-ink mt-10 mb-4">Coming Next</h2>
        <p className="text-base text-body leading-relaxed mb-4">
          We&apos;re actively working to integrate additional data sources:
        </p>
        <ul className="list-disc pl-5 mb-4 space-y-1 text-base text-body leading-relaxed">
          <li>
            <strong className="text-ink">Drinking Water Inspectorate (DWI)</strong> — the
            independent regulator for drinking water quality in England and Wales. DWI data
            covers treated tap water at the point of supply, giving the most direct measure
            of what comes out of your tap. DWI publishes annual compliance data covering 48
            regulated parameters per supply zone.
          </li>
          <li>
            <strong className="text-ink">SEPA (Scottish Environment Protection Agency)</strong> —
            environmental monitoring data for Scotland, where the EA doesn&apos;t operate.
          </li>
          <li>
            <strong className="text-ink">Water company supply zone mapping</strong> — precise
            postcode-to-supply-zone lookups for more accurate geographic assignment.
          </li>
        </ul>

        {/* Open data */}
        <h2 className="font-display text-xl italic text-ink mt-10 mb-4">Open Data</h2>
        <p className="text-base text-body leading-relaxed mb-4">
          All data used by TapWater.uk is published under open licences and is freely available
          to anyone. We do not claim ownership of any underlying data. Our value is in combining,
          scoring, and presenting this information in a way that&apos;s useful to real people —
          not in the data itself.
        </p>
      </div>
    </div>
  )
}
