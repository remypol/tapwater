import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  MapPin,
  Building2,
  AlertTriangle,
  ShieldCheck,
  Droplets,
} from "lucide-react";
import { PostcodeSearch } from "@/components/postcode-search";
import { ScrollReveal } from "@/components/scroll-reveal";
import { BreadcrumbSchema, FAQSchema } from "@/components/json-ld";
import { getPostcodeData, getAllPostcodeDistricts } from "@/lib/data";
import { getScoreColor } from "@/lib/types";
import type { PostcodeData } from "@/lib/types";
import { CITIES, getCityBySlug } from "@/lib/cities";

export const revalidate = 86400;

interface Props {
  params: Promise<{ slug: string }>;
}

// ── Helpers ──

function scoreTextClass(score: number): string {
  const c = getScoreColor(score);
  if (c === "safe") return "text-[var(--color-safe)]";
  if (c === "warning") return "text-[var(--color-warning)]";
  return "text-[var(--color-danger)]";
}

async function getPostcodesForCity(
  matches: string[],
): Promise<PostcodeData[]> {
  const lowerMatches = matches.map((m) => m.toLowerCase());
  const districts = await getAllPostcodeDistricts();
  const results: PostcodeData[] = [];

  for (const d of districts) {
    const data = await getPostcodeData(d);
    if (data && lowerMatches.includes(data.city.toLowerCase())) {
      results.push(data);
    }
  }

  return results;
}

// ── Static generation ──

export async function generateStaticParams() {
  return CITIES.map((city) => ({ slug: city.slug }));
}

// ── Metadata ──

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const city = getCityBySlug(slug);
  if (!city) return { title: "Not Found" };

  const postcodes = await getPostcodesForCity(city.matches);
  const scored = postcodes.filter((p) => p.safetyScore >= 0);
  const avgScore =
    scored.length > 0
      ? (scored.reduce((sum, p) => sum + p.safetyScore, 0) / scored.length)
      : 0;

  const year = new Date().getFullYear();
  const description = `Check ${city.name} tap water quality. ${scored.length} areas tested, average score ${avgScore.toFixed(1)}/10. PFAS, lead, nitrate levels and more. Free ${year} report based on real drinking water tests.`;

  return {
    title: `Is ${city.name} Tap Water Safe to Drink? ${year} Water Quality Report`,
    description,
    openGraph: {
      title: `Is ${city.name} Tap Water Safe to Drink?`,
      description,
      url: `https://www.tapwater.uk/city/${city.slug}/`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `Is ${city.name} Tap Water Safe to Drink?`,
      description,
    },
  };
}

// ── Page ──

export default async function CityPage({ params }: Props) {
  const { slug } = await params;
  const city = getCityBySlug(slug);
  if (!city) notFound();

  const allPostcodes = await getPostcodesForCity(city.matches);
  const scored = allPostcodes.filter((p) => p.safetyScore >= 0);

  // Aggregate stats
  const avgScore =
    scored.length > 0
      ? scored.reduce((sum, p) => sum + p.safetyScore, 0) / scored.length
      : 0;
  const totalFlagged = scored.reduce(
    (sum, p) => sum + p.contaminantsFlagged,
    0,
  );
  const pfasCount = scored.filter((p) => p.pfasDetected).length;

  // Primary supplier (most common across postcodes)
  const supplierCounts = new Map<string, { name: string; id: string; count: number }>();
  for (const p of allPostcodes) {
    const existing = supplierCounts.get(p.supplierId);
    if (existing) {
      existing.count++;
    } else {
      supplierCounts.set(p.supplierId, {
        name: p.supplier,
        id: p.supplierId,
        count: 1,
      });
    }
  }
  const primarySupplier = Array.from(supplierCounts.values()).sort(
    (a, b) => b.count - a.count,
  )[0] ?? { name: "Unknown", id: "unknown", count: 0 };

  // Top concerns — contaminants flagged most across the city
  const contaminantFlags = new Map<string, number>();
  for (const p of scored) {
    for (const r of p.readings) {
      if (r.status !== "pass") {
        contaminantFlags.set(
          r.name,
          (contaminantFlags.get(r.name) ?? 0) + 1,
        );
      }
    }
  }
  const topConcerns = Array.from(contaminantFlags.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Sort postcodes by score ascending (worst first) for table
  const sortedPostcodes = [...scored].sort(
    (a, b) => a.safetyScore - b.safetyScore,
  );

  // FAQ answers
  const safetyAnswer =
    avgScore >= 7
      ? `Yes, ${city.name} tap water is generally safe to drink. Across ${scored.length} areas tested, the average water quality score is ${avgScore.toFixed(1)}/10. ${city.description}`
      : avgScore >= 4
        ? `${city.name} tap water is safe to drink but some areas scored below average. Across ${scored.length} areas tested, the average water quality score is ${avgScore.toFixed(1)}/10. ${topConcerns.length > 0 ? `The most common issues were ${topConcerns.slice(0, 3).map(([name]) => name).join(", ")}.` : ""}`
        : `${city.name} tap water meets legal requirements but several areas showed elevated contaminant levels. Across ${scored.length} areas tested, the average water quality score is ${avgScore.toFixed(1)}/10. Check your specific postcode for details.`;

  const supplierAnswer = `Water in ${city.name} is supplied by ${primarySupplier.name}${supplierCounts.size > 1 ? ` (covering most areas), with ${supplierCounts.size - 1} other supplier${supplierCounts.size > 2 ? "s" : ""} serving parts of the city` : ""}. ${city.description}`;

  const contaminantsAnswer =
    topConcerns.length > 0
      ? `The most commonly flagged contaminants across ${city.name} are ${topConcerns.slice(0, 4).map(([name, count]) => `${name} (flagged in ${count} area${count > 1 ? "s" : ""})`).join(", ")}. ${pfasCount > 0 ? `PFAS (forever chemicals) were detected in ${pfasCount} area${pfasCount > 1 ? "s" : ""}.` : "No PFAS were detected."}`
      : `No contaminants were flagged above recommended levels across ${city.name}. All tested areas passed on the parameters measured.`;

  return (
    <div className="bg-score-safe">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8 py-8 lg:py-12">
        <BreadcrumbSchema
          items={[
            { name: "Home", url: "https://www.tapwater.uk" },
            { name: "Cities", url: "https://www.tapwater.uk/city" },
            {
              name: city.name,
              url: `https://www.tapwater.uk/city/${city.slug}/`,
            },
          ]}
        />
        <FAQSchema
          faqs={[
            { question: `Is ${city.name} tap water safe to drink?`, answer: safetyAnswer },
            { question: `Who supplies water in ${city.name}?`, answer: supplierAnswer },
            { question: `What contaminants are in ${city.name} tap water?`, answer: contaminantsAnswer },
          ]}
        />

        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-sm text-faint"
        >
          <Link href="/" className="hover:text-accent transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-ink font-medium">{city.name}</span>
        </nav>

        {/* Header */}
        <header className="mt-6">
          <p className="text-xs uppercase tracking-[0.15em] text-accent font-semibold flex items-center gap-1.5 animate-fade-up delay-1">
            <MapPin className="w-3 h-3" />
            {city.region}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-ink tracking-tight mt-2 animate-fade-up delay-2">
            Is {city.name} tap water safe to drink?
          </h1>
          <p className="text-muted mt-2 max-w-2xl animate-fade-up delay-3">
            {city.description}
          </p>
        </header>

        {/* Aggregate stats */}
        {scored.length > 0 ? (
          <>
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-up delay-3">
              <div className="card p-4 text-center">
                <p className="text-xs text-muted uppercase tracking-wider">
                  Average score
                </p>
                <p
                  className={`font-data text-3xl font-bold mt-1 ${scoreTextClass(avgScore)}`}
                >
                  {avgScore.toFixed(1)}
                  <span className="text-sm text-faint font-normal">/10</span>
                </p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-xs text-muted uppercase tracking-wider">
                  Areas tested
                </p>
                <p className="font-data text-3xl font-bold text-ink mt-1">
                  {scored.length}
                </p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-xs text-muted uppercase tracking-wider">
                  Issues flagged
                </p>
                <p className="font-data text-3xl font-bold text-ink mt-1">
                  {totalFlagged}
                </p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-xs text-muted uppercase tracking-wider">
                  PFAS detected
                </p>
                <p className="font-data text-3xl font-bold text-ink mt-1">
                  {pfasCount > 0 ? `${pfasCount} area${pfasCount > 1 ? "s" : ""}` : "None"}
                </p>
              </div>
            </div>

            {/* GEO: Direct answer summary — optimized for AI citation */}
            <div className="mt-8 max-w-3xl">
              <p className="text-base text-body leading-relaxed">
                {avgScore >= 7 ? (
                  <>
                    <strong className="text-ink">Yes, {city.name} tap water is safe to drink.</strong>{" "}
                    Based on {scored.length} areas tested, {city.name} has an average water quality
                    score of <span className="font-data font-bold">{avgScore.toFixed(1)}/10</span>.{" "}
                    {totalFlagged === 0
                      ? "No contaminants were found above recommended levels."
                      : `${totalFlagged} contaminant${totalFlagged !== 1 ? "s were" : " was"} flagged above recommended levels across all areas.`}{" "}
                    Water is supplied by{" "}
                    <Link href={`/supplier/${primarySupplier.id}`} className="text-accent hover:underline">
                      {primarySupplier.name}
                    </Link>
                    . {city.description}
                  </>
                ) : avgScore >= 5 ? (
                  <>
                    <strong className="text-ink">{city.name} tap water is mostly safe, but some areas have concerns.</strong>{" "}
                    The average water quality score across {scored.length} areas is{" "}
                    <span className="font-data font-bold">{avgScore.toFixed(1)}/10</span>, with{" "}
                    {totalFlagged} contaminant{totalFlagged !== 1 ? "s" : ""} flagged above recommended levels.{" "}
                    Water is supplied by{" "}
                    <Link href={`/supplier/${primarySupplier.id}`} className="text-accent hover:underline">
                      {primarySupplier.name}
                    </Link>
                    . {city.description}
                  </>
                ) : (
                  <>
                    <strong className="text-ink">{city.name} tap water has some quality concerns.</strong>{" "}
                    The average water quality score across {scored.length} areas is{" "}
                    <span className="font-data font-bold">{avgScore.toFixed(1)}/10</span>, with{" "}
                    {totalFlagged} contaminant{totalFlagged !== 1 ? "s" : ""} flagged above recommended levels.{" "}
                    Check your specific postcode for detailed results.{" "}
                    Water is supplied by{" "}
                    <Link href={`/supplier/${primarySupplier.id}`} className="text-accent hover:underline">
                      {primarySupplier.name}
                    </Link>
                    . {city.description}
                  </>
                )}
                {pfasCount > 0 && (
                  <>{" "}PFAS (forever chemicals) were detected in {pfasCount} of {scored.length} areas monitored.</>
                )}
              </p>
            </div>

            <hr className="border-rule mt-10" />

            {/* Top concerns */}
            {topConcerns.length > 0 && (
              <ScrollReveal delay={0}>
                <section className="mt-8">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-danger shrink-0" />
                    <h2 className="font-display text-2xl text-ink italic">
                      Top concerns in {city.name}
                    </h2>
                  </div>
                  <p className="text-sm text-muted mt-1 mb-5">
                    Contaminants flagged most often across the city.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {topConcerns.map(([name, count]) => (
                      <div
                        key={name}
                        className="card p-4 flex items-center justify-between"
                      >
                        <span className="text-sm font-medium text-ink">
                          {name}
                        </span>
                        <span className="text-xs text-muted">
                          {count} area{count > 1 ? "s" : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </ScrollReveal>
            )}

            <hr className="border-rule mt-10" />

            {/* Postcode table */}
            <ScrollReveal delay={100}>
              <section className="mt-8">
                <div className="flex items-center gap-2 mb-1">
                  <Droplets className="w-4 h-4 text-accent shrink-0" />
                  <h2 className="font-display text-2xl text-ink italic">
                    Water quality by area
                  </h2>
                </div>
                <p className="text-sm text-muted mt-1 mb-5">
                  All postcode districts in {city.name}, ranked by water quality
                  score.
                </p>

                <div className="card overflow-hidden">
                  {/* Table header */}
                  <div className="hidden sm:grid sm:grid-cols-[1fr_1fr_80px_80px_1fr] gap-4 px-4 py-2.5 bg-wash border-b border-rule text-xs text-faint uppercase tracking-wider font-medium">
                    <span>Postcode</span>
                    <span>Area</span>
                    <span className="text-right">Score</span>
                    <span className="text-right">Flagged</span>
                    <span>Supplier</span>
                  </div>

                  {/* Table rows */}
                  {sortedPostcodes.map((pc) => (
                    <Link
                      key={pc.district}
                      href={`/postcode/${pc.district}`}
                      className="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[1fr_1fr_80px_80px_1fr] gap-x-4 gap-y-1 px-4 py-3 border-b border-rule last:border-b-0 hover:bg-wash transition-colors group items-center"
                    >
                      <span className="font-data font-bold text-sm text-ink">
                        {pc.district}
                      </span>
                      <span className="text-sm text-muted truncate">
                        {pc.areaName}
                      </span>
                      <span
                        className={`font-data text-sm font-bold text-right ${scoreTextClass(pc.safetyScore)}`}
                      >
                        {pc.safetyScore.toFixed(1)}
                      </span>
                      <span className="font-data text-sm text-right text-muted hidden sm:block">
                        {pc.contaminantsFlagged}
                      </span>
                      <span className="text-sm text-muted truncate hidden sm:flex items-center gap-1.5">
                        <Building2 className="w-3 h-3 text-faint shrink-0" />
                        {pc.supplier}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            </ScrollReveal>

            <hr className="border-rule mt-10" />

            {/* Supplier card */}
            <div className="mt-8">
              <Link
                href={`/supplier/${primarySupplier.id}`}
                className="card p-4 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-faint" />
                  </div>
                  <div>
                    <p className="text-sm text-muted">Main water supplier</p>
                    <p className="font-semibold text-ink group-hover:text-accent transition-colors">
                      {primarySupplier.name}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-faint group-hover:text-accent transition-colors" />
              </Link>
            </div>
          </>
        ) : (
          /* No data state */
          <div className="mt-10 card-elevated rounded-2xl p-8 max-w-2xl">
            <p className="font-display text-2xl text-ink italic">
              Not enough data yet
            </p>
            <p className="text-base text-body leading-relaxed mt-3">
              We don&apos;t have enough test results for {city.name} yet to
              show aggregate scores. Try searching for a specific postcode
              below.
            </p>
          </div>
        )}

        <hr className="border-rule mt-10" />

        {/* Check your postcode CTA */}
        <ScrollReveal delay={0}>
          <section className="mt-8 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-safe shrink-0" />
              <h2 className="font-display text-2xl text-ink italic">
                Check your postcode
              </h2>
            </div>
            <p className="text-sm text-muted mt-1 mb-5">
              Get a detailed water quality report for your exact area in{" "}
              {city.name}.
            </p>

            <div className="max-w-xl">
              <PostcodeSearch size="sm" />
            </div>
          </section>
        </ScrollReveal>

        {/* Methodology footer */}
        <footer className="mt-10 pb-4 text-sm text-faint leading-relaxed">
          Based on water quality data from {scored.length} postcode districts in{" "}
          {city.name}. Data from your water company via the Stream Water Data
          Portal and the Environment Agency. See our{" "}
          <Link
            href="/about/methodology"
            className="underline underline-offset-2 hover:text-muted transition-colors"
          >
            methodology
          </Link>{" "}
          for how scores are calculated.
        </footer>
      </div>
    </div>
  );
}
