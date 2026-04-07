import { Fragment } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { PostcodeSearch } from "@/components/postcode-search";
import { MOST_CHECKED } from "@/lib/mock-data";
import { getPostcodeData, getSuppliersList, getTrustMetrics, getRankedPostcodes } from "@/lib/data";
import { HomepageMap } from "@/components/homepage-map";
import { getScoreColor } from "@/lib/types";
import type { PostcodeData } from "@/lib/types";
import {
  ChevronRight,
  AlertTriangle,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { WaterSurface } from "@/components/water-surface";
import { REGIONS } from "@/lib/regions";

export const metadata: Metadata = {
  title: "TapWater.uk — Check Your Tap Water Quality by Postcode",
  description:
    "Free water quality reports for every UK postcode. Check PFAS, lead, nitrate and 100+ other contaminants. Based on real drinking water tests and Environment Agency monitoring.",
  openGraph: {
    title: "What's in your tap water?",
    description:
      "Free water quality reports for every UK postcode. Check PFAS, lead, nitrate and more.",
    url: "https://www.tapwater.uk",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TapWater.uk — Is Your Tap Water Safe?",
    description: "Free water quality reports for every UK postcode.",
  },
};

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

export default async function HomePage() {
  // All queries run in parallel — no N+1 loading
  const [{ worst, best }, suppliers, TRUST_METRICS, popularSearches] =
    await Promise.all([
      getRankedPostcodes(),
      getSuppliersList(),
      getTrustMetrics(),
      Promise.all(
        MOST_CHECKED.map(async (district) => ({
          district,
          data: await getPostcodeData(district),
        })),
      ).then((rows) =>
        rows
          .filter(
            (row): row is { district: string; data: PostcodeData } =>
              row.data !== null && row.data.safetyScore >= 0,
          )
          .slice(0, 6),
      ),
    ]);

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">

      {/* Hero */}
      <section className="bg-hero noise-overlay pt-12 pb-10 lg:pt-16 lg:pb-12 -mx-5 sm:-mx-6 lg:-mx-8 px-5 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="animate-fade-up delay-1 font-display text-4xl sm:text-5xl lg:text-6xl text-ink tracking-tight italic">
            What&apos;s in your tap water?
          </h1>

          <p className="animate-fade-up delay-2 text-lg text-muted mt-4 max-w-lg mx-auto leading-relaxed">
            Free reports for every UK postcode, based on real drinking water tests.
          </p>

          <div className="animate-fade-up delay-3 max-w-xl mx-auto mt-8">
            <PostcodeSearch size="lg" />
          </div>

          {/* GEO: Crawlable summary — visually subtle, semantically rich */}
          <p className="text-sm text-muted mt-4 max-w-lg mx-auto">
            Independent water quality reports for every UK postcode. Scores based
            on real drinking water tests from UK water companies and Environment
            Agency monitoring of 100+ contaminants.
          </p>
        </div>
      </section>

      {/* Water surface — flowing transition from hero */}
      <div className="-mx-5 sm:-mx-6 lg:-mx-8">
        <WaterSurface />
      </div>

      {/* Trust metrics */}
      <div className="mt-8 max-w-3xl mx-auto">
        <div className="flex flex-wrap justify-center items-center gap-y-4">
          {TRUST_METRICS.map(({ value, label }, i) => (
            <Fragment key={label}>
              {i > 0 && (
                <div className="hidden lg:block h-10 w-px bg-rule" />
              )}
              <div
                className={`animate-fade-up ${["delay-1", "delay-2", "delay-3", "delay-4"][i]} flex flex-col items-center px-6 lg:px-10`}
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
      <section className="mt-10">
        <div className="text-center mb-4">
          <h2 className="font-display text-2xl text-ink italic">
            Water quality across the UK
          </h2>
          <p className="text-sm text-muted mt-1">
            Tap a region to explore water quality data for that area.
          </p>
        </div>
        <HomepageMap />
      </section>

      {/* Areas to watch + Cleanest water — side by side on desktop */}
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Areas to watch */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-danger shrink-0" />
            <h2 className="font-display text-2xl text-ink italic">
              Areas to watch
            </h2>
          </div>
          <p className="text-sm text-muted mt-1 mb-5">
            These areas had the most issues in recent water tests.
          </p>

          <div className="flex flex-col gap-3">
            {worst.map((item) => {
              const flagged = item.readings.find((r) => r.status !== "pass");
              return (
                <Link
                  key={item.district}
                  href={`/postcode/${item.district}`}
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

        {/* Cleanest water */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-safe shrink-0" />
            <h2 className="font-display text-2xl text-ink italic">
              Cleanest water
            </h2>
          </div>
          <p className="text-sm text-muted mt-1 mb-5">
            These areas scored highest in our checks.
          </p>

          <div className="flex flex-col gap-3">
            {best.map((item) => (
              <Link
                key={item.district}
                href={`/postcode/${item.district}`}
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

      </div>

      {/* Popular searches */}
      <section className="mt-12">
        <h2 className="font-display text-xl text-ink italic mb-4">
          Popular searches
        </h2>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
          {popularSearches.map(({ district, data }) => (
              <Link
                key={district}
                href={`/postcode/${district}`}
                className="card px-4 py-3 group flex items-center gap-3"
              >
                <span className="font-data font-bold text-sm text-ink w-12 shrink-0">
                  {district}
                </span>
                <span className="text-xs sm:text-sm text-muted flex-1 truncate">
                  {data.areaName}
                </span>
                <span className={`${scoreBadgeClass(data.safetyScore)} font-data shrink-0`}>
                  {data.safetyScore.toFixed(1)}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-faint group-hover:text-accent transition shrink-0" />
              </Link>
            ))}
        </div>
      </section>

      {/* Explore */}
      <section className="mt-12">
        <h2 className="font-display text-xl text-ink italic mb-1">Explore</h2>
        <p className="text-sm text-muted mb-5">Dig deeper into UK water quality</p>

        {/* Feature pages — 2×2 on mobile, 4-col on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              href: "/rankings/",
              title: "UK Water Quality Rankings",
              desc: "See which cities have the best and worst tap water",
            },
            {
              href: "/hardness/",
              title: "Water Hardness Checker",
              desc: "Find out if you have hard or soft water",
            },
            {
              href: "/guides/is-uk-tap-water-safe/",
              title: "Is UK Tap Water Safe?",
              desc: "Everything you need to know about tap water safety",
            },
            {
              href: "/guides/water-problems/",
              title: "Water Problems?",
              desc: "Troubleshoot taste, colour, and smell issues",
            },
          ].map(({ href, title, desc }) => (
            <Link
              key={href}
              href={href}
              className="card p-4 group block"
            >
              <p className="font-medium text-sm text-ink leading-snug group-hover:text-accent transition-colors">
                {title}
              </p>
              <p className="text-xs text-muted mt-1.5 leading-relaxed">
                {desc}
              </p>
              <div className="mt-3 flex items-center gap-1 text-accent">
                <span className="text-xs font-medium">Read more</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </Link>
          ))}
        </div>

        {/* Cities */}
        <div className="mt-5 flex flex-wrap gap-2">
          {[
            { name: "London", slug: "london" },
            { name: "Manchester", slug: "manchester" },
            { name: "Birmingham", slug: "birmingham" },
            { name: "Leeds", slug: "leeds" },
            { name: "Glasgow", slug: "glasgow" },
            { name: "Edinburgh", slug: "edinburgh" },
          ].map(({ name, slug }) => (
            <Link key={slug} href={`/city/${slug}/`} className="pill">
              {name}
            </Link>
          ))}
        </div>

        {/* Regions */}
        <p className="text-xs uppercase tracking-[0.15em] text-muted font-semibold mt-5 mb-2">By region</p>
        <div className="flex flex-wrap gap-2">
          {REGIONS.map((region) => (
            <Link key={region.slug} href={`/region/${region.slug}`} className="pill">
              {region.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Water companies */}
      <section className="mt-12 mb-12">
        <h2 className="font-display text-xl text-ink italic">
          Water companies
        </h2>
        <p className="text-sm text-muted mt-1 mb-4">
          We track data from all major UK water companies
        </p>

        <div className="card divide-y divide-rule">
          {suppliers.slice(0, 6).map((supplier) => (
            <Link
              key={supplier.id}
              href={`/supplier/${supplier.id}`}
              className="flex items-center gap-3 px-4 py-3 group hover:bg-wash transition-colors first:rounded-t-xl"
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

        <div className="mt-3 text-right">
          <Link href="/about" className="text-sm text-accent hover:underline">
            View all companies →
          </Link>
        </div>
      </section>

    </div>
  );
}
