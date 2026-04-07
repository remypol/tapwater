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
import { RelatedGuides } from "@/components/related-guides";
import { getPostcodeData, getAllPostcodeDistricts, getNationalAverageScore } from "@/lib/data";
import { getScoreColor } from "@/lib/types";
import type { PostcodeData } from "@/lib/types";
import { CITIES, getCityBySlug } from "@/lib/cities";
import { REGIONS } from "@/lib/regions";

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
  const contaminantCount = new Set(scored.flatMap(p => p.readings.map(r => r.name))).size;

  // Keep title under 45 chars; shorten "Tap Water" → "Water" for long city names
  const titleFull = `Is ${city.name} Tap Water Safe? (${year})`;
  const titleShort = `Is ${city.name} Water Safe? (${year})`;
  const pageTitle = titleFull.length <= 45 ? titleFull : titleShort;

  // Keep description under 155 chars
  const descFull = `Is ${city.name} tap water safe to drink? ${avgScore.toFixed(1)}/10 safety score based on ${contaminantCount} contaminants tested across ${scored.length} postcodes. Free ${year} report.`;
  const descShort = `Is ${city.name} tap water safe to drink? ${avgScore.toFixed(1)}/10 safety score based on ${contaminantCount} contaminants across ${scored.length} postcodes.`;
  const description = descFull.length <= 155 ? descFull : descShort;

  return {
    title: pageTitle,
    description,
    openGraph: {
      title: `Is ${city.name} Tap Water Safe to Drink? (${year})`,
      description,
      url: `https://www.tapwater.uk/city/${city.slug}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `Is ${city.name} Tap Water Safe to Drink? (${year})`,
      description,
    },
  };
}

// ── Page ──

export default async function CityPage({ params }: Props) {
  const { slug } = await params;
  const city = getCityBySlug(slug);
  if (!city) notFound();

  const [allPostcodes, nationalAvg] = await Promise.all([
    getPostcodesForCity(city.matches),
    getNationalAverageScore(),
  ]);
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

  // Unscored postcodes (safetyScore < 0) — still need internal links
  const unscoredPostcodes = allPostcodes
    .filter((p) => p.safetyScore < 0)
    .sort((a, b) => a.district.localeCompare(b.district));

  // Best and worst areas
  const bestPostcodes = [...scored].sort((a, b) => b.safetyScore - a.safetyScore).slice(0, 3);
  const worstPostcodes = [...scored].sort((a, b) => a.safetyScore - b.safetyScore).slice(0, 3);

  // Score vs national
  const scoreDiff = avgScore - nationalAvg;
  const scoreVsNational = scoreDiff > 0.15
    ? "above"
    : scoreDiff < -0.15
      ? "below"
      : "level with";

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

  // Compute hardness for the city
  const allCityReadings = scored.flatMap(p => [...p.readings, ...p.environmentalReadings]);
  const hardnessReadings = allCityReadings.filter(r =>
    /hardness/i.test(r.name) || (/CaCO3/i.test(r.name) && !/alkalinity/i.test(r.name))
  );
  const avgHardness = hardnessReadings.length > 0
    ? hardnessReadings.reduce((s, r) => s + r.value, 0) / hardnessReadings.length
    : null;
  const hardnessClass = avgHardness != null
    ? avgHardness < 60 ? "soft" : avgHardness < 120 ? "moderately soft" : avgHardness < 180 ? "moderately hard" : avgHardness < 250 ? "hard" : "very hard"
    : null;

  const hardnessAnswer = avgHardness != null
    ? `Water in ${city.name} has an average hardness of ${Math.round(avgHardness)} mg/L CaCO₃, which is classified as ${hardnessClass}. ${avgHardness >= 180 ? "Hard water causes limescale buildup in kettles and appliances. A water softener or filter may help." : avgHardness < 60 ? "Soft water is gentle on appliances and skin." : "This is a moderate hardness level."}`
    : `Hardness data is not yet available for ${city.name}. Enter your postcode for detailed water quality data.`;

  const bestAreas = [...scored].sort((a, b) => b.safetyScore - a.safetyScore).slice(0, 3);
  const bestAreasAnswer = bestAreas.length > 0
    ? `The areas with the best water quality in ${city.name} are ${bestAreas.map(p => `${p.district} (${p.safetyScore.toFixed(1)}/10)`).join(", ")}.`
    : `Data is still being collected for ${city.name}.`;

  const pfasAnswer = pfasCount > 0
    ? `PFAS (forever chemicals) have been detected in ${pfasCount} out of ${scored.length} areas tested in ${city.name}. The UK currently has no legal limit for PFAS in drinking water. Check your specific postcode for details.`
    : `No PFAS (forever chemicals) have been detected in any of the ${scored.length} areas tested in ${city.name}.`;

  // Count unique contaminants tested across all postcodes
  const uniqueContaminants = new Set(scored.flatMap(p => p.readings.map(r => r.name)));
  const contaminantCount = uniqueContaminants.size;
  const year = new Date().getFullYear();

  return (
    <div className="bg-score-safe">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8 py-8 lg:py-12">
        <BreadcrumbSchema
          items={[
            { name: "Home", url: "https://www.tapwater.uk" },
            { name: "Cities", url: "https://www.tapwater.uk/city" },
            {
              name: city.name,
              url: `https://www.tapwater.uk/city/${city.slug}`,
            },
          ]}
        />
        <FAQSchema
          faqs={[
            { question: `Is ${city.name} tap water safe to drink?`, answer: safetyAnswer },
            { question: `What is the water quality in ${city.name}?`, answer: contaminantsAnswer },
            { question: `Is ${city.name} water hard or soft?`, answer: hardnessAnswer },
            { question: `Which areas of ${city.name} have the best water?`, answer: bestAreasAnswer },
            { question: `Who supplies water in ${city.name}?`, answer: supplierAnswer },
            { question: `Are there PFAS in ${city.name} water?`, answer: pfasAnswer },
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
          {(() => {
            const parentRegion = REGIONS.find((r) => r.cities.includes(city.slug));
            return (
              <p className="text-xs uppercase tracking-[0.15em] text-accent font-semibold flex items-center gap-1.5 animate-fade-up delay-1">
                <MapPin className="w-3 h-3" />
                {parentRegion ? (
                  <Link href={`/region/${parentRegion.slug}`} className="hover:underline">
                    {parentRegion.name}
                  </Link>
                ) : (
                  city.region
                )}
              </p>
            );
          })()}
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-ink tracking-tight mt-2 animate-fade-up delay-2">
            Is {city.name} tap water safe to drink?
          </h1>
          <p className="text-muted mt-2 max-w-2xl animate-fade-up delay-3">
            {city.description}
          </p>
        </header>

        {/* GEO: Branded summary for AI citation */}
        {scored.length > 0 && (
          <div className="card p-5 border-l-4 border-l-accent mb-8 mt-6">
            <p className="text-base text-body leading-relaxed">
              <strong className="text-ink">
                According to TapWater.uk&apos;s analysis, {city.name} scores {avgScore.toFixed(1)}/10
                for drinking water quality in {year}.
              </strong>{" "}
              Water is supplied by {primarySupplier.name} and has been tested for {contaminantCount} contaminants
              across {scored.length} postcode districts.
            </p>
          </div>
        )}

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
                {nationalAvg > 0 && (
                  <p className="text-xs text-faint mt-1">
                    UK avg: {nationalAvg.toFixed(1)}/10
                  </p>
                )}
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
                    score of <span className="font-data font-bold">{avgScore.toFixed(1)}/10</span>
                    {nationalAvg > 0 && (
                      <span className="text-muted text-sm"> ({scoreVsNational} the UK average of {nationalAvg.toFixed(1)}/10)</span>
                    )}.{" "}
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

            {/* Unscored postcodes — ensure they have at least one internal link */}
            {unscoredPostcodes.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-faint mb-2">
                  {unscoredPostcodes.length} additional area{unscoredPostcodes.length !== 1 ? "s" : ""} with limited data:
                </p>
                <div className="flex flex-wrap gap-2">
                  {unscoredPostcodes.map((pc) => (
                    <Link
                      key={pc.district}
                      href={`/postcode/${pc.district}`}
                      className="pill"
                    >
                      <MapPin className="w-3 h-3 text-faint mr-1" />
                      {pc.district}
                      <span className="text-faint ml-1">{pc.areaName}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <hr className="border-rule mt-10" />

            {/* Hardness badge */}
            {avgHardness != null && hardnessClass != null && (
              <div className="mt-8">
                <Link
                  href="/hardness/"
                  className="card p-4 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-accent-light flex items-center justify-center">
                      <Droplets className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm text-muted">Water hardness</p>
                      <p className="font-semibold text-ink group-hover:text-accent transition-colors">
                        {city.name} water is{" "}
                        <span className="capitalize">{hardnessClass}</span>{" "}
                        <span className="text-muted font-normal text-sm">
                          ({Math.round(avgHardness)} mg/L CaCO₃)
                        </span>
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-faint group-hover:text-accent transition-colors" />
                </Link>
              </div>
            )}

            {/* Supplier card */}
            <div className="mt-4">
              <Link
                href={`/supplier/${primarySupplier.id}/`}
                className="card p-4 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-wash flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-faint group-hover:text-accent transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm text-muted">
                      Main water supplier
                      {primarySupplier.count > 0 && (
                        <span className="ml-2 text-faint">
                          — {primarySupplier.count} postcode{primarySupplier.count !== 1 ? "s" : ""} in {city.name}
                        </span>
                      )}
                    </p>
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
          <>
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
            {/* Link unscored postcodes so they aren't orphaned */}
            {unscoredPostcodes.length > 0 && (
              <div className="mt-6">
                <p className="text-xs text-faint mb-2">
                  Areas with limited data:
                </p>
                <div className="flex flex-wrap gap-2">
                  {unscoredPostcodes.map((pc) => (
                    <Link
                      key={pc.district}
                      href={`/postcode/${pc.district}`}
                      className="pill"
                    >
                      <MapPin className="w-3 h-3 text-faint mr-1" />
                      {pc.district}
                      <span className="text-faint ml-1">{pc.areaName}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Best & worst areas */}
        {scored.length >= 2 && (
          <>
            <hr className="border-rule mt-10" />
            <ScrollReveal delay={0}>
              <section className="mt-8">
                <h2 className="font-display text-2xl text-ink italic mb-5">
                  Best and worst areas in {city.name}
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Best */}
                  <div>
                    <p className="text-xs uppercase tracking-wider text-safe font-semibold mb-3">
                      Best areas
                    </p>
                    <div className="space-y-2">
                      {bestPostcodes.map((pc) => (
                        <Link
                          key={pc.district}
                          href={`/postcode/${pc.district}`}
                          className="card p-3 flex items-center justify-between group"
                        >
                          <div className="min-w-0">
                            <span className="font-data font-bold text-sm text-ink">
                              {pc.district}
                            </span>
                            <span className="text-sm text-muted ml-2 truncate">
                              {pc.areaName}
                            </span>
                          </div>
                          <span className={`font-data text-sm font-bold ml-3 shrink-0 ${scoreTextClass(pc.safetyScore)}`}>
                            {pc.safetyScore.toFixed(1)}/10
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                  {/* Worst */}
                  <div>
                    <p className="text-xs uppercase tracking-wider text-warning font-semibold mb-3">
                      Areas to watch
                    </p>
                    <div className="space-y-2">
                      {worstPostcodes.map((pc) => (
                        <Link
                          key={pc.district}
                          href={`/postcode/${pc.district}`}
                          className="card p-3 flex items-center justify-between group"
                        >
                          <div className="min-w-0">
                            <span className="font-data font-bold text-sm text-ink">
                              {pc.district}
                            </span>
                            <span className="text-sm text-muted ml-2 truncate">
                              {pc.areaName}
                            </span>
                          </div>
                          <span className={`font-data text-sm font-bold ml-3 shrink-0 ${scoreTextClass(pc.safetyScore)}`}>
                            {pc.safetyScore.toFixed(1)}/10
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </ScrollReveal>
          </>
        )}

        {/* Related guides */}
        {scored.length > 0 && (
          <>
            <hr className="border-rule mt-10" />
            <ScrollReveal delay={0}>
              <RelatedGuides
                pfasDetected={pfasCount > 0}
                hasLeadFlagged={topConcerns.some(([name]) => /lead/i.test(name))}
                isHardWater={(avgHardness ?? 0) >= 180}
                hasContaminantsFlagged={totalFlagged > 0}
              />
            </ScrollReveal>
          </>
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
