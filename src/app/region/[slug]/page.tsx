import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, MapPin, Building2, AlertTriangle, ShieldCheck } from "lucide-react";
import { PostcodeSearch } from "@/components/postcode-search";
import { BreadcrumbSchema, FAQSchema } from "@/components/json-ld";
import { ScrollReveal } from "@/components/scroll-reveal";
import { REGIONS, getRegionBySlug } from "@/lib/regions";
import { getCityBySlug, CITIES } from "@/lib/cities";
import { getPostcodesByCity } from "@/lib/data";
import { getScoreColor } from "@/lib/types";
import type { PostcodeData } from "@/lib/types";

export const revalidate = 86400;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return REGIONS.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const region = getRegionBySlug(slug);
  if (!region) return { title: "Not Found" };

  const year = new Date().getFullYear();

  // Keep title under 60 chars (template adds " | TapWater.uk" = 15 chars)
  const regionTitle = `${region.name} Water Quality ${year}`;
  const pageTitle = (regionTitle + " | TapWater.uk").length <= 60
    ? regionTitle
    : `${region.name} Water Quality`;

  // Keep description under 155 chars
  const descFull = `Water quality data for ${region.name}. Check safety scores, contaminants, PFAS and supplier info for every postcode. Free ${year} report.`;
  const descShort = `Water quality data for ${region.name}. Safety scores, contaminants, PFAS and supplier info for every postcode.`;
  const regionDesc = descFull.length <= 155 ? descFull : descShort;

  return {
    title: pageTitle,
    description: regionDesc,
    openGraph: {
      title: `Water Quality in ${region.name} — Is It Safe?`,
      description: `Water quality data for every postcode in ${region.name}. Check safety scores, contaminants, and supplier info.`,
      url: `https://www.tapwater.uk/region/${slug}`,
      type: "website",
    },
  };
}

function scoreTextClass(score: number): string {
  const c = getScoreColor(score);
  if (c === "safe") return "text-safe";
  if (c === "warning") return "text-warning";
  return "text-danger";
}

export default async function RegionPage({ params }: Props) {
  const { slug } = await params;
  const region = getRegionBySlug(slug);
  if (!region) notFound();

  // Gather all postcodes for this region's cities (scored AND unscored)
  const cityData: { city: typeof CITIES[0]; postcodes: PostcodeData[]; unscoredPostcodes: PostcodeData[] }[] = [];
  for (const citySlug of region.cities) {
    const city = getCityBySlug(citySlug);
    if (!city) continue;
    const postcodes = await getPostcodesByCity(city.name);
    // Also check matches (e.g. London has multiple boroughs)
    const additionalPostcodes = (
      await Promise.all(city.matches.map((m) => getPostcodesByCity(m)))
    ).flat();
    const all = [...postcodes, ...additionalPostcodes];
    // Dedupe by district — keep ALL postcodes, separate scored from unscored
    const seen = new Set<string>();
    const deduped = all.filter((p) => {
      if (seen.has(p.district)) return false;
      seen.add(p.district);
      return true;
    });
    const scored = deduped.filter((p) => p.safetyScore >= 0);
    const unscored = deduped.filter((p) => p.safetyScore < 0);
    if (deduped.length > 0) {
      cityData.push({ city, postcodes: scored, unscoredPostcodes: unscored });
    }
  }

  const allPostcodes = cityData.flatMap((c) => c.postcodes);
  const allUnscoredPostcodes = cityData.flatMap((c) => c.unscoredPostcodes);
  const totalPostcodes = allPostcodes.length;
  const totalAllPostcodes = totalPostcodes + allUnscoredPostcodes.length;

  // No data for this region yet — show a minimal page instead of 404
  // (avoids build failures when seed data doesn't cover all regions)
  if (totalAllPostcodes === 0) {
    return (
      <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 py-8 lg:py-12">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-faint">
          <Link href="/" className="hover:text-accent transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-ink font-medium">{region.name}</span>
        </nav>
        <h1 className="font-display text-3xl sm:text-4xl text-ink tracking-tight italic mt-6">
          Water quality in {region.name}
        </h1>
        <p className="text-muted mt-3 max-w-2xl">{region.description}</p>
        <div className="mt-8 card p-8 max-w-2xl">
          <p className="font-display text-xl text-ink italic">Data coming soon</p>
          <p className="text-body mt-2">We&apos;re still collecting water quality data for this region. Check back soon or search for a specific postcode.</p>
          <div className="mt-6 max-w-md">
            <PostcodeSearch size="lg" />
          </div>
        </div>
      </div>
    );
  }

  const avgScore = totalPostcodes > 0
    ? allPostcodes.reduce((sum, p) => sum + p.safetyScore, 0) / totalPostcodes
    : 0;
  const pfasCount = allPostcodes.filter((p) => p.pfasDetected).length;

  // Ranked postcodes
  const sorted = [...allPostcodes].sort((a, b) => a.safetyScore - b.safetyScore);
  const worst = sorted.slice(0, 5);
  const best = sorted.slice(-5).reverse();

  // City averages
  const cityAverages = cityData
    .map((c) => ({
      ...c,
      avgScore: c.postcodes.reduce((s, p) => s + p.safetyScore, 0) / c.postcodes.length,
    }))
    .sort((a, b) => b.avgScore - a.avgScore);

  // Unique suppliers
  const suppliers = [...new Set(allPostcodes.map((p) => p.supplier))];

  const scoreLabel = avgScore >= 7 ? "safe" : avgScore >= 4 ? "moderate" : "below average";

  const allRegionReadings = allPostcodes.flatMap(p => [...p.readings, ...p.environmentalReadings]);
  const hardnessReadings = allRegionReadings.filter(r =>
    /hardness/i.test(r.name) || (/CaCO3/i.test(r.name) && !/alkalinity/i.test(r.name))
  );
  const avgHardness = hardnessReadings.length > 0
    ? hardnessReadings.reduce((s, r) => s + r.value, 0) / hardnessReadings.length
    : null;
  const hardnessClass = avgHardness != null
    ? avgHardness < 60 ? "soft" : avgHardness < 120 ? "moderately soft" : avgHardness < 180 ? "moderately hard" : avgHardness < 250 ? "hard" : "very hard"
    : null;

  const faqs = [
    {
      question: `Is tap water safe in ${region.name}?`,
      answer: `Based on our analysis of ${totalPostcodes} postcode districts in ${region.name}, the average water quality score is ${avgScore.toFixed(1)}/10, which is ${scoreLabel}. Water is supplied by ${suppliers.slice(0, 3).join(", ")}${suppliers.length > 3 ? ` and ${suppliers.length - 3} more` : ""}.`,
    },
    {
      question: `Which area has the best water in ${region.name}?`,
      answer: best.length > 0 ? `${best[0].district} (${best[0].areaName}) has the highest water quality score in ${region.name} at ${best[0].safetyScore.toFixed(1)}/10.` : `Data is still being collected for ${region.name}.`,
    },
    {
      question: `Which area has the worst water in ${region.name}?`,
      answer: worst.length > 0 ? `${worst[0].district} (${worst[0].areaName}) has the lowest water quality score in ${region.name} at ${worst[0].safetyScore.toFixed(1)}/10. Check the postcode page for details on specific contaminants.` : `Data is still being collected for ${region.name}.`,
    },
    ...(avgHardness != null ? [{
      question: `Is ${region.name} water hard or soft?`,
      answer: `Water in ${region.name} has an average hardness of ${Math.round(avgHardness)} mg/L CaCO₃, which is classified as ${hardnessClass}. Hardness varies by area — check your postcode for exact levels.`,
    }] : []),
    {
      question: `Who supplies water in ${region.name}?`,
      answer: `Water in ${region.name} is supplied by ${suppliers.join(", ")}.`,
    },
    ...(pfasCount > 0 ? [{
      question: `Is there PFAS in ${region.name} water?`,
      answer: `PFAS (forever chemicals) have been detected in ${pfasCount} out of ${totalPostcodes} postcode districts tested in ${region.name}. The UK currently has no legal limit for PFAS in drinking water.`,
    }] : []),
  ];

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 py-8 lg:py-12">
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: region.name, url: `https://www.tapwater.uk/region/${slug}` },
        ]}
      />
      <FAQSchema faqs={faqs} />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-faint">
        <Link href="/" className="hover:text-accent transition-colors">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-ink font-medium">{region.name}</span>
      </nav>

      {/* Header */}
      <header className="mt-6">
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-ink tracking-tight italic">
          Water quality in {region.name}
        </h1>
        <p className="text-muted mt-3 max-w-2xl leading-relaxed">
          {region.description}
        </p>
      </header>

      {/* GEO: Branded summary for AI citation */}
      <div className="card p-5 border-l-4 border-l-accent mb-8 mt-6">
        <p className="text-base text-body leading-relaxed">
          <strong className="text-ink">
            According to TapWater.uk&apos;s analysis, {region.name} scores {avgScore.toFixed(1)}/10
            for drinking water quality in {new Date().getFullYear()}, based on data from {totalPostcodes} postcode districts.
          </strong>
        </p>
      </div>

      {/* Regional stats */}
      <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card p-4 text-center">
          <span className={`font-data text-2xl font-bold ${scoreTextClass(avgScore)}`}>
            {avgScore.toFixed(1)}
          </span>
          <p className="text-xs text-faint uppercase tracking-wider mt-1">Avg score /10</p>
        </div>
        <div className="card p-4 text-center">
          <span className="font-data text-2xl font-bold text-ink">{totalPostcodes}</span>
          <p className="text-xs text-faint uppercase tracking-wider mt-1">Areas tested</p>
        </div>
        <div className="card p-4 text-center">
          <span className="font-data text-2xl font-bold text-ink">{suppliers.length}</span>
          <p className="text-xs text-faint uppercase tracking-wider mt-1">Suppliers</p>
        </div>
        <div className="card p-4 text-center">
          <span className="font-data text-2xl font-bold text-pfas">{pfasCount}</span>
          <p className="text-xs text-faint uppercase tracking-wider mt-1">PFAS detections</p>
        </div>
      </div>

      {/* AI-citable summary */}
      <div className="mt-8 max-w-3xl">
        <p className="text-base text-body leading-relaxed">
          Tap water in {region.name} has an average safety score of {avgScore.toFixed(1)} out of 10 based on
          testing across {totalPostcodes} postcode districts. Water is supplied by {suppliers.join(", ")}.
          {pfasCount > 0 && ` PFAS (forever chemicals) have been detected in ${pfasCount} areas.`}
          {" "}The {scoreLabel === "safe" ? "overall water quality is good" : scoreLabel === "moderate" ? "overall quality is acceptable but some areas have issues" : "region has below-average water quality that warrants attention"}.
          Data is sourced from the Environment Agency and water company testing via the Stream Water Data Portal.
        </p>
      </div>

      {/* Search CTA */}
      <div className="mt-8 max-w-xl">
        <PostcodeSearch size="lg" />
      </div>

      {/* Cities in this region */}
      <ScrollReveal delay={0}>
        <section className="mt-12">
          <h2 className="font-display text-2xl text-ink italic">
            Cities in {region.name}
          </h2>
          <p className="text-sm text-muted mt-1 mb-5">
            Average water quality score by city.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {cityAverages.map(({ city, postcodes, avgScore: cityAvg }) => (
              <Link
                key={city.slug}
                href={`/city/${city.slug}`}
                className="card p-4 group block"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-ink group-hover:text-accent transition-colors">
                      {city.name}
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      {postcodes.length} areas tested
                    </p>
                  </div>
                  <span className={`font-data text-lg font-bold ${scoreTextClass(cityAvg)}`}>
                    {cityAvg.toFixed(1)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </ScrollReveal>

      {/* Best + Worst side by side */}
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ScrollReveal delay={0}>
          <section>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-danger" />
              <h2 className="font-display text-xl text-ink italic">Areas to watch</h2>
            </div>
            <div className="flex flex-col gap-2">
              {worst.map((pc) => (
                <Link key={pc.district} href={`/postcode/${pc.district}`} className="card px-4 py-3 flex items-center gap-3 group">
                  <span className="font-data font-bold text-sm text-ink w-12 shrink-0">{pc.district}</span>
                  <span className="text-sm text-muted flex-1 truncate">{pc.areaName}</span>
                  <span className={`font-data text-sm font-bold ${scoreTextClass(pc.safetyScore)}`}>{pc.safetyScore.toFixed(1)}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-faint group-hover:text-accent transition shrink-0" />
                </Link>
              ))}
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <section>
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4 text-safe" />
              <h2 className="font-display text-xl text-ink italic">Cleanest water</h2>
            </div>
            <div className="flex flex-col gap-2">
              {best.map((pc) => (
                <Link key={pc.district} href={`/postcode/${pc.district}`} className="card px-4 py-3 flex items-center gap-3 group">
                  <span className="font-data font-bold text-sm text-ink w-12 shrink-0">{pc.district}</span>
                  <span className="text-sm text-muted flex-1 truncate">{pc.areaName}</span>
                  <span className={`font-data text-sm font-bold ${scoreTextClass(pc.safetyScore)}`}>{pc.safetyScore.toFixed(1)}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-faint group-hover:text-accent transition shrink-0" />
                </Link>
              ))}
            </div>
          </section>
        </ScrollReveal>
      </div>

      {/* Water suppliers */}
      <ScrollReveal delay={0}>
        <section className="mt-12">
          <h2 className="font-display text-xl text-ink italic mb-4">Water suppliers</h2>
          <div className="card divide-y divide-rule">
            {suppliers.map((name) => {
              const supplierPostcodes = allPostcodes.filter((p) => p.supplier === name);
              const supplierId = supplierPostcodes[0]?.supplierId;
              return (
                <Link
                  key={name}
                  href={supplierId ? `/supplier/${supplierId}` : "#"}
                  className="flex items-center gap-3 px-4 py-3 group hover:bg-wash transition-colors"
                >
                  <Building2 className="w-4 h-4 text-faint shrink-0" />
                  <span className="font-medium text-sm text-ink group-hover:text-accent transition flex-1">{name}</span>
                  <span className="text-xs text-faint font-data">{supplierPostcodes.length} areas</span>
                  <ChevronRight className="w-3.5 h-3.5 text-faint group-hover:text-accent transition shrink-0" />
                </Link>
              );
            })}
          </div>
        </section>
      </ScrollReveal>

      {/* All postcode areas — safety net so every postcode has at least one internal link */}
      <ScrollReveal delay={0}>
        <section className="mt-12">
          <h2 className="font-display text-xl text-ink italic mb-1">
            All postcode areas in {region.name}
          </h2>
          <p className="text-sm text-muted mb-4">
            Every postcode district we monitor in this region.
          </p>
          <div className="flex flex-wrap gap-2">
            {[...allPostcodes, ...allUnscoredPostcodes]
              .sort((a, b) => a.district.localeCompare(b.district))
              .map((pc) => (
                <Link
                  key={pc.district}
                  href={`/postcode/${pc.district}`}
                  className="pill"
                >
                  <MapPin className="w-3 h-3 text-faint mr-1" />
                  {pc.district}
                </Link>
              ))}
          </div>
        </section>
      </ScrollReveal>

      {/* Methodology footer */}
      <footer className="mt-10 pb-4 text-sm text-faint leading-relaxed">
        Data sourced from the Environment Agency Water Quality Archive and water company testing
        via the Stream Water Data Portal. See our{" "}
        <Link href="/about/methodology" className="underline underline-offset-2 hover:text-muted transition-colors">
          methodology
        </Link>{" "}
        for how scores are calculated.
        <span className="block mt-2">
          Reviewed by{" "}
          <Link href="/about" className="underline underline-offset-2 hover:text-muted transition-colors">
            the TapWater.uk research team
          </Link>
        </span>
      </footer>
    </div>
  );
}
