import type { Metadata } from "next";
import Link from "next/link";
import { Building2, ChevronRight, MapPin } from "lucide-react";

import { MOCK_SUPPLIERS } from "@/lib/mock-data";
import { getPostcodeData } from "@/lib/data";
import { getScoreColor } from "@/lib/types";
import { BreadcrumbSchema } from "@/components/json-ld";

export const metadata: Metadata = {
  title: "UK Water Companies — Water Quality by Supplier | TapWater.uk",
  description:
    "Compare water quality scores across all 16 major UK water companies. See which supplier has the best and worst tap water, coverage areas, and detailed postcode reports.",
  openGraph: {
    title: "UK Water Companies — Water Quality Comparison",
    description:
      "Compare water quality scores across all 16 major UK water companies.",
    url: "https://tapwater.uk/supplier/",
    type: "website",
  },
};

function scoreTextClass(score: number): string {
  const c = getScoreColor(score);
  if (c === "safe") return "text-[var(--color-safe)]";
  if (c === "warning") return "text-[var(--color-warning)]";
  return "text-[var(--color-danger)]";
}

export default async function SuppliersPage() {
  // Compute average scores for each supplier
  const supplierData = await Promise.all(
    MOCK_SUPPLIERS.map(async (supplier) => {
      const scores: number[] = [];
      let streamCount = 0;
      for (const area of supplier.postcodeAreas) {
        const data = await getPostcodeData(area);
        if (data && data.safetyScore >= 0) {
          scores.push(data.safetyScore);
          if (data.dataSource === "stream") streamCount++;
        }
      }
      const avgScore =
        scores.length > 0
          ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
          : null;
      return { ...supplier, avgScore, scoredAreas: scores.length, streamCount };
    }),
  );

  // Sort by average score (best first), nulls last
  supplierData.sort((a, b) => {
    if (a.avgScore === null && b.avgScore === null) return 0;
    if (a.avgScore === null) return 1;
    if (b.avgScore === null) return -1;
    return b.avgScore - a.avgScore;
  });

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 py-8 lg:py-12">
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://tapwater.uk" },
          { name: "Water Companies", url: "https://tapwater.uk/supplier/" },
        ]}
      />

      <nav className="text-sm text-muted mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5">
          <li><Link href="/" className="hover:text-accent transition-colors">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li className="font-medium text-ink" aria-current="page">Water Companies</li>
        </ol>
      </nav>

      <h1 className="font-display text-3xl sm:text-4xl text-ink italic tracking-tight mb-3">
        UK Water Companies
      </h1>
      <p className="text-muted max-w-2xl mb-10">
        All {MOCK_SUPPLIERS.length} major UK water companies ranked by average water
        quality score. Click any company to see detailed postcode-level data.
      </p>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-rule bg-wash">
              <th className="text-left px-4 py-3 text-xs uppercase tracking-[0.1em] text-faint font-semibold">#</th>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-[0.1em] text-faint font-semibold">Company</th>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-[0.1em] text-faint font-semibold hidden sm:table-cell">Region</th>
              <th className="text-right px-4 py-3 text-xs uppercase tracking-[0.1em] text-faint font-semibold hidden md:table-cell">Customers</th>
              <th className="text-right px-4 py-3 text-xs uppercase tracking-[0.1em] text-faint font-semibold">Avg Score</th>
              <th className="text-right px-4 py-3 text-xs uppercase tracking-[0.1em] text-faint font-semibold hidden sm:table-cell">Areas</th>
            </tr>
          </thead>
          <tbody>
            {supplierData.map((supplier, i) => (
              <tr
                key={supplier.id}
                className="border-b border-rule last:border-0 hover:bg-wash transition-colors"
              >
                <td className="px-4 py-3.5 text-faint font-data">{i + 1}</td>
                <td className="px-4 py-3.5">
                  <Link
                    href={`/supplier/${supplier.id}/`}
                    className="group flex items-center gap-2"
                  >
                    <Building2 className="w-4 h-4 text-faint shrink-0" />
                    <span className="font-medium text-ink group-hover:text-accent transition-colors">
                      {supplier.name}
                    </span>
                    <ChevronRight className="w-3 h-3 text-faint opacity-0 group-hover:opacity-100 transition" />
                  </Link>
                </td>
                <td className="px-4 py-3.5 text-muted hidden sm:table-cell">{supplier.region}</td>
                <td className="px-4 py-3.5 text-right font-data text-muted hidden md:table-cell">
                  {supplier.customersM}M
                </td>
                <td className="px-4 py-3.5 text-right">
                  {supplier.avgScore !== null ? (
                    <span className={`font-data font-bold ${scoreTextClass(supplier.avgScore)}`}>
                      {supplier.avgScore}
                      <span className="text-faint font-normal text-xs">/10</span>
                    </span>
                  ) : (
                    <span className="text-faint text-xs">No data</span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-right font-data text-muted hidden sm:table-cell">
                  {supplier.scoredAreas}
                  {supplier.streamCount > 0 && (
                    <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-safe" title="Has drinking water test data" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex items-center gap-4 text-xs text-faint">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-safe" />
          Drinking water test data available
        </span>
      </div>

      <footer className="mt-10 text-sm text-faint leading-relaxed">
        Scores are based on drinking water quality tests where available, supplemented
        by Environment Agency environmental monitoring. See our{" "}
        <Link href="/about/methodology" className="underline underline-offset-2 hover:text-muted transition-colors">
          methodology
        </Link>{" "}
        for how scores are calculated.
      </footer>
    </div>
  );
}
