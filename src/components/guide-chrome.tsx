import Link from "next/link";

/**
 * The repeated furniture of a guide page: breadcrumb, byline, affiliate
 * disclosure and footer. Each guide still owns its own body and schema.
 */

export function GuideBreadcrumb({ title }: { title: string }) {
  return (
    <nav className="wt-crumbs" style={{ paddingBlock: 0, marginBottom: 32 }} aria-label="Breadcrumb">
      <Link href="/">Home</Link>
      <span aria-hidden="true">/</span>
      <Link href="/guides">Guides</Link>
      <span aria-hidden="true">/</span>
      <span aria-current="page">{title}</span>
    </nav>
  );
}

export function GuideByline({ updated }: { updated: string }) {
  return (
    <p className="wt-byline" style={{ marginBottom: 40 }}>
      By <strong>TapWater.uk Research</strong> · Updated {updated} · Independent research
    </p>
  );
}

export function GuideDisclosure({ quotes = false }: { quotes?: boolean }) {
  return (
    <div className="wt-fine" style={{ margin: "24px 0 40px", opacity: 1, color: "var(--color-muted)" }}>
      <p>
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
      <section className="wt-faq" style={{ paddingBlock: "56px 0" }}>
        <h2 className="wt-h2">Frequently asked questions</h2>
        {faqs.map((faq, i) => (
          <details key={faq.question} open={i === 0}>
            <summary>{faq.question}</summary>
            <p>{faq.answer}</p>
          </details>
        ))}
      </section>
    </>
  );
}
