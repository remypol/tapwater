import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbSchema } from "@/components/json-ld";
import { REGIONS } from "@/lib/regions";
import { PartnerSignupForm } from "@/components/partner-signup-form";

export const revalidate = 86400;

const year = new Date().getFullYear();

export function generateMetadata(): Metadata {
  return {
    title: "Partner With TapWater.uk",
    description:
      "Get qualified water softener leads from homeowners in hard water areas. Join our installer partner network.",
    alternates: {
      canonical: "https://www.tapwater.uk/partners",
    },
    openGraph: {
      title: "Partner With TapWater.uk",
      description:
        "Get qualified water softener leads from homeowners in hard water areas. Join our installer partner network.",
      url: "https://www.tapwater.uk/partners",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: "Partner With TapWater.uk",
      description:
        "Get qualified water softener leads from homeowners in hard water areas. Join our installer partner network.",
    },
  };
}

export default function PartnersPage() {
  const regionNames = REGIONS.map((r) => r.name);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* ── Schema markup ──────────────────────────────────────────── */}
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          {
            name: "Partners",
            url: "https://www.tapwater.uk/partners",
          },
        ]}
      />

      <div className="max-w-3xl mx-auto">
        {/* ── Breadcrumb nav ─────────────────────────────────────── */}
        <nav className="text-sm text-muted mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-accent transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-ink" aria-current="page">
              Partners
            </li>
          </ol>
        </nav>

        {/* ── Hero ───────────────────────────────────────────────── */}
        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          Get qualified water softener leads in your area
        </h1>
        <div className="flex items-center gap-2 mt-3 mb-8 text-sm text-muted">
          <span>
            By <span className="text-ink font-medium">Remy</span>
          </span>
          <span>&middot;</span>
          <span>Updated April {year}</span>
        </div>

        {/* ── Value proposition callout ───────────────────────────── */}
        <div className="card p-6 mb-10 border-l-4 border-l-accent">
          <p className="text-base text-body leading-relaxed">
            <strong className="text-ink">
              We connect homeowners in hard water areas with trusted local
              installers.
            </strong>{" "}
            Our postcode-level water data identifies households most likely to
            need a water softener. When they request quotes, we forward
            their details directly to partner installers in the area.
          </p>
        </div>

        {/* ── How it works ───────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-12 mb-6">
          How it works
        </h2>
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
              <span className="font-data text-sm font-bold text-accent">1</span>
            </div>
            <div>
              <p className="font-semibold text-ink">Homeowner checks their water</p>
              <p className="text-sm text-body mt-1 leading-relaxed">
                A visitor enters their postcode on TapWater.uk and sees their
                local water hardness level. If it&apos;s hard or very hard, they
                can request a free water softener assessment.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
              <span className="font-data text-sm font-bold text-accent">2</span>
            </div>
            <div>
              <p className="font-semibold text-ink">We match them to your coverage area</p>
              <p className="text-sm text-body mt-1 leading-relaxed">
                Our system checks the lead&apos;s postcode against your
                registered coverage areas and forwards qualified leads to up to
                3 matching installers.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
              <span className="font-data text-sm font-bold text-accent">3</span>
            </div>
            <div>
              <p className="font-semibold text-ink">You contact the homeowner</p>
              <p className="text-sm text-body mt-1 leading-relaxed">
                You receive the lead by email with full contact details and
                hardness data. Contact the homeowner within 24 hours to arrange a
                site visit or quote.
              </p>
            </div>
          </div>
        </div>

        {/* ── Stats ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12">
          <div className="card p-5 text-center">
            <p className="text-xs text-faint uppercase tracking-wider">
              Postcodes covered
            </p>
            <p className="font-data text-2xl font-bold text-ink mt-1">
              2,800+
            </p>
            <p className="text-sm text-muted mt-1">UK postcode districts</p>
          </div>
          <div className="card p-5 text-center">
            <p className="text-xs text-faint uppercase tracking-wider">
              Hard water coverage
            </p>
            <p className="font-data text-2xl font-bold text-ink mt-1">
              60% of England
            </p>
            <p className="text-sm text-muted mt-1">Has hard or very hard water</p>
          </div>
          <div className="card p-5 text-center">
            <p className="text-xs text-faint uppercase tracking-wider">
              Data freshness
            </p>
            <p className="font-data text-2xl font-bold text-ink mt-1">
              Daily updates
            </p>
            <p className="text-sm text-muted mt-1">
              From water company reports
            </p>
          </div>
        </div>

        {/* ── Partner signup form ─────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Register as an installer partner
        </h2>
        <p className="text-base text-body leading-relaxed mb-6">
          Fill in the form below and we&apos;ll get back to you within 48 hours
          to discuss lead volumes and pricing for your area.
        </p>

        <PartnerSignupForm regionNames={regionNames} />

        {/* ── Footer ─────────────────────────────────────────────── */}
        <footer className="mt-12 pb-4 text-sm text-faint leading-relaxed border-t border-rule pt-6">
          <p>
            TapWater.uk partner programme. Water hardness data sourced from
            the Environment Agency and water company compliance reports
            covering 2,800 UK postcode districts.{" "}
            <Link
              href="/about/methodology"
              className="underline underline-offset-2 hover:text-muted transition-colors"
            >
              Our methodology
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
