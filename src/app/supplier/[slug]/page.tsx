import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  Building2,
  Award,
  ExternalLink,
  ChevronRight,
  MapPin,
  Droplets,
  ShieldCheck,
  Users,
} from "lucide-react";
import { BreadcrumbSchema, FAQSchema } from "@/components/json-ld";
import { GeoCitation } from "@/components/geo-citation";
import { EmbedCta } from "@/components/embed-cta";
import { IncidentAlerts } from "@/components/incident-alert";

import { MOCK_SUPPLIERS } from "@/lib/mock-data";
import { getPostcodeData, getSupplierBySlug, getHardness } from "@/lib/data";
import type { HardnessReading } from "@/lib/data";
import { getActiveIncidentsForSupplier } from "@/lib/incidents";
import { INDUSTRY_MEDIAN_CRI, describeSupplierQuality } from "@/lib/suppliers";
import { getScoreColor } from "@/lib/types";
import { OG_IMAGE } from "@/lib/og";
import { HardWaterCta } from "@/components/hard-water-cta";

// Incidents and the Supabase-first supplier source change at runtime.
export const revalidate = 86400;

type Props = { params: Promise<{ slug: string }> };

// Build the suppliers we know at deploy time; dynamicParams stays on so a
// supplier added in Supabase renders on demand (getSupplierBySlug resolves it)
// instead of 404ing until the next deploy.
export function generateStaticParams() {
  return MOCK_SUPPLIERS.map((s) => ({ slug: s.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supplier = await getSupplierBySlug(slug);

  if (!supplier) {
    return { title: "Not Found" };
  }

  const year = new Date().getFullYear();
  // Keep title under 45 chars; the layout template appends " | TapWater.uk".
  const fullTitle = `${supplier.name}: Water Quality & Hardness ${year}`;
  const shortTitle = `${supplier.name} Water Quality ${year}`;
  const title = fullTitle.length <= 45 ? fullTitle : shortTitle;

  const description = `${supplier.name} water quality, hardness and the regulator's rating across ${supplier.region}, with every postcode district it supplies.`;
  const url = `https://www.tapwater.uk/supplier/${supplier.id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      images: OG_IMAGE,
      title: `${supplier.name} Water Quality Report (${year})`,
      description,
      url,
      type: "article",
    },
    twitter: {
      images: OG_IMAGE,
      card: "summary_large_image",
      title: `${supplier.name} Water Quality Report (${year})`,
      description,
    },
  };
}

function getScoreBadgeColor(score: number): string {
  const color = getScoreColor(score);
  if (color === "safe") return "text-[var(--color-safe)]";
  if (color === "warning") return "text-[var(--color-warning)]";
  return "text-[var(--color-danger)]";
}

function getScoreLabel(score: number): string {
  if (score >= 9) return "Excellent";
  if (score >= 7) return "Good";
  if (score >= 5) return "Fair";
  if (score >= 3) return "Poor";
  return "Very Poor";
}

function getStatusBadgeClass(score: number): string {
  const color = getScoreColor(score);
  if (color === "safe") return "badge badge-safe";
  if (color === "warning") return "badge badge-warning";
  return "badge badge-danger";
}

const HARDNESS_ORDER = [
  "soft",
  "moderately soft",
  "moderately hard",
  "hard",
  "very hard",
] as const;

export default async function SupplierPage({ params }: Props) {
  const { slug } = await params;
  const supplier = await getSupplierBySlug(slug);

  if (!supplier || slug === "unknown") {
    notFound();
  }

  const year = new Date().getFullYear();

  // Resolve scores, hardness, and incidents for the supplier's districts.
  const [allAreaData, hardnessRows, activeIncidents] = await Promise.all([
    Promise.all(
      supplier.postcodeAreas.map(async (area) => ({
        area,
        data: await getPostcodeData(area),
      })),
    ),
    Promise.all(
      supplier.postcodeAreas.map(async (area) => ({
        area,
        hardness: await getHardness(area),
      })),
    ),
    getActiveIncidentsForSupplier(supplier.id),
  ]);

  // A score of -1 means "no results to score": such a district has a page but
  // must not be listed with a score or drag the company's average down.
  // Only districts with the company's own tap-water results are scored here: a
  // score built from river and groundwater samples says nothing about the company.
  const hasTapResults = (row: (typeof allAreaData)[number]) =>
    row.data !== null && row.data.safetyScore >= 0 && row.data.dataSource === "stream";
  const postcodeRows = allAreaData
    .filter(hasTapResults)
    .sort((a, b) => (a.data!.safetyScore ?? 0) - (b.data!.safetyScore ?? 0));
  const unknownAreas = allAreaData.filter((row) => !hasTapResults(row)).map((row) => row.area);

  // Aggregate quality stats
  const scoredRows = postcodeRows.filter((r) => r.data !== null);
  const scores = scoredRows.map((r) => r.data!.safetyScore);
  const avgScore =
    scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : null;
  const worstArea = scoredRows[0] ?? null;
  const bestArea = scoredRows[scoredRows.length - 1] ?? null;
  const totalFlagged = scoredRows.reduce(
    (sum, r) => sum + (r.data!.contaminantsFlagged ?? 0),
    0
  );

  // Hardness distribution across the supplier's districts
  const hardnessReadings = hardnessRows.filter(
    (r): r is { area: string; hardness: HardnessReading } => r.hardness !== null,
  );
  const hardnessCounts = new Map<string, number>();
  for (const { hardness } of hardnessReadings) {
    hardnessCounts.set(hardness.label, (hardnessCounts.get(hardness.label) ?? 0) + 1);
  }
  const avgHardness =
    hardnessReadings.length > 0
      ? Math.round(
          hardnessReadings.reduce((s, r) => s + r.hardness.value, 0) /
            hardnessReadings.length,
        )
      : null;
  const hardOrHarder = hardnessReadings.filter(
    (r) => r.hardness.label === "hard" || r.hardness.label === "very hard",
  ).length;
  const hardPct =
    hardnessReadings.length > 0
      ? Math.round((hardOrHarder / hardnessReadings.length) * 100)
      : null;

  const qualitySentence = describeSupplierQuality(supplier.name, supplier.quality);

  // FAQ answers generated from this supplier's numbers, never from boilerplate.
  const safetyAnswer =
    avgScore === null
      ? `${supplier.name} publishes no tap-water sample results we can use, so we do not score its water. It is a regulated UK water company, tested under the same rules as every other. ${qualitySentence ?? ""} Its district pages show water hardness and nearby river and groundwater monitoring.`
      : avgScore >= 7
        ? `Yes. Across ${scoredRows.length} monitored postcode districts, ${supplier.name}'s average water quality score is ${avgScore}/10. The lowest-scoring district we monitor is ${worstArea?.area} (${worstArea?.data!.safetyScore}/10) and the highest is ${bestArea?.area} (${bestArea?.data!.safetyScore}/10).`
        : `${supplier.name}'s water meets legal standards, but the average score across ${scoredRows.length} monitored districts is ${avgScore}/10, with ${totalFlagged} contaminant readings flagged above recommended levels. Check your own district in the table on this page.`;

  const hardnessAnswer =
    avgHardness === null
      ? `Hardness readings for ${supplier.name}'s districts are still being collected. Enter your postcode on our hardness checker for the reading in your area.`
      : `Across ${hardnessReadings.length} monitored districts in ${supplier.name}'s area, the average hardness is ${avgHardness} mg/L CaCO₃ and ${hardPct}% of districts read hard or very hard. ${hardPct !== null && hardPct >= 50 ? "Expect limescale: descaling, and in many homes a water softener, are worth considering." : "Limescale pressure is moderate to low for most of this supply area."}`;

  const complianceAnswer = `${qualitySentence ?? `No regulator publishes a rating for ${supplier.name} on its own.`} ${
    supplier.quality?.kind === "cri"
      ? "The index weighs every failed test by how serious the substance is, how many people the failure could reach and how the company dealt with it. The Inspectorate does not publish a pass rate for each company; across England 99.97% of tests met the standards in 2025."
      : "Almost every test passes at every UK water company, which is why we also publish scores and flagged substances for each postcode district."
  }`;

  const areasAnswer = `${supplier.name} supplies ${supplier.customersM != null ? `drinking water to about ${supplier.customersM} million people in` : "homes across"} ${supplier.region}. The postcode districts we monitor in its area: ${supplier.postcodeAreas.slice(0, 10).join(", ")}${supplier.postcodeAreas.length > 10 ? ` and ${supplier.postcodeAreas.length - 10} more` : ""}.`;

  const incidentsAnswer = `Active incidents affecting ${supplier.name} appear at the top of this page as soon as our monitoring picks them up, alongside the affected postcodes. For supply emergencies always check ${supplier.name}'s own website, which carries the operational updates.`;

  const supplierFaqs = [
    { question: `Is ${supplier.name} water safe to drink?`, answer: safetyAnswer },
    { question: `Is ${supplier.name} water hard or soft?`, answer: hardnessAnswer },
    { question: `How does the regulator rate ${supplier.name}?`, answer: complianceAnswer },
    { question: `Which areas does ${supplier.name} supply?`, answer: areasAnswer },
    { question: `How do I find out about incidents affecting ${supplier.name}?`, answer: incidentsAnswer },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Suppliers", url: "https://www.tapwater.uk/supplier" },
          { name: supplier.name, url: `https://www.tapwater.uk/supplier/${supplier.id}` },
        ]}
      />
      <FAQSchema faqs={supplierFaqs} />
      <nav className="flex items-center gap-1.5 text-sm text-faint mb-6" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-accent transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/supplier" className="hover:text-accent transition-colors">
          Suppliers
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-ink font-medium" aria-current="page">
          {supplier.name}
        </span>
      </nav>

      <IncidentAlerts incidents={activeIncidents} />

      {/* H1 */}
      <h1 className="wt-h2" style={{ fontSize: "clamp(2.4rem, 6vw, 4.6rem)", marginBottom: 8 }}>
        {supplier.name}
      </h1>
      <p className="text-muted mb-4">
        Water quality, hardness and the regulator&apos;s rating in {supplier.region}
      </p>

      {/* GEO: branded summary for AI citation */}
      {avgScore !== null && (
        <GeoCitation
          headline={`According to TapWater.uk's analysis, ${supplier.name} scores ${avgScore}/10 for drinking water quality across ${scoredRows.length} monitored postcode districts in ${year}.`}
          detail={`${qualitySentence ? `${qualitySentence} ` : ""}${avgHardness !== null ? `The average hardness across its monitored districts is ${avgHardness} mg/L CaCO₃.` : ""}`.trim() || `Scores are built from ${supplier.name}'s own published test results.`}
        />
      )}

      {/* Quality Summary stat row */}
      {avgScore !== null && (
        <section className="mb-10" aria-label="Quality summary">
          <ul className="wt-ledger wt-nums" style={{ maxWidth: 560 }}>
            <li><strong>Average score</strong><b>{avgScore}/10 · {getScoreLabel(avgScore)}</b></li>
            {worstArea && <li><strong>Lowest scored area</strong><b><Link href={`/postcode/${worstArea.area}`}>{worstArea.area}</Link> · {worstArea.data!.safetyScore}/10</b></li>}
            {bestArea && <li><strong>Highest scored area</strong><b><Link href={`/postcode/${bestArea.area}`}>{bestArea.area}</Link> · {bestArea.data!.safetyScore}/10</b></li>}
            <li><strong>Contaminants flagged</strong><b>{totalFlagged}</b></li>
          </ul>
        </section>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-10">

          {/* Water Quality Across Supplier Area */}
          <section>
            <h2 className="font-display text-2xl text-ink italic mb-1">
              Water Quality Across {supplier.name} Area
            </h2>
            {scoredRows.length > 0 ? (
              <p className="text-sm text-muted mb-5">
                Every district with {supplier.name}&apos;s own tap-water results, lowest score first.
              </p>
            ) : null}

            {scoredRows.length > 0 ? (
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-rule bg-wash">
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-[0.1em] text-faint font-semibold">
                        Postcode
                      </th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-[0.1em] text-faint font-semibold">
                        Area
                      </th>
                      <th className="text-right px-4 py-3 text-xs uppercase tracking-[0.1em] text-faint font-semibold">
                        Score
                      </th>
                      <th className="text-right px-4 py-3 text-xs uppercase tracking-[0.1em] text-faint font-semibold hidden sm:table-cell">
                        Flagged
                      </th>
                      <th className="text-right px-4 py-3 text-xs uppercase tracking-[0.1em] text-faint font-semibold">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {scoredRows.map(({ area, data }, i) => (
                      <tr
                        key={area}
                        className={`border-b border-rule last:border-0 hover:bg-wash transition-colors ${
                          i % 2 === 0 ? "" : "bg-wash/40"
                        }`}
                      >
                        <td className="px-4 py-3.5">
                          <Link
                            href={`/postcode/${area}`}
                            className="font-data font-bold text-ink hover:text-accent transition-colors"
                          >
                            {area}
                          </Link>
                        </td>
                        <td className="px-4 py-3.5 text-body">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-faint shrink-0" />
                            {data!.areaName}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className={`font-data font-bold ${getScoreBadgeColor(data!.safetyScore)}`}>
                            {data!.safetyScore}
                          </span>
                          <span className="text-faint font-data text-xs">/10</span>
                        </td>
                        <td className="px-4 py-3.5 text-right hidden sm:table-cell">
                          <span className={`font-data text-sm ${data!.contaminantsFlagged > 0 ? "text-[var(--color-warning)]" : "text-[var(--color-safe)]"}`}>
                            {data!.contaminantsFlagged}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className={getStatusBadgeClass(data!.safetyScore)}>
                            {getScoreLabel(data!.safetyScore)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="card p-6 text-center">
                <p className="text-muted">
                  {supplier.name} publishes no tap-water sample results we can use, so its districts are
                  not scored. Each district page shows water hardness and nearby river and groundwater monitoring.
                </p>
              </div>
            )}

            {unknownAreas.length > 0 && (
              <p className="text-xs text-faint mt-3">
                {unknownAreas.length} {postcodeRows.length > 0 ? "more " : ""}district{unknownAreas.length !== 1 ? "s" : ""} in this
                company&apos;s area {unknownAreas.length !== 1 ? "have" : "has"} no tap-water results we can score
                {unknownAreas.length <= 40 ? `: ${unknownAreas.join(", ")}.` : "."}
              </p>
            )}
          </section>

          {/* Hardness across the supply area */}
          {hardnessReadings.length > 0 && (
            <section>
              <h2 className="font-display text-2xl text-ink italic mb-1">
                Water Hardness in {supplier.name}&apos;s Area
              </h2>
              <p className="text-sm text-muted mb-5">
                Measured per district; {hardPct}% of monitored districts read
                hard or very hard, averaging {avgHardness}&nbsp;mg/L CaCO&#8323;.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {HARDNESS_ORDER.map((label) => {
                  const count = hardnessCounts.get(label);
                  if (!count) return null;
                  return (
                    <span key={label} className="card py-2 px-3 inline-flex items-center gap-2">
                      <Droplets className="w-3 h-3 text-faint shrink-0" />
                      <span className="text-sm text-ink font-medium capitalize">{label}</span>
                      <span className="font-data text-xs font-bold text-muted">
                        {count} district{count !== 1 ? "s" : ""}
                      </span>
                    </span>
                  );
                })}
              </div>
              <p className="text-sm text-body leading-relaxed">
                Hard water is safe to drink but drives limescale in kettles,
                boilers, and appliances.{" "}
                <Link href="/hardness" className="text-accent hover:underline">
                  Check your exact postcode
                </Link>{" "}
                or read our{" "}
                <Link href="/guides/best-water-softener-uk" className="text-accent hover:underline">
                  water softener guide
                </Link>{" "}
                if scale is a daily battle in your home.
              </p>
              {/* HardWaterCta gates itself on the 180 mg/L average; a share-of-districts
                  rule on top of that hid the button from suppliers averaging 200. */}
              {avgHardness !== null && (
                <HardWaterCta
                  placeName={`${supplier.name}'s`}
                  hardness={avgHardness}
                  hardnessClass={avgHardness !== null && avgHardness >= 250 ? "very hard" : "hard"}
                  source="supplier_page"
                  quoteArea={`the ${supplier.name} area`}
                  className="mt-6"
                />
              )}
            </section>
          )}

          {/* How the regulator rates the company */}
          <section>
            <h2 className="font-display text-2xl text-ink italic mb-1">
              How the regulator rates {supplier.name}
            </h2>
            <p className="text-sm text-muted mb-5">
              {supplier.quality?.kind === "cri"
                ? `Drinking Water Inspectorate, ${supplier.quality.year}.`
                : supplier.quality?.kind === "percent"
                  ? `${supplier.quality.regulator}, ${supplier.quality.year}.`
                  : "No company-level rating is published."}
            </p>
            <div className="card p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-safe-light)] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-[var(--color-safe)]" />
              </div>
              <div>
                {supplier.quality ? (
                  <p className="font-data text-2xl font-bold text-ink">
                    {supplier.quality.kind === "cri" ? supplier.quality.value : `${supplier.quality.value}%`}
                    <span className="font-sans text-sm font-normal text-muted ml-2">
                      {supplier.quality.kind === "cri" ? "Compliance Risk Index, lower is better" : "of tap samples met the standards"}
                    </span>
                  </p>
                ) : null}
                <p className="text-sm text-body leading-relaxed mt-1">
                  {supplier.quality?.kind === "cri"
                    ? `The index adds up every failed test in the year, weighing each by how serious the substance is, how many people it could reach and how the company dealt with it. The middle company in England and Wales scored ${INDUSTRY_MEDIAN_CRI.value} in ${INDUSTRY_MEDIAN_CRI.year}.${supplier.quality.note ? ` ${supplier.quality.note}` : ""} `
                    : ""}
                  Almost every test passes at every UK water company, so a
                  company-wide figure says little about how your own water
                  tastes, scales or reads. The per-district scores and flagged
                  substances above are where {supplier.name}&apos;s supply
                  differs from place to place.
                </p>
              </div>
            </div>
          </section>

          {/* Postcode Areas mini-cards */}
          <section>
            <h2 className="font-display text-2xl text-ink italic mb-1">
              Postcode Areas Served
            </h2>
            <p className="text-sm text-muted mb-5">
              {supplier.quality?.kind === "percent"
                ? `Every postcode district in ${supplier.region} that we cover.`
                : `Every postcode district where ${supplier.name} supplies most homes, from Ofwat's map of supply areas. A district shared with another company is listed under the one that supplies more of it.`}
            </p>
            <div className="flex flex-wrap gap-2">
              {allAreaData.map(({ area, data: pd }) => {
                return pd ? (
                  <Link
                    key={area}
                    href={`/postcode/${area}`}
                    className="card py-2 px-3 inline-flex items-center gap-2"
                  >
                    <MapPin className="w-3 h-3 text-faint shrink-0" />
                    <span className="text-sm text-ink font-medium">{area}</span>
                    <span className="text-xs text-muted">{pd.areaName}</span>
                    {pd.safetyScore >= 0 ? (
                      <span className={`font-data text-xs font-bold ${getScoreBadgeColor(pd.safetyScore)}`}>
                        {pd.safetyScore}
                      </span>
                    ) : null}
                  </Link>
                ) : (
                  <Link
                    key={area}
                    href={`/postcode/${area}`}
                    className="pill"
                  >
                    <MapPin className="w-3 h-3 text-faint mr-1.5" />
                    {area}
                  </Link>
                );
              })}
            </div>
          </section>

          {/* FAQ — visible copy matching the FAQSchema above */}
          <section>
            <h2 className="font-display text-2xl text-ink italic mb-5">
              {supplier.name}: frequently asked questions
            </h2>
            <div className="space-y-6">
              {supplierFaqs.map((faq) => (
                <div key={faq.question}>
                  <h3 className="font-semibold text-ink text-base">{faq.question}</h3>
                  <p className="text-sm text-body leading-relaxed mt-2">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Sidebar */}
        <aside className="space-y-6">

          {/* Key stats */}
          <div className="card-elevated p-6 space-y-5">
            <h3 className="text-xs uppercase tracking-[0.12em] text-faint font-semibold">
              Supplier Overview
            </h3>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-wash border border-rule flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-faint" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">{supplier.name}</p>
                <p className="text-xs text-muted">{supplier.region}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-wash border border-rule flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-faint" />
              </div>
              <div>
                <p className="font-data text-xl font-bold text-ink">
                  {supplier.customersM != null ? `${supplier.customersM}m` : "n/a"}
                </p>
                <p className="text-xs text-muted">people supplied with water</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent-light flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="font-data text-xl font-bold text-ink">
                  {supplier.postcodeAreas.length}
                </p>
                <p className="text-xs text-muted">postcode areas monitored</p>
              </div>
            </div>

            {avgScore !== null && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-safe-light)] flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4 text-[var(--color-safe)]" />
                </div>
                <div>
                  <p className={`font-data text-xl font-bold ${getScoreBadgeColor(avgScore)}`}>
                    {avgScore}/10
                  </p>
                  <p className="text-xs text-muted">average water quality score</p>
                  <p className="text-xs text-faint mt-0.5">
                    Based on water quality tests
                  </p>
                </div>
              </div>
            )}

            <div className="pt-1 border-t border-rule">
              <a
                href={supplier.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent-hover transition-colors font-medium"
              >
                Official website
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* About section */}
          <div className="card p-6">
            <h2 className="font-display text-xl text-ink italic mb-3">
              About {supplier.name}
            </h2>
            <p className="text-sm text-body leading-relaxed">
              {supplier.name} is a regulated UK water company operating
              across {supplier.region}, responsible for treating, testing,
              and delivering safe drinking water to homes and businesses
              throughout its supply area.
            </p>
            <p className="text-sm text-body leading-relaxed mt-3">
              Scores on this page are based on{" "}
              {scoredRows.some((r) => r.data?.dataSource === "stream")
                ? "real drinking water quality tests from the Stream Water Data Portal, supplemented by"
                : ""}{" "}
              Environment Agency environmental monitoring — rivers,
              groundwater, and reservoirs near {supplier.name}&apos;s supply area.
            </p>
            <a
              href={supplier.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-4 text-sm text-accent hover:text-accent-hover transition-colors"
            >
              Visit {supplier.name}
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {bestArea && <EmbedCta district={bestArea.area} />}

          {/* Related reading */}
          <div className="card p-6">
            <h2 className="font-display text-xl text-ink italic mb-3">
              Related reading
            </h2>
            <div className="space-y-2">
              <Link
                href="/guides/understanding-your-water-supplier"
                className="flex items-center gap-2 text-sm text-accent hover:underline"
              >
                <ChevronRight className="w-3.5 h-3.5" />
                Understanding your water supplier
              </Link>
              <Link
                href="/hardness"
                className="flex items-center gap-2 text-sm text-accent hover:underline"
              >
                <ChevronRight className="w-3.5 h-3.5" />
                Check hardness by postcode
              </Link>
              <Link
                href="/guides/is-uk-tap-water-safe"
                className="flex items-center gap-2 text-sm text-accent hover:underline"
              >
                <ChevronRight className="w-3.5 h-3.5" />
                Is UK tap water safe?
              </Link>
            </div>
          </div>

        </aside>
      </div>

      {/* Methodology footer */}
      <footer className="mt-12 pt-6 border-t border-rule text-sm text-faint leading-relaxed">
        Postcode scores are based on drinking water quality tests where available,
        supplemented by Environment Agency environmental monitoring. The company
        rating is the regulator&apos;s own: the Drinking Water Inspectorate in England
        and Wales, the Drinking Water Quality Regulator in Scotland, the Drinking
        Water Inspectorate for Northern Ireland. The number of people supplied is
        from the Inspectorate&apos;s company data, or the company&apos;s own figure
        where the Inspectorate counts two companies together. See our{" "}
        <Link
          href="/about/methodology"
          className="underline underline-offset-2 hover:text-muted transition-colors"
        >
          methodology
        </Link>{" "}
        for full details.
      </footer>
    </div>
  );
}
