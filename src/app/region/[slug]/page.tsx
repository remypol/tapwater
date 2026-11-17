import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TankSearch } from "@/components/tank/tank-search";
import "@/components/tank/tank.css";
import { BreadcrumbSchema, FAQSchema } from "@/components/json-ld";
import { HardWaterCta } from "@/components/hard-water-cta";
import { AreaRiversSection } from "@/components/river-status";
import { getRiversForDistricts } from "@/lib/river-status-data";
import { REGIONS, getRegionBySlug } from "@/lib/regions";
import { getCityBySlug, CITIES } from "@/lib/cities";
import { getPostcodesByCity, getHardness } from "@/lib/data";
import type { PostcodeData } from "@/lib/types";
import { OG_IMAGE } from "@/lib/og";

export const revalidate = 86400;

interface Props {
  params: Promise<{ slug: string }>;
}

// Every region slug is enumerated at build time from the repo. Without this,
// notFound() alone can still serve a cached 200 on Vercel — see the comment in
// /postcode/[district]/page.tsx for the measured behaviour.
export const dynamicParams = false;

export async function generateStaticParams() {
  return REGIONS.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const region = getRegionBySlug(slug);
  if (!region) return { title: "Not Found" };

  const year = new Date().getFullYear();
  const scored = await getScoredForRegion(region.cities);
  const avgScore = scored.length > 0
    ? scored.reduce((sum, p) => sum + p.safetyScore, 0) / scored.length
    : 0;
  const score = `${avgScore.toFixed(1)}/10`;
  const districts = `${scored.length} postcode district${scored.length === 1 ? "" : "s"}`;
  // "fail" is a reading over its limit; "warning" is close to it but under.
  const failed = scored.filter((p) => p.readings.some((r) => r.status === "fail")).length;
  const suppliers = [...new Set(scored.map((p) => p.supplier))];
  const suppliedBy = suppliers.length > 0
    ? ` Supplied by ${suppliers.slice(0, 2).join(" and ")}${suppliers.length > 2 ? ` and ${suppliers.length - 2} more` : ""}.`
    : "";

  // "Yes" only when the page's own data backs it: the region has tap water
  // scores, the average is in the band the page calls safe (7 and over), and
  // no district has a reading over its limit.
  const answersYes = scored.length > 0 && failed === 0 && avgScore >= 7;

  // Google cuts a title at roughly 60 characters. Drop the year first, then
  // shorten the wording.
  const pageTitle = scored.length === 0
    ? firstThatFits(62, [
        `Is Tap Water Safe to Drink in ${region.name}? What We Know`,
        `Is ${region.name} Tap Water Safe? What We Know`,
        `${region.name} Tap Water: What We Know`,
      ])
    : answersYes
      ? firstThatFits(62, [
          `Is Tap Water Safe to Drink in ${region.name}? Yes: ${score} (${year})`,
          `Is Tap Water Safe to Drink in ${region.name}? Yes: ${score}`,
          `Is ${region.name} Tap Water Safe? Yes: ${score} (${year})`,
          `Is ${region.name} Tap Water Safe? Yes: ${score}`,
        ])
      : firstThatFits(62, [
          `Is Tap Water Safe to Drink in ${region.name}? ${score} (${year})`,
          `Is Tap Water Safe to Drink in ${region.name}? ${score}`,
          `Is ${region.name} Tap Water Safe? ${score} (${year})`,
          `Is ${region.name} Tap Water Safe? ${score}`,
        ]);

  // The answer first, then the evidence. Under 155 characters (154 at most).
  const regionDesc = scored.length === 0
    ? firstThatFits(154, [
        `Tap water in ${region.name} is held to the same legal standards as the rest of the UK. We do not have district test scores for it yet. ${region.description}`,
        `Tap water in ${region.name} is held to the same legal standards as the rest of the UK. We do not have district test scores for it yet.`,
      ])
    : answersYes
      ? firstThatFits(154, [
          `Yes, tap water in ${region.name} is safe to drink. It scores ${score} across ${districts}, with no reading over its limit.${suppliedBy}`,
          `Yes, tap water in ${region.name} is safe to drink. It scores ${score} across ${districts}.${suppliedBy}`,
          `Yes, tap water in ${region.name} is safe to drink. It scores ${score} across ${districts}.`,
        ])
      : firstThatFits(154, [
          `Tap water in ${region.name} is regulated and scores ${score} across ${districts}, but ${failed} had a reading over its limit.${suppliedBy}`,
          `Tap water in ${region.name} is regulated and scores ${score} across ${districts}, but ${failed} had a reading over its limit.`,
        ]);

  return {
    title: pageTitle,
    description: regionDesc,
    openGraph: {
      images: OG_IMAGE,
      title: pageTitle,
      description: regionDesc,
      url: `https://www.tapwater.uk/region/${slug}`,
      type: "website",
    },
  };
}

/** The first candidate within the length limit; the last one if none fits. */
function firstThatFits(max: number, candidates: string[]): string {
  return candidates.find((c) => c.length <= max) ?? candidates[candidates.length - 1];
}

/**
 * The districts behind a region's score, for the title and description. The
 * same rule as the page body: every city in the region, each district once,
 * tap water results only (ea-only districts rest on river samples).
 */
async function getScoredForRegion(citySlugs: string[]): Promise<PostcodeData[]> {
  const scored: PostcodeData[] = [];
  for (const citySlug of citySlugs) {
    const city = getCityBySlug(citySlug);
    if (!city) continue;
    const all = (
      await Promise.all([city.name, ...city.matches].map((m) => getPostcodesByCity(m)))
    ).flat();
    const seen = new Set<string>();
    for (const p of all) {
      if (seen.has(p.district)) continue;
      seen.add(p.district);
      if (p.safetyScore >= 0 && p.dataSource !== "ea-only") scored.push(p);
    }
  }
  return scored;
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
    // Tap water only: ea-only districts rest on river samples (see the city page).
    const scored = deduped.filter((p) => p.safetyScore >= 0 && p.dataSource !== "ea-only");
    const unscored = deduped.filter((p) => !(p.safetyScore >= 0 && p.dataSource !== "ea-only"));
    if (deduped.length > 0) {
      cityData.push({ city, postcodes: scored, unscoredPostcodes: unscored });
    }
  }

  const allPostcodes = cityData.flatMap((c) => c.postcodes);
  const areaRivers = await getRiversForDistricts(
    cityData.flatMap((c) => [...c.postcodes, ...c.unscoredPostcodes]).map((p) => p.district),
  );
  const allUnscoredPostcodes = cityData.flatMap((c) => c.unscoredPostcodes);
  const totalPostcodes = allPostcodes.length;

  // No SCORED data for this region yet — show a minimal page instead of 404
  // (avoids build failures when seed data doesn't cover all regions).
  //
  // The gate used to count unscored districts too. Scotland has 468 of them in the
  // pipeline, all scoring -1 because the Environment Agency only covers England, so
  // it slipped past and rendered the full template with an average of zero. That
  // published "Scotland scores 0.0/10 for drinking water quality" and "below-average
  // water quality that warrants attention" about a company supplying 5.5m people,
  // indexable, off no measurements at all.
  if (totalPostcodes === 0) {
    return (
      <div className="wt">
        <div className="wt-top"><div className="wt-inner"><nav aria-label="Breadcrumb" className="wt-crumbs"><Link href="/">Home</Link><span aria-hidden="true">/</span><span aria-current="page">{region.name}</span></nav></div></div>
        <section className="wt-band wt-band--foam">
          <div className="wt-inner">
            <h1 className="wt-h2" style={{ fontSize: "clamp(2.4rem, 6vw, 4.6rem)" }}>Water quality in {region.name}</h1>
            <p className="wt-sub">{region.description}</p>
            <div className="wt-check" style={{ marginTop: 40 }}>
              <h2 className="wt-h2">Data coming soon</h2>
              <p className="wt-sub">We&apos;re still collecting water quality data for this region. Check back soon or search for a specific postcode.</p>
              <TankSearch />
            </div>
          </div>
        </section>
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

  // Drinking-water readings only; environmental samples do not describe tap water.
  // Measured districts first, postcode-area estimates when there are none, so
  // a hard-water region never loses the quote route for want of a reading.
  const regionHardnessAll = (await Promise.all(allPostcodes.map(p => getHardness(p.district))))
    .filter((h): h is NonNullable<typeof h> => h != null);
  const regionHardnessMeasured = regionHardnessAll.filter((h) => !h.estimated);
  const regionHardnessValues = (regionHardnessMeasured.length > 0 ? regionHardnessMeasured : regionHardnessAll)
    .map(h => h.value);
  const avgHardness = regionHardnessValues.length > 0
    ? regionHardnessValues.reduce((s, v) => s + v, 0) / regionHardnessValues.length
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

  const tank = (pc: PostcodeData) => (
    <Link key={pc.district} href={`/postcode/${pc.district}`} className="wt-card">
      <i style={{ height: `${Math.max(12, Math.min(92, pc.safetyScore * 10))}%` }} />
      <b>{pc.district}</b>
      <small>{pc.areaName}</small>
      <span>{pc.safetyScore.toFixed(1)} out of 10</span>
    </Link>
  );
  const level = Math.max(0.12, Math.min(0.92, avgScore / 10));
  const year = new Date().getFullYear();

  return (
    <div className="wt">
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: region.name, url: `https://www.tapwater.uk/region/${slug}` },
        ]}
      />
      <FAQSchema faqs={faqs} />
      <div className="wt-top"><div className="wt-inner"><nav aria-label="Breadcrumb" className="wt-crumbs"><Link href="/">Home</Link><span aria-hidden="true">/</span><span aria-current="page">{region.name}</span></nav></div></div>

      <section className="wt-tank" style={{ ["--wt-surface" as string]: `${(1 - level) * 100}%` }}>
        <div className="wt-inner">
          <div>
            <h1>
              <span className="wt-where">{`${totalPostcodes} postcode districts tested`}</span>
              <span>Water quality in {region.name}</span>
            </h1>
            <p className="wt-basis wt-nums">
              <strong>According to TapWater.uk&apos;s analysis, {region.name} scores {avgScore.toFixed(1)}/10 for drinking water quality in {year}, based on data from {totalPostcodes} postcode districts.</strong>{" "}
              {region.description}
            </p>
            <div className="wt-heroacts"><TankSearch /></div>
          </div>
          <div className="wt-level wt-nums">
            <p className="wt-big">{avgScore.toFixed(1)}<small> / 10</small></p>
            <p>{totalPostcodes} areas tested · {suppliers.length} supplier{suppliers.length !== 1 ? "s" : ""}{pfasCount > 0 ? ` · PFAS in ${pfasCount}` : ""}</p>
          </div>
        </div>
      </section>

      <section className="wt-band wt-band--white">
        <div className="wt-inner">
          <p className="wt-prose wt-nums">
            Tap water in {region.name} has an average safety score of {avgScore.toFixed(1)} out of 10 based on testing across {totalPostcodes} postcode districts. Water is supplied by {suppliers.join(", ")}.
            {pfasCount > 0 ? ` PFAS (forever chemicals) have been detected in ${pfasCount} areas.` : ""}
            {" "}The {scoreLabel === "safe" ? "overall water quality is good" : scoreLabel === "moderate" ? "overall quality is acceptable but some areas have issues" : "region has below-average water quality that warrants attention"}.
            Data is sourced from the Environment Agency and water company testing via the Stream Water Data Portal.
          </p>
          <h2 className="wt-h2" style={{ marginTop: 56 }}>Cities in {region.name}</h2>
          <p className="wt-sub">Average water quality score by city.</p>
          <div className="wt-cards wt-nums" style={{ marginTop: 24 }}>
            {cityAverages.map(({ city, postcodes, avgScore: cityAvg }) => (
              <Link key={city.slug} href={`/city/${city.slug}`} className="wt-card">
                <i style={{ height: `${Math.max(12, Math.min(92, cityAvg * 10))}%` }} />
                <b>{city.name}</b>
                <small>{postcodes.length} areas tested</small>
                <span>{cityAvg.toFixed(1)} out of 10</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {avgHardness != null && hardnessClass != null ? (
        <section className={`wt-chalk${avgHardness >= 180 ? "" : " wt-chalk--soft"}`}>
          <div className="wt-inner">
            <div className="wt-chalk-grid">
              <p className="wt-n wt-nums">{Math.round(avgHardness)}<small>mg of limescale minerals in every litre, on average across {region.name}</small></p>
              <div>
                <h2 className="wt-h2">{region.name} water is {hardnessClass}</h2>
                <p style={{ marginTop: 16 }}>Hard starts at 180 mg/L, very hard at 250. Hardness varies by area; check your own postcode for the reading where you live.</p>
                <p style={{ marginTop: 12 }}><Link className="wt-link" href="/hardness/">How hardness works, and what to do about it</Link></p>
              </div>
            </div>
            {avgHardness >= 180 ? <div className="wt-do-grid" style={{ marginTop: 48 }}><HardWaterCta placeName={region.name} hardness={avgHardness} hardnessClass={hardnessClass} source="region_page" /></div> : null}
          </div>
        </section>
      ) : null}

      <section className="wt-band wt-band--white">
        <div className="wt-inner">
          <AreaRiversSection placeName={region.name} data={areaRivers} />
        </div>
      </section>

      <section className="wt-band wt-band--foam">
        <div className="wt-inner wt-twocol">
          <div><h2 className="wt-h2">Areas to watch</h2><div className="wt-cards wt-nums" style={{ marginTop: 24 }}>{worst.map(tank)}</div></div>
          <div><h2 className="wt-h2">Cleanest water</h2><div className="wt-cards wt-nums" style={{ marginTop: 24 }}>{best.map(tank)}</div></div>
        </div>
      </section>

      <section className="wt-band wt-band--white">
        <div className="wt-inner">
          <h2 className="wt-h2">Water suppliers</h2>
          <ul className="wt-ledger wt-nums" style={{ maxWidth: 560, marginTop: 24 }}>
            {suppliers.map((name) => {
              const supplierPostcodes = allPostcodes.filter((p) => p.supplier === name);
              const supplierId = supplierPostcodes[0]?.supplierId;
              return (
                <li key={name}>
                  <strong>{supplierId ? <Link href={`/supplier/${supplierId}`}>{name}</Link> : name}</strong>
                  <b>{supplierPostcodes.length} areas</b>
                </li>
              );
            })}
          </ul>
          {/* All postcode areas: safety net so every postcode has at least one internal link */}
          <h2 className="wt-h2" style={{ marginTop: 56 }}>All postcode areas in {region.name}</h2>
          <p className="wt-sub">Every postcode district we monitor in this region.</p>
          <p className="wt-pills wt-nums" style={{ marginTop: 20 }}>
            {[...allPostcodes, ...allUnscoredPostcodes].sort((a, b) => a.district.localeCompare(b.district)).map((pc) => (
              <Link key={pc.district} href={`/postcode/${pc.district}`}>{pc.district}</Link>
            ))}
          </p>
        </div>
      </section>

      <section className="wt-faq">
        <div className="wt-inner">
          <h2 className="wt-h2">Questions about {region.name} water</h2>
          {faqs.map((f, i) => (
            <details key={f.question} open={i === 0}><summary>{f.question}</summary><p>{f.answer}</p></details>
          ))}
          <p className="wt-fine" style={{ marginTop: 40 }}>
            Data sourced from the Environment Agency Water Quality Archive and water company testing via the Stream Water Data Portal. See our{" "}
            <Link href="/about/methodology">methodology</Link> for how scores are calculated. Reviewed by <Link href="/about">the TapWater.uk research team</Link>.
          </p>
        </div>
      </section>
    </div>
  );
}
