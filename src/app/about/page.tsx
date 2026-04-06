import type { Metadata } from 'next'
import Link from 'next/link'
import { PersonSchema } from '@/components/json-ld'
import { getTrustMetrics } from '@/lib/data'

export const metadata: Metadata = {
  title: 'About TapWater.uk',
  description:
    'TapWater.uk is an independent water quality research project aggregating UK government data to provide free, postcode-searchable water quality reports for England and Wales.',
}

export default async function AboutPage() {
  const metrics = await getTrustMetrics();
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <PersonSchema
        name="Remy"
        url="https://www.tapwater.uk/about"
        description="Independent water quality researcher and founder of TapWater.uk"
      />
      <div className="max-w-3xl mx-auto">
        <nav className="text-sm text-muted mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5">
            <li><Link href="/" className="hover:text-accent transition-colors">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-ink" aria-current="page">About</li>
          </ol>
        </nav>

        <h1 className="text-3xl font-bold font-display italic text-ink mb-6">About TapWater.uk</h1>

        <p className="text-base text-body leading-relaxed mb-4">
          TapWater.uk is an independent water quality research project. We aggregate data from UK
          government sources to provide free, postcode-searchable water quality reports for every
          area in England and Wales.
        </p>

        {/* Trust metrics */}
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {metrics.map(({ value, label }) => (
            <div key={label} className="card p-4 text-center">
              <span className="font-data text-xl font-bold text-ink">{value}</span>
              <p className="text-xs text-faint uppercase tracking-wider mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Data source credibility */}
        <div className="mt-8 card p-6">
          <h2 className="text-sm font-semibold text-ink uppercase tracking-wider mb-4">Our data sources</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-ink">Environment Agency</p>
              <p className="text-xs text-muted mt-1">Water Quality Archive — environmental monitoring of rivers, groundwater, and source waters across England</p>
            </div>
            <div>
              <p className="text-sm font-medium text-ink">Drinking Water Inspectorate</p>
              <p className="text-xs text-muted mt-1">DWI compliance data — the regulator responsible for drinking water quality in England and Wales</p>
            </div>
            <div>
              <p className="text-sm font-medium text-ink">Stream Water Data Portal</p>
              <p className="text-xs text-muted mt-1">Real tap water test results direct from UK water companies — the most granular source available</p>
            </div>
          </div>
          <p className="text-xs text-faint mt-4">
            All data is published under the{" "}
            <a href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-muted">
              Open Government Licence v3
            </a>
          </p>
        </div>

        <section className="mt-10">
          <h2 className="font-display text-xl italic text-ink mb-4">
            Who&apos;s behind this
          </h2>
          <p className="text-base text-body leading-relaxed mb-4">
            TapWater.uk is built by <strong className="text-ink">Remy</strong>, an
            independent data researcher focused on making public environmental data
            accessible to normal people. The project grew from a simple question:
            what&apos;s actually in my tap water, and why is it so hard to find out?
          </p>
          <p className="text-base text-body leading-relaxed mb-4">
            We aggregate data from the Stream Water Data Portal (real drinking water
            test results from UK water companies), the Environment Agency Water Quality
            Archive, and the ONS postcode database. Every score is computed transparently
            using our{" "}
            <Link href="/about/methodology">published methodology</Link>
            {" "}&mdash; no black boxes, no hidden algorithms.
          </p>
          <p className="text-base text-body leading-relaxed">
            This is not a water filter company. We don&apos;t sell filters, we don&apos;t
            take money from water companies, and we don&apos;t run ads. The data speaks
            for itself.
          </p>
        </section>

        <h2 className="font-display text-xl italic text-ink mt-10 mb-4">Our Mission</h2>
        <p className="text-base text-body leading-relaxed mb-4">
          Water quality data in the UK is public, but it is scattered across multiple government
          portals, presented in technical formats, and difficult for ordinary households to
          interpret. Our mission is to change that. We believe everyone should be able to type in
          their postcode and immediately understand what is in their tap water — without needing a
          science degree or hours of research.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          By bringing together data from the Drinking Water Inspectorate, individual water companies,
          and the Environment Agency, we provide a single, plain-English view of water quality that
          is updated regularly and completely free to use.
        </p>

        <h2 className="font-display text-xl italic text-ink mt-10 mb-4">How It Works</h2>
        <p className="text-base text-body leading-relaxed mb-4">
          Our reports are built from three complementary data layers:
        </p>
        <ul className="list-disc pl-5 mb-4 space-y-1 text-base text-body leading-relaxed">
          <li>
            <strong className="text-ink">Drinking Water Inspectorate (DWI)</strong> — the
            primary source of treated tap water quality data, covering 48 regulated parameters
            tested at the tap across England and Wales.
          </li>
          <li>
            <strong className="text-ink">Water company data</strong> — postcode-level supply
            zone information from the approximately 20 licensed water companies, giving us the most
            granular geographic mapping available.
          </li>
          <li>
            <strong className="text-ink">Environment Agency monitoring</strong> — supplementary
            environmental water quality data covering rivers, groundwater, and source waters, which
            provides broader ecological context for your local area.
          </li>
        </ul>
        <p className="text-base text-body leading-relaxed mb-4">
          You can read more about how we combine these sources on our{' '}
          <Link href="/about/data-sources" className="text-accent underline underline-offset-2 hover:text-accent-hover">
            data sources
          </Link>{' '}
          page, and how we calculate quality scores on our{' '}
          <Link href="/about/methodology" className="text-accent underline underline-offset-2 hover:text-accent-hover">
            methodology
          </Link>{' '}
          page.
        </p>

        <h2 className="font-display text-xl italic text-ink mt-10 mb-4">What We Are Not</h2>
        <p className="text-base text-body leading-relaxed mb-4">
          TapWater.uk is an independent research project. We are not affiliated with any water
          company, government body, or regulator. Nothing on this site constitutes medical or health
          advice. Our scores and reports are intended to help you understand publicly available data,
          not to replace professional guidance.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          If you have specific concerns about your water supply — such as a discolouration, unusual
          taste, or odour — please contact your water supplier directly. They are the authoritative
          source for supply issues and can carry out testing at your property.
        </p>

        <h2 className="font-display text-xl italic text-ink mt-10 mb-4">Contact</h2>
        <p className="text-base text-body leading-relaxed mb-4">
          For questions, corrections, or data feedback, email us at{' '}
          <a
            href="mailto:hello@tapwater.uk"
            className="text-accent underline underline-offset-2 hover:text-accent-hover"
          >
            hello@tapwater.uk
          </a>
          .
        </p>
      </div>
    </div>
  )
}
