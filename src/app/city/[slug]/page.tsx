import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TankSearch } from "@/components/tank/tank-search";
import { SoftenerButton, StickyAction } from "@/components/tank/tank-actions";
import "@/components/tank/tank.css";
import { BreadcrumbSchema, FAQSchema } from "@/components/json-ld";
import { pickRelatedGuides } from "@/lib/guides";
import { EmbedCta } from "@/components/embed-cta";
import { HardWaterCta } from "@/components/hard-water-cta";
import { FixPicks } from "@/components/fix-picks";
import { AreaRiversSection } from "@/components/river-status";
import { getRiversForDistricts } from "@/lib/river-status-data";
import { getPostcodeData, getAllPostcodeDistricts, getNationalAverageScore, getHardness } from "@/lib/data";
import type { PostcodeData } from "@/lib/types";
import { CITIES, getCityBySlug } from "@/lib/cities";
import { REGIONS } from "@/lib/regions";
import { getActiveIncidentsForCity } from "@/lib/incidents";

export const revalidate = 86400;

/**
 * Only the cities in CITIES exist at this route.
 *
 * The notFound() in the page body was never enough on its own: with on-demand
 * params an unknown slug rendered, hit notFound(), and Next cached that result
 * as a prerender, which Vercel then served as HTTP 200. So /city/verzonnen
 * answered 200 for any invented slug, exactly as /postcode/ZZ99 used to.
 *
 * Same fix as /postcode/[district]: generateStaticParams already enumerates
 * every city we publish, so anything outside that list 404s at the routing
 * layer, before it can be rendered and cached.
 */
export const dynamicParams = false;

interface Props {
  params: Promise<{ slug: string }>;
}

// ── Helpers ──

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

/**
 * A district counts toward a city's tap water score only if its readings come from
 * tap water. ea-only districts rest on river and groundwater samples: the postcode
 * pages already keep them out of the index, and until 26 Sept 2026 the city pages
 * still averaged them, so Bristol and Bath showed a "drinking water" score built
 * from river samples.
 */
function hasTapScore(p: PostcodeData): boolean {
  return p.safetyScore >= 0 && p.dataSource !== "ea-only";
}

/**
 * How many of a city's scored districts have a reading over its limit.
 * "fail" is the status scoring gives a value above the legal limit (or above
 * zero for the zero-tolerance ones); "warning" is close to the limit but under it.
 */
function districtsOverLimit(scored: PostcodeData[]): number {
  return scored.filter((p) => p.readings.some((r) => r.status === "fail")).length;
}

/** The supplier serving the most districts, or null when we hold no name for it. */
function primarySupplierName(postcodes: PostcodeData[]): string | null {
  const counts = new Map<string, number>();
  for (const p of postcodes) counts.set(p.supplier, (counts.get(p.supplier) ?? 0) + 1);
  const top = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0];
  return top && top[0] && top[0] !== "Unknown" ? top[0] : null;
}

/**
 * For a city with no tap water scores: what the site does hold for it, so the
 * description never promises hardness or river data that is not there.
 */
async function whatWeHold(postcodes: PostcodeData[]): Promise<{ full: string; short: string }> {
  const districts = postcodes.map((p) => p.district);
  const [hardness, rivers] = await Promise.all([
    Promise.all(districts.map((d) => getHardness(d))),
    getRiversForDistricts(districts),
  ]);
  const hasHardness = hardness.some((h) => h != null);
  const hasRivers = rivers != null;
  const have = hasHardness && hasRivers
    ? "We have hardness and river data"
    : hasHardness
      ? "We have hardness data"
      : hasRivers
        ? "We have river health data nearby"
        : null;
  if (!have) {
    const none = "We do not have district test scores for it yet.";
    return { full: none, short: none };
  }
  return { full: `${have}, but no district test scores yet.`, short: `${have}, no test scores yet.` };
}

/** The first candidate within the length limit; the last one if none fits. */
function firstThatFits(max: number, candidates: string[]): string {
  return candidates.find((c) => c.length <= max) ?? candidates[candidates.length - 1];
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
  const scored = postcodes.filter(hasTapScore);
  const avgScore =
    scored.length > 0
      ? (scored.reduce((sum, p) => sum + p.safetyScore, 0) / scored.length)
      : 0;

  const year = new Date().getFullYear();
  const contaminantCount = new Set(scored.flatMap(p => p.readings.map(r => r.name))).size;
  const score = `${avgScore.toFixed(1)}/10`;
  const areas = `${scored.length} Area${scored.length === 1 ? "" : "s"} Tested`;
  const districts = `${scored.length} district${scored.length === 1 ? "" : "s"}`;
  const failed = districtsOverLimit(scored);
  const supplier = primarySupplierName(postcodes);
  const suppliedBy = supplier ? ` Supplied by ${supplier}.` : "";

  // The title answers the question people typed. "Yes" is only printed when the
  // page's own data backs it: the city has tap water scores and no district has
  // a reading over its limit. Otherwise the title gives the score and stops.
  // The 7 is the line at which the page itself opens with "Yes, ... is safe to drink".
  const answersYes = scored.length > 0 && failed === 0 && avgScore >= 7;

  // Google cuts a title at roughly 60 characters. Drop the year first, then
  // shorten the wording.
  const pageTitle = scored.length === 0
    ? firstThatFits(62, [
        `Can You Drink Tap Water in ${city.name}? What We Know`,
        `Can You Drink ${city.name} Tap Water? What We Know`,
        `Can You Drink Tap Water in ${city.name}?`,
      ])
    : answersYes
      ? firstThatFits(62, [
          `Can You Drink Tap Water in ${city.name}? Yes: ${score} (${year})`,
          `Can You Drink Tap Water in ${city.name}? Yes: ${score}`,
          `Can You Drink ${city.name} Tap Water? Yes: ${score}`,
        ])
      : firstThatFits(62, [
          `Can You Drink Tap Water in ${city.name}? ${score}, ${areas}`,
          `Can You Drink ${city.name} Tap Water? ${score}, ${areas}`,
          `${city.name} Tap Water: ${score}, ${areas}`,
        ]);

  const held = scored.length === 0 ? await whatWeHold(postcodes) : { full: "", short: "" };

  // The answer first, then the evidence. Under 155 characters (154 at most).
  // With no tap water results a score line would read "0.0/10 based on 0
  // contaminants across 0 postcodes", which is what Google showed for Edinburgh,
  // so those cities get the plain facts and no figure.
  const description = scored.length === 0
    ? firstThatFits(154, [
        `${city.name} tap water is held to the same legal standards as the rest of the UK.${suppliedBy} ${held.full}`,
        `${city.name} tap water is held to the same legal standards as all UK tap water.${suppliedBy} ${held.short}`,
        `${city.name} tap water is held to UK legal standards.${suppliedBy} ${held.short}`,
        `${city.name} tap water is held to UK legal standards. ${held.short}`,
      ])
    : answersYes
      ? firstThatFits(154, [
          `Yes, you can drink tap water in ${city.name}. It scores ${score} across ${districts}, with ${contaminantCount} contaminants tested and none over its limit.${suppliedBy}`,
          `Yes, you can drink tap water in ${city.name}. It scores ${score} across ${districts}, with ${contaminantCount} contaminants tested.${suppliedBy}`,
          `Yes, you can drink tap water in ${city.name}. It scores ${score} across ${districts}, with ${contaminantCount} contaminants tested.`,
        ])
      : firstThatFits(154, [
          `${city.name} tap water is regulated and scores ${score}, but ${failed} of ${districts} had a reading over its limit. ${contaminantCount} contaminants tested.${suppliedBy}`,
          `${city.name} tap water is regulated and scores ${score}, but ${failed} of ${districts} had a reading over its limit.${suppliedBy}`,
          `${city.name} tap water is regulated and scores ${score}, but ${failed} of ${districts} had a reading over its limit.`,
        ]);

  const socialTitle = scored.length === 0
    ? `Can You Drink Tap Water in ${city.name}? What We Know`
    : answersYes
      ? `Can You Drink Tap Water in ${city.name}? Yes: ${score} (${year})`
      : `Can You Drink Tap Water in ${city.name}? ${score}, ${areas}`;

  return {
    title: pageTitle,
    description,
    openGraph: {
      title: socialTitle,
      description,
      url: `https://www.tapwater.uk/city/${city.slug}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
    },
  };
}

// ── Page ──

export default async function CityPage({ params }: Props) {
  const { slug } = await params;
  const city = getCityBySlug(slug);
  if (!city) notFound();

  const activeIncidents = await getActiveIncidentsForCity(slug);

  const [allPostcodes, nationalAvg] = await Promise.all([
    getPostcodesForCity(city.matches),
    getNationalAverageScore(),
  ]);
  const scored = allPostcodes.filter(hasTapScore);
  const areaRivers = await getRiversForDistricts(allPostcodes.map((p) => p.district));

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
    .filter((p) => !hasTapScore(p))
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

  const canYouDrinkAnswer =
    avgScore >= 4
      ? `Yes, you can drink tap water in ${city.name}. It is regulated to UK drinking water standards, and across ${scored.length} tested areas the average water quality score is ${avgScore.toFixed(1)}/10. ${avgScore >= 7 ? "Enter your postcode for the readings in your exact area." : "Some areas scored below average, so it is worth checking your own postcode."}`
      : `Tap water in ${city.name} meets legal requirements, so you can drink it, but several areas showed elevated contaminant levels (average score ${avgScore.toFixed(1)}/10 across ${scored.length} areas tested). Check your specific postcode for details.`;

  const supplierAnswer = `Water in ${city.name} is supplied by ${primarySupplier.name}${supplierCounts.size > 1 ? ` (covering most areas), with ${supplierCounts.size - 1} other supplier${supplierCounts.size > 2 ? "s" : ""} serving parts of the city` : ""}. ${city.description}`;

  const contaminantsAnswer =
    topConcerns.length > 0
      ? `The most commonly flagged contaminants across ${city.name} are ${topConcerns.slice(0, 4).map(([name, count]) => `${name} (flagged in ${count} area${count > 1 ? "s" : ""})`).join(", ")}. ${pfasCount > 0 ? `PFAS (forever chemicals) were detected in ${pfasCount} area${pfasCount > 1 ? "s" : ""}.` : "No PFAS were detected."}`
      : `No contaminants were flagged above recommended levels across ${city.name}. All tested areas passed on the parameters measured.`;

  // Compute hardness for the city
  // Drinking-water readings only. River and groundwater samples say nothing
  // about what comes out of the tap: Manchester's rivers run hard while its
  // mains water is soft, and mixing the two called the city hard.
  // Same source as the postcode pages (getHardness reads the raw
  // drinking_water_readings table); measured districts only, no area estimates.
  // Measured districts first. When none of the city's districts has a reading
  // of its own, the postcode-area medians stand in, so a hard-water city still
  // gets the quote route: an estimate that says "hard" is a better answer than
  // no answer, and the postcode page shows the estimate label either way.
  const cityHardnessByDistrict = (await Promise.all(scored.map(async (p) => ({ district: p.district, areaName: p.areaName, h: await getHardness(p.district) }))))
    .filter((r): r is { district: string; areaName: string; h: NonNullable<typeof r.h> } => r.h != null)
    .sort((a, b) => b.h.value - a.h.value);
  const cityHardnessAll = cityHardnessByDistrict.map((r) => r.h);
  const cityHardnessMeasured = cityHardnessAll.filter((h) => !h.estimated);
  const cityHardnessValues = (cityHardnessMeasured.length > 0 ? cityHardnessMeasured : cityHardnessAll)
    .map(h => h.value);
  const avgHardness = cityHardnessValues.length > 0
    ? cityHardnessValues.reduce((s, v) => s + v, 0) / cityHardnessValues.length
    : null;
  const hardnessClass = avgHardness != null
    ? avgHardness < 60 ? "soft" : avgHardness < 120 ? "moderately soft" : avgHardness < 180 ? "moderately hard" : avgHardness < 250 ? "hard" : "very hard"
    : null;

  const hardestRow = cityHardnessByDistrict[0];
  const softestRow = cityHardnessByDistrict[cityHardnessByDistrict.length - 1];
  const hardnessSpread = hardestRow && softestRow && hardestRow.district !== softestRow.district
    ? ` It ranges from ${softestRow.h.value} mg/L in ${softestRow.district} to ${hardestRow.h.value} mg/L in ${hardestRow.district}.`
    : "";
  // The quote form only renders inside the scored-city layout, so the hero link
  // and the sticky bar must follow the same condition or they point at nothing.
  const cityIsHard = scored.length > 0 && avgHardness != null && hardnessClass != null && avgHardness >= 180;
  const hardnessAnswer = avgHardness != null
    ? `Water in ${city.name} has an average hardness of ${Math.round(avgHardness)} mg/L CaCO₃, which is classified as ${hardnessClass}.${hardnessSpread} ${avgHardness >= 180 ? "Hard water causes limescale buildup in kettles and appliances. A water softener or filter may help." : avgHardness < 60 ? "Soft water is gentle on appliances and skin." : "This is a moderate hardness level."}`
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

  // Hotels, rentals and halls: the same mains water, a different building.
  // No score and no "yes" here, so the answer holds for every city.
  const hotelsAnswer = `Hotels in ${city.name} take the same mains water as homes${primarySupplier.name !== "Unknown" ? `, supplied by ${primarySupplier.name}` : ""} and tested to the same legal standards. What differs is inside the building: older pipes, storage tanks, and taps that have stood unused. Run the cold tap for a moment before you fill a glass, and where you can, drink from a kitchen cold tap or one marked as drinking water rather than a bathroom tap, which may be fed from a tank.`;

  const cityFaqs = [
    { question: `Is ${city.name} tap water safe to drink?`, answer: safetyAnswer },
    { question: `Can you drink tap water in ${city.name}?`, answer: canYouDrinkAnswer },
    { question: `Is it safe to drink tap water in ${city.name} hotels?`, answer: hotelsAnswer },
    { question: `What is the water quality in ${city.name}?`, answer: contaminantsAnswer },
    { question: `Is ${city.name} water hard or soft?`, answer: hardnessAnswer },
    { question: `Which areas of ${city.name} have the best water?`, answer: bestAreasAnswer },
    { question: `Who supplies water in ${city.name}?`, answer: supplierAnswer },
    { question: `Are there PFAS in ${city.name} water?`, answer: pfasAnswer },
  ];

  const parentRegion = REGIONS.find((r) => r.cities.includes(city.slug));
  const guides = pickRelatedGuides({
    pfasDetected: pfasCount > 0,
    hasLeadFlagged: topConcerns.some(([name]) => /lead/i.test(name)),
    isHardWater: (avgHardness ?? 0) >= 180,
    hasContaminantsFlagged: totalFlagged > 0,
  });
  const tank = (pc: PostcodeData) => (
    <Link key={pc.district} href={`/postcode/${pc.district}`} className="wt-card">
      <i style={{ height: `${Math.max(12, Math.min(92, pc.safetyScore * 10))}%` }} />
      <b>{pc.district}</b>
      <small>{pc.areaName}</small>
      <span>{pc.safetyScore.toFixed(1)} out of 10</span>
    </Link>
  );
  const level = scored.length > 0 ? Math.max(0.12, Math.min(0.92, avgScore / 10)) : 0.3;

  return (
    <div className="wt">
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Cities", url: "https://www.tapwater.uk/city" },
          { name: city.name, url: `https://www.tapwater.uk/city/${city.slug}` },
        ]}
      />
      <FAQSchema faqs={cityFaqs} />
      <div className="wt-top">
        <div className="wt-inner">
          <nav aria-label="Breadcrumb" className="wt-crumbs">
            <Link href="/">Home</Link><span aria-hidden="true">/</span>
            {parentRegion ? <><Link href={`/region/${parentRegion.slug}`}>{parentRegion.name}</Link><span aria-hidden="true">/</span></> : null}
            <span aria-current="page">{city.name}</span>
          </nav>
        </div>
      </div>
      {activeIncidents.length > 0 ? (
        <div className="wt-alert" role="status"><div className="wt-inner">Live: {activeIncidents[0].title}. <Link href={`/supplier/${primarySupplier.id}`}>See current incidents</Link></div></div>
      ) : null}

      {/* ── The tank: the city filled to its average ── */}
      <section className="wt-tank" id="wt-tank" style={{ ["--wt-surface" as string]: `${(1 - level) * 100}%` }}>
        <div className="wt-inner">
          <div>
            <h1>
              <span className="wt-where">{`Tap water in ${city.name}${parentRegion && parentRegion.name !== city.name ? `, ${parentRegion.name}` : ""}`}</span>
              <span>Is {city.name} tap water safe to drink?</span>
            </h1>
            <p className="wt-basis wt-nums">
              {scored.length > 0 ? (
                <>
                  <strong>According to TapWater.uk&apos;s analysis, {city.name} scores {avgScore.toFixed(1)}/10 for drinking water quality in {year}.</strong>{" "}
                  Water is supplied by {primarySupplier.name} and has been tested for {contaminantCount} contaminants across {scored.length} postcode districts.
                </>
              ) : city.description}
            </p>
            <div className="wt-heroacts"><TankSearch /></div>
            {cityIsHard ? (
              <p className="wt-herohard wt-nums">
                {city.name} water is {hardnessClass} at {Math.round(avgHardness ?? 0)} mg/L.{" "}
                <a href="#softener-quotes" className="wt-link">What helps</a>
              </p>
            ) : null}
          </div>
          {scored.length > 0 ? (
            <div className="wt-level wt-nums">
              <p className="wt-big">{avgScore.toFixed(1)}<small> / 10</small></p>
              <p>{scored.length} areas tested · {totalFlagged} flagged{nationalAvg > 0 ? ` · UK average ${nationalAvg.toFixed(1)}` : ""}{pfasCount > 0 ? ` · PFAS in ${pfasCount}` : ""}</p>
            </div>
          ) : null}
        </div>
      </section>

      {scored.length > 0 ? (
        <>
          <section className="wt-band wt-band--white">
            <div className="wt-inner">
              <p className="wt-prose wt-nums">
                {avgScore >= 7 ? (
                  <>
                    <strong>Yes, {city.name} tap water is safe to drink.</strong> Based on {scored.length} areas tested, {city.name} has an average water quality score of{" "}
                    <strong>{avgScore.toFixed(1)}/10</strong>{nationalAvg > 0 ? ` (${scoreVsNational} the UK average of ${nationalAvg.toFixed(1)}/10)` : ""}.{" "}
                    {totalFlagged === 0 ? "No contaminants were found above recommended levels." : `${totalFlagged} contaminant${totalFlagged !== 1 ? "s were" : " was"} flagged above recommended levels across all areas.`}{" "}
                    Water is supplied by <Link href={`/supplier/${primarySupplier.id}`}>{primarySupplier.name}</Link>. {city.description}
                  </>
                ) : avgScore >= 5 ? (
                  <>
                    <strong>{city.name} tap water is mostly safe, but some areas have concerns.</strong> The average water quality score across {scored.length} areas is{" "}
                    <strong>{avgScore.toFixed(1)}/10</strong>, with {totalFlagged} contaminant{totalFlagged !== 1 ? "s" : ""} flagged above recommended levels. Water is supplied by{" "}
                    <Link href={`/supplier/${primarySupplier.id}`}>{primarySupplier.name}</Link>. {city.description}
                  </>
                ) : (
                  <>
                    <strong>{city.name} tap water has some quality concerns.</strong> The average water quality score across {scored.length} areas is <strong>{avgScore.toFixed(1)}/10</strong>, with{" "}
                    {totalFlagged} contaminant{totalFlagged !== 1 ? "s" : ""} flagged above recommended levels. Check your specific postcode for detailed results. Water is supplied by{" "}
                    <Link href={`/supplier/${primarySupplier.id}`}>{primarySupplier.name}</Link>. {city.description}
                  </>
                )}
                {pfasCount > 0 ? <> PFAS (forever chemicals) were detected in {pfasCount} of {scored.length} areas monitored.</> : null}
              </p>
              {topConcerns.length > 0 ? (
                <>
                  <h2 className="wt-h2" style={{ marginTop: 56 }}>Top concerns in {city.name}</h2>
                  <p className="wt-sub">Contaminants flagged most often across the city.</p>
                  <ul className="wt-ledger wt-nums" style={{ maxWidth: 560, marginTop: 24 }}>
                    {topConcerns.map(([name, count]) => (
                      <li key={name}><strong>{name}</strong><b>{count} area{count > 1 ? "s" : ""}</b></li>
                    ))}
                  </ul>
                </>
              ) : null}
              <h2 className="wt-h2" style={{ marginTop: 56 }}>In hotels, rentals and student halls</h2>
              <p className="wt-prose" style={{ marginTop: 16 }}>
                The water reaching a hotel, a rented flat or a hall of residence in {city.name} is the same mains supply that reaches every home, so the results on this page apply there too.
                What differs is inside the building: older pipes, storage tanks, and taps that have stood unused for a while.
                Run the cold tap for a moment before you fill a glass, and use the kitchen cold tap where there is one, since bathroom taps are sometimes fed from a tank.
              </p>
            </div>
          </section>

          <section className="wt-band wt-band--foam">
            <div className="wt-inner">
              <h2 className="wt-h2">Water quality by area</h2>
              <p className="wt-sub">All postcode districts in {city.name}, ranked by water quality score.</p>
              <div className="wt-tablewrap" style={{ marginTop: 24 }}>
                <table className="wt-table wt-table--light wt-nums" style={{ minWidth: 560, maxWidth: 900 }}>
                  <thead><tr><th scope="col">Postcode</th><th scope="col">Area</th><th scope="col" style={{ textAlign: "right" }}>Score</th><th scope="col" style={{ textAlign: "right" }}>Flagged</th><th scope="col">Supplier</th></tr></thead>
                  <tbody>
                    {sortedPostcodes.map((pc) => (
                      <tr key={pc.district}>
                        <td><Link href={`/postcode/${pc.district}`}>{pc.district}</Link></td>
                        <td style={{ opacity: 0.75 }}>{pc.areaName}</td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>{pc.safetyScore.toFixed(1)}</td>
                        <td style={{ textAlign: "right", opacity: 0.75 }}>{pc.contaminantsFlagged}</td>
                        <td style={{ opacity: 0.75 }}>{pc.supplier}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {unscoredPostcodes.length > 0 ? (
                <p className="wt-more">
                  {unscoredPostcodes.length} additional area{unscoredPostcodes.length !== 1 ? "s" : ""} with limited data:{" "}
                  {unscoredPostcodes.map((pc, i) => <span key={pc.district}>{i > 0 ? ", " : ""}<Link href={`/postcode/${pc.district}`}>{pc.district}</Link> {pc.areaName}</span>)}
                </p>
              ) : null}
            </div>
          </section>

          {avgHardness != null && hardnessClass != null ? (
            <section className={`wt-chalk${avgHardness >= 180 ? "" : " wt-chalk--soft"}`} id="hardness">
              <div className="wt-inner">
                <div className="wt-chalk-grid">
                  <p className="wt-n wt-nums">{Math.round(avgHardness)}<small>mg of limescale minerals in every litre, on average across {city.name}</small></p>
                  <div>
                    <h2 className="wt-h2" id="city-hardness-heading">{city.name} water is {hardnessClass}</h2>
                    <p style={{ marginTop: 16 }}>
                      {cityHardnessByDistrict.length >= 2 && hardnessSpread
                        ? `From ${softestRow.h.value} mg/L in ${softestRow.district} to ${hardestRow.h.value} mg/L in ${hardestRow.district}. Hard starts at 180, very hard at 250.`
                        : "Hard starts at 180 mg/L, very hard at 250."}
                      {cityHardnessMeasured.length < cityHardnessAll.length ? " Districts marked with an asterisk take their postcode area's median rather than a reading of their own." : ""}
                    </p>
                    <p style={{ marginTop: 12 }}><Link className="wt-link" href="/hardness/">How hardness works, and what to do about it</Link></p>
                  </div>
                </div>
                {avgHardness >= 180 ? (
                  <div className="wt-do-grid" style={{ marginTop: 48 }}>
                    <HardWaterCta placeName={city.name} hardness={avgHardness} hardnessClass={hardnessClass} source="city_page" />
                  </div>
                ) : null}
                {cityHardnessByDistrict.length >= 2 ? (
                  <>
                    <h3 className="wt-h3" style={{ marginTop: 48 }}>Water hardness across {city.name}</h3>
                    <div className="wt-tablewrap">
                      <table className="wt-table wt-table--light wt-nums" style={{ minWidth: 520, maxWidth: 760 }}>
                        <thead><tr><th scope="col">District</th><th scope="col">Area</th><th scope="col" style={{ textAlign: "right" }}>mg/L</th><th scope="col">Hardness</th></tr></thead>
                        <tbody>
                          {cityHardnessByDistrict.map((r) => (
                            <tr key={r.district}>
                              <td><Link href={`/postcode/${r.district}`}>{r.district}</Link>{r.h.estimated ? <span title="Postcode-area estimate">*</span> : null}</td>
                              <td style={{ opacity: 0.75 }}>{r.areaName}</td>
                              <td style={{ textAlign: "right" }}>{r.h.value}</td>
                              <td style={{ textTransform: "capitalize" }}>{r.h.label}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : null}
              </div>
            </section>
          ) : null}

          <section className="wt-band wt-band--white">
            <div className="wt-inner">
              <p className="wt-pills">
                <Link href={`/supplier/${primarySupplier.id}/`}>Main water supplier: {primarySupplier.name}{primarySupplier.count > 0 ? ` (${primarySupplier.count} postcode${primarySupplier.count !== 1 ? "s" : ""})` : ""}</Link>
              </p>
              <AreaRiversSection placeName={city.name} data={areaRivers} />
            </div>
          </section>

          {scored.length >= 2 ? (
            <section className="wt-band wt-band--foam">
              <div className="wt-inner">
                <h2 className="wt-h2">Best and worst areas in {city.name}</h2>
                <div className="wt-twocol" style={{ marginTop: 32 }}>
                  <div><h3 className="wt-h3">Best areas</h3><div className="wt-cards wt-nums">{bestPostcodes.map(tank)}</div></div>
                  <div><h3 className="wt-h3">Areas to watch</h3><div className="wt-cards wt-nums">{worstPostcodes.map(tank)}</div></div>
                </div>
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <section className="wt-band wt-band--white">
          <div className="wt-inner">
            <h2 className="wt-h2">Not enough data yet</h2>
            <p className="wt-sub">We don&apos;t have enough test results for {city.name} yet to show aggregate scores. Try searching for a specific postcode below.</p>
            {unscoredPostcodes.length > 0 ? (
              <p className="wt-pills" style={{ marginTop: 24 }}>
                {unscoredPostcodes.map((pc) => <Link key={pc.district} href={`/postcode/${pc.district}`}>{pc.district} {pc.areaName}</Link>)}
              </p>
            ) : null}
            <AreaRiversSection placeName={city.name} data={areaRivers} />
          </div>
        </section>
      )}

      {scored.length > 0 ? (
        <section className="wt-band wt-band--white">
          <div className="wt-inner">
            <FixPicks
              pageType="city"
              placement="city-picks"
              title={`What ${city.name} households buy`}
              intro={
                <>
                  Taste, chlorine and hardness bother people even where the water passes its tests. These are the three fixes our readers pick most: a jug for
                  drinking water, an under-sink filter you can fit yourself, and a reverse osmosis system for PFAS, fluoride and lead. Check your own postcode above to see which one your water needs.
                </>
              }
            />
          </div>
        </section>
      ) : null}

      {scored.length > 0 ? (
        <section className="wt-read" style={{ paddingBlock: "var(--wt-pad)" }}>
          <div className="wt-inner">
            <h2 className="wt-h2">Related guides</h2>
            <ul className="wt-guides">
              {guides.map((g) => (
                <li key={g.slug}><Link href={`/guides/${g.slug}/`}><strong>{g.title}</strong><span>{g.description}</span></Link></li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {cityIsHard ? (
        <StickyAction title={`${Math.round(avgHardness ?? 0)} mg/L: ${hardnessClass} water`} note="What helps with the limescale">
          <SoftenerButton district={city.name} label="What helps" paint="sun" placement="sticky" />
        </StickyAction>
      ) : null}

      <section className="wt-faq">
        <div className="wt-inner">
          <h2 className="wt-h2">{city.name} tap water: frequently asked questions</h2>
          {cityFaqs.map((faq, i) => (
            <details key={faq.question} open={i === 0}><summary>{faq.question}</summary><p>{faq.answer}</p></details>
          ))}
        </div>
      </section>

      <section className="wt-band wt-band--foam">
        <div className="wt-inner">
          {bestPostcodes.length > 0 ? <EmbedCta district={bestPostcodes[0].district} /> : null}
          <div className="wt-check" style={{ marginTop: 40 }}>
            <h2 className="wt-h2">Check your postcode</h2>
            <p className="wt-sub">Get a detailed water quality report for your exact area in {city.name}.</p>
            <TankSearch />
          </div>
          <p className="wt-fine" style={{ marginTop: 40 }}>
            Based on water quality data from {scored.length} postcode districts in {city.name}. Data from your water company via the Stream Water Data Portal and the Environment Agency. See our{" "}
            <Link href="/about/methodology">methodology</Link> for how scores are calculated.
          </p>
        </div>
      </section>
    </div>
  );
}
