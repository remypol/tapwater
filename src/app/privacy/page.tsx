import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | TapWater.uk',
  description: 'Privacy policy for TapWater.uk — how we collect, use, and protect your personal data.',
  openGraph: {
    title: 'Privacy Policy | TapWater.uk',
    description: 'Privacy policy for TapWater.uk — how we collect, use, and protect your personal data.',
    url: 'https://www.tapwater.uk/privacy',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Privacy Policy | TapWater.uk',
    description: 'Privacy policy for TapWater.uk — how we collect, use, and protect your personal data.',
  },
}

export default function PrivacyPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold font-display italic text-ink mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted mb-8">Last updated: April 2026</p>

        <p className="text-base text-body leading-relaxed mb-6">
          TapWater.uk (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is committed to protecting your privacy. This policy explains
          what information we collect when you use this website, how we use it, and your rights
          under UK data protection law, including the UK GDPR and the Data Protection Act 2018.
        </p>

        <h2 className="font-display text-xl italic text-ink mt-10 mb-4">Information We Collect</h2>
        <p className="text-base text-body leading-relaxed mb-4">
          We collect limited information in order to provide and improve our service:
        </p>
        <ul className="list-disc pl-5 mb-6 space-y-2 text-base text-body leading-relaxed">
          <li>
            <strong className="text-ink">Postcode searches.</strong> When you search a
            postcode, we may log the district-level postcode (e.g. &ldquo;SW1A&rdquo;) to understand which
            areas are most frequently requested. We do not store full postcodes or link search
            queries to individuals.
          </li>
          <li>
            <strong className="text-ink">Email address.</strong> If you sign up for water
            quality alerts, we store your email address to send you notifications. You can
            unsubscribe at any time using the link in any email we send.
          </li>
          <li>
            <strong className="text-ink">Usage data.</strong> We collect standard server
            logs and anonymised analytics data (pages visited, time on site, referral source) to
            understand how our service is used. This data cannot be used to identify you personally.
          </li>
          <li>
            <strong className="text-ink">Cookies.</strong> We use strictly necessary cookies
            to operate the site. We may also use analytics cookies; where we do, we will ask for
            your consent first.
          </li>
        </ul>

        <h2 className="font-display text-xl italic text-ink mt-10 mb-4">How We Use Your Information</h2>
        <p className="text-base text-body leading-relaxed mb-4">We use the information we collect to:</p>
        <ul className="list-disc pl-5 mb-6 space-y-2 text-base text-body leading-relaxed">
          <li>Provide and operate the TapWater.uk service</li>
          <li>Send water quality alert emails (if you have subscribed)</li>
          <li>Improve the accuracy, coverage, and usability of our reports</li>
          <li>Monitor for abuse or security issues</li>
        </ul>
        <p className="text-base text-body leading-relaxed mb-6">
          We do not sell your personal data. We do not share your data with third parties except
          where required by law or where necessary to operate the service (e.g. a transactional
          email provider to send alert emails).
        </p>

        <h2 className="font-display text-xl italic text-ink mt-10 mb-4">Your Rights</h2>
        <p className="text-base text-body leading-relaxed mb-4">
          Under UK data protection law, you have the right to:
        </p>
        <ul className="list-disc pl-5 mb-6 space-y-2 text-base text-body leading-relaxed">
          <li>Access the personal data we hold about you</li>
          <li>Request correction or deletion of your personal data</li>
          <li>Object to or restrict processing of your personal data</li>
          <li>Withdraw consent at any time (where processing is based on consent)</li>
          <li>Lodge a complaint with the Information Commissioner&apos;s Office (ICO)</li>
        </ul>
        <p className="text-base text-body leading-relaxed mb-6">
          To exercise any of these rights, or if you have any questions about this policy, please
          contact us at{' '}
          <a href="mailto:hello@tapwater.uk" className="text-accent underline underline-offset-2 hover:text-accent-hover">
            hello@tapwater.uk
          </a>
          .
        </p>

        <h2 className="font-display text-xl italic text-ink mt-10 mb-4">Changes to This Policy</h2>
        <p className="text-base text-body leading-relaxed mb-6">
          We may update this policy from time to time. When we do, we will update the date at the
          top of this page. We encourage you to review this policy periodically.
        </p>
      </div>
    </div>
  )
}
