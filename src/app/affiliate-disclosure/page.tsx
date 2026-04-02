import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Affiliate Disclosure | TapWater.uk',
  description: 'Affiliate disclosure for TapWater.uk — how we earn revenue through product recommendations.',
}

export default function AffiliateDisclosurePage() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold font-display italic text-ink mb-2">Affiliate Disclosure</h1>
        <p className="text-sm text-muted mb-8">Last updated: April 2026</p>

        <p className="text-base text-body leading-relaxed mb-6">
          TapWater.uk is an independent water quality research project. To support the cost of
          running this service, we participate in affiliate marketing programmes. This page
          explains what that means for you.
        </p>

        <h2 className="font-display text-xl italic text-ink mt-10 mb-4">How Affiliate Links Work</h2>
        <p className="text-base text-body leading-relaxed mb-6">
          Some links on this website — particularly links to water filters and related products —
          are affiliate links. This means that if you click on a link and subsequently make a
          purchase, we may receive a small commission from the retailer or manufacturer at no
          additional cost to you.
        </p>
        <p className="text-base text-body leading-relaxed mb-6">
          We participate in affiliate programmes including, but not limited to, Amazon Associates
          and direct affiliate programmes with selected water filter brands. Affiliate links are
          used only for products we have assessed as genuinely relevant to our readers.
        </p>

        <h2 className="font-display text-xl italic text-ink mt-10 mb-4">Our Editorial Independence</h2>
        <p className="text-base text-body leading-relaxed mb-6">
          Affiliate relationships do not influence our editorial content. We do not accept payment
          to feature, rank, or recommend specific products. Our product recommendations are based
          solely on publicly available certifications, independent test data, and the specific
          contaminants present in your water. A product&apos;s affiliation status has no bearing on
          whether or how we feature it.
        </p>
        <p className="text-base text-body leading-relaxed mb-6">
          We will never recommend a product that we do not believe to be genuinely useful for the
          contaminants detected in your area.
        </p>

        <h2 className="font-display text-xl italic text-ink mt-10 mb-4">Compliance</h2>
        <p className="text-base text-body leading-relaxed mb-6">
          This disclosure is made in accordance with the UK Competition and Markets Authority
          (CMA) guidance on online endorsements and the ASA/CAP code on advertising disclosure.
          We are committed to full transparency about any commercial relationships that may
          influence content on this site.
        </p>

        <h2 className="font-display text-xl italic text-ink mt-10 mb-4">Questions</h2>
        <p className="text-base text-body leading-relaxed mb-6">
          If you have any questions about our affiliate relationships or how they may affect our
          content, please contact us at{' '}
          <a href="mailto:hello@tapwater.uk" className="text-accent underline underline-offset-2 hover:text-accent-hover">
            hello@tapwater.uk
          </a>
          .
        </p>
      </div>
    </div>
  )
}
