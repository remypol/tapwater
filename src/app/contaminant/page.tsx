import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, AlertTriangle, ShieldCheck } from "lucide-react";
import { BreadcrumbSchema } from "@/components/json-ld";

export const metadata: Metadata = {
  title: "Contaminants in UK Tap Water — What's Being Tested",
  description:
    "Everything you need to know about contaminants found in UK drinking water: PFAS forever chemicals, lead, nitrate, chlorine, copper, fluoride, trihalomethanes, and E. coli. Health effects, legal limits, and how to remove them.",
  openGraph: {
    title: "Contaminants in UK Tap Water",
    description:
      "Health effects, legal limits, and removal methods for all major contaminants in UK drinking water.",
    url: "https://www.tapwater.uk/contaminant/",
    type: "website",
  },
};

const CONTAMINANT_CARDS = [
  {
    slug: "pfas",
    name: "PFAS (Forever Chemicals)",
    tagline: "No UK legal limit",
    danger: true,
    description: "Man-made chemicals that don't break down. Linked to cancer, immune disruption, and thyroid problems. The UK has no legal limit despite EU and WHO guidelines.",
  },
  {
    slug: "lead",
    name: "Lead",
    tagline: "UK limit: 0.01 mg/L",
    danger: true,
    description: "Neurotoxin with no safe exposure level. Mainly from old pipes in pre-1970 homes. Affects children's cognitive development even at low levels.",
  },
  {
    slug: "trihalomethanes",
    name: "Trihalomethanes (THMs)",
    tagline: "UK limit: 0.1 mg/L",
    danger: false,
    description: "Disinfection byproducts formed when chlorine reacts with organic matter. Linked to bladder cancer risk. Higher in areas using surface water.",
  },
  {
    slug: "nitrate",
    name: "Nitrate",
    tagline: "UK limit: 50 mg/L",
    danger: false,
    description: "From agricultural fertiliser runoff. Dangerous for infants under 3 months (blue baby syndrome). Elevated in farming regions.",
  },
  {
    slug: "ecoli",
    name: "E. coli",
    tagline: "Zero tolerance",
    danger: true,
    description: "Indicator of faecal contamination. Any detection in treated water triggers immediate investigation. UK regulation requires zero presence.",
  },
  {
    slug: "fluoride",
    name: "Fluoride",
    tagline: "UK limit: 1.5 mg/L",
    danger: false,
    description: "Added to ~10% of English water supplies. Prevents tooth decay but excess causes dental fluorosis. Naturally present in some regions.",
  },
  {
    slug: "chlorine",
    name: "Chlorine",
    tagline: "UK limit: 5 mg/L (residual)",
    danger: false,
    description: "Added as disinfectant to kill bacteria. Safe at UK levels but creates byproducts (THMs). Can affect taste and smell.",
  },
  {
    slug: "copper",
    name: "Copper",
    tagline: "UK limit: 2 mg/L",
    danger: false,
    description: "Mainly from copper plumbing. High levels cause nausea and stomach cramps. More common in new-build properties with soft water.",
  },
];

export default function ContaminantsPage() {
  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 py-8 lg:py-12">
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Contaminants", url: "https://www.tapwater.uk/contaminant/" },
        ]}
      />

      <nav className="text-sm text-muted mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5">
          <li><Link href="/" className="hover:text-accent transition-colors">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li className="font-medium text-ink" aria-current="page">Contaminants</li>
        </ol>
      </nav>

      <h1 className="font-display text-3xl sm:text-4xl text-ink italic tracking-tight mb-3">
        What&apos;s in UK tap water?
      </h1>
      <p className="text-muted max-w-2xl mb-10">
        UK water companies test for over 100 regulated parameters. These are the
        contaminants that matter most — what they are, where they come from, and
        whether your water is affected.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CONTAMINANT_CARDS.map((item) => (
          <Link
            key={item.slug}
            href={`/contaminant/${item.slug}/`}
            className="card p-5 group block hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <h2 className="font-display text-lg text-ink italic group-hover:text-accent transition-colors">
                {item.name}
              </h2>
              {item.danger ? (
                <AlertTriangle className="w-4 h-4 text-danger shrink-0 mt-1" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-safe shrink-0 mt-1" />
              )}
            </div>
            <p className="text-xs text-faint font-data uppercase tracking-wider mb-2">
              {item.tagline}
            </p>
            <p className="text-sm text-body leading-relaxed">
              {item.description}
            </p>
            <div className="mt-3 flex items-center text-xs text-accent font-medium">
              Learn more
              <ChevronRight className="w-3 h-3 ml-0.5" />
            </div>
          </Link>
        ))}
      </div>

      <section className="mt-12 card p-6">
        <h2 className="font-display text-xl text-ink italic mb-3">
          Check your area
        </h2>
        <p className="text-sm text-body mb-4">
          Enter your postcode to see which contaminants have been detected in your
          local water supply, with real test results from your water company.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
        >
          Search by postcode
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </section>

      <footer className="mt-10 text-sm text-faint leading-relaxed">
        Data from the Stream Water Data Portal (drinking water tests) and the
        Environment Agency (environmental monitoring). See our{" "}
        <Link href="/about/methodology" className="underline underline-offset-2 hover:text-muted transition-colors">
          methodology
        </Link>{" "}
        for details.
      </footer>
    </div>
  );
}
