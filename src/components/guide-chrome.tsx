import Link from "next/link";
import { ShieldCheck } from "lucide-react";

/**
 * The repeated furniture of a guide page: breadcrumb, byline, affiliate
 * disclosure and footer. Each guide still owns its own body and schema.
 */

export function GuideBreadcrumb({ title }: { title: string }) {
  return (
    <nav className="text-sm text-muted mb-6" aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5 flex-wrap">
        <li>
          <Link href="/" className="hover:text-accent transition-colors">
            Home
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li>
          <Link href="/guides" className="hover:text-accent transition-colors">
            Guides
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li className="font-medium text-ink" aria-current="page">
          {title}
        </li>
      </ol>
    </nav>
  );
}

export function GuideByline({ updated }: { updated: string }) {
  return (
    <div className="flex items-center gap-2 mt-3 mb-8 text-sm text-muted">
      <span>
        By <span className="text-ink font-medium">TapWater.uk Research</span>
      </span>
      <span aria-hidden="true">&middot;</span>
      <span>Updated {updated}</span>
    </div>
  );
}

export function GuideDisclosure({ quotes = false }: { quotes?: boolean }) {
  return (
    <div className="bg-wash border border-rule rounded-xl p-4 mt-6 mb-8 flex items-start gap-3">
      <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" aria-hidden="true" />
      <p className="text-sm text-body">
        {quotes ? (
          <>
            This guide contains affiliate links to salt and test products, and a
            free quote form. We may earn a commission on purchases and a fee when
            an installer takes on a quote request. Neither changes what you pay,
            and neither changes our verdicts, which are based on how softeners
            actually work in UK water.{" "}
          </>
        ) : (
          <>
            This guide contains affiliate links. If you buy through them we earn a
            small commission at no extra cost to you, which funds our independent
            water quality research. Recommendations are based on real water data,
            not sponsorship.{" "}
          </>
        )}
        <Link href="/affiliate-disclosure" className="text-accent hover:underline">
          Full disclosure
        </Link>
      </p>
    </div>
  );
}

export function GuideFooter({
  reviewed,
  children,
}: {
  reviewed: string;
  children?: React.ReactNode;
}) {
  return (
    <footer className="mt-12 pb-4 text-sm text-faint leading-relaxed border-t border-rule pt-6">
      <p>
        Guide last reviewed {reviewed}. Prices are typical ranges, not quotes, and
        vary by region, installer and the size of the unit your household needs.{" "}
        {children}
        Water hardness figures come from water company compliance reports and the
        Environment Agency, covering 2,800 UK postcode districts.{" "}
        <Link
          href="/about/methodology"
          className="underline underline-offset-2 hover:text-muted transition-colors"
        >
          Our methodology
        </Link>
      </p>
    </footer>
  );
}

export function GuideFaq({ faqs }: { faqs: { question: string; answer: string }[] }) {
  return (
    <>
      <h2 className="font-display text-2xl italic text-ink mt-14 mb-6">
        Frequently asked questions
      </h2>
      <div className="space-y-6">
        {faqs.map((faq) => (
          <div key={faq.question}>
            <h3 className="font-semibold text-ink text-base">{faq.question}</h3>
            <p className="text-sm text-body leading-relaxed mt-2">{faq.answer}</p>
          </div>
        ))}
      </div>
    </>
  );
}
