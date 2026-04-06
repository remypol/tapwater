import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PostcodeSearch } from "@/components/postcode-search";
import { BreadcrumbSchema } from "@/components/json-ld";
import { CATEGORY_META, CATEGORY_ORDER, getProductsByCategory } from "@/lib/products";

export const metadata: Metadata = {
  title: "Water Filters — Find the Right One for Your Area",
  description:
    "Compare water filters matched to UK water quality data. Jugs, under-sink, reverse osmosis, whole-house, shower filters, and testing kits — with prices, specs, and independent recommendations.",
  alternates: { canonical: "https://www.tapwater.uk/filters" },
  openGraph: {
    title: "Water Filters — Find the Right One for Your Area",
    description:
      "Compare water filters matched to UK water quality data. Jugs, under-sink, reverse osmosis, whole-house, shower filters, and testing kits — with prices, specs, and independent recommendations.",
    url: "https://www.tapwater.uk/filters",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Water Filters — Find the Right One for Your Area",
    description:
      "Compare water filters matched to UK water quality data. Jugs, under-sink, reverse osmosis, whole-house, shower filters, and testing kits — with prices, specs, and independent recommendations.",
  },
};

export default function FiltersHubPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Filters", url: "https://www.tapwater.uk/filters" },
        ]}
      />
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="font-display text-3xl sm:text-4xl text-ink italic tracking-tight">
          Find the right water filter
        </h1>
        <p className="text-body mt-3 max-w-2xl text-lg">
          Not sure where to start? Enter your postcode and we&apos;ll recommend
          a filter based on what&apos;s actually in your water.
        </p>
        <div className="mt-6 max-w-md">
          <PostcodeSearch />
        </div>
        <p className="text-sm text-faint mt-4">
          Recommendations based on 1.6 million water quality readings across 2,800 UK postcodes.
        </p>
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {CATEGORY_ORDER.map((cat) => {
            const meta = CATEGORY_META[cat];
            const count = getProductsByCategory(cat).length;
            return (
              <Link
                key={cat}
                href={`/filters/${meta.slug}`}
                className="card p-5 group hover:border-accent/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-display text-lg text-ink italic group-hover:text-accent transition-colors">
                      {meta.title}
                    </h2>
                    <p className="text-sm text-body mt-1">{meta.description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-faint group-hover:text-accent transition-colors shrink-0 mt-1" />
                </div>
                <div className="mt-3 flex gap-3 text-xs text-muted">
                  <span>{count} products</span>
                  <span>{meta.priceRange}</span>
                </div>
              </Link>
            );
          })}
        </div>
        <p className="text-xs text-faint mt-8">
          We may earn a commission when you buy through our links, at no extra cost to you.
          Recommendations are based on water quality data, not sponsorship.{" "}
          <Link href="/affiliate-disclosure" className="text-accent hover:underline">
            Affiliate disclosure
          </Link>
        </p>
      </div>
    </>
  );
}
