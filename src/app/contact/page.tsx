import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbSchema } from "@/components/json-ld";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with TapWater.uk. For press enquiries, data corrections, water company feedback, or general questions about UK tap water quality.",
};

export default function ContactPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="max-w-2xl mx-auto">
        <BreadcrumbSchema
          items={[
            { name: "Home", url: "https://tapwater.uk" },
            { name: "Contact", url: "https://tapwater.uk/contact" },
          ]}
        />

        <nav className="text-sm text-muted mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5">
            <li><Link href="/" className="hover:text-accent transition-colors">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-ink" aria-current="page">Contact</li>
          </ol>
        </nav>

        <h1 className="text-3xl font-bold font-display italic text-ink mb-6">
          Get in touch
        </h1>

        <p className="text-base text-body leading-relaxed mb-8">
          TapWater.uk is an independent water quality research project. We
          aggregate publicly available data to help UK residents understand
          what&apos;s in their tap water.
        </p>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="font-display text-lg italic text-ink mb-2">
              General enquiries
            </h2>
            <p className="text-sm text-body mb-3">
              Questions about water quality data, methodology, or how we
              calculate scores.
            </p>
            <a
              href="mailto:hello@tapwater.uk"
              className="text-accent font-medium hover:underline"
            >
              hello@tapwater.uk
            </a>
          </div>

          <div className="card p-6">
            <h2 className="font-display text-lg italic text-ink mb-2">
              Press and media
            </h2>
            <p className="text-sm text-body mb-3">
              Journalist? Researcher? We&apos;re happy to provide data,
              commentary, and bespoke analysis for stories about UK water quality,
              PFAS, lead pipes, or related topics.
            </p>
            <a
              href="mailto:press@tapwater.uk"
              className="text-accent font-medium hover:underline"
            >
              press@tapwater.uk
            </a>
          </div>

          <div className="card p-6">
            <h2 className="font-display text-lg italic text-ink mb-2">
              Data corrections
            </h2>
            <p className="text-sm text-body mb-3">
              Spotted an error in our data? Water companies and regulators are
              welcome to flag any inaccuracies — we take data quality seriously
              and will investigate promptly.
            </p>
            <a
              href="mailto:data@tapwater.uk"
              className="text-accent font-medium hover:underline"
            >
              data@tapwater.uk
            </a>
          </div>

          <div className="card p-6">
            <h2 className="font-display text-lg italic text-ink mb-2">
              Partnerships
            </h2>
            <p className="text-sm text-body mb-3">
              Water filter manufacturers, testing laboratories, and environmental
              organisations interested in working with us.
            </p>
            <a
              href="mailto:partners@tapwater.uk"
              className="text-accent font-medium hover:underline"
            >
              partners@tapwater.uk
            </a>
          </div>
        </div>

        <div className="mt-10 p-6 bg-wash rounded-xl border border-rule">
          <h2 className="font-display text-lg italic text-ink mb-2">
            About TapWater.uk
          </h2>
          <p className="text-sm text-body leading-relaxed">
            We&apos;re an independent project — not affiliated with any water
            company, filter manufacturer, or government body. Our data comes from
            the{" "}
            <Link href="/about/data-sources" className="text-accent hover:underline">
              Stream Water Data Portal
            </Link>{" "}
            (real drinking water tests from UK water companies) and the
            Environment Agency Water Quality Archive. See our{" "}
            <Link href="/about/methodology" className="text-accent hover:underline">
              methodology
            </Link>{" "}
            for how we calculate scores.
          </p>
        </div>
      </div>
    </div>
  );
}
