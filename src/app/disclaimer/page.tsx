import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Disclaimer | TapWater.uk',
  description: 'Disclaimer for TapWater.uk — the limitations and intended use of our water quality information.',
}

export default function DisclaimerPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Disclaimer</h1>
        <p className="text-sm text-slate-500 mb-8">Last updated: April 2026</p>

        <h2 className="text-xl font-bold text-slate-900 mb-4">Educational Information Only</h2>
        <p className="text-base text-slate-600 leading-relaxed mb-6">
          The information provided on TapWater.uk is intended for general educational and
          informational purposes only. Nothing on this website constitutes medical, health, or
          professional advice of any kind. You should not rely on information from this site as a
          substitute for advice from a qualified medical professional, water quality specialist,
          or other relevant expert.
        </p>

        <h2 className="text-xl font-bold text-slate-900 mt-10 mb-4">Accuracy of Data</h2>
        <p className="text-base text-slate-600 leading-relaxed mb-6">
          TapWater.uk aggregates data from publicly available UK government sources, including the
          Drinking Water Inspectorate, the Environment Agency, and individual water companies. While
          we take care to present this data accurately, we cannot guarantee that it is complete,
          current, or free of errors. Water quality can change rapidly due to environmental events,
          infrastructure issues, or changes in treatment processes.
        </p>
        <p className="text-base text-slate-600 leading-relaxed mb-6">
          For the most up-to-date and authoritative information about the quality of your tap
          water, please contact your water supplier directly or consult the Drinking Water
          Inspectorate at{' '}
          <a
            href="https://www.dwi.gov.uk"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
          >
            dwi.gov.uk
          </a>
          .
        </p>

        <h2 className="text-xl font-bold text-slate-900 mt-10 mb-4">No Warranty</h2>
        <p className="text-base text-slate-600 leading-relaxed mb-6">
          This website is provided &ldquo;as is&rdquo; without any representations or warranties, express or
          implied. We make no warranties in relation to the accuracy, completeness, suitability,
          or availability of the information, products, services, or related graphics on this
          website for any purpose.
        </p>

        <h2 className="text-xl font-bold text-slate-900 mt-10 mb-4">Limitation of Liability</h2>
        <p className="text-base text-slate-600 leading-relaxed mb-6">
          To the extent permitted by law, TapWater.uk will not be liable for any loss or damage
          — including, without limitation, indirect or consequential loss or damage — arising out
          of or in connection with the use of this website or any information contained on it.
        </p>

        <h2 className="text-xl font-bold text-slate-900 mt-10 mb-4">External Links</h2>
        <p className="text-base text-slate-600 leading-relaxed mb-6">
          This website may contain links to external websites. We have no control over the content
          of those sites and accept no responsibility for them or for any loss or damage that may
          arise from your use of them.
        </p>

        <h2 className="text-xl font-bold text-slate-900 mt-10 mb-4">Contact</h2>
        <p className="text-base text-slate-600 leading-relaxed mb-6">
          If you have any questions about this disclaimer, please contact us at{' '}
          <a href="mailto:hello@tapwater.uk" className="text-blue-600 underline hover:text-blue-800">
            hello@tapwater.uk
          </a>
          .
        </p>
      </div>
    </div>
  )
}
