import Link from "next/link";
import type { Metadata } from "next";
import { PostcodeSearch } from "@/components/postcode-search";
import { MOST_CHECKED } from "@/lib/mock-data";
import { getPostcodeData, getSuppliersList, getTrustMetrics, getRankedPostcodes, getRecentlyUpdatedPostcodes } from "@/lib/data";
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
import { FixPicks } from "@/components/fix-picks";
import { FAQSchema } from "@/components/json-ld";
import { REGIONS } from "@/lib/regions";

export const metadata: Metadata = {
  title: { absolute: "Check Water Quality by Postcode | TapWater.uk" },
  description:
    "Check the water quality in your area by postcode. Free UK report from real drinking-water tests: lead, PFAS, nitrate and more against the legal limits.",
  openGraph: {
    title: "Check the water quality in your area",
    description:
      "Free water quality report for every UK postcode, built from real drinking-water tests.",
    url: "https://www.tapwater.uk",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Check the water quality in your area | TapWater.uk",
    description: "Free water quality report for every UK postcode, built from real drinking-water tests.",
  },
};

/** "August 2026" from an ISO date; null when the data layer has no date yet. */
function monthYear(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}

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
  const [{ worst, best }, suppliers, TRUST_METRICS, popularSearches, recentlyUpdated] =
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
      getRecentlyUpdatedPostcodes(24),
    ]);

  // Live numbers for the hero strip and FAQ. Nothing here is typed by hand:
  // the district count comes from the trust-metrics RPC, the contaminant count
  // and latest test date from the reports already loaded for this page.
  const loadedReports: PostcodeData[] = [
    ...recentlyUpdated,
    ...best,
    ...worst,
    ...popularSearches.map((p) => p.data),
  ];
  const districtsCovered =
    TRUST_METRICS.find((m) => m.label === "Areas covered")?.value ?? null;
  const contaminantsChecked = Math.max(
    new Set(loadedReports.flatMap((d) => d.readings.map((r) => r.name))).size,
    ...loadedReports.map((d) => d.contaminantsTested),
    0,
  );
  const latestTest = monthYear(
    loadedReports.reduce<string | null>(
      (acc, d) => (d.lastSampleDate && (!acc || d.lastSampleDate > acc) ? d.lastSampleDate : acc),
      null,
    ),
  );
  const topArea = best[0];
  const bottomArea = worst[0];

  const whatYouSee: { value: string; label: string }[] = [
    ...(districtsCovered
      ? [{ value: districtsCovered, label: "postcode districts with tap-water tests" }]
      : []),
    ...(contaminantsChecked > 0
      ? [{ value: contaminantsChecked.toLocaleString("en-GB"), label: "contaminants checked against legal limits" }]
      : []),
    ...(latestTest ? [{ value: latestTest, label: "most recent test in the data" }] : []),
  ];

  const faqs = [
    {
      question: "What is the water quality in my area?",
      answer: `Type your postcode above to find out. Your free report scores your area out of 10 using the latest tests from your water company and the Environment Agency, lists every substance checked and shows which ones came close to, or over, the legal limit.${districtsCovered ? ` Reports are available for ${districtsCovered} postcode districts across the UK.` : ""}`,
    },
    {
      question: "Is my tap water safe to drink?",
      answer:
        "Almost always, yes. UK tap water is among the most tested in the world and nearly every sample passes the legal limits. A low score on this site does not mean the water is unsafe. It means some readings sat closer to the limit than in other areas. Your report names those readings, so you can decide whether a filter is worth having.",
    },
    {
      question: "How do I check water quality by postcode?",
      answer: `Enter the first part of your postcode, such as SW1A or M1, in the search box. You get a report straight away: a score out of 10, the water company that supplies you, how hard your water is, and results for ${contaminantsChecked > 0 ? contaminantsChecked : "every"} contaminants including lead, PFAS and nitrate. It is free and there is no sign-up.`,
    },
    {
      question: "What is in UK tap water?",
      answer:
        "Mostly water. The rest is small amounts of minerals such as calcium and magnesium, which make water hard or soft, a trace of chlorine that keeps it clean on the way to your tap, and very low levels of substances picked up from pipes and the environment, such as lead, nitrate or PFAS. Each has a legal limit set well below the level thought to affect health, and your postcode report shows how your area's readings compare.",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">

      {/* Hero */}
      <section className="bg-hero noise-overlay pt-12 pb-10 lg:pt-16 lg:pb-12 -mx-5 sm:-mx-6 lg:-mx-8 px-5 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="animate-fade-up delay-1 font-display text-4xl sm:text-5xl lg:text-6xl text-ink tracking-tight italic">
            Check the water quality in your area
          </h1>

          <p className="animate-fade-up delay-2 text-lg text-muted mt-4 max-w-lg mx-auto leading-relaxed">
            A free report for your postcode, built from real drinking-water tests.
          </p>

          <div className="animate-fade-up delay-3 max-w-xl mx-auto mt-8">
            <PostcodeSearch size="lg" />
          </div>

          {/* What you'll see: three live numbers, read as one line of copy */}
          {whatYouSee.length > 0 && (
            <ul className="animate-fade-up delay-4 mt-8 flex flex-col sm:flex-row sm:justify-center sm:divide-x divide-rule text-left sm:text-center">
              {whatYouSee.map(({ value, label }) => (
                <li
                  key={label}
                  className="flex items-baseline gap-2 sm:block py-1.5 sm:py-0 sm:px-6 lg:px-8 sm:max-w-[13rem]"
                >
                  <span className="font-data text-xl lg:text-2xl text-ink leading-none">
                    {value}
                  </span>
                  <span className="block text-xs text-muted leading-snug sm:mt-1.5">
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* One specific, live sentence for crawlers and answer engines */}
          {topArea && bottomArea && (
            <p className="text-sm text-muted mt-6 max-w-lg mx-auto leading-relaxed">
              Right now the gap runs from{" "}
              <Link href={`/postcode/${bottomArea.district}`} className="text-ink hover:text-accent transition-colors">
                {bottomArea.district} ({bottomArea.areaName})
              </Link>{" "}
              at <span className="font-data">{bottomArea.safetyScore.toFixed(1)}/10</span> to{" "}
              <Link href={`/postcode/${topArea.district}`} className="text-ink hover:text-accent transition-colors">
                {topArea.district} ({topArea.areaName})
              </Link>{" "}
              at <span className="font-data">{topArea.safetyScore.toFixed(1)}/10</span>. Your report shows
              where your postcode sits, and which readings put it there.
            </p>
          )}
        </div>
      </section>

      {/* Water surface — flowing transition from hero */}
      <div className="-mx-5 sm:-mx-6 lg:-mx-8">
        <WaterSurface />
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
                      <span className="text-xs text-faint uppercase tracking-wider">/10</span>
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
                    <span className="text-xs text-faint uppercase tracking-wider">/10</span>
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

      {/* The fixes people actually buy — the homepage's only commercial step.
          Fixed three picks: the rail claims to be "most clicked", so it must not
          reshuffle with whatever the click log says this week. */}
      <FixPicks
        className="mt-14"
        pageType="home"
        placement="home-picks"
        title="The fixes people actually buy"
        intro={
          <>
            Of everything we link to, these three are what readers click most: a jug
            for drinking water, a shower filter for chlorine, and a reverse osmosis
            unit that needs no plumbing. They are starting points, not a prescription.
            Check your postcode above and the report tells you what your own water
            actually needs.
          </>
        }
      />

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

      {/* Recently updated — direct crawl paths into the postcode network */}
      {recentlyUpdated.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-xl text-ink italic mb-1">
            Recently updated areas
          </h2>
          <p className="text-sm text-muted mb-4">
            Latest water quality reports from across the UK
          </p>
          <div className="flex flex-wrap gap-2">
            {recentlyUpdated.map((pc) => (
              <Link
                key={pc.district}
                href={`/postcode/${pc.district}`}
                className="pill group"
              >
                <span className="font-data font-bold text-xs">{pc.district}</span>
                <span className="text-faint mx-1">&middot;</span>
                <span className="text-xs">{pc.areaName}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Water companies */}
      <section className="mt-12">
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

      {/* Common questions — the plain-English answers people search for */}
      <section className="mt-12 mb-14" aria-labelledby="home-faq-heading">
        <FAQSchema faqs={faqs} />
        <h2 id="home-faq-heading" className="font-display text-xl text-ink italic">
          Common questions
        </h2>
        <dl className="mt-4 max-w-3xl divide-y divide-rule border-y border-rule">
          {faqs.map(({ question, answer }) => (
            <div key={question} className="py-5 grid gap-2 sm:grid-cols-[minmax(0,15rem)_1fr] sm:gap-8">
              <dt className="font-display text-lg text-ink italic leading-snug">
                {question}
              </dt>
              <dd className="text-sm text-body leading-relaxed">{answer}</dd>
            </div>
          ))}
        </dl>
      </section>

    </div>
  );
}
