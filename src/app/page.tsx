import Link from "next/link";
import type { Metadata } from "next";
import { MOST_CHECKED } from "@/lib/mock-data";
import { getPostcodeData, getSuppliersList, getTrustMetrics, getRankedPostcodes, getRecentlyUpdatedPostcodes, getHardnessMap, getNationalAverageScore } from "@/lib/data";
import { HardnessMap } from "@/components/hardness-map";
import { TankCanvas } from "@/components/tank/tank-canvas";
import { TankSearch } from "@/components/tank/tank-search";
import "@/components/tank/tank.css";
import type { PostcodeData } from "@/lib/types";
import { FixPicks } from "@/components/fix-picks";
import { FAQSchema } from "@/components/json-ld";
import { REGIONS } from "@/lib/regions";

export const metadata: Metadata = {
  title: { absolute: "Check UK Tap Water Quality by Postcode | TapWater.uk" },
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

export default async function HomePage() {
  // All queries run in parallel — no N+1 loading
  const [{ worst, best }, suppliers, TRUST_METRICS, popularSearches, recentlyUpdated, hardnessMap, nationalAverage] =
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
      getHardnessMap(),
      getNationalAverageScore(),
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

  const level = Math.max(0.5, Math.min(0.84, nationalAverage / 10));
  const tankCard = (d: PostcodeData) => (
    <Link key={d.district} href={`/postcode/${d.district}`} className="wt-card">
      <i style={{ height: `${Math.max(12, Math.min(92, d.safetyScore * 10))}%` }} />
      <b>{d.district}</b>
      <small>{d.areaName}</small>
      <span>{d.safetyScore.toFixed(1)} out of 10</span>
    </Link>
  );

  return (
    <div>
      <FAQSchema faqs={faqs} />
      <div className="wt wt-home">
        {/* ── The tank: one job, enter a postcode ── */}
        <section className="wt-tank" id="wt-tank" style={{ ["--wt-surface" as string]: `${(1 - level) * 100}%` }}>
          <TankCanvas level={level} hardness={120} />
          <div className="wt-inner">
            <div>
              <h1>Check the water quality in your area</h1>
              <p className="wt-basis">A free report for your postcode, built from real drinking-water tests.</p>
              <TankSearch />
              <p className="wt-homefacts wt-nums">
                {whatYouSee.map(({ value, label }, i) => (
                  <span key={label}>{i > 0 ? ", " : ""}{value} {label}</span>
                ))}
                {whatYouSee.length > 0 ? ". " : ""}
                {topArea && bottomArea ? (
                  <>
                    Right now the gap runs from{" "}
                    <Link href={`/postcode/${bottomArea.district}`}>{bottomArea.district} ({bottomArea.areaName})</Link> at{" "}
                    {bottomArea.safetyScore.toFixed(1)}/10 to{" "}
                    <Link href={`/postcode/${topArea.district}`}>{topArea.district} ({topArea.areaName})</Link> at{" "}
                    {topArea.safetyScore.toFixed(1)}/10. Your report shows where your postcode sits, and which readings put it there.
                  </>
                ) : null}
              </p>
            </div>
          </div>
        </section>

        {/* ── What a report looks like: real districts, each filled to its score ── */}
        <section className="wt-band wt-band--foam" aria-labelledby="home-checked-h">
          <div className="wt-inner">
            <h2 className="wt-h2" id="home-checked-h">Popular searches</h2>
            <p className="wt-sub">Every tank is a real district, filled to its score out of 10. Tap one to see what is in the water.</p>
            <div className="wt-cards wt-nums">{popularSearches.map(({ data }) => tankCard(data))}</div>
          </div>
        </section>

        <section className="wt-band wt-band--white" aria-label="Highest and lowest scoring areas">
          <div className="wt-inner wt-twocol">
            <div>
              <h2 className="wt-h2">Areas to watch</h2>
              <p className="wt-sub">The lowest scores in recent tap-water tests. A low score is a reason to look closer, not a sign the water is unsafe.</p>
              <div className="wt-cards wt-nums">{worst.map(tankCard)}</div>
            </div>
            <div>
              <h2 className="wt-h2">Cleanest water</h2>
              <p className="wt-sub">The highest scores in the country right now.</p>
              <div className="wt-cards wt-nums">{best.map(tankCard)}</div>
            </div>
          </div>
          <div className="wt-inner">
            <p className="wt-pills" style={{ marginTop: 40 }}>
              <Link href="/rankings/">UK water quality rankings</Link>
              <Link href="/compare">Compare two areas</Link>
              <Link href="/postcode">Every postcode district</Link>
            </p>
          </div>
        </section>

        {/* ── Hard water: the question most people arrive with ── */}
        <section className="wt-chalk" aria-labelledby="home-hard-h">
          <div className="wt-inner">
            <h2 className="wt-h2" id="home-hard-h">Is your water hard or soft?</h2>
            <p className="wt-sub">
              Hard water is safe to drink and rough on kettles, boilers and showers. Each dot is a postcode district, coloured by how much limescale mineral is in the water.
            </p>
            <HardnessMap districts={hardnessMap.districts} decorative />
            <p className="wt-pills">
              <Link href="/hardness/">Water hardness checker</Link>
              <Link href="/guides/water-hardness-map">The full hardness map</Link>
              <Link href="/guides/do-i-need-a-water-softener">Do I need a water softener?</Link>
            </p>
          </div>
        </section>

        {/* ── The homepage's only commercial step ── */}
        <section className="wt-band wt-band--white">
          <div className="wt-inner">
            <FixPicks
              pageType="home"
              placement="home-picks"
              title="The fixes people actually buy"
              intro={
                <>
                  Of everything we link to, these three are what readers click most: a jug for drinking water, a shower filter for chlorine, and a reverse osmosis
                  unit that needs no plumbing. They are starting points, not a prescription. Check your postcode above and the report tells you what your own water
                  needs.
                </>
              }
            />
          </div>
        </section>

        {/* ── Browse ── */}
        <section className="wt-band wt-band--foam" aria-labelledby="home-browse-h">
          <div className="wt-inner">
            <h2 className="wt-h2" id="home-browse-h">Explore</h2>
            <ul className="wt-guides">
              {[
                { href: "/rankings/", title: "UK Water Quality Rankings", desc: "Every scored district, best to worst" },
                { href: "/hardness/", title: "Water Hardness Checker", desc: "Hard or soft, and what it means at home" },
                { href: "/guides/is-uk-tap-water-safe/", title: "Is UK Tap Water Safe?", desc: "What the tests say, in plain English" },
                { href: "/guides/water-problems/", title: "Water Problems?", desc: "Taste, smell, colour and limescale, and what fixes each" },
                { href: "/rivers", title: "River Health in England", desc: "How the Environment Agency rates your local river" },
                { href: "/pfas", title: "PFAS Tracker", desc: "Forever chemicals measured in rivers and groundwater" },
              ].map(({ href, title, desc }) => (
                <li key={href}>
                  <Link href={href}><strong>{title}</strong><span>{desc}</span></Link>
                </li>
              ))}
            </ul>

            <h3 className="wt-grouph">By city</h3>
            <p className="wt-pills">
              {[["London", "london"], ["Manchester", "manchester"], ["Birmingham", "birmingham"], ["Leeds", "leeds"], ["Glasgow", "glasgow"], ["Edinburgh", "edinburgh"]].map(([name, slug]) => (
                <Link key={slug} href={`/city/${slug}/`}>{name}</Link>
              ))}
            </p>
            <h3 className="wt-grouph">By region</h3>
            <p className="wt-pills">
              {REGIONS.map((region) => <Link key={region.slug} href={`/region/${region.slug}`}>{region.name}</Link>)}
            </p>
            <h3 className="wt-grouph">By water company</h3>
            <p className="wt-pills">
              {suppliers.slice(0, 6).map((supplier) => <Link key={supplier.id} href={`/supplier/${supplier.id}`}>{supplier.name}</Link>)}
              <Link href="/supplier">All water companies</Link>
            </p>
            {recentlyUpdated.length > 0 ? (
              <>
                <h3 className="wt-grouph">Recently updated reports</h3>
                <p className="wt-pills wt-nums">
                  {recentlyUpdated.map((pc) => <Link key={pc.district} href={`/postcode/${pc.district}`}>{pc.district} {pc.areaName}</Link>)}
                </p>
              </>
            ) : null}
          </div>
        </section>

        {/* ── Questions ── */}
        <section className="wt-faq" aria-labelledby="home-faq-heading">
          <div className="wt-inner">
            <h2 className="wt-h2" id="home-faq-heading">Water quality questions</h2>
            {faqs.map((f, i) => (
              <details key={f.question} open={i === 0}>
                <summary>{f.question}</summary>
                <p>{f.answer}</p>
              </details>
            ))}
            <p className="wt-fine" style={{ marginTop: 32 }}>
              Data from UK water companies, the Environment Agency and the Drinking Water Inspectorate.{" "}
              <Link href="/about">About TapWater.uk</Link> · <Link href="/about/methodology">How we score</Link> · <Link href="/about/data-sources">Where the data comes from</Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
