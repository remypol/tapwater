import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { BreadcrumbSchema } from "@/components/json-ld";

export const revalidate = 86400;

export function generateMetadata(): Metadata {
  return {
    title: "Embed Water Quality Widget",
    description:
      "Add live UK water quality scores to your website with one line of code. Free, auto-updating widget for property listings and blogs.",
    alternates: {
      canonical: "https://www.tapwater.uk/widget",
    },
    openGraph: {
      title: "Embed Water Quality Widget",
      description:
        "Add live UK water quality scores to your website with one line of code. Free, auto-updating widget for property listings and blogs.",
      url: "https://www.tapwater.uk/widget",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: "Embed Water Quality Widget",
      description:
        "Add live UK water quality scores to your website with one line of code. Free, auto-updating widget for property listings and blogs.",
    },
  };
}

export default function WidgetPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* ── Schema markup ──────────────────────────────────────────── */}
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          {
            name: "Widget",
            url: "https://www.tapwater.uk/widget",
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
              Widget
            </li>
          </ol>
        </nav>

        {/* ── Hero ───────────────────────────────────────────────── */}
        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          Embed water quality data on your site
        </h1>
        <p className="mt-4 mb-8 text-base text-body leading-relaxed">
          Add live water quality scores to your property listing, blog, or
          community website. Free, auto-updating, one line of code.
        </p>

        {/* ── How to use ─────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-12 mb-6">
          How to use
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          Copy and paste the snippet below into your HTML. Replace{" "}
          <code className="text-sm bg-surface px-1.5 py-0.5 rounded font-mono">
            SW1A
          </code>{" "}
          with any UK postcode district.
        </p>

        <div className="card p-5 mb-10">
          <pre className="text-sm font-mono text-ink overflow-x-auto leading-relaxed">
{`<div data-tapwater-postcode="SW1A"></div>
<script src="https://www.tapwater.uk/widget.js" async></script>`}
          </pre>
        </div>

        <p className="text-sm text-muted leading-relaxed mb-10">
          The script finds every element with a{" "}
          <code className="text-xs bg-surface px-1 py-0.5 rounded font-mono">
            data-tapwater-postcode
          </code>{" "}
          attribute and injects a styled card showing the water quality score,
          grade, and number of contaminants tested. You can place multiple
          widgets on the same page with different postcodes.
        </p>

        {/* ── Live preview ───────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-12 mb-6">
          Preview
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          Here is a live widget for the SW1A postcode district (Westminster):
        </p>

        <div className="mb-10">
          <div data-tapwater-postcode="SW1A" />
          <Script
            src="https://www.tapwater.uk/widget.js"
            strategy="lazyOnload"
          />
        </div>

        {/* ── Who uses this ──────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-12 mb-6">
          Who uses this
        </h2>
        <div className="space-y-4 mb-10">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
              <span className="font-data text-sm font-bold text-accent">1</span>
            </div>
            <div>
              <p className="font-semibold text-ink">Estate agents</p>
              <p className="text-sm text-body mt-1 leading-relaxed">
                Show water quality alongside property details to give buyers
                extra confidence in the area.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
              <span className="font-data text-sm font-bold text-accent">2</span>
            </div>
            <div>
              <p className="font-semibold text-ink">Landlords</p>
              <p className="text-sm text-body mt-1 leading-relaxed">
                Add transparency to rental listings by displaying local tap
                water safety scores.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
              <span className="font-data text-sm font-bold text-accent">3</span>
            </div>
            <div>
              <p className="font-semibold text-ink">Property portals</p>
              <p className="text-sm text-body mt-1 leading-relaxed">
                Enrich area guides with live water quality data that updates
                automatically.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
              <span className="font-data text-sm font-bold text-accent">4</span>
            </div>
            <div>
              <p className="font-semibold text-ink">Local council websites</p>
              <p className="text-sm text-body mt-1 leading-relaxed">
                Provide residents with at-a-glance water safety information
                for their area.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
              <span className="font-data text-sm font-bold text-accent">5</span>
            </div>
            <div>
              <p className="font-semibold text-ink">Community blogs</p>
              <p className="text-sm text-body mt-1 leading-relaxed">
                Give readers local water quality context in neighbourhood
                guides and area reviews.
              </p>
            </div>
          </div>
        </div>

        {/* ── Customisation note ─────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-12 mb-6">
          Customisation
        </h2>
        <div className="card p-6 mb-10 border-l-4 border-l-accent">
          <p className="text-base text-body leading-relaxed">
            The widget auto-detects the postcode from the{" "}
            <code className="text-sm bg-surface px-1 py-0.5 rounded font-mono">
              data-tapwater-postcode
            </code>{" "}
            attribute and pulls live data from our API. Scores, grades, and
            contaminant counts update automatically as new data becomes
            available. No API key required.
          </p>
        </div>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <footer className="mt-12 pb-4 text-sm text-faint leading-relaxed border-t border-rule pt-6">
          <p>
            TapWater.uk embeddable widget. Water quality data sourced from the
            Drinking Water Inspectorate, Environment Agency, and water company
            compliance reports covering 2,800 UK postcode districts.{" "}
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
