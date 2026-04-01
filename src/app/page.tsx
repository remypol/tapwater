import { Fragment } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { PostcodeSearch } from "@/components/postcode-search";
import { MOST_CHECKED, MOCK_SUPPLIERS } from "@/lib/mock-data";
import { getPostcodeData, getAllPostcodeDistricts, getMapPostcodes } from "@/lib/data";
import { LazyMap } from "@/components/lazy-map";
import { getScoreColor } from "@/lib/types";
import type { PostcodeData } from "@/lib/types";
import {
  Activity,
  ChevronRight,
  AlertTriangle,
  ShieldCheck,
  Building2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "TapWater.uk — Check Your Tap Water Quality by Postcode",
  description:
    "Free water quality reports for every UK postcode. Check PFAS, lead, nitrate and 48 other contaminants. Based on Environment Agency and Drinking Water Inspectorate data.",
  openGraph: {
    title: "What's in your tap water?",
    description:
      "Free water quality reports for every UK postcode. Check PFAS, lead, nitrate and more.",
    url: "https://tapwater.uk",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TapWater.uk — Is Your Tap Water Safe?",
    description: "Free water quality reports for every UK postcode.",
  },
};

const TRUST_METRICS = [
  { value: "2,979", label: "Postcode areas" },
  { value: "58M+", label: "Measurements" },
  { value: "50+", label: "PFAS compounds" },
  { value: "Daily", label: "Updates" },
];

function scoreBadgeClass(score: number): string {
  const c = getScoreColor(score);
  if (c === "safe") return "badge badge-safe";
  if (c === "warning") return "badge badge-warning";
  return "badge badge-danger";
}

function scoreTextClass(score: number): string {
  const c = getScoreColor(score);
  if (c === "safe") return "text-safe";
  if (c === "warning") return "text-warning";
  return "text-danger";
}

function buildRankedPostcodes(): {
  worst: PostcodeData[];
  best: PostcodeData[];
} {
  const districts = getAllPostcodeDistricts();

  const all: PostcodeData[] = [];
  for (const d of districts) {
    const data = getPostcodeData(d);
    if (data && data.safetyScore >= 0) {
      all.push(data);
    }
  }

  all.sort((a, b) => a.safetyScore - b.safetyScore);

  return {
    worst: all.slice(0, 5),
    best: all.slice(-5).reverse(),
  };
}

export default function HomePage() {
  const { worst, best } = buildRankedPostcodes();

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">

      {/* Hero */}
      <section className="bg-hero noise-overlay pt-20 pb-16 lg:pt-28 lg:pb-20 -mx-5 sm:-mx-6 lg:-mx-8 px-5 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <p className="animate-fade-up delay-1 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-accent font-semibold">
            <Activity className="w-3.5 h-3.5" />
            UK Water Quality Data
          </p>

          <h1 className="animate-fade-up delay-2 font-display text-4xl sm:text-5xl lg:text-6xl text-ink tracking-tight italic mt-4">
            What&apos;s in your tap water?
          </h1>

          <p className="animate-fade-up delay-3 text-lg text-muted mt-4 max-w-lg mx-auto leading-relaxed">
            Independent reports for every UK postcode, based on government monitoring data.
          </p>

          <div className="animate-fade-up delay-4 max-w-xl mx-auto mt-8">
            <PostcodeSearch size="lg" />
          </div>
        </div>
      </section>

      {/* Trust metrics */}
      <div className="mt-16 max-w-3xl mx-auto">
        <div className="flex flex-wrap justify-center items-center gap-y-4">
          {TRUST_METRICS.map(({ value, label }, i) => (
            <Fragment key={label}>
              {i > 0 && (
                <div className="hidden lg:block h-10 w-px bg-rule" />
              )}
              <div
                className={`animate-fade-up delay-${i + 1} flex flex-col items-center px-6 lg:px-10`}
              >
                <span className="font-data text-2xl lg:text-3xl font-bold text-ink">
                  {value}
                </span>
                <span className="text-xs text-faint uppercase tracking-wider mt-1">
                  {label}
                </span>
              </div>
            </Fragment>
          ))}
        </div>
      </div>

      {/* Interactive Map */}
      <section className="mt-20">
        <h2 className="font-display text-2xl text-ink italic">
          Water quality across the UK
        </h2>
        <p className="text-sm text-muted mt-1 mb-4">
          Click any marker to see the full water quality report for that area.
        </p>
        <LazyMap postcodes={getMapPostcodes()} />
      </section>

      {/* Areas of concern */}
      <section className="mt-20">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="w-4 h-4 text-danger shrink-0" />
          <h2 className="font-display text-2xl text-ink italic">
            Areas of concern
          </h2>
        </div>
        <p className="text-sm text-muted mt-1 mb-5">
          Postcodes with the lowest water quality scores based on current monitoring data.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {worst.map((item) => {
            const flagged = item.readings.find((r) => r.status !== "pass");
            return (
              <Link
                key={item.district}
                href={`/postcode/${item.district}/`}
                className="card p-4 group block"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-data font-bold text-sm text-ink">
                        {item.district}
                      </span>
                      <span className="text-sm text-muted truncate">
                        {item.areaName}
                      </span>
                    </div>
                    {flagged && (
                      <p className="text-xs text-muted mt-1.5 truncate">
                        <span className="text-danger font-medium">{flagged.name}</span>
                        {" "}detected at{" "}
                        <span className="font-data">
                          {flagged.value} {flagged.unit}
                        </span>
                      </p>
                    )}
                    {!flagged && item.contaminantsFlagged === 0 && (
                      <p className="text-xs text-muted mt-1.5">
                        Low score based on multiple readings
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <span className={`font-data text-lg font-bold leading-none ${scoreTextClass(item.safetyScore)}`}>
                      {item.safetyScore.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-faint uppercase tracking-wider">/10</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-rule">
                  <span className="text-xs text-faint">{item.city}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-faint group-hover:text-accent transition" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Highest rated areas */}
      <section className="mt-12">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-safe shrink-0" />
          <h2 className="font-display text-2xl text-ink italic">
            Highest rated areas
          </h2>
        </div>
        <p className="text-sm text-muted mt-1 mb-5">
          Postcodes with the cleanest water quality scores in our dataset.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {best.map((item) => (
            <Link
              key={item.district}
              href={`/postcode/${item.district}/`}
              className="card p-4 group block"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-data font-bold text-sm text-ink">
                      {item.district}
                    </span>
                    <span className="text-sm text-muted truncate">
                      {item.areaName}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-1.5">
                    {item.contaminantsFlagged === 0
                      ? "No contaminants flagged"
                      : `${item.contaminantsFlagged} contaminant${item.contaminantsFlagged !== 1 ? "s" : ""} flagged`}
                    {" — "}
                    {item.contaminantsTested} tested
                  </p>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <span className={`font-data text-lg font-bold leading-none ${scoreTextClass(item.safetyScore)}`}>
                    {item.safetyScore.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-faint uppercase tracking-wider">/10</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-rule">
                <span className="text-xs text-faint">{item.city}</span>
                <ChevronRight className="w-3.5 h-3.5 text-faint group-hover:text-accent transition" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Most checked postcodes */}
      <section className="mt-16">
        <h2 className="font-display text-xl text-ink italic mb-4">
          Most checked areas
        </h2>

        <div className="flex flex-col gap-2">
          {MOST_CHECKED.map((district) => {
            const data = getPostcodeData(district);
            return (
              <Link
                key={district}
                href={`/postcode/${district}/`}
                className="card px-4 py-3 group flex items-center gap-3"
              >
                <span className="font-data font-bold text-sm text-ink w-12 shrink-0">
                  {district}
                </span>
                <span className="text-sm text-muted flex-1 truncate">
                  {data?.areaName ?? ""}
                </span>
                {data && data.safetyScore >= 0 ? (
                  <span className={`${scoreBadgeClass(data.safetyScore)} font-data shrink-0`}>
                    {data.safetyScore.toFixed(1)}
                  </span>
                ) : (
                  <span className="badge shrink-0 bg-rule text-faint">
                    N/A
                  </span>
                )}
                <ChevronRight className="w-3.5 h-3.5 text-faint group-hover:text-accent transition shrink-0" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Water suppliers */}
      <section className="mt-16 mb-20">
        <h2 className="font-display text-xl text-ink italic">
          Water suppliers
        </h2>
        <p className="text-sm text-muted mt-1 mb-4">
          We track data from all major UK water companies
        </p>

        <div className="card divide-y divide-rule">
          {MOCK_SUPPLIERS.map((supplier) => (
            <Link
              key={supplier.id}
              href={`/supplier/${supplier.id}/`}
              className="flex items-center gap-3 px-4 py-3 group hover:bg-wash transition-colors first:rounded-t-xl last:rounded-b-xl"
            >
              <Building2 className="w-4 h-4 text-faint shrink-0" />
              <span className="font-medium text-sm text-ink group-hover:text-accent transition flex-1">
                {supplier.name}
              </span>
              <span className="text-xs text-faint hidden sm:block">
                {supplier.region}
              </span>
              <span className="text-xs text-faint font-data ml-3 shrink-0">
                {supplier.customersM}M customers
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-faint group-hover:text-accent transition shrink-0" />
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
